import type { AlgorithmTemplate } from "@/types/visualizer";

/** Sentinel id for the "Start from a blank file" entry in the preset dropdown.
 * Not a real template — selecting it clears the editor and input. */
export const BLANK_TEMPLATE_ID = "__blank__";

export const algorithmTemplates: AlgorithmTemplate[] = [
  {
    id: "bubble-sort",
    name: "Bubble sort",
    category: "Array",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1,2,3,5,8,9],
    code: `const arr = [...input.array];

for (let i = 0; i < arr.length - 1; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}

return arr;`,
    examples: [
      { label: "Almost sorted", input: { array: [1, 2, 3, 5, 4, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Reverse sorted", input: { array: [9, 8, 7, 6, 5, 4, 3, 2, 1] } , expected: [1,2,3,4,5,6,7,8,9]},
      { label: "Already sorted", input: { array: [1, 2, 3, 4, 5, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Two elements", input: { array: [5, 2] } , expected: [2,5]},
      { label: "All equal", input: { array: [7, 7, 7, 7] } , expected: [7,7,7,7]},
      { label: "Negatives", input: { array: [3, -1, 5, -7, 2, 0] } , expected: [-7,-1,0,2,3,5]},
    ],
      languages: {
      python: `arr = list(input["array"])

for i in range(len(arr) - 1):
    for j in range(len(arr) - i - 1):
        if arr[j] > arr[j + 1]:
            arr[j], arr[j + 1] = arr[j + 1], arr[j]

print(arr)`,
      typescript: `const arr: number[] = [...input.array];

for (let i = 0; i < arr.length - 1; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    if (arr[j] > arr[j + 1]) {
      [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
    }
  }
}

return arr;`,
      java: `int[] arr = new int[]{8, 3, 5, 1, 9, 2};
int n = arr.length;

for (int i = 0; i < n - 1; i++) {
    for (int j = 0; j < n - i - 1; j++) {
        if (arr[j] > arr[j + 1]) {
            int temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
        }
    }
}`,
      cpp: `#include <vector>
using namespace std;

vector<int> bubbleSort(vector<int> arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - i - 1; j++)
            if (arr[j] > arr[j + 1])
                swap(arr[j], arr[j + 1]);
    return arr;
}`,
    },
  },
  {
    id: "binary-search",
    name: "Binary search",
    category: "Search",
    input: { array: [1, 3, 5, 7, 9, 11, 15, 18], target: 11 },
    expected: 5,
    code: `const arr = input.array;
const target = input.target;
let left = 0;
let right = arr.length - 1;

while (left <= right) {
  const mid = Math.floor((left + right) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) left = mid + 1;
  else right = mid - 1;
}

return -1;`,
    examples: [
      { label: "Target at start", input: { array: [1, 3, 5, 7, 9, 11, 15, 18], target: 1 } , expected: 0},
      { label: "Target at end", input: { array: [1, 3, 5, 7, 9, 11, 15, 18], target: 18 } , expected: 7},
      { label: "Target missing", input: { array: [1, 3, 5, 7, 9, 11, 15, 18], target: 4 } , expected: -1},
      { label: "Single element", input: { array: [7], target: 7 } , expected: 0},
      { label: "Empty array", input: { array: [], target: 5 } , expected: -1},
      { label: "Longer array", input: { array: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30], target: 24 } , expected: 11},
    ],
      languages: {
      python: `arr = input["array"]
target = input["target"]
left = 0
right = len(arr) - 1

while left <= right:
    mid = (left + right) // 2
    if arr[mid] == target:
        print(mid)
        break
    elif arr[mid] < target:
        left = mid + 1
    else:
        right = mid - 1`,
      typescript: `const arr: number[] = input.array;
const target: number = input.target;
let left: number = 0;
let right: number = arr.length - 1;

while (left <= right) {
  const mid: number = Math.floor((left + right) / 2);
  if (arr[mid] === target) return mid;
  if (arr[mid] < target) left = mid + 1;
  else right = mid - 1;
}

return -1;`,
      cpp: `#include <vector>
using namespace std;

int binarySearch(vector<int> arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    },
  },
  {
    id: "sliding-window",
    name: "Sliding window",
    category: "Array",
    input: { array: [2, 1, 5, 1, 3, 2], windowSize: 3 },
    expected: 9,
    code: `const arr = input.array;
const k = input.windowSize;
let windowSum = 0;
let bestSum = -Infinity;

for (let right = 0; right < arr.length; right++) {
  windowSum += arr[right];
  const left = right - k + 1;
  if (right >= k - 1) {
    bestSum = Math.max(bestSum, windowSum);
    windowSum -= arr[left];
  }
}

    return bestSum;`,
    examples: [
      { label: "Window covers array", input: { array: [1, 4, 2], windowSize: 3 } , expected: 7},
      { label: "Window of one", input: { array: [2, 1, 5, 1, 3, 2], windowSize: 1 } , expected: 5},
      { label: "Longer array", input: { array: [2, 1, 5, 1, 3, 2, 8, 1, 9, 4], windowSize: 3 } , expected: 18},
      { label: "All negative", input: { array: [-2, -1, -3, -5, -4], windowSize: 2 } , expected: -3},
    ],
  },
  {
    id: "character-replacement",
    name: "Longest repeating character replacement",
    category: "String + hash map",
    input: { string: "AABABBA", k: 1 },
    expected: 4,
    code: `const s = input.string;
const k = input.k;
const map = {};
let start = 0;
let end = 0;
let maxFreq = 0;
let maxLen = 0;

while (end < s.length) {
  const endChar = s[end];
  map[endChar] = (map[endChar] || 0) + 1;
  maxFreq = Math.max(maxFreq, map[endChar]);

  while ((end - start + 1) - maxFreq > k) {
    const startChar = s[start];
    map[startChar]--;
    start++;
  }

  maxLen = Math.max(maxLen, end - start + 1);
  end++;
}

return maxLen;`,
    examples: [
      { label: "No replacements allowed", input: { string: "ABAB", k: 0 } , expected: 1},
      { label: "One replacement", input: { string: "AABABBA", k: 1 } , expected: 4},
      { label: "Long run", input: { string: "BBBBAAABBB", k: 2 } , expected: 6},
      { label: "Replace everything", input: { string: "AABABBA", k: 3 } , expected: 7},
    ],
  },
  {
    id: "dfs-graph",
    name: "Depth-first search",
    category: "Graph",
    input: {
      graph: { A: ["B", "C"], B: ["D", "E"], C: ["F"], D: [], E: ["F"], F: [] },
      start: "A",
    },
    expected: ["A","C","F","B","E","D"],
    code: `const graph = input.graph;
const stack = [input.start];
const visited = new Set();

while (stack.length) {
  const node = stack.pop();
  if (visited.has(node)) continue;
  visited.add(node);

  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) stack.push(neighbor);
  }
}

    return [...visited];`,
    examples: [
      { label: "Single node", input: { graph: { A: [] }, start: "A" } , expected: ["A"]},
      { label: "Two nodes", input: { graph: { A: ["B"], B: [] }, start: "A" } , expected: ["A","B"]},
      { label: "Disconnected nodes", input: { graph: { A: ["B"], B: [], C: [] }, start: "A" } , expected: ["A","B"]},
      { label: "Dense graph", input: { graph: { A: ["B", "C"], B: ["A", "D"], C: ["A", "D"], D: ["B", "C"] }, start: "A" } , expected: ["A","C","D","B"]},
    ],
  },
  {
    id: "recursive-dfs",
    name: "Recursive depth-first search",
    category: "Graph + recursion",
    input: {
      graph: { A: ["B", "C"], B: ["D"], C: ["E"], D: [], E: [] },
      start: "A",
    },
    expected: ["A","B","D","C","E"],
    code: `const graph = input.graph;
const visited = new Set();

function dfs(node) {
  if (visited.has(node)) return;
  visited.add(node);

  for (const neighbor of graph[node]) {
    dfs(neighbor);
  }

  return [...visited];
}

return dfs(input.start);`,
    examples: [
      { label: "Deep chain", input: { graph: { A: ["B"], B: ["C"], C: ["D"], D: ["E"], E: [] }, start: "A" } , expected: ["A","B","C","D","E"]},
      { label: "Wide tree", input: { graph: { A: ["B", "C"], B: ["D", "E"], C: ["F", "G"], D: [], E: [], F: [], G: [] }, start: "A" } , expected: ["A","B","D","E","C","F","G"]},
      { label: "Single node", input: { graph: { A: [] }, start: "A" } , expected: ["A"]},
    ],
  },




  {
    id: "spiral-matrix",
    name: "Spiral matrix",
    category: "Matrix",
    input: {
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    },
    expected: [1,2,3,6,9,8,7,4,5],
    code: `const matrix = input.matrix;
const result = [];
let top = 0;
let bottom = matrix.length - 1;
let left = 0;
let right = matrix[0].length - 1;

while (top <= bottom && left <= right) {
  for (let i = left; i <= right; i++) {
    result.push(matrix[top][i]);
  }
  top++;
  for (let i = top; i <= bottom; i++) {
    result.push(matrix[i][right]);
  }
  right--;
  if (top <= bottom) {
    for (let i = right; i >= left; i--) {
      result.push(matrix[bottom][i]);
    }
    bottom--;
  }
  if (left <= right) {
    for (let i = bottom; i >= top; i--) {
      result.push(matrix[i][left]);
    }
    left++;
  }
}

return result;`,
    examples: [
      { label: "1 × 1", input: { matrix: [[5]] } , expected: [5]},
      { label: "Single row", input: { matrix: [[1, 2, 3, 4]] } , expected: [1,2,3,4]},
      { label: "Single column", input: { matrix: [[1], [2], [3], [4]] } , expected: [1,2,3,4]},
      { label: "4 × 4", input: { matrix: [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]] } , expected: [1,2,3,4,8,12,16,15,14,13,9,5,6,7,11,10]},
    ],
  },
  {
    id: "number-of-islands",
    name: "Number of islands",
    category: "Matrix",
    input: {
      grid: [
        ["1", "1", "0"],
        ["1", "0", "0"],
        ["0", "0", "1"],
      ],
    },
    expected: 2,
    code: `const grid = input.grid;
const rows = grid.length;
const cols = grid[0].length;

function dfs(r, c) {
  if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1") return;
  grid[r][c] = "0";
  dfs(r + 1, c);
  dfs(r - 1, c);
  dfs(r, c + 1);
  dfs(r, c - 1);
  return;
}

let islands = 0;
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (grid[r][c] === "1") {
      islands++;
      dfs(r, c);
    }
  }
}

return islands;`,
    examples: [
      { label: "All water", input: { grid: [["0", "0"], ["0", "0"]] } , expected: 0},
      { label: "One big island", input: { grid: [["1", "1"], ["1", "1"]] } , expected: 1},
      { label: "Diagonals don't connect", input: { grid: [["1", "0"], ["0", "1"]] } , expected: 2},
      { label: "5 × 5 with islands", input: { grid: [["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]] } , expected: 3},
    ],
  },
  {
    id: "set-matrix-zeroes",
    name: "Set matrix zeroes",
    category: "Matrix",
    input: {
      matrix: [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ],
    },
    expected: [[1,0,1],[0,0,0],[1,0,1]],
    code: `const matrix = input.matrix;
const rows = matrix.length;
const cols = matrix[0].length;
const zeroRows = Array(rows).fill(false);
const zeroCols = Array(cols).fill(false);

for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    if (matrix[i][j] === 0) {
      zeroRows[i] = true;
      zeroCols[j] = true;
    }
  }
}

for (let r = 0; r < rows; r++) {
  if (zeroRows[r]) {
    for (let c = 0; c < cols; c++) {
      matrix[r][c] = 0;
    }
  }
}

for (let c = 0; c < cols; c++) {
  if (zeroCols[c]) {
    for (let r = 0; r < rows; r++) {
      matrix[r][c] = 0;
    }
  }
}

return matrix;`,
    examples: [
      { label: "No zeroes", input: { matrix: [[1, 2], [3, 4]] } , expected: [[1,2],[3,4]]},
      { label: "One zero", input: { matrix: [[1, 1, 1], [1, 0, 1], [1, 1, 1]] } , expected: [[1,0,1],[0,0,0],[1,0,1]]},
      { label: "Full row zero", input: { matrix: [[0, 1], [1, 1]] } , expected: [[0,0],[0,1]]},
      { label: "Multiple zeros", input: { matrix: [[0, 1, 2], [3, 4, 5], [6, 7, 0]] } , expected: [[0,0,0],[0,4,0],[0,0,0]]},
    ],
  },
  {
    id: "reverse-linked-list",
    name: "Reverse a linked list",
    category: "Linked list",
    input: {
      head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: null } } } },
    },
    expected: [4,3,2,1],
    code: `const head = input.head;
let prev = null;
let curr = head;

while (curr !== null) {
  const next = curr.next;
  curr.next = prev;
  prev = curr;
  curr = next;
}

return prev;`,
    examples: [
      {
        label: "Classic 1→2→3→4",
        input: { head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: null } } } } },
      expected: [4,3,2,1]},
      { label: "Three nodes", input: { head: { val: 1, next: { val: 2, next: { val: 3, next: null } } } } , expected: [3,2,1]},
      { label: "Two nodes", input: { head: { val: 5, next: { val: 9, next: null } } } , expected: [9,5]},
      { label: "Single node", input: { head: { val: 7, next: null } } , expected: [7]},
    ],
  },
  {
    id: "floyds-cycle-detection",
    name: "Detect cycle (Floyd's algorithm)",
    category: "Linked list",
    input: {
      head: {
        val: 1,
        next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: { val: 6, next: null } } } } },
      },
      cycleAt: null,
    },
    expected: null,
    code: `const head = input.head;
const cycleAt = input.cycleAt;

// JSON can't express a cycle, so build it in code: link the tail back to the
// node at position cycleAt (0 links the tail back to the head).
if (cycleAt !== null && cycleAt >= 0) {
  let index = 0;
  let node = head;
  let target = null;
  while (node.next !== null) {
    if (index === cycleAt) target = node;
    node = node.next;
    index++;
  }
  node.next = target;
}

let slow = head;
let fast = head;
while (fast !== null && fast.next !== null) {
  slow = slow.next;
  fast = fast.next.next;
  if (slow === fast) {
    return slow;
  }
}

return null;`,
    examples: [
      {
        label: "No cycle",
        input: {
          head: {
            val: 1,
            next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: { val: 6, next: null } } } } },
          },
          cycleAt: null,
        },
      expected: null},
      {
        label: "Cycle at node 2",
        input: {
          head: {
            val: 1,
            next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: { val: 6, next: null } } } } },
          },
          cycleAt: 2,
        },
      expected: [5,6,3,4]},
      {
        label: "Tail loops to head",
        input: { head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: null } } } }, cycleAt: 0 },
      expected: [1,2,3,4]},
      {
        label: "Two-node cycle",
        input: { head: { val: 1, next: { val: 2, next: null } }, cycleAt: 0 },
      expected: [1,2]},
    ],
  },
  {
    id: "middle-of-linked-list",
    name: "Middle of a linked list",
    category: "Linked list",
    input: {
      head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: null } } } } },
    },
    expected: [3,4,5],
    code: `const head = input.head;
let slow = head;
let fast = head;

while (fast !== null && fast.next !== null) {
  slow = slow.next;
  fast = fast.next.next;
}

return slow;`,
    examples: [
      {
        label: "Odd length",
        input: { head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: null } } } } } },
      expected: [3,4,5]},
      {
        label: "Even length",
        input: {
          head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: { val: 6, next: null } } } } } },
        },
      expected: [4,5,6]},
      { label: "Two nodes", input: { head: { val: 1, next: { val: 2, next: null } } } , expected: [2]},
      { label: "Single node", input: { head: { val: 9, next: null } } , expected: [9]},
    ],
  },
  {
    id: "merge-two-sorted-lists",
    name: "Merge two sorted lists",
    category: "Linked list",
    input: {
      l1: { val: 1, next: { val: 3, next: { val: 5, next: null } } },
      l2: { val: 2, next: { val: 4, next: null } },
    },
    expected: [1,2,3,4,5],
    code: `let l1 = input.l1;
let l2 = input.l2;
const dummy = { val: 0, next: null };
let tail = dummy;

while (l1 !== null && l2 !== null) {
  if (l1.val <= l2.val) {
    tail.next = l1;
    l1 = l1.next;
  } else {
    tail.next = l2;
    l2 = l2.next;
  }
  tail = tail.next;
}

tail.next = l1 !== null ? l1 : l2;
return dummy.next;`,
    examples: [
      {
        label: "Interleaved",
        input: {
          l1: { val: 1, next: { val: 3, next: { val: 5, next: null } } },
          l2: { val: 2, next: { val: 4, next: null } },
        },
      expected: [1,2,3,4,5]},
      {
        label: "One list shorter",
        input: {
          l1: { val: 1, next: { val: 2, next: { val: 4, next: null } } },
          l2: { val: 3, next: null },
        },
      expected: [1,2,3,4]},
      {
        label: "Duplicate values",
        input: {
          l1: { val: 1, next: { val: 1, next: { val: 2, next: null } } },
          l2: { val: 1, next: { val: 3, next: null } },
        },
      expected: [1,1,1,2,3]},
      {
        label: "All from one list",
        input: {
          l1: { val: 1, next: { val: 2, next: { val: 3, next: null } } },
          l2: { val: 4, next: { val: 5, next: null } },
        },
      expected: [1,2,3,4,5]},
    ],
  },
  {
    id: "nth-node-from-end",
    name: "Nth node from the end",
    category: "Linked list",
    input: {
      head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: { val: 6, next: null } } } } } },
      n: 2,
    },
    expected: [5,6],
    code: `const head = input.head;
const n = input.n;
let fast = head;
let slow = head;

for (let i = 0; i < n; i++) {
  fast = fast.next;
}

while (fast !== null) {
  fast = fast.next;
  slow = slow.next;
}

return slow;`,
    examples: [
      {
        label: "Second from end",
        input: {
          head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: { val: 6, next: null } } } } } },
          n: 2,
        },
      expected: [5,6]},
      {
        label: "Last node",
        input: {
          head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: { val: 5, next: null } } } } },
          n: 1,
        },
      expected: [5]},
      {
        label: "n equals length",
        input: { head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 4, next: null } } } }, n: 4 },
      expected: [1,2,3,4]},
      { label: "Two-node list", input: { head: { val: 7, next: { val: 8, next: null } }, n: 1 } , expected: [8]},
    ],
  },
  {
    id: "invert-binary-tree",
    name: "Invert binary tree",
    category: "Binary tree",
    input: { root: [4, 2, 7, 1, 3, 6, 9] },
    expected: [4,7,2,9,6,3,1],
    code: `class Solution {
  invertTree(root) {
    if (root === null) return null;
    const left = this.invertTree(root.left);
    const right = this.invertTree(root.right);
    root.left = right;
    root.right = left;
    return root;
  }
}`,
    examples: [
      { label: "Classic complete tree", input: { root: [4, 2, 7, 1, 3, 6, 9] } , expected: [4,7,2,9,6,3,1]},
      { label: "With missing children", input: { root: [2, 1, 3, null, null, 6, 7] } , expected: [2,3,1,7,6]},
      { label: "Single node", input: { root: [1] } , expected: [1]},
      { label: "Skewed right", input: { root: [1, null, 2, null, 3] } , expected: [1,2,null,3]},
      { label: "Empty tree", input: { root: [] } , expected: null},
    ],
  },
  {
    id: "max-depth-binary-tree",
    name: "Maximum depth of binary tree",
    category: "Binary tree",
    input: { root: [3, 9, 20, null, null, 15, 7] },
    expected: 3,
    code: `class Solution {
  maxDepth(root) {
    if (root === null) return 0;
    return 1 + Math.max(this.maxDepth(root.left), this.maxDepth(root.right));
  }
}`,
    examples: [
      { label: "Balanced tree", input: { root: [3, 9, 20, null, null, 15, 7] } , expected: 3},
      { label: "Skewed left", input: { root: [1, 2, null, 3, null, 4] } , expected: 4},
      { label: "Single node", input: { root: [1] } , expected: 1},
      { label: "Empty tree", input: { root: [] } , expected: 0},
    ],
  },
  {
    id: "valid-parentheses",
    name: "Valid parentheses",
    category: "Stack",
    input: { s: "()[]{}" },
    expected: true,
    code: `class Solution {
  isValid(s) {
    const stack = [];
    const map = { ")": "(", "]": "[", "}": "{" };
    for (const char of s) {
      if (char === "(" || char === "[" || char === "{") {
        stack.push(char);
      } else if (stack.length === 0 || stack.pop() !== map[char]) {
        return false;
      }
    }
    return stack.length === 0;
  }
}`,
    examples: [
      { label: "All matched", input: { s: "()[]{}" } , expected: true},
      { label: "Nested", input: { s: "([{}])" } , expected: true},
      { label: "Wrong order", input: { s: "(]" } , expected: false},
      { label: "Unmatched close", input: { s: ")" } , expected: false},
      { label: "Unclosed open", input: { s: "((" } , expected: false},
      { label: "Empty string", input: { s: "" } , expected: true},
    ],
  },
  {
    id: "two-sum",
    name: "Two sum",
    category: "Hashing",
    input: { nums: [2, 7, 11, 15], target: 9 },
    expected: [0,1],
    code: `class Solution {
  twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (seen.has(complement)) return [seen.get(complement), i];
      seen.set(nums[i], i);
    }
    return [];
  }
}`,
    examples: [
      { label: "Classic pair", input: { nums: [2, 7, 11, 15], target: 9 } , expected: [0,1]},
      { label: "Adjacent pair", input: { nums: [3, 2, 4], target: 6 } , expected: [1,2]},
      { label: "No pair exists", input: { nums: [1, 2, 3], target: 99 } , expected: []},
      { label: "Duplicate values", input: { nums: [3, 3], target: 6 } , expected: [0,1]},
      { label: "Longer array", input: { nums: [1, 3, 4, 8, 9, 12, 20, 25], target: 32 } , expected: [5,6]},
    ],
      languages: {
      python: `arr = input["array"]
