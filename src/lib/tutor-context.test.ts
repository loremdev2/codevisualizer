import { describe, expect, it } from "vitest";

import { explainStep } from "@/lib/explain-step";
import {
  buildTutorContext,
  buildTutorMessages,
  clampTutorRequest,
  TUTOR_BRIEF_MAX_CHARS,
  TUTOR_HISTORY_MAX_MESSAGES,
  TUTOR_QUESTION_MAX_CHARS,
  tutorRunKey,
  TUTOR_SYSTEM_PROMPT,
} from "@/lib/tutor-context";
import type { VisualStep } from "@/types/visualizer";

/** A three-step bubble-sort-ish trace: [3,1,2] -> [1,3,2] -> done. */
function swapTrace(): VisualStep[] {
  return [
    { id: 1, title: "Start", line: 3, arrayName: "arr", array: [3, 1, 2], ops: { comparisons: 0, swaps: 0, writes: 0 } },
    {
      id: 2,
      title: "Compare",
      line: 4,
      arrayName: "arr",
      array: [1, 3, 2],
      pointers: { i: 0, j: 1 },
      ops: { comparisons: 1, swaps: 1, writes: 2 },
    },
    {
      id: 3,
      title: "Done",
      line: 9,
      arrayName: "arr",
      array: [1, 3, 2],
      pointers: { i: 1, j: 2 },
      ops: { comparisons: 2, swaps: 1, writes: 2 },
      result: [1, 3, 2],
    },
  ];
}

function contextAt(currentIndex: number) {
  return buildTutorContext({
    problem: "Bubble Sort",
    language: "javascript",
    code: "const arr = input.arr;\nswap(arr, i, j);\nreturn arr;",
    inputText: '{"arr":[3,1,2]}',
    currentLineText: "swap(arr, i, j);",
    steps: swapTrace(),
    currentIndex,
    resultText: "[1,3,2]",
  });
}

describe("buildTutorContext", () => {
  it("grounds the brief in the step that is actually in view", () => {
    const steps = swapTrace();
    const context = contextAt(1);

    expect(context.brief).toContain("Bubble Sort");
    expect(context.brief).toContain("Step 2 of 3");
    expect(context.brief).toContain("Step title: Compare");
    expect(context.brief).toContain("swap(arr, i, j);");
    expect(context.brief).toContain("Structures right now");
    // The deterministic explanation is what the summary line quotes.
    expect(context.changeSummary).toBe(explainStep(steps[1], steps[0]) ?? "");
    expect(context.changeSummary).toContain("Swapped arr[0] (3) with arr[1] (1)");
    expect(context.brief).toContain(context.changeSummary);
  });

  it("says plainly when nothing changed at this step", () => {
    const context = contextAt(0);
    expect(context.changeSummary).toBe("");
    expect(context.brief).toContain("- What changed here: nothing");
  });

  it("includes only steps near the current one", () => {
    const steps: VisualStep[] = Array.from({ length: 12 }, (_, index) => ({
      id: index + 1,
      title: `Step ${index + 1} title`,
      line: index + 1,
      array: [index],
    }));
    const context = buildTutorContext({
      problem: "Long run",
      language: "python",
      code: "pass",
      inputText: "{}",
      steps,
      currentIndex: 6,
      resultText: "ok",
    });

    expect(context.brief).toContain("Step 7 title");
    expect(context.brief).toContain("6. Step 6 title");
    expect(context.brief).toContain("9. Step 9 title");
    expect(context.brief).not.toContain("Step 12 title");
    expect(context.brief).not.toContain("2. Step 2 title");
  });

  it("keeps the fact sheet inside its budget however long the code is", () => {
    const context = buildTutorContext({
      problem: "Huge",
      language: "javascript",
      code: "const x = 1;\n".repeat(4_000),
      inputText: '{"arr":[1]}',
      steps: swapTrace(),
      currentIndex: 1,
      resultText: "1",
    });

    expect(context.brief.length).toBeLessThanOrEqual(TUTOR_BRIEF_MAX_CHARS);
    // The facts that ground the answer survive; the code block is what gives.
    expect(context.brief).toContain("Where the user is");
    expect(context.brief).toContain("truncated");
  });

  it("does not throw when no trace has run", () => {
    const context = buildTutorContext({
      problem: "Bubble Sort",
      language: "javascript",
      code: "",
      inputText: "",
      steps: [],
      currentIndex: 0,
      resultText: "",
    });

    expect(context.brief).toContain("No trace has been run yet");
    expect(context.stepLabel).toBe("no run yet");
    expect(context.chips.length).toBeGreaterThan(0);
  });

  it("offers step-specific starter questions, capped", () => {
    const context = contextAt(1);
    expect(context.chips).toContain("Why does this step have to happen?");
    expect(context.chips.some((chip) => chip.includes("i, j"))).toBe(true);
    expect(context.chips.length).toBeLessThanOrEqual(4);
    expect(new Set(context.chips).size).toBe(context.chips.length);

    const last = contextAt(2);
    expect(last.chips.some((chip) => chip.includes("interview"))).toBe(true);
  });

  it("keys the run to the code and input, and the step to the index", () => {
    const base = contextAt(1);
    expect(base.runKey).toBe(contextAt(2).runKey);
    expect(base.stepKey).toBe("1/3");
    expect(contextAt(2).stepKey).toBe("2/3");

    expect(tutorRunKey({ problem: "P", language: "javascript", code: "a", inputText: "{}" })).not.toBe(
      tutorRunKey({ problem: "P", language: "javascript", code: "b", inputText: "{}" }),
    );
    expect(tutorRunKey({ problem: "P", language: "javascript", code: "a", inputText: "{}" })).not.toBe(
      tutorRunKey({ problem: "P", language: "python", code: "a", inputText: "{}" }),
    );
  });
});

