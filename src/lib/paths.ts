import { algorithmTemplates } from "@/lib/templates";

// ---------------------------------------------------------------------------
// Learning paths / curriculum.
//
// Templates used to be one flat list; they now belong to ordered paths so the
// visualizer can guide a learner from fundamentals to advanced topics. The
// core sequence is Arrays → Two pointers → Sliding window → Recursion → Trees
// → Graphs → DP; a few extra paths (linked lists, stacks & hashing, matrices)
// cover the templates that don't fit the core sequence.
//
// Paths are suggestions, not gates: every template is always selectable, and
// progress is tracked per template purely so learners can see where they are.
// ---------------------------------------------------------------------------

export type LearningPath = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  /** Curriculum position (lower = earlier). */
  order: number;
  /** Ordered template ids. Empty = placeholder for future content. */
  templateIds: string[];
  /** Placeholder path with no templates yet (shown as coming soon). */
  comingSoon?: boolean;
};

export const learningPaths: LearningPath[] = [
  {
    id: "arrays",
    title: "Arrays",
    tagline: "Sorting and the foundation of algorithm state",
    description:
      "See how loops walk array indices, how swaps move values, and how the same algorithm reads differently in JavaScript and Python.",
    order: 1,
    templateIds: [
      "bubble-sort",
      "selection-sort",
      "insertion-sort",
      "merge-sort",
      "quick-sort",
      "heap-sort",
      "counting-sort",
      "maximum-subarray",
      "sort-colors",
    ],
  },
  {
    id: "two-pointers",
    title: "Two pointers",
    tagline: "Binary search and narrowing the search space",
    description:
      "Left/right and slow/fast pointers shrink what an algorithm has to look at. Learn binary search plus pointer techniques on lists.",
    order: 2,
    templateIds: [
      "binary-search",
      "middle-of-linked-list",
      "nth-node-from-end",
      "valid-palindrome",
      "container-with-most-water",
    ],
  },
  {
    id: "sliding-window",
    title: "Sliding window",
    tagline: "Subarray and substring problems in one pass",
    description:
      "A window that grows and shrinks across the input solves many O(n) substring problems. Watch the window bounds and the map of counts move together.",
    order: 3,
    templateIds: ["sliding-window", "character-replacement", "longest-substring-without-repeating"],
  },
  {
    id: "recursion",
    title: "Recursion",
    tagline: "Decompose a problem into smaller versions of itself",
    description:
      "Watch recursive calls push onto the call stack, branch through the graph, and unwind. Tracing a recursive template is the fastest way to build intuition for each call's effect.",
    order: 4,
    templateIds: ["recursive-dfs", "subsets", "generate-parentheses"],
  },
  {
    id: "trees",
    title: "Trees",
    tagline: "Recursive structure, level by level",
    description:
      "Binary trees are the classic recursion workout: mirror the tree, compute depth, and watch node pointers move down each branch.",
    order: 5,
    templateIds: ["invert-binary-tree", "max-depth-binary-tree", "symmetric-tree", "level-order-traversal"],
  },
  {
    id: "graphs",
    title: "Graphs",
    tagline: "Traversal order and visited sets",
    description:
      "DFS and BFS order decide everything on graphs. Watch the frontier grow, nodes get visited, and grid problems behave like graph problems.",
    order: 6,
    templateIds: ["dfs-graph", "number-of-islands", "bfs-graph", "bfs-shortest-path", "course-schedule"],
  },
  {
    id: "dp",
    title: "Dynamic programming",
    tagline: "Memoize the past to answer the future",
    description:
      "Overlapping subproblems: memoized recursion first, then bottom-up tables. Watch the memo fill in as Fibonacci and stair-climbing runs, then see how a DP table decides between take and skip.",
    order: 7,
    templateIds: ["fibonacci", "climbing-stairs", "house-robber", "coin-change", "longest-common-subsequence", "01-knapsack", "edit-distance", "minimum-path-sum"],
  },
  {
    id: "linked-lists",
    title: "Linked lists",
    tagline: "Rewiring pointers instead of moving values",
    description:
      "Reversing, merging, and cycle detection all come down to carefully reassigning next pointers. Watch the node links rewire step by step.",
    order: 8,
    templateIds: [
      "reverse-linked-list",
      "floyds-cycle-detection",
      "merge-two-sorted-lists",
      "add-two-numbers",
      "palindrome-linked-list",
    ],
  },
  {
    id: "stacks-hashing",
    title: "Stacks & hashing",
    tagline: "Ordering with a stack, lookup with a map",
    description:
      "A stack keeps the right order for balanced parentheses; a hash map turns a two-pass search into a single pass. See both structures in action.",
    order: 9,
    templateIds: ["valid-parentheses", "two-sum", "valid-anagram", "next-greater-element"],
  },
  {
    id: "matrices",
    title: "Matrices",
    tagline: "Row, column, and cell coordinates",
    description:
      "Two-dimensional state: spiral traversals, marking rows and columns, and indexing cells by [row][col].",
    order: 10,
    templateIds: ["spiral-matrix", "set-matrix-zeroes", "rotate-image"],
  },
];

