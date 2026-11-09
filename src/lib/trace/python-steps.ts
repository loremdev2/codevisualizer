import type { LinkedListStep, TreeStep, VisualStep } from "@/types/visualizer";
import { buildHeapSlot, pickCollectionSlots, QUEUE_NAME_RE, STACK_EXACT_RE } from "./structure-capture";

/**
 * Python tracing → VisualStep mapping.
 *
 * The Pyodide worker runs a `sys.settrace` harness that records one raw event
 * per traced line / call / return / print. Those raw events (plain JSON-safe
 * records) come back to the main thread, and `buildPythonSteps` converts them
 * into the same VisualStep schema the JS instrumenter produces — structure
 * detection, pointer arrows, operation counters, and coalescing are all shared
 * logic, kept in plain TS so it's unit-testable without Pyodide.
 */

export type PythonRawEvent = {
  line?: number | null;
  /** JSON-safe snapshot of the visible locals at this point. */
  locals?: Record<string, unknown>;
  /**
   * Node-typed locals (ListNode / TreeNode), serialized by the harness into a
   * shared id map: values/left/right/next/prev by node id, plus `refs` mapping
   * variable names to their node id + kind.
   */
  nodes?: PythonNodeMaps;
  /** Set-typed locals by name (sets serialize to arrays in `locals`, so they're carried here to keep identity). */
  sets?: Record<string, Array<string | number>>;
  /** Recursive call stack labels (innermost last), e.g. ["dfs(node='A')"]. */
  callstack?: Array<string | number>;
  kind?: "line" | "branch" | "call" | "return" | "console";
  /** Human note: source line for branches, frame label for calls, stdout for console. */
  note?: string | null;
  /** Cumulative comparison count as counted by the harness (branch lines with a comparison operator). */
  comparisons?: number;
};

export type PythonNodeMaps = {
  values: Record<string, string | number | boolean | null>;
  next?: Record<string, number | null>;
  left?: Record<string, number | null>;
  right?: Record<string, number | null>;
  prev?: Record<string, number | null>;
  refs?: Record<string, { id: number; kind: "list" | "tree" }>;
};

export type PythonStepsBuildResult = {
  steps: VisualStep[];
  /** True when the event stream hit the cap (large loops are truncated). */
  truncated: boolean;
};

const ROW_NAMES = ["i", "row", "r", "x"];
const COL_NAMES = ["j", "col", "c", "y"];

// Same detection rules as the JS worker: a graph is an object whose values are
// arrays, a hash map is an object whose values are primitives, a matrix is a
// non-empty array of non-empty arrays of primitives/plain objects.
function isGraph(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.values(value);
  return entries.length > 0 && entries.every((item) => Array.isArray(item));
}

function isHashMap(value: unknown): value is Record<string, string | number | boolean | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.values(value);
  return entries.length > 0 && entries.every((item) => isPrimitive(item));
}

function isPrimitive(value: unknown): value is string | number | boolean | null {
  return (
    typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null
  );
}

function isMatrix(value: unknown): value is unknown[][] {
  if (!Array.isArray(value) || value.length === 0) return false;
  for (const row of value) {
    if (!Array.isArray(row) || row.length === 0) return false;
    for (const cell of row) {
      if (cell !== null && typeof cell !== "string" && typeof cell !== "number" && typeof cell !== "boolean") {
        if (typeof cell !== "object" || Array.isArray(cell)) return false;
      }
    }
  }
  return true;
}

/** Two positions exchanged between consecutive snapshots ⇒ a swap, else writes. */
function countArrayDelta(
  previous: number[] | undefined,
  current: number[] | undefined,
): { swaps: number; writes: number } {
  if (!Array.isArray(previous) || !Array.isArray(current)) return { swaps: 0, writes: 0 };
  const changed: number[] = [];
  const length = Math.max(previous.length, current.length);
  for (let index = 0; index < length; index++) {
    if (previous[index] !== current[index]) changed.push(index);
  }
  if (
    changed.length === 2 &&
    previous[changed[0]] === current[changed[1]] &&
    previous[changed[1]] === current[changed[0]]
  ) {
    return { swaps: 1, writes: 0 };
  }
  return { swaps: 0, writes: changed.length };
}

