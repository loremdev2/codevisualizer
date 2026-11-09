// ---------------------------------------------------------------------------
// NeetCode Roadmap question bank.
//
// Imported from the author's personal LeetCode tracker (Leetcode-Aman.xlsx):
// every problem URL in that sheet, deduplicated per category, with problem
// numbers, titles, and difficulties taken from LeetCode's own problem list so
// nothing relies on memory. Category order and per-category problem order
// mirror the tracker exactly; the same problem may appear in several
// categories (e.g. Best Time to Buy and Sell Stock is listed under both
// Arrays/Hashing-style and Sliding Window lists in the source sheet).
// ---------------------------------------------------------------------------

export type NeetCodeDifficulty = "Easy" | "Medium" | "Hard";

export type NeetCodeQuestion = {
  /** LeetCode problem number (frontend_question_id). */
  no: number;
  title: string;
  /** URL slug, e.g. "two-sum" → https://leetcode.com/problems/two-sum/ */
  slug: string;
  difficulty: NeetCodeDifficulty;
};

export type NeetCodeTopic = {
  id: string;
  title: string;
  questions: NeetCodeQuestion[];
};

export const neetcodeTopics: NeetCodeTopic[] = [
  {
    id: "arrays-hashing",
    title: "Arrays and Hashing",
    questions: [
      { no: 217, title: "Contains Duplicate", slug: "contains-duplicate", difficulty: "Easy" },
      { no: 219, title: "Contains Duplicate II", slug: "contains-duplicate-ii", difficulty: "Easy" },
      { no: 242, title: "Valid Anagram", slug: "valid-anagram", difficulty: "Easy" },
      { no: 49, title: "Group Anagrams", slug: "group-anagrams", difficulty: "Medium" },
      { no: 1929, title: "Concatenation of Array", slug: "concatenation-of-array", difficulty: "Easy" },
      { no: 1299, title: "Replace Elements with Greatest Element on Right Side", slug: "replace-elements-with-greatest-element-on-right-side", difficulty: "Easy" },
      { no: 392, title: "Is Subsequence", slug: "is-subsequence", difficulty: "Easy" },
      { no: 58, title: "Length of Last Word", slug: "length-of-last-word", difficulty: "Easy" },
      { no: 1, title: "Two Sum", slug: "two-sum", difficulty: "Easy" },
      { no: 14, title: "Longest Common Prefix", slug: "longest-common-prefix", difficulty: "Easy" },
      { no: 118, title: "Pascal's Triangle", slug: "pascals-triangle", difficulty: "Easy" },
      { no: 27, title: "Remove Element", slug: "remove-element", difficulty: "Easy" },
      { no: 929, title: "Unique Email Addresses", slug: "unique-email-addresses", difficulty: "Easy" },
      { no: 205, title: "Isomorphic Strings", slug: "isomorphic-strings", difficulty: "Easy" },
      { no: 605, title: "Can Place Flowers", slug: "can-place-flowers", difficulty: "Easy" },
      { no: 169, title: "Majority Element", slug: "majority-element", difficulty: "Easy" },
      { no: 496, title: "Next Greater Element I", slug: "next-greater-element-i", difficulty: "Easy" },
      { no: 724, title: "Find Pivot Index", slug: "find-pivot-index", difficulty: "Easy" },
      { no: 303, title: "Range Sum Query - Immutable", slug: "range-sum-query-immutable", difficulty: "Easy" },
      { no: 448, title: "Find All Numbers Disappeared in an Array", slug: "find-all-numbers-disappeared-in-an-array", difficulty: "Easy" },
      { no: 1189, title: "Maximum Number of Balloons", slug: "maximum-number-of-balloons", difficulty: "Easy" },
      { no: 290, title: "Word Pattern", slug: "word-pattern", difficulty: "Easy" },
      { no: 706, title: "Design HashMap", slug: "design-hashmap", difficulty: "Easy" },
      { no: 912, title: "Sort an Array", slug: "sort-an-array", difficulty: "Medium" },
      { no: 347, title: "Top K Frequent Elements", slug: "top-k-frequent-elements", difficulty: "Medium" },
      { no: 238, title: "Product of Array Except Self", slug: "product-of-array-except-self", difficulty: "Medium" },
      { no: 36, title: "Valid Sudoku", slug: "valid-sudoku", difficulty: "Medium" },
      { no: 271, title: "Encode and Decode Strings", slug: "encode-and-decode-strings", difficulty: "Medium" },
      { no: 128, title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence", difficulty: "Medium" },
      { no: 75, title: "Sort Colors", slug: "sort-colors", difficulty: "Medium" },
      { no: 535, title: "Encode and Decode TinyURL", slug: "encode-and-decode-tinyurl", difficulty: "Medium" },
      { no: 554, title: "Brick Wall", slug: "brick-wall", difficulty: "Medium" },
      { no: 122, title: "Best Time to Buy and Sell Stock II", slug: "best-time-to-buy-and-sell-stock-ii", difficulty: "Medium" },
      { no: 560, title: "Subarray Sum Equals K", slug: "subarray-sum-equals-k", difficulty: "Medium" },
      { no: 1930, title: "Unique Length-3 Palindromic Subsequences", slug: "unique-length-3-palindromic-subsequences", difficulty: "Medium" },
      { no: 1963, title: "Minimum Number of Swaps to Make the String Balanced", slug: "minimum-number-of-swaps-to-make-the-string-balanced", difficulty: "Medium" },
      { no: 2001, title: "Number of Pairs of Interchangeable Rectangles", slug: "number-of-pairs-of-interchangeable-rectangles", difficulty: "Medium" },
      { no: 2002, title: "Maximum Product of the Length of Two Palindromic Subsequences", slug: "maximum-product-of-the-length-of-two-palindromic-subsequences", difficulty: "Medium" },
      { no: 2017, title: "Grid Game", slug: "grid-game", difficulty: "Medium" },
      { no: 438, title: "Find All Anagrams in a String", slug: "find-all-anagrams-in-a-string", difficulty: "Medium" },
      { no: 28, title: "Find the Index of the First Occurrence in a String", slug: "find-the-index-of-the-first-occurrence-in-a-string", difficulty: "Easy" },
      { no: 280, title: "Wiggle Sort", slug: "wiggle-sort", difficulty: "Medium" },
      { no: 179, title: "Largest Number", slug: "largest-number", difficulty: "Medium" },
      { no: 523, title: "Continuous Subarray Sum", slug: "continuous-subarray-sum", difficulty: "Medium" },
      { no: 838, title: "Push Dominoes", slug: "push-dominoes", difficulty: "Medium" },
      { no: 187, title: "Repeated DNA Sequences", slug: "repeated-dna-sequences", difficulty: "Medium" },
      { no: 380, title: "Insert Delete GetRandom O(1)", slug: "insert-delete-getrandom-o1", difficulty: "Medium" },
      { no: 1461, title: "Check If a String Contains All Binary Codes of Size K", slug: "check-if-a-string-contains-all-binary-codes-of-size-k", difficulty: "Medium" },
      { no: 304, title: "Range Sum Query 2D - Immutable", slug: "range-sum-query-2d-immutable", difficulty: "Medium" },
      { no: 665, title: "Non-decreasing Array", slug: "non-decreasing-array", difficulty: "Medium" },
      { no: 41, title: "First Missing Positive", slug: "first-missing-positive", difficulty: "Hard" },
    ],
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    questions: [
      { no: 125, title: "Valid Palindrome", slug: "valid-palindrome", difficulty: "Easy" },
      { no: 680, title: "Valid Palindrome II", slug: "valid-palindrome-ii", difficulty: "Easy" },
      { no: 1984, title: "Minimum Difference Between Highest and Lowest of K Scores", slug: "minimum-difference-between-highest-and-lowest-of-k-scores", difficulty: "Easy" },
      { no: 344, title: "Reverse String", slug: "reverse-string", difficulty: "Easy" },
      { no: 88, title: "Merge Sorted Array", slug: "merge-sorted-array", difficulty: "Easy" },
      { no: 283, title: "Move Zeroes", slug: "move-zeroes", difficulty: "Easy" },
      { no: 26, title: "Remove Duplicates from Sorted Array", slug: "remove-duplicates-from-sorted-array", difficulty: "Easy" },
      { no: 80, title: "Remove Duplicates from Sorted Array II", slug: "remove-duplicates-from-sorted-array-ii", difficulty: "Medium" },
      { no: 167, title: "Two Sum II - Input Array Is Sorted", slug: "two-sum-ii-input-array-is-sorted", difficulty: "Medium" },
      { no: 15, title: "3Sum", slug: "3sum", difficulty: "Medium" },
      { no: 18, title: "4Sum", slug: "4sum", difficulty: "Medium" },
      { no: 11, title: "Container With Most Water", slug: "container-with-most-water", difficulty: "Medium" },
      { no: 1498, title: "Number of Subsequences That Satisfy the Given Sum Condition", slug: "number-of-subsequences-that-satisfy-the-given-sum-condition", difficulty: "Medium" },
      { no: 189, title: "Rotate Array", slug: "rotate-array", difficulty: "Medium" },
      { no: 1968, title: "Array With Elements Not Equal to Average of Neighbors", slug: "array-with-elements-not-equal-to-average-of-neighbors", difficulty: "Medium" },
      { no: 881, title: "Boats to Save People", slug: "boats-to-save-people", difficulty: "Medium" },
      { no: 42, title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard" },
    ],
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    questions: [
      { no: 121, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Easy" },
      { no: 219, title: "Contains Duplicate II", slug: "contains-duplicate-ii", difficulty: "Easy" },
      { no: 1343, title: "Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold", slug: "number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold", difficulty: "Medium" },
      { no: 3, title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", difficulty: "Medium" },
      { no: 424, title: "Longest Repeating Character Replacement", slug: "longest-repeating-character-replacement", difficulty: "Medium" },
      { no: 567, title: "Permutation in String", slug: "permutation-in-string", difficulty: "Medium" },
      { no: 1838, title: "Frequency of the Most Frequent Element", slug: "frequency-of-the-most-frequent-element", difficulty: "Medium" },
      { no: 1888, title: "Minimum Number of Flips to Make the Binary String Alternating", slug: "minimum-number-of-flips-to-make-the-binary-string-alternating", difficulty: "Medium" },
      { no: 209, title: "Minimum Size Subarray Sum", slug: "minimum-size-subarray-sum", difficulty: "Medium" },
      { no: 658, title: "Find K Closest Elements", slug: "find-k-closest-elements", difficulty: "Medium" },
      { no: 76, title: "Minimum Window Substring", slug: "minimum-window-substring", difficulty: "Hard" },
      { no: 239, title: "Sliding Window Maximum", slug: "sliding-window-maximum", difficulty: "Hard" },
    ],
  },
  {
    id: "stack",
    title: "Stack",
    questions: [
      { no: 20, title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Easy" },
      { no: 682, title: "Baseball Game", slug: "baseball-game", difficulty: "Easy" },
      { no: 225, title: "Implement Stack using Queues", slug: "implement-stack-using-queues", difficulty: "Easy" },
      { no: 155, title: "Min Stack", slug: "min-stack", difficulty: "Medium" },
      { no: 150, title: "Evaluate Reverse Polish Notation", slug: "evaluate-reverse-polish-notation", difficulty: "Medium" },
      { no: 22, title: "Generate Parentheses", slug: "generate-parentheses", difficulty: "Medium" },
      { no: 735, title: "Asteroid Collision", slug: "asteroid-collision", difficulty: "Medium" },
      { no: 739, title: "Daily Temperatures", slug: "daily-temperatures", difficulty: "Medium" },
      { no: 901, title: "Online Stock Span", slug: "online-stock-span", difficulty: "Medium" },
      { no: 853, title: "Car Fleet", slug: "car-fleet", difficulty: "Medium" },
      { no: 71, title: "Simplify Path", slug: "simplify-path", difficulty: "Medium" },
      { no: 394, title: "Decode String", slug: "decode-string", difficulty: "Medium" },
      { no: 402, title: "Remove K Digits", slug: "remove-k-digits", difficulty: "Medium" },
      { no: 1209, title: "Remove All Adjacent Duplicates in String II", slug: "remove-all-adjacent-duplicates-in-string-ii", difficulty: "Medium" },
      { no: 456, title: "132 Pattern", slug: "132-pattern", difficulty: "Medium" },
      { no: 895, title: "Maximum Frequency Stack", slug: "maximum-frequency-stack", difficulty: "Hard" },
      { no: 84, title: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram", difficulty: "Hard" },
    ],
  },
  {
    id: "binary-search",
    title: "Binary Search",
    questions: [
      { no: 704, title: "Binary Search", slug: "binary-search", difficulty: "Easy" },
      { no: 35, title: "Search Insert Position", slug: "search-insert-position", difficulty: "Easy" },
      { no: 374, title: "Guess Number Higher or Lower", slug: "guess-number-higher-or-lower", difficulty: "Easy" },
      { no: 441, title: "Arranging Coins", slug: "arranging-coins", difficulty: "Easy" },
      { no: 977, title: "Squares of a Sorted Array", slug: "squares-of-a-sorted-array", difficulty: "Easy" },
      { no: 367, title: "Valid Perfect Square", slug: "valid-perfect-square", difficulty: "Easy" },
      { no: 74, title: "Search a 2D Matrix", slug: "search-a-2d-matrix", difficulty: "Medium" },
      { no: 875, title: "Koko Eating Bananas", slug: "koko-eating-bananas", difficulty: "Medium" },
      { no: 153, title: "Find Minimum in Rotated Sorted Array", slug: "find-minimum-in-rotated-sorted-array", difficulty: "Medium" },
      { no: 33, title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array", difficulty: "Medium" },
      { no: 981, title: "Time Based Key-Value Store", slug: "time-based-key-value-store", difficulty: "Medium" },
      { no: 34, title: "Find First and Last Position of Element in Sorted Array", slug: "find-first-and-last-position-of-element-in-sorted-array", difficulty: "Medium" },
      { no: 1898, title: "Maximum Number of Removable Characters", slug: "maximum-number-of-removable-characters", difficulty: "Medium" },
      { no: 116, title: "Populating Next Right Pointers in Each Node", slug: "populating-next-right-pointers-in-each-node", difficulty: "Medium" },
      { no: 1268, title: "Search Suggestions System", slug: "search-suggestions-system", difficulty: "Medium" },
      { no: 410, title: "Split Array Largest Sum", slug: "split-array-largest-sum", difficulty: "Hard" },
      { no: 4, title: "Median of Two Sorted Arrays", slug: "median-of-two-sorted-arrays", difficulty: "Hard" },
    ],
  },
  {
    id: "linked-list",
    title: "Linked List",
    questions: [
      { no: 206, title: "Reverse Linked List", slug: "reverse-linked-list", difficulty: "Easy" },
      { no: 21, title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", difficulty: "Easy" },
      { no: 234, title: "Palindrome Linked List", slug: "palindrome-linked-list", difficulty: "Easy" },
      { no: 203, title: "Remove Linked List Elements", slug: "remove-linked-list-elements", difficulty: "Easy" },
      { no: 83, title: "Remove Duplicates from Sorted List", slug: "remove-duplicates-from-sorted-list", difficulty: "Easy" },
      { no: 876, title: "Middle of the Linked List", slug: "middle-of-the-linked-list", difficulty: "Easy" },
      { no: 160, title: "Intersection of Two Linked Lists", slug: "intersection-of-two-linked-lists", difficulty: "Easy" },
      { no: 143, title: "Reorder List", slug: "reorder-list", difficulty: "Medium" },
      { no: 2130, title: "Maximum Twin Sum of a Linked List", slug: "maximum-twin-sum-of-a-linked-list", difficulty: "Medium" },
      { no: 19, title: "Remove Nth Node From End of List", slug: "remove-nth-node-from-end-of-list", difficulty: "Medium" },
      { no: 138, title: "Copy List with Random Pointer", slug: "copy-list-with-random-pointer", difficulty: "Medium" },
      { no: 707, title: "Design Linked List", slug: "design-linked-list", difficulty: "Medium" },
      { no: 1472, title: "Design Browser History", slug: "design-browser-history", difficulty: "Medium" },
      { no: 2, title: "Add Two Numbers", slug: "add-two-numbers", difficulty: "Medium" },
      { no: 141, title: "Linked List Cycle", slug: "linked-list-cycle", difficulty: "Easy" },
      { no: 287, title: "Find the Duplicate Number", slug: "find-the-duplicate-number", difficulty: "Medium" },
      { no: 24, title: "Swap Nodes in Pairs", slug: "swap-nodes-in-pairs", difficulty: "Medium" },
      { no: 148, title: "Sort List", slug: "sort-list", difficulty: "Medium" },
      { no: 86, title: "Partition List", slug: "partition-list", difficulty: "Medium" },
      { no: 61, title: "Rotate List", slug: "rotate-list", difficulty: "Medium" },
      { no: 92, title: "Reverse Linked List II", slug: "reverse-linked-list-ii", difficulty: "Medium" },
      { no: 622, title: "Design Circular Queue", slug: "design-circular-queue", difficulty: "Medium" },
      { no: 147, title: "Insertion Sort List", slug: "insertion-sort-list", difficulty: "Medium" },
      { no: 146, title: "LRU Cache", slug: "lru-cache", difficulty: "Medium" },
      { no: 23, title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists", difficulty: "Hard" },
      { no: 25, title: "Reverse Nodes in k-Group", slug: "reverse-nodes-in-k-group", difficulty: "Hard" },
    ],
  },
  {
    id: "trees",
    title: "Trees",
    questions: [
      { no: 94, title: "Binary Tree Inorder Traversal", slug: "binary-tree-inorder-traversal", difficulty: "Easy" },
      { no: 144, title: "Binary Tree Preorder Traversal", slug: "binary-tree-preorder-traversal", difficulty: "Easy" },
      { no: 145, title: "Binary Tree Postorder Traversal", slug: "binary-tree-postorder-traversal", difficulty: "Easy" },
      { no: 226, title: "Invert Binary Tree", slug: "invert-binary-tree", difficulty: "Easy" },
      { no: 104, title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", difficulty: "Easy" },
      { no: 543, title: "Diameter of Binary Tree", slug: "diameter-of-binary-tree", difficulty: "Easy" },
      { no: 110, title: "Balanced Binary Tree", slug: "balanced-binary-tree", difficulty: "Easy" },
      { no: 100, title: "Same Tree", slug: "same-tree", difficulty: "Easy" },
      { no: 572, title: "Subtree of Another Tree", slug: "subtree-of-another-tree", difficulty: "Easy" },
      { no: 108, title: "Convert Sorted Array to Binary Search Tree", slug: "convert-sorted-array-to-binary-search-tree", difficulty: "Easy" },
      { no: 617, title: "Merge Two Binary Trees", slug: "merge-two-binary-trees", difficulty: "Easy" },
      { no: 112, title: "Path Sum", slug: "path-sum", difficulty: "Easy" },
      { no: 606, title: "Construct String from Binary Tree", slug: "construct-string-from-binary-tree", difficulty: "Medium" },
      { no: 235, title: "Lowest Common Ancestor of a Binary Search Tree", slug: "lowest-common-ancestor-of-a-binary-search-tree", difficulty: "Medium" },
      { no: 701, title: "Insert into a Binary Search Tree", slug: "insert-into-a-binary-search-tree", difficulty: "Medium" },
      { no: 450, title: "Delete Node in a BST", slug: "delete-node-in-a-bst", difficulty: "Medium" },
      { no: 102, title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal", difficulty: "Medium" },
      { no: 199, title: "Binary Tree Right Side View", slug: "binary-tree-right-side-view", difficulty: "Medium" },
      { no: 1448, title: "Count Good Nodes in Binary Tree", slug: "count-good-nodes-in-binary-tree", difficulty: "Medium" },
      { no: 98, title: "Validate Binary Search Tree", slug: "validate-binary-search-tree", difficulty: "Medium" },
      { no: 230, title: "Kth Smallest Element in a BST", slug: "kth-smallest-element-in-a-bst", difficulty: "Medium" },
      { no: 105, title: "Construct Binary Tree from Preorder and Inorder Traversal", slug: "construct-binary-tree-from-preorder-and-inorder-traversal", difficulty: "Medium" },
      { no: 96, title: "Unique Binary Search Trees", slug: "unique-binary-search-trees", difficulty: "Medium" },
      { no: 129, title: "Sum Root to Leaf Numbers", slug: "sum-root-to-leaf-numbers", difficulty: "Medium" },
      { no: 337, title: "House Robber III", slug: "house-robber-iii", difficulty: "Medium" },
      { no: 951, title: "Flip Equivalent Binary Trees", slug: "flip-equivalent-binary-trees", difficulty: "Medium" },
      { no: 1993, title: "Operations on Tree", slug: "operations-on-tree", difficulty: "Medium" },
      { no: 894, title: "All Possible Full Binary Trees", slug: "all-possible-full-binary-trees", difficulty: "Medium" },
      { no: 513, title: "Find Bottom Left Tree Value", slug: "find-bottom-left-tree-value", difficulty: "Medium" },
      { no: 669, title: "Trim a Binary Search Tree", slug: "trim-a-binary-search-tree", difficulty: "Medium" },
      { no: 173, title: "Binary Search Tree Iterator", slug: "binary-search-tree-iterator", difficulty: "Medium" },
      { no: 538, title: "Convert BST to Greater Tree", slug: "convert-bst-to-greater-tree", difficulty: "Medium" },
      { no: 124, title: "Binary Tree Maximum Path Sum", slug: "binary-tree-maximum-path-sum", difficulty: "Hard" },
      { no: 297, title: "Serialize and Deserialize Binary Tree", slug: "serialize-and-deserialize-binary-tree", difficulty: "Hard" },
    ],
  },
  {
    id: "tries",
    title: "Tries",
    questions: [
      { no: 208, title: "Implement Trie (Prefix Tree)", slug: "implement-trie-prefix-tree", difficulty: "Medium" },
      { no: 211, title: "Design Add and Search Words Data Structure", slug: "design-add-and-search-words-data-structure", difficulty: "Medium" },
      { no: 212, title: "Word Search II", slug: "word-search-ii", difficulty: "Hard" },
    ],
  },
  {
    id: "heap-priority-queue",
    title: "Heap / Priority Queue",
    questions: [
      { no: 703, title: "Kth Largest Element in a Stream", slug: "kth-largest-element-in-a-stream", difficulty: "Easy" },
      { no: 1046, title: "Last Stone Weight", slug: "last-stone-weight", difficulty: "Easy" },
      { no: 973, title: "K Closest Points to Origin", slug: "k-closest-points-to-origin", difficulty: "Medium" },
      { no: 215, title: "Kth Largest Element in an Array", slug: "kth-largest-element-in-an-array", difficulty: "Medium" },
      { no: 621, title: "Task Scheduler", slug: "task-scheduler", difficulty: "Medium" },
      { no: 355, title: "Design Twitter", slug: "design-twitter", difficulty: "Medium" },
      { no: 1834, title: "Single-Threaded CPU", slug: "single-threaded-cpu", difficulty: "Medium" },
      { no: 1845, title: "Seat Reservation Manager", slug: "seat-reservation-manager", difficulty: "Medium" },
      { no: 1882, title: "Process Tasks Using Servers", slug: "process-tasks-using-servers", difficulty: "Medium" },
      { no: 1985, title: "Find the Kth Largest Integer in the Array", slug: "find-the-kth-largest-integer-in-the-array", difficulty: "Medium" },
      { no: 767, title: "Reorganize String", slug: "reorganize-string", difficulty: "Medium" },
      { no: 1405, title: "Longest Happy String", slug: "longest-happy-string", difficulty: "Medium" },
      { no: 1094, title: "Car Pooling", slug: "car-pooling", difficulty: "Medium" },
      { no: 295, title: "Find Median from Data Stream", slug: "find-median-from-data-stream", difficulty: "Hard" },
      { no: 1383, title: "Maximum Performance of a Team", slug: "maximum-performance-of-a-team", difficulty: "Hard" },
      { no: 502, title: "IPO", slug: "ipo", difficulty: "Hard" },
    ],
  },
  {
    id: "backtracking",
    title: "Backtracking",
    questions: [
      { no: 78, title: "Subsets", slug: "subsets", difficulty: "Medium" },
      { no: 39, title: "Combination Sum", slug: "combination-sum", difficulty: "Medium" },
      { no: 77, title: "Combinations", slug: "combinations", difficulty: "Medium" },
      { no: 46, title: "Permutations", slug: "permutations", difficulty: "Medium" },
      { no: 90, title: "Subsets II", slug: "subsets-ii", difficulty: "Medium" },
      { no: 40, title: "Combination Sum II", slug: "combination-sum-ii", difficulty: "Medium" },
      { no: 47, title: "Permutations II", slug: "permutations-ii", difficulty: "Medium" },
      { no: 79, title: "Word Search", slug: "word-search", difficulty: "Medium" },
      { no: 131, title: "Palindrome Partitioning", slug: "palindrome-partitioning", difficulty: "Medium" },
      { no: 93, title: "Restore IP Addresses", slug: "restore-ip-addresses", difficulty: "Medium" },
      { no: 17, title: "Letter Combinations of a Phone Number", slug: "letter-combinations-of-a-phone-number", difficulty: "Medium" },
      { no: 473, title: "Matchsticks to Square", slug: "matchsticks-to-square", difficulty: "Medium" },
      { no: 1849, title: "Splitting a String Into Descending Consecutive Values", slug: "splitting-a-string-into-descending-consecutive-values", difficulty: "Medium" },
      { no: 1980, title: "Find Unique Binary String", slug: "find-unique-binary-string", difficulty: "Medium" },
      { no: 1239, title: "Maximum Length of a Concatenated String with Unique Characters", slug: "maximum-length-of-a-concatenated-string-with-unique-characters", difficulty: "Medium" },
      { no: 698, title: "Partition to K Equal Sum Subsets", slug: "partition-to-k-equal-sum-subsets", difficulty: "Medium" },
      { no: 51, title: "N-Queens", slug: "n-queens", difficulty: "Hard" },
      { no: 52, title: "N-Queens II", slug: "n-queens-ii", difficulty: "Hard" },
      { no: 463, title: "Island Perimeter", slug: "island-perimeter", difficulty: "Easy" },
      { no: 953, title: "Verifying an Alien Dictionary", slug: "verifying-an-alien-dictionary", difficulty: "Easy" },
      { no: 200, title: "Number of Islands", slug: "number-of-islands", difficulty: "Medium" },
      { no: 133, title: "Clone Graph", slug: "clone-graph", difficulty: "Medium" },
      { no: 695, title: "Max Area of Island", slug: "max-area-of-island", difficulty: "Medium" },
      { no: 1905, title: "Count Sub Islands", slug: "count-sub-islands", difficulty: "Medium" },
      { no: 417, title: "Pacific Atlantic Water Flow", slug: "pacific-atlantic-water-flow", difficulty: "Medium" },
      { no: 130, title: "Surrounded Regions", slug: "surrounded-regions", difficulty: "Medium" },
      { no: 1466, title: "Reorder Routes to Make All Paths Lead to the City Zero", slug: "reorder-routes-to-make-all-paths-lead-to-the-city-zero", difficulty: "Medium" },
      { no: 994, title: "Rotting Oranges", slug: "rotting-oranges", difficulty: "Medium" },
      { no: 286, title: "Walls and Gates", slug: "walls-and-gates", difficulty: "Medium" },
      { no: 909, title: "Snakes and Ladders", slug: "snakes-and-ladders", difficulty: "Medium" },
      { no: 752, title: "Open the Lock", slug: "open-the-lock", difficulty: "Medium" },
      { no: 802, title: "Find Eventual Safe States", slug: "find-eventual-safe-states", difficulty: "Medium" },
      { no: 207, title: "Course Schedule", slug: "course-schedule", difficulty: "Medium" },
      { no: 210, title: "Course Schedule II", slug: "course-schedule-ii", difficulty: "Medium" },
      { no: 1462, title: "Course Schedule IV", slug: "course-schedule-iv", difficulty: "Medium" },
      { no: 1958, title: "Check if Move is Legal", slug: "check-if-move-is-legal", difficulty: "Medium" },
      { no: 934, title: "Shortest Bridge", slug: "shortest-bridge", difficulty: "Medium" },
      { no: 1091, title: "Shortest Path in Binary Matrix", slug: "shortest-path-in-binary-matrix", difficulty: "Medium" },
      { no: 684, title: "Redundant Connection", slug: "redundant-connection", difficulty: "Medium" },
      { no: 323, title: "Number of Connected Components in an Undirected Graph", slug: "number-of-connected-components-in-an-undirected-graph", difficulty: "Medium" },
      { no: 261, title: "Graph Valid Tree", slug: "graph-valid-tree", difficulty: "Medium" },
      { no: 721, title: "Accounts Merge", slug: "accounts-merge", difficulty: "Medium" },
      { no: 1553, title: "Minimum Number of Days to Eat N Oranges", slug: "minimum-number-of-days-to-eat-n-oranges", difficulty: "Hard" },
      { no: 127, title: "Word Ladder", slug: "word-ladder", difficulty: "Hard" },
    ],
  },
  {
    id: "advanced-graphs",
    title: "Advanced Graphs",
    questions: [
      { no: 332, title: "Reconstruct Itinerary", slug: "reconstruct-itinerary", difficulty: "Hard" },
      { no: 1584, title: "Min Cost to Connect All Points", slug: "min-cost-to-connect-all-points", difficulty: "Medium" },
      { no: 743, title: "Network Delay Time", slug: "network-delay-time", difficulty: "Medium" },
      { no: 1514, title: "Path with Maximum Probability", slug: "path-with-maximum-probability", difficulty: "Medium" },
      { no: 778, title: "Swim in Rising Water", slug: "swim-in-rising-water", difficulty: "Hard" },
      { no: 269, title: "Alien Dictionary", slug: "alien-dictionary", difficulty: "Hard" },
      { no: 787, title: "Cheapest Flights Within K Stops", slug: "cheapest-flights-within-k-stops", difficulty: "Medium" },
    ],
  },
  {
    id: "1d-dp",
    title: "1-D Dynamic Programming",
    questions: [
      { no: 70, title: "Climbing Stairs", slug: "climbing-stairs", difficulty: "Easy" },
      { no: 746, title: "Min Cost Climbing Stairs", slug: "min-cost-climbing-stairs", difficulty: "Easy" },
      { no: 198, title: "House Robber", slug: "house-robber", difficulty: "Medium" },
      { no: 213, title: "House Robber II", slug: "house-robber-ii", difficulty: "Medium" },
      { no: 5, title: "Longest Palindromic Substring", slug: "longest-palindromic-substring", difficulty: "Medium" },
      { no: 647, title: "Palindromic Substrings", slug: "palindromic-substrings", difficulty: "Medium" },
      { no: 91, title: "Decode Ways", slug: "decode-ways", difficulty: "Medium" },
      { no: 322, title: "Coin Change", slug: "coin-change", difficulty: "Medium" },
      { no: 152, title: "Maximum Product Subarray", slug: "maximum-product-subarray", difficulty: "Medium" },
      { no: 139, title: "Word Break", slug: "word-break", difficulty: "Medium" },
      { no: 300, title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence", difficulty: "Medium" },
      { no: 416, title: "Partition Equal Subset Sum", slug: "partition-equal-subset-sum", difficulty: "Medium" },
      { no: 120, title: "Triangle", slug: "triangle", difficulty: "Medium" },
      { no: 740, title: "Delete and Earn", slug: "delete-and-earn", difficulty: "Medium" },
      { no: 256, title: "Paint House", slug: "paint-house", difficulty: "Medium" },
      { no: 377, title: "Combination Sum IV", slug: "combination-sum-iv", difficulty: "Medium" },
      { no: 279, title: "Perfect Squares", slug: "perfect-squares", difficulty: "Medium" },
      { no: 1856, title: "Maximum Subarray Min-Product", slug: "maximum-subarray-min-product", difficulty: "Medium" },
      { no: 983, title: "Minimum Cost For Tickets", slug: "minimum-cost-for-tickets", difficulty: "Medium" },
      { no: 343, title: "Integer Break", slug: "integer-break", difficulty: "Medium" },
      { no: 673, title: "Number of Longest Increasing Subsequence", slug: "number-of-longest-increasing-subsequence", difficulty: "Medium" },
      { no: 691, title: "Stickers to Spell Word", slug: "stickers-to-spell-word", difficulty: "Hard" },
    ],
  },
  {
    id: "2d-dp",
    title: "2-D Dynamic Programming",
    questions: [
      { no: 1049, title: "Last Stone Weight II", slug: "last-stone-weight-ii", difficulty: "Medium" },
      { no: 518, title: "Coin Change II", slug: "coin-change-ii", difficulty: "Medium" },
      { no: 97, title: "Interleaving String", slug: "interleaving-string", difficulty: "Medium" },
      { no: 877, title: "Stone Game", slug: "stone-game", difficulty: "Medium" },
      { no: 329, title: "Longest Increasing Path in a Matrix", slug: "longest-increasing-path-in-a-matrix", difficulty: "Hard" },
      { no: 221, title: "Maximal Square", slug: "maximal-square", difficulty: "Medium" },
      { no: 474, title: "Ones and Zeroes", slug: "ones-and-zeroes", difficulty: "Medium" },
      { no: 1911, title: "Maximum Alternating Subsequence Sum", slug: "maximum-alternating-subsequence-sum", difficulty: "Medium" },
      { no: 1220, title: "Count Vowels Permutation", slug: "count-vowels-permutation", difficulty: "Hard" },
      { no: 1866, title: "Number of Ways to Rearrange Sticks With K Sticks Visible", slug: "number-of-ways-to-rearrange-sticks-with-k-sticks-visible", difficulty: "Hard" },
      { no: 10, title: "Regular Expression Matching", slug: "regular-expression-matching", difficulty: "Hard" },
    ],
  },
  {
    id: "greedy",
    title: "Greedy",
    questions: [
      { no: 53, title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "Medium" },
      { no: 918, title: "Maximum Sum Circular Subarray", slug: "maximum-sum-circular-subarray", difficulty: "Medium" },
      { no: 978, title: "Longest Turbulent Subarray", slug: "longest-turbulent-subarray", difficulty: "Medium" },
      { no: 55, title: "Jump Game", slug: "jump-game", difficulty: "Medium" },
      { no: 45, title: "Jump Game II", slug: "jump-game-ii", difficulty: "Medium" },
      { no: 1871, title: "Jump Game VII", slug: "jump-game-vii", difficulty: "Medium" },
      { no: 134, title: "Gas Station", slug: "gas-station", difficulty: "Medium" },
      { no: 846, title: "Hand of Straights", slug: "hand-of-straights", difficulty: "Medium" },
      { no: 1423, title: "Maximum Points You Can Obtain from Cards", slug: "maximum-points-you-can-obtain-from-cards", difficulty: "Medium" },
      { no: 1899, title: "Merge Triplets to Form Target Triplet", slug: "merge-triplets-to-form-target-triplet", difficulty: "Medium" },
      { no: 763, title: "Partition Labels", slug: "partition-labels", difficulty: "Medium" },
      { no: 678, title: "Valid Parenthesis String", slug: "valid-parenthesis-string", difficulty: "Medium" },
      { no: 1921, title: "Eliminate Maximum Number of Monsters", slug: "eliminate-maximum-number-of-monsters", difficulty: "Medium" },
      { no: 1029, title: "Two City Scheduling", slug: "two-city-scheduling", difficulty: "Medium" },
    ],
  },
  {
    id: "intervals",
    title: "Intervals",
    questions: [
      { no: 57, title: "Insert Interval", slug: "insert-interval", difficulty: "Medium" },
      { no: 56, title: "Merge Intervals", slug: "merge-intervals", difficulty: "Medium" },
      { no: 435, title: "Non-overlapping Intervals", slug: "non-overlapping-intervals", difficulty: "Medium" },
      { no: 252, title: "Meeting Rooms", slug: "meeting-rooms", difficulty: "Easy" },
      { no: 253, title: "Meeting Rooms II", slug: "meeting-rooms-ii", difficulty: "Medium" },
      { no: 1288, title: "Remove Covered Intervals", slug: "remove-covered-intervals", difficulty: "Medium" },
      { no: 1851, title: "Minimum Interval to Include Each Query", slug: "minimum-interval-to-include-each-query", difficulty: "Hard" },
    ],
  },
  {
    id: "math-geometry",
    title: "Math & Geometry",
    questions: [
      { no: 48, title: "Rotate Image", slug: "rotate-image", difficulty: "Medium" },
      { no: 54, title: "Spiral Matrix", slug: "spiral-matrix", difficulty: "Medium" },
      { no: 73, title: "Set Matrix Zeroes", slug: "set-matrix-zeroes", difficulty: "Medium" },
      { no: 202, title: "Happy Number", slug: "happy-number", difficulty: "Easy" },
      { no: 66, title: "Plus One", slug: "plus-one", difficulty: "Easy" },
      { no: 9, title: "Palindrome Number", slug: "palindrome-number", difficulty: "Easy" },
      { no: 263, title: "Ugly Number", slug: "ugly-number", difficulty: "Easy" },
      { no: 1260, title: "Shift 2D Grid", slug: "shift-2d-grid", difficulty: "Easy" },
      { no: 13, title: "Roman to Integer", slug: "roman-to-integer", difficulty: "Easy" },
      { no: 12, title: "Integer to Roman", slug: "integer-to-roman", difficulty: "Medium" },
      { no: 50, title: "Pow(x, n)", slug: "powx-n", difficulty: "Medium" },
      { no: 43, title: "Multiply Strings", slug: "multiply-strings", difficulty: "Medium" },
      { no: 2013, title: "Detect Squares", slug: "detect-squares", difficulty: "Medium" },
      { no: 1041, title: "Robot Bounded In Circle", slug: "robot-bounded-in-circle", difficulty: "Medium" },
      { no: 6, title: "Zigzag Conversion", slug: "zigzag-conversion", difficulty: "Medium" },
      { no: 2028, title: "Find Missing Observations", slug: "find-missing-observations", difficulty: "Medium" },
    ],
  },
  {
    id: "bit-manipulation",
    title: "Bit Manipulation",
    questions: [
      { no: 136, title: "Single Number", slug: "single-number", difficulty: "Easy" },
      { no: 191, title: "Number of 1 Bits", slug: "number-of-1-bits", difficulty: "Easy" },
      { no: 338, title: "Counting Bits", slug: "counting-bits", difficulty: "Easy" },
      { no: 190, title: "Reverse Bits", slug: "reverse-bits", difficulty: "Easy" },
      { no: 268, title: "Missing Number", slug: "missing-number", difficulty: "Easy" },
      { no: 371, title: "Sum of Two Integers", slug: "sum-of-two-integers", difficulty: "Medium" },
      { no: 7, title: "Reverse Integer", slug: "reverse-integer", difficulty: "Medium" },
      { no: 67, title: "Add Binary", slug: "add-binary", difficulty: "Easy" },
      { no: 70, title: "Climbing Stairs", slug: "climbing-stairs", difficulty: "Easy" },
      { no: 2498, title: "Frog Jump II", slug: "frog-jump-ii", difficulty: "Medium" },
      { no: 198, title: "House Robber", slug: "house-robber", difficulty: "Medium" },
      { no: 213, title: "House Robber II", slug: "house-robber-ii", difficulty: "Medium" },
      { no: 62, title: "Unique Paths", slug: "unique-paths", difficulty: "Medium" },
      { no: 63, title: "Unique Paths II", slug: "unique-paths-ii", difficulty: "Medium" },
      { no: 64, title: "Minimum Path Sum", slug: "minimum-path-sum", difficulty: "Medium" },
      { no: 120, title: "Triangle", slug: "triangle", difficulty: "Medium" },
      { no: 931, title: "Minimum Falling Path Sum", slug: "minimum-falling-path-sum", difficulty: "Medium" },
      { no: 416, title: "Partition Equal Subset Sum", slug: "partition-equal-subset-sum", difficulty: "Medium" },
      { no: 2035, title: "Partition Array Into Two Arrays to Minimize Sum Difference", slug: "partition-array-into-two-arrays-to-minimize-sum-difference", difficulty: "Hard" },
      { no: 455, title: "Assign Cookies", slug: "assign-cookies", difficulty: "Easy" },
      { no: 322, title: "Coin Change", slug: "coin-change", difficulty: "Medium" },
      { no: 494, title: "Target Sum", slug: "target-sum", difficulty: "Medium" },
      { no: 518, title: "Coin Change II", slug: "coin-change-ii", difficulty: "Medium" },
      { no: 1143, title: "Longest Common Subsequence", slug: "longest-common-subsequence", difficulty: "Medium" },
      { no: 516, title: "Longest Palindromic Subsequence", slug: "longest-palindromic-subsequence", difficulty: "Medium" },
      { no: 1312, title: "Minimum Insertion Steps to Make a String Palindrome", slug: "minimum-insertion-steps-to-make-a-string-palindrome", difficulty: "Hard" },
      { no: 583, title: "Delete Operation for Two Strings", slug: "delete-operation-for-two-strings", difficulty: "Medium" },
      { no: 1092, title: "Shortest Common Supersequence ", slug: "shortest-common-supersequence", difficulty: "Hard" },
      { no: 115, title: "Distinct Subsequences", slug: "distinct-subsequences", difficulty: "Hard" },
      { no: 72, title: "Edit Distance", slug: "edit-distance", difficulty: "Medium" },
      { no: 44, title: "Wildcard Matching", slug: "wildcard-matching", difficulty: "Hard" },
      { no: 121, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Easy" },
      { no: 122, title: "Best Time to Buy and Sell Stock II", slug: "best-time-to-buy-and-sell-stock-ii", difficulty: "Medium" },
      { no: 123, title: "Best Time to Buy and Sell Stock III", slug: "best-time-to-buy-and-sell-stock-iii", difficulty: "Hard" },
      { no: 188, title: "Best Time to Buy and Sell Stock IV", slug: "best-time-to-buy-and-sell-stock-iv", difficulty: "Hard" },
      { no: 309, title: "Best Time to Buy and Sell Stock with Cooldown", slug: "best-time-to-buy-and-sell-stock-with-cooldown", difficulty: "Medium" },
      { no: 714, title: "Best Time to Buy and Sell Stock with Transaction Fee", slug: "best-time-to-buy-and-sell-stock-with-transaction-fee", difficulty: "Medium" },
      { no: 300, title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence", difficulty: "Medium" },
      { no: 368, title: "Largest Divisible Subset", slug: "largest-divisible-subset", difficulty: "Medium" },
      { no: 1048, title: "Longest String Chain", slug: "longest-string-chain", difficulty: "Medium" },
      { no: 673, title: "Number of Longest Increasing Subsequence", slug: "number-of-longest-increasing-subsequence", difficulty: "Medium" },
      { no: 1547, title: "Minimum Cost to Cut a Stick", slug: "minimum-cost-to-cut-a-stick", difficulty: "Hard" },
      { no: 312, title: "Burst Balloons", slug: "burst-balloons", difficulty: "Hard" },
      { no: 1106, title: "Parsing A Boolean Expression", slug: "parsing-a-boolean-expression", difficulty: "Hard" },
      { no: 132, title: "Palindrome Partitioning II", slug: "palindrome-partitioning-ii", difficulty: "Hard" },
      { no: 1043, title: "Partition Array for Maximum Sum", slug: "partition-array-for-maximum-sum", difficulty: "Medium" },
      { no: 85, title: "Maximal Rectangle", slug: "maximal-rectangle", difficulty: "Hard" },
      { no: 1277, title: "Count Square Submatrices with All Ones", slug: "count-square-submatrices-with-all-ones", difficulty: "Medium" },
    ],
  },
];

export const neetcodeTotal = 362;

/** Flat list of every question row in the bank (cross-category repeats included). */
export function neetcodeQuestions(): NeetCodeQuestion[] {
  return neetcodeTopics.flatMap((topic) => topic.questions);
}

/** First topic that lists a given problem number (cross-category repeats make "the" topic ambiguous). */
export function neetcodeQuestionByNo(
  no: number,
): (NeetCodeQuestion & { topic: NeetCodeTopic }) | undefined {
  for (const topic of neetcodeTopics) {
    const question = topic.questions.find((candidate) => candidate.no === no);
    if (question) return { ...question, topic };
  }
  return undefined;
}

export function leetcodeProblemUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}

/**
 * Guards against transcription drift: every question must carry a valid
 * number/slug/difficulty, and a topic can never repeat a problem number or slug.
 * Repeats ACROSS topics are intentional (the tracker lists some problems under
 * several categories) and are not flagged.
 */
export function validateNeetCode(): string[] {
  const problems: string[] = [];
  const validDifficulty: NeetCodeDifficulty[] = ["Easy", "Medium", "Hard"];

  for (const topic of neetcodeTopics) {
    if (!topic.title) problems.push(`${topic.id} has no title`);
    const seenNumbers = new Set<number>();
    const seenSlugs = new Set<string>();
    for (const question of topic.questions) {
      if (!Number.isInteger(question.no) || question.no <= 0) {
        problems.push(`${topic.id}: invalid number ${question.no}`);
      } else if (seenNumbers.has(question.no)) {
        problems.push(`${topic.id}: duplicate question number ${question.no}`);
      }
      seenNumbers.add(question.no);
      if (seenSlugs.has(question.slug)) problems.push(`${topic.id}: duplicate slug "${question.slug}"`);
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

  return problems;
}
