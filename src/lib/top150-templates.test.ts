import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { top150BruteFor, top150Brutes } from "./top150-brutes";
import { top150MultiLang } from "./top150-multilang";
import { top150QuestionByNo } from "./top150";
import {
  top150CodeFor,
  top150LanguagesFor,
  top150Templates,
  top150TemplateFromId,
  top150TemplateId,
} from "./top150-templates";
import { buildPythonHarness, detectPythonEntry } from "./trace/leetcode";
import { runTraceInNode } from "./trace-runner";

describe("Top Interview 150 templates", () => {
  const entries = Object.values(top150Templates);

  it("every template's number exists in the question bank", () => {
    for (const entry of entries) {
      expect(top150QuestionByNo(entry.no), `#${entry.no}`).toBeDefined();
    }
  });

  it("every template traces successfully and matches its expected result", async () => {
    const failures: string[] = [];
    for (const entry of entries) {
      const message = await runTraceInNode(entry.code, JSON.stringify(entry.input));
      if (!message.ok) {
        failures.push(`#${entry.no}: trace failed — ${message.error}`);
        continue;
      }
      if ((message.steps?.length ?? 0) === 0) {
        failures.push(`#${entry.no}: trace produced no steps`);
        continue;
      }
      if (entry.expected !== undefined && JSON.stringify(message.result) !== JSON.stringify(entry.expected)) {
        failures.push(
          `#${entry.no}: got ${JSON.stringify(message.result)}, expected ${JSON.stringify(entry.expected)}`,
        );
      }
    }
    expect(failures).toEqual([]);
  });

  it("every brute-force variant traces successfully and matches its expected result", async () => {
    const failures: string[] = [];
    for (const [no, code] of Object.entries(top150Brutes)) {
      if (!code) continue;
      const entry = top150Templates[Number(no)];
      const message = await runTraceInNode(code, JSON.stringify(entry.input));
      if (!message.ok) {
        failures.push(`#${no}: brute trace failed — ${message.error}`);
        continue;
      }
      if ((message.steps?.length ?? 0) === 0) {
        failures.push(`#${no}: brute trace produced no steps`);
        continue;
      }
      if (entry.expected !== undefined && JSON.stringify(message.result) !== JSON.stringify(entry.expected)) {
        failures.push(
          `#${no}: brute got ${JSON.stringify(message.result)}, expected ${JSON.stringify(entry.expected)}`,
        );
      }
    }
    expect(failures).toEqual([]);
  });

  it("every brute variant belongs to a traced template", () => {
    for (const no of Object.keys(top150Brutes)) {
      expect(top150Templates[Number(no)], `#${no} has no optimal template`).toBeDefined();
    }
  });

  it("every TypeScript variant traces successfully and matches its expected result", async () => {
    const failures: string[] = [];
    for (const [no, languages] of Object.entries(top150MultiLang)) {
      if (!languages) continue;
      const entry = top150Templates[Number(no)];
      const variants: Array<[string, string | undefined]> = [
        ["typescriptCode", languages.typescriptCode],
        ["bruteTypeScriptCode", languages.bruteTypeScriptCode],
      ];
      for (const [field, code] of variants) {
        if (!code) continue;
        const message = await runTraceInNode(code, JSON.stringify(entry.input), { typescript: true });
        if (!message.ok) {
          failures.push(`#${entry.no} ${field}: trace failed — ${message.error}`);
          continue;
        }
        if (entry.expected !== undefined && JSON.stringify(message.result) !== JSON.stringify(entry.expected)) {
          failures.push(
            `#${entry.no} ${field}: got ${JSON.stringify(message.result)}, expected ${JSON.stringify(entry.expected)}`,
          );
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("top150LanguagesFor never lists a language that has no code", () => {
    // Java and C++ are always available via AI translation (no pre-written code).
    const TRANSLATED_LANGUAGES = new Set(["java", "cpp"]);
    for (const entry of Object.values(top150Templates)) {
      const languages = top150LanguagesFor(entry.no);
      expect(languages).toContain("javascript");
      for (const language of languages) {
        if (TRANSLATED_LANGUAGES.has(language)) continue;
        expect(
          top150CodeFor(entry.no, language, "optimal") !== undefined ||
            top150CodeFor(entry.no, language, "brute") !== undefined,
          `#${entry.no} · ${language}`,
        ).toBe(true);
      }
    }
  });

  it("deep-link ids round-trip", () => {
    for (const entry of entries) {
      expect(top150TemplateFromId(top150TemplateId(entry.no))?.no).toBe(entry.no);
    }
    expect(top150TemplateFromId("top150-9999")).toBeUndefined();
    expect(top150TemplateFromId("two-sum")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Python variants — verified with a plain python3 interpreter: the auto-
// detected entry harness serializes the result exactly like the tracer would.
// Skipped when python3 is unavailable (e.g. minimal CI images).
// ---------------------------------------------------------------------------

function pythonAvailable(): boolean {
  try {
    execFileSync("python3", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runPythonSolution(code: string, inputText: string): string {
  const entry = detectPythonEntry(code, inputText);
  const harness = entry ? buildPythonHarness(entry, code, inputText) : "";
  const input = JSON.stringify(JSON.parse(inputText));
  const script = [
    "import json",
    `input = json.loads(${JSON.stringify(input)})`,
    `__student_code = ${JSON.stringify(code)}`,
    "exec(__student_code)",
    harness,
  ].join("\n");
  return execFileSync("python3", ["-c", script], {
    encoding: "utf8",
    timeout: 30_000,
  }).trim();
}

function pythonLiteralToJson(text: string): unknown {
  // The harness now outputs valid JSON via json.dumps, so try parsing directly.
  try {
    return JSON.parse(text);
  } catch {
    // Fallback: the harness may print a Python literal (single-quoted lists,
    // True/False); convert it to real JSON with ast.literal_eval.
    try {
      const jsonText = execFileSync(
        "python3",
        ["-c", "import ast,json,sys; s=sys.stdin.read().strip(); print(json.dumps(ast.literal_eval(s)))"],
        { input: text, encoding: "utf8", timeout: 10_000 },
      ).trim();
      return JSON.parse(jsonText);
    } catch {
      // Bare string output.
      return text;
    }
  }
}

const pythonOk = pythonAvailable();

describe("Top Interview 150 Python variants", () => {
  it.skipIf(!pythonOk)(
    "every Python variant (optimal + brute) matches its expected result",
    () => {
      const failures: string[] = [];
      for (const [no, languages] of Object.entries(top150MultiLang)) {
        if (!languages) continue;
        const entry = top150Templates[Number(no)];
        const variants: Array<[string, string | undefined]> = [
          ["pythonCode", languages.pythonCode],
          ["brutePythonCode", languages.brutePythonCode],
        ];
        for (const [field, code] of variants) {
          if (!code) continue;
          let output: string;
          try {
            output = runPythonSolution(code, JSON.stringify(entry.input));
          } catch (error) {
            failures.push(`#${entry.no} ${field}: python error — ${error instanceof Error ? error.message : String(error)}`);
            continue;
          }
          if (entry.expected === undefined) continue;
          let actual: unknown;
          try {
            actual = pythonLiteralToJson(output);
          } catch {
            failures.push(`#${entry.no} ${field}: unparseable output ${JSON.stringify(output)}`);
            continue;
          }
          if (JSON.stringify(actual) !== JSON.stringify(entry.expected)) {
            failures.push(
              `#${entry.no} ${field}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(entry.expected)}`,
            );
          }
        }
      }
      expect(failures).toEqual([]);
    }, 15_000,
  );

  it("every multi-language entry belongs to a traced template", () => {
    for (const no of Object.keys(top150MultiLang)) {
      expect(top150Templates[Number(no)], `#${no} has no optimal template`).toBeDefined();
      expect(top150QuestionByNo(Number(no)), `#${no} missing from the bank`).toBeDefined();
    }
  });
});
