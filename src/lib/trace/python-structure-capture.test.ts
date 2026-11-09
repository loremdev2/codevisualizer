import { execFileSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { buildPythonSteps } from "./python-steps";
import { PYTHON_HARNESS } from "./python-worker-source";
import type { VisualStep } from "@/types/visualizer";

/**
 * Python twin of src/lib/structure-capture.test.ts.
 *
 * Runs REAL student code (heapq, deque, manual sift) through the actual
 * Python trace harness — the same PYTHON_HARNESS string the Pyodide worker
 * executes — under a local python3 interpreter, then feeds the raw events
 * through buildPythonSteps exactly as the browser does. This proves the
 * shared structure-capture rules behave identically in both languages.
 *
 * NOTE: Python sys.settrace fires line events BEFORE a line executes, and
 * C-level operations (heapq.heapify/heappush/heappop) happen atomically
 * between line events. Intermediate sift states are invisible — only the
 * state BEFORE and AFTER a line is captured. This matches what the app
 * actually shows users.
 */

const pythonOk = (() => {
  try {
    execFileSync("python3", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

function tracePython(studentCode: string): VisualStep[] {
  // Line events fire BEFORE each line executes, so a trailing no-op line
  // is needed to capture the post-mutation state of the final statement.
  const code = studentCode + "\ndone = True";
  const script = [
    "__student_code = " + JSON.stringify(code),
    "__input_json = '{}'",
    PYTHON_HARNESS,
    "import sys; sys.stdout.write(__steps_json)",
  ].join("\n");
  const raw = execFileSync("python3", ["-c", script], {
    encoding: "utf8",
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  const events = JSON.parse(raw) as Array<Record<string, unknown>>;
  const { steps } = buildPythonSteps(events);
  return steps;
}

/** Last step where the given field is defined (post-mutation state). */
function lastWith<T extends keyof VisualStep>(steps: VisualStep[], field: T): VisualStep | undefined {
  return [...steps].reverse().find((s) => s[field] !== undefined && s[field] !== null);
}

describe.skipIf(!pythonOk)("Python structure capture (real trace harness)", () => {
  it("captures a heapq list as step.heap with min kind", () => {
    // heap = [1,3,2] is already a valid min-heap; heapify keeps it unchanged.
    // The heap panel must still show it with correct kind/name.
    const steps = tracePython([
      "import heapq",
      "heap = [1, 3, 2]",
      "heapq.heapify(heap)",
    ].join("\n"));
    const heapStep = lastWith(steps, "heap");
    expect(heapStep).toBeDefined();
    expect(heapStep?.heap?.items).toEqual([1, 3, 2]);
    expect(heapStep?.heap?.kind).toBe("min");
    expect(heapStep?.heap?.name).toBe("heap");
    // The heap must NOT also be captured as a generic array.
    expect(heapStep?.array).toBeUndefined();
  });

  it("heapify reorders an invalid heap and captures the result", () => {
    const steps = tracePython([
      "import heapq",
      "heap = [3, 1, 2]",
      "heapq.heapify(heap)",
    ].join("\n"));
    const heapStep = lastWith(steps, "heap");
    expect(heapStep?.heap?.items).toEqual([1, 3, 2]);
    expect(heapStep?.heap?.kind).toBe("min");
  });

  it("heappush counts push as writes (C-level sift is atomic at line granularity)", () => {
    // Line-level tracing: C heappush is atomic — intermediate sift swaps
    // between the [5] → [1,5] transition are invisible. countArrayDelta
    // sees the state before vs after the line and counts writes.
    const steps = tracePython([
      "import heapq",
      "heap = [5]",
      "heapq.heappush(heap, 1)",
    ].join("\n"));
    const heapStep = lastWith(steps, "heap");
    expect(heapStep?.heap?.items).toEqual([1, 5]);
    expect(heapStep?.heap?.kind).toBe("min");
    // Push counted as writes (the 2 changed positions: 0 and 1).
    expect((heapStep?.ops?.writes ?? 0) > 0 || (heapStep?.ops?.swaps ?? 0) > 0).toBe(true);
  });

  it("heappop captures the post-pop heap state", () => {
    // C heappop is atomic — no intermediate sift-down visible.
    const steps = tracePython([
      "import heapq",
      "heap = [1, 5, 3]",
      "popped = heapq.heappop(heap)",
    ].join("\n"));
    const heapStep = lastWith(steps, "heap");
    expect(heapStep?.heap?.items).toEqual([3, 5]);
    expect(heapStep?.heap?.kind).toBe("min");
    expect((heapStep?.ops?.writes ?? 0) > 0 || (heapStep?.ops?.swaps ?? 0) > 0).toBe(true);
  });

  it("hand-written sift-up counts a swap (swap spans two line events)", () => {
    // A manual swap on its own line IS visible: the swap line event shows
    // the state BEFORE the swap, and the next event shows the state AFTER.
    // countArrayDelta sees the exchange and counts it as 1 swap.
    const steps = tracePython([
      "heap = [5, 3, 1]",
      "i = 2",
      "parent = (i - 1) // 2",
      "heap[i], heap[parent] = heap[parent], heap[i]",
    ].join("\n"));
    const swapStep = steps.find((step) => (step.ops?.swaps ?? 0) > 0);
    expect(swapStep).toBeDefined();
    expect(swapStep?.heapActive?.length).toBe(2);
    expect(swapStep?.heap?.items).toEqual([1, 3, 5]);
  });

  it("captures pq and maxHeap names too", () => {
    const pqSteps = tracePython([
      "import heapq",
      "pq = [2, 4]",
      "heapq.heapify(pq)",
    ].join("\n"));
    expect(pqSteps.some((step) => step.heap?.name === "pq")).toBe(true);

    const maxSteps = tracePython([
      "maxHeap = [9, 5, 3]",
    ].join("\n"));
    const heapStep = lastWith(maxSteps, "heap");
    expect(heapStep?.heap?.kind).toBe("max");
    expect(heapStep?.heap?.name).toBe("maxHeap");
  });

  it("routes a collections.deque named queue to step.queue while a plain array coexists", () => {
    const steps = tracePython([
      "from collections import deque",
      "nums = [3, 1]",
      "queue = deque([3, 4])",
      "queue.append(5)",
      "queue.popleft()",
      "nums[0] = 10",
    ].join("\n"));
    const queueStep = lastWith(steps, "queue");
    expect(queueStep).toBeDefined();
    expect(queueStep?.queueName).toBe("queue");
    expect(queueStep?.queue).toEqual([4, 5]);
    // The generic array pick excludes queue-named entries, so nums still
    // gets its own array panel alongside.
    const lastArray = lastWith(steps, "array");
    expect(lastArray).toBeDefined();
    expect(lastArray?.arrayName).toBe("nums");
    expect(lastArray?.array).toEqual([10, 1]);
  });

  it("captures a list used as a stack (append/pop) alongside a regular array", () => {
    const steps = tracePython([
      "nums = [3, 1]",
      "stack = []",
      "stack.append(1)",
      "stack.append(2)",
      "stack.pop()",
      "nums[0] = 7",
    ].join("\n"));
    // The generic array pick excludes stack-named entries, so nums still
    // gets its own array panel.
    const lastArray = lastWith(steps, "array");
    expect(lastArray).toBeDefined();
    expect(lastArray?.arrayName).toBe("nums");
    expect(lastArray?.array).toEqual([7, 1]);
  });

  it("keeps a bare 's' list generic (no stack capture)", () => {
    const steps = tracePython([
      "s = [3, 1]",
      "s.append(4)",
    ].join("\n"));
    expect(steps.some((step) => step.arrayName === "s")).toBe(true);
    expect(steps.some((step) => step.queue)).toBe(false);
  });

  it("does not capture an empty heap list as a heap panel", () => {
    const steps = tracePython([
      "import heapq",
      "heap = []",
      "heapq.heapify(heap)",
    ].join("\n"));
    // Empty numeric heap candidates are skipped by pickCollectionSlots.
    expect(steps.some((step) => step.heap)).toBe(false);
  });
});
