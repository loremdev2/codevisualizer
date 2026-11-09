import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { algorithmTemplates } from "./templates";
import { sortingAlgorithms, sortingAlgoByTemplateId, validateSorting } from "./sorting";
import { sortingAlgoAnswers, sortingLanguageTabs, type SortingAlgoAnswers } from "./sorting-answers";
import { runTraceInNode } from "./trace-runner";

// ---------------------------------------------------------------------------
// Sorting Algorithms — verified end to end:
//   · every bank entry has a visualizer template, and the template's JS is
//     exactly the JavaScript answer shown in the bank (no drift);
//   · JS/TS run through the real trace engine;
//   · Python runs under python3; Java and C++ are compiled and run.
// All variants implement the same algorithm, so every one must sort the same
// default input to the same expected array.
// ---------------------------------------------------------------------------

const entries = Object.values(sortingAlgoAnswers);
const sortingTemplateIds = new Set(sortingAlgorithms.map((algorithm) => algorithm.id));

function templateFor(id: string) {
  return algorithmTemplates.find((template) => template.id === id);
}

describe("Sorting Algorithms bank", () => {
  it("the bank is valid", () => {
    expect(validateSorting()).toEqual([]);
    for (const algorithm of sortingAlgorithms) {
      expect(templateFor(algorithm.id), `${algorithm.id} has no template`).toBeDefined();
      expect(sortingAlgoAnswers[algorithm.id], `${algorithm.id} has no answers`).toBeDefined();
      for (const tab of sortingLanguageTabs) {
        expect(
          sortingAlgoAnswers[algorithm.id].answers[tab.id]?.trim(),
          `${algorithm.id} ${tab.id}`,
        ).toBeTruthy();
      }
    }
  });

  it("every answer set belongs to an algorithm in the bank", () => {
    for (const entry of entries) {
      expect(sortingAlgoByTemplateId(entry.id), `${entry.id} not in the bank`).toBeDefined();
      expect(templateFor(entry.id), `${entry.id} has no template`).toBeDefined();
    }
  });

  it("the JavaScript answer matches the visualizer template verbatim (no drift)", () => {
    for (const entry of entries) {
      const template = templateFor(entry.id);
      expect(template?.code, `${entry.id} template`).toBe(entry.answers.javascript);
    }
  });

  it("every sorting template traces successfully and returns the sorted array", async () => {
    const failures: string[] = [];
    for (const id of sortingTemplateIds) {
      const template = templateFor(id);
      if (!template) continue;
      const message = await runTraceInNode(template.code, JSON.stringify(template.input));
      if (!message.ok) {
        failures.push(`${id}: trace failed — ${message.error}`);
        continue;
      }
      if ((message.steps?.length ?? 0) === 0) {
        failures.push(`${id}: trace produced no steps`);
        continue;
      }
      if (template.expected !== undefined && JSON.stringify(message.result) !== JSON.stringify(template.expected)) {
        failures.push(`${id}: got ${JSON.stringify(message.result)}, expected ${JSON.stringify(template.expected)}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// JavaScript + TypeScript — the real trace engine.
// ---------------------------------------------------------------------------

describe("Sorting Algorithms answers · JavaScript + TypeScript", () => {
  it("every JavaScript answer traces and sorts its input", async () => {
    const failures: string[] = [];
    for (const entry of entries) {
      const message = await runTraceInNode(entry.answers.javascript, JSON.stringify(entry.input));
      if (!message.ok) {
        failures.push(`${entry.id}: ${message.error}`);
        continue;
      }
      if (JSON.stringify(message.result) !== JSON.stringify(entry.expected)) {
        failures.push(`${entry.id}: got ${JSON.stringify(message.result)}, expected ${JSON.stringify(entry.expected)}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("every TypeScript answer traces and sorts its input", async () => {
    const failures: string[] = [];
    for (const entry of entries) {
      const message = await runTraceInNode(entry.answers.typescript, JSON.stringify(entry.input), {
        typescript: true,
      });
      if (!message.ok) {
        failures.push(`${entry.id}: ${message.error}`);
        continue;
      }
      if (JSON.stringify(message.result) !== JSON.stringify(entry.expected)) {
        failures.push(`${entry.id}: got ${JSON.stringify(message.result)}, expected ${JSON.stringify(entry.expected)}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Python — python3 with the idiomatic function answer.
// ---------------------------------------------------------------------------

function pythonAvailable(): boolean {
  try {
    execFileSync("python3", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runPython(entry: SortingAlgoAnswers): string {
  // Python answers use snake_case function names; grab the def name so the
  // runner calls the right function instead of the camelCase Java method.
  const pythonMethod = entry.answers.python.match(/^def\s+(\w+)/m)?.[1];
  const script = [
    entry.answers.python,
    "import json",
    `result = ${pythonMethod}([${entry.input.array.join(", ")}])`,
    "print(json.dumps(result))",
  ].join("\n");
  return execFileSync("python3", ["-c", script], {
    encoding: "utf8",
    timeout: 30_000,
  }).trim();
}

const pythonOk = pythonAvailable();

describe("Sorting Algorithms answers · Python", () => {
  it.skipIf(!pythonOk)("every Python answer sorts its input", () => {
    const failures: string[] = [];
    for (const entry of entries) {
      let output: string;
      try {
        output = runPython(entry);
      } catch (error) {
        failures.push(`${entry.id}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      let actual: unknown;
      try {
        actual = JSON.parse(output);
      } catch {
        failures.push(`${entry.id}: unparseable output ${JSON.stringify(output)}`);
        continue;
      }
      if (JSON.stringify(actual) !== JSON.stringify(entry.expected)) {
        failures.push(`${entry.id}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(entry.expected)}`);
      }
    }
    expect(failures).toEqual([]);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// Java — javac + a Main that calls the answer's method on the input array.
// ---------------------------------------------------------------------------

function javaToolAvailable(): boolean {
  try {
    execFileSync("javac", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function javaMainFor(entry: SortingAlgoAnswers): string {
  return `import java.util.*;

public class Main {
    static String intArrayToJson(int[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(arr[i]);
        }
        return sb.append(']').toString();
    }

    public static void main(String[] args) {
        int[] nums = new int[]{${entry.input.array.join(", ")}};
        int[] result = new Solution().${entry.method}(nums);
        System.out.println(intArrayToJson(result));
    }
}`;
}

function runJava(entry: SortingAlgoAnswers): string {
  const dir = mkdtempSync(join(tmpdir(), "sorting-java-"));
  try {
    writeFileSync(join(dir, "Solution.java"), entry.answers.java);
    writeFileSync(join(dir, "Main.java"), javaMainFor(entry));
    execFileSync("javac", ["Solution.java", "Main.java"], { cwd: dir, stdio: "pipe" });
    return execFileSync("java", ["-cp", dir, "Main"], { cwd: dir, encoding: "utf8" }).trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const javaOk = javaToolAvailable();

describe("Sorting Algorithms answers · Java", () => {
  it.skipIf(!javaOk)("every Java answer compiles, runs, and sorts its input", () => {
    const failures: string[] = [];
    for (const entry of entries) {
      let output: string;
      try {
        output = runJava(entry);
      } catch (error) {
        failures.push(`${entry.id}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      let actual: unknown;
      try {
        actual = JSON.parse(output);
      } catch {
        failures.push(`${entry.id}: unparseable output ${JSON.stringify(output)}`);
        continue;
      }
      if (JSON.stringify(actual) !== JSON.stringify(entry.expected)) {
        failures.push(`${entry.id}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(entry.expected)}`);
      }
    }
    expect(failures).toEqual([]);
  }, 120_000);
});

// ---------------------------------------------------------------------------
// C++ — clang++ + a main that calls the answer's function on the input array.
// ---------------------------------------------------------------------------

function cppToolAvailable(): boolean {
  try {
    execFileSync("clang++", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function cppMainFor(entry: SortingAlgoAnswers): string {
  return `#include <vector>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
using namespace std;

static string intListToJson(const vector<int>& v) {
    string out = "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i) out += ",";
        out += to_string(v[i]);
    }
    out += "]";
    return out;
}

${entry.answers.cpp}

int main() {
    vector<int> nums = {${entry.input.array.join(", ")}};
    cout << intListToJson(${entry.method}(nums)) << endl;
    return 0;
}`;
}

function runCpp(entry: SortingAlgoAnswers): string {
  const dir = mkdtempSync(join(tmpdir(), "sorting-cpp-"));
  try {
    writeFileSync(join(dir, "main.cpp"), cppMainFor(entry));
    execFileSync("clang++", ["-std=c++17", "-O0", "main.cpp", "-o", "runner"], {
      cwd: dir,
      stdio: "pipe",
    });
    return execFileSync("./runner", [], { cwd: dir, encoding: "utf8" }).trim();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const cppOk = cppToolAvailable();

describe("Sorting Algorithms answers · C++", () => {
  it.skipIf(!cppOk)("every C++ answer compiles, runs, and sorts its input", () => {
    const failures: string[] = [];
    for (const entry of entries) {
      let output: string;
      try {
        output = runCpp(entry);
      } catch (error) {
        failures.push(`${entry.id}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      let actual: unknown;
      try {
        actual = JSON.parse(output);
      } catch {
        failures.push(`${entry.id}: unparseable output ${JSON.stringify(output)}`);
        continue;
      }
      if (JSON.stringify(actual) !== JSON.stringify(entry.expected)) {
        failures.push(`${entry.id}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(entry.expected)}`);
      }
    }
    expect(failures).toEqual([]);
  }, 180_000);
});
