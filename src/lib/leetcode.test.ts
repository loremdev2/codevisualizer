import { describe, expect, it } from "vitest";

import { instrumentForTrace } from "./trace-runner";
import { stripTypeScript } from "./trace/typescript";

import type { TreeStep, VisualStep } from "@/types/visualizer";
import { buildPythonHarness, buildJsHarness, detectJsEntry, detectPythonEntry } from "./trace/leetcode";
import { buildPythonSteps, type PythonRawEvent } from "./trace/python-steps";
import { normalizeSteps, runTraceInNode } from "./trace-runner";

const TWO_SUM = `class Solution {
  twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (seen.has(complement)) return [seen.get(complement), i];
      seen.set(nums[i], i);
    }
    return [];
  }
}`;

const REVERSE_LIST = `class Solution {
  reverseList(head) {
    let prev = null;
    let curr = head;
    while (curr !== null) {
      const next = curr.next;
      curr.next = prev;
      prev = curr;
      curr = next;
    }
    return prev;
  }
}`;

const INVERT_TREE = `class Solution {
  invertTree(root) {
    if (root === null) return null;
    const left = this.invertTree(root.left);
    const right = this.invertTree(root.right);
    root.left = right;
    root.right = left;
    return root;
  }
}`;

const CLONE_GRAPH = `class Node {
  constructor(val, neighbors) {
    this.val = val;
    this.neighbors = neighbors || [];
  }
}
class Solution {
  cloneGraph(node) {
    if (node === null) return null;
    const seen = new Map();
    const clone = (n) => {
      if (seen.has(n)) return seen.get(n);
      const copy = new Node(n.val);
      seen.set(n, copy);
      copy.neighbors = n.neighbors.map(clone);
      return copy;
    };
    return clone(node);
  }
}`;

const COURSE_SCHEDULE = `class Solution {
  canFinish(numCourses, prerequisites) {
    const graph = {};
    for (const [a, b] of prerequisites) {
      if (!graph[a]) graph[a] = [];
      graph[a].push(b);
    }
    const state = new Array(numCourses).fill(0);
    const dfs = (course) => {
      if (state[course] === 1) return false;
      if (state[course] === 2) return true;
      state[course] = 1;
      for (const next of graph[course] ?? []) {
        if (!dfs(next)) return false;
      }
      state[course] = 2;
      return true;
    };
    for (let i = 0; i < numCourses; i++) {
      if (!dfs(i)) return false;
    }
    return true;
  }
}`;

describe("detectJsEntry", () => {
  it("detects a Solution class and picks the method matching the input keys", () => {
    const entry = detectJsEntry(TWO_SUM, '{"nums": [2, 7, 11, 15], "target": 9}');
    expect(entry).toEqual({
      kind: "class",
      className: "Solution",
      methodName: "twoSum",
      paramNames: ["nums", "target"],
    });
  });

  it("detects a bare function declaration", () => {
    const code = `function maxArea(height) {
  let best = 0;
  return best;
}`;
    const entry = detectJsEntry(code, '{"height": [1, 8, 6]}');
    expect(entry).toEqual({ kind: "function", functionName: "maxArea", paramNames: ["height"] });
  });

  it("detects an arrow-function const", () => {
    const code = `const climbStairs = (n) => {
  return n;
};`;
    const entry = detectJsEntry(code, '{"n": 5}');
    expect(entry).toEqual({ kind: "function", functionName: "climbStairs", paramNames: ["n"] });
  });

  it("picks the input-matching method when a class has helpers", () => {
    const code = `class Solution {
  helper(x) { return x; }
  twoSum(nums, target) { return [0, 1]; }
}`;
    const entry = detectJsEntry(code, '{"nums": [1], "target": 2}');
    expect(entry?.kind).toBe("class");
    if (entry?.kind === "class") expect(entry.methodName).toBe("twoSum");
  });

  it("falls back to positional mapping when params don't match keys", () => {
    const code = `class Solution {
  solve(a, b) { return a + b; }
}`;
    const entry = detectJsEntry(code, '{"x": 1, "y": 2}');
    expect(entry?.paramNames).toEqual(["a", "b"]);
  });

  it("returns null for template-style code that consumes `input`", () => {
    expect(detectJsEntry("const arr = input.array;\nreturn arr;", '{"array": [1]}')).toBeNull();
  });

  it("returns null for code with no entry function", () => {
    expect(detectJsEntry("const x = 1;", "{}")).toBeNull();
  });

  it("returns null when the code can't be parsed", () => {
    expect(detectJsEntry("function (", "{}")).toBeNull();
  });
});