function countStringDelta(previous: string | undefined, current: string | undefined): number {
  if (previous === undefined || current === undefined) return 0;
  const length = Math.max(previous.length, current.length);
  let changed = 0;
  for (let index = 0; index < length; index++) {
    if (previous[index] !== current[index]) changed++;
  }
  return changed;
}

function countMatrixDelta(previous: unknown[][] | undefined, current: unknown[][] | undefined): number {
  if (!previous || !current) return 0;
  let changed = 0;
  for (let row = 0; row < current.length; row++) {
    const prevRow = previous[row];
    const currRow = current[row];
    if (!Array.isArray(prevRow) || !Array.isArray(currRow)) continue;
    for (let col = 0; col < currRow.length; col++) {
      if (!cellsEqual(prevRow[col], currRow[col])) changed++;
    }
  }
  return changed;
}

function cellsEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asNumbers(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const numbers = value.map((item) => Number(item));
  return numbers.every((item) => Number.isFinite(item)) ? numbers : undefined;
}

/**
 * Converts the raw event stream into VisualSteps. Pure — no Pyodide, no worker.
 * Mirrors the JS instrumenter's `makeAutoStep` structure detection and the
 * worker's `emit` coalescing so Python and JavaScript traces render identically.
 */
type StepCounters = { swaps: number; writes: number };

export function buildPythonSteps(
  rawEvents: PythonRawEvent[],
  options: { maxSteps?: number } = {},
): PythonStepsBuildResult {
  const maxSteps = options.maxSteps ?? 3000;
  const steps: VisualStep[] = [];
  const counters: StepCounters = { swaps: 0, writes: 0 };
  let truncated = false;

  for (const raw of rawEvents) {
    if (steps.length >= maxSteps) {
      truncated = true;
      break;
    }

    const step = mapRawEvent(raw, steps[steps.length - 1], counters);
    if (!step) continue;

    const previous = steps[steps.length - 1];
    const previousBody = previous ? { ...previous } : undefined;
    if (previousBody) delete previousBody.id;
    const nextBody = { ...step };
    delete nextBody.id;
    if (previousBody && JSON.stringify(previousBody) === JSON.stringify(nextBody)) continue;

    steps.push(step);
  }

  return { steps, truncated };
}

// The header card renders the note under a fixed-height block so the layout
// stays stable across steps — keep long statements (a full Python source line)
// from wrapping the header taller mid-trace, same truncation the JS
// instrumenter applies to statement labels.
function truncateNote(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  return text.length > 100 ? text.slice(0, 97) + "…" : text;
}

