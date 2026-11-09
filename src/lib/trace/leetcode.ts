/**
 * LeetCode / GFG-style entry detection and harness generation.
 *
 * Students paste solutions in the platform format — `class Solution {
 * twoSum(nums, target) { ... } }` (JS) or `class Solution:` / `def
 * twoSum(nums, target):` (Python) — which never reference the app's `input`
 * JSON. To make any such pasted solution run, we detect the entry point and
 * append a small harness that maps the input JSON onto the method/function
 * parameters (by name, else positionally), converts LeetCode-style array
 * inputs into real ListNode / TreeNode chains (arrays with `null` → trees),
 * invokes the entry, and returns the result.
 *
 * The JS harness is appended AFTER instrumentation (raw, uninstrumented
 * source), so the helper functions build lists/trees without polluting the
 * trace; the Python harness is compiled under a separate `<harness>` filename
 * that the sys.settrace tracer ignores for the same reason.
 *
 * Everything here is pure (no DOM, no workers) so it is unit-testable.
 */

import { parse } from "acorn";

// ---------------------------------------------------------------------------
// Shared input-shape helpers
// ---------------------------------------------------------------------------

type InputShape = { kind: "object"; keys: string[] } | { kind: "array" };

function inputShapeOf(inputText: string): InputShape {
  try {
    const parsed = JSON.parse(inputText);
    if (Array.isArray(parsed)) return { kind: "array" };
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { kind: "object", keys: Object.keys(parsed as Record<string, unknown>) };
    }
  } catch {
    // Fall through to the default below.
  }
  return { kind: "object", keys: [] };
}

/** Simple identifier params (others fall back to positional mapping). */
type ParamNames = Array<string | null>;

function scoreParams(paramNames: ParamNames, keys: string[]): number {
  return paramNames.filter((name) => name !== null && keys.includes(name)).length;
}

// ---------------------------------------------------------------------------
// JavaScript entry detection (acorn)
// ---------------------------------------------------------------------------

export type JsEntry =
  | { kind: "class"; className: string; methodName: string; paramNames: ParamNames }
  | { kind: "function"; functionName: string; paramNames: ParamNames };

type JsCandidate = { name: string; paramNames: ParamNames };

/**
 * Detects the entry point of pasted LeetCode-style JavaScript. Returns null
 * when the code is template-style (already consumes `input`), has no
 * class/function entry, or can't be parsed (the instrumenter reports its own
 * error then).
 */
export function detectJsEntry(code: string, inputText: string): JsEntry | null {
  // Template-style code already reads `input` — never wrap it.
  if (/\binput\b/.test(code)) return null;

  let ast: unknown;
  try {
    ast = parse(code, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowReturnOutsideFunction: true,
      allowHashBang: true,
    });
  } catch {
    return null;
  }

  const shape = inputShapeOf(inputText);
  const keys = shape.kind === "object" ? shape.keys : [];
  const program = ast as { type: string; body: unknown[] };
  if (program.type !== "Program") return null;

  const classes: Array<{ name: string; methods: JsCandidate[] }> = [];
  const functions: JsCandidate[] = [];

  const unwrap = (node: any): any => {
    if (node?.type === "ExportNamedDeclaration" || node?.type === "ExportDefaultDeclaration") {
      return node.declaration;
    }
    return node;
  };

  for (const raw of program.body) {
    const node = unwrap(raw);
    if (!node) continue;

    if (node.type === "ClassDeclaration" && node.id?.type === "Identifier") {
      const methods: JsCandidate[] = [];
      for (const member of node.body?.body ?? []) {
        if (member.type !== "MethodDefinition" || member.kind === "constructor") continue;
        if (member.computed || member.key?.type === "PrivateIdentifier") continue;
        const name = member.key?.type === "Identifier" ? member.key.name : undefined;
        if (!name) continue;
        const params = paramNamesOf(member.value?.params);
        methods.push({ name, paramNames: params });
      }
      if (methods.length) classes.push({ name: node.id.name, methods });
      continue;
    }

    if (node.type === "FunctionDeclaration" && node.id?.type === "Identifier") {
      functions.push({ name: node.id.name, paramNames: paramNamesOf(node.params) });
      continue;
    }

    if (node.type === "VariableDeclaration") {
      for (const declaration of node.declarations ?? []) {
        const init = declaration?.init;
        if (
          declaration?.id?.type === "Identifier" &&
          (init?.type === "ArrowFunctionExpression" || init?.type === "FunctionExpression")
        ) {
          functions.push({ name: declaration.id.name, paramNames: paramNamesOf(init.params) });
        }
      }
    }
  }

  // Prefer a Solution-style class (LeetCode convention), then any class, then
  // bare functions. Among candidates, pick the one whose params best match the
  // input keys; ties resolve to the first declared.
  const classEntry = classes.find((entry) => entry.name === "Solution") ?? classes[0];
  if (classEntry) {
    const method = bestCandidate(classEntry.methods, keys);
    if (method) {
      return {
        kind: "class",
        className: classEntry.name,
        methodName: method.name,
        paramNames: method.paramNames,
      };
    }
  }

  const fn = bestCandidate(functions, keys);
  if (fn) return { kind: "function", functionName: fn.name, paramNames: fn.paramNames };

  return null;
}

