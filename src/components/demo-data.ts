export type DemoNode = {
  value: number;
  left?: DemoNode;
  right?: DemoNode;
};

export type DemoVisual =
  | { kind: "bars"; arr: number[]; active: number[]; done?: boolean }
  | { kind: "call-stack"; callStack: string[]; done?: boolean }
  | { kind: "pointers"; arr: number[]; lo: number; hi: number; mid?: number; found?: boolean; done?: boolean }
  | { kind: "tree"; root: DemoNode; active?: string; done?: boolean }
  | { kind: "hashmap"; arr: number[]; active?: number[]; map: Array<[string, string | number]>; done?: boolean };

export type DemoState = {
  line: number;
  note: string;
  visual: DemoVisual;
};

export type DemoDefinition = {
  id: string;
  label: string;
  codeLines: string[];
  states: DemoState[];
};

export const BUBBLE_SORT_DEMO: DemoDefinition = {
  id: "bubble-sort",
  label: "Bubble sort",
  codeLines: [
    "const arr = [...input.array];",
    "",
    "for (let i = 0; i < arr.length - 1; i++) {",
    "  for (let j = 0; j < arr.length - i - 1; j++) {",
    "    if (arr[j] > arr[j + 1]) {",
    "      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];",
    "    }",
    "  }",
    "}",
    "",
    "return arr;",
  ],
  states: [
    { line: 1, note: "Copy the input array", visual: { kind: "bars", arr: [5, 3, 8, 1, 2], active: [] } },
    { line: 3, note: "Compare 5 > 3 → swap", visual: { kind: "bars", arr: [5, 3, 8, 1, 2], active: [0, 1] } },
    { line: 6, note: "Swapped", visual: { kind: "bars", arr: [3, 5, 8, 1, 2], active: [0, 1] } },
    { line: 3, note: "Compare 5 > 8 → keep", visual: { kind: "bars", arr: [3, 5, 8, 1, 2], active: [1, 2] } },
    { line: 3, note: "Compare 8 > 1 → swap", visual: { kind: "bars", arr: [3, 5, 8, 1, 2], active: [2, 3] } },
    { line: 6, note: "Swapped", visual: { kind: "bars", arr: [3, 5, 1, 8, 2], active: [2, 3] } },
    { line: 3, note: "Compare 8 > 2 → swap", visual: { kind: "bars", arr: [3, 5, 1, 8, 2], active: [3, 4] } },
    { line: 6, note: "Swapped — 8 locked in", visual: { kind: "bars", arr: [3, 5, 1, 2, 8], active: [3, 4] } },
    { line: 3, note: "Compare 5 > 1 → swap", visual: { kind: "bars", arr: [3, 5, 1, 2, 8], active: [1, 2] } },
    { line: 6, note: "Swapped", visual: { kind: "bars", arr: [3, 1, 5, 2, 8], active: [1, 2] } },
    { line: 3, note: "Compare 5 > 2 → swap", visual: { kind: "bars", arr: [3, 1, 5, 2, 8], active: [2, 3] } },
    { line: 6, note: "Swapped", visual: { kind: "bars", arr: [3, 1, 2, 5, 8], active: [2, 3] } },
    { line: 3, note: "Compare 3 > 1 → swap", visual: { kind: "bars", arr: [3, 1, 2, 5, 8], active: [0, 1] } },
    { line: 6, note: "Swapped", visual: { kind: "bars", arr: [1, 3, 2, 5, 8], active: [0, 1] } },
    { line: 3, note: "Compare 3 > 2 → swap", visual: { kind: "bars", arr: [1, 3, 2, 5, 8], active: [1, 2] } },
    { line: 6, note: "Swapped", visual: { kind: "bars", arr: [1, 2, 3, 5, 8], active: [1, 2] } },
    { line: 11, note: "Sorted! Return the array", visual: { kind: "bars", arr: [1, 2, 3, 5, 8], active: [], done: true } },
  ],
};

