import type { GraphInput, LinkedListStep, MatrixCell, TreeStep, VisualStep } from "@/types/visualizer";

// ---------------------------------------------------------------------------
// Step normalization (shared between the client and tests)
//
// Whitelists the fields a raw worker step may carry (so arbitrary code can't
// inject data into the UI), coerces types, and then derives a human-readable
// `phase` note for every matrix step so students can follow the algorithm.
// ---------------------------------------------------------------------------

export function normalizeSteps(rawSteps: unknown[]) {
  const steps = rawSteps.map((rawStep, index) => {
    const record = isRecord(rawStep) ? rawStep : { note: String(rawStep) };
    const normalized: VisualStep = {
      id: index,
      title: toOptionalString(record.title),
      note: toOptionalString(record.note),
      line: toOptionalNumber(record.line),
      arrayName: toOptionalString(record.arrayName),
      stringName: toOptionalString(record.stringName),
      hashMapName: toOptionalString(record.hashMapName),
      matrixName: toOptionalString(record.matrixName),
      graphName: toOptionalString(record.graphName),
      setName: toOptionalString(record.setName),
      stackName: toOptionalString(record.stackName),
      queueName: toOptionalString(record.queueName),
      visitedName: toOptionalString(record.visitedName),
      array: toNumberArray(record.array),
      string: toOptionalString(record.string),
      hashMap: toHashMap(record.hashMap),
      set: toPrimitiveArray(record.set),
      active: toNumberArray(record.active),
      sorted: toNumberArray(record.sorted),
      range: toPair(record.range),
      window: toPair(record.window),
      pointers: toPointerRecord(record.pointers),
      stack: toPrimitiveArray(record.stack),
      callStack: toPrimitiveArray(record.callStack),
      queue: toPrimitiveArray(record.queue),
      visited: toPrimitiveArray(record.visited),
      frontier: toPrimitiveArray(record.frontier),
      heap: toHeap(record.heap),
      heapActive: toNumberArray(record.heapActive),
      graph: toGraph(record.graph),
      activeNode: toNodePrimitive(record.activeNode),
      matrix: toMatrix(record.matrix),
      activeCell: toCell(record.activeCell),
      changedCells: toCellChanges(record.changedCells),
      access: toAccess(record.access),
      linkedList: toLinkedList(record.linkedList),
      tree: toTree(record.tree),
      phase: toOptionalString(record.phase),
      // ---- Path highlighting fields ----
      graphPath: toPrimitiveArray(record.graphPath),
      matrixPath: toCellList(record.matrixPath),
      // ---- Dynamic programming fields ----
      dpTable: toDpTable(record.dpTable),
      dpTableName: toOptionalString(record.dpTableName),
      dpActiveCell: toCell(record.dpActiveCell),
      dpDependencies: toDpDependencies(record.dpDependencies),
      dpArray: toPrimitiveArray(record.dpArray),
      dpArrayName: toOptionalString(record.dpArrayName),
      dpActiveIndex: toOptionalNumber(record.dpActiveIndex),
      dpArrayDependencies: toNumberArray(record.dpArrayDependencies),
      memoTable: toHashMap(record.memoTable),
      memoTableName: toOptionalString(record.memoTableName),
      memoActive: toMemoActive(record.memoActive),
      recursionTree: toRecursionTree(record.recursionTree),
      recursionActive: toOptionalString(record.recursionActive),
      result: record.result,
      returnValue: toOptionalString(record.returnValue),
      ops: toOperations(record.ops),
    };

    return normalized;
  });
  return annotateMatrixPhases(steps);
}

/**
 * Derives a human-readable "phase" note for every matrix step, so students can
 * follow what the code is doing without reading variable dumps. Fully generic —
 * driven by the trace data, not hard-coded per problem:
 *
 * - BFS/DFS/recursion context (queue / stack / deep call stack present)
 * - cell changes ("updated matrix[i][j]: 1 → 2")
 * - traversal movement ("moving right along row 0", "visiting [2,0]")
 * - the instrumented access itself ("read grid[r][c]")
 */
