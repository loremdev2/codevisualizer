import { explainStep } from "@/lib/explain-step";
import type { VisualStep } from "@/types/visualizer";

// ---------------------------------------------------------------------------
// Step tutor: the fact sheet an answer is allowed to be based on.
//
// The tutor's premise is that it explains the trace that actually ran, not a
// plausible-looking algorithm. So the prompt carries no user prose as "facts" —
// it carries this sheet, rebuilt from the VisualStep stream on every turn.
// Everything in it is deterministic (explainStep, the ops counters, a bounded
// step window), which keeps answers grounded and easy to review.
//
// Pure and framework-free on purpose: vitest runs in a node environment with no
// jsdom, so this module is the testable seam and the panel stays thin (same
// split as video-controls.ts).
// ---------------------------------------------------------------------------

/** Hard cap on the whole fact sheet, in characters. */
export const TUTOR_BRIEF_MAX_CHARS = 6_000;
export const TUTOR_CODE_MAX_CHARS = 2_400;
export const TUTOR_INPUT_MAX_CHARS = 400;
export const TUTOR_SNAPSHOT_MAX_CHARS = 1_200;
/** How many steps either side of the current one to include. */
export const TUTOR_STEP_RADIUS = 2;
export const TUTOR_QUESTION_MAX_CHARS = 500;
export const TUTOR_HISTORY_MAX_MESSAGES = 8;
export const TUTOR_HISTORY_MESSAGE_MAX_CHARS = 2_000;
export const TUTOR_HISTORY_MAX_CHARS = 4_000;
/** Starter questions offered before the first turn. */
export const TUTOR_CHIP_LIMIT = 4;

export type TutorContextInput = {
  /** Problem or template name — what the user thinks they are looking at. */
  problem: string;
  language: string;
  code: string;
  inputText: string;
  /** Source text of the line the current step is executing, when known. */
  currentLineText?: string;
  steps: VisualStep[];
  currentIndex: number;
  resultText: string;
};

export type TutorContext = {
  /** The bounded fact sheet injected into the prompt, as plain text. */
  brief: string;
  /**
   * Identity of (problem + language + code + input). The panel keys off this,
   * so a new run starts a fresh thread while stepping keeps the conversation.
   */
  runKey: string;
  /** Identity of the step in view: `${index}/${total}`. */
  stepKey: string;
  /** Human label for the panel header, e.g. "step 12 of 240". */
  stepLabel: string;
  /** Deterministic description of what changed at this step ("" when nothing did). */
  changeSummary: string;
  /** Starter questions grounded in this step. */
  chips: string[];
};

export type TutorHistoryMessage = { role: "user" | "assistant"; content: string };
export type TutorRequest = {
  question: string;
  brief: string;
  history: TutorHistoryMessage[];
};
export type TutorMessage = { role: "system" | "user" | "assistant"; content: string };

export type ClampTutorRequestResult =
  | { ok: true; request: TutorRequest }
  | { ok: false; error: string };

/** Step fields worth showing the model, in reading order. */
const SNAPSHOT_FIELDS = [
  "arrayName",
  "array",
  "active",
  "sorted",
  "pivot",
  "range",
  "window",
  "stringName",
  "string",
  "hashMapName",
  "hashMap",
  "setName",
  "set",
  "matrixName",
  "matrix",
  "activeCell",
  "changedCells",
  "graphName",
  "graph",
  "activeNode",
  "graphPath",
  "stack",
  "queue",
  "visited",
  "frontier",
  "heap",
  "pointers",
  "linkedList",
  "tree",
  "dpTableName",
  "dpTable",
  "dpActiveCell",
  "dpDependencies",
  "dpArrayName",
  "dpArray",
  "dpActiveIndex",
  "memoTableName",
  "memoTable",
  "recursionTree",
  "phase",
  "result",
  "ops",
] as const;

/** Deterministic 32-bit FNV-1a hash — cache-key only, never security. */
function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const TRUNCATION_MARKER = " …[truncated]";

/** Trims to at most `maxChars`, marker included, so callers can rely on the cap. */
function truncate(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  if (maxChars <= TRUNCATION_MARKER.length) return trimmed.slice(0, Math.max(maxChars, 0));
  const kept = trimmed.slice(0, maxChars - TRUNCATION_MARKER.length).trimEnd();
  return `${kept}${TRUNCATION_MARKER}`;
}

/** Identity of a run — changes when the code, input, language, or problem does. */
export function tutorRunKey(input: {
  problem: string;
  language: string;
  code: string;
  inputText: string;
}): string {
  return [
    stableHash(input.problem),
    stableHash(input.language),
    stableHash(input.code),
    stableHash(input.inputText),
    input.code.length,
    input.inputText.length,
  ].join("-");
}