export const FIBONACCI_DEMO: DemoDefinition = {
  id: "fibonacci",
  label: "Fibonacci recursion",
  codeLines: [
    "function fib(n) {",
    "  if (n <= 1) return n;",
    "  return fib(n - 1) + fib(n - 2);",
    "}",
    "",
    "return fib(5);",
  ],
  states: [
    { line: 6, note: "Start the trace: call fib(5)", visual: { kind: "call-stack", callStack: [] } },
    { line: 1, note: "Enter fib(5) — 5 ≤ 1? No, keep going", visual: { kind: "call-stack", callStack: ["fib(5)"] } },
    { line: 3, note: "Evaluate fib(5) → fib(4) first", visual: { kind: "call-stack", callStack: ["fib(5)"] } },
    { line: 1, note: "Enter fib(4)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)"] } },
    { line: 3, note: "Evaluate fib(4) → fib(3) first", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)"] } },
    { line: 1, note: "Enter fib(3)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)"] } },
    { line: 3, note: "Evaluate fib(3) → fib(2) first", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)"] } },
    { line: 1, note: "Enter fib(2)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(2)"] } },
    { line: 3, note: "Evaluate fib(2) → fib(1) first", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(2)"] } },
    { line: 1, note: "Enter fib(1)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(2)", "fib(1)"] } },
    { line: 2, note: "Base case: 1 ≤ 1 → return 1", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(2)", "fib(1)"] } },
    { line: 3, note: "fib(1) = 1 → back in fib(2), call fib(0)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(2)"] } },
    { line: 1, note: "Enter fib(0)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(2)", "fib(0)"] } },
    { line: 2, note: "Base case: 0 ≤ 1 → return 0", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(2)", "fib(0)"] } },
    { line: 3, note: "fib(2) = 1 + 0 = 1 → return 1", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(2)"] } },
    { line: 3, note: "fib(2) = 1 → fib(3) calls fib(1)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)"] } },
    { line: 1, note: "Enter fib(1)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(1)"] } },
    { line: 2, note: "Base case → return 1", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)", "fib(1)"] } },
    { line: 3, note: "fib(3) = 1 + 1 = 2 → return 2", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(3)"] } },
    { line: 3, note: "fib(3) = 2 → fib(4) calls fib(2)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)"] } },
    { line: 1, note: "Enter fib(2)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(2)"] } },
    { line: 3, note: "Evaluate fib(2) → fib(1) first", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(2)"] } },
    { line: 1, note: "Enter fib(1)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(2)", "fib(1)"] } },
    { line: 2, note: "Base case → return 1", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(2)", "fib(1)"] } },
    { line: 3, note: "fib(1) = 1 → back in fib(2), call fib(0)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(2)"] } },
    { line: 1, note: "Enter fib(0)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(2)", "fib(0)"] } },
    { line: 2, note: "Base case → return 0", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(2)", "fib(0)"] } },
    { line: 3, note: "fib(2) = 1 + 0 = 1 → return 1", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)", "fib(2)"] } },
    { line: 3, note: "fib(4) = 2 + 1 = 3 → return 3", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(4)"] } },
    { line: 3, note: "fib(4) = 3 → fib(5) calls fib(3)", visual: { kind: "call-stack", callStack: ["fib(5)"] } },
    { line: 1, note: "Enter fib(3) — recomputed, no memo", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)"] } },
    { line: 3, note: "Evaluate fib(3) → fib(2) first", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)"] } },
    { line: 1, note: "Enter fib(2)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)", "fib(2)"] } },
    { line: 3, note: "Evaluate fib(2) → fib(1) first", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)", "fib(2)"] } },
    { line: 1, note: "Enter fib(1)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)", "fib(2)", "fib(1)"] } },
    { line: 2, note: "Base case → return 1", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)", "fib(2)", "fib(1)"] } },
    { line: 3, note: "fib(1) = 1 → back in fib(2), call fib(0)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)", "fib(2)"] } },
    { line: 1, note: "Enter fib(0)", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)", "fib(2)", "fib(0)"] } },
    { line: 2, note: "Base case → return 0", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)", "fib(2)", "fib(0)"] } },
    { line: 3, note: "fib(2) = 1 + 0 = 1 → return 1", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)", "fib(2)"] } },
    { line: 3, note: "fib(3) = 1 + 1 = 2 → return 2", visual: { kind: "call-stack", callStack: ["fib(5)", "fib(3)"] } },
    { line: 3, note: "fib(5) = 3 + 2 = 5 → return 5", visual: { kind: "call-stack", callStack: ["fib(5)"], done: true } },
    { line: 6, note: "Result: 5 — the stack is empty again", visual: { kind: "call-stack", callStack: [], done: true } },
  ],
};

