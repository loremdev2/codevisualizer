export type GraphInput = Record<string, Array<string | number>>;

export type MatrixCell = string | number | boolean | null | Record<string, unknown>;

export type Matrix = MatrixCell[][];

export type MatrixCellChange = {
  row: number;
  col: number;
  previousValue?: MatrixCell;
  value?: MatrixCell;
};

export type MatrixAccess = {
  /** The exact source text of the access, e.g. `matrix[top][i]`. */
  source: string;
  row: number;
  col: number;
  kind: "read" | "write";
};

/**
 * Normalized linked-list capture (node ids are stable across a run).
 *
 * Built in the worker by walking the node-object chain — the step never
 * carries raw node objects, only ids + primitives, so cyclic lists (Floyd's)
 * stay JSON-safe. `lists` maps a chain name (head / l1 / l2 / dummy …) to its
 * ordered node ids; `pointers` maps pointer variables (curr, prev, slow,
 * fast …) to the node id they reference.
 */
export type LinkedListStep = {
  /** Node id → node value (primitive). */
  values: Record<string, string | number | boolean | null>;
  /** Node id → next node id (null at the tail). */
  next: Record<string, number | null>;
  /** Node id → previous node id, present only for doubly-linked lists. */
  prev?: Record<string, number | null> | null;
  /** Named chains to draw: chain name → ordered node ids + optional cycle start. */
  lists: Record<string, { order: number[]; cycleStart?: number | null }>;
  /** Pointer variable name → node id it points at. */
  pointers: Record<string, number | null>;
  /** The node being processed this step. */
  active?: number | null;
  /** Node whose value changed since the previous step. */
  changedValue?: number | null;
  /** Node whose next link changed: { node, to, previousTo }. */
  changedLink?: { node: number; to: number | null; previousTo: number | null } | null;
};

/**
 * Normalized binary-tree capture (node ids are stable across a run).
 *
 * Same contract as `LinkedListStep`: steps carry ids + primitives only, never
 * raw node objects. `roots` maps a tree variable name (root / tree …) to its
 * root node id; every other tree-typed variable becomes a pointer arrow onto
 * a node (node, curr, p, q …).
 */
export type TreeStep = {
  /** Node id → node value (primitive). */
  values: Record<string, string | number | boolean | null>;
  /** Node id → left child node id (null when absent). */
  left: Record<string, number | null>;
  /** Node id → right child node id (null when absent). */
  right: Record<string, number | null>;
  /** Tree variable name → its root node id (one row per named tree). */
  roots: Record<string, number>;
  /** Pointer variable name → node id it points at. */
  pointers: Record<string, number | null>;
  /** The node being processed this step. */
  active?: number | null;
  /** Node whose value changed since the previous step. */
  changedValue?: number | null;
};

/** Cumulative operation counters for a run (for complexity learning). */
export type TraceOperations = {
  /** Branch conditions evaluated that contain a comparison operator. */
  comparisons: number;
  /** Array exchange events (exactly two positions swapped). */
  swaps: number;
  /** Changed cells / array positions / string characters. */
  writes: number;
};