function oneLineStep(step: VisualStep, previous: VisualStep | undefined, index: number): string {
  const label = step.title ?? step.phase ?? `Step ${index + 1}`;
  const change = explainStep(step, previous);
  const note = step.note && step.note !== change ? step.note : null;
  const detail = [change, note].filter(Boolean).join(" · ");
  return detail ? `${index + 1}. ${label} — ${detail}` : `${index + 1}. ${label}`;
}

/** Compact JSON of the structure fields the model may reason about. */
function structureSnapshot(step: VisualStep | undefined): string {
  if (!step) return "unavailable";
  const picked: Record<string, unknown> = {};
  for (const field of SNAPSHOT_FIELDS) {
    const value = (step as Record<string, unknown>)[field];
    if (value !== undefined) picked[field] = value;
  }
  let json: string;
  try {
    json = JSON.stringify(picked);
  } catch {
    return "unavailable (not serializable)";
  }
  return truncate(json, TUTOR_SNAPSHOT_MAX_CHARS);
}

function pointerNames(step: VisualStep | undefined): string[] {
  if (!step?.pointers) return [];
  return Object.keys(step.pointers).slice(0, 3);
}

/** Starter questions derived from what this specific step actually shows. */
export function tutorChips(args: {
  changeSummary: string;
  step: VisualStep | undefined;
  isFirst: boolean;
  isLast: boolean;
}): string[] {
  const chips = new Set<string>();
  chips.add("What is this step doing, in plain English?");
  if (args.changeSummary) chips.add("Why does this step have to happen?");
  const names = pointerNames(args.step);
  if (names.length > 0) {
    chips.add(`What do the pointers ${names.join(", ")} point at right now?`);
  }
  // Position beats complexity for the last slot: where you are in the run is
  // more step-specific than a generic complexity question.
  if (args.isLast) {
    chips.add("How would I explain this solution in an interview?");
  } else if (!args.isFirst) {
    chips.add("What will the next step most likely be?");
  }
  if (args.step?.ops) chips.add("Is this the worst case, and what's the time complexity so far?");
  return Array.from(chips).slice(0, TUTOR_CHIP_LIMIT);
}

