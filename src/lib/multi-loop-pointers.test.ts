import { describe, expect, it } from "vitest";

import {
  INDEX_POINTER_NAMES,
  MATRIX_COL_POINTER_NAMES,
  MATRIX_ROW_POINTER_NAMES,
  pointerColor,
  pointerEntries,
} from "./pointers";
import type { VisualStep } from "@/types/visualizer";
import { instrument, normalizeSteps, runTraceInNode } from "./trace-runner";

async function runFor(code: string, input: string): Promise<VisualStep[]> {
  const instrumented = instrument(code, { inputText: input });
  const message = await runTraceInNode(instrumented.code, input);
  if (!message.ok) throw new Error(message.error ?? "run failed");
  return normalizeSteps(message.steps ?? []) as VisualStep[];
}

function pointerNamesSeen(steps: VisualStep[]): Set<string> {
  const names = new Set<string>();
  for (const step of steps) {
    for (const name of Object.keys(step.pointers ?? {})) names.add(name);
  }
  return names;
}

/** The active indices of the first step where `k` is a pointer in bounds. */
function kActiveCells(steps: VisualStep[]): number[] | undefined {
  for (const step of steps) {
    const kValue = step.pointers?.k;
    if (typeof kValue === "number" && Number.isInteger(kValue) && kValue >= 0) {
      return step.active ?? [];
    }
  }
  return undefined;
}

describe("third-loop and pointer variables", () => {
  it("renders k, x, y, p1, p2, p3 as index pointers", () => {
    for (const name of ["k", "x", "y", "p1", "p2", "p3"]) {
      expect(INDEX_POINTER_NAMES).toContain(name);
    }
  });

  it("pointerEntries emits an entry for k", () => {
    const entries = pointerEntries({ pointers: { i: 0, j: 2, k: 3 } } as VisualStep, 6);
    expect(entries.map((entry) => entry.name)).toEqual(["i", "j", "k"]);
  });

  it("any custom pointer name in bounds renders as an arrow", () => {
    const entries = pointerEntries(
      { pointers: { target: 4, cursor: 3, key: 5, n: 8, flag: true } } as VisualStep,
      7,
    );
    expect(entries.map((entry) => entry.name)).toEqual(["cursor", "key", "target"]);
    // Colors are stable and distinct per name.
    expect(pointerColor("cursor")).toBe(pointerColor("cursor"));
    expect(pointerColor("cursor")).not.toBe(pointerColor("key"));
  });

  it("classic 3 nested for loops: k shows as a pointer and an active cell", async () => {
    const steps = await runFor(
      `const arr = [5, 3, 8, 1, 9, 2];
for (let i = 0; i < arr.length; i++) {
  for (let j = i + 1; j < arr.length; j++) {
    for (let k = j + 1; k < arr.length; k++) {
      if (arr[i] + arr[j] + arr[k] === 12) return [i, j, k];
    }
  }
}
return [-1, -1, -1];`,
      "{}",
    );
    const names = pointerNamesSeen(steps);
    expect(names.has("i")).toBe(true);
    expect(names.has("j")).toBe(true);
    expect(names.has("k")).toBe(true);
    // The k pointer's index must be highlighted as an active cell somewhere.
    const active = kActiveCells(steps);
    expect(active).toBeDefined();
    if (active) {
      const kPointerStep = steps.find(
        (step) => typeof step.pointers?.k === "number" && Number.isInteger(step.pointers.k),
      );
      expect(active).toContain(kPointerStep?.pointers?.k);
    }
  });

  it("custom-named loop variable highlights its cell too (no whitelist)", async () => {
    const steps = await runFor(
      `const arr = [5, 3, 8, 1, 9, 2];
for (let cursor = 0; cursor < arr.length; cursor++) {
  void arr[cursor];
}
return "done";`,
      "{}",
    );
    const cursorStep = steps.find((step) => typeof step.pointers?.cursor === "number");
    expect(cursorStep).toBeDefined();
    if (cursorStep) {
      expect(cursorStep.pointers!.cursor).toBe(0);
      expect(cursorStep.active ?? []).toContain(0);
    }
  });

  it("x/y grid-coordinate loops: both are pointers with matrix axis arrows", async () => {
    const steps = await runFor(
      `const grid = [[1, 2], [3, 4]];
for (let x = 0; x < grid.length; x++) {
  for (let y = 0; y < grid[x].length; y++) {
    void grid[x][y];
  }
}
return "done";`,
      "{}",
    );
    const names = pointerNamesSeen(steps);
    expect(names.has("x")).toBe(true);
    expect(names.has("y")).toBe(true);
    // x is the row index, y the column index — both get matrix axis arrows.
    const matrixStep = steps.find(
      (step) => step.matrix && typeof step.pointers?.x === "number" && typeof step.pointers?.y === "number",
    );
    expect(matrixStep).toBeDefined();
    if (matrixStep) {
      const rows = matrixStep.matrix!.length;
      const cols = matrixStep.matrix![0].length;
      const rowEntries = pointerEntries(matrixStep, rows, MATRIX_ROW_POINTER_NAMES);
      const colEntries = pointerEntries(matrixStep, cols, MATRIX_COL_POINTER_NAMES);
      expect(rowEntries.map((entry) => entry.name)).toContain("x");
      expect(colEntries.map((entry) => entry.name)).toContain("y");
    }
  });
});