export type VisualStep = {
  id?: number;
  title?: string;
  note?: string;
  line?: number;
  /** Name of the source variable backing each rendered structure. */
  arrayName?: string;
  stringName?: string;
  hashMapName?: string;
  matrixName?: string;
  graphName?: string;
  setName?: string;
  stackName?: string;
  queueName?: string;
  visitedName?: string;
  array?: number[];
  string?: string;
  hashMap?: Record<string, string | number | boolean | null>;
  /** A Set captured by identity (JS Set / Python set), serialized to an array. */
  set?: Array<string | number>;
  active?: number[];
  sorted?: number[];
  /** Pivot index for quicksort visualization. */
  pivot?: number;
  range?: [number, number];
  window?: [number, number];
  pointers?: Record<string, string | number | boolean | null>;
  stack?: Array<string | number>;
  callStack?: Array<string | number>;
  queue?: Array<string | number>;
  visited?: Array<string | number>;
  /** Min-heap / max-heap snapshot: heap.items is the array, heap.kind the ordering. */
  heap?: { items: Array<string | number>; kind: "min" | "max"; name: string };
  /** Indices the heap's sift operation touched this step (highlighted). */
  heapActive?: number[];
  frontier?: Array<string | number>;
  graph?: GraphInput;
  activeNode?: string | number;
  matrix?: Matrix;
  activeCell?: { row: number; col: number };
  changedCells?: MatrixCellChange[];
  access?: MatrixAccess;
  linkedList?: LinkedListStep;
  tree?: TreeStep;
  // ---- Dynamic programming ----
  /** Bottom-up DP table (2D array), e.g. dp[i][j] in LCS / knapsack. */
  dpTable?: (string | number | boolean | null)[][];
  /** Name of the variable backing the dpTable. */
  dpTableName?: string;
  /** Cell being computed in a bottom-up DP fill: { row, col } into dpTable. */
  dpActiveCell?: { row: number; col: number };
  /** Cells the current DP cell depends on (arrows from dependency → active). */
  dpDependencies?: Array<{ row: number; col: number }>;
  /** 1-D DP array (e.g. fibonacci memo, coin change table). Rendered as a special array with filled/unfilled indicators. */
  dpArray?: (string | number | boolean | null)[];
  /** Name of the variable backing the dpArray. */
  dpArrayName?: string;
  /** Index being computed in a 1-D DP fill. */
  dpActiveIndex?: number;
  /** Indices the current 1-D DP cell depends on. */
  dpArrayDependencies?: number[];
  /** Top-down memoization cache snapshot (Map/Object serialized to entries). */
  memoTable?: Record<string, string | number | boolean | null>;
  /** Name of the variable backing the memoTable. */
  memoTableName?: string;
  /** Entry most recently written to the memo table. */
  memoActive?: { key: string; value: string | number | boolean | null };
  /** Recursion tree nodes for top-down DP visualization. */
  recursionTree?: RecursionTreeNode[];
  /** Node being processed in the recursion tree. */
  recursionActive?: string;

  /** Ordered path of nodes from start to goal (for graph shortest-path highlighting). */
  graphPath?: Array<string | number>;
  /** Ordered cells forming the optimal path through a DP matrix. */
  matrixPath?: Array<{ row: number; col: number }>;
  result?: unknown;
  phase?: string;
  /** Actual value a Return step produced (formatted string), for the call tree. */
  returnValue?: string;
  ops?: TraceOperations;
};

/** A node in the DP recursion tree (top-down approach). */
export type RecursionTreeNode = {
  /** Unique id for this subproblem (e.g. "fib(5)", "dfs(2,3)"). */
  id: string;
  /** Display label (e.g. "fib(5)", "LCS(2,3)"). */
  label: string;
  /** Computed result (may be undefined if still pending). */
  result?: string | number | boolean | null;
  /** Child node ids (subproblems this one calls). */
  children: string[];
  /** Whether this node's result was served from cache. */
  cached?: boolean;
  /** Depth in the recursion tree (for layout). */
  depth: number;
};

export type AlgorithmTemplate = {
  id: string;
  name: string;
  category: string;
  code: string;
  input: Record<string, unknown>;
  language?: string;
  /** Canonical edge-case inputs with friendly names (the "Examples" library). */
  examples?: Array<{
    label: string;
    input: Record<string, unknown>;
    /** Known correct result for this example (traced and verified). */
    expected?: unknown;
  }>;
  /** Known correct result for the default input (traced and verified). */
  expected?: unknown;
  /** Pre-written code per language. Keys not present fall back to \`code\` (JS default). */
  languages?: Partial<Record<SolutionLanguage, string>>;
  /** Naive/brute-force JS code (shown via the Brute/Optimal toggle). */
  bruteCode?: string;
  /** Brute-force variants per language. */
  bruteLanguages?: Partial<Record<SolutionLanguage, string>>;
};

/** Languages for which a template has pre-written code. */
export type SolutionLanguage = "javascript" | "typescript" | "python" | "java" | "cpp";

/** Resolve the code for a template in a given language. Falls back to `code` (JS default). */
export function templateCodeFor(
  template: AlgorithmTemplate,
  language: SolutionLanguage,
  variant: "optimal" | "brute" = "optimal",
): string | undefined {
  if (variant === "brute") {
    return template.bruteLanguages?.[language] ?? (language === "javascript" ? template.bruteCode : undefined);
  }
  return template.languages?.[language] ?? (language === "javascript" ? template.code : undefined);
}

/** Languages with pre-written code for this template. Always includes "javascript". */
export function templateLanguagesFor(template: AlgorithmTemplate): SolutionLanguage[] {
  const langs: SolutionLanguage[] = ["javascript"];
  for (const lang of ["typescript", "python", "java", "cpp"] as const) {
    if (template.languages?.[lang]) langs.push(lang);
  }
  return langs;
}