export function annotateMatrixPhases(steps: VisualStep[]): VisualStep[] {
  let previous: VisualStep | undefined;
  for (const step of steps) {
    if (!step.matrix) continue;
    const phase = buildMatrixPhase(step, previous);
    if (phase) step.phase = phase;
    previous = step;
  }
  return steps;
}

function buildMatrixPhase(step: VisualStep, previous: VisualStep | undefined): string | undefined {
  const segments: string[] = [];
  const activeCell = step.activeCell;
  const changed = step.changedCells ?? [];
  const cellText = (cell: { row: number; col: number }) => `[${cell.row},${cell.col}]`;

  // 1. Algorithm context — the most important thing a student needs to know.
  if ((step.queue?.length ?? 0) > 0 || (step.frontier?.length ?? 0) > 0) {
    segments.push(activeCell ? `BFS · processing ${cellText(activeCell)}` : "BFS · processing the queue");
  } else if ((step.stack?.length ?? 0) > 0) {
    segments.push(activeCell ? `DFS · visiting ${cellText(activeCell)}` : "DFS · exploring");
  } else if ((step.callStack?.length ?? 0) > 1) {
    // Deep call stack = recursion is actually in progress (a single frame is
    // just the entry function, e.g. the outer grid scan of a DFS wrapper).
    segments.push(activeCell ? `recursion · visiting ${cellText(activeCell)}` : "recursion · exploring");
  }

  // 2. Cell changes — mutations and flood-fill / visited markings.
  if (changed.length > 0) {
    const single = changed.length === 1 ? changed[0] : undefined;
    const access = step.access;
    const accessMatches =
      single !== undefined &&
      access !== undefined &&
      access.kind === "write" &&
      access.row === single.row &&
      access.col === single.col;
    if (accessMatches) {
      const from = single.previousValue === undefined ? "" : `${formatCellValue(single.previousValue)} → `;
      segments.push(`updated ${access!.source}: ${from}${formatCellValue(single.value)}`);
    } else if (single) {
      const from = single.previousValue === undefined ? "" : `${formatCellValue(single.previousValue)} → `;
      segments.push(`updated cell ${cellText(single)}: ${from}${formatCellValue(single.value)}`);
    } else {
      segments.push(`updated ${changed.length} cells`);
    }
  }

  // 3. Traversal movement — skipped when a more specific segment already
  //    explains the step (changes/context), which would just add noise.
  if (segments.length === 0 && activeCell && previous?.activeCell) {
    const row = activeCell.row;
    const col = activeCell.col;
    const dr = row - previous.activeCell.row;
    const dc = col - previous.activeCell.col;
    if (dr === 0 && dc === 1) segments.push(`moving right along row ${row}`);
    else if (dr === 0 && dc === -1) segments.push(`moving left along row ${row}`);
    else if (dr === 1 && dc === 0) segments.push(`moving down column ${col}`);
    else if (dr === -1 && dc === 0) segments.push(`moving up column ${col}`);
    else if (dr !== 0 || dc !== 0) {
      segments.push(Math.abs(dr) === 1 && Math.abs(dc) === 1 ? `diagonal move to ${cellText(activeCell)}` : `visiting ${cellText(activeCell)}`);
    }
  }

  // 4. Access detail — the exact construct being evaluated. Writes are already
  //    surfaced by the change segment, so only add them when not shown above.
  if (step.access) {
    const { source, row, col, kind } = step.access;
    const alreadyShown =
      kind === "write" &&
      changed.length === 1 &&
      changed[0].row === row &&
      changed[0].col === col;
    if (!alreadyShown) {
      segments.push(kind === "write" ? `wrote ${source}` : `read ${source}`);
    }
  }

  return segments.length > 0 ? segments.join(" · ") : undefined;
}