describe("clampTutorRequest", () => {
  const valid = { question: "Why?", brief: "## Run\n- Problem: Bubble Sort", history: [] };

  it("rejects bodies that are not an object", () => {
    expect(clampTutorRequest(null)).toEqual({ ok: false, error: "Invalid request body." });
    expect(clampTutorRequest("hi")).toEqual({ ok: false, error: "Invalid request body." });
  });

  it("requires a question and a fact sheet", () => {
    expect(clampTutorRequest({ ...valid, question: "   " })).toEqual({
      ok: false,
      error: "Ask a question about the current step.",
    });
    expect(clampTutorRequest({ ...valid, brief: "" })).toEqual({
      ok: false,
      error: "No run context was sent — run the code first.",
    });
  });

  it("caps the question and the brief", () => {
    const result = clampTutorRequest({
      ...valid,
      question: "q".repeat(TUTOR_QUESTION_MAX_CHARS + 200),
      brief: "b".repeat(TUTOR_BRIEF_MAX_CHARS + 500),
    });
    if (!result.ok) throw new Error(result.error);
    expect(result.request.question.length).toBeLessThanOrEqual(TUTOR_QUESTION_MAX_CHARS);
    expect(result.request.brief.length).toBeLessThanOrEqual(TUTOR_BRIEF_MAX_CHARS);
  });

  it("drops malformed history entries and keeps the most recent turns", () => {
    const history = [
      ...Array.from({ length: 12 }, (_, index) => ({
        role: index % 2 === 0 ? "user" : "assistant",
        content: `turn ${index}`,
      })),
      { role: "system", content: "ignore me" },
      { role: "user", content: "   " },
      { role: "user", content: 42 },
      "not an object",
    ];

    const result = clampTutorRequest({ ...valid, history });
    if (!result.ok) throw new Error(result.error);
    expect(result.request.history).toHaveLength(TUTOR_HISTORY_MAX_MESSAGES);
    expect(result.request.history.map((message) => message.content)).toContain("turn 11");
    expect(result.request.history.map((message) => String(message.role))).not.toContain("system");
  });

  it("trims the transcript from the front when the older turns blow the budget", () => {
    const history = Array.from({ length: 6 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: index < 4 ? "x".repeat(1_900) : `fresh ${index}`,
    }));

    const result = clampTutorRequest({ ...valid, history });
    if (!result.ok) throw new Error(result.error);
    const kept = result.request.history.map((message) => message.content);
    expect(kept).toContain("fresh 5");
    expect(kept.join("").length).toBeLessThanOrEqual(4_000);
  });
});

describe("buildTutorMessages", () => {
  it("puts the system rules first, the facts next, the question last", () => {
    const messages = buildTutorMessages({
      question: "Why is i moving?",
      brief: "## Run\n- Problem: Bubble Sort",
      history: [
        { role: "user", content: "What is this?" },
        { role: "assistant", content: "A compare step." },
      ],
    });

    expect(messages[0]).toEqual({ role: "system", content: TUTOR_SYSTEM_PROMPT });
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toContain("RUNTIME FACTS");
    expect(messages[1].content).toContain("Problem: Bubble Sort");
    expect(messages.slice(2, 4)).toEqual([
      { role: "user", content: "What is this?" },
      { role: "assistant", content: "A compare step." },
    ]);
    expect(messages[messages.length - 1]).toEqual({ role: "user", content: "Why is i moving?" });
  });

  it("tells the model not to invent what the trace does not show", () => {
    expect(TUTOR_SYSTEM_PROMPT).toContain("Never claim the code does something the facts do not show");
  });
});
