import { parse, parseExpressionAt } from "acorn";

import {
  addPatternNames,
  CHILD_KEYS,
  formatLabel,
  isBareControlBody,
  isInsideBareControlBody,
  isInsideInstrumentedCondition,
  type WalkState,
  walkWithScope,
} from "./ast";
import { parseLineDirectives, stripTypeScript } from "./typescript";

export type InstrumentOptions = {
  /** Set when the source is TypeScript — type annotations are stripped before parsing. */
  typescript?: boolean;
  /**
   * The input JSON text (used by `instrumentForTrace` to detect pasted
   * LeetCode/GFG entries and map their parameters). Not consumed by
   * `instrument` itself.
   */
  inputText?: string;
};

export type InstrumentResult = {
  /** The instrumented JavaScript, ready to run inside the trace worker. */
  code: string;
  /**
   * Maps line numbers of the input code to the user's original source, parsed
   * from `//# line: N` directives that the AI translation emits. Empty when the
   * input carried no directives (plain JS, or a translation without mapping).
   */
  lineMap: Map<number, number>;
};

/**
 * Rewrites user code so every state change is captured: statements get a
 * `__autoCapture` call after them, branches get `__autoBranch`, functions get
 * `__autoEnter`/`__autoReturn`, and double-indexed matrix accesses get
 * `__autoAccess`/`__autoRecord` so exact cells are traced.
 *
 * Line numbers come from the AST, so multi-line statements and one-liners are
 * reported correctly. When the source carries `//# line: N` directives (AI
 * translations), steps point back at the user's original lines.
 */