function formatCellValue(value: MatrixCell | undefined): string {
  if (value === undefined) return "?";
  if (value !== null && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  // Quote strings so `"1"` (a cell value) is distinguishable from `1`.
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumberArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
}

function toPair(value: unknown): [number, number] | undefined {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const first = Number(value[0]);
  const second = Number(value[1]);

  if (!Number.isFinite(first) || !Number.isFinite(second)) return undefined;
  return [first, second];
}

function toPointerRecord(value: unknown): VisualStep["pointers"] {
  if (!isRecord(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, toPrimitive(item) ?? stringify(item)]),
  );
}

function toPrimitiveArray(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  return value
    .map(toPrimitive)
    .filter((item): item is string | number => typeof item === "string" || typeof item === "number");
}

/** Heap snapshots: { items, kind, name } with a primitive-only items array. */
function toHeap(value: unknown): VisualStep["heap"] {
  if (!isRecord(value)) return undefined;
  const items = toPrimitiveArray(value.items);
  const kind = value.kind === "max" ? "max" : "min";
  const name = toOptionalString(value.name);
  if (!items?.length) return undefined;
  return { items, kind, name: name ?? "heap" };
}

function toNodePrimitive(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  return undefined;
}

function toGraph(value: unknown): GraphInput | undefined {
  if (!isRecord(value)) return undefined;

  const graph: GraphInput = {};

  Object.entries(value).forEach(([node, neighbors]) => {
    if (!Array.isArray(neighbors)) return;
    graph[node] = neighbors
      .map(toPrimitive)
      .filter(
        (neighbor): neighbor is string | number =>
          typeof neighbor === "string" || typeof neighbor === "number",
      );
  });

  return Object.keys(graph).length ? graph : undefined;
}

function toHashMap(value: unknown): VisualStep["hashMap"] {
  if (!isRecord(value)) return undefined;

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => toPrimitive(item) !== undefined),
  ) as Record<string, string | number | boolean | null>;
}

// Primitives (including null) and plain JSON-safe objects pass through; anything
// else (arrays, functions, symbols) is dropped.
function toCellValue(value: unknown): MatrixCell | undefined {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as MatrixCell;
  }
  return undefined;
}

function toMatrix(value: unknown): VisualStep["matrix"] {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const rows = value.map((row) => (Array.isArray(row) ? row : []));
  const cells = rows.map((row) => row.map(toCellValue));
  return cells as VisualStep["matrix"];
}

function toCell(value: unknown): { row: number; col: number } | undefined {
  if (!isRecord(value)) return undefined;
  const row = Number(value.row);
  const col = Number(value.col);
  if (!Number.isInteger(row) || !Number.isInteger(col)) return undefined;
  return { row, col };
}

function toAccess(value: unknown): VisualStep["access"] {
  if (!isRecord(value)) return undefined;
  const row = Number(value.row);
  const col = Number(value.col);
  if (!Number.isInteger(row) || !Number.isInteger(col)) return undefined;
  if (typeof value.source !== "string" || value.source.length === 0) return undefined;
  return { source: value.source, row, col, kind: value.kind === "write" ? "write" : "read" };
}

