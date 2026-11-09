"use client";

import { useMemo } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { VisualStep } from "@/types/visualizer";
import {
  StructureRow,
  type VariableRow,
} from "@/components/workspace/renderers/structure-renderer";
import {
  handlePanelWheel,
  PanelZoomControls,
  usePanelZoom,
} from "@/components/workspace/panel-zoom";

type VariablesPanelProps = {
  step?: VisualStep;
  previousStep?: VisualStep;
  result?: unknown;
  isLastStep: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

function serialize(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const changedIn = (name: string, current: unknown, previous: unknown) =>
  serialize(current) !== serialize(previous);

function buildRows(step: VisualStep | undefined, previousStep: VisualStep | undefined): VariableRow[] {
  if (!step) return [];

  const rows: VariableRow[] = [];
  const previousPointers = previousStep?.pointers ?? {};
  const previousOps = previousStep?.ops;
  const usedNames = new Set<string>();

  // Named primitives captured by the tracer (loop vars, scalars, etc.).
  for (const [name, value] of Object.entries(step.pointers ?? {})) {
    const previous = previousPointers[name];
    rows.push({
      name,
      value,
      previousValue: previous,
      changed: changedIn(name, value, previous),
      highlighted: false,
    });
  }

  // Structures the step renders, with their source variable names. `kind` is
  // set from the trace field (step.array / step.hashMap / ...), never from the
  // variable name — so `nums`, `arr`, `values` all render as arrays.
  const pointerNames = new Set(Object.keys(step.pointers ?? {}));
  const markUsed = (name: string | undefined, fallback: string) => {
    usedNames.add(name && name !== fallback ? name : fallback);
  };

  const arrayRow = pushStructure(rows, {
    name: step.arrayName ?? "array",
    value: step.array,
    prev: previousStep?.array,
    kind: "array",
    skipIf: pointerNames.has(step.arrayName ?? ""),
  });
  if (arrayRow) {
    arrayRow.active = step.active;
    arrayRow.activeLabels = buildPointerLabels(step);
    arrayRow.ops = step.ops;
    arrayRow.previousOps = previousOps;
    markUsed(step.arrayName, "array");
  }

  pushStructure(rows, {
    name: step.stringName ?? "string",
    value: step.string,
    prev: previousStep?.string,
    kind: undefined,
    skipIf: pointerNames.has(step.stringName ?? ""),
  });
  markUsed(step.stringName, "string");

  pushStructure(rows, {
    name: step.hashMapName ?? "map",
    value: step.hashMap,
    prev: previousStep?.hashMap,
    kind: "map",
    skipIf: pointerNames.has(step.hashMapName ?? ""),
  });
  markUsed(step.hashMapName, "map");

  const matrixRow = pushStructure(rows, {
    name: step.matrixName ?? "matrix",
    value: step.matrix,
    prev: previousStep?.matrix,
    kind: "matrix",
    skipIf: pointerNames.has(step.matrixName ?? ""),
  });
  if (matrixRow) {
    matrixRow.activeCell = step.activeCell;
    matrixRow.changedCells = step.changedCells;
    matrixRow.ops = step.ops;
    matrixRow.previousOps = previousOps;
    markUsed(step.matrixName, "matrix");
  }

  pushStructure(rows, {
    name: step.graphName ?? "graph",
    value: step.graph,
    prev: previousStep?.graph,
    kind: "graph",
    skipIf: pointerNames.has(step.graphName ?? ""),
  });
  markUsed(step.graphName, "graph");

  const linkedListName = Object.keys(step.linkedList?.lists ?? {})[0];
  const linkedListRow = pushStructure(rows, {
    name: linkedListName ?? "list",
    value: step.linkedList,
    prev: previousStep?.linkedList,
    kind: "linked-list",
    skipIf: pointerNames.has(linkedListName ?? ""),
  });
  if (linkedListRow) markUsed(linkedListName, "list");

  const treeName = Object.keys(step.tree?.roots ?? {})[0];
  const treeRow = pushStructure(rows, {
    name: treeName ?? "tree",
    value: step.tree,
    prev: previousStep?.tree,
    kind: "tree",
    skipIf: pointerNames.has(treeName ?? ""),
  });
  if (treeRow) markUsed(treeName, "tree");

  // Sets captured by identity (JS Set / Python set) — distinct from arrays.
  pushStructure(rows, {
    name: step.setName ?? "set",
    value: step.set,
    prev: previousStep?.set,
    kind: "set",
    skipIf: pointerNames.has(step.setName ?? ""),
  });
  markUsed(step.setName, "set");

  // Auxiliary collections the tracer records (queue/stack/visited). Skipped
  // when the same value is already listed as the main array, or when a Set
  // captured by identity already rendered that name (e.g. a Set named
  // "visited" shows as the set row, not twice).
  if (step.array === undefined) {
    pushStructure(rows, {
      name: step.visitedName ?? "visited",
      value: step.visited,
      prev: previousStep?.visited,
      kind: "set",
      skipIf: usedNames.has(step.visitedName ?? "visited"),
    });
    pushStructure(rows, {
      name: step.stackName ?? "stack",
      value: step.stack,
      prev: previousStep?.stack,
      kind: "stack",
      skipIf: usedNames.has(step.stackName ?? "stack"),
    });
    pushStructure(rows, {
      name: step.queueName ?? "queue",
      value: step.queue,
      prev: previousStep?.queue,
      kind: "queue",
      skipIf: usedNames.has(step.queueName ?? "queue"),
    });
  }

  return rows;
}

/** Builds an array row (and returns it so the caller can attach hints). */
function pushStructure(
  rows: VariableRow[],
  entry: {
    name: string;
    value: unknown;
    prev: unknown;
    kind: VariableRow["kind"];
    skipIf?: boolean;
  },
): VariableRow | undefined {
  if (entry.value === undefined) return undefined;
  if (entry.skipIf) return undefined;
  const row: VariableRow = {
    name: entry.name,
    value: entry.value,
    previousValue: entry.prev,
    changed: changedIn(entry.name, entry.value, entry.prev),
    highlighted: false,
    kind: entry.kind,
  };
  rows.push(row);
  return row;
}

/**
 * Pointer-name labels per array index: any primitive pointer whose numeric
 * value is a valid array index gets its name shown under that cell. This is
 * name-independent for routing — labels come from the pointer variables
 * themselves (i, j, left, right, ...).
 */
function buildPointerLabels(step: VisualStep): Record<number, string[]> | undefined {
  const labels: Record<number, string[]> = {};
  const length = step.array?.length ?? 0;
  for (const [name, value] of Object.entries(step.pointers ?? {})) {
    if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length) {
      (labels[value] ??= []).push(name);
    }
  }
  return Object.keys(labels).length ? labels : undefined;
}

export function VariablesPanel({
  step,
  previousStep,
  result,
  isLastStep,
  collapsed,
  onToggleCollapsed,
}: VariablesPanelProps) {
  const rows = useMemo(() => buildRows(step, previousStep), [step, previousStep]);
  const [zoom, setZoom] = usePanelZoom("variables");

  const returnRow: VariableRow | null =
    isLastStep && result !== undefined
      ? { name: "↩ return", value: result, previousValue: undefined, changed: false, highlighted: true }
      : null;

  const visibleRows = returnRow ? [returnRow, ...rows] : rows;

  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-label="Variables"
      data-tour="variables"
    >
      <header className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-border/80 px-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
            Variables
          </h2>
          {!collapsed && visibleRows.length > 0 ? (
            <span className="rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              {visibleRows.length}
            </span>
          ) : null}
        </div>
        {!collapsed ? (
          <PanelZoomControls zoom={zoom} onZoomChange={setZoom} />
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground"
          aria-label={collapsed ? "Expand variables" : "Collapse variables"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </Button>
      </header>

      {collapsed ? null : (
        <div
          className="min-h-0 flex-1 overflow-auto"
          style={{ zoom }}
          onWheel={(event) => handlePanelWheel(event, zoom, setZoom)}
        >
          {!step ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Run the code to see variables here.
            </p>
          ) : visibleRows.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No variables captured at this step.
            </p>
          ) : (
            visibleRows.map((row, index) => (
              <StructureRow key={`${row.name}-${row.kind ?? ""}-${index}`} row={row} />
            ))
          )}
        </div>
      )}
    </section>
  );
}
