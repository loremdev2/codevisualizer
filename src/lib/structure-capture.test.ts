import { describe, expect, it } from "vitest";

import { normalizeSteps } from "@/lib/trace/normalize";
import { runTraceInNode, type WorkerTraceMessage } from "./trace-runner";
import type { VisualStep } from "@/types/visualizer";

/**
 * Golden tests for the specialized structure capture added for heap, stack,
 * and queue canvas panels, plus the execution-state fallback for
 * structure-less traces.
 *
 * Each case runs real code through the same worker source the browser uses
 * (runTraceInNode builds the worker from worker-source.ts), then asserts on
 * the normalized VisualStep shape the canvas renders from.
 */
async function trace(code: string, inputText = "{}"): Promise<VisualStep[]> {
  const message: WorkerTraceMessage = await runTraceInNode(code, inputText);
  expect(message.ok, message.error ?? "trace failed").toBe(true);
  return normalizeSteps(message.steps ?? []);
}

describe("heap capture", () => {
  it("captures a heap-named numeric array as step.heap with min kind", async () => {
    const steps = await trace(`
      const heap = [1, 3, 2];
      return heap;
    `);
    const heapStep = steps.find((step) => step.heap);
    expect(heapStep).toBeDefined();
    expect(heapStep?.heap?.items).toEqual([1, 3, 2]);
    expect(heapStep?.heap?.kind).toBe("min");
    expect(heapStep?.heap?.name).toBe("heap");
    // The heap must NOT also be captured as a generic array.
    expect(heapStep?.array).toBeUndefined();
  });

  it("detects max-heap ordering when the root is larger than children", async () => {
    const steps = await trace(`
      const maxHeap = [9, 5, 3];
      return maxHeap;
    `);
    const heapStep = steps.find((step) => step.heap);
    expect(heapStep?.heap?.kind).toBe("max");
    expect(heapStep?.heap?.name).toBe("maxHeap");
  });

  it("captures pq and priorityQueue names too", async () => {
    const pqSteps = await trace(`
      const pq = [2, 4];
      return pq;
    `);
    expect(pqSteps.some((step) => step.heap?.name === "pq")).toBe(true);

    const pqSteps2 = await trace(`
      const priorityQueue = [2, 4];
      return priorityQueue;
    `);
    expect(pqSteps2.some((step) => step.heap?.name === "priorityQueue")).toBe(true);
  });

  it("counts a sift-up swap in the ops counters", async () => {
    const steps = await trace(`
      const heap = [5];
      heap.push(1);
      let i = heap.length - 1;
      while (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        if (heap[i] >= heap[parent]) break;
        [heap[i], heap[parent]] = [heap[parent], heap[i]];
        i = parent;
      }
      return heap;
    `);
    const swapStep = steps.find((step) => (step.ops?.swaps ?? 0) > 0);
    expect(swapStep).toBeDefined();
    // The swapped cells are highlighted for the heap panel.
    expect(swapStep?.heapActive?.length).toBe(2);
    // The heap after the swap is [1, 5].
    expect(swapStep?.heap?.items).toEqual([1, 5]);
  });

  it("counts a heap write (push without swap) as a write", async () => {
    const steps = await trace(`
      const heap = [1, 2];
      heap.push(5);
      return heap;
    `);
    const pushStep = steps.find((step) => step.heap?.items.length === 3);
    expect(pushStep).toBeDefined();
    expect(pushStep?.ops?.writes).toBe(1);
    expect(pushStep?.heapActive).toEqual([2]);
  });

  it("does not confuse a heap with a generic array used in the same trace", async () => {
    const steps = await trace(`
      const nums = [3, 1];
      const heap = [7];
      nums[0] = 10;
      return { nums, heap };
    `);
    // Look at the LAST array step (after the mutation), not the declaration.
    const arraySteps = steps.filter((step) => step.array);
    expect(arraySteps.length).toBeGreaterThan(0);
    expect(arraySteps[0].arrayName).toBe("nums");
    expect(arraySteps[arraySteps.length - 1].array).toEqual([10, 1]);
    const heapStep = steps.find((step) => step.heap);
    expect(heapStep?.heap?.name).toBe("heap");
  });

  it("diffs against the previous heap only when the name matches", async () => {
    const steps = await trace(`
      const heap = [4];
      heap.push(2);
      return heap;
    `);
    // First heap step: no previous heap → no heapActive, no swap/write counting.
    const firstHeap = steps.find((step) => step.heap);
    expect(firstHeap?.heap?.items).toEqual([4]);
    expect(firstHeap?.heapActive).toBeUndefined();
  });

  it("ignores empty heap arrays (nothing to draw as a tree)", async () => {
    const steps = await trace(`
      const heap = [];
      return heap;
    `);
    expect(steps.every((step) => !step.heap)).toBe(true);
  });
});

