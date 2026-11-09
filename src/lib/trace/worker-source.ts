import { STRUCTURE_CAPTURE_HELPERS } from "./structure-capture-source";

export type WorkerTraceMessage = {
  ok: boolean;
  steps?: unknown[];
  result?: unknown;
  error?: string;
};

export type TraceRunOptions = {
  typescript?: boolean;
  timeoutMs?: number;
};

/**
 * The trace worker source. The worker is a pure runtime: it receives
 * already-instrumented code (see `instrument`) and captures state changes as
 * steps. Networking is disabled inside the worker.
 */
export function createWorkerSource() {
  return `
try {
  self.fetch = () => Promise.reject(new Error("Network calls are disabled in the trace runner."));
  self.XMLHttpRequest = undefined;
  self.WebSocket = undefined;
  self.importScripts = () => {
    throw new Error("External scripts are disabled in the trace runner.");
  };
} catch (error) {}

// ---- Shared structure-capture rules (inlined) ----
// One source of truth for heap/queue/stack name routing and the swap/write
// heuristic, shared verbatim with the Python tracer via structure-capture-source.
${STRUCTURE_CAPTURE_HELPERS}

// Cycle-aware deep clone: shared references are revisited (not expanded) and
// cycles become the "[cycle]" marker, so cyclic linked lists (Floyd's) stay
// serializable and the result still shows the node's value and links.
const safeClone = (value, depth = 0, seen = new Set()) => {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return "[cycle]";
  if (depth > 20) return String(value);
  seen.add(value);
  let result;
  if (Array.isArray(value)) {
    result = value.map((item) => safeClone(item, depth + 1, seen));
  } else {
    result = {};
    for (const key of Object.keys(value)) {
      result[key] = safeClone(value[key], depth + 1, seen);
    }
  }
  seen.delete(value);
  return result;
};

const formatConsoleValue = (value) => {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    // Node objects (ListNode / TreeNode / GraphNode) render compactly in call
    // labels instead of dumping the whole nested chain: invertTree(root=TreeNode(4)).
    const nodeValue = value.val ?? value.value;
    if ("next" in value) return "ListNode(" + formatConsoleValue(nodeValue) + ")";
    if ("left" in value || "right" in value) return "TreeNode(" + formatConsoleValue(nodeValue) + ")";
    if (Array.isArray(value.neighbors)) return "GraphNode(" + formatConsoleValue(nodeValue) + ")";
  }
  const cloned = safeClone(value);
  return typeof cloned === "string" ? cloned : JSON.stringify(cloned);
};

self.onmessage = async (event) => {
  const { code, inputText } = event.data;
  const steps = [];
  const maxSteps = 3000;
  const recursionFrames = [];
  // Most recent instrumented matrix access ({ name, row, col, source, kind }),
  // recorded by __autoAccess/__autoRecord when user code reads or writes a
  // base[a][b] cell.
  let lastAccess = null;
  // The primary binary tree seen so far ({ root, name, size }), kept across
  // steps so helper functions that only receive part of the structure (dfs
  // descending into a subtree, self-recursion like this.invertTree(node.left))
  // don't shrink the canvas to the current subtree — see the tree section in
  // makeAutoStep.
  let primaryTree = null;
  // Cumulative operation counters (comparisons from branch conditions, swaps
  // and writes from structure diffs) so students can study complexity.
  let comparisons = 0;
  let swaps = 0;
  let writes = 0;

  // ---- Dynamic programming tree tracking ----
  // Recursion tree nodes for top-down DP: each __autoEnter adds a node,
  // each __autoReturn fills in the result. The parent is the node that
  // was most recently entered but not yet returned.
  const dpTreeNodes = [];
  const dpTreeParentStack = [];
  const dpTreeNodeMap = new Map();
  let dpTreeNodeCounter = 0;

  // Linked-list node registry: stable ids per node object across the whole
  // run, so node boxes don't shuffle between steps. Steps only ever carry ids
  // + primitives — never the raw node objects — so cyclic lists stay JSON-safe.
  const nodeIdByObject = new Map();
  let nextNodeId = 0;
  const getNodeId = (obj) => {
    if (!nodeIdByObject.has(obj)) nodeIdByObject.set(obj, nextNodeId++);
    return nodeIdByObject.get(obj);
  };

  // A linked-list node is an object with a value field (val | value) and a
  // next field (LeetCode-style ListNode). Never arrays or graphs/maps.
  const isNode = (value) =>
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("val" in value || "value" in value) &&
    "next" in value;

  // A binary-tree node is an object with a value field (val | value) and
  // left/right child fields (LeetCode-style TreeNode).
  const isTreeNode = (value) =>
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("val" in value || "value" in value) &&
    ("left" in value || "right" in value);

  // A graph node is an object with a value field and a neighbors array
  // (LeetCode-style Node used by clone-graph / course-schedule problems).
  const isGraphNode = (value) =>
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    ("val" in value || "value" in value) &&
    Array.isArray(value.neighbors);

  // Walk a chain without assigning ids (for picking the main list).
  const chainLength = (root) => {
    const seen = new Set();
    let node = root;
    let length = 0;
    while (node && isNode(node) && !seen.has(node) && length < 500) {
      seen.add(node);
      node = node.next;
      length++;
    }
    return length;
  };

  // Ordered node ids from a root, plus the id a cycle loops back to (if any).
  const chainOf = (root) => {
    const seen = new Set();
    const order = [];
    let node = root;
    let cycleStart = null;
    let guard = 0;
    while (node && isNode(node) && !seen.has(node) && guard < 500) {
      seen.add(node);
      order.push(getNodeId(node));
      node = node.next;
      guard++;
    }
    if (node && isNode(node) && seen.has(node)) cycleStart = getNodeId(node);
    return { order, cycleStart };
  };

  const emit = (step = {}) => {
    let snapshot;
    if (!step || typeof step !== "object" || Array.isArray(step)) {
      snapshot = { id: steps.length, title: "Trace", note: String(step) };
    } else {
      snapshot = Object.assign({ id: steps.length }, step);
    }

    // Deep-clone mutable state now — later mutations must not rewrite history.
    for (const key of Object.keys(snapshot)) {
      const value = snapshot[key];
      if (value !== null && typeof value === "object") {
        snapshot[key] = safeClone(value);
      }
    }

    // Skip steps identical to the previous one — nothing visible changed.
    const previous = steps[steps.length - 1];
    if (previous) {
      const previousBody = Object.assign({}, previous);
      delete previousBody.id;
      const nextBody = Object.assign({}, snapshot);
      delete nextBody.id;
      if (JSON.stringify(previousBody) === JSON.stringify(nextBody)) return;
    }

    if (steps.length >= maxSteps) {
      throw new Error("Step limit reached. Try a smaller input or a simpler loop.");
    }

    steps.push(snapshot);
  };

  const console = {
    log: (...values) => {
      emit({
        title: "Console",
        note: values.map(formatConsoleValue).join(" "),
      });
    },
  };

  const isGraph = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const entries = Object.values(value);
    return entries.length > 0 && entries.every((item) => Array.isArray(item));
  };

  const isHashMap = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    // A ListNode { val, next } or TreeNode { val, left, right } is a chain row,
    // not a map — even when its values are all primitives (e.g. a single-node
    // list or a merge dummy).
    if (isNode(value) || isTreeNode(value)) return false;
    const entries = Object.values(value);
    return entries.length > 0 && entries.every((item) =>
      typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null,
    );
  };

  // A matrix is an array-of-arrays whose cells are primitives or plain objects.
  // Rows may be ragged (different lengths), but every row must be a non-empty
  // array. Array cells (3-D structures) are not treated as matrices. This never
  // collides with the existing array/string/map/graph detection: rows are arrays
  // (not numbers/strings), and the value itself is an array (not an object), so
  // it can't be a hash map or graph either.
  const isMatrix = (value) => {
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
  };

  // Best-effort active-cell inference from loop/index variables, mirroring how
  // 1-D array steps infer the active index. Handles matrix[i][j], grid[row][col],
  // and visited[r][c]; pairs are only used when both land in bounds (per row, so
  // ragged matrices still get correct columns).
  const inferActiveCell = (matrix, values) => {
    const rows = matrix.length;
    const row = [values.i, values.row, values.r].find(
      (value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value < rows,
    );
    const cols = typeof row === "number" ? (matrix[row]?.length ?? 0) : (matrix[0]?.length ?? 0);
    const col = [values.j, values.col, values.c].find(
      (value) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value < cols,
    );
    if (typeof row === "number" && typeof col === "number") return { row, col };
    return undefined;
  };

  // Prefer the instrumented access when it targets the rendered matrix (name
  // match + in bounds); otherwise fall back to loop-variable inference.
  const resolveActiveCell = (matrixName, matrix, values) => {
    if (lastAccess && lastAccess.name === matrixName) {
      const row = lastAccess.row;
      const col = lastAccess.col;
      const cols = matrix[row]?.length ?? 0;
      if (row >= 0 && row < matrix.length && col >= 0 && col < cols) {
        return { row, col };
      }
    }
    return inferActiveCell(matrix, values);
  };

  // Object cells are snapshotted by value (safeClone), so compare them deeply;
  // primitives compare by reference.
  const cellsEqual = (a, b) => {
    if (a === b) return true;
    if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch (error) {
        return false;
      }
    }
    return false;
  };

  const diffMatrix = (previous, current) => {
    const changes = [];
    for (let r = 0; r < current.length; r++) {
      const prevRow = previous[r];
      const currRow = current[r];
      if (!Array.isArray(currRow)) continue;
      for (let c = 0; c < currRow.length; c++) {
        const value = currRow[c];
        const previousValue = Array.isArray(prevRow) ? prevRow[c] : undefined;
        if (!cellsEqual(previousValue, value)) {
          changes.push({ row: r, col: c, previousValue, value });
        }
      }
    }
    return changes;
  };

  // Serialize a GraphNode chain into the plain adjacency map the renderer
  // understands ({ "1": [2, 4], ... }), so clone-graph-style solutions get the
  // same graph diagram as the hand-written DFS templates.
  const graphNodeToAdjacency = (node) => {
    const adjacency = {};
    const seen = new Set();
    const queue = [node];
    while (queue.length) {
      const current = queue.shift();
      if (!current || seen.has(current)) continue;
      seen.add(current);
      const key = String(current.val ?? current.value);
      adjacency[key] = (current.neighbors ?? []).map((neighbor) => neighbor?.val ?? neighbor?.value);
      queue.push(...(current.neighbors ?? []));
    }
    return adjacency;
  };

  const makeAutoStep = (line, values, note) => {
    const entries = Object.entries(values);
    const step = {
      title: "Line " + line,
      line,
      note,
      pointers: {},
    };
    const graphEntry = entries.find(([, value]) => isGraph(value));
    const graphNodeEntry = entries.find(([name, value]) => name !== "input" && isGraphNode(value));
    const stringEntry = entries.find(([, value]) => typeof value === "string");
    const hashMapEntry = entries.find(([name, value]) => name !== "input" && isHashMap(value));
    const isNumericArray = (value) =>
      Array.isArray(value) && value.every((item) => typeof item === "number" && Number.isFinite(item));
    // Queue/heap-named arrays capture into their specialized slots INDEPENDENTLY
    // of the generic array pick, so a queue named variable alongside a nums
    // array renders both. Rules come from structure-capture-source (shared
    // verbatim with the Python tracer).
    const slots = pickCollectionSlots(entries, isNumericArray);
    const queueEntry = slots.queueEntry;
    const heapEntry = slots.heapEntry;
    const numericArrayEntry = slots.numericArrayEntry;
    const matrixEntry =
      entries.find(([name, value]) => /^(matrix|grid|board|mat)$/i.test(name) && isMatrix(value)) ??
      entries.find(([, value]) => isMatrix(value));

    if (recursionFrames.length) {
      step.callStack = recursionFrames.map((frame) => frame.label);
    }

    entries.forEach(([name, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
        step.pointers[name] = value;
      }

      if (value instanceof Set) {
        // Capture the Set by identity (name + items) so the Variables panel can
        // render it as a Set, not as an unnamed stack/queue/visited array.
        step.setName = name;
        step.set = Array.from(value);
        const items = Array.from(value);
        if (name.toLowerCase().includes("visit")) step.visited = items;
        else step[name.toLowerCase().includes("queue") ? "queue" : "stack"] = items;
      }

      if (value instanceof Map && !step.hashMap) {
        // LeetCode solutions use Map heavily (two sum, sliding-window counts,
        // LRU …). Serialize primitive-valued Maps into the hash-map slot so
        // the Variables panel renders them as maps, not as unnamed objects.
        const record = {};
        let primitiveOnly = true;
        for (const [key, item] of value) {
          if (
            typeof key !== "string" &&
            typeof key !== "number"
          ) {
            primitiveOnly = false;
            break;
          }
          if (
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean" ||
            item === null
          ) {
            record[key] = item;
          } else {
            primitiveOnly = false;
            break;
          }
        }
        if (primitiveOnly && Object.keys(record).length) {
          step.hashMap = record;
          step.hashMapName = name;
        }
      }

      // Name-based routing for auxiliary collections (stack/queue/visited).
      // The graph guard is intentionally absent: graph neighbor arrays are not
      // top-level scope entries, so routing by name stays precise even when a
      // graph is in scope (e.g. DFS's stack alongside the graph).
      // Exact-name stacks/queues capture even when a generic array exists, so
      // a stack-named array in a stack-based algorithm gets its own panel.
      if (Array.isArray(value) && !isMatrix(value)) {
        if (QUEUE_NAME_RE.test(name)) { step.queue = value; step.queueName = name; }
        else if (STACK_EXACT_RE.test(name)) { step.stack = value; step.stackName = name; }
        else if (!numericArrayEntry && name.toLowerCase().includes("stack")) { step.stack = value; step.stackName = name; }
        else if (!numericArrayEntry && name.toLowerCase().includes("visit")) { step.visited = value; step.visitedName = name; }
      }
    });

    if (numericArrayEntry) {
      step.arrayName = numericArrayEntry[0];
      step.array = numericArrayEntry[1];
      // Data-driven active cells: every pointer variable whose integer value
      // lands in bounds — known index names and custom ones alike, so any
      // loop/pointer variable (k, cursor, ptr, p1, ...) highlights its cell.
      const activeSet = new Set();
      for (const [, value] of entries) {
        if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < step.array.length) {
          activeSet.add(value);
        }
      }
      step.active = Array.from(activeSet);

      const left = values.left ?? values.low ?? values.start;
      const right = values.right ?? values.high ?? values.end;
      if (typeof left === "number" && typeof right === "number") step.range = [left, right];

      // Operation counters: a swap exchanges exactly two positions (the value
      // that was at each one now sits at the other); anything else is a write.
      // Shared heuristic — countArrayDelta — same as the heap and Python paths.
      const previousArray = steps[steps.length - 1]?.array;
      const delta = countArrayDelta(previousArray, step.array);
      swaps += delta.swaps;
      writes += delta.writes;
    }

    if (stringEntry) {
      step.stringName = stringEntry[0];
      step.string = stringEntry[1];
      const start = values.start ?? values.left ?? values.low;
      const end = values.end ?? values.right ?? values.high;
      if (typeof start === "number" && typeof end === "number") step.window = [start, end];

      const previousString = steps[steps.length - 1]?.string;
      if (typeof previousString === "string") {
        const length = Math.max(previousString.length, step.string.length);
        let changedCharacters = 0;
        for (let index = 0; index < length; index++) {
          if (previousString[index] !== step.string[index]) changedCharacters++;
        }
        writes += changedCharacters;
      }
    }

    if (matrixEntry) {
      step.matrixName = matrixEntry[0];
      step.matrix = matrixEntry[1];
      const activeCell = resolveActiveCell(matrixEntry[0], step.matrix, values);
      if (activeCell) step.activeCell = activeCell;

      // Attach the most recent instrumented access when it targets this matrix
      // and lands in bounds — precise source + cell for the phase notes.
      if (lastAccess && lastAccess.name === matrixEntry[0]) {
        const row = lastAccess.row;
        const col = lastAccess.col;
        const cols = step.matrix[row]?.length ?? 0;
        if (row >= 0 && row < step.matrix.length && col >= 0 && col < cols) {
          step.access = { source: lastAccess.source, row, col, kind: lastAccess.kind };
        }
      }

      const previousMatrix = steps[steps.length - 1]?.matrix;
      if (Array.isArray(previousMatrix)) {
        const changes = diffMatrix(previousMatrix, step.matrix);
        if (changes.length) {
          step.changedCells = changes;
          writes += changes.length;
        }
      }

      // Matrix path: detect a "path" variable that holds an ordered list of
      // {row, col} cells — the reconstructed optimal path through a DP grid.
      // Accepts both {row, col} objects and [row, col] pair arrays.
      const PATH_MATRIX_RE = /^(path|shortestPath|shortest|result|ans)$/i;
      for (const [pName, pValue] of entries) {
        if (pName === "input") continue;
        if (Array.isArray(pValue) && pValue.length > 0 && PATH_MATRIX_RE.test(pName)) {
          // {row, col} objects
          if (pValue.every((v) => v && typeof v === "object" && typeof v.row === "number" && typeof v.col === "number")) {
            step.matrixPath = pValue;
            break;
          }
          // [row, col] pair arrays
          if (pValue.every((v) => Array.isArray(v) && v.length === 2 && typeof v[0] === "number" && typeof v[1] === "number")) {
            step.matrixPath = pValue.map(([row, col]) => ({ row, col }));
            break;
          }
        }
      }
    }

    if (hashMapEntry) {
      step.hashMapName = hashMapEntry[0];
      step.hashMap = hashMapEntry[1];
    }

    if (graphEntry || graphNodeEntry) {
      const entry = graphEntry ?? graphNodeEntry;
      step.graphName = entry[0];
      step.graph = graphEntry ? entry[1] : graphNodeToAdjacency(entry[1]);
      const activeNode = values.node ?? values.current ?? values.vertex;
      if (typeof activeNode === "string" || typeof activeNode === "number") step.activeNode = activeNode;
      const frontier = values.stack ?? values.queue;
      if (Array.isArray(frontier)) step.frontier = frontier;

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
          step.graphPath = pValue;
          break;
        }
      }
    }

    // ---- Linked lists --------------------------------------------------
    // Detect node-object chains (ListNode-style { val, next } graphs) among
    // the scope entries and emit a normalized, JSON-safe description.
    const nodeEntries = entries.filter(([name, value]) => name !== "input" && isNode(value));
    if (nodeEntries.length > 0) {
      // Who's a chain row vs a pointer arrow:
      //  - explicit list names (head/root/l1/l2/dummy...) are always rows;
      //  - walker names (curr/slow/fast/node/next/target...) are always arrows;
      //  - anything else becomes a row when its chain grows past one node
      //    (e.g. prev in a reversal — the growing reversed list).
      const LIST_NAME_RE = /^(head|root|list|l1|l2|tail|first|dummy)$/i;
      const WALKER_NAME_RE = /^(curr|current|cur|slow|fast|node|next|target|tmp|temp)$/i;
      const mainEntry = nodeEntries.reduce((best, entry) =>
        chainLength(entry[1]) > chainLength(best[1]) ? entry : best,
      );

      const linkedList = {
        values: {},
        next: {},
        prev: null,
        lists: {},
        pointers: {},
        active: null,
        changedValue: null,
        changedLink: null,
      };

      // Collect every reachable node from every node entry (the registry keeps
      // ids stable, so a node dropped from one chain still renders elsewhere).
      const seen = new Set();
      const collect = (node) => {
        if (!node || !isNode(node) || seen.has(node)) return;
        seen.add(node);
        const id = getNodeId(node);
        const value = node.val ?? node.value;
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null
        ) {
          linkedList.values[id] = value;
        }
        linkedList.next[id] = isNode(node.next) ? getNodeId(node.next) : null;
        if ("prev" in node) {
          linkedList.prev = linkedList.prev || {};
          linkedList.prev[id] = isNode(node.prev) ? getNodeId(node.prev) : null;
        }
        collect(node.next);
        if ("prev" in node) collect(node.prev);
      };
      for (const [, value] of nodeEntries) collect(value);

      // Chain rows. The reference chain for suffix checks is a list-named
      // entry when one exists (stable across a run — head stays head even
      // when a walker's chain grows longer), else the longest chain.
      const listNamedEntry = nodeEntries.find(([name]) => LIST_NAME_RE.test(name));
      const mainEntryForReference =
        listNamedEntry ??
        nodeEntries.reduce((best, entry) =>
          chainLength(entry[1]) > chainLength(best[1]) ? entry : best,
        );
      const mainOrder = chainOf(mainEntryForReference[1]).order;
      const isSuffixOfMain = (order) =>
        order.length > 0 &&
        mainOrder.length >= order.length &&
        mainOrder.slice(mainOrder.length - order.length).join(",") === order.join(",");

      for (const [name, value] of nodeEntries) {
        // The reversal walker (curr) becomes a row once links are rewritten:
        // it then holds the not-yet-reversed remainder, which is no longer a
        // suffix of the head chain. Walker chains that still match the main
        // list (slow/fast in Floyd's or middle) stay pointer arrows.
        if (WALKER_NAME_RE.test(name)) {
          if (/^(curr|current|cur)$/i.test(name)) {
            const chain = chainOf(value);
            if (chain.order.length > 1 && !isSuffixOfMain(chain.order)) {
              linkedList.lists[name] = { order: chain.order, cycleStart: chain.cycleStart };
            }
          }
          continue;
        }
        const chain = chainOf(value);
        if (LIST_NAME_RE.test(name) || chain.order.length > 1) {
          linkedList.lists[name] = { order: chain.order, cycleStart: chain.cycleStart };
        }
      }
      // Fallback: a lone single-node list the heuristics missed.
      if (Object.keys(linkedList.lists).length === 0) {
        const chain = chainOf(mainEntry[1]);
        linkedList.lists[mainEntry[0]] = { order: chain.order, cycleStart: chain.cycleStart };
      }
      // Everything else is a pointer arrow onto a node (curr, prev, slow,
      // fast, node ...).
      for (const [name, value] of nodeEntries) {
        if (!linkedList.lists[name]) linkedList.pointers[name] = getNodeId(value);
      }

      // The node being processed: prefer explicit walker variables.
      const activeName = ["curr", "current", "node", "cur", "tail", "slow", "fast", "head", "prev", "l1", "l2"]
        .find((name) => nodeEntries.some(([entryName]) => entryName === name));
      if (activeName) {
        const entry = nodeEntries.find(([entryName]) => entryName === activeName);
        linkedList.active = getNodeId(entry[1]);
      }

      // Diff against the previous step: value writes and link flips (the two
      // things a reversal / merge is built from) each count as a write.
      const previousLinkedList = steps[steps.length - 1]?.linkedList;
      if (previousLinkedList) {
        for (const [id, value] of Object.entries(linkedList.values)) {
          if (previousLinkedList.values[id] !== undefined && previousLinkedList.values[id] !== value) {
            linkedList.changedValue = Number(id);
            writes += 1;
          }
        }
        for (const [id, to] of Object.entries(linkedList.next)) {
          const previousTo = previousLinkedList.next[id];
          if (previousTo !== undefined && previousTo !== to) {
            linkedList.changedLink = { node: Number(id), to, previousTo };
            writes += 1;
          }
        }
      }

      step.linkedList = linkedList;
    }

    // ---- Binary trees --------------------------------------------------
    // TreeNode-style { val, left, right } objects get the same treatment as
    // linked lists: stable node ids, a named root row, and pointer arrows.
    const treeEntries = entries.filter(([name, value]) => name !== "input" && isTreeNode(value));
    if (treeEntries.length > 0) {
      const TREE_NAME_RE = /^(root|tree)$/i;

      const tree = {
        values: {},
        left: {},
        right: {},
        roots: {},
        pointers: {},
        active: null,
        changedValue: null,
      };

      // Collect every reachable node from every tree entry into one shared
      // id map (ids stay stable, so a node dropped from one tree still
      // renders elsewhere).
      const seen = new Set();
      const collectTree = (node) => {
        if (!node || !isTreeNode(node) || seen.has(node)) return;
        seen.add(node);
        const id = getNodeId(node);
        const value = node.val ?? node.value;
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value === null
        ) {
          tree.values[id] = value;
        }
        tree.left[id] = isTreeNode(node.left) ? getNodeId(node.left) : null;
        tree.right[id] = isTreeNode(node.right) ? getNodeId(node.right) : null;
        collectTree(node.left);
        collectTree(node.right);
      };
      for (const [, value] of treeEntries) collectTree(value);

      // The primary tree: a tree-named entry (root/tree) when present, else
      // the one with the most nodes.
      const treeSize = (root) => {
        const visited = new Set();
        const queue = [root];
        let count = 0;
        while (queue.length) {
          const node = queue.shift();
          if (!node || !isTreeNode(node) || visited.has(node)) continue;
          visited.add(node);
          count += 1;
          queue.push(node.left, node.right);
        }
        return count;
      };
      const sizeOfEntry = (entry) => treeSize(entry[1]);
      const treeNamedEntry = treeEntries.find(([name]) => TREE_NAME_RE.test(name));

      // Keep the primary tree stable across steps. A tree-named entry is the
      // authoritative view — remember the largest one seen so far. When only
      // walker variables are in scope (a helper like dfs(node), or recursion
      // re-entering with root = a subtree), the remembered primary is what the
      // canvas renders, with the walker drawn as a pointer onto it — so the
      // whole structure stays visible and recursion reads as the active-node
      // ring walking the tree instead of the tree shrinking to each subtree.
      // The primary root object is re-walked every step, so in-place mutations
      // (invertTree) still show up in the snapshot.
      if (treeNamedEntry) {
        const size = sizeOfEntry(treeNamedEntry);
        if (!primaryTree || size >= primaryTree.size) {
          primaryTree = { root: treeNamedEntry[1], name: treeNamedEntry[0], size };
        }
      }
      if (!primaryTree) {
        const biggest = treeEntries.reduce((best, entry) =>
          sizeOfEntry(entry) > sizeOfEntry(best) ? entry : best,
        );
        primaryTree = { root: biggest[1], name: biggest[0], size: sizeOfEntry(biggest) };
      }
      collectTree(primaryTree.root);
      tree.roots[primaryTree.name] = getNodeId(primaryTree.root);

      // Everything else is a pointer arrow onto a node (node, curr, p, q ...).
      // Roots are stored as node ids, so compare against undefined — id 0 is
      // a valid root id, and checking truthiness would re-add it as a pointer
      // (a "root ↓" arrow floating over the root row).
      for (const [name, value] of treeEntries) {
        if (tree.roots[name] === undefined) tree.pointers[name] = getNodeId(value);
      }

      // The node being processed: prefer explicit walker variables.
      const activeName = ["node", "curr", "current", "cur", "p", "q", "target", "root"]
        .find((name) => treeEntries.some(([entryName]) => entryName === name));
      if (activeName) {
        const entry = treeEntries.find(([entryName]) => entryName === activeName);
        tree.active = getNodeId(entry[1]);
      }

      // Value writes count as writes (diff against the previous step).
      const previousTree = steps[steps.length - 1]?.tree;
      if (previousTree) {
        for (const [id, value] of Object.entries(tree.values)) {
          if (previousTree.values[id] !== undefined && previousTree.values[id] !== value) {
            tree.changedValue = Number(id);
            writes += 1;
          }
        }
      }

      step.tree = tree;
    }

    // ---- Dynamic programming detection ----
    // Look for DP-specific variables among the scope entries and attach
    // specialized fields so the canvas can render memo tables, DP tables,
    // and recursion trees.
    const DP_NAME_RE = /^(dp|table|tab|memo|cache|f|cost)$/i;
    const isMemoCache = (value) => {
      if (value instanceof Map) {
        for (const [, v] of value) {
          if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) return true;
        }
        return false;
      }
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const vals = Object.values(value);
        return vals.length > 0 && vals.every((v) => typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null);
      }
      return false;
    };
    const isDpArray1D = (value) => {
      if (!Array.isArray(value)) return false;
      return value.length > 0 && value.every((v) => typeof v === "number" || typeof v === "boolean" || v === null);
    };
    const isDpTable2D = (value) => {
      if (!Array.isArray(value) || value.length === 0) return false;
      // Must already be detected as a matrix-like structure (array of arrays
      // of primitives). Exclude linked-list chains, trees, etc.
      return value.every((row) => Array.isArray(row) && row.length > 0 && row.every((cell) => typeof cell === "number" || typeof cell === "boolean" || cell === null));
    };

    // Detect memo table (Map or plain-object cache).
    for (const [name, value] of entries) {
      if (name === "input") continue;
      if (value instanceof Map && isMemoCache(value)) {
        if (!step.memoTable) {
          const record = {};
          for (const [k, v] of value) record[String(k)] = v;
          step.memoTable = record;
          step.memoTableName = name;
          // Find the most recently written key by diffing against previous step.
          const prevMemo = steps[steps.length - 1]?.memoTable;
          if (prevMemo) {
            for (const [k, v] of Object.entries(record)) {
              if (prevMemo[k] === undefined || prevMemo[k] !== v) {
                step.memoActive = { key: k, value: v };
                break;
              }
            }
          } else if (Object.keys(record).length > 0) {
            const firstKey = Object.keys(record)[0];
            step.memoActive = { key: firstKey, value: record[firstKey] };
          }
        }
      } else if (isMemoCache(value) && !isDpTable2D(value)) {
        if (!step.memoTable) {
          step.memoTable = { ...value };
          step.memoTableName = name;
          const prevMemo = steps[steps.length - 1]?.memoTable;
          if (prevMemo) {
            for (const [k, v] of Object.entries(step.memoTable)) {
              if (prevMemo[k] === undefined || prevMemo[k] !== v) {
                step.memoActive = { key: k, value: v };
                break;
              }
            }
          } else if (Object.keys(step.memoTable).length > 0) {
            const firstKey = Object.keys(step.memoTable)[0];
            step.memoActive = { key: firstKey, value: step.memoTable[firstKey] };
          }
        }
      }
    }

    // Detect 2-D DP table (dp[i][j] style).
    // Note: a DP table may ALSO be caught as a matrix by the existing detection.
    // We set dpTable alongside matrix so the canvas can render both views.
    for (const [name, value] of entries) {
      if (name === "input") continue;
      if (DP_NAME_RE.test(name) && isDpTable2D(value)) {
        step.dpTable = value;
        step.dpTableName = name;
        const activeCell = resolveActiveCell(name, value, values);
        if (activeCell) step.dpActiveCell = activeCell;
        // Infer dependencies from the code pattern: dp[i-1][j], dp[i][j-1], etc.
        const deps = [];
        const ri = activeCell?.row;
        const ci = activeCell?.col;
        if (typeof ri === "number" && typeof ci === "number") {
          if (typeof values.i === "number" && values.i > 0) deps.push({ row: values.i - 1, col: ci });
          if (typeof values.j === "number" && values.j > 0) deps.push({ row: ri, col: values.j - 1 });
          if (typeof values.r === "number" && values.r > 0) deps.push({ row: values.r - 1, col: ci });
          if (typeof values.c === "number" && values.c > 0) deps.push({ row: ri, col: values.c - 1 });
        }
        if (deps.length) step.dpDependencies = deps;
        break;
      }
    }

    // Detect 1-D DP array (dp[i] style).
    // Same as 2D: a DP array may also be caught as a generic numeric array.
    // We set dpArray alongside array for the specialized DP renderer.
    if (!step.dpTable) {
      for (const [name, value] of entries) {
        if (name === "input") continue;
        if (DP_NAME_RE.test(name) && isDpArray1D(value)) {
          step.dpArray = value;
          step.dpArrayName = name;
          // Active index from pointer variables.
          const idx = [values.i, values.j, values.n].find((v) => typeof v === "number" && v >= 0 && v < value.length);
          if (typeof idx === "number") step.dpActiveIndex = idx;
          // Dependencies
          const deps = [];
          if (typeof idx === "number" && idx > 0) {
            deps.push(idx - 1);
            if (idx > 1) deps.push(idx - 2);
          }
          if (deps.length) step.dpArrayDependencies = deps;
          break;
        }
      }
    }

    // Recursion tree: build from dpTreeNodes populated by __autoEnter / __autoReturn.
    if (dpTreeNodes.length > 0) {
      step.recursionTree = dpTreeNodes.map((n) => ({ ...n }));
      if (dpTreeParentStack.length > 0) {
        step.recursionActive = dpTreeParentStack[dpTreeParentStack.length - 1];
      }
    }

    // ---- Heap snapshot ----
    // Heap-named numeric arrays are captured as heaps (tree + array dual view
    // in the canvas) with sift highlighting from the diff vs the previous step.
    // buildHeapSlot is the shared rule — identical to the Python tracer.
    if (heapEntry) {
      const previousHeap = steps[steps.length - 1]?.heap;
      const built = buildHeapSlot(heapEntry, previousHeap);
      step.heap = built.heap;
      if (built.heapActive) step.heapActive = built.heapActive;
      swaps += built.swaps;
      writes += built.writes;
    }

    step.ops = { comparisons, swaps, writes };
    return step;
  };

  const formatFrame = (name, values) => {
    const args = Object.entries(values)
      .map(([key, value]) => key + "=" + formatConsoleValue(value))
      .join(", ");
    return name + "(" + args + ")";
  };

  const __autoEnter = (line, name, values) => {
    recursionFrames.push({ label: formatFrame(name, values) });

    // Track recursion tree nodes for DP visualization.
    // Use a unique counter so repeated calls (e.g. fib(1) from fib(3) and fib(2))
    // get distinct IDs, avoiding React duplicate-key errors.
    const nodeLabel = formatFrame(name, values);
    const nodeId = "node-" + (dpTreeNodeCounter++);
    const parentNodeId = dpTreeParentStack.length > 0 ? dpTreeParentStack[dpTreeParentStack.length - 1] : null;
    const node = {
      id: nodeId,
      label: nodeLabel,
      children: [],
      depth: dpTreeParentStack.length,
    };
    dpTreeNodes.push(node);
    dpTreeNodeMap.set(nodeId, node);
    if (parentNodeId) {
      const parent = dpTreeNodeMap.get(parentNodeId);
      if (parent) parent.children.push(nodeId);
    }
    dpTreeParentStack.push(nodeId);

    const step = makeAutoStep(line, values, "Call " + name);
    step.title = "Call " + name;
    emit(step);
  };

  // The instrumenter rewrites "return <expr>;" into "return __autoReturn(…, <expr>);",
  // so this helper receives the actual computed value (evaluated exactly once),
  // records it on the step for the call tree, and passes it back through so the
  // rewritten return keeps the program's semantics unchanged.
  const __autoReturn = (line, values, note, value) => {
    const isRecursiveFrame = recursionFrames.length > 0;
    const step = makeAutoStep(line, values, isRecursiveFrame ? "Return from " + recursionFrames[recursionFrames.length - 1].label : note);
    step.title = isRecursiveFrame ? "Return" : "Line " + line;
    if (value !== undefined) {
      const formatted = formatConsoleValue(value);
      // Keep the pill small — a tree/list return would stringify into a wall of JSON.
      step.returnValue = formatted.length > 90 ? formatted.slice(0, 90) + "…" : formatted;
    }

    // Update the recursion tree node with its result and pop from the parent stack.
    if (dpTreeParentStack.length > 0) {
      const completedId = dpTreeParentStack.pop();
      const completedNode = dpTreeNodeMap.get(completedId);
      if (completedNode) {
        completedNode.result = value !== undefined ? formatConsoleValue(value) : undefined;
      }
    }

    emit(step);
    if (isRecursiveFrame) recursionFrames.pop();
    return value;
  };

  const __autoBranch = (line, label, value, values) => {
    // Count branch conditions that contain a comparison operator as
    // comparisons (e.g. i < n, arr[j] > arr[j + 1], left <= right).
    if (/[<>]=?|===?|!==?/.test(label)) comparisons += 1;
    const step = makeAutoStep(line, values, label + " → " + (value ? "true" : "false"));
    step.title = "Branch";
    emit(step);
    return value;
  };

  // Records the exact cell of a base[a][b] access and returns the read value.
  // source is the original source text (e.g. "matrix[top][i]"), kind is
  // "read" for plain reads and "write" for assignment/update targets.
  const __autoAccess = (name, object, rowIndex, colIndex, source, kind) => {
    const row = Number(rowIndex);
    const col = Number(colIndex);
    if (Number.isInteger(row) && Number.isInteger(col)) {
      lastAccess = { name, row, col, source, kind };
    }
    return object[rowIndex][colIndex];
  };

  // Side-effect-only recording used inside branch conditions (e.g.
  // if (grid[r][c] === "1")). Unlike __autoAccess it never evaluates the
  // cell, so short-circuiting conditions (i < n && matrix[i][j] === t) keep
  // their original semantics and out-of-bounds probes can't throw.
  const __autoRecord = (name, object, rowIndex, colIndex, source) => {
    const row = Number(rowIndex);
    const col = Number(colIndex);
    if (Number.isInteger(row) && Number.isInteger(col)) {
      try {
        if (object && object[row] != null) {
          void object[row][col];
          lastAccess = { name, row, col, source, kind: "read" };
        }
      } catch (error) {
        // Ignore — the real condition still evaluates the access itself.
      }
    }
  };

  // ---- Missing-property typo errors --------------------------------------
  // JavaScript reads of a property that doesn't exist silently return
  // undefined (arr.lengthhhh → undefined), so typos produce no error and the
  // trace just looks wrong. The instrumenter rewrites eligible member reads
  // (obj.prop / obj["prop"]) into __autoProp(...) calls; this helper verifies
  // the property against the object's shape (own keys + prototype members)
  // and throws a TypeError with a "did you mean" hint when the read is
  // clearly a typo. Reads that aren't close to anything real (optional-field
  // probes like obj.missing === undefined) pass through untouched, so
  // intentional undefined checks keep their normal JS semantics.
  const STRING_MEMBERS = ["length", "charAt", "charCodeAt", "codePointAt", "at", "concat", "includes", "endsWith", "startsWith", "indexOf", "lastIndexOf", "localeCompare", "match", "matchAll", "normalize", "padEnd", "padStart", "repeat", "replace", "replaceAll", "search", "slice", "split", "substring", "substr", "toLowerCase", "toUpperCase", "trim", "trimStart", "trimEnd", "valueOf", "toString"];
  const ARRAY_MEMBERS = ["length", "push", "pop", "shift", "unshift", "slice", "splice", "concat", "join", "indexOf", "lastIndexOf", "includes", "find", "findIndex", "filter", "map", "reduce", "some", "every", "forEach", "sort", "reverse", "fill", "flat", "at", "keys", "values", "entries", "toString"];
  const OBJECT_MEMBERS = ["hasOwnProperty", "toString", "valueOf", "keys", "values", "entries"];

  const editDistance = (a, b) => {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    let curr = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      curr[0] = i;
      for (let j = 1; j <= n; j++) {
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      }
      const swap = prev;
      prev = curr;
      curr = swap;
    }
    return prev[n];
  };

  // Best candidate for a missing property, or null when nothing is close
  // (deliberately conservative: only error when we can point at a real typo,
  // so intentional undefined reads like obj.optional !== undefined stay
  // quiet). The in-check already covers prototype members (length, push, …),
  // so these lists only feed the suggestion.
  const suggestProperty = (prop, target) => {
    const propLower = String(prop).toLowerCase();
    if (!propLower) return null;
    const candidates = [];
    if (typeof target === "string") candidates.push(...STRING_MEMBERS);
    else if (Array.isArray(target)) candidates.push(...ARRAY_MEMBERS);
    else candidates.push(...OBJECT_MEMBERS);
    for (const key of Object.keys(target)) candidates.push(String(key));
    let best = null;
    let bestScore = Infinity;
    for (const candidate of candidates) {
      const cLower = candidate.toLowerCase();
      if (cLower === propLower) continue;
      let score;
      if (cLower.startsWith(propLower) || propLower.startsWith(cLower)) {
        // Prefix typos (len → length) and appended typos (lengthhhh → length).
        score = Math.abs(cLower.length - propLower.length) + 1;
      } else {
        const dist = editDistance(cLower, propLower);
        if (dist > 2) continue;
        score = dist;
      }
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    return best;
  };

  const __autoProp = (object, prop, source) => {
    // null/undefined reads throw the natural TypeError — no hint needed.
    if (object === null || object === undefined) return object[prop];
    const isString = typeof object === "string";
    if (typeof object !== "object" && typeof object !== "function" && !isString) return object[prop];
    // The in-check covers own keys and the prototype chain (length, push,
    // toString …), so valid reads are a single cheap lookup and never
    // false-positive.
    const available = isString ? String.prototype : object;
    if (!(prop in available)) {
      const hint = suggestProperty(prop, object);
      if (hint !== null) {
        throw new TypeError('"' + prop + '" is not a property of ' + source + ' — did you mean "' + hint + '"?');
      }
    }
    return object[prop];
  };

  try {
    const input = JSON.parse(inputText);
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const __autoCapture = (line, values, note) => emit(makeAutoStep(line, values, note));
    const fn = new AsyncFunction("input", "emit", "console", "__autoCapture", "__autoEnter", "__autoReturn", "__autoBranch", "__autoAccess", "__autoRecord", "__autoProp", "\\"use strict\\";\\n" + code);
    const result = await fn(input, emit, console, __autoCapture, __autoEnter, __autoReturn, __autoBranch, __autoAccess, __autoRecord, __autoProp);

    // Convert ListNode/TreeNode results back to LeetCode-style arrays so the
    // Output strip shows [1, 2, 3, 4] instead of nested { val, next } JSON.
    const nodeResultToArray = (value) => {
      if (isNode(value)) {
        const out = [];
        const seen = new Set();
        let node = value;
        let guard = 0;
        while (node && isNode(node) && !seen.has(node) && guard < 10000) {
          seen.add(node);
          out.push(node.val ?? node.value);
          node = node.next;
          guard += 1;
        }
        return out;
      }
      if (isTreeNode(value)) {
        const out = [];
        const queue = [value];
        while (queue.length) {
          const node = queue.shift();
          if (!node) {
            out.push(null);
            continue;
          }
          out.push(node.val ?? node.value);
          queue.push(node.left, node.right);
        }
        while (out.length && out[out.length - 1] === null) out.pop();
        return out;
      }
      if (isGraphNode(value)) {
        // Clone-graph style: return the adjacency in LeetCode's encoding,
        // adjList[i] = sorted neighbor values of node i+1.
        const byVal = new Map();
        const seen = new Set();
        const queue = [value];
        while (queue.length) {
          const node = queue.shift();
          if (!node || seen.has(node)) continue;
          seen.add(node);
          byVal.set(node.val ?? node.value, (node.neighbors ?? []).map((n) => n.val ?? n.value).sort((a, b) => a - b));
          queue.push(...(node.neighbors ?? []));
        }
        if (byVal.size === 0) return [];
        const maxVal = Math.max(...byVal.keys());
        const out = [];
        for (let v = 1; v <= maxVal; v++) out.push(byVal.get(v) ?? []);
        return out;
      }
      if (Array.isArray(value)) return value.map(nodeResultToArray);
      return value;
    };

    self.postMessage({
      ok: true,
      steps: safeClone(steps),
      result: safeClone(nodeResultToArray(result)),
    });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error && error.message ? error.message : String(error),
      steps: safeClone(steps),
    });
  }
};
`;
}