export function buildTutorContext(input: TutorContextInput): TutorContext {
  const total = input.steps.length;
  const currentIndex = total === 0 ? 0 : Math.min(Math.max(input.currentIndex, 0), total - 1);
  const currentStep = input.steps[currentIndex];
  const previousStep = currentIndex > 0 ? input.steps[currentIndex - 1] : undefined;
  const changeSummary = explainStep(currentStep, previousStep) ?? "";

  const sections: string[] = [];

  sections.push(
    [
      "## Run",
      `- Problem: ${input.problem || "Untitled"}`,
      `- Language: ${input.language}`,
      `- Input: ${truncate(input.inputText, TUTOR_INPUT_MAX_CHARS) || "(none)"}`,
      `- Total steps: ${total}`,
      `- Final result: ${truncate(input.resultText, 200) || "(not run yet)"}`,
    ].join("\n"),
  );

  if (currentStep) {
    sections.push(
      [
        "## Where the user is",
        `- Step ${currentIndex + 1} of ${total}`,
        `- Step title: ${currentStep.title ?? "(untitled)"}`,
        currentStep.line !== undefined
          ? `- Executing line ${currentStep.line}: ${truncate(input.currentLineText ?? "(source unavailable)", 200)}`
          : "- Line: unknown",
        changeSummary ? `- What changed here: ${changeSummary}` : "- What changed here: nothing",
        currentStep.note ? `- Runner note: ${truncate(currentStep.note, 300)}` : null,
        `- Structures right now: ${structureSnapshot(currentStep)}`,
        currentStep.ops
          ? `- Counters so far: ${currentStep.ops.comparisons} comparisons, ${currentStep.ops.swaps} swaps, ${currentStep.ops.writes} writes`
          : null,
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
    );

    const from = Math.max(currentIndex - TUTOR_STEP_RADIUS, 0);
    const to = Math.min(currentIndex + TUTOR_STEP_RADIUS, total - 1);
    const window: string[] = [];
    for (let index = from; index <= to; index++) {
      const marker = index === currentIndex ? " <-- current" : "";
      window.push(`${oneLineStep(input.steps[index], input.steps[index - 1], index)}${marker}`);
    }
    sections.push(`## Nearby steps\n${window.join("\n")}`);
  } else {
    sections.push("## Where the user is\n- No trace has been run yet.");
  }

  sections.push(
    `## Code (${input.language})\n\`\`\`\n${truncate(input.code, TUTOR_CODE_MAX_CHARS)}\n\`\`\``,
  );

  // Append whole sections while they fit, so a pathologically long code block
  // shortens the code instead of dropping the facts that ground the answer.
  let brief = "";
  for (const section of sections) {
    const separator = brief ? "\n\n" : "";
    const remaining = TUTOR_BRIEF_MAX_CHARS - brief.length - separator.length;
    if (remaining <= 0) break;
    if (section.length <= remaining) {
      brief = `${brief}${separator}${section}`;
      continue;
    }
    // Too little room left to say anything useful — drop the rest.
    if (remaining < 40) break;
    brief = `${brief}${separator}${truncate(section, remaining)}`;
    break;
  }

  return {
    brief,
    runKey: tutorRunKey(input),
    stepKey: `${currentIndex}/${total}`,
    stepLabel: total === 0 ? "no run yet" : `step ${currentIndex + 1} of ${total}`,
    changeSummary,
    chips: tutorChips({
      changeSummary,
      step: currentStep,
      isFirst: currentIndex === 0,
      isLast: total === 0 || currentIndex === total - 1,
    }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Validates and bounds a client request. The panel sends the fact sheet it
 * built; the route never trusts its size or shape, so a hand-rolled request
 * can't push an unbounded prompt at the model.
 */
export function clampTutorRequest(raw: unknown): ClampTutorRequestResult {
  if (!isRecord(raw)) return { ok: false, error: "Invalid request body." };

  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  if (!question) return { ok: false, error: "Ask a question about the current step." };

  const brief = typeof raw.brief === "string" ? raw.brief.trim() : "";
  if (!brief) {
    return { ok: false, error: "No run context was sent — run the code first." };
  }

  const history: TutorHistoryMessage[] = [];
  if (Array.isArray(raw.history)) {
    for (const entry of raw.history) {
      if (!isRecord(entry)) continue;
      const role = entry.role;
      const content = entry.content;
      if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
      const trimmed = content.trim();
      if (!trimmed) continue;
      history.push({ role, content: truncate(trimmed, TUTOR_HISTORY_MESSAGE_MAX_CHARS) });
    }
  }

  // Keep the most recent turns, then drop from the front until the whole
  // transcript fits — recent turns are what a follow-up question depends on.
  const recent = history.slice(-TUTOR_HISTORY_MAX_MESSAGES);
  let total = recent.reduce((sum, message) => sum + message.content.length, 0);
  while (recent.length > 0 && total > TUTOR_HISTORY_MAX_CHARS) {
    const dropped = recent.shift();
    total -= dropped?.content.length ?? 0;
  }

  return {
    ok: true,
    request: {
      question: truncate(question, TUTOR_QUESTION_MAX_CHARS),
      brief: truncate(brief, TUTOR_BRIEF_MAX_CHARS),
      history: recent,
    },
  };
}

export const TUTOR_SYSTEM_PROMPT = `You are a patient algorithms tutor inside DSA Lab, a step-by-step code visualizer. You explain the run the user is looking at.

GROUND TRUTH
- The RUNTIME FACTS block describes a trace that really ran. It is authoritative: the current step, what changed, the structures, and the operation counters all come from the runner.
- Never claim the code does something the facts do not show. If a question cannot be answered from the facts, say exactly what is missing and ask the user to run the trace or step somewhere else.
- Never invent values. Read them from the facts.

HOW TO ANSWER
- Lead with the direct answer in one or two sentences, then the reasoning.
- Anchor the explanation to the current step and its line, and use the user's own variable names.
- Prefer plain language over jargon; when you use a term (invariant, pivot, window), define it in the same sentence.
- For complexity questions, reason from the counters and the loop structure you can see, and say when the input is too small to prove a bound.
- Keep answers under about 180 words unless the user asks for more depth. Plain text with short paragraphs and inline code in backticks; no headings or tables.
- This is a learning tool. If the user asks for the whole solution to a practice problem, give the next useful hint and ask what they have tried before revealing everything.`;

export function buildTutorMessages(request: TutorRequest): TutorMessage[] {
  return [
    { role: "system", content: TUTOR_SYSTEM_PROMPT },
    { role: "user", content: `RUNTIME FACTS\n${request.brief}` },
    ...request.history.map((message) => ({ role: message.role, content: message.content })),
    { role: "user", content: request.question },
  ];
}
