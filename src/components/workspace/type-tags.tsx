import type { ReactNode } from "react";
import {
  Ban,
  FileQuestion,
  GitBranch,
  Grid3x3,
  Hash,
  Layers,
  Link2,
  List,
  Map,
  Network,
  Rows3,
  SquareStack,
  Text,
  ToggleLeft,
  type LucideIcon,
} from "lucide-react";

export type DataType =
  | "list"
  | "dict"
  | "int"
  | "string"
  | "bool"
  | "set"
  | "graph"
  | "matrix"
  | "stack"
  | "queue"
  | "linked-list"
  | "tree"
  | "null"
  | "other";

// One color per data structure, tuned to read in both light and dark themes.
const TYPE_TAG_CLASS: Record<DataType, string> = {
  list: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
  dict: "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
  int: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30 dark:text-cyan-400",
  string: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  bool: "bg-purple-500/10 text-purple-700 border-purple-500/30 dark:text-purple-400",
  set: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  graph: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400",
  matrix: "bg-teal-500/10 text-teal-700 border-teal-500/30 dark:text-teal-400",
  stack: "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-400",
  queue: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-400",
  "linked-list": "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/30 dark:text-fuchsia-400",
  tree: "bg-lime-500/10 text-lime-700 border-lime-500/30 dark:text-lime-400",
  null: "bg-muted text-muted-foreground border-border",
  other: "bg-muted text-muted-foreground border-border",
};

const TYPE_LABEL: Record<DataType, string> = {
  list: "list",
  dict: "dict",
  int: "int",
  string: "string",
  bool: "bool",
  set: "set",
  graph: "graph",
  matrix: "matrix",
  stack: "stack",
  queue: "queue",
  "linked-list": "list",
  tree: "tree",
  null: "null",
  other: "any",
};

// Small pictogram per data structure, shown inside the tag before the label.
const TYPE_ICON: Record<DataType, LucideIcon> = {
  list: List,
  dict: Map,
  int: Hash,
  string: Text,
  bool: ToggleLeft,
  set: Layers,
  graph: Network,
  matrix: Grid3x3,
  stack: SquareStack,
  queue: Rows3,
  "linked-list": Link2,
  tree: GitBranch,
  null: Ban,
  other: FileQuestion,
};

export function detectType(value: unknown): DataType {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (
      value.length > 0 &&
      value.every(
        (item) => Array.isArray(item) || (item !== null && typeof item === "object"),
      )
    ) {
      return "matrix";
    }
    return "list";
  }
  switch (typeof value) {
    case "number":
      return "int";
    case "string":
      return "string";
    case "boolean":
      return "bool";
    case "object": {
      const entries = Object.values(value as Record<string, unknown>);
      if (entries.length > 0 && entries.every((item) => Array.isArray(item))) {
        return "graph";
      }
      return "dict";
    }
    default:
      return "other";
  }
}

export function TypeTag({ type }: { type: DataType }) {
  const Icon = TYPE_ICON[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${TYPE_TAG_CLASS[type]}`}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden />
      {TYPE_LABEL[type]}
    </span>
  );
}

/** Compact single-line value for the variables table (keeps rows tidy). */
export function formatVariableValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") {
    return value.length > 60 ? `"${value.slice(0, 57)}…"` : `"${value}"`;
  }
  if (typeof value === "object") {
    try {
      const text = JSON.stringify(value);
      if (text === undefined) return String(value);
      return text.length > 80 ? `${text.slice(0, 77)}…` : text;
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function VariableRowShell({
  name,
  type,
  value,
  changed,
  previousValue,
  highlighted,
  children,
}: {
  name: string;
  type: DataType;
  value: string;
  changed: boolean;
  previousValue?: unknown;
  highlighted?: boolean;
  children?: ReactNode;
}) {
  const tooltip = changed
    ? previousValue === undefined
      ? "new in this step"
      : `changed from ${formatVariableValue(previousValue)}`
    : undefined;

  return (
    <div
      className={`flex min-w-0 items-center gap-2 border-b border-border/60 px-2 py-1 text-[12px] leading-5 transition-colors ${
        highlighted ? "bg-teal-500/15 dark:bg-teal-500/20" : changed ? "bg-cyan-500/10 dark:bg-cyan-500/15" : ""
      }`}
    >
      <span className="w-[6.5rem] shrink-0 truncate font-mono text-foreground/90">{name}</span>
      <span className="w-20 shrink-0">
        <TypeTag type={type} />
      </span>
      <span
        className={`variable-value min-w-0 flex-1 truncate font-mono ${
          changed ? "variable-value-flash" : "text-foreground/80"
        }`}
        title={tooltip}
      >
        {value}
        {children}
      </span>
    </div>
  );
}