describe("queue capture", () => {
  it("captures a queue-named numeric array as step.queue, not step.array", async () => {
    const steps = await trace(`
      const queue = [];
      queue.push(1);
      queue.push(2);
      const first = queue.shift();
      return queue;
    `);
    // Final queue state: pushed 1, 2, shifted one → [2].
    const queueSteps = steps.filter((step) => step.queue);
    expect(queueSteps.length).toBeGreaterThan(0);
    expect(queueSteps[0].queueName).toBe("queue");
    expect(queueSteps[queueSteps.length - 1].queue).toEqual([2]);
    expect(queueSteps.every((step) => step.array === undefined)).toBe(true);
  });

  it("renders a queue alongside a regular array without eating it", async () => {
    const steps = await trace(`
      const queue = [9];
      const nums = [1, 2];
      nums[0] = 5;
      return nums;
    `);
    const queueStep = steps.find((step) => step.queue);
    expect(queueStep?.queue).toEqual([9]);
    const arraySteps = steps.filter((step) => step.array);
    // The array must still be captured even though queue is in scope.
    expect(arraySteps[0].arrayName).toBe("nums");
    expect(arraySteps[arraySteps.length - 1].array).toEqual([5, 2]);
  });

  it("captures bfsQueue naming", async () => {
    const steps = await trace(`
      const bfsQueue = [3];
      return bfsQueue;
    `);
    const queueStep = steps.find((step) => step.queue);
    expect(queueStep?.queueName).toBe("bfsQueue");
  });

  it("an empty queue still captures so the panel can show 'empty'", async () => {
    const steps = await trace(`
      const queue = [];
      return queue;
    `);
    const queueStep = steps.find((step) => step.queue);
    expect(queueStep?.queue).toEqual([]);
  });
});

describe("stack capture", () => {
  it("captures a stack-named numeric array as step.stack even with a regular array present", async () => {
    const steps = await trace(`
      const stack = [];
      stack.push(5);
      stack.push(10);
      const nums = [7];
      return stack;
    `);
    const stackSteps = steps.filter((step) => step.stack);
    expect(stackSteps.length).toBeGreaterThan(0);
    expect(stackSteps[0].stackName).toBe("stack");
    expect(stackSteps[stackSteps.length - 1].stack).toEqual([5, 10]);
    const arrayStep = steps.find((step) => step.array);
    expect(arrayStep?.arrayName).toBe("nums");
  });

  it("captures dfsStack but keeps single-letter s generic (too ambiguous)", async () => {
    const dfsSteps = await trace(`
      const dfsStack = [1];
      return dfsStack;
    `);
    expect(dfsSteps.some((step) => step.stackName === "dfsStack")).toBe(true);

    // A bare `s` array stays a generic array — single letters are too
    // ambiguous (LeetCode uses s for strings, and the string panel owns it).
    const sSteps = await trace(`
      const s = [4];
      return s;
    `);
    const sArrayStep = sSteps.find((step) => step.array);
    expect(sArrayStep?.arrayName).toBe("s");
    expect(sSteps.every((step) => !step.stack)).toBe(true);
  });

  it("a matrix named grid is never misrouted to stack/queue", async () => {
    const steps = await trace(`
      const grid = [[1, 2], [3, 4]];
      return grid;
    `);
    const matrixStep = steps.find((step) => step.matrix);
    expect(matrixStep?.matrix).toEqual([[1, 2], [3, 4]]);
    expect(steps.every((step) => !step.stack && !step.queue)).toBe(true);
  });

  it("valid-parentheses-style string stacks still capture (non-numeric)", async () => {
    const steps = await trace(`
      const stack = [];
      stack.push("(");
      stack.push("[");
      return stack;
    `);
    const stackSteps = steps.filter((step) => step.stack);
    expect(stackSteps[stackSteps.length - 1].stack).toEqual(["(", "["]);
  });
});

