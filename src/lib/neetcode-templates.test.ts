import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { neetcodeQuestionByNo } from "./neetcode";
import {
  hasNeetCodeTemplate,
  neetcodeCodeFor,
  neetcodeLanguagesFor,
  neetcodeTemplateFromId,
  neetcodeTemplates,
} from "./neetcode-templates";
import { neetcodeMultiLang } from "./neetcode-multilang";
import { top150Templates } from "./top150-templates";
import { buildPythonHarness, detectPythonEntry } from "./trace/leetcode";
import { runTraceInNode } from "./trace-runner";

const entries = Object.values(neetcodeTemplates);

describe("NeetCode Roadmap templates", () => {

  it("every template's number exists in the NeetCode bank (and only there — never duplicated into the Top 150 registry)", () => {
    for (const entry of entries) {
      expect(neetcodeQuestionByNo(entry.no), `#${entry.no}`).toBeDefined();
      expect(top150Templates[entry.no], `#${entry.no} is already in the Top 150 registry`).toBeUndefined();
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

  it("deep-link ids round-trip through the Top 150 scheme", () => {
    for (const entry of entries) {
      const id = `top150-${entry.no}`;
      expect(neetcodeTemplateFromId(id)?.no).toBe(entry.no);
      expect(hasNeetCodeTemplate(entry.no)).toBe(true);
    }
    expect(neetcodeTemplateFromId("top150-9999")).toBeUndefined();
    expect(neetcodeTemplateFromId("two-sum")).toBeUndefined();
    expect(hasNeetCodeTemplate(9999)).toBe(false);
  });

  it("neetcodeLanguagesFor returns JS + the multilang languages for every entry", () => {
    for (const entry of entries) {
      const langs = neetcodeLanguagesFor(entry.no);
      expect(langs[0]).toBe("javascript");
      const ml = neetcodeMultiLang[entry.no];
      if (ml?.pythonCode) expect(langs).toContain("python");
      if (ml?.typescriptCode) expect(langs).toContain("typescript");
      if (ml?.javaCode) expect(langs).toContain("java");
      if (ml?.cppCode) expect(langs).toContain("cpp");
    }
  });

  it("neetcodeCodeFor resolves the correct language code", () => {
    for (const entry of entries) {
      expect(neetcodeCodeFor(entry.no, "javascript")).toBe(entry.code);
      const ml = neetcodeMultiLang[entry.no];
      if (ml?.pythonCode) expect(neetcodeCodeFor(entry.no, "python")).toBe(ml.pythonCode);
      if (ml?.typescriptCode) expect(neetcodeCodeFor(entry.no, "typescript")).toBe(ml.typescriptCode);
    }
  });

  it("every TypeScript variant traces successfully and matches its expected result", async () => {
    const failures: string[] = [];
    for (const entry of entries) {
      const ml = neetcodeMultiLang[entry.no];
      if (!ml?.typescriptCode) continue;
      let message: Awaited<ReturnType<typeof runTraceInNode>>;
      try {
        message = await runTraceInNode(ml.typescriptCode, JSON.stringify(entry.input), { typescript: true });
      } catch (error) {
        failures.push(`#${entry.no}: TS threw — ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (!message.ok) {
        failures.push(`#${entry.no}: TS trace failed — ${message.error}`);
        continue;
      }
      if ((message.steps?.length ?? 0) === 0) {
        failures.push(`#${entry.no}: TS trace produced no steps`);
        continue;
      }
      if (entry.expected !== undefined && JSON.stringify(message.result) !== JSON.stringify(entry.expected)) {
        failures.push(
          `#${entry.no}: TS got ${JSON.stringify(message.result)}, expected ${JSON.stringify(entry.expected)}`,
        );
      }
    }
    expect(failures).toEqual([]);
  });
});

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
  try {
    return JSON.parse(text);
  } catch {
    try {
      const jsonText = execFileSync(
        "python3",
        ["-c", "import ast,json,sys; s=sys.stdin.read().strip(); print(json.dumps(ast.literal_eval(s)))"],
        { input: text, encoding: "utf8", timeout: 10_000 },
      ).trim();
      return JSON.parse(jsonText);
    } catch {
      return text;
    }
  }
}

function pythonAvailable(): boolean {
  try {
    execFileSync("python3", ["--version"], { encoding: "utf8", timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

const pythonOk = pythonAvailable();

describe("NeetCode Roadmap Python variants", () => {
  it.skipIf(!pythonOk)("every Python variant (optimal) matches its expected result", () => {
    const failures: string[] = [];
    for (const entry of Object.values(neetcodeTemplates)) {
      const ml = neetcodeMultiLang[entry.no];
      if (!ml?.pythonCode) continue;
      let output: string;
      try {
        output = runPythonSolution(ml.pythonCode, JSON.stringify(entry.input));
      } catch (error) {
        failures.push(`#${entry.no}: python error — ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (entry.expected === undefined) continue;
      let actual: unknown;
      try {
        actual = pythonLiteralToJson(output);
      } catch {
        failures.push(`#${entry.no}: unparseable output ${JSON.stringify(output)}`);
        continue;
      }
      if (JSON.stringify(actual) !== JSON.stringify(entry.expected)) {
        failures.push(
          `#${entry.no}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(entry.expected)}`,
        );
      }
    }
    expect(failures).toEqual([]);
  }, 15_000);
});
