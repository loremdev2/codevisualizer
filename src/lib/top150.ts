// ---------------------------------------------------------------------------
// LeetCode "Top Interview 150" question bank.
//
// Fetched from LeetCode's own study-plan API
// (https://leetcode.com/studyplan/top-interview-150/) and embedded here so the
// app never depends on a live network call. Topic order, question order, and
// difficulty mirror the official plan exactly. Problem statements are NOT
// reproduced in-app — each question links out to its LeetCode problem.
// ---------------------------------------------------------------------------

export type Top150Difficulty = "Easy" | "Medium" | "Hard";

export type Top150Question = {
  /** LeetCode problem number (questionFrontendId). */
  no: number;
  title: string;
  /** URL slug, e.g. "two-sum" → https://leetcode.com/problems/two-sum/ */
  slug: string;
  difficulty: Top150Difficulty;
};

export type Top150Topic = {
  id: string;
  title: string;
  questions: Top150Question[];
};

export const top150Topics: Top150Topic[] = [
  {
    id: "array-string",
    title: "Array / String",
    questions: [
      { no: 88, title: "Merge Sorted Array", slug: "merge-sorted-array", difficulty: "Easy" },
      { no: 27, title: "Remove Element", slug: "remove-element", difficulty: "Easy" },
      { no: 26, title: "Remove Duplicates from Sorted Array", slug: "remove-duplicates-from-sorted-array", difficulty: "Easy" },
      { no: 80, title: "Remove Duplicates from Sorted Array II", slug: "remove-duplicates-from-sorted-array-ii", difficulty: "Medium" },
      { no: 169, title: "Majority Element", slug: "majority-element", difficulty: "Easy" },
      { no: 189, title: "Rotate Array", slug: "rotate-array", difficulty: "Medium" },
      { no: 121, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Easy" },
      { no: 122, title: "Best Time to Buy and Sell Stock II", slug: "best-time-to-buy-and-sell-stock-ii", difficulty: "Medium" },
      { no: 55, title: "Jump Game", slug: "jump-game", difficulty: "Medium" },
      { no: 45, title: "Jump Game II", slug: "jump-game-ii", difficulty: "Medium" },
      { no: 274, title: "H-Index", slug: "h-index", difficulty: "Medium" },
      { no: 380, title: "Insert Delete GetRandom O(1)", slug: "insert-delete-getrandom-o1", difficulty: "Medium" },
      { no: 238, title: "Product of Array Except Self", slug: "product-of-array-except-self", difficulty: "Medium" },
      { no: 134, title: "Gas Station", slug: "gas-station", difficulty: "Medium" },
      { no: 135, title: "Candy", slug: "candy", difficulty: "Hard" },
      { no: 42, title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard" },
      { no: 13, title: "Roman to Integer", slug: "roman-to-integer", difficulty: "Easy" },
      { no: 12, title: "Integer to Roman", slug: "integer-to-roman", difficulty: "Medium" },
      { no: 58, title: "Length of Last Word", slug: "length-of-last-word", difficulty: "Easy" },
      { no: 14, title: "Longest Common Prefix", slug: "longest-common-prefix", difficulty: "Easy" },
      { no: 151, title: "Reverse Words in a String", slug: "reverse-words-in-a-string", difficulty: "Medium" },
      { no: 6, title: "Zigzag Conversion", slug: "zigzag-conversion", difficulty: "Medium" },
      { no: 28, title: "Find the Index of the First Occurrence in a String", slug: "find-the-index-of-the-first-occurrence-in-a-string", difficulty: "Easy" },
      { no: 68, title: "Text Justification", slug: "text-justification", difficulty: "Hard" },
    ],
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    questions: [
      { no: 125, title: "Valid Palindrome", slug: "valid-palindrome", difficulty: "Easy" },
      { no: 392, title: "Is Subsequence", slug: "is-subsequence", difficulty: "Easy" },
      { no: 167, title: "Two Sum II - Input Array Is Sorted", slug: "two-sum-ii-input-array-is-sorted", difficulty: "Medium" },
      { no: 11, title: "Container With Most Water", slug: "container-with-most-water", difficulty: "Medium" },
      { no: 15, title: "3Sum", slug: "3sum", difficulty: "Medium" },
    ],
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    questions: [
      { no: 209, title: "Minimum Size Subarray Sum", slug: "minimum-size-subarray-sum", difficulty: "Medium" },
      { no: 3, title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", difficulty: "Medium" },
      { no: 30, title: "Substring with Concatenation of All Words", slug: "substring-with-concatenation-of-all-words", difficulty: "Hard" },
      { no: 76, title: "Minimum Window Substring", slug: "minimum-window-substring", difficulty: "Hard" },
    ],
  },
  {
    id: "matrix",
    title: "Matrix",
    questions: [
      { no: 36, title: "Valid Sudoku", slug: "valid-sudoku", difficulty: "Medium" },
      { no: 54, title: "Spiral Matrix", slug: "spiral-matrix", difficulty: "Medium" },
      { no: 48, title: "Rotate Image", slug: "rotate-image", difficulty: "Medium" },
      { no: 73, title: "Set Matrix Zeroes", slug: "set-matrix-zeroes", difficulty: "Medium" },
      { no: 289, title: "Game of Life", slug: "game-of-life", difficulty: "Medium" },
    ],
  },
  {
    id: "hashmap",
    title: "Hashmap",
    questions: [
      { no: 383, title: "Ransom Note", slug: "ransom-note", difficulty: "Easy" },
      { no: 205, title: "Isomorphic Strings", slug: "isomorphic-strings", difficulty: "Easy" },
      { no: 290, title: "Word Pattern", slug: "word-pattern", difficulty: "Easy" },
      { no: 242, title: "Valid Anagram", slug: "valid-anagram", difficulty: "Easy" },
      { no: 49, title: "Group Anagrams", slug: "group-anagrams", difficulty: "Medium" },
      { no: 1, title: "Two Sum", slug: "two-sum", difficulty: "Easy" },
      { no: 202, title: "Happy Number", slug: "happy-number", difficulty: "Easy" },
      { no: 219, title: "Contains Duplicate II", slug: "contains-duplicate-ii", difficulty: "Easy" },
      { no: 128, title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence", difficulty: "Medium" },
    ],
  },
  {
    id: "intervals",
    title: "Intervals",
    questions: [
      { no: 228, title: "Summary Ranges", slug: "summary-ranges", difficulty: "Easy" },
      { no: 56, title: "Merge Intervals", slug: "merge-intervals", difficulty: "Medium" },
      { no: 57, title: "Insert Interval", slug: "insert-interval", difficulty: "Medium" },
      { no: 452, title: "Minimum Number of Arrows to Burst Balloons", slug: "minimum-number-of-arrows-to-burst-balloons", difficulty: "Medium" },
    ],
  },
  {
    id: "stack",
    title: "Stack",
    questions: [
      { no: 20, title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Easy" },
      { no: 71, title: "Simplify Path", slug: "simplify-path", difficulty: "Medium" },
      { no: 155, title: "Min Stack", slug: "min-stack", difficulty: "Medium" },
      { no: 150, title: "Evaluate Reverse Polish Notation", slug: "evaluate-reverse-polish-notation", difficulty: "Medium" },
      { no: 224, title: "Basic Calculator", slug: "basic-calculator", difficulty: "Hard" },
    ],
  },
  {
    id: "linked-list",
    title: "Linked List",
    questions: [
      { no: 141, title: "Linked List Cycle", slug: "linked-list-cycle", difficulty: "Easy" },
      { no: 2, title: "Add Two Numbers", slug: "add-two-numbers", difficulty: "Medium" },
      { no: 21, title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", difficulty: "Easy" },
      { no: 138, title: "Copy List with Random Pointer", slug: "copy-list-with-random-pointer", difficulty: "Medium" },
      { no: 92, title: "Reverse Linked List II", slug: "reverse-linked-list-ii", difficulty: "Medium" },
      { no: 25, title: "Reverse Nodes in k-Group", slug: "reverse-nodes-in-k-group", difficulty: "Hard" },
      { no: 19, title: "Remove Nth Node From End of List", slug: "remove-nth-node-from-end-of-list", difficulty: "Medium" },
      { no: 82, title: "Remove Duplicates from Sorted List II", slug: "remove-duplicates-from-sorted-list-ii", difficulty: "Medium" },
      { no: 61, title: "Rotate List", slug: "rotate-list", difficulty: "Medium" },
      { no: 86, title: "Partition List", slug: "partition-list", difficulty: "Medium" },
      { no: 146, title: "LRU Cache", slug: "lru-cache", difficulty: "Medium" },
    ],
  },
  {
    id: "binary-tree-general",
    title: "Binary Tree General",
    questions: [
      { no: 104, title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", difficulty: "Easy" },
      { no: 100, title: "Same Tree", slug: "same-tree", difficulty: "Easy" },
      { no: 226, title: "Invert Binary Tree", slug: "invert-binary-tree", difficulty: "Easy" },
      { no: 101, title: "Symmetric Tree", slug: "symmetric-tree", difficulty: "Easy" },
      { no: 105, title: "Construct Binary Tree from Preorder and Inorder Traversal", slug: "construct-binary-tree-from-preorder-and-inorder-traversal", difficulty: "Medium" },
      { no: 106, title: "Construct Binary Tree from Inorder and Postorder Traversal", slug: "construct-binary-tree-from-inorder-and-postorder-traversal", difficulty: "Medium" },
      { no: 117, title: "Populating Next Right Pointers in Each Node II", slug: "populating-next-right-pointers-in-each-node-ii", difficulty: "Medium" },
      { no: 114, title: "Flatten Binary Tree to Linked List", slug: "flatten-binary-tree-to-linked-list", difficulty: "Medium" },
      { no: 112, title: "Path Sum", slug: "path-sum", difficulty: "Easy" },
      { no: 129, title: "Sum Root to Leaf Numbers", slug: "sum-root-to-leaf-numbers", difficulty: "Medium" },
      { no: 124, title: "Binary Tree Maximum Path Sum", slug: "binary-tree-maximum-path-sum", difficulty: "Hard" },
      { no: 173, title: "Binary Search Tree Iterator", slug: "binary-search-tree-iterator", difficulty: "Medium" },
      { no: 222, title: "Count Complete Tree Nodes", slug: "count-complete-tree-nodes", difficulty: "Medium" },
      { no: 236, title: "Lowest Common Ancestor of a Binary Tree", slug: "lowest-common-ancestor-of-a-binary-tree", difficulty: "Medium" },
    ],
  },
  {
    id: "binary-tree-bfs",
    title: "Binary Tree BFS",
    questions: [
      { no: 199, title: "Binary Tree Right Side View", slug: "binary-tree-right-side-view", difficulty: "Medium" },
      { no: 637, title: "Average of Levels in Binary Tree", slug: "average-of-levels-in-binary-tree", difficulty: "Easy" },
      { no: 102, title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal", difficulty: "Medium" },
      { no: 103, title: "Binary Tree Zigzag Level Order Traversal", slug: "binary-tree-zigzag-level-order-traversal", difficulty: "Medium" },
    ],
  },
  {
    id: "binary-search-tree",
    title: "Binary Search Tree",
    questions: [
      { no: 530, title: "Minimum Absolute Difference in BST", slug: "minimum-absolute-difference-in-bst", difficulty: "Easy" },
      { no: 230, title: "Kth Smallest Element in a BST", slug: "kth-smallest-element-in-a-bst", difficulty: "Medium" },
      { no: 98, title: "Validate Binary Search Tree", slug: "validate-binary-search-tree", difficulty: "Medium" },
    ],
  },
  {
    id: "graph-general",
    title: "Graph General",
    questions: [
      { no: 200, title: "Number of Islands", slug: "number-of-islands", difficulty: "Medium" },
      { no: 130, title: "Surrounded Regions", slug: "surrounded-regions", difficulty: "Medium" },
      { no: 133, title: "Clone Graph", slug: "clone-graph", difficulty: "Medium" },
      { no: 399, title: "Evaluate Division", slug: "evaluate-division", difficulty: "Medium" },
      { no: 207, title: "Course Schedule", slug: "course-schedule", difficulty: "Medium" },
      { no: 210, title: "Course Schedule II", slug: "course-schedule-ii", difficulty: "Medium" },
    ],
  },
  {
    id: "graph-bfs",
    title: "Graph BFS",
    questions: [
      { no: 909, title: "Snakes and Ladders", slug: "snakes-and-ladders", difficulty: "Medium" },
      { no: 433, title: "Minimum Genetic Mutation", slug: "minimum-genetic-mutation", difficulty: "Medium" },
      { no: 127, title: "Word Ladder", slug: "word-ladder", difficulty: "Hard" },
    ],
  },
  {
    id: "trie",
    title: "Trie",
    questions: [
      { no: 208, title: "Implement Trie (Prefix Tree)", slug: "implement-trie-prefix-tree", difficulty: "Medium" },
      { no: 211, title: "Design Add and Search Words Data Structure", slug: "design-add-and-search-words-data-structure", difficulty: "Medium" },
      { no: 212, title: "Word Search II", slug: "word-search-ii", difficulty: "Hard" },
    ],
  },
  {
    id: "backtracking",
    title: "Backtracking",
    questions: [
      { no: 17, title: "Letter Combinations of a Phone Number", slug: "letter-combinations-of-a-phone-number", difficulty: "Medium" },
      { no: 77, title: "Combinations", slug: "combinations", difficulty: "Medium" },
      { no: 46, title: "Permutations", slug: "permutations", difficulty: "Medium" },
      { no: 39, title: "Combination Sum", slug: "combination-sum", difficulty: "Medium" },
      { no: 52, title: "N-Queens II", slug: "n-queens-ii", difficulty: "Hard" },
      { no: 22, title: "Generate Parentheses", slug: "generate-parentheses", difficulty: "Medium" },
      { no: 79, title: "Word Search", slug: "word-search", difficulty: "Medium" },
    ],
  },
  {
    id: "divide-conquer",
    title: "Divide & Conquer",
    questions: [
      { no: 108, title: "Convert Sorted Array to Binary Search Tree", slug: "convert-sorted-array-to-binary-search-tree", difficulty: "Easy" },
      { no: 148, title: "Sort List", slug: "sort-list", difficulty: "Medium" },
      { no: 427, title: "Construct Quad Tree", slug: "construct-quad-tree", difficulty: "Medium" },
      { no: 23, title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists", difficulty: "Hard" },
    ],
  },
  {
    id: "kadanes-algorithm",
    title: "Kadane's Algorithm",
    questions: [
      { no: 53, title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "Medium" },
      { no: 918, title: "Maximum Sum Circular Subarray", slug: "maximum-sum-circular-subarray", difficulty: "Medium" },
    ],
  },
  {
    id: "binary-search",
    title: "Binary Search",
    questions: [
      { no: 35, title: "Search Insert Position", slug: "search-insert-position", difficulty: "Easy" },
      { no: 74, title: "Search a 2D Matrix", slug: "search-a-2d-matrix", difficulty: "Medium" },
      { no: 162, title: "Find Peak Element", slug: "find-peak-element", difficulty: "Medium" },
      { no: 33, title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array", difficulty: "Medium" },
      { no: 34, title: "Find First and Last Position of Element in Sorted Array", slug: "find-first-and-last-position-of-element-in-sorted-array", difficulty: "Medium" },
      { no: 153, title: "Find Minimum in Rotated Sorted Array", slug: "find-minimum-in-rotated-sorted-array", difficulty: "Medium" },
      { no: 4, title: "Median of Two Sorted Arrays", slug: "median-of-two-sorted-arrays", difficulty: "Hard" },
    ],
  },
  {
    id: "heap",
    title: "Heap",
    questions: [
      { no: 215, title: "Kth Largest Element in an Array", slug: "kth-largest-element-in-an-array", difficulty: "Medium" },
      { no: 502, title: "IPO", slug: "ipo", difficulty: "Hard" },
      { no: 373, title: "Find K Pairs with Smallest Sums", slug: "find-k-pairs-with-smallest-sums", difficulty: "Medium" },
      { no: 295, title: "Find Median from Data Stream", slug: "find-median-from-data-stream", difficulty: "Hard" },
    ],
  },
  {
    id: "bit-manipulation",
    title: "Bit Manipulation",
    questions: [
      { no: 67, title: "Add Binary", slug: "add-binary", difficulty: "Easy" },
      { no: 190, title: "Reverse Bits", slug: "reverse-bits", difficulty: "Easy" },
      { no: 191, title: "Number of 1 Bits", slug: "number-of-1-bits", difficulty: "Easy" },
      { no: 136, title: "Single Number", slug: "single-number", difficulty: "Easy" },
      { no: 137, title: "Single Number II", slug: "single-number-ii", difficulty: "Medium" },
      { no: 201, title: "Bitwise AND of Numbers Range", slug: "bitwise-and-of-numbers-range", difficulty: "Medium" },
    ],
  },
  {
    id: "math",
    title: "Math",
    questions: [
      { no: 9, title: "Palindrome Number", slug: "palindrome-number", difficulty: "Easy" },
      { no: 66, title: "Plus One", slug: "plus-one", difficulty: "Easy" },
      { no: 172, title: "Factorial Trailing Zeroes", slug: "factorial-trailing-zeroes", difficulty: "Medium" },
      { no: 69, title: "Sqrt(x)", slug: "sqrtx", difficulty: "Easy" },
      { no: 50, title: "Pow(x, n)", slug: "powx-n", difficulty: "Medium" },
      { no: 149, title: "Max Points on a Line", slug: "max-points-on-a-line", difficulty: "Hard" },
    ],
  },
  {
    id: "1d-dp",
    title: "1D DP",
    questions: [
      { no: 70, title: "Climbing Stairs", slug: "climbing-stairs", difficulty: "Easy" },
      { no: 198, title: "House Robber", slug: "house-robber", difficulty: "Medium" },
      { no: 139, title: "Word Break", slug: "word-break", difficulty: "Medium" },
      { no: 322, title: "Coin Change", slug: "coin-change", difficulty: "Medium" },
      { no: 300, title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence", difficulty: "Medium" },
    ],
  },
  {
    id: "multidimensional-dp",
    title: "Multidimensional DP",
    questions: [
      { no: 120, title: "Triangle", slug: "triangle", difficulty: "Medium" },
      { no: 64, title: "Minimum Path Sum", slug: "minimum-path-sum", difficulty: "Medium" },
      { no: 63, title: "Unique Paths II", slug: "unique-paths-ii", difficulty: "Medium" },
      { no: 5, title: "Longest Palindromic Substring", slug: "longest-palindromic-substring", difficulty: "Medium" },
      { no: 97, title: "Interleaving String", slug: "interleaving-string", difficulty: "Medium" },
      { no: 72, title: "Edit Distance", slug: "edit-distance", difficulty: "Medium" },
      { no: 123, title: "Best Time to Buy and Sell Stock III", slug: "best-time-to-buy-and-sell-stock-iii", difficulty: "Hard" },
      { no: 188, title: "Best Time to Buy and Sell Stock IV", slug: "best-time-to-buy-and-sell-stock-iv", difficulty: "Hard" },
      { no: 221, title: "Maximal Square", slug: "maximal-square", difficulty: "Medium" },
    ],
  },
];

export const top150Total = 150;

/** Flat list of every question in the bank. */
export function top150Questions(): Top150Question[] {
  return top150Topics.flatMap((topic) => topic.questions);
}

/** Look up a question by LeetCode problem number, with its owning topic. */
export function top150QuestionByNo(
  no: number,
): (Top150Question & { topic: Top150Topic }) | undefined {
  for (const topic of top150Topics) {
    const question = topic.questions.find((candidate) => candidate.no === no);
    if (question) return { ...question, topic };
  }
  return undefined;
}

export function leetcodeProblemUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}

/** Guards against transcription drift: unique numbers/slugs, valid fields, 150 total. */
export function validateTop150(): string[] {
  const problems: string[] = [];
  const validDifficulty: Top150Difficulty[] = ["Easy", "Medium", "Hard"];
  const seenNumbers = new Set<number>();
  const seenSlugs = new Set<string>();

  for (const topic of top150Topics) {
    if (!topic.title) problems.push(`${topic.id} has no title`);
    for (const question of topic.questions) {
      if (!Number.isInteger(question.no) || question.no <= 0) {
        problems.push(`${topic.id}: invalid number ${question.no}`);
      } else if (seenNumbers.has(question.no)) {
        problems.push(`duplicate question number ${question.no}`);
      }
      seenNumbers.add(question.no);
      if (seenSlugs.has(question.slug)) problems.push(`duplicate slug "${question.slug}"`);
      seenSlugs.add(question.slug);
      if (!question.title) problems.push(`#${question.no} has no title`);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(question.slug)) {
        problems.push(`#${question.no}: malformed slug "${question.slug}"`);
      }
      if (!validDifficulty.includes(question.difficulty)) {
        problems.push(`#${question.no}: unknown difficulty ${question.difficulty}`);
      }
    }
  }

  if (seenNumbers.size !== top150Total) {
    problems.push(`expected ${top150Total} questions, found ${seenNumbers.size}`);
  }
  return problems;
}
