import { describe, expect, it } from "vitest";

import {
  buildHeapSlot,
  countArrayDelta,
  isNumericArray,
  pickCollectionSlots,
  QUEUE_NAME_RE,
  HEAP_NAME_RE,
  STACK_EXACT_RE,
} from "./structure-capture";

// ---------------------------------------------------------------------------
// pickCollectionSlots boundary cases
// ---------------------------------------------------------------------------
describe("pickCollectionSlots", () => {
  it("returns all-undefined for empty entries", () => {
    const result = pickCollectionSlots([]);
    expect(result.queueEntry).toBeUndefined();
    expect(result.heapEntry).toBeUndefined();
    expect(result.numericArrayEntry).toBeUndefined();
  });

  it("does not steal a queue-named entry into numericArrayEntry", () => {
    const entries: Array<[string, unknown]> = [
      ["queue", [1, 2, 3]],
      ["nums", [4, 5, 6]],
    ];
    const result = pickCollectionSlots(entries);
    expect(result.queueEntry?.[0]).toBe("queue");
    expect(result.numericArrayEntry?.[0]).toBe("nums");
  });

  it("does not steal a heap-named entry into numericArrayEntry", () => {
    const entries: Array<[string, unknown]> = [
      ["heap", [3, 1, 2]],
      ["arr", [10, 20]],
    ];
    const result = pickCollectionSlots(entries);
    expect(result.heapEntry?.[0]).toBe("heap");
    expect(result.numericArrayEntry?.[0]).toBe("arr");
  });

  it("does not steal a stack-named entry into numericArrayEntry", () => {
    const entries: Array<[string, unknown]> = [
      ["stack", [1, 2]],
      ["data", [3, 4]],
    ];
    const result = pickCollectionSlots(entries);
    expect(result.numericArrayEntry?.[0]).toBe("data");
    // stack is not returned by pickCollectionSlots (no stackEntry field)
    expect(result.queueEntry).toBeUndefined();
    expect(result.heapEntry).toBeUndefined();
  });

  it("heap entry with length 0 is excluded", () => {
    const entries: Array<[string, unknown]> = [["heap", []]];
    const result = pickCollectionSlots(entries);
    expect(result.heapEntry).toBeUndefined();
  });

  it("heap entry with length 1 is included", () => {
    const entries: Array<[string, unknown]> = [["heap", [5]]];
    const result = pickCollectionSlots(entries);
    expect(result.heapEntry?.[1]).toEqual([5]);
  });

  it("queue entry with length 0 IS included (empty queue is valid)", () => {
    const entries: Array<[string, unknown]> = [["queue", []]];
    const result = pickCollectionSlots(entries);
    expect(result.queueEntry?.[0]).toBe("queue");
    expect(result.queueEntry?.[1]).toEqual([]);
  });

  it("non-numeric array is not picked as any slot", () => {
    const entries: Array<[string, unknown]> = [
      ["queue", ["a", "b"]],
      ["heap", [true, false]],
      ["nums", ["x", "y"]],
    ];
    const result = pickCollectionSlots(entries);
    expect(result.queueEntry).toBeUndefined();
    expect(result.heapEntry).toBeUndefined();
    expect(result.numericArrayEntry).toBeUndefined();
  });

  it("single-letter names stay generic (not stolen by specialized regexes)", () => {
    const entries: Array<[string, unknown]> = [["q", [1, 2]]];
    const result = pickCollectionSlots(entries);
    // "q" does not match QUEUE_NAME_RE which is /^(queue|bfsQueue)$/i
    expect(result.queueEntry).toBeUndefined();
    expect(result.numericArrayEntry?.[0]).toBe("q");
  });

  it("NaN and Infinity arrays are excluded", () => {
    const entries: Array<[string, unknown]> = [
      ["nums", [1, NaN, 3]],
      ["data", [1, Infinity]],
    ];
    const result = pickCollectionSlots(entries);
    expect(result.numericArrayEntry).toBeUndefined();
  });

  it("first matching queue wins (entries order matters)", () => {
    const entries: Array<[string, unknown]> = [
      ["queue", [1]],
      ["bfsQueue", [2]],
    ];
    const result = pickCollectionSlots(entries);
    expect(result.queueEntry?.[0]).toBe("queue");
  });

  it("first matching heap wins", () => {
    const entries: Array<[string, unknown]> = [
      ["pq", [1]],
      ["heap", [2]],
    ];
    const result = pickCollectionSlots(entries);
    expect(result.heapEntry?.[0]).toBe("pq");
  });
});