describe("execution-state fallback (structure-less traces)", () => {
  it("scalar variables land in pointers so the fallback panel can render them", async () => {
    const steps = await trace(`
      let x = 0;
      let total = 0;
      for (let i = 1; i <= 3; i++) {
        x = x + i;
        total = total + x;
      }
      return total;
    `);
    // x: 1, 3, 6 and total: 1, 4, 10 across the loop — the final step of the
    // loop body must carry both as named scalars for the fallback panel.
    const finalLoopStep = steps.find((step) => step.pointers?.total === 10);
    expect(finalLoopStep).toBeDefined();
    expect(finalLoopStep?.pointers?.x).toBe(6);
  });

  it("a trace with no structures and no scalars still produces steps without panels", async () => {
    const steps = await trace(`
      const a = 1;
      return a;
    `);
    expect(steps.length).toBeGreaterThan(0);
    // Every step is structureless → the canvas will show the execution-state
    // panel (pointers present) rather than the dead-end message.
    expect(steps.every((step) => !step.array && !step.heap && !step.stack && !step.queue)).toBe(true);
  });

  it("return values are captured for the fallback panel", async () => {
    const steps = await trace(`
      const n = 6;
      return n * 7;
    `);
    const returnStep = steps.find((step) => step.returnValue !== undefined);
    expect(returnStep?.returnValue).toBe("42");
  });
});

describe("normalizer round-trip", () => {
  it("normalizeSteps preserves heap snapshots through the whitelist", () => {
    const normalized = normalizeSteps([
      {
        title: "Line 1",
        line: 1,
        heap: { items: [1, 3, 2], kind: "min", name: "heap" },
        heapActive: [0, 1],
      },
    ]);
    expect(normalized[0].heap).toEqual({ items: [1, 3, 2], kind: "min", name: "heap" });
    expect(normalized[0].heapActive).toEqual([0, 1]);
  });

  it("normalizeSteps drops malformed heap payloads (fails closed)", () => {
    const normalized = normalizeSteps([
      { heap: "not-an-object" },
      { heap: { items: "not-an-array", kind: "min", name: "heap" } },
      { heap: { items: [], kind: "min", name: "heap" } },
      { heap: { items: [1, 2], kind: "sideways", name: "heap" } }, // bad kind → coerced to min
    ]);
    expect(normalized[0].heap).toBeUndefined();
    expect(normalized[1].heap).toBeUndefined();
    expect(normalized[2].heap).toBeUndefined();
    // Unknown kind coerces to the min default rather than passing through.
    expect(normalized[3].heap?.kind).toBe("min");
  });

  it("normalizeSteps keeps stack/queue string items intact", () => {
    const normalized = normalizeSteps([
      { stack: ["(", "["], queue: [1, "a"] },
    ]);
    expect(normalized[0].stack).toEqual(["(", "["]);
    expect(normalized[0].queue).toEqual([1, "a"]);
  });
});
