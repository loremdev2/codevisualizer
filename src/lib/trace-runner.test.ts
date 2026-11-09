import { describe, expect, it } from "vitest";

import { algorithmTemplates } from "./templates";
import type { AlgorithmTemplate } from "@/types/visualizer";
import { instrument, isStepLimitError, normalizeSteps, runTraceInNode, type WorkerTraceMessage } from "./trace-runner";
import type { VisualStep } from "@/types/visualizer";

function byId(id: string): AlgorithmTemplate {
  const template = algorithmTemplates.find((candidate) => candidate.id === id);
  if (!template) throw new Error(`Missing template ${id}`);
  return template;
}

async function trace(template: AlgorithmTemplate): Promise<{ steps: VisualStep[]; result: unknown; message: WorkerTraceMessage }> {
  const message = await runTraceInNode(template.code, JSON.stringify(template.input));
  expect(message.ok, `${template.id}: ${message.error ?? ""}`).toBe(true);
  return { steps: normalizeSteps(message.steps ?? []), result: message.result, message };
}

function reachableFrom(graph: Record<string, Array<string | number>>, start: string): string[] {
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const node = queue.shift()!;
    for (const neighbor of graph[node] ?? []) {
      const key = String(neighbor);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push(key);
      }
    }
  }
  return Array.from(seen);
}

const jsTemplates = algorithmTemplates.filter(
  (template) => !template.language || template.language === "javascript",
);

describe("golden traces for built-in templates", () => {
  for (const template of jsTemplates) {
    it(`${template.id}: runs successfully and produces steps`, async () => {
      const { steps } = await trace(template);
      expect(steps.length).toBeGreaterThan(0);
    });
  }

  it("bubble sort: ends sorted, active indices stay in range, a swap is visible", async () => {
    const template = byId("bubble-sort");
    const { steps } = await trace(template);

    const expected = [...(template.input.array as number[])].sort((a, b) => a - b);
    const arrays = steps
      .filter((step) => step.array)
      .map((step) => step.array as number[]);
    expect(arrays[arrays.length - 1]).toEqual(expected);

    for (const step of steps) {
      if (!step.array) continue;
      for (const index of step.active ?? []) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(step.array.length);
      }
    }

    const sawChange = arrays.some(
      (array, index) => index > 0 && JSON.stringify(array) !== JSON.stringify(arrays[index - 1]),
    );
    expect(sawChange).toBe(true);
  });

  it("binary search: returns the target index and shows the final mid", async () => {
    const template = byId("binary-search");
    const { steps, result } = await trace(template);

    expect(result).toBe(5);
    expect(steps.some((step) => (step.active ?? []).includes(5))).toBe(true);
  });

  it("sliding window: returns the max window sum", async () => {
    const { result } = await trace(byId("sliding-window"));
    expect(result).toBe(9);
  });

  it("character replacement: returns the longest valid window", async () => {
    const { result } = await trace(byId("character-replacement"));
    expect(result).toBe(4);
  });

  it("iterative DFS: visits every reachable node and keeps the frontier in-bounds", async () => {
    const template = byId("dfs-graph");
    const { steps } = await trace(template);

    const graph = template.input.graph as Record<string, Array<string | number>>;
    const start = String(template.input.start);
    const reachable = reachableFrom(graph, start);

    const visitedSteps = steps.filter((step) => step.visited?.length);
    const finalVisited = visitedSteps[visitedSteps.length - 1]?.visited ?? [];
    expect(new Set(finalVisited)).toEqual(new Set(reachable));

    for (const step of steps) {
      const frontier = [...(step.stack ?? []), ...(step.frontier ?? [])];
      for (const node of frontier) {
        expect(reachable).toContain(String(node));
      }
    }
  });

  it("recursive DFS: call stack grows on call and shrinks on return", async () => {
    const template = byId("recursive-dfs");
    const { steps } = await trace(template);

    const graph = template.input.graph as Record<string, Array<string | number>>;
    const start = String(template.input.start);
    const reachable = reachableFrom(graph, start);

    const visitedSteps = steps.filter((step) => step.visited?.length);
    const finalVisited = visitedSteps[visitedSteps.length - 1]?.visited ?? [];
    expect(new Set(finalVisited)).toEqual(new Set(reachable));

    const enters = steps.filter((step) => step.title === "Call dfs");
    const returns = steps.filter((step) => step.title === "Return");
    expect(enters.length).toBeGreaterThan(0);
    expect(returns.length).toBe(enters.length);
    expect(String(enters[0].callStack?.at(-1))).toMatch(/^dfs\(/);
  });
});