function mapRawEvent(
  raw: PythonRawEvent,
  previous: VisualStep | undefined,
  counters: StepCounters,
): VisualStep | undefined {
  const kind = raw.kind ?? "line";
  const line = raw.line ?? undefined;
  const locals = raw.locals ?? {};
  const entries = Object.entries(locals);
  const comparisons = raw.comparisons ?? 0;
  const ops = (): VisualStep["ops"] => ({ comparisons, swaps: counters.swaps, writes: counters.writes });

  // Console output from print() — interleaved in trace order by the harness.
  if (kind === "console") {
    if (!raw.note) return undefined;
    return { title: "Console", note: raw.note, line, ops: ops() };
  }

  const callStack = raw.callstack?.length ? raw.callstack : undefined;
  const note = truncateNote(raw.note);

  if (kind === "call") {
    return {
      title: note ? `Call ${note}` : "Call",
      note,
      line,
      callStack,
      pointers: pointerSnapshot(locals),
      ops: ops(),
    };
  }
  if (kind === "return") {
    return {
      title: "Return",
      note,
      line,
      callStack,
      pointers: pointerSnapshot(locals),
      ops: ops(),
    };
  }

  // The harness injects the input JSON as a global "input" — exclude it from
  // structure detection, same as the JS instrumenter does for hash maps.
  const graphEntry = entries.find(([name, value]) => name !== "input" && isGraph(value));
  const stringEntry = entries.find(([, value]) => typeof value === "string");
  const hashMapEntry = entries.find(([name, value]) => name !== "input" && isHashMap(value));
  // Same shared collection-slot rules as the JS worker: heap/queue exact names
  // route to their specialized slots; the generic array pick skips them.
  const { queueEntry, heapEntry, numericArrayEntry } = pickCollectionSlots(entries);
  const matrixEntry =
    entries.find(([name, value]) => /^(matrix|grid|board|mat)$/i.test(name) && isMatrix(value)) ??
    entries.find(([, value]) => isMatrix(value));

  const step: VisualStep = {
    title: kind === "branch" ? "Branch" : `Line ${line ?? ""}`.trim(),
    // Line events carry the harness's source line as the note (mirroring the
    // JS instrumenter's statement labels), so the header shows what the code
    // is doing instead of a generic fallback string.
    note,
    line,
    pointers: pointerSnapshot(locals),
    callStack,
    ops: ops(),
  };

  for (const [name, value] of entries) {
    if (value instanceof Set) {
      // Never happens here (harness JSON-serializes sets), kept for parity.
      const items = Array.from(value);
      if (name.toLowerCase().includes("visit")) step.visited = items;
      else step[name.toLowerCase().includes("queue") ? "queue" : "stack"] = items;
    }

    // Exact-name stacks/queues capture even when a generic array exists,
    // matching the JS worker's behavior (STACK_EXACT_RE bypasses the
    // numericArrayEntry guard). Broad-name fallbacks (.includes) are gated
    // by !numericArrayEntry so ambiguous single-letter or compound names
    // don't steal the generic array slot.
    if (Array.isArray(value) && !isMatrix(value)) {
      if (QUEUE_NAME_RE.test(name)) {
        step.queue = value as Array<string | number>;
        step.queueName = name;
      } else if (STACK_EXACT_RE.test(name)) {
        step.stack = value as Array<string | number>;
        step.stackName = name;
      } else if (!numericArrayEntry && name.toLowerCase().includes("stack")) {
        step.stack = value as Array<string | number>;
        step.stackName = name;
      } else if (!numericArrayEntry && name.toLowerCase().includes("visit")) {
        step.visited = value as Array<string | number>;
        step.visitedName = name;
      } else if (!numericArrayEntry && name.toLowerCase().includes("frontier")) {
        step.frontier = value as Array<string | number>;
      }
    }
  }

  // Sets captured by identity (raw.sets) — render as Sets, never as arrays.
  const setEntries = Object.entries(raw.sets ?? {});
  if (setEntries.length > 0) {
    const [name, items] = setEntries[0];
    step.setName = name;
    step.set = items;
    // Mirror the JS tracer's name routing so the visualization's visited
    // markers keep working for DFS (the panel dedups by name).
    if (name.toLowerCase().includes("visit")) step.visited = items;
    else if (name.toLowerCase().includes("queue")) step.queue = items;
    else step.stack = items;
  }

  if (numericArrayEntry) {
    step.arrayName = numericArrayEntry[0];
    step.array = asNumbers(numericArrayEntry[1]) ?? [];
    // Data-driven active cells: every numeric local whose value lands in
    // bounds — known index names and custom ones alike.
    const activeSet = new Set<number>();
    for (const value of Object.values(locals)) {
      const numeric = asNumber(value);
      if (numeric !== undefined && Number.isInteger(numeric) && numeric >= 0 && numeric < step.array!.length) {
        activeSet.add(numeric);
      }
    }
    step.active = Array.from(activeSet);

    const left = locals.left ?? locals.low ?? locals.start;
    const right = locals.right ?? locals.high ?? locals.end;
    if (asNumber(left) !== undefined && asNumber(right) !== undefined) {
      step.range = [asNumber(left)!, asNumber(right)!];
    }

    const delta = countArrayDelta(previous?.array, step.array);
    counters.swaps += delta.swaps;
    counters.writes += delta.writes;
    step.ops = ops();
  }

  // Heap capture — same shared rule as the JS worker: heap-named numeric
  // arrays (heapq lists, pq) get the tree panel with sift diffs counted into
  // the ops counters. heappush/heappop are plain list mutations to the
  // sys.settrace harness, so the diff sees sift swaps for free.
  if (heapEntry) {
    const items = asNumbers(heapEntry[1]);
    if (items) {
      const built = buildHeapSlot([heapEntry[0], items], previous?.heap);
      step.heap = built.heap;
      if (built.heapActive) step.heapActive = built.heapActive;
      counters.swaps += built.swaps;
      counters.writes += built.writes;
      step.ops = ops();
    }
  }

  // Queue capture — same shared rule as the JS worker: queue-named arrays
  // (deque-as-list, bfsQueue) route to the queue panel independently of
  // the generic numeric array pick, so a queue alongside nums renders both.
  if (queueEntry) {
    const items = asNumbers(queueEntry[1]);
    if (items) {
      step.queue = items;
      step.queueName = queueEntry[0];
    }
  }

  if (stringEntry) {
    step.stringName = stringEntry[0];
    step.string = stringEntry[1] as string;
    const start = locals.start ?? locals.left ?? locals.low;
    const end = locals.end ?? locals.right ?? locals.high;
    if (asNumber(start) !== undefined && asNumber(end) !== undefined) {
      step.window = [asNumber(start)!, asNumber(end)!];
    }
    counters.writes += countStringDelta(previous?.string, step.string);
    step.ops = ops();
  }

  if (matrixEntry) {
    const matrix = matrixEntry[1] as NonNullable<VisualStep["matrix"]>;
    step.matrixName = matrixEntry[0];
    step.matrix = matrix;
    const row = [locals.i, locals.row, locals.r].map(asNumber).find(
      (value): value is number => value !== undefined && value >= 0 && value < matrix.length,
    );
    const col = [locals.j, locals.col, locals.c].map(asNumber).find(
      (value): value is number =>
        value !== undefined && row !== undefined && value >= 0 && value < (matrix[row]?.length ?? 0),
    );
    if (row !== undefined && col !== undefined) step.activeCell = { row, col };

    counters.writes += countMatrixDelta(previous?.matrix, matrix);
    // Mirror the JS worker's diffMatrix: attach the changed-cell list so the
    // matrix diff highlighting, 💡 explain notes, and phase notes work for
    // Python traces exactly like JavaScript ones (the canvas falls back to
    // its own diff for display, but the notes need the list).
    if (Array.isArray(previous?.matrix)) {
      const changes: NonNullable<VisualStep["changedCells"]> = [];
      for (let r = 0; r < matrix.length; r++) {
        const prevRow = previous.matrix[r];
        const currRow = matrix[r];
        if (!Array.isArray(prevRow) || !Array.isArray(currRow)) continue;
        for (let c = 0; c < currRow.length; c++) {
          const previousValue = prevRow[c];
          const value = currRow[c];
          if (!cellsEqual(previousValue, value)) {
            changes.push({ row: r, col: c, previousValue, value });
          }
        }
      }
      if (changes.length) step.changedCells = changes;
    }

    // Matrix path: detect a "path" variable that holds an ordered list of
    // {row, col} cells — the reconstructed optimal path through a DP grid.
    // Accepts both {row, col} objects and [row, col] pair arrays.
    const PATH_MATRIX_RE = /^(path|shortestPath|shortest|result|ans)$/i;
    for (const [pName, pValue] of entries) {
      if (pName === "input") continue;
      if (Array.isArray(pValue) && pValue.length > 0 && PATH_MATRIX_RE.test(pName)) {
        // {row, col} objects
        if (pValue.every((v) => v && typeof v === "object" && typeof (v as any).row === "number" && typeof (v as any).col === "number")) {
          step.matrixPath = pValue as Array<{ row: number; col: number }>;
          break;
        }
        // [row, col] pair arrays
        if (pValue.every((v) => Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number")) {
          step.matrixPath = (pValue as number[][]).map(([row, col]) => ({ row, col }));
          break;
        }
      }
    }

    step.ops = ops();
  }

  if (hashMapEntry) {
    step.hashMapName = hashMapEntry[0];
    step.hashMap = hashMapEntry[1] as VisualStep["hashMap"];
  }

  if (graphEntry) {
    step.graphName = graphEntry[0];
    step.graph = graphEntry[1] as VisualStep["graph"];
    const activeNode = locals.node ?? locals.current ?? locals.vertex;
    if (typeof activeNode === "string" || typeof activeNode === "number") step.activeNode = activeNode;
    const frontier = locals.stack ?? locals.queue;
    if (Array.isArray(frontier)) step.frontier = frontier as Array<string | number>;

    // Graph path: detect a "path" variable that holds an ordered list of
    // node ids — the reconstructed shortest/longest path from BFS, Dijkstra,
    // DFS, etc. The visualization highlights the matching nodes and edges.
    const PATH_GRAPH_RE = /^(path|shortestPath|shortest|result|ans)$/i;
    for (const [pName, pValue] of entries) {
      if (pName === "input") continue;
      if (
        Array.isArray(pValue) &&
        pValue.length > 1 &&
        PATH_GRAPH_RE.test(pName) &&
        pValue.every((v) => typeof v === "string" || typeof v === "number")
      ) {
        step.graphPath = pValue as Array<string | number>;
        break;
      }
    }
  }

  // LeetCode/GFG structures: the harness serialized ListNode / TreeNode locals
  // into id maps. Rebuild the same steps the JS worker produces (same row vs
  // pointer rules, same diff counters) so both languages render identically.
  if (raw.nodes) {
    const linkedList = buildPythonLinkedList(raw.nodes, previous?.linkedList, counters);
    if (linkedList) {
      step.linkedList = linkedList;
      step.ops = ops();
    }
    const tree = buildPythonTree(raw.nodes, previous?.tree, counters);
    if (tree) {
      step.tree = tree;
      step.ops = ops();
    }
  }

  return step;
}

const PY_LIST_NAME_RE = /^(head|root|list|l1|l2|tail|first|dummy)$/i;
const PY_WALKER_NAME_RE = /^(curr|current|cur|slow|fast|node|next|target|tmp|temp)$/i;
const PY_TREE_NAME_RE = /^(root|tree)$/i;

function chainOf(rootId: number, next: Record<string, number | null>): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  let id: number | null | undefined = rootId;
  let guard = 0;
  while (id !== null && id !== undefined && !seen.has(id) && guard < 500) {
    seen.add(id);
    order.push(id);
    id = next[id] ?? null;
    guard++;
  }
  return order;
}