target = input["target"]
seen = {}

for i, num in enumerate(arr):
    complement = target - num
    if complement in seen:
        print([seen[complement], i])
    seen[num] = i`,
      typescript: `const arr: number[] = input.array;
const target: number = input.target;
const seen: Record<number, number> = {};

for (let i = 0; i < arr.length; i++) {
  const complement: number = target - arr[i];
  if (complement in seen) return [seen[complement], i];
  seen[arr[i]] = i;
}

return [];`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement))
            return {seen[complement], i};
        seen[nums[i]] = i;
    }
    return {};
}`,
    },
  },
  {
    id: "selection-sort",
    name: "Selection sort",
    category: "Array",
    input: { array: [5, 3, 8, 1, 9, 2] },
    expected: [1,2,3,5,8,9],
    code: `const arr = [...input.array];
const n = arr.length;

for (let i = 0; i < n - 1; i++) {
  let minIndex = i;
  for (let j = i + 1; j < n; j++) {
    if (arr[j] < arr[minIndex]) minIndex = j;
  }
  if (minIndex !== i) {
    [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
  }
}

return arr;`,
    examples: [
      { label: "Unsorted", input: { array: [4, 1, 3, 9, 7] } , expected: [1,3,4,7,9]},
      { label: "Already sorted", input: { array: [1, 2, 3, 4] } , expected: [1,2,3,4]},
      { label: "Reverse sorted", input: { array: [9, 6, 3, 1] } , expected: [1,3,6,9]},
      { label: "All equal", input: { array: [7, 7, 7] } , expected: [7,7,7]},
      { label: "Two elements", input: { array: [2, 1] } , expected: [1,2]},
      { label: "Single element", input: { array: [3] } , expected: [3]},
    ],
  },
  {
    id: "insertion-sort",
    name: "Insertion sort",
    category: "Array",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1,2,3,5,8,9],
    code: `const arr = [...input.array];

for (let i = 1; i < arr.length; i++) {
  const key = arr[i];
  let j = i - 1;
  while (j >= 0 && arr[j] > key) {
    arr[j + 1] = arr[j];
    j -= 1;
  }
  arr[j + 1] = key;
}

return arr;`,
    examples: [
      { label: "Almost sorted", input: { array: [1, 2, 3, 5, 4, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Reverse sorted", input: { array: [9, 8, 7, 6, 5, 4, 3, 2, 1] } , expected: [1,2,3,4,5,6,7,8,9]},
      { label: "Already sorted", input: { array: [1, 2, 3, 4, 5, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Two elements", input: { array: [5, 2] } , expected: [2,5]},
      { label: "All equal", input: { array: [7, 7, 7, 7] } , expected: [7,7,7,7]},
      { label: "Negatives", input: { array: [3, -1, 5, -7, 2, 0] } , expected: [-7,-1,0,2,3,5]},
    ],
  },
  {
    id: "merge-sort",
    name: "Merge sort",
    category: "Array",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1,2,3,5,8,9],
    code: `const arr = [...input.array];

function mergeSort(left, right) {
  if (left >= right) return;
  const mid = Math.floor((left + right) / 2);
  mergeSort(left, mid);
  mergeSort(mid + 1, right);
  const merged = [];
  let i = left;
  let j = mid + 1;
  while (i <= mid && j <= right) {
    if (arr[i] <= arr[j]) {
      merged.push(arr[i]);
      i += 1;
    } else {
      merged.push(arr[j]);
      j += 1;
    }
  }
  while (i <= mid) {
    merged.push(arr[i]);
    i += 1;
  }
  while (j <= right) {
    merged.push(arr[j]);
    j += 1;
  }
  for (let k = 0; k < merged.length; k += 1) {
    arr[left + k] = merged[k];
  }
}

mergeSort(0, arr.length - 1);
return arr;`,
    examples: [
      { label: "Almost sorted", input: { array: [1, 2, 3, 5, 4, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Reverse sorted", input: { array: [9, 8, 7, 6, 5, 4, 3, 2, 1] } , expected: [1,2,3,4,5,6,7,8,9]},
      { label: "Already sorted", input: { array: [1, 2, 3, 4, 5, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Two elements", input: { array: [5, 2] } , expected: [2,5]},
      { label: "All equal", input: { array: [7, 7, 7, 7] } , expected: [7,7,7,7]},
      { label: "Negatives", input: { array: [3, -1, 5, -7, 2, 0] } , expected: [-7,-1,0,2,3,5]},
    ],
  },
  {
    id: "quick-sort",
    name: "Quick sort",
    category: "Array",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1,2,3,5,8,9],
    code: `const arr = [...input.array];

function quickSort(low, high) {
  if (low >= high) return;
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j += 1) {
    if (arr[j] < pivot) {
      i += 1;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  const p = i + 1;
  quickSort(low, p - 1);
  quickSort(p + 1, high);
}

quickSort(0, arr.length - 1);
return arr;`,
    examples: [
      { label: "Almost sorted", input: { array: [1, 2, 3, 5, 4, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Reverse sorted", input: { array: [9, 8, 7, 6, 5, 4, 3, 2, 1] } , expected: [1,2,3,4,5,6,7,8,9]},
      { label: "Already sorted", input: { array: [1, 2, 3, 4, 5, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Two elements", input: { array: [5, 2] } , expected: [2,5]},
      { label: "All equal", input: { array: [7, 7, 7, 7] } , expected: [7,7,7,7]},
      { label: "Negatives", input: { array: [3, -1, 5, -7, 2, 0] } , expected: [-7,-1,0,2,3,5]},
    ],
  },
  {
    id: "heap-sort",
    name: "Heap sort",
    category: "Array",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1,2,3,5,8,9],
    code: `const arr = [...input.array];
const n = arr.length;

function heapify(size, root) {
  let largest = root;
  const left = 2 * root + 1;
  const right = 2 * root + 2;
  if (left < size && arr[left] > arr[largest]) largest = left;
  if (right < size && arr[right] > arr[largest]) largest = right;
  if (largest !== root) {
    [arr[root], arr[largest]] = [arr[largest], arr[root]];
    heapify(size, largest);
  }
}

for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
  heapify(n, i);
}
for (let i = n - 1; i > 0; i -= 1) {
  [arr[0], arr[i]] = [arr[i], arr[0]];
  heapify(i, 0);
}

return arr;`,
    examples: [
      { label: "Almost sorted", input: { array: [1, 2, 3, 5, 4, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Reverse sorted", input: { array: [9, 8, 7, 6, 5, 4, 3, 2, 1] } , expected: [1,2,3,4,5,6,7,8,9]},
      { label: "Already sorted", input: { array: [1, 2, 3, 4, 5, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Two elements", input: { array: [5, 2] } , expected: [2,5]},
      { label: "All equal", input: { array: [7, 7, 7, 7] } , expected: [7,7,7,7]},
      { label: "Negatives", input: { array: [3, -1, 5, -7, 2, 0] } , expected: [-7,-1,0,2,3,5]},
    ],
  },
  {
    id: "counting-sort",
    name: "Counting sort",
    category: "Array",
    input: { array: [8, 3, 5, 1, 9, 2] },
    expected: [1,2,3,5,8,9],
    code: `const arr = [...input.array];
if (arr.length === 0) return arr;
const max = Math.max(...arr);
const counts = new Array(max + 1).fill(0);
for (const value of arr) {
  counts[value] += 1;
}
let index = 0;
for (let value = 0; value <= max; value += 1) {
  while (counts[value] > 0) {
    arr[index] = value;
    index += 1;
    counts[value] -= 1;
  }
}
return arr;`,
    examples: [
      { label: "Almost sorted", input: { array: [1, 2, 3, 5, 4, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Reverse sorted", input: { array: [9, 8, 7, 6, 5, 4, 3, 2, 1] } , expected: [1,2,3,4,5,6,7,8,9]},
      { label: "Already sorted", input: { array: [1, 2, 3, 4, 5, 6] } , expected: [1,2,3,4,5,6]},
      { label: "Duplicates", input: { array: [4, 2, 4, 1, 2, 1] } , expected: [1,1,2,2,4,4]},
      { label: "All equal", input: { array: [7, 7, 7, 7] } , expected: [7,7,7,7]},
      { label: "Single element", input: { array: [3] } , expected: [3]},
    ],
  },
  {
    id: "maximum-subarray",
    name: "Maximum subarray (Kadane's)",
    category: "Array",
    input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
    expected: 6,
    code: `const nums = input.nums;
let best = nums[0];
let current = nums[0];

for (let i = 1; i < nums.length; i++) {
  current = Math.max(nums[i], current + nums[i]);
  best = Math.max(best, current);
}

return best;`,
    examples: [
      { label: "All negative", input: { nums: [-3, -1, -2] } , expected: -1},
      { label: "Single element", input: { nums: [5] } , expected: 5},
      { label: "Mixed signs", input: { nums: [1, 2, -1, 3] } , expected: 5},
      { label: "Negative dip", input: { nums: [-1, 2, 3, -5, 4] } , expected: 5},
      { label: "All positive", input: { nums: [1, 2, 3] } , expected: 6},
    ],
  },
  {
    id: "sort-colors",
    name: "Sort colors (Dutch flag)",
    category: "Array + two pointers",
    input: { nums: [2, 0, 2, 1, 1, 0] },
    expected: [0,0,1,1,2,2],
    code: `const nums = [...input.nums];
let low = 0;
let mid = 0;
let high = nums.length - 1;

while (mid <= high) {
  if (nums[mid] === 0) {
    [nums[low], nums[mid]] = [nums[mid], nums[low]];
    low++;
    mid++;
  } else if (nums[mid] === 1) {
    mid++;
  } else {
    [nums[mid], nums[high]] = [nums[high], nums[mid]];
    high--;
  }
}

return nums;`,
    examples: [
      { label: "Single zero", input: { nums: [0] } , expected: [0]},
      { label: "Descending", input: { nums: [2, 1, 0] } , expected: [0,1,2]},
      { label: "All same", input: { nums: [1, 1, 1] } , expected: [1,1,1]},
      { label: "Two colors", input: { nums: [2, 2, 0, 0] } , expected: [0,0,2,2]},
      { label: "Alternating", input: { nums: [0, 2, 1, 0, 2, 1] } , expected: [0,0,1,1,2,2]},
    ],
  },
  {
    id: "valid-palindrome",
    name: "Valid palindrome",
    category: "Two pointers + string",
    input: { s: "A man, a plan, a canal: Panama" },
    expected: true,
    code: `function isAlphaNum(ch) {
  return /[a-zA-Z0-9]/.test(ch);
}

const s = input.s;
let left = 0;
let right = s.length - 1;

while (left < right) {
  while (left < right && !isAlphaNum(s[left])) left++;
  while (left < right && !isAlphaNum(s[right])) right--;
  if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
  left++;
  right--;
}

return true;`,
    examples: [
      { label: "Not a palindrome", input: { s: "race a car" } , expected: false},
      { label: "Blanks only", input: { s: "  " } , expected: true},
      { label: "Digits and letters", input: { s: "0P" } , expected: false},
      { label: "Underscore is ignored", input: { s: "ab_a" } , expected: true},
      { label: "Single character", input: { s: "a" } , expected: true},
      { label: "Empty string", input: { s: "" } , expected: true},
    ],
  },
  {
    id: "container-with-most-water",
    name: "Container with most water",
    category: "Two pointers",
    input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] },
    expected: 49,
    code: `const height = input.height;
let left = 0;
let right = height.length - 1;
let best = 0;

while (left < right) {
  const h = Math.min(height[left], height[right]);
  best = Math.max(best, h * (right - left));
  if (height[left] < height[right]) left++;
  else right--;
}

return best;`,
    examples: [
      { label: "Two walls", input: { height: [1, 1] } , expected: 1},
      { label: "Tall ends", input: { height: [4, 3, 2, 1, 4] } , expected: 16},
      { label: "Short middle", input: { height: [1, 2, 1] } , expected: 2},
      { label: "Plateau", input: { height: [3, 3, 3, 3] } , expected: 9},
    ],
  },
  {
    id: "longest-substring-without-repeating",
    name: "Longest substring without repeating characters",
    category: "Sliding window + hash map",
    input: { s: "abcabcbb" },
    expected: 3,
    code: `const s = input.s;
const seen = new Map();
let start = 0;
let best = 0;

for (let end = 0; end < s.length; end++) {
  const char = s[end];
  if (seen.has(char) && seen.get(char) >= start) {
    start = seen.get(char) + 1;
  }
  seen.set(char, end);
  best = Math.max(best, end - start + 1);
}

return best;`,
    examples: [
      { label: "All same", input: { s: "bbbbb" } , expected: 1},
      { label: "Window resets", input: { s: "pwwkew" } , expected: 3},
      { label: "Second pass resets", input: { s: "dvdf" } , expected: 3},
      { label: "Two chars", input: { s: "au" } , expected: 2},
      { label: "Empty string", input: { s: "" } , expected: 0},
    ],
  },
  {
    id: "subsets",
    name: "Subsets",
    category: "Recursion + backtracking",
    input: { nums: [1, 2, 3] },
    expected: [[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]],
    code: `const nums = input.nums;
const result = [];

function backtrack(index, path) {
  result.push([...path]);
  for (let i = index; i < nums.length; i++) {
    path.push(nums[i]);
    backtrack(i + 1, path);
    path.pop();
  }
}

backtrack(0, []);
return result;`,
    examples: [
      { label: "Empty input", input: { nums: [] } , expected: [[]]},
      { label: "Single element", input: { nums: [1] } , expected: [[],[1]]},
      { label: "Two elements", input: { nums: [1, 2] } , expected: [[],[1],[1,2],[2]]},
    ],
  },
  {
    id: "generate-parentheses",
    name: "Generate parentheses",
    category: "Recursion + backtracking",
    input: { n: 3 },
    expected: ["((()))","(()())","(())()","()(())","()()()"],
    code: `const n = input.n;
const result = [];

function generate(open, close, current) {
  if (current.length === 2 * n) {
    result.push(current);
    return;
  }
  if (open < n) generate(open + 1, close, current + "(");
  if (close < open) generate(open, close + 1, current + ")");
}

generate(0, 0, "");
return result;`,
    examples: [
      { label: "One pair", input: { n: 1 } , expected: ["()"]},
      { label: "Two pairs", input: { n: 2 } , expected: ["(())","()()"]},
    ],
  },
  {
    id: "symmetric-tree",
    name: "Symmetric tree",
    category: "Binary tree",
    input: { root: [1, 2, 2, 3, 4, 4, 3] },
    expected: true,
    code: `class Solution {
  isSymmetric(root) {
    const mirror = (a, b) => {
      if (a === null && b === null) return true;
      if (a === null || b === null) return false;
      return a.val === b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
    };
    return mirror(root, root);
  }
}`,
    examples: [
      { label: "Not symmetric", input: { root: [1, 2, 2, null, 3, null, 3] } , expected: false},
      { label: "Single node", input: { root: [1] } , expected: true},
      { label: "Empty tree", input: { root: [] } , expected: true},
      { label: "Values differ", input: { root: [1, 2, 2, null, 3, 4, 3] } , expected: false},
    ],
  },
  {
    id: "level-order-traversal",
    name: "Binary tree level order traversal",
    category: "Binary tree",
    input: { root: [3, 9, 20, null, null, 15, 7] },
    expected: [[3],[9,20],[15,7]],
    code: `class Solution {
  levelOrder(root) {
    if (root === null) return [];
    const result = [];
    let levelNodes = [root];
    while (levelNodes.length > 0) {
      const values = [];
      const next = [];
      for (const node of levelNodes) {
        values.push(node.val);
        if (node.left !== null) next.push(node.left);
        if (node.right !== null) next.push(node.right);
      }
      result.push(values);
      levelNodes = next;
    }
    return result;
  }
}`,
    examples: [
      { label: "Single node", input: { root: [1] } , expected: [[1]]},
      { label: "Empty tree", input: { root: [] } , expected: []},
      { label: "Left chain", input: { root: [1, 2, null, 4] } , expected: [[1],[2],[4]]},
      { label: "Full levels", input: { root: [1, 2, 3, 4, 5, 6, 7] } , expected: [[1],[2,3],[4,5,6,7]]},
    ],
  },
  {
    id: "bfs-graph",
    name: "Breadth-first search",
    category: "Graph",
    input: {
      graph: { A: ["B", "C"], B: ["D", "E"], C: ["F"], D: [], E: [], F: [] },
      start: "A",
    },
    expected: ["A","B","C","D","E","F"],
    code: `const graph = input.graph;
const start = input.start;
const visited = new Set();
const queue = [start];
const order = [];
visited.add(start);

while (queue.length > 0) {
  const node = queue.shift();
  order.push(node);
  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
}

return order;`,
    examples: [
      { label: "Single node", input: { graph: { A: [] }, start: "A" } , expected: ["A"]},
      { label: "Two nodes", input: { graph: { A: ["B"], B: [] }, start: "A" } , expected: ["A","B"]},
      { label: "Star graph", input: { graph: { A: ["B", "C", "D"], B: [], C: [], D: [] }, start: "A" } , expected: ["A","B","C","D"]},
      { label: "Dense graph", input: { graph: { A: ["B", "C"], B: ["A", "D"], C: ["A", "D"], D: ["B", "C"] }, start: "A" } , expected: ["A","B","C","D"]},
    ],
  },
  {
    id: "course-schedule",
    name: "Course schedule (cycle detection)",
    category: "Graph + topological sort",
    input: { numCourses: 2, prerequisites: [[1, 0]] },
    expected: true,
    code: `const numCourses = input.numCourses;
const prerequisites = input.prerequisites;
const indegree = Array(numCourses).fill(0);
const graph = Array.from({ length: numCourses }, () => []);

for (const pair of prerequisites) {
  const course = pair[0];
  const prereq = pair[1];
  graph[prereq].push(course);
  indegree[course] = indegree[course] + 1;
}

const queue = [];
for (let i = 0; i < numCourses; i++) {
  if (indegree[i] === 0) queue.push(i);
}

let processed = 0;
while (queue.length > 0) {
  const node = queue.shift();
  processed = processed + 1;
  for (const neighbor of graph[node]) {
    indegree[neighbor] = indegree[neighbor] - 1;
    if (indegree[neighbor] === 0) queue.push(neighbor);
  }
}

return processed === numCourses;`,
    examples: [
      { label: "Cycle", input: { numCourses: 2, prerequisites: [[1, 0], [0, 1]] } , expected: false},
      { label: "Linear chain", input: { numCourses: 3, prerequisites: [[1, 0], [2, 1]] } , expected: true},
      { label: "No prerequisites", input: { numCourses: 3, prerequisites: [] } , expected: true},
      { label: "Branching", input: { numCourses: 4, prerequisites: [[1, 0], [2, 0], [3, 1]] } , expected: true},
    ],
  },
  {
    id: "add-two-numbers",
    name: "Add two numbers",
    category: "Linked list",
    input: {
      l1: { val: 2, next: { val: 4, next: { val: 3, next: null } } },
      l2: { val: 5, next: { val: 6, next: { val: 4, next: null } } },
    },
    expected: [7,0,8],
    code: `let l1 = input.l1;
let l2 = input.l2;
const dummy = { val: 0, next: null };
let tail = dummy;
let carry = 0;

while (l1 !== null || l2 !== null) {
  const a = l1 !== null ? l1.val : 0;
  const b = l2 !== null ? l2.val : 0;
  const sum = a + b + carry;
  carry = Math.floor(sum / 10);
  tail.next = { val: sum % 10, next: null };
  tail = tail.next;
  if (l1 !== null) l1 = l1.next;
  if (l2 !== null) l2 = l2.next;
}

if (carry > 0) {
  tail.next = { val: carry, next: null };
}

return dummy.next;`,
    examples: [
      {
        label: "Both zero",
        input: { l1: { val: 0, next: null }, l2: { val: 0, next: null } },
      expected: [0]},
      {
        label: "Carry cascades",
        input: { l1: { val: 9, next: { val: 9, next: { val: 9, next: null } } }, l2: { val: 1, next: null } },
      expected: [0,0,0,1]},
      {
        label: "Uneven lengths",
        input: { l1: { val: 1, next: { val: 8, next: null } }, l2: { val: 0, next: null } },
      expected: [1,8]},
      {
        label: "Single digits",
        input: { l1: { val: 5, next: null }, l2: { val: 5, next: null } },
      expected: [0,1]},
    ],
  },
  {
    id: "palindrome-linked-list",
    name: "Palindrome linked list",
    category: "Linked list + two pointers",
    input: {
      head: { val: 1, next: { val: 2, next: { val: 2, next: { val: 1, next: null } } } },
    },
    expected: true,
    code: `const head = input.head;
let slow = head;
let fast = head;

while (fast !== null && fast.next !== null) {
  slow = slow.next;
  fast = fast.next.next;
}

let prev = null;
let curr = slow;
while (curr !== null) {
  const next = curr.next;
  curr.next = prev;
  prev = curr;
  curr = next;
}

let left = head;
let right = prev;
while (right !== null) {
  if (left.val !== right.val) return false;
  left = left.next;
  right = right.next;
}

return true;`,
    examples: [
      { label: "Not a palindrome", input: { head: { val: 1, next: { val: 2, next: null } } } , expected: false},
      {
        label: "Odd length",
        input: { head: { val: 1, next: { val: 2, next: { val: 3, next: { val: 2, next: { val: 1, next: null } } } } } },
      expected: true},
      { label: "Single node", input: { head: { val: 7, next: null } } , expected: true},
      { label: "Even with carry-over", input: { head: { val: 1, next: { val: 1, next: { val: 1, next: null } } } } , expected: true},
    ],
  },
  {
    id: "valid-anagram",
    name: "Valid anagram",
    category: "Hashing",
    input: { s: "anagram", t: "nagaram" },
    expected: true,
    code: `const s = input.s;
const t = input.t;
if (s.length !== t.length) return false;

const counts = {};
for (const char of s) counts[char] = (counts[char] || 0) + 1;
for (const char of t) {
  if (!counts[char]) return false;
  counts[char] = counts[char] - 1;
}

return true;`,
    examples: [
      { label: "Different letters", input: { s: "rat", t: "car" } , expected: false},
      { label: "Same single letter", input: { s: "a", t: "a" } , expected: true},
      { label: "Both empty", input: { s: "", t: "" } , expected: true},
      { label: "Length mismatch", input: { s: "ab", t: "a" } , expected: false},
    ],
  },
  {
    id: "next-greater-element",
    name: "Next greater element",
    category: "Stack",
    input: { nums: [4, 5, 2, 10, 8] },
    expected: [5,10,10,-1,-1],
    code: `const nums = input.nums;
const result = Array(nums.length).fill(-1);
const stack = [];

for (let i = nums.length - 1; i >= 0; i--) {
  while (stack.length > 0 && stack[stack.length - 1] <= nums[i]) {
    stack.pop();
  }
  if (stack.length > 0) result[i] = stack[stack.length - 1];
  stack.push(nums[i]);
}

return result;`,
    examples: [
      { label: "Descending", input: { nums: [2, 1] } , expected: [-1,-1]},
      { label: "Peaks", input: { nums: [1, 2, 1] } , expected: [2,-1,-1]},
      { label: "Increasing", input: { nums: [3, 1, 2, 4] } , expected: [4,2,4,-1]},
      { label: "Single element", input: { nums: [7] } , expected: [-1]},
    ],
  },
  {
    id: "rotate-image",
    name: "Rotate image 90 degrees",
    category: "Matrix",
    input: {
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    },
    expected: [[7,4,1],[8,5,2],[9,6,3]],
    code: `const matrix = input.matrix;
const n = matrix.length;

for (let layer = 0; layer < Math.floor(n / 2); layer++) {
  const first = layer;
  const last = n - 1 - layer;
  for (let i = first; i < last; i++) {
    const offset = i - first;
    const top = matrix[first][i];
    matrix[first][i] = matrix[last - offset][first];
    matrix[last - offset][first] = matrix[last][last - offset];
    matrix[last][last - offset] = matrix[i][last];
    matrix[i][last] = top;
  }
}

return matrix;`,
    examples: [
      { label: "Single cell", input: { matrix: [[5]] } , expected: [[5]]},
      { label: "Two by two", input: { matrix: [[1, 2], [3, 4]] } , expected: [[3,1],[4,2]]},
      {
        label: "Four by four",
        input: { matrix: [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]] },
      expected: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]},
    ],
  },
  {
    id: "fibonacci",
    name: "Fibonacci (memoized)",
    category: "Dynamic programming",
    input: { n: 10 },
    expected: 55,
    code: `const n = input.n;
const memo = {};

function fib(k) {
  if (k <= 1) return k;
  if (memo[k] !== undefined) return memo[k];
  memo[k] = fib(k - 1) + fib(k - 2);
  return memo[k];
}

return fib(n);`,
    examples: [
      { label: "Zero", input: { n: 0 } , expected: 0},
      { label: "One", input: { n: 1 } , expected: 1},
      { label: "Two", input: { n: 2 } , expected: 1},
      { label: "Six", input: { n: 6 } , expected: 8},
      { label: "Twenty", input: { n: 20 } , expected: 6765},
    ],
  },
  {
    id: "climbing-stairs",
    name: "Climbing stairs",
    category: "Dynamic programming",
    input: { n: 5 },
    expected: 8,
    code: `const n = input.n;
const memo = {};

function ways(k) {
  if (k <= 2) return k;
  if (memo[k] !== undefined) return memo[k];
  memo[k] = ways(k - 1) + ways(k - 2);
  return memo[k];
}

return ways(n);`,
    examples: [
      { label: "One step", input: { n: 1 } , expected: 1},
      { label: "Two steps", input: { n: 2 } , expected: 2},
      { label: "Three steps", input: { n: 3 } , expected: 3},
      { label: "Four steps", input: { n: 4 } , expected: 5},
      { label: "Ten steps", input: { n: 10 } , expected: 89},
    ],
  },
  {
    id: "house-robber",
    name: "House robber",
    category: "Dynamic programming",
    input: { nums: [2, 7, 9, 3, 1] },
    expected: 12,
    code: `const nums = input.nums;
const n = nums.length;
if (n === 0) return 0;
if (n === 1) return nums[0];

const dp = Array(n).fill(0);
dp[0] = nums[0];
dp[1] = Math.max(nums[0], nums[1]);

for (let i = 2; i < n; i++) {
  dp[i] = Math.max(dp[i - 1], dp[i - 2] + nums[i]);
}

return dp[n - 1];`,
    examples: [
      { label: "Alternating picks", input: { nums: [1, 2, 3, 1] } , expected: 4},
      { label: "Equal totals", input: { nums: [2, 1, 1, 2] } , expected: 4},
      { label: "Single house", input: { nums: [5] } , expected: 5},
      { label: "Empty street", input: { nums: [] } , expected: 0},
      { label: "Descending values", input: { nums: [1, 3, 1] } , expected: 3},
    ],
  },
  {
    id: "coin-change",
    name: "Coin change (minimum coins)",
    category: "Dynamic programming",
    input: { coins: [1, 2, 5], amount: 11 },
    expected: 3,
    code: `const coins = input.coins;
const amount = input.amount;
const dp = Array(amount + 1).fill(Infinity);
dp[0] = 0;

for (let i = 1; i <= amount; i++) {
  for (const coin of coins) {
    if (coin <= i) {
      dp[i] = Math.min(dp[i], dp[i - coin] + 1);
    }
  }
}

return dp[amount] === Infinity ? -1 : dp[amount];`,
    examples: [
      { label: "Unreachable", input: { coins: [2], amount: 3 } , expected: -1},
      { label: "Zero amount", input: { coins: [1], amount: 0 } , expected: 0},
      { label: "Single coin", input: { coins: [1, 2, 5], amount: 5 } , expected: 1},
      { label: "Exact pairing", input: { coins: [1, 3, 4], amount: 6 } , expected: 2},
    ],
  },
  {
    id: "longest-common-subsequence",
    name: "Longest common subsequence",
    category: "Dynamic programming",
    input: { text1: "abcde", text2: "ace" },
    expected: 3,
    code: `const s1 = input.text1;
const s2 = input.text2;
const m = s1.length;
const n = s2.length;
const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

for (let i = 1; i <= m; i++) {
  for (let j = 1; j <= n; j++) {
    if (s1[i - 1] === s2[j - 1]) {
      dp[i][j] = dp[i - 1][j - 1] + 1;
    } else {
      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
}

return dp[m][n];`,
    examples: [
      { label: "No common chars", input: { text1: "abc", text2: "def" } , expected: 0},
      { label: "Identical strings", input: { text1: "abc", text2: "abc" } , expected: 3},
      { label: "One char", input: { text1: "a", text2: "a" } , expected: 1},
      { label: "Empty string", input: { text1: "", text2: "abc" } , expected: 0},
      { label: "Subsequence", input: { text1: "abcba", text2: "abcbcba" } , expected: 5},
    ],
  },
  {
    id: "01-knapsack",
    name: "0/1 Knapsack",
    category: "Dynamic programming",
    input: { capacity: 7, weights: [1, 3, 4, 5], values: [1, 4, 5, 7] },
    expected: 9,
    code: `const capacity = input.capacity;
const weights = input.weights;
const values = input.values;
const n = weights.length;
const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

for (let i = 1; i <= n; i++) {
  for (let w = 0; w <= capacity; w++) {
    dp[i][w] = dp[i - 1][w];
    if (weights[i - 1] <= w) {
      dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
    }
  }
}

return dp[n][capacity];`,
    examples: [
      { label: "Zero capacity", input: { capacity: 0, weights: [1, 2], values: [3, 4] } , expected: 0},
      { label: "One item fits", input: { capacity: 3, weights: [2, 3, 4], values: [3, 4, 5] } , expected: 4},
      { label: "All items fit", input: { capacity: 10, weights: [1, 2, 3], values: [10, 20, 30] } , expected: 60},
      { label: "Classic example", input: { capacity: 50, weights: [10, 20, 30], values: [60, 100, 120] } , expected: 220},
    ],
  },
  {
    id: "edit-distance",
    name: "Edit distance",
    category: "Dynamic programming",
    input: { word1: "horse", word2: "ros" },
    expected: 3,
    code: `const s1 = input.word1;
const s2 = input.word2;
const m = s1.length;
const n = s2.length;
const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

for (let i = 0; i <= m; i++) dp[i][0] = i;
for (let j = 0; j <= n; j++) dp[0][j] = j;

for (let i = 1; i <= m; i++) {
  for (let j = 1; j <= n; j++) {
    if (s1[i - 1] === s2[j - 1]) {
      dp[i][j] = dp[i - 1][j - 1];
    } else {
      dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
}

return dp[m][n];`,
    examples: [
      { label: "Identical", input: { word1: "abc", word2: "abc" } , expected: 0},
      { label: "Empty target", input: { word1: "abc", word2: "" } , expected: 3},
      { label: "One edit", input: { word1: "cat", word2: "cut" } , expected: 1},
      { label: "Classic example", input: { word1: "intention", word2: "execution" } , expected: 5},
    ],
  },
  {
    id: "bfs-shortest-path",
    name: "BFS shortest path",
    category: "Graph",
    input: {
      graph: { A: ["B", "C"], B: ["D"], C: ["D", "F"], D: ["E"], E: [], F: [] },
      start: "A",
      target: "F",
    },
    expected: ["A", "C", "F"],
    code: `const graph = input.graph;
const start = input.start;
const target = input.target;
const prev = {};
const visited = new Set();
const queue = [start];
visited.add(start);
prev[start] = null;

while (queue.length > 0) {
  const node = queue.shift();
  if (node === target) break;
  for (const neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      visited.add(neighbor);
      prev[neighbor] = node;
      queue.push(neighbor);
    }
  }
}

const path = [];
let curr = target;
while (curr !== null) {
  path.unshift(curr);
  curr = prev[curr];
}

return path;`,
    examples: [
      { label: "Direct path", input: { graph: { A: ["B"], B: [] }, start: "A", target: "B" } , expected: ["A", "B"]},
      { label: "Longer graph", input: { graph: { A: ["B", "C"], B: ["D"], C: ["D"], D: ["E"], E: [] }, start: "A", target: "E" } , expected: ["A", "B", "D", "E"]},
      { label: "Start is target", input: { graph: { A: ["B"], B: [] }, start: "A", target: "A" } , expected: ["A"]},
    ],
  },
  {
    id: "minimum-path-sum",
    name: "Minimum path sum",
    category: "Matrix + DP",
    input: {
      grid: [
        [1, 3, 1],
        [1, 5, 1],
        [4, 2, 1],
      ],
    },
    expected: 7,
    code: `const grid = input.grid;
const m = grid.length;
const n = grid[0].length;
const dp = Array.from({ length: m }, () => Array(n).fill(0));
dp[0][0] = grid[0][0];

for (let i = 1; i < m; i++) dp[i][0] = dp[i - 1][0] + grid[i][0];
for (let j = 1; j < n; j++) dp[0][j] = dp[0][j - 1] + grid[0][j];

for (let i = 1; i < m; i++) {
  for (let j = 1; j < n; j++) {
    dp[i][j] = grid[i][j] + Math.min(dp[i - 1][j], dp[i][j - 1]);
  }
}

const path = [];
let i = m - 1;
let j = n - 1;
while (i > 0 || j > 0) {
  path.unshift({ row: i, col: j });
  if (i === 0) j--;
  else if (j === 0) i--;
  else if (dp[i - 1][j] < dp[i][j - 1]) i--;
  else j--;
}
path.unshift({ row: 0, col: 0 });

return dp[m - 1][n - 1];`,
    examples: [
      { label: "2×2 grid", input: { grid: [[1, 2], [1, 1]] } , expected: 3},
      { label: "Single cell", input: { grid: [[5]] } , expected: 5},
      { label: "Single row", input: { grid: [[1, 2, 3]] } , expected: 6},
      { label: "Single column", input: { grid: [[1], [2], [3]] } , expected: 6},
      { label: "All ones", input: { grid: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] } , expected: 5},
    ],
  },
];
