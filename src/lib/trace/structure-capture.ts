import type { VisualStep } from "@/types/visualizer";

/**
 * Shared structure-capture rules for the JS and Python tracers.
 *
 * Both tracers must detect heap/queue/stack variables identically so the same
 * algorithm traces the same in either language. This module owns:
 *   - the variable-name regexes (exact, multi-char names only)
 *   - the swap/write heuristic for numeric-array snapshots
 *   - the heap slot picker (name + sift-diff + kind detection)
 *
 * NOTE: worker-source.ts embeds its worker code in a template literal — this
 * module is imported and inlined there as plain values (strings/functions),
 * never as template-literal text, so backticks in comments here are safe.
 */

/** Queue-named numeric arrays route to the queue panel (broad includes fallback still exists per-tracer). */
export const QUEUE_NAME_RE = /^(queue|bfsQueue)$/i;
/** Heap/priority-queue named numeric arrays route to the heap panel. */
export const HEAP_NAME_RE = /^(heap|pq|priorityQueue|minHeap|maxHeap)$/i;
/** Stack-named numeric arrays route to the stack panel. */
export const STACK_EXACT_RE = /^(stack|dfsStack)$/i;

export type NumericEntry = [name: string, value: number[]];

export function isNumericArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number" && Number.isFinite(item));
}

/**
 * Finds the queue/heap slots and the generic array slot from a scope snapshot.
 * Specialized names are excluded from the generic pick so a queue alongside
 * nums renders both. Single-letter names (s, q, t) intentionally stay generic.
 */
export function pickCollectionSlots(entries: Array<[string, unknown]>): {
  queueEntry: NumericEntry | undefined;
  heapEntry: NumericEntry | undefined;
  numericArrayEntry: [string, unknown] | undefined;
} {
  const isQueueEntry = (entry: [string, unknown]): entry is NumericEntry =>
    QUEUE_NAME_RE.test(entry[0]) && isNumericArray(entry[1]);
  const isHeapEntry = (entry: [string, unknown]): entry is NumericEntry =>
    HEAP_NAME_RE.test(entry[0]) && isNumericArray(entry[1]) && (entry[1] as number[]).length > 0;
  const queueEntry = entries.find(isQueueEntry);
  const heapEntry = entries.find(isHeapEntry);
  const numericArrayEntry = entries.find(
    ([name, value]) =>
      !QUEUE_NAME_RE.test(name) && !HEAP_NAME_RE.test(name) && !STACK_EXACT_RE.test(name) && isNumericArray(value),
  );
  return { queueEntry, heapEntry, numericArrayEntry };
}

/**
 * One array snapshot vs the previous: exactly two positions exchanging content
 * is a swap; any other change counts each touched position as a write.
 */
export function countArrayDelta(
  previous: Array<string | number> | number[] | undefined,
  current: Array<string | number> | number[] | undefined,
): { swaps: number; writes: number; changedIndices: number[] } {
  if (!Array.isArray(previous) || !Array.isArray(current)) {
    return { swaps: 0, writes: 0, changedIndices: [] };
  }
  const changedIndices: number[] = [];
  const length = Math.max(previous.length, current.length);
  for (let index = 0; index < length; index++) {
    if (previous[index] !== current[index]) changedIndices.push(index);
  }
  if (
    changedIndices.length === 2 &&
    previous[changedIndices[0]] === current[changedIndices[1]] &&
    previous[changedIndices[1]] === current[changedIndices[0]]
  ) {
    return { swaps: 1, writes: 0, changedIndices };
  }
  return { swaps: 0, writes: changedIndices.length, changedIndices };
}

/**
 * Builds the step.heap slot from the picked heap entry: diff vs the previous
 * heap of the same name drives sift highlighting (heapActive) and the ops
 * counters. Min/max is inferred from the root-vs-child relationship.
 */
export function buildHeapSlot(
  heapEntry: NumericEntry,
  previousHeap: VisualStep["heap"],
): { heap: NonNullable<VisualStep["heap"]>; heapActive?: number[]; swaps: number; writes: number } {
  const [name, value] = heapEntry;
  const previousItems = previousHeap?.name === name ? previousHeap.items : undefined;
  const delta = countArrayDelta(previousItems, value);
  const looksMin = value.length < 2 || value[0] <= value[1];
  const result: { heap: NonNullable<VisualStep["heap"]>; heapActive?: number[]; swaps: number; writes: number } = {
    heap: { items: value, kind: looksMin ? "min" : "max", name },
    swaps: delta.swaps,
    writes: delta.writes,
  };
  if (delta.changedIndices.length) result.heapActive = delta.changedIndices;
  return result;
}