export function instrument(source: string, options: InstrumentOptions = {}): InstrumentResult {
  const code = source.replace(/\r\n/g, "\n");
  const lineMap = parseLineDirectives(code);
  const input = options.typescript ? stripTypeScript(code) : code;

  let ast: unknown;
  try {
    ast = parse(input, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowReturnOutsideFunction: true,
      allowHashBang: true,
      locations: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      options.typescript
        ? `Couldn't parse the TypeScript as JavaScript (check for unsupported type syntax): ${message}`
        : `Couldn't parse the code: ${message}`,
    );
  }

  const originalLine = (line: number) => lineMap.get(line) ?? line;
  const state: WalkState = { scopes: [] };

  const insertions: Array<{ pos: number; text: string }> = [];
  const replacements: Array<{ start: number; end: number; text: string }> = [];

  // Spans fully rewritten by "wrapper" edits (matrix write assignments, return
  // statements). Nested edits inside them (matrix reads on the RHS, ternaries
  // in a returned expression) must be skipped: applying overlapping edits
  // against the original coordinates corrupts the output. The wrapper text
  // already carries the untouched original source, so skipping is lossless.
  const claimedSpans: Array<{ start: number; end: number }> = [];
  const claimSpan = (start: number, end: number) => claimedSpans.push({ start, end });
  const isInsideClaimedSpan = (node: { start: number; end: number }) =>
    claimedSpans.some((span) => node.start >= span.start && node.end <= span.end);

  const scopeNames = () => {
    const names = new Set<string>();
    for (const scope of state.scopes) {
      for (const name of scope) names.add(name);
    }
    return Array.from(names);
  };

  const valuesText = (names: string[]) =>
    names.map((name) => `${JSON.stringify(name)}: ${name}`).join(", ");

  const captureText = (node: { loc: { start: { line: number } }; start: number; end: number }) => {
    const line = originalLine(node.loc.start.line);
    const values = valuesText(scopeNames());
    const label = formatLabel(input.slice(node.start, node.end));
    return `__autoCapture(${line}, {${values}}, ${JSON.stringify(label)});`;
  };

  const captureAfter = (node: any, ancestors: unknown[]) => {
    const text = captureText(node);
    if (isBareControlBody(node, ancestors)) {
      // `if (c) stmt; else ...` — a capture inserted after the bare statement
      // would detach the `else`, so wrap the statement in a block instead.
      // Use insertions (not a full replacement) so that edits inside the
      // statement — e.g. __autoAccess rewrites of matrix cells — survive.
      insertions.push({ pos: node.start, text: `{\n${text}\n` });
      insertions.push({ pos: node.end, text: `\n}` });
    } else {
      insertions.push({ pos: node.end, text: `\n${text}` });
    }
  };

  // Names declared by a `for` header init (`let i = 0`, `let i = 0, j = n - 1`,
  // destructuring). The branch for a `for` loop is instrumented when the
  // ForStatement node is visited — before its init child is walked — so these
  // wouldn't be in the scope yet; the generated branch runs after the init at
  // runtime, so they're always readable there.
  const loopHeaderNames = (init: unknown) => {
    if (!init || (init as { type?: string }).type !== "VariableDeclaration") return [] as string[];
    const names = new Set<string>();
    for (const declaration of (init as { declarations?: unknown[] }).declarations ?? []) {
      addPatternNames((declaration as { id?: unknown }).id, names);
    }
    return Array.from(names);
  };

  // `var` names declared inside a loop body. Unlike let/const (block-scoped,
  // in the temporal dead zone at the first branch), `var` hoists to the
  // loop's enclosing function/module scope — so from the second iteration on
  // these names are genuinely in scope when the branch re-evaluates, yet the
  // compile-time scope snapshot taken at the loop node misses them. Descends
  // through nested blocks (if/for bodies) but stops at nested functions and
  // class bodies, whose vars belong to those inner scopes, not the loop's.
  const bodyVarNames = (root: unknown) => {
    const names = new Set<string>();
    const walk = (node: any) => {
      if (!node || typeof node.type !== "string") return;
      if (
        node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression" ||
        node.type === "ClassDeclaration" ||
        node.type === "ClassExpression"
      ) {
        return;
      }
      if (node.type === "VariableDeclaration" && node.kind === "var") {
        for (const declaration of node.declarations ?? []) addPatternNames(declaration.id, names);
      }
      for (const key of CHILD_KEYS[node.type] ?? []) {
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) walk(item);
        } else if (child && typeof child.type === "string") {
          walk(child);
        }
      }
    };
    walk(root);
    return Array.from(names);
  };

  const instrumentBranch = (
    node: { loc: { start: { line: number } } },
    test: { loc: { start: { line: number } }; start: number; end: number },
    kind: "if" | "while" | "do-while" | "for" | "ternary",
    extraNames: string[] = [],
    excludeNames: string[] = [],
  ) => {
    const line = originalLine(test.loc.start.line);
    const conditionSource = input.slice(test.start, test.end);
    // The condition is replaced wholesale below, so nested member-read edits
    // can't be applied separately — wrap them into the source text instead so
    // typos inside branch conditions (i < arr.lengthhhh) still error.
    const conditionChecked = wrapMemberReads(conditionSource);
    const excluded = new Set(excludeNames);
    const values = valuesText(
      [...scopeNames(), ...extraNames].filter((name) => !excluded.has(name)),
    );
    const label = `${kind} ${formatLabel(conditionSource)}`;
    // Conditions like `if (grid[r][c] === "1")` read a matrix cell — prepend a
    // side-effect-only recording call so the traced cell is captured without
    // touching evaluation order (short-circuiting stays intact).
    const accessInfo = findMatrixAccess(test);
    const recordPrefix = accessInfo
      ? `__autoRecord(${JSON.stringify(accessInfo.base.name)}, ${accessInfo.base.name}, ${input.slice(accessInfo.object.property.start, accessInfo.object.property.end)}, ${input.slice(accessInfo.outer.property.start, accessInfo.outer.property.end)}, ${JSON.stringify(input.slice(accessInfo.outer.start, accessInfo.outer.end))}), `
      : "";
    replacements.push({
      start: test.start,
      end: test.end,
      text: `__autoBranch(${line}, ${JSON.stringify(label)}, (${recordPrefix}${conditionChecked}), {${values}})`,
    });
  };

  const instrumentFunction = (
    node: { loc: { start: { line: number } }; body: { type: string; start: number } | null; params: unknown[] },
    name: string,
  ) => {
    const body = node.body;
    if (!body || body.type !== "BlockStatement") return;
    const line = originalLine(node.loc.start.line);
    const paramNames = new Set<string>();
    for (const param of node.params) addPatternNames(param, paramNames);
    const paramValues = valuesText(Array.from(paramNames));
    insertions.push({
      pos: body.start + 1,
      text: `\n__autoEnter(${line}, ${JSON.stringify(name)}, {${paramValues}});`,
    });
  };

  const instrumentReturn = (node: any, ancestors: unknown[]) => {
    const line = originalLine(node.loc.start.line);
    const values = valuesText(scopeNames());
    const label = formatLabel(input.slice(node.start, node.end));
    // Rewrite `return <expr>;` into `return __autoReturn(…, <expr>);` so the
    // worker records the actual computed value on the Return step (for the call
    // tree) while the program keeps returning it unchanged. Because the result
    // is a single statement, replacing is safe inside bare control bodies too
    // (`if (x) return y;` → `if (x) return __autoReturn(…);` — no block needed).
    const argument = node.argument;
    const valueArg = argument ? `, ${wrapMemberReads(input.slice(argument.start, argument.end))}` : "";
    // The replacement covers the whole return, so any nested instrumentation
    // (ternaries, matrix reads) inside the argument is skipped via the claim.
    claimSpan(node.start, node.end);
    replacements.push({
      start: node.start,
      end: node.end,
      text: `return __autoReturn(${line}, {${values}}, ${JSON.stringify(label)}${valueArg});`,
    });
  };

  const functionName = (node: { id?: { name: string } | null }, ancestors: unknown[]) => {
    if (node.id) return node.id.name;
    const parent = ancestors[ancestors.length - 1] as { type?: string; id?: { type?: string; name?: string } } | undefined;
    if (parent?.type === "VariableDeclarator" && parent.id?.type === "Identifier") return parent.id.name;
    return null;
  };

  // ---- Missing-property typo checks --------------------------------------
  // JavaScript reads of a missing property silently return undefined
  // (arr.lengthhhh → undefined), so typos look like "no error". Eligible
  // member reads (obj.prop / obj["prop"]) are rewritten into __autoProp(...)
  // calls: the worker checks the property against the object's shape and
  // throws a TypeError with a "did you mean" hint when the read is clearly a
  // typo. Writes (obj.prop = x), updates, deletes, optional chaining, and
  // this/super reads are never wrapped — they're either intentional or can't
  // be statically checked.

  // The __autoProp(...) replacement text for a member read, or null when the
  // node isn't a checkable read. The object expression is re-evaluated as the
  // first argument (exactly once, same as the original read); `sourceText` is
  // the string the node's coordinates refer to (the whole program or a
  // fragment).
  const propCheckText = (node: any, sourceText: string): string | null => {
    if (!node || node.type !== "MemberExpression" || node.optional) return null;
    let key: string;
    if (node.computed) {
      if (node.property?.type !== "Literal" || typeof node.property.value !== "string") return null;
      key = JSON.stringify(node.property.value);
    } else {
      if (node.property?.type !== "Identifier") return null;
      key = JSON.stringify(node.property.name);
    }
    const object = node.object;
    if (!object || object.type === "ThisExpression" || object.type === "Super") return null;
    const objectSource = sourceText.slice(object.start, object.end);
    const label = objectSource.length > 48 ? objectSource.slice(0, 45) + "..." : objectSource;
    return `__autoProp(${objectSource}, ${key}, ${JSON.stringify(label)})`;
  };

  // A member that must not be wrapped: assignment/update/delete targets are
  // writes or probes, and call/construct/tagged-template callees would lose
  // their `this` binding if re-evaluated through a helper (obj.m() →
  // helper(obj, "m")(...)). Missing-member calls already throw naturally
  // ("obj.m is not a function"), so skipping them loses no error signal.
  const isPropUnwrappable = (node: any, ancestors: unknown[]) => {
    const parent = ancestors[ancestors.length - 1] as
      | { type: string; left?: unknown; argument?: unknown; operator?: string; callee?: unknown; tag?: unknown }
      | undefined;
    if (!parent) return false;
    if (parent.type === "AssignmentExpression" && parent.left === node) return true;
    if (parent.type === "UpdateExpression" && parent.argument === node) return true;
    if (parent.type === "UnaryExpression" && parent.operator === "delete" && parent.argument === node) return true;
    if (
      (parent.type === "CallExpression" || parent.type === "NewExpression") &&
      parent.callee === node
    ) {
      return true;
    }
    if (parent.type === "TaggedTemplateExpression" && parent.tag === node) return true;
    return false;
  };

  // True when the member sits inside a ternary test — that whole span is
  // replaced by instrumentBranch, so a nested edit here would corrupt the
  // output (the fragment is wrapped via wrapMemberReads instead).
  const isInsideTernaryTest = (node: any, ancestors: unknown[]) => {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const candidate = ancestors[i] as { type?: string; test?: { start: number; end: number } } | undefined;
      if (!candidate || typeof candidate.type !== "string") continue;
      if (candidate.type === "ConditionalExpression" && candidate.test) {
        if (candidate.test.start <= node.start && candidate.test.end >= node.end) return true;
      }
    }
    return false;
  };

  // Rewrite eligible member reads inside an expression fragment (branch
  // conditions, return arguments) into __autoProp calls. Applied to the raw
  // source text of spans that are otherwise replaced wholesale, so the typo
  // check still fires inside them. Outermost reads of a chain are wrapped and
  // inner ones skipped (the outer call re-evaluates the object expression).
  const wrapMemberReads = (source: string): string => {
    let fragment: any;
    try {
      fragment = parseExpressionAt(source, 0, { ecmaVersion: "latest" });
    } catch {
      return source;
    }
    const edits: Array<{ start: number; end: number; text: string }> = [];
    const claimed: Array<{ start: number; end: number }> = [];
    const walkFragment = (node: any, ancestors: unknown[]) => {
      if (!node || typeof node.type !== "string") return;
      if (node.type === "MemberExpression") {
        const text = propCheckText(node, source);
        const insideClaimed = claimed.some((span) => node.start >= span.start && node.end <= span.end);
        if (text && !insideClaimed && !isPropUnwrappable(node, ancestors)) {
          edits.push({ start: node.start, end: node.end, text });
          claimed.push({ start: node.start, end: node.end });
        }
      }
      ancestors.push(node);
      for (const key of CHILD_KEYS[node.type] ?? []) {
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) walkFragment(item, ancestors);
        } else if (child && typeof child.type === "string") {
          walkFragment(child, ancestors);
        }
      }
      ancestors.pop();
    };
    walkFragment(fragment, []);
    if (!edits.length) return source;
    let result = source;
    for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
      result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
    }
    return result;
  };

  // Matches a double-indexed member access `base[a][b]` (both computed, base an
  // identifier) — the shape the worker traces as a matrix cell access.
  const matrixAccessInfo = (node: any): { base: any; object: any; outer: any } | null => {
    if (!node || node.type !== "MemberExpression" || !node.computed || node.optional) return null;
    const object = node.object;
    if (!object || object.type !== "MemberExpression" || !object.computed || object.optional) return null;
    const base = object.object;
    if (!base || base.type !== "Identifier") return null;
    return { base, object, outer: node };
  };

  // Depth-first search for the first `base[a][b]` access inside a condition.
  const findMatrixAccess = (node: any): { base: any; object: any; outer: any } | null => {
    const direct = matrixAccessInfo(node);
    if (direct) return direct;
    const keys = CHILD_KEYS[node?.type] ?? [];
    for (const key of keys) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          const found = findMatrixAccess(item);
          if (found) return found;
        }
      } else if (child && typeof child.type === "string") {
        const found = findMatrixAccess(child);
        if (found) return found;
      }
    }
    return null;
  };

  // Rewrite `base[a][b]` reads/writes into `__autoAccess(...)` calls so the
  // worker can record the exact cell being accessed — precise active cells for
  // boundary-variable traversals (spiral, etc.) where loop-variable inference
  // can't tell row from column, plus the access source/kind for phase notes.
  // Reads become `__autoAccess(...)`; assignment and update targets keep their
  // original semantics via a sequence expression that records the indices first.
  const instrumentMatrixAccess = (node: any, ancestors: unknown[]) => {
    const info = matrixAccessInfo(node);
    if (!info) return;
    const { base, object, outer } = info;

    // These rewrites would land inside (and be discarded by) the
    // branch-condition replacement, so skip it there (the branch instrumenter
    // handles conditions via __autoRecord instead). Bare control bodies are
    // fine — their block wrappers are insertions now, so inner edits survive.
    if (isInsideInstrumentedCondition(node, ancestors)) return;

    const source = JSON.stringify(input.slice(outer.start, outer.end));
    const accessText = (kind: "read" | "write") =>
      `__autoAccess(${JSON.stringify(base.name)}, ${base.name}, ${input.slice(object.property.start, object.property.end)}, ${input.slice(outer.property.start, outer.property.end)}, ${source}, ${JSON.stringify(kind)})`;
    const parent = ancestors[ancestors.length - 1] as
      | { type: string; start: number; end: number; left?: unknown; argument?: unknown }
      | undefined;

    if (parent && parent.type === "AssignmentExpression" && parent.left === node) {
      // The rewrite covers the whole assignment, so nested reads on the right
      // hand side are skipped via the claim (their edits would overlap and
      // corrupt the output; the wrapper keeps the original source intact).
      claimSpan(parent.start, parent.end);
      replacements.push({
        start: parent.start,
        end: parent.end,
        text: `(${accessText("write")}, ${input.slice(parent.start, parent.end)})`,
      });
      return;
    }
    if (parent && parent.type === "UpdateExpression" && parent.argument === node) {
      claimSpan(parent.start, parent.end);
      replacements.push({
        start: parent.start,
        end: parent.end,
        text: `(${accessText("write")}, ${input.slice(parent.start, parent.end)})`,
      });
      return;
    }

    if (isInsideClaimedSpan(node)) return;
    replacements.push({ start: node.start, end: node.end, text: accessText("read") });
  };

  walkWithScope(ast, {
    VariableDeclaration(node: any, ancestors: unknown[]) {
      const scope = state.scopes[state.scopes.length - 1];
      for (const declaration of node.declarations ?? []) addPatternNames(declaration.id, scope);

      const parent = ancestors[ancestors.length - 1] as { type?: string } | undefined;
      const isLoopHeader =
        parent?.type === "ForStatement" || parent?.type === "ForInStatement" || parent?.type === "ForOfStatement";
      if (!isLoopHeader) captureAfter(node, ancestors);
    },
    ExpressionStatement(node: any, ancestors: unknown[]) {
      captureAfter(node, ancestors);
    },
    ReturnStatement(node: any, ancestors: unknown[]) {
      instrumentReturn(node, ancestors);
    },
    IfStatement(node: any) {
      instrumentBranch(node, node.test, "if");
    },
    WhileStatement(node: any) {
      instrumentBranch(node, node.test, "while", bodyVarNames(node.body));
    },
    DoWhileStatement(node: any) {
      instrumentBranch(node, node.test, "do-while", bodyVarNames(node.body));
    },
    ForStatement(node: any) {
      if (node.test) {
        instrumentBranch(node, node.test, "for", [
          ...loopHeaderNames(node.init),
          ...bodyVarNames(node.body),
        ]);
      }
    },
    ConditionalExpression(node: any, ancestors: unknown[]) {
      if (isInsideInstrumentedCondition(node, ancestors)) return;
      if (isInsideClaimedSpan(node)) return;
      // A ternary inside `const x = cond ? a : b` evaluates while `x` is still
      // in the temporal dead zone — capturing it would throw. Exclude the
      // names declared by the nearest enclosing declarator (the initializer
      // this ternary lives in) from the branch's captured values.
      const excluded = new Set<string>();
      for (let i = ancestors.length - 1; i >= 0; i--) {
        const candidate = ancestors[i] as { type?: string; id?: unknown } | undefined;
        if (candidate?.type === "VariableDeclarator" && candidate.id) {
          addPatternNames(candidate.id, excluded);
          break;
        }
      }
      instrumentBranch(node, node.test, "ternary", [], Array.from(excluded));
    },
    MemberExpression(node: any, ancestors: unknown[]) {
      instrumentMatrixAccess(node, ancestors);
      // Matrix accesses are already rewritten above (and would double-wrap);
      // branch/ternary tests are wrapped via their wholesale replacements and
      // claimed spans via the outer member's rewrite.
      if (matrixAccessInfo(node)) return;
      if (isInsideInstrumentedCondition(node, ancestors) || isInsideTernaryTest(node, ancestors)) return;
      if (isInsideClaimedSpan(node)) return;
      const text = propCheckText(node, input);
      if (!text || isPropUnwrappable(node, ancestors)) return;
      // The replacement re-evaluates the object expression, so skip nested
      // member reads inside it (they'd overlap the edit coordinates).
      claimSpan(node.start, node.end);
      replacements.push({ start: node.start, end: node.end, text });
    },
    FunctionDeclaration(node: any, ancestors: unknown[]) {
      const name = functionName(node, ancestors);
      if (name) instrumentFunction(node, name);
    },
    FunctionExpression(node: any, ancestors: unknown[]) {
      const name = functionName(node, ancestors);
      if (name) instrumentFunction(node, name);
    },
    ArrowFunctionExpression(node: any, ancestors: unknown[]) {
      const name = functionName(node, ancestors);
      if (name) instrumentFunction(node, name);
    },
    // LeetCode-style class methods (`class Solution { twoSum(nums, target) … }`)
    // are MethodDefinitions whose value is a FunctionExpression — instrument
    // them like any function so recursion gets Call/Return steps and the call
    // stack fills in. `this` stays intact because __autoEnter runs inside the
    // method body.
    MethodDefinition(node: any) {
      if (node.kind === "constructor" || node.computed || node.key?.type === "PrivateIdentifier") return;
      const name = node.key?.type === "Identifier" ? node.key.name : undefined;
      if (!name || node.value?.type !== "FunctionExpression") return;
      instrumentFunction(node.value, name);
    },
  }, state);

  const edits: Array<{ pos: number; text: string; replace?: { start: number; end: number } }> = [
    ...replacements.map((replacement) => ({
      pos: replacement.start,
      text: replacement.text,
      replace: { start: replacement.start, end: replacement.end } as const,
    })),
    ...insertions.map((insertion) => ({ pos: insertion.pos, text: insertion.text })),
  ].sort((a, b) => b.pos - a.pos);

  let result = input;
  for (const edit of edits) {
    if (edit.replace) {
      result = result.slice(0, edit.replace.start) + edit.text + result.slice(edit.replace.end);
    } else {
      result = result.slice(0, edit.pos) + edit.text + result.slice(edit.pos);
    }
  }

  return {
    code: `__autoCapture(1, {}, "Start");\n` + result,
    lineMap,
  };
}

