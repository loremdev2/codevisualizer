// ---------------------------------------------------------------------------
// AST walking with lexical scoping
//
// A small custom walker (instead of acorn-walk) so the instrumenter can track
// scopes while visiting and use ancestor chains for bare-body / condition
// detection. Only used by the instrumenter.
// ---------------------------------------------------------------------------

export const CHILD_KEYS: Record<string, string[]> = {
  Program: ["body"],
  ExpressionStatement: ["expression"],
  BlockStatement: ["body"],
  EmptyStatement: [],
  DebuggerStatement: [],
  WithStatement: ["object", "body"],
  ReturnStatement: ["argument"],
  LabeledStatement: ["body"],
  BreakStatement: ["label"],
  ContinueStatement: ["label"],
  IfStatement: ["test", "consequent", "alternate"],
  SwitchStatement: ["discriminant", "cases"],
  SwitchCase: ["test", "consequent"],
  ThrowStatement: ["argument"],
  TryStatement: ["block", "handler", "finalizer"],
  CatchClause: ["param", "body"],
  WhileStatement: ["test", "body"],
  DoWhileStatement: ["body", "test"],
  ForStatement: ["init", "test", "update", "body"],
  ForInStatement: ["left", "right", "body"],
  ForOfStatement: ["left", "right", "body"],
  FunctionDeclaration: ["id", "params", "body"],
  FunctionExpression: ["id", "params", "body"],
  ArrowFunctionExpression: ["params", "body"],
  VariableDeclaration: ["declarations"],
  VariableDeclarator: ["id", "init"],
  ThisExpression: [],
  Super: [],
  ArrayExpression: ["elements"],
  ObjectExpression: ["properties"],
  Property: ["key", "value"],
  PropertyDefinition: ["key", "value"],
  RestElement: ["argument"],
  SpreadElement: ["argument"],
  SequenceExpression: ["expressions"],
  UnaryExpression: ["argument"],
  BinaryExpression: ["left", "right"],
  AssignmentExpression: ["left", "right"],
  UpdateExpression: ["argument"],
  LogicalExpression: ["left", "right"],
  ConditionalExpression: ["test", "consequent", "alternate"],
  NewExpression: ["callee", "arguments"],
  CallExpression: ["callee", "arguments"],
  MemberExpression: ["object", "property"],
  Identifier: [],
  PrivateIdentifier: [],
  Literal: [],
  TemplateLiteral: ["quasis", "expressions"],
  TaggedTemplateExpression: ["tag", "quasi"],
  TemplateElement: [],
  ClassDeclaration: ["id", "superClass", "body"],
  ClassExpression: ["id", "superClass", "body"],
  ClassBody: ["body"],
  MethodDefinition: ["key", "value"],
  MetaProperty: ["meta", "property"],
  AwaitExpression: ["argument"],
  YieldExpression: ["argument"],
  AssignmentPattern: ["left", "right"],
  ArrayPattern: ["elements"],
  ObjectPattern: ["properties"],
  ChainExpression: ["expression"],
  ImportExpression: ["source"],
  ImportDeclaration: ["specifiers", "source"],
  ImportSpecifier: ["imported", "local"],
  ImportDefaultSpecifier: ["local"],
  ImportNamespaceSpecifier: ["local"],
  ExportNamedDeclaration: ["declaration", "specifiers", "source"],
  ExportSpecifier: ["local", "exported"],
  ExportDefaultDeclaration: ["declaration"],
  ExportAllDeclaration: ["source"],
};

export const SCOPE_ENTER: Record<string, (node: any, state: { scopes: Set<string>[] }) => void> = {
  Program: (_node, state) => state.scopes.push(new Set()),
  BlockStatement: (_node, state) => state.scopes.push(new Set()),
  CatchClause: (node, state) => {
    state.scopes.push(new Set());
    if (node.param) addPatternNames(node.param, state.scopes[state.scopes.length - 1]);
  },
  FunctionDeclaration: (node, state) => {
    state.scopes.push(new Set());
    addPatternNames(node.id, state.scopes[state.scopes.length - 1]);
    for (const param of node.params ?? []) addPatternNames(param, state.scopes[state.scopes.length - 1]);
  },
  FunctionExpression: (node, state) => {
    state.scopes.push(new Set());
    if (node.id) addPatternNames(node.id, state.scopes[state.scopes.length - 1]);
    for (const param of node.params ?? []) addPatternNames(param, state.scopes[state.scopes.length - 1]);
  },
  ArrowFunctionExpression: (node, state) => {
    state.scopes.push(new Set());
    for (const param of node.params ?? []) addPatternNames(param, state.scopes[state.scopes.length - 1]);
  },
  ForStatement: (_node, state) => state.scopes.push(new Set()),
  ForInStatement: (_node, state) => state.scopes.push(new Set()),
  ForOfStatement: (_node, state) => state.scopes.push(new Set()),
};