export const BINARY_SEARCH_DEMO: DemoDefinition = {
  id: "binary-search",
  label: "Binary search",
  codeLines: [
    "function binarySearch(arr, target) {",
    "  let lo = 0, hi = arr.length - 1;",
    "  while (lo <= hi) {",
    "    const mid = Math.floor((lo + hi) / 2);",
    "    if (arr[mid] === target) return mid;",
    "    if (arr[mid] < target) lo = mid + 1;",
    "    else hi = mid - 1;",
    "  }",
    "  return -1;",
    "}",
    "",
    "return binarySearch([1, 3, 5, 7, 9, 11, 13], 9);",
  ],
  states: [
    {
      line: 2,
      note: "lo = 0, hi = 6 — the search space is the whole array",
      visual: { kind: "pointers", arr: [1, 3, 5, 7, 9, 11, 13], lo: 0, hi: 6 },
    },
    {
      line: 4,
      note: "mid = (0+6)/2 = 3 → arr[3] = 7",
      visual: { kind: "pointers", arr: [1, 3, 5, 7, 9, 11, 13], lo: 0, hi: 6, mid: 3 },
    },
    {
      line: 6,
      note: "7 < 9 → discard the left half, lo = 4",
      visual: { kind: "pointers", arr: [1, 3, 5, 7, 9, 11, 13], lo: 4, hi: 6 },
    },
    {
      line: 4,
      note: "mid = (4+6)/2 = 5 → arr[5] = 11",
      visual: { kind: "pointers", arr: [1, 3, 5, 7, 9, 11, 13], lo: 4, hi: 6, mid: 5 },
    },
    {
      line: 7,
      note: "11 > 9 → discard the right half, hi = 4",
      visual: { kind: "pointers", arr: [1, 3, 5, 7, 9, 11, 13], lo: 4, hi: 4 },
    },
    {
      line: 4,
      note: "mid = 4 → arr[4] = 9. Found it!",
      visual: { kind: "pointers", arr: [1, 3, 5, 7, 9, 11, 13], lo: 4, hi: 4, mid: 4 },
    },
    {
      line: 5,
      note: "Return index 4 — only 3 midpoints examined",
      visual: { kind: "pointers", arr: [1, 3, 5, 7, 9, 11, 13], lo: 4, hi: 4, mid: 4, found: true, done: true },
    },
  ],
};

