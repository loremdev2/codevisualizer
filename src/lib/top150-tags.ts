// ---------------------------------------------------------------------------
// Per-question tags for the Top Interview 150 bank. Each question carries 2–3
// algorithm / data-structure tags (beyond the study-plan topic it lives
// under), shown as small chips next to the difficulty badge on /learn.
// ---------------------------------------------------------------------------

const ALL_TAGS: Record<number, string[]> = {
  // Array / String
  88: ["Array", "Two Pointers", "Sorting"],
  27: ["Array", "Two Pointers"],
  26: ["Array", "Two Pointers"],
  80: ["Array", "Two Pointers"],
  169: ["Array", "Hash Table", "Divide & Conquer"],
  189: ["Array", "Math", "Two Pointers"],
  121: ["Array", "Greedy"],
  122: ["Array", "Greedy"],
  55: ["Array", "Greedy"],
  45: ["Array", "Greedy"],
  274: ["Array", "Sorting", "Counting"],
  380: ["Design", "Hash Table", "Randomization"],
  238: ["Array", "Prefix Sum"],
  134: ["Array", "Greedy"],
  135: ["Array", "Greedy"],
  42: ["Array", "Two Pointers", "Stack"],
  13: ["String", "Hash Table"],
  12: ["String", "Hash Table"],
  58: ["String"],
  14: ["String", "Trie"],
  151: ["String", "Two Pointers"],
  6: ["String"],
  28: ["String", "Two Pointers"],
  68: ["String", "Simulation"],

  // Two Pointers
  125: ["Two Pointers", "String"],
  392: ["Two Pointers", "String", "Greedy"],
  167: ["Two Pointers", "Binary Search", "Array"],
  11: ["Two Pointers", "Array", "Greedy"],
  15: ["Two Pointers", "Array", "Sorting"],

  // Sliding Window
  209: ["Sliding Window", "Array", "Prefix Sum"],
  3: ["Sliding Window", "Hash Table", "String"],
  30: ["Sliding Window", "Hash Table", "String"],
  76: ["Sliding Window", "Hash Table", "String"],

  // Matrix
  36: ["Matrix", "Hash Table"],
  54: ["Matrix", "Simulation"],
  48: ["Matrix", "Math"],
  73: ["Matrix", "Hash Table"],
  289: ["Matrix", "Simulation"],

  // Hashmap
  383: ["Hash Table", "String", "Counting"],
  205: ["Hash Table", "String"],
  290: ["Hash Table", "String"],
  242: ["Hash Table", "String", "Sorting"],
  49: ["Hash Table", "String", "Sorting"],
  1: ["Hash Table", "Array"],
  202: ["Hash Table", "Math"],
  219: ["Hash Table", "Sliding Window"],
  128: ["Hash Table", "Array", "Union Find"],

  // Intervals
  228: ["Array"],
  56: ["Array", "Sorting", "Interval"],
  57: ["Array", "Interval"],
  452: ["Array", "Sorting", "Greedy", "Interval"],

  // Stack
  20: ["Stack", "String"],
  71: ["Stack", "String"],
  155: ["Stack", "Design"],
  150: ["Stack", "Array", "Math"],
  224: ["Stack", "String", "Math"],

  // Linked List
  141: ["Linked List", "Two Pointers", "Hash Table"],
  2: ["Linked List", "Math", "Recursion"],
  21: ["Linked List", "Recursion"],
  138: ["Linked List", "Hash Table"],
  92: ["Linked List"],
  25: ["Linked List", "Recursion"],
  19: ["Linked List", "Two Pointers"],
  82: ["Linked List", "Two Pointers"],
  61: ["Linked List", "Two Pointers"],
  86: ["Linked List", "Two Pointers"],
  146: ["Design", "Hash Table", "Linked List"],

  // Binary Tree General
  104: ["Tree", "DFS", "BFS"],
  100: ["Tree", "DFS", "BFS"],
  226: ["Tree", "DFS", "Recursion"],
  101: ["Tree", "DFS", "BFS"],
  105: ["Tree", "Hash Table", "Divide & Conquer"],
  106: ["Tree", "Hash Table", "Divide & Conquer"],
  117: ["Tree", "BFS", "Linked List"],
  114: ["Tree", "DFS", "Linked List"],
  112: ["Tree", "DFS"],
  129: ["Tree", "DFS"],
  124: ["Tree", "DFS", "DP"],
  173: ["Design", "Stack", "Tree"],
  222: ["Tree", "Binary Search"],
  236: ["Tree", "DFS", "Recursion"],

  // Binary Tree BFS
  199: ["Tree", "BFS", "DFS"],
  637: ["Tree", "BFS"],
  102: ["Tree", "BFS"],
  103: ["Tree", "BFS"],

  // Binary Search Tree
  530: ["Tree", "BST", "DFS", "Inorder"],
  230: ["Tree", "BST", "DFS", "Heap"],
  98: ["Tree", "BST", "DFS"],

  // Graph General
  200: ["Graph", "Matrix", "DFS", "BFS", "Union Find"],
  130: ["Graph", "Matrix", "DFS", "BFS"],
  133: ["Graph", "DFS", "BFS", "Hash Table"],
  399: ["Graph", "DFS", "BFS", "Union Find"],
  207: ["Graph", "DFS", "BFS", "Topological Sort"],
  210: ["Graph", "BFS", "Topological Sort"],

  // Graph BFS
  909: ["Graph", "BFS"],
  433: ["Graph", "BFS", "String"],
  127: ["Graph", "BFS", "Hash Table", "String"],

  // Trie
  208: ["Trie", "Design", "Hash Table"],
  211: ["Trie", "Design", "DFS"],
  212: ["Trie", "DFS", "Backtracking"],

  // Backtracking
  17: ["Backtracking", "String"],
  77: ["Backtracking"],
  46: ["Backtracking", "Recursion"],
  39: ["Backtracking", "Recursion"],
  52: ["Backtracking"],
  22: ["Backtracking", "String", "DP"],
  79: ["Backtracking", "Matrix", "DFS"],

  // Divide & Conquer
  108: ["Tree", "BST", "Divide & Conquer"],
  148: ["Linked List", "Sorting", "Divide & Conquer"],
  427: ["Tree", "Divide & Conquer"],
  23: ["Linked List", "Heap", "Divide & Conquer"],

  // Kadane's Algorithm
  53: ["Array", "DP", "Divide & Conquer"],
  918: ["Array", "DP", "Prefix Sum"],

  // Binary Search
  35: ["Array", "Binary Search"],
  74: ["Matrix", "Binary Search"],
  162: ["Array", "Binary Search"],
  33: ["Array", "Binary Search"],
  34: ["Array", "Binary Search"],
  153: ["Array", "Binary Search"],
  4: ["Array", "Binary Search", "Divide & Conquer"],

  // Heap
  215: ["Array", "Heap", "Quickselect"],
  502: ["Greedy", "Heap", "Sorting"],
  373: ["Heap", "Array"],
  295: ["Design", "Heap", "Sorting"],

  // Bit Manipulation
  67: ["String", "Bit Manipulation", "Math"],
  190: ["Bit Manipulation", "Divide & Conquer"],
  191: ["Bit Manipulation"],
  136: ["Bit Manipulation", "Array"],
  137: ["Bit Manipulation", "Array"],
  201: ["Bit Manipulation"],

  // Math
  9: ["Math"],
  66: ["Array", "Math"],
  172: ["Math"],
  69: ["Math", "Binary Search"],
  50: ["Math", "Recursion", "Binary Search"],
  149: ["Math", "Hash Table", "Geometry"],

  // 1D DP
  70: ["DP", "Math", "Memoization"],
  198: ["DP", "Array"],
  139: ["DP", "Hash Table", "String"],
  322: ["DP", "BFS", "Array"],
  300: ["DP", "Binary Search", "Array"],

  // Multidimensional DP
  120: ["DP", "Array"],
  64: ["DP", "Matrix"],
  63: ["DP", "Matrix"],
  5: ["String", "DP"],
  97: ["String", "DP"],
  72: ["String", "DP"],
  123: ["Array", "DP"],
  188: ["Array", "DP"],
  221: ["Matrix", "DP"],
};

export function top150Tags(no: number): string[] {
  return ALL_TAGS[no] ?? [];
}