/** Mirrors the JS worker's linked-list capture: named chains + pointer arrows. */
function buildPythonLinkedList(
  nodes: PythonNodeMaps,
  previous: VisualStep["linkedList"],
  counters: StepCounters,
): VisualStep["linkedList"] | undefined {
  const refs = Object.entries(nodes.refs ?? {}).filter(([, ref]) => ref.kind === "list");
  if (!refs.length || !Object.keys(nodes.values ?? {}).length) return undefined;

  const values = nodes.values as LinkedListStep["values"];
  const next = nodes.next ?? {};
  const listEntries = refs.map(([name, ref]) => [name, ref.id] as const);

  const listNamedEntry = listEntries.find(([name]) => PY_LIST_NAME_RE.test(name));
  const mainEntry =
    listNamedEntry ??
    listEntries.reduce((best, entry) =>
      chainOf(entry[1], next).length > chainOf(best[1], next).length ? entry : best,
    );
  const mainOrder = chainOf(mainEntry[1], next);
  const isSuffixOfMain = (order: number[]) =>
    order.length > 0 &&
    mainOrder.length >= order.length &&
    mainOrder.slice(mainOrder.length - order.length).join(",") === order.join(",");

  const lists: LinkedListStep["lists"] = {};
  for (const [name, id] of listEntries) {
    if (PY_WALKER_NAME_RE.test(name)) {
      if (/^(curr|current|cur)$/i.test(name)) {
        const order = chainOf(id, next);
        if (order.length > 1 && !isSuffixOfMain(order)) lists[name] = { order };
      }
      continue;
    }
    const order = chainOf(id, next);
    if (PY_LIST_NAME_RE.test(name) || order.length > 1) lists[name] = { order };
  }
  if (!Object.keys(lists).length) {
    lists[mainEntry[0]] = { order: mainOrder };
  }

  const pointers: LinkedListStep["pointers"] = {};
  for (const [name, id] of listEntries) {
    if (!lists[name]) pointers[name] = id;
  }

  const activeName = ["curr", "current", "node", "cur", "tail", "slow", "fast", "head", "prev", "l1", "l2"]
    .find((name) => listEntries.some(([entryName]) => entryName === name));
  const active = activeName ? listEntries.find(([entryName]) => entryName === activeName)![1] : null;

  const result: LinkedListStep = { values, next, lists, pointers, active };
  if (nodes.prev && Object.keys(nodes.prev).length) result.prev = nodes.prev;

  // Value writes and link flips (the two things reversal / merge are built from).
  if (previous) {
    let changedValue: number | null = null;
    for (const [id, value] of Object.entries(values)) {
      if (previous.values[id] !== undefined && previous.values[id] !== value) {
        changedValue = Number(id);
        counters.writes += 1;
      }
    }
    let changedLink: LinkedListStep["changedLink"] = null;
    for (const [id, to] of Object.entries(next)) {
      const previousTo = previous.next[id];
      if (previousTo !== undefined && previousTo !== to) {
        changedLink = { node: Number(id), to, previousTo };
        counters.writes += 1;
      }
    }
    if (changedValue !== null) result.changedValue = changedValue;
    if (changedLink) result.changedLink = changedLink;
  }

  return result;
}