// ---------------------------------------------------------------------------
// countArrayDelta boundary cases
// ---------------------------------------------------------------------------
describe("countArrayDelta", () => {
  it("both undefined → zeros", () => {
    expect(countArrayDelta(undefined, undefined)).toEqual({ swaps: 0, writes: 0, changedIndices: [] });
  });

  it("previous undefined, current defined → zeros (no prior state to diff against)", () => {
    const result = countArrayDelta(undefined, [1, 2, 3]);
    expect(result.writes).toBe(0);
    expect(result.swaps).toBe(0);
  });

  it("previous defined, current undefined → zeros (no current state to diff)", () => {
    const result = countArrayDelta([1, 2, 3], undefined);
    expect(result.writes).toBe(0);
    expect(result.swaps).toBe(0);
  });

  it("identical arrays → zeros", () => {
    const arr = [1, 2, 3];
    const result = countArrayDelta(arr, arr);
    expect(result).toEqual({ swaps: 0, writes: 0, changedIndices: [] });
  });

  it("same reference is detected as no changes", () => {
    const arr = [10, 20, 30];
    const result = countArrayDelta(arr, arr);
    expect(result.swaps).toBe(0);
    expect(result.writes).toBe(0);
  });

  it("swap: exactly two positions exchanged → 1 swap", () => {
    const result = countArrayDelta([1, 2, 3], [3, 2, 1]);
    expect(result.swaps).toBe(1);
    expect(result.writes).toBe(0);
    expect(result.changedIndices).toEqual([0, 2]);
  });

  it("swap: two positions in middle → 1 swap", () => {
    const result = countArrayDelta([1, 2, 3, 4], [1, 3, 2, 4]);
    expect(result.swaps).toBe(1);
    expect(result.changedIndices).toEqual([1, 2]);
  });

  it("write: one position changed → 1 write", () => {
    const result = countArrayDelta([1, 2, 3], [1, 9, 3]);
    expect(result.writes).toBe(1);
    expect(result.swaps).toBe(0);
    expect(result.changedIndices).toEqual([1]);
  });

  it("write: three positions changed → 3 writes", () => {
    const result = countArrayDelta([1, 2, 3], [4, 5, 6]);
    expect(result.writes).toBe(3);
    expect(result.swaps).toBe(0);
  });

  it("not a swap: two positions changed but values not exchanged", () => {
    const result = countArrayDelta([1, 2, 3], [2, 1, 4]);
    expect(result.writes).toBe(3); // 3 changed indices
    expect(result.swaps).toBe(0);
  });

  it("length change: array grew", () => {
    const result = countArrayDelta([1, 2], [1, 2, 3]);
    expect(result.writes).toBe(1);
    expect(result.changedIndices).toEqual([2]);
  });

  it("length change: array shrank", () => {
    const result = countArrayDelta([1, 2, 3], [1, 2]);
    expect(result.writes).toBe(1);
    expect(result.changedIndices).toEqual([2]);
  });

  it("empty arrays → zeros", () => {
    expect(countArrayDelta([], [])).toEqual({ swaps: 0, writes: 0, changedIndices: [] });
  });

  it("handles string|number mixed arrays (prev has strings)", () => {
    const result = countArrayDelta(["a", 2, "c"], ["a", "b", "c"]);
    // position 1 changed: 2 → "b"
    expect(result.writes).toBe(1);
    expect(result.changedIndices).toEqual([1]);
  });
});