describe("translated (fixture) traces", () => {
  it("a Python-style bubble sort translation traces and ends sorted", async () => {
    const code = `const arr = [...input.array];

for (let i = 0; i < arr.length - 1; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}

console.log(arr);
return arr;`;

    const message = await runTraceInNode(code, JSON.stringify({ array: [4, 2, 7, 1] }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([1, 2, 4, 7]);

    const steps = normalizeSteps(message.steps ?? []);
    expect(steps.some((step) => step.title === "Console" && step.note === "[1,2,4,7]")).toBe(true);
  });

  it("a Java-style binary search translation returns the target index", async () => {
    const code = `const arr = input.array;
const target = input.target;
let left = 0;
let right = arr.length - 1;

while (left <= right) {
  const mid = Math.floor((left + right) / 2);
  if (arr[mid] === target) {
    console.log(mid);
    return mid;
  }
  if (arr[mid] < target) left = mid + 1;
  else right = mid - 1;
}

return -1;`;

    const message = await runTraceInNode(
      code,
      JSON.stringify({ array: [1, 3, 5, 7, 9, 11, 15, 18], target: 11 }),
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(5);
  });
});

describe("AST instrumentation", () => {
  it("records branch decisions (if/while) with truthiness notes", async () => {
    const { steps } = await trace(byId("binary-search"));
    const branches = steps.filter((step) => step.title === "Branch");

    expect(branches.length).toBeGreaterThan(0);
    expect(branches.some((step) => /arr\[mid\] === target/.test(step.note ?? ""))).toBe(true);
    expect(branches.some((step) => /→ (true|false)/.test(step.note ?? ""))).toBe(true);
  });

  it("for-loop branch steps include loop variables declared in the init", async () => {
    const code = `const arr = input.array;

for (let i = 0; i < arr.length - 1; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}

return arr;`;

    const message = await runTraceInNode(code, JSON.stringify({ array: [4, 2, 7, 1] }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([1, 2, 4, 7]);

    const steps = normalizeSteps(message.steps ?? []);
    const forBranches = steps.filter(
      (step) => step.title === "Branch" && (step.note ?? "").startsWith("for"),
    );
    expect(forBranches.length).toBeGreaterThan(0);

    // The outer loop's branch must see i; the inner one must see both i and j —
    // variables the init declares must never drop out of branch steps.
    const outerBranches = forBranches.filter((step) =>
      (step.note ?? "").includes("i < arr.length - 1"),
    );
    const innerBranches = forBranches.filter((step) =>
      (step.note ?? "").includes("j < arr.length"),
    );
    expect(outerBranches.length).toBeGreaterThan(0);
    expect(innerBranches.length).toBeGreaterThan(0);

    for (const branch of outerBranches) {
      expect(typeof branch.pointers?.i, `${branch.note}`).toBe("number");
    }
    for (const branch of innerBranches) {
      expect(typeof branch.pointers?.i, `${branch.note}`).toBe("number");
      expect(typeof branch.pointers?.j, `${branch.note}`).toBe("number");
    }
  });

  it("while-loop branch steps capture var-declared variables from the loop body", async () => {
    const code = `const arr = input.array;
let i = 0;
const doubled = [];
while (i < arr.length) {
  var current = arr[i] * 2;
  doubled.push(current);
  i++;
}
return doubled;`;

    const message = await runTraceInNode(code, JSON.stringify({ array: [1, 2, 3] }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([2, 4, 6]);

    const steps = normalizeSteps(message.steps ?? []);
    const whileBranches = steps.filter(
      (step) => step.title === "Branch" && (step.note ?? "").startsWith("while"),
    );
    expect(whileBranches.length).toBeGreaterThan(1);

    // `current` is hoisted, so from the second iteration on it is in scope
    // when the branch re-evaluates — it must not drop out of branch steps.
    for (const branch of whileBranches.slice(1)) {
      expect(typeof branch.pointers?.current, `${branch.note}`).toBe("number");
    }
  });

  it("do-while branch steps capture body-declared var variables from the first test", async () => {
    const code = `const arr = input.array;
let i = 0;
const out = [];
do {
  var current = arr[i] * 2;
  out.push(current);
  i++;
} while (i < arr.length);
return out;`;

    const message = await runTraceInNode(code, JSON.stringify({ array: [1, 2] }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([2, 4]);

    const steps = normalizeSteps(message.steps ?? []);
    const doWhileBranches = steps.filter(
      (step) => step.title === "Branch" && (step.note ?? "").startsWith("do-while"),
    );
    expect(doWhileBranches.length).toBeGreaterThan(0);

    // The body runs before the first test, so `current` is defined at every
    // do-while branch step — including the very first.
    for (const branch of doWhileBranches) {
      expect(typeof branch.pointers?.current, `${branch.note}`).toBe("number");
    }
  });

  it("does not hoist vars from nested functions into loop branch steps", async () => {
    const code = `const arr = input.array;
let i = 0;
const out = [];
while (i < arr.length) {
  const helper = () => {
    var internal = 99;
    return internal;
  };
  out.push(helper());
  i++;
}
return out;`;

    const message = await runTraceInNode(code, JSON.stringify({ array: [1] }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([99]);

    const steps = normalizeSteps(message.steps ?? []);
    const whileBranches = steps.filter(
      (step) => step.title === "Branch" && (step.note ?? "").startsWith("while"),
    );
    expect(whileBranches.length).toBeGreaterThan(0);
    // `internal` belongs to the arrow function's scope — never a loop branch.
    for (const branch of whileBranches) {
      expect(branch.pointers?.internal).toBeUndefined();
    }
  });

  it("records ternary branches", async () => {
    const code = `const arr = input.array;
let best = 0;

for (let i = 0; i < arr.length; i++) {
  best = arr[i] > best ? arr[i] : best;
}

return best;`;

    const message = await runTraceInNode(code, JSON.stringify({ array: [1, 5, 3] }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(5);

    const steps = normalizeSteps(message.steps ?? []);
    const ternaryBranches = steps.filter(
      (step) => step.title === "Branch" && (step.note ?? "").includes("ternary"),
    );
    expect(ternaryBranches.length).toBeGreaterThan(0);
  });

  it("handles multi-line statements", async () => {
    const code = `const arr = input.array;
let sum = 0;

for (let i = 0; i < arr.length; i++) {
  sum =
    sum +
    arr[i];
}

return sum;`;

    const message = await runTraceInNode(code, JSON.stringify({ array: [1, 2, 3] }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(6);

    const steps = normalizeSteps(message.steps ?? []);
    const capture = steps.find((step) => (step.note ?? "").includes("sum = sum + arr[i]"));
    expect(capture).toBeDefined();
  });

  it("keeps call-stack frames balanced for a recursive helper", async () => {
    const code = `let calls = 0;

function fib(n) {
  calls++;
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

return fib(input.n);`;

    const message = await runTraceInNode(code, JSON.stringify({ n: 4 }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(3);

    const steps = normalizeSteps(message.steps ?? []);
    const enters = steps.filter((step) => step.title === "Call fib");
    const returns = steps.filter((step) => step.title === "Return");
    expect(enters.length).toBeGreaterThan(0);
    expect(returns.length).toBe(enters.length);
  });
});

describe("step-limit truncation parity", () => {
  it("JS truncation: keeps partial steps and reports the step-limit error", async () => {
    const code = `let x = 0;
while (x >= 0) {
  x++;
}
return x;`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok).toBe(false);
    expect(message.error).toContain("Step limit reached");
    // The partial trace is preserved so the UI can still step through it —
    // mirroring the Python runner's truncated behavior instead of a bare error.
    expect(message.steps?.length ?? 0).toBeGreaterThan(100);
  });

  it("isStepLimitError recognizes the worker error but not ordinary failures", () => {
    expect(isStepLimitError("Step limit reached. Try a smaller input or a simpler loop.")).toBe(true);
    expect(isStepLimitError("SyntaxError: Unexpected token '}'")).toBe(false);
    expect(isStepLimitError("TypeError: arr is not a function")).toBe(false);
    expect(isStepLimitError(undefined)).toBe(false);
    expect(isStepLimitError(null)).toBe(false);
  });
});

describe("TypeScript support", () => {
  it("traces a typed binary search", async () => {
    const code = `interface Item {
  value: number;
}

type NumberArray = number[];

function search(nums: number[], target: number): number {
  let lo: number = 0;
  let hi: number = nums.length - 1;

  while (lo <= hi) {
    const mid: number = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }

  return -1;
}

const nums: number[] = input.array as number[];
return search(nums, input.target);`;

    const message = await runTraceInNode(
      code,
      JSON.stringify({ array: [1, 3, 5, 7, 9, 11, 15, 18], target: 11 }),
      { typescript: true },
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(5);

    const steps = normalizeSteps(message.steps ?? []);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.some((step) => step.title === "Call search")).toBe(true);
  });
});

describe("line mapping", () => {
  it("maps //# line: directives back to the original source lines", async () => {
    const translated = `//# line: 1
const arr = input.array;
//# line: 2
const target = input.target;
//# line: 3
let left = 0;
//# line: 4
let right = arr.length - 1;
//# line: 6
while (left <= right) {
  //# line: 7
  const mid = Math.floor((left + right) / 2);
  //# line: 8
  if (arr[mid] === target) {
    //# line: 10
    return mid;
  }
  //# line: 11
  if (arr[mid] < target) {
    //# line: 12
    left = mid + 1;
  } else {
    //# line: 14
    right = mid - 1;
  }
}
//# line: 16
return -1;`;

    const { code, lineMap } = instrument(translated);
    expect(lineMap.size).toBeGreaterThan(0);

    const message = await runTraceInNode(code, JSON.stringify({ array: [1, 3, 5, 7, 9, 11], target: 11 }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(5);

    const steps = normalizeSteps(message.steps ?? []);
    const originalLines = [1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 16];
    for (const step of steps) {
      if (step.line !== undefined) {
        expect(originalLines, `unexpected line ${step.line} (${step.note})`).toContain(step.line);
      }
    }
  });
});

describe("matrix tracing", () => {
  it("simple traversal: matrix stays visible and the active cell moves cell by cell", async () => {
    const code = `const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

for (let i = 0; i < matrix.length; i++) {
  for (let j = 0; j < matrix[i].length; j++) {
    console.log(matrix[i][j]);
  }
}

return matrix;`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ]);

    const steps = normalizeSteps(message.steps ?? []);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(matrixSteps.length).toBeGreaterThan(0);

    for (const step of matrixSteps) {
      expect(step.matrix).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
      if (step.activeCell) {
        expect(step.activeCell.row).toBeGreaterThanOrEqual(0);
        expect(step.activeCell.row).toBeLessThan(3);
        expect(step.activeCell.col).toBeGreaterThanOrEqual(0);
        expect(step.activeCell.col).toBeLessThan(3);
      }
    }

    const activeCells = matrixSteps
      .map((step) => step.activeCell)
      .filter((cell): cell is { row: number; col: number } => cell !== undefined);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(
          activeCells.some((cell) => cell.row === r && cell.col === c),
          `expected an active cell at [${r},${c}]`,
        ).toBe(true);
      }
    }

    // Phase notes explain the traversal as it happens.
    const phases = matrixSteps.map((step) => step.phase ?? "");
    expect(phases.some((phase) => phase.includes("moving right along row 0"))).toBe(true);
    expect(phases.some((phase) => phase.includes("visiting [1,0]"))).toBe(true);
    expect(phases.some((phase) => phase.includes("read matrix[i][j]"))).toBe(true);

    for (const step of steps) {
      if (step.line !== undefined) expect(step.line).toBeGreaterThan(0);
    }
  });

  it("cell modification: only changed cells are marked and the final matrix is correct", async () => {
    const code = `const matrix = [
  [1, 2],
  [3, 4],
];

for (let i = 0; i < matrix.length; i++) {
  for (let j = 0; j < matrix[i].length; j++) {
    matrix[i][j] *= 2;
  }
}

return matrix;`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([
      [2, 4],
      [6, 8],
    ]);

    const steps = normalizeSteps(message.steps ?? []);
    const changeSteps = steps.filter((step) => step.changedCells?.length);
    expect(changeSteps.length).toBeGreaterThan(0);

    const firstChange = changeSteps[0].changedCells?.[0];
    expect(firstChange).toMatchObject({ row: 0, col: 0, previousValue: 1, value: 2 });
    // The instrumented assignment records the exact cell being written.
    expect(changeSteps[0].activeCell).toEqual({ row: 0, col: 0 });
    // ...and the phase names the write with its before → after values.
    expect(changeSteps[0].phase).toContain("updated matrix[i][j]: 1 → 2");

    for (const step of changeSteps) {
      for (const change of step.changedCells ?? []) {
        expect(change.row).toBeGreaterThanOrEqual(0);
        expect(change.row).toBeLessThan(2);
        expect(change.col).toBeGreaterThanOrEqual(0);
        expect(change.col).toBeLessThan(2);
        expect(change.previousValue).not.toBe(change.value);
      }
    }
  });

  it("matrix search: active cell lands on the match and the condition is recorded", async () => {
    const code = `const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const target = input.target;

for (let i = 0; i < matrix.length; i++) {
  for (let j = 0; j < matrix[i].length; j++) {
    if (matrix[i][j] === target) {
      return true;
    }
  }
}

return false;`;

    const message = await runTraceInNode(code, JSON.stringify({ target: 5 }));
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(true);

    const steps = normalizeSteps(message.steps ?? []);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(
      matrixSteps.some((step) => step.activeCell?.row === 1 && step.activeCell?.col === 1),
    ).toBe(true);

    const branch = steps.find(
      (step) =>
        step.title === "Branch" &&
        (step.note ?? "").includes("matrix[i][j] === target") &&
        (step.note ?? "").includes("→ true"),
    );
    expect(branch).toBeDefined();
    expect(branch?.note).toContain("matrix[i][j] === target");
    // Condition accesses are recorded too, so the phase names the read.
    expect(branch?.phase).toContain("read matrix[i][j]");
  });

  it("spiral traversal: matrix is captured throughout and the traversal is correct", async () => {
    const code = `const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const result = [];
let top = 0;
let bottom = matrix.length - 1;
let left = 0;
let right = matrix[0].length - 1;

while (top <= bottom && left <= right) {
  for (let i = left; i <= right; i++) result.push(matrix[top][i]);
  top++;
  for (let i = top; i <= bottom; i++) result.push(matrix[i][right]);
  right--;
  if (top <= bottom) {
    for (let i = right; i >= left; i--) result.push(matrix[bottom][i]);
    bottom--;
  }
  if (left <= right) {
    for (let i = bottom; i >= top; i--) result.push(matrix[i][left]);
    left++;
  }
}

return result;`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([1, 2, 3, 6, 9, 8, 7, 4, 5]);

    const steps = normalizeSteps(message.steps ?? []);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(matrixSteps.length).toBeGreaterThan(0);
    for (const step of matrixSteps) {
      expect(step.matrix).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
    }

    // Precise access tracking: every cell is highlighted as the spiral visits
    // it, even though no row/col loop variables exist (top/bottom/left/right).
    const activeCells = matrixSteps
      .map((step) => step.activeCell)
      .filter((cell): cell is { row: number; col: number } => cell !== undefined);
    const expectedPath = [
      [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0], [1, 1],
    ];
    for (const [r, c] of expectedPath) {
      expect(
        activeCells.some((cell) => cell.row === r && cell.col === c),
        `expected the spiral to visit [${r},${c}]`,
      ).toBe(true);
    }

    // Phase notes narrate each pass of the boundary traversal.
    const phases = matrixSteps.map((step) => step.phase ?? "");
    expect(phases.some((phase) => phase.includes("moving right along row 0"))).toBe(true);
    expect(phases.some((phase) => phase.includes("moving down column 2"))).toBe(true);
    expect(phases.some((phase) => phase.includes("moving left along row 2"))).toBe(true);
    expect(phases.some((phase) => phase.includes("moving up column 0"))).toBe(true);
    expect(phases.some((phase) => phase.includes("read matrix[top][i]"))).toBe(true);
  });

  it("number of islands (DFS): grid mutation, recursion frames, and active cells", async () => {
    const code = `const grid = [
  ["1", "1", "0"],
  ["1", "0", "1"],
  ["0", "1", "1"],
];

const rows = grid.length;
const cols = grid[0].length;

function dfs(r, c) {
  if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1") return;
  grid[r][c] = "0";
  dfs(r + 1, c);
  dfs(r - 1, c);
  dfs(r, c + 1);
  dfs(r, c - 1);
  return;
}

let islands = 0;
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (grid[r][c] === "1") {
      islands++;
      dfs(r, c);
    }
  }
}

return islands;`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok, message.error).toBe(true);
    // Two islands: {(0,0),(1,0),(0,1)} and {(1,2),(2,2),(2,1)} — note (2,1)
    // touches (2,2), so the bottom-right three ones form a single island.
    expect(message.result).toBe(2);

    const steps = normalizeSteps(message.steps ?? []);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(matrixSteps.length).toBeGreaterThan(0);

    const finalMatrix = matrixSteps[matrixSteps.length - 1].matrix;
    expect(finalMatrix).toEqual([
      ["0", "0", "0"],
      ["0", "0", "0"],
      ["0", "0", "0"],
    ]);

    const changes = steps.flatMap((step) => step.changedCells ?? []);
    expect(changes.some((change) => change.previousValue === "1" && change.value === "0")).toBe(true);

    const calls = steps.filter((step) => step.title === "Call dfs");
    const returns = steps.filter((step) => step.title === "Return");
    expect(calls.length).toBeGreaterThan(0);
    expect(returns.length).toBe(calls.length);

    expect(steps.some((step) => step.activeCell !== undefined)).toBe(true);
    // Deep recursion is labelled, and the in-place flood write is narrated.
    const phases = steps.map((step) => step.phase ?? "");
    expect(phases.some((phase) => phase.includes("recursion · visiting"))).toBe(true);
    expect(phases.some((phase) => phase.includes("updated grid[r][c]: \"1\" → \"0\""))).toBe(true);
  });

  it("BFS on a grid: matrix, queue, and visited cells are all captured", async () => {
    const code = `const grid = [
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
];
const rows = grid.length;
const cols = grid[0].length;
const visited = new Set();
const queue = [];

function bfs(startR, startC) {
  queue.push(startR + "," + startC);
  visited.add(startR + "," + startC);
  while (queue.length > 0) {
    const cell = queue.shift();
    const [r, c] = cell.split(",").map(Number);
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited.has(nr + "," + nc) && grid[nr][nc] === 1) {
        visited.add(nr + "," + nc);
        queue.push(nr + "," + nc);
      }
    }
  }
}

bfs(0, 0);
return Array.from(visited);`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok, message.error).toBe(true);
    expect(new Set(message.result as string[])).toEqual(new Set(["0,0", "1,0", "0,1", "1,1"]));

    const steps = normalizeSteps(message.steps ?? []);
    expect(steps.some((step) => step.matrix)).toBe(true);
    expect(steps.some((step) => step.queue)).toBe(true);
    expect(steps.some((step) => step.visited?.includes("1,1"))).toBe(true);
    // Queue-driven traversal is labelled BFS so students see the algorithm.
    expect(steps.some((step) => (step.phase ?? "").includes("BFS ·"))).toBe(true);

    const matrixSteps = steps.filter((step) => step.matrix);
    for (const step of matrixSteps) {
      expect(step.matrix).toEqual([
        [0, 1, 0],
        [1, 1, 0],
        [0, 0, 1],
      ]);
    }
  });

  it("spiral-matrix template: returns the spiral order with a visible matrix", async () => {
    const { steps, result } = await trace(byId("spiral-matrix"));
    expect(result).toEqual([1, 2, 3, 6, 9, 8, 7, 4, 5]);
    expect(steps.filter((step) => step.matrix).length).toBeGreaterThan(0);
  });

  it("number-of-islands template: counts islands via DFS on the grid", async () => {
    const { steps, result } = await trace(byId("number-of-islands"));
    expect(result).toBe(2);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(matrixSteps.length).toBeGreaterThan(0);
    expect(matrixSteps[matrixSteps.length - 1].matrix).toEqual([
      ["0", "0", "0"],
      ["0", "0", "0"],
      ["0", "0", "0"],
    ]);
  });

  it("set-matrix-zeroes template: zeroes the affected row and column", async () => {
    const { steps, result } = await trace(byId("set-matrix-zeroes"));
    expect(result).toEqual([
      [1, 0, 1],
      [0, 0, 0],
      [1, 0, 1],
    ]);
    expect(steps.some((step) => step.changedCells?.length)).toBe(true);
  });

  it("non-square matrix: dimensions and bounds are respected", async () => {
    const code = `const matrix = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
];
let sum = 0;
for (let i = 0; i < matrix.length; i++) {
  for (let j = 0; j < matrix[i].length; j++) {
    sum += matrix[i][j];
  }
}
return sum;`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(36);

    const steps = normalizeSteps(message.steps ?? []);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(matrixSteps.length).toBeGreaterThan(0);
    for (const step of matrixSteps) {
      expect(step.matrix?.length).toBe(2);
      expect(step.matrix?.[0].length).toBe(4);
      if (step.activeCell) {
        expect(step.activeCell.row).toBeGreaterThanOrEqual(0);
        expect(step.activeCell.row).toBeLessThan(2);
        expect(step.activeCell.col).toBeGreaterThanOrEqual(0);
        expect(step.activeCell.col).toBeLessThan(4);
      }
    }

    // Phase movement respects the row width (row 1 has only 4 columns).
    const phases = matrixSteps.map((step) => step.phase ?? "");
    expect(phases.some((phase) => phase.includes("moving right along row 0"))).toBe(true);
    expect(phases.some((phase) => phase.includes("visiting [1,0]"))).toBe(true);
  });

  it("ragged matrix: rows of different lengths are preserved with per-row bounds", async () => {
    const code = `const matrix = [
  [1, 2],
  [3],
];

let total = 0;
for (let i = 0; i < matrix.length; i++) {
  for (let j = 0; j < matrix[i].length; j++) {
    total += matrix[i][j];
  }
}

return total;`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(6);

    const steps = normalizeSteps(message.steps ?? []);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(matrixSteps.length).toBeGreaterThan(0);
    for (const step of matrixSteps) {
      expect(step.matrix).toEqual([
        [1, 2],
        [3],
      ]);
      if (step.activeCell) {
        const rowLength = step.matrix?.[step.activeCell.row]?.length ?? 0;
        expect(step.activeCell.col).toBeLessThan(rowLength);
      }
    }

    const activeCells = matrixSteps
      .map((step) => step.activeCell)
      .filter((cell): cell is { row: number; col: number } => cell !== undefined);
    expect(activeCells.some((cell) => cell.row === 0 && cell.col === 1)).toBe(true);
    expect(activeCells.some((cell) => cell.row === 1 && cell.col === 0)).toBe(true);

    // [0,1] → [1,0] is a diagonal hop for ragged rows — still narrated.
    const phases = matrixSteps.map((step) => step.phase ?? "");
    expect(phases.some((phase) => phase.includes("diagonal move to [1,0]"))).toBe(true);
  });

  it("object-cell matrix: cells render and only deeply-changed cells are marked", async () => {
    const code = `const matrix = [
  [{ v: 1 }, { v: 2 }],
  [{ v: 3 }, { v: 4 }],
];

matrix[0][1].v = 99;

return matrix;`;

    const message = await runTraceInNode(code, "{}");
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([
      [{ v: 1 }, { v: 99 }],
      [{ v: 3 }, { v: 4 }],
    ]);

    const steps = normalizeSteps(message.steps ?? []);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(matrixSteps.length).toBeGreaterThan(0);
    expect(matrixSteps[matrixSteps.length - 1].matrix).toEqual([
      [{ v: 1 }, { v: 99 }],
      [{ v: 3 }, { v: 4 }],
    ]);

    const changes = steps.flatMap((step) => step.changedCells ?? []);
    expect(changes.some((change) => change.row === 0 && change.col === 1)).toBe(true);
    expect(changes.some((change) => change.row === 0 && change.col === 0)).toBe(false);
    const cellChange = changes.find((change) => change.row === 0 && change.col === 1);
    expect(cellChange?.previousValue).toEqual({ v: 2 });
    expect(cellChange?.value).toEqual({ v: 99 });
  });
});

describe("missing-property typo errors", () => {
  const errorOf = (message: WorkerTraceMessage) => message.error ?? "";

  it("fails arr.lengthhhh with a did-you-mean hint instead of silently returning undefined", async () => {
    const code = `const arr = input.array;
for (let i = 0; i < arr.lengthhhh; i++) {
  console.log(arr[i]);
}
return arr.lengthhhh;`;

    const message = await runTraceInNode(code, JSON.stringify({ array: [1, 2, 3] }));
    expect(message.ok, message.error).toBe(false);
    expect(errorOf(message)).toContain("lengthhhh");
    expect(errorOf(message)).toContain("length");
    expect(errorOf(message)).toContain("did you mean");
  });

  it("suggests the closest key of the input object for object typos", async () => {
    const code = `const graph = input.graph;
return graph.nods;`;

    const message = await runTraceInNode(code, JSON.stringify({ graph: { nodes: [1, 2], edges: [] } }));
    expect(message.ok, message.error).toBe(false);
    expect(errorOf(message)).toContain("nods");
    expect(errorOf(message)).toContain("nodes");
  });

  it("catches string typos like str.lengthhhh", async () => {
    const message = await runTraceInNode(
      `const s = input.s;
return s.lengthhhh;`,
      JSON.stringify({ s: "hello" }),
    );
    expect(message.ok, message.error).toBe(false);
    expect(errorOf(message)).toContain("lengthhhh");
    expect(errorOf(message)).toContain("length");
  });

  it("catches typos on local objects, not just input", async () => {
    const message = await runTraceInNode(
      `const obj = { name: "buffy" };
return obj.nmae;`,
      "{}",
    );
    expect(message.ok, message.error).toBe(false);
    expect(errorOf(message)).toContain("nmae");
    expect(errorOf(message)).toContain("name");
  });

  it("stays silent for correct code and for intentional undefined checks", async () => {
    const good = await runTraceInNode(
      `const arr = input.array;
return arr.length;`,
      JSON.stringify({ array: [1, 2, 3] }),
    );
    expect(good.ok, good.error).toBe(true);
    expect(good.result).toBe(3);

    // Optional-property existence checks are a normal pattern — no error.
    const optional = await runTraceInNode(
      `const node = input.node;
return node.optionalField === undefined;`,
      JSON.stringify({ node: { val: 1 } }),
    );
    expect(optional.ok, optional.error).toBe(true);
    expect(optional.result).toBe(true);

    // Fallback-style reads of fields that genuinely don't exist stay silent.
    const fallback = await runTraceInNode(
      `const graph = input.graph;
return graph.optionalFlag ?? "default";`,
      JSON.stringify({ graph: { nodes: [1], edges: [] } }),
    );
    expect(fallback.ok, fallback.error).toBe(true);
    expect(fallback.result).toBe("default");
  });

  it("allows writing new properties and reading them back", async () => {
    const message = await runTraceInNode(
      `const counts = {};
counts.lengthhhh = 5;
return counts.lengthhhh;`,
      "{}",
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(5);
  });

  it("catches the typo in the loop condition even when the body never runs", async () => {
    const message = await runTraceInNode(
      `const arr = input.array;
for (let i = 0; i < arr.lenght; i++) {
  console.log(arr[i]);
}
return "done";`,
      JSON.stringify({ array: [1, 2, 3] }),
    );
    expect(message.ok, message.error).toBe(false);
    expect(errorOf(message)).toContain("lenght");
    expect(errorOf(message)).toContain("length");
  });

  it("keeps linked-list identity (slow === fast) intact", async () => {
    const message = await runTraceInNode(
      byId("middle-of-linked-list").code,
      JSON.stringify(byId("middle-of-linked-list").input),
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([3, 4, 5]);
  });
});

describe("dynamic programming trace fields", () => {
  it("fibonacci captures memo table entries", async () => {
    const { steps } = await trace(byId("fibonacci"));
    // At least one step should have a memoTable with entries.
    const memoSteps = steps.filter((step) => step.memoTable && Object.keys(step.memoTable).length > 0);
    expect(memoSteps.length).toBeGreaterThan(0);
    // The final step should have all memo entries filled.
    const lastStep = memoSteps[memoSteps.length - 1];
    expect(Object.keys(lastStep.memoTable!).length).toBeGreaterThanOrEqual(3);
  });

  it("climbing stairs captures memo table entries", async () => {
    const { steps } = await trace(byId("climbing-stairs"));
    const memoSteps = steps.filter((step) => step.memoTable && Object.keys(step.memoTable).length > 0);
    expect(memoSteps.length).toBeGreaterThan(0);
  });

  it("coin change captures dp array entries", async () => {
    const { steps } = await trace(byId("coin-change"));
    // The coin-change template uses a 1D dp array filled bottom-up.
    const dpSteps = steps.filter((step) => step.dpArray && step.dpArray.length > 0);
    expect(dpSteps.length).toBeGreaterThan(0);
  });

  it("house robber captures dp array entries", async () => {
    const { steps } = await trace(byId("house-robber"));
    const dpSteps = steps.filter((step) => step.dpArray && step.dpArray.length > 0);
    expect(dpSteps.length).toBeGreaterThan(0);
  });

  it("LCS captures 2D dp table", async () => {
    const { steps } = await trace(byId("longest-common-subsequence"));
    const tableSteps = steps.filter((step) => step.dpTable && step.dpTable.length > 0);
    expect(tableSteps.length).toBeGreaterThan(0);
    // The table should be (m+1) x (n+1) for input abcde/ace (6x4).
    const lastTable = tableSteps[tableSteps.length - 1].dpTable!;
    expect(lastTable.length).toBe(6);
    expect(lastTable[0].length).toBe(4);
  });

  it("0/1 knapsack captures 2D dp table", async () => {
    const { steps } = await trace(byId("01-knapsack"));
    const tableSteps = steps.filter((step) => step.dpTable && step.dpTable.length > 0);
    expect(tableSteps.length).toBeGreaterThan(0);
  });

  it("edit distance captures 2D dp table", async () => {
    const { steps } = await trace(byId("edit-distance"));
    const tableSteps = steps.filter((step) => step.dpTable && step.dpTable.length > 0);
    expect(tableSteps.length).toBeGreaterThan(0);
    // Table should be (m+1) x (n+1) for horse/ros (6x4).
    const lastTable = tableSteps[tableSteps.length - 1].dpTable!;
    expect(lastTable.length).toBe(6);
    expect(lastTable[0].length).toBe(4);
  });

  it("fibonacci captures recursion tree nodes", async () => {
    const { steps } = await trace(byId("fibonacci"));
    const treeSteps = steps.filter((step) => step.recursionTree && step.recursionTree.length > 0);
    expect(treeSteps.length).toBeGreaterThan(0);
    // The tree should have the root node fib(10).
    const lastTree = treeSteps[treeSteps.length - 1].recursionTree!;
    const rootNodes = lastTree.filter((n) => n.label.includes("10"));
    expect(rootNodes.length).toBeGreaterThanOrEqual(1);
  });
});

describe("graphPath and matrixPath detection", () => {
  it("BFS shortest path: graphPath is populated with the reconstructed path", async () => {
    const code = `const graph = input.graph;
const start = input.start;
const target = input.target;
const prev = {};
const visited = new Set();
const queue = [start];
visited.add(start);
prev[start] = null;

while (queue.length > 0) {
  const node = queue.shift();
  if (node === target) break;
  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      prev[neighbor] = node;
      queue.push(neighbor);
    }
  }
}

const path = [];
let curr = target;
while (curr !== null) {
  path.unshift(curr);
  curr = prev[curr];
}

return path;`;

    const message = await runTraceInNode(
      code,
      JSON.stringify({
        graph: { A: ["B", "C"], B: ["D"], C: ["D"], D: [] },
        start: "A",
        target: "D",
      }),
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual(["A", "B", "D"]);

    const steps = normalizeSteps(message.steps ?? []);
    // The path variable appears during reconstruction — at least the last
    // step with a graph should carry the full graphPath.
    const graphSteps = steps.filter((step) => step.graph);
    expect(graphSteps.length).toBeGreaterThan(0);

    const pathSteps = steps.filter((step) => step.graphPath && step.graphPath.length > 0);
    expect(pathSteps.length).toBeGreaterThan(0);
    const lastPath = pathSteps[pathSteps.length - 1].graphPath!;
    expect(lastPath).toEqual(["A", "B", "D"]);
  });

  it("graphPath is not set when no path variable exists", async () => {
    const code = `const graph = input.graph;
const start = input.start;
const visited = new Set();
const queue = [start];
visited.add(start);

while (queue.length > 0) {
  const node = queue.shift();
  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
}

return [...visited];`;

    const message = await runTraceInNode(
      code,
      JSON.stringify({
        graph: { A: ["B", "C"], B: [], C: [] },
        start: "A",
      }),
    );
    expect(message.ok, message.error).toBe(true);

    const steps = normalizeSteps(message.steps ?? []);
    // No path variable → graphPath should never appear.
    const pathSteps = steps.filter((step) => step.graphPath);
    expect(pathSteps.length).toBe(0);
  });

  it("graphPath with numeric node ids", async () => {
    const code = `const graph = input.graph;
const start = input.start;
const target = input.target;
const prev = {};
const visited = new Set();
const queue = [start];
visited.add(start);
prev[start] = null;

while (queue.length > 0) {
  const node = queue.shift();
  if (node === target) break;
  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      prev[neighbor] = node;
      queue.push(neighbor);
    }
  }
}

const path = [];
let curr = target;
while (curr !== null) {
  path.unshift(curr);
  curr = prev[curr];
}

return path;`;

    const message = await runTraceInNode(
      code,
      JSON.stringify({
        graph: { 0: [1, 2], 1: [3], 2: [3], 3: [] },
        start: 0,
        target: 3,
      }),
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([0, 1, 3]);

    const steps = normalizeSteps(message.steps ?? []);
    const pathSteps = steps.filter((step) => step.graphPath && step.graphPath.length > 0);
    expect(pathSteps.length).toBeGreaterThan(0);
    expect(pathSteps[pathSteps.length - 1].graphPath).toEqual([0, 1, 3]);
  });

  it("minimum path sum: matrixPath is populated with the reconstructed route", async () => {
    const code = `const grid = input.grid;
const m = grid.length;
const n = grid[0].length;
const dp = Array.from({ length: m }, () => Array(n).fill(0));
dp[0][0] = grid[0][0];

for (let i = 1; i < m; i++) dp[i][0] = dp[i - 1][0] + grid[i][0];
for (let j = 1; j < n; j++) dp[0][j] = dp[0][j - 1] + grid[0][j];

for (let i = 1; i < m; i++) {
  for (let j = 1; j < n; j++) {
    dp[i][j] = grid[i][j] + Math.min(dp[i - 1][j], dp[i][j - 1]);
  }
}

const path = [];
let i = m - 1;
let j = n - 1;
while (i > 0 || j > 0) {
  path.unshift({ row: i, col: j });
  if (i === 0) j--;
  else if (j === 0) i--;
  else if (dp[i - 1][j] < dp[i][j - 1]) i--;
  else j--;
}
path.unshift({ row: 0, col: 0 });

return dp[m - 1][n - 1];`;

    const message = await runTraceInNode(
      code,
      JSON.stringify({
        grid: [
          [1, 3, 1],
          [1, 5, 1],
          [4, 2, 1],
        ],
      }),
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(7);

    const steps = normalizeSteps(message.steps ?? []);
    const matrixSteps = steps.filter((step) => step.matrix);
    expect(matrixSteps.length).toBeGreaterThan(0);

    const pathSteps = steps.filter((step) => step.matrixPath && step.matrixPath.length > 0);
    expect(pathSteps.length).toBeGreaterThan(0);
    const lastPath = pathSteps[pathSteps.length - 1].matrixPath!;
    // Optimal path (right, right, down, down): sum 1+3+1+1+1 = 7
    expect(lastPath).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ]);
  });

  it("matrixPath with [row, col] pair arrays", async () => {
    const code = `const grid = input.grid;
const m = grid.length;
const n = grid[0].length;
const dp = Array.from({ length: m }, () => Array(n).fill(0));
dp[0][0] = grid[0][0];

for (let i = 1; i < m; i++) dp[i][0] = dp[i - 1][0] + grid[i][0];
for (let j = 1; j < n; j++) dp[0][j] = dp[0][j - 1] + grid[0][j];

for (let i = 1; i < m; i++) {
  for (let j = 1; j < n; j++) {
    dp[i][j] = grid[i][j] + Math.min(dp[i - 1][j], dp[i][j - 1]);
  }
}

const path = [];
let i = m - 1;
let j = n - 1;
while (i > 0 || j > 0) {
  path.unshift([i, j]);
  if (i === 0) j--;
  else if (j === 0) i--;
  else if (dp[i - 1][j] < dp[i][j - 1]) i--;
  else j--;
}
path.unshift([0, 0]);

return dp[m - 1][n - 1];`;

    const message = await runTraceInNode(
      code,
      JSON.stringify({
        grid: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      }),
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(12);

    const steps = normalizeSteps(message.steps ?? []);
    const pathSteps = steps.filter((step) => step.matrixPath && step.matrixPath.length > 0);
    expect(pathSteps.length).toBeGreaterThan(0);
    const lastPath = pathSteps[pathSteps.length - 1].matrixPath!;
    // Optimal: (0,0) → (0,1) → (0,2) → (1,2) = 1+2+3+6 = 12
    expect(lastPath).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 2 },
    ]);
  });

  it("matrixPath is not set when no path variable exists", async () => {
    const code = `const grid = input.grid;
const m = grid.length;
const n = grid[0].length;
const dp = Array.from({ length: m }, () => Array(n).fill(0));
dp[0][0] = grid[0][0];

for (let i = 1; i < m; i++) dp[i][0] = dp[i - 1][0] + grid[i][0];
for (let j = 1; j < n; j++) dp[0][j] = dp[0][j - 1] + grid[0][j];

for (let i = 1; i < m; i++) {
  for (let j = 1; j < n; j++) {
    dp[i][j] = grid[i][j] + Math.min(dp[i - 1][j], dp[i][j - 1]);
  }
}

return dp[m - 1][n - 1];`;

    const message = await runTraceInNode(
      code,
      JSON.stringify({
        grid: [
          [1, 3, 1],
          [1, 5, 1],
          [4, 2, 1],
        ],
      }),
    );
    expect(message.ok, message.error).toBe(true);

    const steps = normalizeSteps(message.steps ?? []);
    // No path variable → matrixPath should never appear.
    const pathSteps = steps.filter((step) => step.matrixPath);
    expect(pathSteps.length).toBe(0);
  });

  it("BFS shortest path template traces and produces graphPath", async () => {
    const { steps, result } = await trace(byId("bfs-shortest-path"));
    expect(result).toEqual(["A", "C", "F"]);
    const pathSteps = steps.filter((step) => step.graphPath && step.graphPath.length > 0);
    expect(pathSteps.length).toBeGreaterThan(0);
    expect(pathSteps[pathSteps.length - 1].graphPath).toEqual(["A", "C", "F"]);
  });

  it("minimum path sum template traces and produces matrixPath", async () => {
    const { steps, result } = await trace(byId("minimum-path-sum"));
    expect(result).toBe(7);
    const pathSteps = steps.filter((step) => step.matrixPath && step.matrixPath.length > 0);
    expect(pathSteps.length).toBeGreaterThan(0);
  });
});