function toLinkedList(value: unknown): LinkedListStep | undefined {
  if (!isRecord(value)) return undefined;

  const values: LinkedListStep["values"] = {};
  if (isRecord(value.values)) {
    for (const [id, item] of Object.entries(value.values)) {
      const primitive = toPrimitive(item);
      if (primitive !== undefined) values[id] = primitive;
    }
  }

  const next: LinkedListStep["next"] = {};
  if (isRecord(value.next)) {
    for (const [id, item] of Object.entries(value.next)) {
      if (item === null) next[id] = null;
      else {
        const nodeId = Number(item);
        if (Number.isInteger(nodeId)) next[id] = nodeId;
      }
    }
  }

  const lists: LinkedListStep["lists"] = {};
  if (isRecord(value.lists)) {
    for (const [name, list] of Object.entries(value.lists)) {
      if (!isRecord(list) || !Array.isArray(list.order)) continue;
      const order = list.order
        .map(Number)
        .filter((item) => Number.isInteger(item));
      if (!order.length) continue;
      const entry: { order: number[]; cycleStart?: number | null } = { order };
      if (list.cycleStart !== undefined && list.cycleStart !== null) {
        const cycleStart = Number(list.cycleStart);
        if (Number.isInteger(cycleStart)) entry.cycleStart = cycleStart;
      }
      lists[name] = entry;
    }
  }

  const pointers: LinkedListStep["pointers"] = {};
  if (isRecord(value.pointers)) {
    for (const [name, item] of Object.entries(value.pointers)) {
      if (item === null) pointers[name] = null;
      else {
        const nodeId = Number(item);
        if (Number.isInteger(nodeId)) pointers[name] = nodeId;
      }
    }
  }

  const result: LinkedListStep = { values, next, lists, pointers };
  if (value.prev !== undefined && value.prev !== null && isRecord(value.prev)) {
    const prev: LinkedListStep["prev"] = {};
    for (const [id, item] of Object.entries(value.prev)) {
      if (item === null) prev[id] = null;
      else {
        const nodeId = Number(item);
        if (Number.isInteger(nodeId)) prev[id] = nodeId;
      }
    }
    if (Object.keys(prev).length) result.prev = prev;
  }
  if (value.active !== undefined && value.active !== null) {
    const active = Number(value.active);
    if (Number.isInteger(active)) result.active = active;
  }
  if (value.changedValue !== undefined && value.changedValue !== null) {
    const changedValue = Number(value.changedValue);
    if (Number.isInteger(changedValue)) result.changedValue = changedValue;
  }
  if (isRecord(value.changedLink)) {
    const node = Number(value.changedLink.node);
    const to = value.changedLink.to === null ? null : Number(value.changedLink.to);
    const previousTo =
      value.changedLink.previousTo === null ? null : Number(value.changedLink.previousTo);
    if (
      Number.isInteger(node) &&
      (to === null || Number.isInteger(to)) &&
      (previousTo === null || Number.isInteger(previousTo))
    ) {
      result.changedLink = { node, to, previousTo };
    }
  }

  return Object.keys(lists).length ? result : undefined;
}

function toTree(value: unknown): TreeStep | undefined {
  if (!isRecord(value)) return undefined;

  const values: TreeStep["values"] = {};
  if (isRecord(value.values)) {
    for (const [id, item] of Object.entries(value.values)) {
      const primitive = toPrimitive(item);
      if (primitive !== undefined) values[id] = primitive;
    }
  }

  const childMap = (key: string): TreeStep["left"] => {
    const map: TreeStep["left"] = {};
    if (isRecord(value[key])) {
      for (const [id, item] of Object.entries(value[key])) {
        if (item === null) map[id] = null;
        else {
          const nodeId = Number(item);
          if (Number.isInteger(nodeId)) map[id] = nodeId;
        }
      }
    }
    return map;
  };
  const left = childMap("left");
  const right = childMap("right");

  const roots: TreeStep["roots"] = {};
  if (isRecord(value.roots)) {
    for (const [name, item] of Object.entries(value.roots)) {
      const nodeId = Number(item);
      if (Number.isInteger(nodeId)) roots[name] = nodeId;
    }
  }

  const pointers: TreeStep["pointers"] = {};
  if (isRecord(value.pointers)) {
    for (const [name, item] of Object.entries(value.pointers)) {
      if (item === null) pointers[name] = null;
      else {
        const nodeId = Number(item);
        if (Number.isInteger(nodeId)) pointers[name] = nodeId;
      }
    }
  }

  const result: TreeStep = { values, left, right, roots, pointers };
  if (value.active !== undefined && value.active !== null) {
    const active = Number(value.active);
    if (Number.isInteger(active)) result.active = active;
  }
  if (value.changedValue !== undefined && value.changedValue !== null) {
    const changedValue = Number(value.changedValue);
    if (Number.isInteger(changedValue)) result.changedValue = changedValue;
  }

  return Object.keys(roots).length ? result : undefined;
}