/** Mirrors the JS worker's tree capture: named roots + pointer arrows. */
function buildPythonTree(
  nodes: PythonNodeMaps,
  previous: VisualStep["tree"],
  counters: StepCounters,
): VisualStep["tree"] | undefined {
  const refs = Object.entries(nodes.refs ?? {}).filter(([, ref]) => ref.kind === "tree");
  if (!refs.length || !Object.keys(nodes.values ?? {}).length) return undefined;

  const values = nodes.values as TreeStep["values"];
  const left = nodes.left ?? {};
  const right = nodes.right ?? {};
  const treeEntries = refs.map(([name, ref]) => [name, ref.id] as const);

  const treeSize = (rootId: number) => {
    const visited = new Set<number>();
    const queue = [rootId];
    let count = 0;
    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      count++;
      const l = left[id];
      const r = right[id];
      if (l !== null && l !== undefined) queue.push(l);
      if (r !== null && r !== undefined) queue.push(r);
    }
    return count;
  };

  const treeNamedEntry = treeEntries.find(([name]) => PY_TREE_NAME_RE.test(name));
  const mainEntry =
    treeNamedEntry ??
    treeEntries.reduce((best, entry) => (treeSize(entry[1]) > treeSize(best[1]) ? entry : best));

  const roots: TreeStep["roots"] = { [mainEntry[0]]: mainEntry[1] };
  const pointers: TreeStep["pointers"] = {};
  for (const [name, id] of treeEntries) {
    if (!roots[name]) pointers[name] = id;
  }

  const activeName = ["node", "curr", "current", "cur", "p", "q", "target", "root"]
    .find((name) => treeEntries.some(([entryName]) => entryName === name));
  const active = activeName ? treeEntries.find(([entryName]) => entryName === activeName)![1] : null;

  const result: TreeStep = { values, left, right, roots, pointers, active };
  if (previous) {
    for (const [id, value] of Object.entries(values)) {
      if (previous.values[id] !== undefined && previous.values[id] !== value) {
        result.changedValue = Number(id);
        counters.writes += 1;
      }
    }
  }

  return result;
}

function pointerSnapshot(locals: Record<string, unknown>): VisualStep["pointers"] {
  const pointers: NonNullable<VisualStep["pointers"]> = {};
  for (const [name, value] of Object.entries(locals)) {
    if (isPrimitive(value)) pointers[name] = value;
  }
  return Object.keys(pointers).length ? pointers : undefined;
}

/** The printed output lines, in order — used as the run's "result" text. */
export function pythonConsoleOutput(steps: VisualStep[]): string[] {
  return steps
    .filter((step) => step.title === "Console" && typeof step.note === "string")
    .map((step) => step.note as string);
}
