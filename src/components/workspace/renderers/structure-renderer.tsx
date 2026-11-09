"use client";

import type { ReactNode } from "react";
import type { MatrixCellChange, TraceOperations } from "@/types/visualizer";
import {
  detectType,
  formatVariableValue,
  TypeTag,
  type DataType,
} from "@/components/workspace/type-tags";
import { ArrayRenderer } from "./array-renderer";
import { GraphRenderer } from "./graph-renderer";
import { MapRenderer } from "./map-renderer";
import { MatrixRenderer } from "./matrix-renderer";
import { LinkedListRenderer } from "./linked-list-renderer";
import { QueueRenderer, StackRenderer } from "./stack-queue-renderer";
import { SetRenderer } from "./set-renderer";
import { TreeRenderer } from "./tree-renderer";

/**
 * A variable row as the Variables panel understands it. `kind` is always set
 * from the trace step's own fields (step.array / step.hashMap / ...) — never
 * from the variable name — so `nums`, `arr`, `values` all render as arrays.
 */
export type VariableRow = {
  name: string;
  value: unknown;
  previousValue: unknown;
  changed: boolean;
  highlighted: boolean;
  kind?: "array" | "map" | "matrix" | "stack" | "queue" | "set" | "graph" | "linked-list" | "tree";
  /** Indices into an array the current pointers (i, j, left, ...) are on. */
  active?: number[];
  /** Pointer-name labels keyed by array index. */
  activeLabels?: Record<number, string[]>;
  activeCell?: { row: number; col: number };
  changedCells?: MatrixCellChange[];
  ops?: TraceOperations;
  previousOps?: TraceOperations;
};

const KIND_TAG: Partial<Record<NonNullable<VariableRow["kind"]>, DataType>> = {
  array: "list",
  map: "dict",
  matrix: "matrix",
  stack: "stack",
  queue: "queue",
  set: "set",
  graph: "graph",
  "linked-list": "linked-list",
  tree: "tree",
};

export function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Single row in the Variables panel. Primitives stay compact on one line;
 * structures get a header line (name + type tag + entry count) followed by
 * their specialized renderer below, indented.
 */
export function StructureRow({ row }: { row: VariableRow }) {
  const kind = row.kind;
  const tag: DataType = (kind && KIND_TAG[kind]) ?? detectType(row.value);
  const isStructure = !isPrimitive(row.value) || kind === "stack" || kind === "queue" || kind === "set";

  const tooltip = row.changed
    ? row.previousValue === undefined
      ? "new in this step"
      : `changed from ${formatVariableValue(row.previousValue)}`
    : undefined;

  if (!isStructure) {
    return (
      <div
        className={`flex min-w-0 items-center gap-2 border-b border-border/60 px-2 py-1 text-[12px] leading-5 transition-colors ${
          row.highlighted
            ? "bg-teal-500/15 dark:bg-teal-500/20"
            : row.changed
              ? "bg-cyan-500/10 dark:bg-cyan-500/15"
              : ""
        }`}
      >
        <span className="w-[6.5rem] shrink-0 truncate font-mono text-foreground/90">{row.name}</span>
        <span className="w-20 shrink-0">
          <TypeTag type={tag} />
        </span>
        <span
          className={`variable-value min-w-0 flex-1 truncate font-mono ${
            row.changed ? "variable-value-flash" : "text-foreground/80"
          }`}
          title={tooltip}
        >
          {formatVariableValue(row.value)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`border-b border-border/60 px-2 py-1.5 transition-colors ${
        row.highlighted ? "bg-teal-500/15 dark:bg-teal-500/20" : row.changed ? "bg-cyan-500/5 dark:bg-cyan-500/10" : ""
      }`}
    >
      <div className="mb-1 flex min-w-0 items-center gap-2 text-[12px] leading-5">
        <span className="w-[6.5rem] shrink-0 truncate font-mono text-foreground/90">{row.name}</span>
        <span className="w-20 shrink-0">
          <TypeTag type={tag} />
        </span>
        {rowCountBadge(row)}
      </div>
      <div className="pl-1">{renderStructure(row)}</div>
    </div>
  );
}

function rowCountBadge(row: VariableRow): ReactNode {
  if (row.kind === "linked-list") {
    const data = row.value as { lists: Record<string, { order: unknown[] }> };
    const count = Object.values(data.lists ?? {}).reduce((total, list) => total + list.order.length, 0);
    return (
      <span className="ml-1 shrink-0 rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
        {count} {count === 1 ? "node" : "nodes"}
      </span>
    );
  }
  if (row.kind === "tree") {
    const data = row.value as { values: Record<string, unknown> };
    const count = Object.keys(data.values ?? {}).length;
    return (
      <span className="ml-1 shrink-0 rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
        {count} {count === 1 ? "node" : "nodes"}
      </span>
    );
  }
  if (Array.isArray(row.value)) {
    return (
      <span className="ml-1 shrink-0 rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
        {row.value.length} {row.kind === "set" ? "values" : row.kind === "stack" || row.kind === "queue" ? "items" : "elements"}
      </span>
    );
  }
  if (row.value && typeof row.value === "object" && !Array.isArray(row.value)) {
    const count = Object.keys(row.value).length;
    if (count > 0) {
      return (
        <span className="ml-1 shrink-0 rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          {count} {count === 1 ? "entry" : "entries"}
        </span>
      );
    }
  }
  return null;
}

function renderStructure(row: VariableRow): ReactNode {
  switch (row.kind) {
    case "array":
      return <ArrayRenderer row={row} />;
    case "map":
      return <MapRenderer row={row} />;
    case "matrix":
      return <MatrixRenderer row={row} />;
    case "stack":
      return <StackRenderer row={row} />;
    case "queue":
      return <QueueRenderer row={row} />;
    case "set":
      return <SetRenderer row={row} />;
    case "graph":
      return <GraphRenderer row={row} />;
    case "linked-list":
      return <LinkedListRenderer row={row} />;
    case "tree":
      return <TreeRenderer row={row} />;
    default:
      // Shape fallback: detect from the value itself (e.g. a dict with no
      // step.hashMap slot because the step didn't focus on it).
      if (Array.isArray(row.value)) {
        if (row.value.length > 0 && Array.isArray(row.value[0])) {
          return <MatrixRenderer row={row} />;
        }
        return <ArrayRenderer row={row} />;
      }
      if (row.value && typeof row.value === "object" && !Array.isArray(row.value)) {
        return <MapRenderer row={row} />;
      }
      return <span className="font-mono text-[11px] text-foreground/70">{formatVariableValue(row.value)}</span>;
  }
}