export const orderedPaths: LearningPath[] = [...learningPaths].sort((a, b) => a.order - b.order);

// ---------------------------------------------------------------------------
// Progress model (pure — no storage here, see src/lib/progress.ts).
// ---------------------------------------------------------------------------

/** Per-template learning state. `traced` = ran successfully. */
export type TemplateProgress = {
  traced: boolean;
  /** Epoch-ms when this template was first traced. */
  tracedAt?: number;
};

export type LearningProgress = Record<string, TemplateProgress>;

export function emptyTemplateProgress(): TemplateProgress {
  return { traced: false };
}

export function templateProgress(
  progress: LearningProgress,
  templateId: string,
): TemplateProgress {
  return progress[templateId] ?? emptyTemplateProgress();
}

/** True when a template's code has been run. */
export function isTemplateComplete(
  progress: LearningProgress,
  templateId: string,
): boolean {
  return templateProgress(progress, templateId).traced;
}

export function pathForTemplate(templateId: string): LearningPath | undefined {
  return learningPaths.find((path) => path.templateIds.includes(templateId));
}

export function pathByIndex(index: number): LearningPath | undefined {
  return orderedPaths[index];
}

/** A path is complete when every non-placeholder template in it is complete. */
export function isPathComplete(path: LearningPath, progress: LearningProgress): boolean {
  if (path.comingSoon) return false;
  return path.templateIds.every((templateId) => isTemplateComplete(progress, templateId));
}

/** Fractional progress for a path's progress bar (0–1). */
export function pathCompletion(
  path: LearningPath,
  progress: LearningProgress,
): { done: number; total: number } {
  const total = path.comingSoon ? 0 : path.templateIds.length;
  const done = path.templateIds.filter((templateId) => isTemplateComplete(progress, templateId)).length;
  return { done, total };
}

/** Curriculum-wide stats, e.g. "3 of 10 paths complete". */
export function curriculumStats(progress: LearningProgress): { pathsDone: number; pathsTotal: number } {
  const pathsTotal = orderedPaths.filter((path) => !path.comingSoon).length;
  const pathsDone = orderedPaths.filter((path) => isPathComplete(path, progress)).length;
  return { pathsDone, pathsTotal };
}

/** Guards against drifting template data: every template belongs to exactly one path. */
export function validatePathAssignments(): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const path of learningPaths) {
    for (const templateId of path.templateIds) {
      if (seen.has(templateId)) problems.push(`${templateId} appears in multiple paths`);
      seen.add(templateId);
      if (!algorithmTemplates.some((template) => template.id === templateId)) {
        problems.push(`${path.id} references unknown template ${templateId}`);
      }
    }
  }
  for (const template of algorithmTemplates) {
    if (!seen.has(template.id)) problems.push(`${template.id} is not assigned to any path`);
  }
  return problems;
}