describe("detectPythonEntry", () => {
  it("detects a Solution class and strips self", () => {
    const code = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            if target - num in seen:
                return [seen[target - num], i]
            seen[num] = i
        return []`;
    const entry = detectPythonEntry(code, '{"nums": [2, 7], "target": 9}');
    expect(entry).toEqual({
      kind: "class",
      className: "Solution",
      methodName: "twoSum",
      paramNames: ["nums", "target"],
    });
  });

  it("detects a bare top-level def", () => {
    const entry = detectPythonEntry("def reverseList(head):\n    return head\n", '{"head": [1, 2]}');
    expect(entry?.kind).toBe("function");
    if (entry?.kind === "function") expect(entry.functionName).toBe("reverseList");
  });

  it("returns null for template-style code using input", () => {
    expect(detectPythonEntry("arr = input['array']\n", '{"array": [1]}')).toBeNull();
  });
});

describe("buildJsHarness", () => {
  it("converts list params from arrays and skips ListNode redefinition", () => {
    const entry = detectJsEntry(REVERSE_LIST, '{"head": [1, 2, 3]}')!;
    const harness = buildJsHarness(entry, REVERSE_LIST, '{"head": [1, 2, 3]}');
    expect(harness).toContain("function ListNode(val, next)");
    expect(harness).toContain('__fromArray(input.head, "head")');
    expect(harness).toContain("new Solution().reverseList(...__args)");
    expect(harness).toContain("return __harnessResult;");
  });

  it("does not redefine ListNode/TreeNode when the code already defines them", () => {
    const code = `class ListNode { constructor(val, next) { this.val = val; this.next = next || null; } }
class Solution { reverseList(head) { return head; } }`;
    const entry = detectJsEntry(code, '{"head": [1]}')!;
    const harness = buildJsHarness(entry, code, '{"head": [1]}');
    expect(harness).not.toContain("function ListNode");
  });

  it("converts tree params from arrays", () => {
    const entry = detectJsEntry(INVERT_TREE, '{"root": [4, 2, 7]}')!;
    const harness = buildJsHarness(entry, INVERT_TREE, '{"root": [4, 2, 7]}');
    expect(harness).toContain('__fromArray(input.root, "root")');
  });

  it("converts clone-graph adjList into GraphNodes and skips its own Node redefinition", () => {
    const entry = detectJsEntry(CLONE_GRAPH, '{"adjList": [[2, 4], [1, 3], [2, 4], [1, 3]]}')!;
    expect(entry?.kind).toBe("class");
    if (entry?.kind === "class") expect(entry.methodName).toBe("cloneGraph");
    const harness = buildJsHarness(entry, CLONE_GRAPH, '{"adjList": [[2, 4], [1, 3], [2, 4], [1, 3]]}');
    // `node` doesn't match the input key, so mapping is positional — but the
    // dispatcher still converts the array-of-arrays into GraphNodes.
    expect(harness).toContain('__fromArray(input[__keys[0]], "node")');
    expect(harness).toContain("function __graphFromAdjList(arr)");
    // The student code already defines its own Node class — never redefine it.
    expect(harness).not.toContain("function GraphNode");
  });

  it("maps params positionally when names don't match the input keys", () => {
    const entry = detectJsEntry(TWO_SUM, '{"array": [2, 7], "k": 9}')!;
    const harness = buildJsHarness(entry, TWO_SUM, '{"array": [2, 7], "k": 9}');
    expect(harness).toContain("input[__keys[0]]");
    expect(harness).toContain("input[__keys[1]]");
  });
});

describe("buildPythonHarness", () => {
  it("generates a class invocation with name-matched args", () => {
    const entry = detectPythonEntry(
      "class Solution:\n    def twoSum(self, nums, target):\n        return []\n",
      '{"nums": [1], "target": 2}',
    )!;
    const harness = buildPythonHarness(entry, "class Solution:\n    def twoSum(self, nums, target):\n        return []\n", '{"nums": [1], "target": 2}');
    expect(harness).toContain("Solution().twoSum(*__args)");
    expect(harness).toContain('__arg("nums", 0)');
    expect(harness).toContain("__tree_from_array");
  });

  it("includes the graph adjacency converter and result serializer", () => {
    const entry = detectPythonEntry(
      "class Solution:\n    def cloneGraph(self, node):\n        return node\n",
      '{"adjList": [[2, 4]]}',
    )!;
    const harness = buildPythonHarness(
      entry,
      "class Solution:\n    def cloneGraph(self, node):\n        return node\n",
      '{"adjList": [[2, 4]]}',
    );
    expect(harness).toContain("def __graph_from_adj_list(arr):");
    expect(harness).toContain("class GraphNode:");
    expect(harness).toContain("hasattr(value, 'val') and hasattr(value, 'neighbors')");
  });
});

describe("LeetCode-format end-to-end traces (JS)", () => {
  it("two sum: runs a pasted class Solution and returns [0, 1]", async () => {
    const message = await runTraceInNode(TWO_SUM, '{"nums": [2, 7, 11, 15], "target": 9}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([0, 1]);
    const steps = normalizeSteps(message.steps ?? []);
    expect(steps.some((step) => step.hashMapName === "seen")).toBe(true);
  });

  it("reverse linked list: array input becomes a chain, result is the reversed array", async () => {
    const message = await runTraceInNode(REVERSE_LIST, '{"head": [1, 2, 3, 4]}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([4, 3, 2, 1]);
    const steps = normalizeSteps(message.steps ?? []);
    const linked = steps.filter((step) => step.linkedList);
    expect(linked.length).toBeGreaterThan(0);
  });

  it("invert binary tree: array input becomes a tree, steps carry a tree, result is level-order", async () => {
    const message = await runTraceInNode(INVERT_TREE, '{"root": [4, 2, 7, 1, 3, 6, 9]}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([4, 7, 2, 9, 6, 3, 1]);
    const steps = normalizeSteps(message.steps ?? []);
    const treeSteps = steps.filter(
      (step): step is VisualStep & { tree: TreeStep } => step.tree !== undefined,
    );
    expect(treeSteps.length).toBeGreaterThan(0);
    // The root tree is named `root` and its root node keeps id 0.
    expect(treeSteps[0].tree.roots.root).toBe(0);
    expect(treeSteps[0].tree.values["0"]).toBe(4);
  });

  it("a helper function receiving only a subtree keeps the primary tree on screen", async () => {
    // Classic LeetCode shape: the method just delegates, and a top-level
    // helper `dfs(node)` does the recursion. Inside the helper the top-level
    // `root` is out of scope, so the canvas must keep rendering the remembered
    // primary tree with `node` drawn as a pointer — not shrink to the subtree.
    const code = `class Solution {
  maxDepth(root) {
    return dfs(root);
  }
}
function dfs(node) {
  if (!node) return 0;
  const left = dfs(node.left);
  const right = dfs(node.right);
  return 1 + Math.max(left, right);
}`;
    const message = await runTraceInNode(code, '{"root": [3, 9, 20, null, null, 15, 7]}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(3);
    const steps = normalizeSteps(message.steps ?? []);
    const treeSteps = steps.filter(
      (step): step is VisualStep & { tree: TreeStep } => step.tree !== undefined,
    );
    expect(treeSteps.length).toBeGreaterThan(0);
    // Descending into dfs(node=TreeNode(9)): the whole tree stays the root
    // row and `node` points at the subtree root.
    const atNode9 = treeSteps.find((step) => step.tree.pointers.node === 1);
    expect(atNode9, "expected a step with node pointer onto id 1").toBeDefined();
    expect(atNode9!.tree.roots.root).toBe(0);
    expect(atNode9!.tree.values["0"]).toBe(3);
    expect(Object.keys(atNode9!.tree.values)).toHaveLength(5);
    expect(atNode9!.tree.active).toBe(1);
    // Every tree step renders the same full structure under the `root` name,
    // and root id 0 must not be re-added as a spurious pointer arrow.
    for (const step of treeSteps) {
      expect(step.tree.roots.root, "root row must stay the primary tree").toBe(0);
      expect(step.tree.pointers.root, "root must not double as a pointer").toBeUndefined();
      expect(Object.keys(step.tree.values)).toHaveLength(5);
    }
  });

  it("self-recursion (invertTree) keeps the whole tree visible at every depth", async () => {
    const message = await runTraceInNode(INVERT_TREE, '{"root": [4, 2, 7, 1, 3, 6, 9]}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([4, 7, 2, 9, 6, 3, 1]);
    const steps = normalizeSteps(message.steps ?? []);
    const treeSteps = steps.filter(
      (step): step is VisualStep & { tree: TreeStep } => step.tree !== undefined,
    );
    expect(treeSteps.length).toBeGreaterThan(0);
    // Deep in the recursion `root` is a leaf subtree, but the canvas must
    // still show the full tree (all 7 nodes) with the root row at id 0.
    for (const step of treeSteps) {
      expect(step.tree.roots.root).toBe(0);
      expect(step.tree.pointers.root, "root must not double as a pointer").toBeUndefined();
      expect(Object.keys(step.tree.values)).toHaveLength(7);
    }
    // The deepest step still highlights the node being processed.
    const last = treeSteps[treeSteps.length - 1];
    expect(last.tree.active).not.toBeNull();
  });

  it("valid parentheses: pasted solution with a string input runs and returns true", async () => {
    const code = `class Solution {
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
}`;
    const message = await runTraceInNode(code, '{"s": "()[]{}"}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(true);
    const steps = normalizeSteps(message.steps ?? []);
    expect(steps.some((step) => step.stackName === "stack")).toBe(true);
  });

  it("a bare function (not a class) is invoked directly", async () => {
    const code = `function addOne(nums) {
  return nums.map((n) => n + 1);
}`;
    const message = await runTraceInNode(code, '{"nums": [1, 2, 3]}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([2, 3, 4]);
  });

  it("void in-place methods return the mutated first argument (LeetCode judge semantics)", async () => {
    const code = `class Solution {
  rotate(nums, k) {
    k = k % nums.length;
    const reverse = (from, to) => {
      while (from < to) {
        const temp = nums[from];
        nums[from] = nums[to];
        nums[to] = temp;
        from++;
        to--;
      }
    };
    reverse(0, nums.length - 1);
    reverse(0, k - 1);
    reverse(k, nums.length - 1);
  }
}`;
    const message = await runTraceInNode(code, '{"nums": [1, 2, 3, 4, 5, 6, 7], "k": 3}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([5, 6, 7, 1, 2, 3, 4]);
  });

  it("void in-place tree methods surface the mutated root as level-order", async () => {
    const code = `class Solution {
  flatten(root) {
    let current = root;
    while (current !== null) {
      if (current.left !== null) {
        let predecessor = current.left;
        while (predecessor.right !== null) predecessor = predecessor.right;
        predecessor.right = current.right;
        current.right = current.left;
        current.left = null;
      }
      current = current.right;
    }
  }
}`;
    const message = await runTraceInNode(code, '{"root": [1, 2, 5, 3, 4, null, 6]}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([1, null, 2, null, 3, null, 4, null, 5, null, 6]);
  });

  it("returns null for a ListNode result (no cycle) as a plain array", async () => {
    const message = await runTraceInNode(REVERSE_LIST, '{"head": [9]}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toEqual([9]);
  });

  it("clone graph: adjList becomes real Node objects, steps capture the adjacency, result is the LeetCode encoding", async () => {
    const input = '{"adjList": [[2, 4], [1, 3], [2, 4], [1, 3]]}';
    const message = await runTraceInNode(CLONE_GRAPH, input);
    expect(message.ok, message.error).toBe(true);
    // Clone-graph results serialize back to LeetCode's adjList encoding.
    expect(message.result).toEqual([
      [2, 4],
      [1, 3],
      [2, 4],
      [1, 3],
    ]);
    const steps = normalizeSteps(message.steps ?? []);
    const graphSteps = steps.filter((step) => step.graph !== undefined);
    expect(graphSteps.length).toBeGreaterThan(0);
    const first = graphSteps[0];
    expect(first.graphName).toBe("node");
    // The captured adjacency maps every node val to its neighbors' vals.
    expect(first.graph).toMatchObject({
      "1": [2, 4],
      "2": [1, 3],
      "3": [2, 4],
      "4": [1, 3],
    });
  });

  it("matrix transpose: assignment whose RHS is another matrix access traces cleanly", async () => {
    const code = `class Solution {
  rotate(matrix) {
    const n = matrix.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const temp = matrix[i][j];
        matrix[i][j] = matrix[j][i];
        matrix[j][i] = temp;
      }
    }
  }
}`;
    const message = await runTraceInNode(code, '{"matrix": [[1, 2], [3, 4]]}');
    expect(message.ok, message.error).toBe(true);
    expect((message.steps ?? []).length).toBeGreaterThan(0);
  });

  it("ternary inside a const initializer doesn't capture its own TDZ name", async () => {
    const code = `class Solution {
  canCompleteCircuit(gas, cost) {
    let start = 0;
    return gas.length > cost.length ? start : start;
  }
}`;
    const message = await runTraceInNode(code, '{"gas": [1, 2], "cost": [1]}');
    expect(message.ok, message.error).toBe(true);
  });

  it("ternary inside a return statement traces cleanly", async () => {
    const code = `class Solution {
  search(nums, target) {
    return nums[0] === target ? 0 : -1;
  }
}`;
    const message = await runTraceInNode(code, '{"nums": [4, 5, 6], "target": 4}');
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(0);
  });

  it("course schedule: edges input runs and the solution's own adjacency is rendered", async () => {
    const message = await runTraceInNode(
      COURSE_SCHEDULE,
      '{"numCourses": 2, "prerequisites": [[1, 0]]}',
    );
    expect(message.ok, message.error).toBe(true);
    expect(message.result).toBe(true);
    const steps = normalizeSteps(message.steps ?? []);
    const graphSteps = steps.filter((step) => step.graph !== undefined);
    expect(graphSteps.length).toBeGreaterThan(0);
    expect(graphSteps[0].graphName).toBe("graph");
  });
});

describe("Python nodes → linkedList/tree steps", () => {
  it("builds a linkedList step from harness node id-maps", () => {
    const raw: PythonRawEvent = {
      line: 2,
      locals: { i: 1 },
      nodes: {
        values: { "0": 1, "1": 2, "2": 3 },
        next: { "0": 1, "1": 2, "2": null },
        refs: { head: { id: 0, kind: "list" }, curr: { id: 2, kind: "list" } },
      },
      kind: "line",
      note: null,
      comparisons: 0,
    };
    const { steps } = buildPythonSteps([raw]);
    expect(steps[0].linkedList).toBeDefined();
    expect(steps[0].linkedList!.lists.head).toEqual({ order: [0, 1, 2] });
    expect(steps[0].linkedList!.pointers.curr).toBe(2);
  });

  it("builds a tree step from harness node id-maps", () => {
    const raw: PythonRawEvent = {
      line: 3,
      locals: { depth: 2 },
      nodes: {
        values: { "0": 4, "1": 2, "2": 7 },
        left: { "0": 1, "1": null, "2": null },
        right: { "0": 2, "1": null, "2": null },
        refs: { root: { id: 0, kind: "tree" }, node: { id: 1, kind: "tree" } },
      },
      kind: "line",
      note: null,
      comparisons: 0,
    };
    const { steps } = buildPythonSteps([raw]);
    expect(steps[0].tree).toBeDefined();
    expect(steps[0].tree!.roots.root).toBe(0);
    expect(steps[0].tree!.left["0"]).toBe(1);
    expect(steps[0].tree!.pointers.node).toBe(1);
  });
});

describe("TypeScript entry detection + stripping", () => {
  it("appends the LeetCode harness when the source carries type annotations", () => {
    const code = `class Solution {
  twoSum(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    return [0, 1];
  }
}`;
    const instrumented = instrumentForTrace(code, {
      typescript: true,
      inputText: JSON.stringify({ nums: [2, 7], target: 9 }),
    });
    expect(instrumented.code).toContain("__harnessResult");
    expect(instrumented.code).toContain("new Solution().twoSum");
  });

  it("strips constructor type arguments like new Map<number, number>()", () => {
    const stripped = stripTypeScript(`const seen = new Map<number, number>();`);
    expect(stripped).toBe(`const seen = new Map();`);
  });
});