function paramNamesOf(params: unknown): ParamNames {
  return ((params ?? []) as unknown[]).map((param: any) => {
    if (param?.type === "Identifier") return param.name;
    return null;
  });
}

function bestCandidate(candidates: JsCandidate[], keys: string[]): JsCandidate | undefined {
  let best: JsCandidate | undefined;
  let bestScore = -1;
  for (const candidate of candidates) {
    const score = scoreParams(candidate.paramNames, keys);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// JavaScript harness generation
// ---------------------------------------------------------------------------

// Param names that receive a LeetCode-style structure conversion (array →
// ListNode / TreeNode / GraphNode). Anything else passes through untouched.
const NODE_PARAM_RE =
  /^(head|list|l1|l2|tail|dummy|first|root|root1|root2|subRoot|tree|tree1|tree2|node|graph|adjList|adjacency|start|vertex|curr|current|cur|p|q|slow|fast)$/i;

function convertExpr(paramName: string | null, expr: string): string {
  if (paramName === null) return expr;
  if (NODE_PARAM_RE.test(paramName)) {
    return `__fromArray(${expr}, ${JSON.stringify(paramName)})`;
  }
  return expr;
}

/**
 * The raw harness appended after instrumentation. Raw = uninstrumented, so the
 * list/tree builders and the entry call produce no trace noise — only the
 * instrumented method bodies (Call/Return/branch steps) appear.
 */
export function buildJsHarness(entry: JsEntry, code: string, inputText: string): string {
  const hasListNodeDef = /\b(?:class|function)\s+ListNode\b|\b(?:const|let|var)\s+ListNode\s*=/.test(code);
  const hasTreeNodeDef = /\b(?:class|function)\s+TreeNode\b|\b(?:const|let|var)\s+TreeNode\s*=/.test(code);
  const hasGraphNodeDef = /\b(?:class|function)\s+(?:GraphNode|Node)\b|\b(?:const|let|var)\s+(?:GraphNode|Node)\s*=/.test(code);
  const shape = inputShapeOf(inputText);

  const lines: string[] = [];
  lines.push("");
  lines.push("// ── LeetCode-style entry harness (auto-detected) ──");
  if (!hasListNodeDef) {
    lines.push("function ListNode(val, next) { this.val = val; this.next = next || null; }");
  }
  if (!hasTreeNodeDef) {
    lines.push("function TreeNode(val, left, right) { this.val = val; this.left = left || null; this.right = right || null; }");
  }
  if (!hasGraphNodeDef) {
    lines.push("function GraphNode(val, neighbors) { this.val = val; this.neighbors = neighbors || []; }");
  }
  lines.push("function __listFromArray(arr) {");
  lines.push("  if (!arr || arr.length === 0) return null;");
  lines.push("  const head = new ListNode(arr[0]);");
  lines.push("  let tail = head;");
  lines.push("  for (let i = 1; i < arr.length; i++) { tail.next = new ListNode(arr[i]); tail = tail.next; }");
  lines.push("  return head;");
  lines.push("}");
  lines.push("function __treeFromArray(arr) {");
  lines.push("  if (!arr || arr.length === 0 || arr[0] === null || arr[0] === undefined) return null;");
  lines.push("  const root = new TreeNode(arr[0]);");
  lines.push("  const queue = [root];");
  lines.push("  let i = 1;");
  lines.push("  while (i < arr.length) {");
  lines.push("    const node = queue.shift();");
  lines.push("    if (node !== null && node !== undefined) {");
  lines.push("      if (i < arr.length && arr[i] !== null && arr[i] !== undefined) { node.left = new TreeNode(arr[i]); queue.push(node.left); }");
  lines.push("      i += 1;");
  lines.push("      if (i < arr.length && arr[i] !== null && arr[i] !== undefined) { node.right = new TreeNode(arr[i]); queue.push(node.right); }");
  lines.push("      i += 1;");
  lines.push("    } else {");
  lines.push("      i += 2;");
  lines.push("    }");
  lines.push("  }");
  lines.push("  return root;");
  lines.push("}");
  // Clone-graph style: adjList[i] holds the neighbor values of node i+1
  // (1-indexed), so values map to nodes via index + 1. Build with the
  // student's own Node class when they defined one, else our GraphNode.
  lines.push("function __graphFromAdjList(arr) {");
  lines.push("  const GNode = typeof GraphNode !== \"undefined\" ? GraphNode : (typeof Node !== \"undefined\" ? Node : null);");
  lines.push("  if (!arr || arr.length === 0 || GNode === null) return null;");
  lines.push("  const nodes = arr.map((_, i) => new GNode(i + 1));");
  lines.push("  arr.forEach((neighbors, i) => { nodes[i].neighbors = neighbors.map((v) => nodes[v - 1]); });");
  lines.push("  return nodes[0];");
  lines.push("}");
  // Dispatches an array-valued param to the right structure builder:
  // arrays-of-arrays under a graph-y name become GraphNodes; arrays with null
  // under a node-y name become trees; otherwise a ListNode chain.
  lines.push("function __fromArray(arr, name) {");
  lines.push("  if (!Array.isArray(arr)) return arr;");
  lines.push("  if (/^(node|graph|adjList|adjacency|start|vertex|root)$/i.test(name) && arr.length && Array.isArray(arr[0])) return __graphFromAdjList(arr);");
  // p/q are tree params in LeetCode (Same Tree, LCA, …); root1/root2/subRoot
  // cover two-tree problems (Merge Two Binary Trees, Subtree of Another
  // Tree, …). node/curr/current become trees only when the level-order
  // contains a null. Everything else node-shaped (head/list/slow/fast/…) is
  // a ListNode chain.
  lines.push("  if (/^(root|root1|root2|subRoot|tree|tree1|tree2|p|q)$/i.test(name) || (arr.indexOf(null) !== -1 && /^(node|curr|current|cur)$/i.test(name))) return __treeFromArray(arr);");
  lines.push("  if (/^(head|list|l1|l2|tail|dummy|first|node|curr|current|cur|slow|fast)$/i.test(name)) return __listFromArray(arr);");
  lines.push("  return arr;");
  lines.push("}");

  const argExprs = entry.paramNames.map((paramName, index) => {
    const expr =
      shape.kind === "array"
        ? index === 0
          ? "input"
          : "undefined"
        : paramName !== null && shape.keys.includes(paramName)
          ? `input.${paramName}`
          : `input[__keys[${index}]]`;
    return convertExpr(paramName, expr);
  });

  if (shape.kind === "object") {
    lines.push("const __has = (k) => Object.prototype.hasOwnProperty.call(input, k);");
  }
  lines.push("const __keys = Object.keys(input);");
  lines.push(`const __args = [${argExprs.join(",\n  ")}];`);
  // Linked-list cycle setup: if input has a "pos" key and the method
  // doesn't already receive it as a parameter, connect the tail of the
  // first list-shaped argument back to the node at index pos.
  const hasPosParam = entry.paramNames.includes("pos");
  if (!hasPosParam) {
    lines.push("if ('pos' in input && __args.length > 0 && __args[0] && __args[0].constructor && __args[0].constructor.name === 'ListNode') {");
    lines.push("  let __tail = __args[0]; let __idx = 0; let __target = __args[0];");
    lines.push("  while (__target && __idx < input.pos) { __target = __target.next; __idx++; }");
    lines.push("  while (__tail.next) __tail = __tail.next;");
    lines.push("  if (input.pos === 0) __tail.next = __args[0];");
    lines.push("  else if (__target) __tail.next = __target;");
    lines.push("}");
  }
  const call =
    entry.kind === "class"
      ? `new ${entry.className}().${entry.methodName}(...__args)`
      : `${entry.functionName}(...__args)`;
  lines.push(`const __harnessResult = ${call};`);
  // LeetCode-style void methods (merge, rotate, setZeroes, flatten, solve, …)
  // mutate their first argument in place and return nothing — the judge checks
  // the mutated argument, so surface it as the result instead of `undefined`.
  lines.push("if (__harnessResult === undefined && __args.length > 0) return __args[0];");
  lines.push("return __harnessResult;");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Python entry detection (regex — Pyodide code arrives as plain text)
// ---------------------------------------------------------------------------

/** Splits a Python parameter list, dropping `self` and type annotations. */
function pythonParams(signature: string): ParamNames {
  return signature
    .split(",")
    .map((part) => part.trim().split(":")[0].trim())
    .filter((part) => part.length > 0 && part !== "self");
}

export type PythonEntry =
  | { kind: "class"; className: string; methodName: string; paramNames: ParamNames }
  | { kind: "function"; functionName: string; paramNames: ParamNames };

export function detectPythonEntry(code: string, inputText: string): PythonEntry | null {
  // Template-style code already reads `input` — never wrap it.
  if (/\binput\b/.test(code)) return null;

  const shape = inputShapeOf(inputText);
  const keys = shape.kind === "object" ? shape.keys : [];

  const classMatch = code.match(/^class\s+(\w+)\s*:/m);
  if (classMatch) {
    const className = classMatch[1];
    const classStart = classMatch.index ?? 0;
    const methods: JsCandidate[] = [];
    const defRe = /^(?: {4}|\t)def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*[^:]*)?\s*:/gm;
    let match: RegExpExecArray | null;
    while ((match = defRe.exec(code))) {
      if (match.index < classStart) continue;
      if (/^__/.test(match[1])) continue;
      const params = pythonParams(match[2]);
      methods.push({ name: match[1], paramNames: params });
    }
    const method = bestCandidate(methods, keys);
    if (method) {
      return {
        kind: "class",
        className,
        methodName: method.name,
        paramNames: method.paramNames,
      };
    }
  }

  const functions: JsCandidate[] = [];
  const fnRe = /^def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*[^:]*)?\s*:/gm;
  let match: RegExpExecArray | null;
  while ((match = fnRe.exec(code))) {
    if (/^_/.test(match[1])) continue;
    const params = pythonParams(match[2]);
    functions.push({ name: match[1], paramNames: params });
  }
  const fn = bestCandidate(functions, keys);
  if (fn) return { kind: "function", functionName: fn.name, paramNames: fn.paramNames };

  return null;
}

/**
 * The Python wrapper executed after the student code. Compiled as `<harness>`
 * so the sys.settrace tracer ignores it; the class definitions are guarded so
 * pasted LeetCode solutions that include them still work.
 */
export function buildPythonHarness(entry: PythonEntry, code: string, inputText: string): string {
  const shape = inputShapeOf(inputText);
  const lines: string[] = [];

  lines.push("# ── LeetCode-style entry harness (auto-detected) ──");
  if (!/\bclass\s+ListNode\b/.test(code) && !/\bdef\s+ListNode\b/.test(code)) {
    lines.push("if 'class ListNode' not in __student_code and 'def ListNode' not in __student_code:");
    lines.push("    class ListNode:");
    lines.push("        def __init__(self, val=0, next=None):");
    lines.push("            self.val = val");
    lines.push("            self.next = next");
  }
  if (!/\bclass\s+TreeNode\b/.test(code) && !/\bdef\s+TreeNode\b/.test(code)) {
    lines.push("if 'class TreeNode' not in __student_code and 'def TreeNode' not in __student_code:");
    lines.push("    class TreeNode:");
    lines.push("        def __init__(self, val=0, left=None, right=None):");
    lines.push("            self.val = val");
    lines.push("            self.left = left");
    lines.push("            self.right = right");
  }
  if (!/\bclass\s+(?:GraphNode|Node)\b/.test(code) && !/\bdef\s+(?:GraphNode|Node)\b/.test(code)) {
    lines.push("if 'class GraphNode' not in __student_code and 'class Node' not in __student_code:");
    lines.push("    class GraphNode:");
    lines.push("        def __init__(self, val=0, neighbors=None):");
    lines.push("            self.val = val");
    lines.push("            self.neighbors = neighbors if neighbors is not None else []");
  }
  lines.push("def __list_from_array(arr):");
  lines.push("    if not arr:");
  lines.push("        return None");
  lines.push("    head = ListNode(arr[0])");
  lines.push("    tail = head");
  lines.push("    for val in arr[1:]:");
  lines.push("        tail.next = ListNode(val)");
  lines.push("        tail = tail.next");
  lines.push("    return head");
  lines.push("");
  lines.push("def __tree_from_array(arr):");
  lines.push("    if not arr or arr[0] is None:");
  lines.push("        return None");
  lines.push("    root = TreeNode(arr[0])");
  lines.push("    queue = [root]");
  lines.push("    i = 1");
  lines.push("    while i < len(arr):");
  lines.push("        node = queue.pop(0) if queue else None");
  lines.push("        if node is not None:");
  lines.push("            if i < len(arr) and arr[i] is not None:");
  lines.push("                node.left = TreeNode(arr[i])");
  lines.push("                queue.append(node.left)");
  lines.push("            i += 1");
  lines.push("            if i < len(arr) and arr[i] is not None:");
  lines.push("                node.right = TreeNode(arr[i])");
  lines.push("                queue.append(node.right)");
  lines.push("            i += 1");
  lines.push("    return root");
  lines.push("");
  lines.push("def __graph_from_adj_list(arr):");
  lines.push("    if not arr:");
  lines.push("        return None");
  lines.push("    GNode = GraphNode if 'GraphNode' in dir() else Node");
  lines.push("    nodes = [GNode(i + 1) for i in range(len(arr))]");
  lines.push("    for i, neighbors in enumerate(arr):");
  lines.push("        nodes[i].neighbors = [nodes[v - 1] for v in neighbors]");
  lines.push("    return nodes[0]");
  lines.push("");
  lines.push("def __to_node(value, name):");
  lines.push("    if not isinstance(value, list):");
  lines.push("        return value");
  lines.push("    if name in ('node', 'graph', 'adjList', 'adjacency', 'start', 'vertex', 'root') and value and isinstance(value[0], list):");
  lines.push("        return __graph_from_adj_list(value)");
  lines.push("    # p/q are tree params in LeetCode (Same Tree, LCA, …).");
  lines.push("    if name in ('root', 'tree', 'p', 'q', 'subRoot', 'root1', 'root2') or (name.startswith('root') and None in value) or (name in ('node', 'curr', 'current') and None in value):");
  lines.push("        return __tree_from_array(value)");
  lines.push("    if name in ('head', 'list', 'l1', 'l2', 'tail', 'dummy', 'first', 'node', 'curr', 'current', 'slow', 'fast'):");
  lines.push("        return __list_from_array(value)");
  lines.push("    return value");
  lines.push("");
  lines.push("__keys = list(input.keys())");
  lines.push("def __arg(name, index):");
  lines.push("    if name in input:");
  lines.push("        return input[name]");
  lines.push("    if index < len(__keys):");
  lines.push("        return input[__keys[index]]");
  lines.push("    return None");
  lines.push("");
  const argExprs = entry.paramNames.map((paramName, index) => {
    const name = paramName ?? `__arg_${index}`;
    return `__to_node(__arg(${JSON.stringify(paramName)}, ${index}), ${JSON.stringify(name)})`;
  });
  lines.push(`__args = [${argExprs.join(", ")}]`);
  // Linked-list cycle setup: if input has a "pos" key and the method
  // doesn't already receive it as a parameter, connect the tail of the
  // first list-shaped argument back to the node at index pos.
  const pyHasPosParam = entry.paramNames.includes("pos");
  if (!pyHasPosParam) {
    lines.push("if 'pos' in input:");
    lines.push("    __pos = input['pos']");
    lines.push("    if isinstance(__pos, int) and __pos >= 0 and __args and hasattr(__args[0], 'next'):");
    lines.push("        __tail = __args[0]");
    lines.push("        __idx = 0");
    lines.push("        __target = __args[0]");
    lines.push("        while __target is not None and __idx < __pos:");
    lines.push("            __target = __target.next");
    lines.push("            __idx += 1");
    lines.push("        while __tail.next is not None:");
    lines.push("            __tail = __tail.next");
    lines.push("        if __pos == 0:");
    lines.push("            __tail.next = __args[0]");
    lines.push("        elif __target is not None:");
    lines.push("            __tail.next = __target");
    lines.push("");
  }
  const call =
    entry.kind === "class"
      ? `__result = ${entry.className}().${entry.methodName}(*__args)`
      : `__result = ${entry.functionName}(*__args)`;
  lines.push(call);
  // LeetCode-style void methods mutate their first argument in place; the
  // judge checks the mutated argument, so print that instead of None.
  lines.push("if __result is None and __args:");
  lines.push("    __result = __args[0]");
  lines.push("");
  lines.push("def __result_to_json(value):");
  lines.push("    if hasattr(value, 'val') and hasattr(value, 'neighbors'):");
  lines.push("        by_val = {}");
  lines.push("        seen = set()");
  lines.push("        queue = [value]");
  lines.push("        while queue:");
  lines.push("            node = queue.pop(0)");
  lines.push("            if node is None or id(node) in seen:");
  lines.push("                continue");
  lines.push("            seen.add(id(node))");
  lines.push("            by_val[node.val] = sorted(n.val for n in node.neighbors)");
  lines.push("            queue.extend(node.neighbors)");
  lines.push("        if not by_val:");
  lines.push("            return []");
  lines.push("        top = max(by_val)");
  lines.push("        return [by_val.get(v, []) for v in range(1, top + 1)]");
  lines.push("    if hasattr(value, 'val') and hasattr(value, 'next'):");
  lines.push("        out = []");
  lines.push("        seen = set()");
  lines.push("        node = value");
  lines.push("        while node is not None and id(node) not in seen:");
  lines.push("            seen.add(id(node))");
  lines.push("            out.append(node.val)");
  lines.push("            node = node.next");
  lines.push("        return out");
  lines.push("    if hasattr(value, 'val') and (hasattr(value, 'left') or hasattr(value, 'right')):");
  lines.push("        out = []");
  lines.push("        queue = [value]");
  lines.push("        while queue:");
  lines.push("            node = queue.pop(0)");
  lines.push("            if node is None:");
  lines.push("                out.append(None)");
  lines.push("                continue");
  lines.push("            out.append(node.val)");
  lines.push("            queue.append(getattr(node, 'left', None))");
  lines.push("            queue.append(getattr(node, 'right', None))");
  lines.push("        while out and out[-1] is None:");
  lines.push("            out.pop()");
  lines.push("        return out");
  lines.push("    if isinstance(value, list):");
  lines.push("        return [__result_to_json(v) for v in value]");
  lines.push("    return value");
  lines.push("");
  lines.push("import json as __json");
  lines.push("print(__json.dumps(__result_to_json(__result)))");

  // `shape` is only used to keep parity with the JS builder (positional
  // mapping happens at runtime through __arg).
  void shape;
  return lines.join("\n");
}
