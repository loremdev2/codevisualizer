/**
 * Plain-JS source text for the shared structure-capture rules, inlined into
 * the JS trace worker (worker-source.ts is a template literal, so helpers
 * must ship as source text, not imports).
 *
 * KEEP IN SYNC with ./structure-capture.ts — same regexes, same swap/write
 * heuristic, same heap-slot builder. The twin test suites
 * (structure-capture.test.ts and python structure tests) fail loudly if the
 * two tracers drift.
 */
export const STRUCTURE_CAPTURE_HELPERS = `
// Shared structure-capture rules (single source: structure-capture-source.ts).
// Queue/heap/stack exact-name sets; only unambiguous multi-char names —
// single letters (s, q, t) stay generic to avoid stealing real arrays.
const QUEUE_NAME_RE = /^(queue|bfsQueue)$/i;
const HEAP_NAME_RE = /^(heap|pq|priorityQueue|minHeap|maxHeap)$/i;
const STACK_EXACT_RE = /^(stack|dfsStack)$/i;

// Picks the queue/heap slots and the generic numeric-array slot from a scope
// snapshot. Specialized names are excluded from the generic pick so a queue
// alongside nums renders both.
const pickCollectionSlots = (entries, isNumericArray) => {
  const queueEntry = entries.find(([name, value]) => QUEUE_NAME_RE.test(name) && isNumericArray(value));
  const heapEntry = entries.find(([name, value]) => HEAP_NAME_RE.test(name) && isNumericArray(value) && value.length > 0);
  const numericArrayEntry = entries.find(([name, value]) =>
    !QUEUE_NAME_RE.test(name) && !HEAP_NAME_RE.test(name) && !STACK_EXACT_RE.test(name) && isNumericArray(value),
  );
  return { queueEntry, heapEntry, numericArrayEntry };
};

// One array snapshot vs the previous: exactly two positions exchanging content
// is a swap; any other change counts each touched position as a write.
const countArrayDelta = (previous, current) => {
  if (!Array.isArray(previous) || !Array.isArray(current)) return { swaps: 0, writes: 0, changedIndices: [] };
  const changedIndices = [];
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
};

// Builds the step.heap slot from the picked heap entry: diff vs the previous
// heap of the same name drives sift highlighting (heapActive) and the ops
// counters. Min/max is inferred from the root-vs-child relationship.
const buildHeapSlot = (heapEntry, previousHeap) => {
  const name = heapEntry[0];
  const value = heapEntry[1];
  const previousItems = previousHeap && previousHeap.name === name ? previousHeap.items : undefined;
  const delta = countArrayDelta(previousItems, value);
  const looksMin = value.length < 2 || value[0] <= value[1];
  const result = { heap: { items: value, kind: looksMin ? "min" : "max", name }, swaps: delta.swaps, writes: delta.writes };
  if (delta.changedIndices.length) result.heapActive = delta.changedIndices;
  return result;
};
`;