const INVERT_TREE_DEMO: DemoDefinition = {
  id: "invert-binary-tree",
  label: "Invert Binary Tree",
  codeLines: [
    "function invertTree(root) {",
    "  if (!root) return null;",
    "  [root.left, root.right] = [root.right, root.left];",
    "  invertTree(root.left);",
    "  invertTree(root.right);",
    "  return root;",
    "}",
    "",
    "return invertTree(tree);",
  ],
  states: [
    {
      line: 9,
      note: "Start at the root — invertTree(4)",
      visual: {
        kind: "tree",
        root: { value: 4, left: { value: 2, left: { value: 1 }, right: { value: 3 } }, right: { value: 7, left: { value: 6 }, right: { value: 9 } } },
        active: "4",
      },
    },
    {
      line: 3,
      note: "Swap 4's children: 2 ⟷ 7",
      visual: {
        kind: "tree",
        root: { value: 4, left: { value: 7, left: { value: 6 }, right: { value: 9 } }, right: { value: 2, left: { value: 1 }, right: { value: 3 } } },
        active: "7",
      },
    },
    {
      line: 3,
      note: "Swap 7's children: 6 ⟷ 9",
      visual: {
        kind: "tree",
        root: { value: 4, left: { value: 7, left: { value: 9 }, right: { value: 6 } }, right: { value: 2, left: { value: 1 }, right: { value: 3 } } },
        active: "9",
      },
    },
    {
      line: 2,
      note: "9 is a leaf — nothing to swap, return",
      visual: {
        kind: "tree",
        root: { value: 4, left: { value: 7, left: { value: 9 }, right: { value: 6 } }, right: { value: 2, left: { value: 1 }, right: { value: 3 } } },
        active: "6",
      },
    },
    {
      line: 3,
      note: "Back up to 2 — swap its children: 1 ⟷ 3",
      visual: {
        kind: "tree",
        root: { value: 4, left: { value: 7, left: { value: 9 }, right: { value: 6 } }, right: { value: 2, left: { value: 3 }, right: { value: 1 } } },
        active: "3",
      },
    },
    {
      line: 5,
      note: "Every subtree inverted — the whole tree is mirrored!",
      visual: {
        kind: "tree",
        root: { value: 4, left: { value: 7, left: { value: 9 }, right: { value: 6 } }, right: { value: 2, left: { value: 3 }, right: { value: 1 } } },
        active: "4",
        done: true,
      },
    },
  ],
};

const TWO_SUM_DEMO: DemoDefinition = {
  id: "two-sum",
  label: "Two Sum (hash map)",
  codeLines: [
    "function twoSum(nums, target) {",
    "  const seen = new Map();",
    "  for (let i = 0; i < nums.length; i++) {",
    "    const complement = target - nums[i];",
    "    if (seen.has(complement)) return [seen.get(complement), i];",
    "    seen.set(nums[i], i);",
    "  }",
    "  return [];",
    "}",
    "",
    "return twoSum([2, 7, 11, 15], 9);",
  ],
  states: [
    {
      line: 2,
      note: "seen = {} — no numbers remembered yet",
      visual: { kind: "hashmap", arr: [2, 7, 11, 15], map: [] },
    },
    {
      line: 3,
      note: "i = 0 → nums[0] = 2",
      visual: { kind: "hashmap", arr: [2, 7, 11, 15], active: [0], map: [] },
    },
    {
      line: 4,
      note: "complement = 9 − 2 = 7 — is 7 in seen? No",
      visual: { kind: "hashmap", arr: [2, 7, 11, 15], active: [0], map: [] },
    },
    {
      line: 6,
      note: "Remember 2 → index 0",
      visual: { kind: "hashmap", arr: [2, 7, 11, 15], active: [0], map: [["2", 0]] },
    },
    {
      line: 3,
      note: "i = 1 → nums[1] = 7",
      visual: { kind: "hashmap", arr: [2, 7, 11, 15], active: [1], map: [["2", 0]] },
    },
    {
      line: 4,
      note: "complement = 9 − 7 = 2 — 2 is in seen!",
      visual: { kind: "hashmap", arr: [2, 7, 11, 15], active: [1], map: [["2", 0]] },
    },
    {
      line: 5,
      note: "Return [0, 1] — 2 + 7 = 9. One pass, O(n)",
      visual: { kind: "hashmap", arr: [2, 7, 11, 15], active: [0, 1], map: [["2", 0]], done: true },
    },
  ],
};

export const DEMOS: DemoDefinition[] = [
  BUBBLE_SORT_DEMO,
  BINARY_SEARCH_DEMO,
  INVERT_TREE_DEMO,
  TWO_SUM_DEMO,
  FIBONACCI_DEMO,
];