export const SCOPE_LEAVE: Record<string, (state: { scopes: Set<string>[] }) => void> = {
  Program: (state) => state.scopes.pop(),
  BlockStatement: (state) => state.scopes.pop(),
  CatchClause: (state) => state.scopes.pop(),
  FunctionDeclaration: (state) => state.scopes.pop(),
  FunctionExpression: (state) => state.scopes.pop(),
  ArrowFunctionExpression: (state) => state.scopes.pop(),
  ForStatement: (state) => state.scopes.pop(),
  ForInStatement: (state) => state.scopes.pop(),
  ForOfStatement: (state) => state.scopes.pop(),
};

export type WalkState = { scopes: Set<string>[] };
export type Visitors = Record<string, (node: any, ancestors: unknown[]) => void>;

export function walkWithScope(ast: unknown, visitors: Visitors, state: WalkState) {
  const ancestors: unknown[] = [];

  const visit = (node: any) => {
    if (!node || typeof node.type !== "string") return;

    if (SCOPE_ENTER[node.type]) SCOPE_ENTER[node.type](node, state);
    const visitor = visitors[node.type];
    if (visitor) visitor(node, ancestors);

    ancestors.push(node);
    const keys = CHILD_KEYS[node.type];
    if (keys) {
      for (const key of keys) {
        const child = node[key];
        if (Array.isArray(child)) {
          for (const item of child) visit(item);
        } else if (child && typeof child.type === "string") {
          visit(child);
        }
      }
    }
    ancestors.pop();

    if (SCOPE_LEAVE[node.type]) SCOPE_LEAVE[node.type](state);
  };

  visit(ast);
}

export function addPatternNames(pattern: any, names: Set<string>) {
  if (!pattern) return;
  switch (pattern.type) {
    case "Identifier":
      names.add(pattern.name);
      break;
    case "ArrayPattern":
      for (const element of pattern.elements ?? []) addPatternNames(element, names);
      break;
    case "ObjectPattern":
      for (const property of pattern.properties ?? []) {
        if (property.type === "RestElement") addPatternNames(property.argument, names);
        else addPatternNames(property.value, names);
      }
      break;
    case "RestElement":
      addPatternNames(pattern.argument, names);
      break;
    case "AssignmentPattern":
      addPatternNames(pattern.left, names);
      break;
    default:
      break;
  }
}

/** True when `node` is the un-braced body/consequent of a control-flow statement. */
export function isBareControlBody(node: unknown, ancestors: unknown[]) {
  const parent = ancestors[ancestors.length - 1] as
    | { type?: string; consequent?: unknown; alternate?: unknown; body?: unknown }
    | undefined;
  if (!parent) return false;

  if (parent.type === "IfStatement") return parent.consequent === node || parent.alternate === node;
  if (
    parent.type === "WhileStatement" ||
    parent.type === "DoWhileStatement" ||
    parent.type === "ForStatement" ||
    parent.type === "ForInStatement" ||
    parent.type === "ForOfStatement" ||
    parent.type === "LabeledStatement" ||
    parent.type === "WithStatement"
  ) {
    return parent.body === node;
  }
  return false;
}

export function isInsideBareControlBody(node: unknown, ancestors: unknown[]) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const candidate = ancestors[i] as { type?: string };
    if (candidate.type === "ExpressionStatement" || candidate.type === "ReturnStatement") {
      return isBareControlBody(candidate, ancestors.slice(0, i));
    }
  }
  return false;
}

export function isInsideInstrumentedCondition(node: { start: number; end: number }, ancestors: unknown[]) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const candidate = ancestors[i] as { type?: string; test?: { start: number; end: number } };
    const isConditional =
      candidate.type === "IfStatement" ||
      candidate.type === "WhileStatement" ||
      candidate.type === "DoWhileStatement" ||
      candidate.type === "ForStatement";
    if (isConditional && candidate.test) {
      if (candidate.test.start <= node.start && candidate.test.end >= node.end) return true;
    }
  }
  return false;
}

export function formatLabel(text: string) {
  const compact = text.replace(/\s+/g, " ").replace(/;$/, "");
  return compact.length > 74 ? compact.slice(0, 71) + "..." : compact;
}