function toOperations(value: unknown): VisualStep["ops"] {
  if (!isRecord(value)) return undefined;
  const comparisons = Number(value.comparisons);
  const swaps = Number(value.swaps);
  const writes = Number(value.writes);
  if (!Number.isFinite(comparisons) || !Number.isFinite(swaps) || !Number.isFinite(writes)) {
    return undefined;
  }
  return { comparisons, swaps, writes };
}

/** Ordered {row, col} cells forming a DP-grid optimal path (matrixPath). */
function toCellList(value: unknown): VisualStep["matrixPath"] {
  if (!Array.isArray(value)) return undefined;

  const cells: NonNullable<VisualStep["matrixPath"]> = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const row = Number(item.row);
    const col = Number(item.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) continue;
    cells.push({ row, col });
  }
  return cells.length ? cells : undefined;
}

function toCellChanges(value: unknown): VisualStep["changedCells"] {
  if (!Array.isArray(value)) return undefined;

  const changes: VisualStep["changedCells"] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const row = Number(item.row);
    const col = Number(item.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) continue;
    changes.push({
      row,
      col,
      previousValue: toCellValue(item.previousValue),
      value: toCellValue(item.value),
    });
  }
  return changes;
}

function toPrimitive(value: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return undefined;
}

function toOptionalNumber(value: unknown) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
}

function toOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function stringify(value: unknown) {
  try {
    const text = JSON.stringify(value);
    return text === undefined ? String(value) : text;
  } catch (error) {
    return String(value);
  }
}

// ---- Dynamic programming helpers ----

function toDpTable(value: unknown): VisualStep["dpTable"] {
  if (!Array.isArray(value)) return undefined;
  const table = value.map((row) => {
    if (!Array.isArray(row)) return undefined;
    const cells = row.map((cell) => toPrimitive(cell));
    return cells.every((c) => c !== undefined) ? cells : undefined;
  });
  return table.every((r) => r !== undefined) ? (table as NonNullable<VisualStep["dpTable"]>) : undefined;
}

function toDpDependencies(value: unknown): VisualStep["dpDependencies"] {
  if (!Array.isArray(value)) return undefined;
  const deps = value.map((dep) => {
    if (!isRecord(dep)) return undefined;
    const row = toOptionalNumber(dep.row);
    const col = toOptionalNumber(dep.col);
    return row !== undefined && col !== undefined ? { row, col } : undefined;
  });
  return deps.every((d) => d !== undefined) ? (deps as NonNullable<VisualStep["dpDependencies"]>) : undefined;
}

function toMemoActive(value: unknown): VisualStep["memoActive"] {
  if (!isRecord(value)) return undefined;
  const key = toOptionalString(value.key);
  const val = toPrimitive(value.value);
  return key !== undefined && val !== undefined ? { key, value: val } : undefined;
}

function toRecursionTree(value: unknown): VisualStep["recursionTree"] {
  if (!Array.isArray(value)) return undefined;
  const nodes = value.map((node) => {
    if (!isRecord(node)) return undefined;
    const id = toOptionalString(node.id);
    const label = toOptionalString(node.label);
    const children = Array.isArray(node.children) ? node.children.map(String) : [];
    const depth = toOptionalNumber(node.depth) ?? 0;
    if (!id || !label) return undefined;
    return {
      id,
      label,
      result: node.result !== undefined ? toPrimitive(node.result) : undefined,
      children,
      cached: typeof node.cached === "boolean" ? node.cached : undefined,
      depth,
    };
  });
  return nodes.every((n) => n !== undefined) ? (nodes as NonNullable<VisualStep["recursionTree"]>) : undefined;
}