// ---------------------------------------------------------------------------
// buildHeapSlot edge cases
// ---------------------------------------------------------------------------
describe("buildHeapSlot", () => {
  it("single-element heap → min kind, no diff", () => {
    const result = buildHeapSlot(["heap", [42]], undefined);
    expect(result.heap).toEqual({ items: [42], kind: "min", name: "heap" });
    expect(result.swaps).toBe(0);
    expect(result.writes).toBe(0);
    expect(result.heapActive).toBeUndefined();
  });

  it("two-element: root <= child → min", () => {
    const result = buildHeapSlot(["h", [1, 2]], undefined);
    expect(result.heap.kind).toBe("min");
  });

  it("two-element: root > child → max", () => {
    const result = buildHeapSlot(["h", [5, 1]], undefined);
    expect(result.heap.kind).toBe("max");
  });

  it("previous heap with different name → treats as fresh (no diff)", () => {
    const previous = { items: [1, 2, 3], kind: "min" as const, name: "pq" };
    const result = buildHeapSlot(["heap", [1, 2, 4]], previous);
    // Different name → no previousItems → no delta
    expect(result.swaps).toBe(0);
    expect(result.writes).toBe(0);
    expect(result.heapActive).toBeUndefined();
  });

  it("previous heap same name, values changed → counts writes, exposes heapActive", () => {
    const previous = { items: [1, 2, 3], kind: "min" as const, name: "heap" };
    const result = buildHeapSlot(["heap", [1, 5, 3]], previous);
    expect(result.writes).toBe(1);
    expect(result.heapActive).toEqual([1]);
  });

  it("previous heap same name, values swapped → counts swap", () => {
    const previous = { items: [3, 2, 1], kind: "min" as const, name: "heap" };
    const result = buildHeapSlot(["heap", [1, 2, 3]], previous);
    expect(result.swaps).toBe(1);
  });

  it("kind flips when root-child relationship changes", () => {
    const previous = { items: [1, 5, 3], kind: "min" as const, name: "h" };
    const result = buildHeapSlot(["h", [10, 5, 3]], previous);
    expect(result.heap.kind).toBe("max");
  });
});

// ---------------------------------------------------------------------------
// Regex edge cases
// ---------------------------------------------------------------------------
describe("name regex edge cases", () => {
  it("QUEUE_NAME_RE is case-insensitive", () => {
    expect(QUEUE_NAME_RE.test("Queue")).toBe(true);
    expect(QUEUE_NAME_RE.test("QUEUE")).toBe(true);
    expect(QUEUE_NAME_RE.test("BfsQueue")).toBe(true);
  });

  it("QUEUE_NAME_RE rejects partial matches", () => {
    expect(QUEUE_NAME_RE.test("myqueue")).toBe(false);
    expect(QUEUE_NAME_RE.test("queues")).toBe(false);
    expect(QUEUE_NAME_RE.test("queueItem")).toBe(false);
  });

  it("HEAP_NAME_RE matches all heap variants", () => {
    expect(HEAP_NAME_RE.test("heap")).toBe(true);
    expect(HEAP_NAME_RE.test("pq")).toBe(true);
    expect(HEAP_NAME_RE.test("priorityQueue")).toBe(true);
    expect(HEAP_NAME_RE.test("minHeap")).toBe(true);
    expect(HEAP_NAME_RE.test("maxHeap")).toBe(true);
  });

  it("HEAP_NAME_RE rejects partial matches", () => {
    expect(HEAP_NAME_RE.test("heapify")).toBe(false);
    expect(HEAP_NAME_RE.test("theap")).toBe(false);
    expect(HEAP_NAME_RE.test("myheap")).toBe(false);
  });

  it("STACK_EXACT_RE only matches exact stack names", () => {
    expect(STACK_EXACT_RE.test("stack")).toBe(true);
    expect(STACK_EXACT_RE.test("dfsStack")).toBe(true);
    expect(STACK_EXACT_RE.test("Stack")).toBe(true);
    expect(STACK_EXACT_RE.test("mystack")).toBe(false);
    expect(STACK_EXACT_RE.test("stackBuffer")).toBe(false);
    expect(STACK_EXACT_RE.test("stacks")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isNumericArray boundary cases
// ---------------------------------------------------------------------------
describe("isNumericArray", () => {
  it("rejects non-arrays", () => {
    expect(isNumericArray(null)).toBe(false);
    expect(isNumericArray(undefined)).toBe(false);
    expect(isNumericArray("hello")).toBe(false);
    expect(isNumericArray(42)).toBe(false);
    expect(isNumericArray({})).toBe(false);
  });

  it("rejects arrays with non-numeric items", () => {
    expect(isNumericArray([1, "two", 3])).toBe(false);
    expect(isNumericArray([1, null, 3])).toBe(false);
    expect(isNumericArray([1, undefined, 3])).toBe(false);
  });

  it("rejects NaN and Infinity", () => {
    expect(isNumericArray([1, NaN, 3])).toBe(false);
    expect(isNumericArray([1, Infinity])).toBe(false);
    expect(isNumericArray([-Infinity])).toBe(false);
  });

  it("accepts empty array", () => {
    expect(isNumericArray([])).toBe(true);
  });

  it("accepts valid number arrays", () => {
    expect(isNumericArray([0, -1, 3.14, 100])).toBe(true);
  });
});
