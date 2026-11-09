import { describe, expect, it } from "vitest";

import { buildPythonSteps, pythonConsoleOutput, type PythonRawEvent } from "./python-steps";

// Synthetic raw events shaped exactly like the Pyodide harness emits them.
function line(line: number, locals: Record<string, unknown>, comparisons = 0): PythonRawEvent {
  return { line, locals, callstack: [], kind: "line", note: null, comparisons };
}

function branch(line: number, note: string, locals: Record<string, unknown>, comparisons = 0): PythonRawEvent {
  return { line, locals, callstack: [], kind: "branch", note, comparisons };
}

describe("buildPythonSteps", () => {
  it("detects a numeric array with pointer variables and swap counting", () => {
    const raw = [
      line(1, { arr: [8, 3, 5], i: 0, j: 0 }),
      line(2, { arr: [8, 3, 5], i: 0, j: 1 }),
      branch(3, "if arr[j] > arr[j + 1]", { arr: [8, 3, 5], i: 0, j: 1 }, 1),
      line(4, { arr: [3, 8, 5], i: 0, j: 1 }, 1),
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps).toHaveLength(4);
    expect(steps[0].array).toEqual([8, 3, 5]);
    expect(steps[0].arrayName).toBe("arr");
    expect(steps[0].pointers).toMatchObject({ i: 0, j: 0 });
    // Both pointers hit index 0 — active dedupes the shared cell.
    expect(steps[0].active).toEqual([0]);

    // Branch step carries its source line as the note and counts the comparison.
    expect(steps[2].title).toBe("Branch");
    expect(steps[2].note).toBe("if arr[j] > arr[j + 1]");
    expect(steps[2].ops?.comparisons).toBe(1);

    // The final step's ops total 1 comparison + 1 swap (3 and 8 exchanged).
    expect(steps[3].ops?.swaps).toBe(1);
    expect(steps[3].ops?.comparisons).toBe(1);
  });

  it("infers a binary-search range and active mid", () => {
    const raw = [
      line(1, { arr: [1, 3, 5, 7, 9], left: 0, right: 4 }),
      branch(2, "while left <= right", { arr: [1, 3, 5, 7, 9], left: 0, right: 4, mid: 2 }, 1),
      line(3, { arr: [1, 3, 5, 7, 9], left: 0, right: 4, mid: 2 }),
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].range).toEqual([0, 4]);
    expect(steps[1].range).toEqual([0, 4]);
    expect(steps[1].active).toContain(2);
  });

  it("renders a matrix with the active cell from row/col variables", () => {
    const matrix = [
      [1, 0],
      [0, 1],
    ];
    const raw = [
      line(1, { grid: matrix, r: 1, c: 0 }),
      line(2, { grid: matrix, r: 1, c: 1 }),
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].matrix).toEqual(matrix);
    expect(steps[0].matrixName).toBe("grid");
    expect(steps[0].activeCell).toEqual({ row: 1, col: 0 });
    expect(steps[1].activeCell).toEqual({ row: 1, col: 1 });
  });

  it("attaches changedCells to matrix writes for diff highlights and notes", () => {
    const raw = [
      line(1, { grid: [[1, 0], [0, 1]], r: 0, c: 0 }),
      line(2, { grid: [[1, 1], [0, 1]], r: 0, c: 1 }),
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[1].changedCells).toEqual([
      { row: 0, col: 1, previousValue: 0, value: 1 },
    ]);
    expect(steps[1].ops?.writes).toBe(1);
  });

  it("carries the source line as the note for line steps", () => {
    const raw: PythonRawEvent[] = [
      {
        line: 2,
        locals: { arr: [3, 8, 5], i: 0, j: 1 },
        callstack: [],
        kind: "line",
        note: "arr[0], arr[1] = arr[1], arr[0]",
        comparisons: 0,
      },
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].note).toBe("arr[0], arr[1] = arr[1], arr[0]");
  });

  it("truncates long line notes so the step header stays a fixed height", () => {
    const raw: PythonRawEvent[] = [
      {
        line: 2,
        locals: { arr: [3, 8, 5], i: 0 },
        callstack: [],
        kind: "line",
        note: "result = ".repeat(30) + "x",
        comparisons: 0,
      },
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].note?.length).toBeLessThanOrEqual(100);
    expect(steps[0].note?.endsWith("…")).toBe(true);
  });

  it("detects a graph adjacency dict and the active node", () => {
    const graph = { A: ["B", "C"], B: ["D"], C: [], D: [] };
    const raw = [
      line(1, { graph, node: "A" }),
      line(2, { graph, node: "B" }),
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].graph).toEqual(graph);
    expect(steps[0].graphName).toBe("graph");
    expect(steps[0].activeNode).toBe("A");
    expect(steps[1].activeNode).toBe("B");
  });

  it("renders a hash map and keeps the input dict out of the map slot", () => {
    const raw = [
      line(1, { seen: { 2: 0, 7: 1 }, input: { array: [2, 7], target: 9 }, i: 1 }),
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].hashMap).toEqual({ 2: 0, 7: 1 });
    expect(steps[0].hashMapName).toBe("seen");
    expect(steps[0].pointers).toMatchObject({ i: 1 });
  });

  it("captures sets by identity and keeps the source name", () => {
    const raw: PythonRawEvent[] = [
      {
        line: 4,
        locals: { graph: { A: ["B", "C"] }, stack: ["A"], visited: ["A"] },
        sets: { visited: ["A"] },
        callstack: [],
        kind: "line",
        note: null,
        comparisons: 0,
      },
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].setName).toBe("visited");
    expect(steps[0].set).toEqual(["A"]);
    // Name-routed for the visualization's visited markers, and the stack array
    // is captured alongside the graph (the graph guard was removed).
    expect(steps[0].visited).toEqual(["A"]);
    expect(steps[0].stackName).toBe("stack");
    expect(steps[0].stack).toEqual(["A"]);
    expect(steps[0].graphName).toBe("graph");
  });

  it("builds a recursion call stack from call/return events", () => {
    const raw: PythonRawEvent[] = [
      { line: 5, locals: { node: "A", graph: { A: ["B"] } }, callstack: ["dfs(node='A')"], kind: "call", note: "dfs(node='A')" },
      { line: 6, locals: { node: "B", graph: { A: ["B"] } }, callstack: ["dfs(node='A')", "dfs(node='B')"], kind: "call", note: "dfs(node='B')" },
      { line: 7, locals: { node: "B", graph: { A: ["B"] } }, callstack: ["dfs(node='A')"], kind: "return", note: "Return from dfs(node='B') → None" },
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].title).toBe("Call dfs(node='A')");
    expect(steps[0].callStack).toEqual(["dfs(node='A')"]);
    expect(steps[1].callStack).toEqual(["dfs(node='A')", "dfs(node='B')"]);
    expect(steps[2].title).toBe("Return");
    expect(steps[2].callStack).toEqual(["dfs(node='A')"]);
  });

  it("turns print output into Console steps and reports the last line", () => {
    const raw: PythonRawEvent[] = [
      line(1, { arr: [8, 3] }),
      { line: null, locals: {}, callstack: [], kind: "console", note: "[3, 8]", comparisons: 0 },
    ];

    const { steps } = buildPythonSteps(raw);
    const output = pythonConsoleOutput(steps);
    expect(output).toEqual(["[3, 8]"]);
    expect(steps[1].title).toBe("Console");
  });

  it("coalesces consecutive identical steps", () => {
    const raw = [
      line(1, { arr: [8, 3, 5], i: 0 }),
      line(1, { arr: [8, 3, 5], i: 0 }),
      line(2, { arr: [8, 3, 5], i: 0 }),
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps).toHaveLength(2);
  });

  it("respects the step cap and reports truncation", () => {
    const raw = Array.from({ length: 10 }, (_, index) =>
      line(1, { arr: [8, 3, 5], i: index }),
    );

    const { steps, truncated } = buildPythonSteps(raw, { maxSteps: 3 });
    expect(steps).toHaveLength(3);
    expect(truncated).toBe(true);
  });

  it("counts string writes via the window variables", () => {
    const raw = [
      line(1, { s: "aab", start: 0, end: 1 }),
      line(2, { s: "aac", start: 0, end: 2 }),
    ];

    const { steps } = buildPythonSteps(raw);
    expect(steps[0].window).toEqual([0, 1]);
    expect(steps[1].string).toBe("aac");
    expect(steps[1].ops?.writes).toBe(1);
  });
});
