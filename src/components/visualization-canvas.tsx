import { useId, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, PenLine, Scale } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PanelContainer } from "@/components/panel-container";
import { uniqueAdditions, uniqueRemovals } from "@/lib/structure-diff";
import { DpArrayRenderer } from "@/components/workspace/renderers/dp-array-renderer";
import { DpTableRenderer } from "@/components/workspace/renderers/dp-table-renderer";
import { LinkedListChain } from "@/components/workspace/renderers/linked-list-renderer";
import { MemoTableRenderer } from "@/components/workspace/renderers/memo-table-renderer";
import { RecursionTreeRenderer } from "@/components/workspace/renderers/recursion-tree-renderer";
import { TreeDiagram } from "@/components/workspace/renderers/tree-renderer";
import { explainStep } from "@/lib/explain-step";
import {
  diffIndexSet,
  MATRIX_COL_POINTER_NAMES,
  MATRIX_ROW_POINTER_NAMES,
  pointerColor,
  pointerEntries,
} from "@/lib/pointers";
import type { GraphInput, Matrix, MatrixCell, MatrixCellChange, VisualStep } from "@/types/visualizer";

type VisualizationCanvasProps = {
  step?: VisualStep;
  previousStep?: VisualStep;
};

const chartColors = {
  primary: "hsl(var(--chart-1))",
  active: "hsl(var(--chart-2))",
  focus: "hsl(var(--chart-4))",
  done: "hsl(var(--chart-5))",
  changed: "hsl(var(--destructive))",
  border: "hsl(var(--border))",
  card: "hsl(var(--card))",
  text: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
};

// Colored pill per step kind, tuned for both themes (same palette as the
// type tags in the Variables panel).
const STEP_KIND_TAG: Record<string, string> = {
  Branch: "bg-amber-500/15 text-amber-700 border-amber-500/35 dark:text-amber-400",
  Return: "bg-teal-500/15 text-teal-700 border-teal-500/35 dark:text-teal-400",
  Call: "bg-blue-500/15 text-blue-700 border-blue-500/35 dark:text-blue-400",
  Line: "bg-cyan-500/15 text-cyan-700 border-cyan-500/35 dark:text-cyan-400",
  Start: "bg-emerald-500/15 text-emerald-700 border-emerald-500/35 dark:text-emerald-400",
  Console: "bg-violet-500/15 text-violet-700 border-violet-500/35 dark:text-violet-400",
  Load: "bg-sky-500/15 text-sky-700 border-sky-500/35 dark:text-sky-400",
  Trace: "bg-slate-500/15 text-slate-700 border-slate-500/35 dark:text-slate-400",
  default: "bg-slate-500/15 text-slate-700 border-slate-500/35 dark:text-slate-400",
};

function stepKindTag(title: string | undefined): string {
  const base = title?.trim().split(" ")[0] ?? "";
  return STEP_KIND_TAG[base] ?? STEP_KIND_TAG.default;
}

// One color per data structure, matching the Variables panel type tags.
const DATA_STRUCTURE_TAG: Record<string, string> = {
  Array: "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
  Matrix: "bg-teal-500/10 text-teal-700 border-teal-500/30 dark:text-teal-400",
  String: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
  "Sliding window": "bg-cyan-500/10 text-cyan-700 border-cyan-500/30 dark:text-cyan-400",
  "Hash map": "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
  Graph: "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400",
  "Call stack": "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-400",
  Stack: "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-400",
  Queue: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  "Min-Heap": "bg-lime-500/10 text-lime-700 border-lime-500/30 dark:text-lime-400",
  "Max-Heap": "bg-orange-500/10 text-orange-700 border-orange-500/30 dark:text-orange-400",
  "Visited set": "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  Tree: "bg-lime-500/10 text-lime-700 border-lime-500/30 dark:text-lime-400",
  "DP Table": "bg-teal-500/10 text-teal-700 border-teal-500/30 dark:text-teal-400",
  "DP Array": "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-400",
  "Memo Cache": "bg-violet-500/10 text-violet-700 border-violet-500/30 dark:text-violet-400",
  "Recursion Tree": "bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-400",
};

/** Renders a branch note like "if arr[mid] < target → false" with the verdict colored. */
function renderStepNote(note: string | undefined) {
  if (!note) return null;
  const match = note.match(/→\s*(true|false)\s*$/);
  if (!match) {
    return <span className="font-mono text-[12.5px] text-muted-foreground">{note}</span>;
  }
  const index = note.lastIndexOf("→");
  const isTrue = match[1] === "true";
  return (
    <span className="font-mono text-[12.5px] text-muted-foreground">
      {note.slice(0, index)}
      <span
        className={
          isTrue
            ? "font-semibold text-emerald-600 dark:text-emerald-400"
            : "font-semibold text-rose-600 dark:text-rose-400"
        }
      >
        {note.slice(index)}
      </span>
    </span>
  );
}

function gridTemplate(length: number, min: string): CSSProperties {
  return { gridTemplateColumns: `repeat(${Math.max(length, 1)}, minmax(${min}, 1fr))` };
}

/**
 * Fallback panel shown when a step carries no rendered data structure
 * (array / tree / map / …). Instead of a dead "nothing to draw" message,
 * surface what the tracer DID capture: scalar variables, the call stack,
 * and the return value — so every algorithm still shows live state.
 */
function NoStructureFallback({
  step,
  previousStep,
}: {
  step: VisualStep;
  previousStep?: VisualStep;
}) {
  const pointerEntries = Object.entries(step.pointers ?? {});
  const hasReturnValue = typeof step.returnValue === "string" && step.returnValue.length > 0;
  const previousPointers = previousStep?.pointers ?? {};

  // Nothing meaningful captured at all — keep the original hint.
  if (!pointerEntries.length && !step.callStack?.length && !hasReturnValue) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-md border border-dashed bg-muted/35 px-6 text-center text-sm text-muted-foreground">
        Nothing to draw here yet — arrays, strings, linked lists, trees, maps, matrices, and graphs will appear as the code runs.
      </div>
    );
  }

  return (
    <PanelContainer filename="execution-state">
      <div className="rounded-md border border-border/60 bg-card/40 p-3" aria-label="Execution state">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sky-700 dark:text-sky-400">
            Execution state
          </span>
          <span className="text-xs text-muted-foreground">
            scalar variables &amp; call activity at this step
          </span>
        </div>

        {pointerEntries.length ? (
          <div className="overflow-hidden rounded-md border border-border/60">
            {pointerEntries.map(([name, value]) => {
              const previous = previousPointers[name];
              const changed = JSON.stringify(value) !== JSON.stringify(previous);
              return (
                <div
                  key={name}
                  className={`flex items-center gap-2 border-b border-border/40 px-2 py-1 font-mono text-[12px] last:border-b-0 ${
                    changed ? "bg-cyan-500/10 dark:bg-cyan-500/15" : ""
                  }`}
                >
                  <span className="w-28 shrink-0 truncate text-foreground/90">{name}</span>
                  <span className="rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                    {value === null ? "null" : typeof value}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate ${changed ? "variable-value-flash font-semibold" : "text-foreground/80"}`}
                  >
                    {formatScalar(value)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}

        {step.callStack?.length ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Active calls:</span>
            {step.callStack.map((frame, index) => (
              <span
                key={`${frame}-${index}`}
                className="rounded-md bg-violet-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-violet-700 dark:text-violet-400"
              >
                {frame}
              </span>
            ))}
          </div>
        ) : null}

        {hasReturnValue ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Returned:</span>
            <code className="rounded-md bg-teal-500/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-teal-700 dark:text-teal-400">
              {step.returnValue}
            </code>
          </div>
        ) : null}
      </div>
    </PanelContainer>
  );
}

function formatScalar(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

export function VisualizationCanvas({
  step,
  previousStep,
}: VisualizationCanvasProps) {
  if (!step) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-muted/35 px-6 text-center text-sm text-muted-foreground">
        Run the code to see your first algorithm state.
      </div>
    );
  }

  // Render every structure a step carries at once, instead of one by priority.
  const panels: ReactNode[] = [];
  if (step.graph) {
    panels.push(<PanelContainer key="graph" filename="graph"><GraphVisualizer step={step} graph={step.graph} /></PanelContainer>);
  }
  if (step.linkedList) {
    panels.push(
      <PanelContainer key="linked-list" filename="linked-list">
        <div
          className="rounded-md border border-border/60 bg-card/40 p-3"
          aria-label="Linked list"
        >
          <LinkedListChain data={step.linkedList} size="lg" />
        </div>
      </PanelContainer>,
    );
  }
  if (step.tree) {
    panels.push(
      <PanelContainer key="tree" filename="binary-tree">
        <div
          className="rounded-md border border-border/60 bg-card/40 p-3"
          aria-label="Binary tree"
        >
          <TreeDiagram data={step.tree} size="lg" />
        </div>
      </PanelContainer>,
    );
  }
  if (step.array) {
    panels.push(
      <PanelContainer key="array" filename="array">
        <ArrayVisualizer
          step={step}
          values={step.array}
          previousValues={previousStep?.array}
        />
      </PanelContainer>,
    );
  }
  if (step.matrix) {
    panels.push(
      <PanelContainer key="matrix" filename="matrix">
        <MatrixVisualizer
          step={step}
          matrix={step.matrix}
          previousMatrix={previousStep?.matrix}
        />
      </PanelContainer>,
    );
  }
  if (step.heap) {
    panels.push(
      <PanelContainer key="heap" filename="heap">
        <HeapVisualizer
          heap={step.heap}
          activeIndices={step.heapActive}
          previousItems={previousStep?.heap?.name === step.heap.name ? previousStep.heap.items : undefined}
        />
      </PanelContainer>,
    );
  }
  if (step.stack && !step.dpArray) {
    panels.push(
      <PanelContainer key="stack" filename="stack">
        <StackVisualizer
          items={step.stack}
          name={step.stackName}
          previousItems={previousStep?.stack}
        />
      </PanelContainer>,
    );
  }
  if (step.queue && !step.dpArray) {
    panels.push(
      <PanelContainer key="queue" filename="queue">
        <QueueVisualizer
          items={step.queue}
          name={step.queueName}
          previousItems={previousStep?.queue}
        />
      </PanelContainer>,
    );
  }
  if (step.string) {
    panels.push(
      <PanelContainer key="string" filename="string">
        <StringVisualizer
          step={step}
          value={step.string}
          previousValue={previousStep?.string}
        />
      </PanelContainer>,
    );
  }
  if (step.hashMap && !step.array && !step.string) {
    panels.push(
      <PanelContainer key="map" filename="hash-map">
        <HashMapPanel hashMap={step.hashMap} previousMap={previousStep?.hashMap} />
      </PanelContainer>,
    );
  }
  // ---- Dynamic programming panels ----
  if (step.dpTable) {
    panels.push(
      <PanelContainer key="dp-table" filename="dp-table">
        <DpTableRenderer
          table={step.dpTable}
          tableName={step.dpTableName}
          activeCell={step.dpActiveCell}
          dependencies={step.dpDependencies}
          previousTable={previousStep?.dpTable}
        />
      </PanelContainer>,
    );
  }
  if (step.dpArray) {
    panels.push(
      <PanelContainer key="dp-array" filename="dp-array">
        <DpArrayRenderer
          array={step.dpArray}
          tableName={step.dpArrayName}
          activeIndex={step.dpActiveIndex}
          dependencies={step.dpArrayDependencies}
          previousArray={previousStep?.dpArray}
        />
      </PanelContainer>,
    );
  }
  if (step.memoTable) {
    panels.push(
      <PanelContainer key="memo-table" filename="memo-table">
        <MemoTableRenderer
          memo={step.memoTable}
          previousMemo={previousStep?.memoTable}
          activeEntry={step.memoActive}
          tableName={step.memoTableName}
        />
      </PanelContainer>,
    );
  }
  if (step.recursionTree) {
    panels.push(
      <PanelContainer key="recursion-tree" filename="recursion-tree">
        <RecursionTreeRenderer
          nodes={step.recursionTree}
          activeNodeId={step.recursionActive}
          tableName={step.memoTableName}
        />
      </PanelContainer>,
    );
  }
  if (step.callStack?.length) {
    panels.push(<PanelContainer key="call-stack" filename="call-stack"><CallStackVisualizer callStack={step.callStack} /></PanelContainer>);
  }

  const ops = step.ops;
  const explanation = explainStep(step, previousStep);
  const note = step.note ?? "Executing…";

  return (
    <div className="space-y-4">
      <div className="sticky top-3 z-10 rounded-lg border border-border/70 bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            {/* Fixed two-line height so a long statement note never wraps or
                unwraps between steps — that used to push the visualization
                below the header up and down by ~50px. */}
            <div className="flex min-h-12 flex-wrap items-center gap-2 overflow-hidden">
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${stepKindTag(step.title)}`}
              >
                {step.title ?? "Trace state"}
              </span>
              {renderStepNote(note)}
            </div>
            {/* Always rendered (even when empty) so the header height is
                constant whether or not this step has an explanation. */}
            <div className="min-h-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {explanation ? <>💡 {explanation}</> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {ops ? (
              <span
                data-tour="ops"
                className="flex items-center gap-1.5 rounded-md border border-border/70 bg-card px-2 py-1 text-[10px] text-muted-foreground"
                aria-label="Operations performed so far in this run"
              >
                <span
                  title="Comparisons — branch conditions evaluated (e.g. i < n)"
                  className="flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 font-semibold text-blue-700 dark:text-blue-400"
                >
                  <Scale className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">{ops.comparisons}</span>{" "}
                  {ops.comparisons === 1 ? "comparison" : "comparisons"}
                </span>
                <span
                  title="Swaps — pairs of elements exchanged (e.g. in a sort)"
                  className="flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 font-semibold text-orange-700 dark:text-orange-400"
                >
                  <ArrowLeftRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">{ops.swaps}</span>{" "}
                  {ops.swaps === 1 ? "swap" : "swaps"}
                </span>
                <span
                  title="Writes — cells, array positions, or characters changed"
                  className="flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 font-semibold text-rose-700 dark:text-rose-400"
                >
                  <PenLine className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="tabular-nums">{ops.writes}</span>{" "}
                  {ops.writes === 1 ? "write" : "writes"}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <DataStructuresInUse step={step} />

      {panels.length ? (
        <div className={panels.length > 1 ? "grid gap-4 xl:grid-cols-2" : ""}>{panels}</div>
      ) : (
        <NoStructureFallback step={step} previousStep={previousStep} />
      )}
    </div>
  );
}

function DataStructuresInUse({ step }: { step: VisualStep }) {
  const structures = [
    step.array ? "Array" : null,
    step.matrix ? "Matrix" : null,
    step.string ? "String" : null,
    step.window ? "Sliding window" : null,
    step.hashMap ? "Hash map" : null,
    step.graph ? "Graph" : null,
    step.linkedList ? "Linked list" : null,
    step.tree ? "Tree" : null,
    step.callStack?.length ? "Call stack" : null,
    step.stack ? "Stack" : null,
    step.queue ? "Queue" : null,
    step.heap ? (step.heap.kind === "max" ? "Max-Heap" : "Min-Heap") : null,
    step.visited ? "Visited set" : null,
    step.dpTable ? "DP Table" : null,
    step.dpArray ? "DP Array" : null,
    step.memoTable ? "Memo Cache" : null,
    step.recursionTree?.length ? "Recursion Tree" : null,
  ].filter((structure): structure is string => Boolean(structure));

  if (!structures.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">Data structures:</span>
      {structures.map((structure) => (
        <Badge
          key={structure}
          variant="outline"
          className={`font-medium ${DATA_STRUCTURE_TAG[structure] ?? "bg-muted text-muted-foreground border-border"}`}
        >
          {structure}
        </Badge>
      ))}
    </div>
  );
}

function CallStackVisualizer({ callStack }: { callStack: Array<string | number> }) {
  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-3 text-sm font-medium">Recursive call stack</div>
      <div className="flex min-h-56 flex-col-reverse gap-2" role="img" aria-label="Recursive function call stack">
        {callStack.map((frame, index) => (
          <div
            key={`${frame}-${index}`}
            className={
              index === callStack.length - 1
                ? "rounded-md bg-primary px-3 py-2 font-mono text-sm text-primary-foreground"
                : "rounded-md border bg-muted/35 px-3 py-2 font-mono text-sm"
            }
          >
            {String(frame)}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Labeled index-variable arrows above a linear structure (array / string). */
function PointerArrowsRow({
  step,
  length,
  changed,
  min,
}: {
  step: VisualStep;
  length: number;
  changed: Set<number>;
  min: string;
}) {
  const entries = pointerEntries(step, length);
  if (!entries.length) return null;

  const byIndex = new Map<number, string[]>();
  for (const entry of entries) {
    const names = byIndex.get(entry.index) ?? [];
    names.push(entry.name);
    byIndex.set(entry.index, names);
  }

  return (
    <div className="grid min-w-max gap-2" style={gridTemplate(length, min)} aria-hidden="true">
      {Array.from({ length }, (_, index) => {
        const names = byIndex.get(index);
        if (!names) return <div key={index} className="min-h-7" />;
        return (
          <div key={index} className="flex min-h-7 items-start justify-center gap-1.5">
            {names.map((name) => {
              const color = changed.has(index) ? "hsl(160 90% 52%)" : pointerColor(name);
              return (
                <span
                  key={name}
                  className="flex flex-col items-center leading-none"
                  title={changed.has(index) ? "Written this step" : `${name} points here`}
                >
                  <span className="text-xs font-bold" style={{ color }}>
                    {name}
                  </span>
                  <span className="text-[15px]" style={{ color }}>
                    ▼
                  </span>
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Range band under a linear structure showing the active search/window span. */
function PointerBand({
  range,
  length,
  entries,
  leftDefault,
  rightDefault,
  min,
}: {
  range?: [number, number];
  length: number;
  entries: Array<{ name: string; index: number }>;
  leftDefault: string;
  rightDefault: string;
  min: string;
}) {
  if (!range || length < 2) return null;
  const lo = Math.min(range[0], range[1]);
  const hi = Math.max(range[0], range[1]);
  if (lo === hi || lo < 0 || hi >= length) return null;
  const leftLabel = entries.find((entry) => entry.index === lo)?.name ?? leftDefault;
  const rightLabel = entries.find((entry) => entry.index === hi)?.name ?? rightDefault;

  return (
    <div className="grid min-w-max gap-2" style={gridTemplate(length, min)} aria-hidden="true">
      <div
        className="flex h-6 items-center gap-1"
        style={{ gridColumn: `${lo + 1} / ${hi + 2}` }}
        title={`${leftLabel} … ${rightLabel} (range)`}
      >
        <span className="flex flex-col items-center leading-none" style={{ color: pointerColor(leftLabel) }}>
          <span className="text-xs font-bold">{leftLabel}</span>
          <span className="text-[15px]">▼</span>
        </span>
        <span
          className="min-w-0 flex-1 border-t border-dashed"
          style={{ borderColor: "hsl(var(--chart-4) / 0.6)" }}
        />
        <span className="flex flex-col items-center leading-none" style={{ color: pointerColor(rightLabel) }}>
          <span className="text-xs font-bold">{rightLabel}</span>
          <span className="text-[15px]">▼</span>
        </span>
      </div>
    </div>
  );
}

function StringVisualizer({
  step,
  value,
  previousValue,
}: {
  step: VisualStep;
  value: string;
  previousValue?: string;
}) {
  const window = step.window ?? step.range;
  const active = new Set(step.active ?? []);
  const changed = diffStringIndices(previousValue, value);
  const entries = pointerEntries(step, value.length);

  return (
    <div className="space-y-4 rounded-md border bg-background/70 p-4">
      <div className="w-max space-y-1.5">
        <PointerArrowsRow step={step} length={value.length} changed={changed} min="2.8rem" />
        <div
          className="grid min-w-max gap-2"
          style={gridTemplate(value.length, "2.8rem")}
          role="img"
          aria-label="String characters with the active sliding window highlighted"
        >
          {Array.from(value).map((character, index) => {
            const inWindow =
              window && index >= Math.min(window[0], window[1]) && index <= Math.max(window[0], window[1]);
            const isActive = active.has(index) || (window ? index === window[1] : false);
            const isChanged = changed.has(index);
            const previousCharacter = previousValue?.[index];
            const tooltip = isChanged
              ? previousCharacter === undefined
                ? "new character"
                : `changed from ${previousCharacter === " " ? "space" : previousCharacter}`
              : undefined;

            return (
              <div key={`${character}-${index}`} className="space-y-1 text-center" title={tooltip}>
                <div
                  className={
                    isActive
                      ? "rounded-md bg-primary px-2 py-3 font-medium text-primary-foreground"
                      : inWindow
                        ? "rounded-md bg-accent px-2 py-3 font-medium text-accent-foreground"
                        : isChanged
                          ? "rounded-md bg-[hsl(var(--destructive))] px-2 py-3 font-medium text-destructive-foreground"
                          : "rounded-md border bg-muted/35 px-2 py-3 font-medium"
                  }
                >
                  {character === " " ? "space" : character}
                </div>
                <div className="text-xs text-muted-foreground">{index}</div>
              </div>
            );
          })}
        </div>
        <PointerBand
          range={window}
          length={value.length}
          entries={entries}
          leftDefault="start"
          rightDefault="end"
          min="2.8rem"
        />
      </div>

      {step.hashMap ? <HashMapInline hashMap={step.hashMap} /> : null}
    </div>
  );
}

function HashMapInline({
  hashMap,
  previousMap,
}: {
  hashMap: Record<string, string | number | boolean | null>;
  previousMap?: Record<string, string | number | boolean | null>;
}) {
  const entries = Object.entries(hashMap);

  if (!entries.length) return null;

  return (
    <div className="border-t pt-4">
      <div className="mb-2 text-sm font-medium">Hash map</div>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, value]) => {
          const previousValue = previousMap?.[key];
          const isChanged = previousMap !== undefined && previousValue !== value;
          const tooltip =
            previousValue === undefined ? "added" : `changed from ${formatValue(previousValue)}`;
          return (
            <Badge
              key={key}
              variant="secondary"
              className={
                isChanged
                  ? "border-transparent bg-[hsl(var(--destructive))] text-destructive-foreground"
                  : undefined
              }
              title={isChanged ? tooltip : undefined}
            >
              {key}: {formatValue(value)}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Stack (LIFO) canvas panel: vertical column with the top cell highlighted.
 * Newly pushed items flash emerald, popped items are called out below.
 */
function StackVisualizer({
  items,
  name,
  previousItems,
}: {
  items: Array<string | number>;
  name?: string;
  previousItems?: Array<string | number>;
}) {
  const additions = uniqueAdditions(previousItems, items);
  const removals = uniqueRemovals(previousItems, items);
  const visible = items.slice(-12); // bottom → top, keep the top 12
  const truncated = items.length > 12;
  const topIndex = visible.length - 1;
  const pushed = additions.length > 0 && sameValue(additions[additions.length - 1], visible[topIndex]);

  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3" aria-label="Stack">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-400">
          Stack
        </span>
        <span className="font-mono text-xs text-muted-foreground">{name ?? "stack"} · LIFO · {items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>
      <div className="flex justify-center py-2">
        <div className="inline-flex flex-col">
          <div className="min-w-[84px] overflow-hidden rounded-md border-2 border-violet-500/50">
            {visible.length === 0 ? (
              <div className="px-3 py-2 text-center font-mono text-[11px] text-muted-foreground/50">empty</div>
            ) : null}
            {[...visible].reverse().map((item, reverseIndex) => {
              const originalIndex = topIndex - reverseIndex;
              const isTop = reverseIndex === 0;
              const isPushed = isTop && pushed;
              return (
                <div
                  key={originalIndex}
                  className={
                    isPushed
                      ? "border-t border-emerald-500/60 bg-emerald-500/15 px-3 py-1 text-center font-mono text-[12px] font-semibold text-emerald-500"
                      : isTop
                        ? "border-t border-violet-500/60 bg-violet-500/10 px-3 py-1 text-center font-mono text-[12px] font-semibold text-violet-700 dark:text-violet-300"
                        : "border-t border-border/60 bg-background px-3 py-1 text-center font-mono text-[12px] text-foreground/85"
                  }
                >
                  {formatItemValue(item)}
                  {isTop ? <span className="ml-2 text-[9px] uppercase tracking-widest text-violet-400/80">← top</span> : null}
                </div>
              );
            })}
          </div>
          {truncated ? (
            <div className="mt-0.5 text-center text-[9px] text-muted-foreground/60">+{items.length - 12} below</div>
          ) : null}
          {removals.length > 0 ? (
            <div className="mt-1 text-center font-mono text-[10px] text-rose-400">popped {removals.map(formatItemValue).join(", ")}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Queue (FIFO) canvas panel: horizontal cells with front/rear markers.
 * Dequeued head flashes rose, newly enqueued tail flashes emerald.
 */
function QueueVisualizer({
  items,
  name,
  previousItems,
}: {
  items: Array<string | number>;
  name?: string;
  previousItems?: Array<string | number>;
}) {
  const additions = uniqueAdditions(previousItems, items);
  const removals = uniqueRemovals(previousItems, items);
  const visible = items.slice(0, 14);
  const truncated = items.length > 14;
  const rear = visible[visible.length - 1];
  const enqueued = additions.length > 0 && sameValue(additions[additions.length - 1], rear);

  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3" aria-label="Queue">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Queue
        </span>
        <span className="font-mono text-xs text-muted-foreground">{name ?? "queue"} · FIFO · {items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1 py-2">
        {visible.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/60 px-3 py-2 font-mono text-[11px] text-muted-foreground/50">empty</div>
        ) : null}
        {visible.map((item, index) => {
          const isFront = index === 0;
          const isRear = index === visible.length - 1;
          const cellClass =
            isFront && removals.length > 0
              ? "border-rose-500/60 bg-rose-500/10 text-rose-700 dark:text-rose-300"
              : enqueued && isRear
                ? "border-emerald-500/60 bg-emerald-500/15 font-semibold text-emerald-500"
                : "border-border bg-background text-foreground/85";
          return (
            <span
              key={index}
              className={`flex min-w-9 items-center justify-center rounded-[5px] border px-2 py-1 font-mono text-[12px] ${cellClass}`}
            >
              {formatItemValue(item)}
            </span>
          );
        })}
        {truncated ? <span className="text-[10px] text-muted-foreground/60">+{items.length - 14}</span> : null}
      </div>
      {visible.length > 0 ? (
        <div className="flex justify-between text-[9px] font-semibold uppercase tracking-widest">
          <span className={removals.length > 0 ? "text-rose-400" : "text-sky-400/80"}>
            front{removals.length > 0 ? " ← dequeued" : ""}
          </span>
          <span className={enqueued ? "text-emerald-500" : "text-muted-foreground/60"}>
            {enqueued ? "enqueued ← " : ""}rear
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Heap canvas panel: binary-tree layout above the backing array. Parent→child
 * edges follow i → 2i+1 / 2i+2; cells the sift touched flash emerald; the
 * root (min or max) is highlighted.
 */
function HeapVisualizer({
  heap,
  activeIndices,
  previousItems,
}: {
  heap: NonNullable<VisualStep["heap"]>;
  activeIndices?: number[];
  previousItems?: Array<string | number>;
}) {
  const { items, kind, name } = heap;
  const active = new Set(activeIndices ?? []);
  // Indices whose value changed vs the previous heap snapshot.
  const changedSet = new Set<number>();
  if (previousItems) {
    const length = Math.max(previousItems.length, items.length);
    for (let index = 0; index < length; index++) {
      if (previousItems[index] !== items[index]) changedSet.add(index);
    }
  }
  const limit = Math.min(items.length, 15); // tree view caps at 4 levels
  const levels: number[][] = [];
  for (let i = 0; i < limit; i++) {
    const depth = Math.floor(Math.log2(i + 1));
    (levels[depth] ??= []).push(i);
  }

  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3" aria-label="Heap">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-lime-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-lime-700 dark:text-lime-400">
          {kind === "max" ? "Max-Heap" : "Min-Heap"}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{name} · {items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>

      <div className="flex flex-col items-center gap-0 py-1">
        {levels.map((indices) => (
          <div key={indices[0]} className="flex items-start justify-center gap-1">
            {indices.map((index) => {
              const isActive = active.has(index);
              const isChanged = changedSet.has(index);
              const isRoot = index === 0;
              return (
                <motion.div
                  key={index}
                  layout={items.length <= 32 ? true : undefined}
                  initial={false}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-mono text-[12px] font-semibold ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : isChanged
                        ? "border-cyan-500/70 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                        : isRoot
                          ? "border-lime-500/80 bg-lime-500/10 text-lime-700 dark:text-lime-400"
                          : "border-border bg-background text-foreground/85"
                  }`}
                  title={`[${index}] parent=${index === 0 ? "—" : Math.floor((index - 1) / 2)} value=${items[index]}`}
                >
                  {formatItemValue(items[index])}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Array view: shows the underlying storage with index labels */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {items.slice(0, 31).map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <span
              className={`flex h-7 min-w-8 items-center justify-center rounded-[4px] border px-1 font-mono text-[11px] ${
                active.has(index)
                  ? "border-emerald-500/70 bg-emerald-500/15 font-semibold text-emerald-600 dark:text-emerald-400"
                  : changedSet.has(index)
                    ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-400"
                    : "border-border bg-background text-foreground/85"
              }`}
            >
              {formatItemValue(item)}
            </span>
            <span className="text-[8px] text-muted-foreground/50">{index}</span>
          </div>
        ))}
        {items.length > 31 ? <span className="text-[10px] text-muted-foreground/60">+{items.length - 31}</span> : null}
      </div>
    </div>
  );
}

function sameValue(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

function formatItemValue(item: unknown): string {
  if (item === null) return "null";
  if (typeof item === "string") return item.length > 7 ? item.slice(0, 6) + "…" : item;
  return String(item);
}

function HashMapPanel({
  hashMap,
  previousMap,
}: {
  hashMap: Record<string, string | number | boolean | null>;
  previousMap?: Record<string, string | number | boolean | null>;
}) {
  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-3 text-sm font-medium">Hash map</div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(hashMap).map(([key, value]) => {
          const previousValue = previousMap?.[key];
          const isChanged = previousMap !== undefined && previousValue !== value;
          const tooltip =
            previousValue === undefined ? "added" : `changed from ${formatValue(previousValue)}`;
          return (
            <Badge
              key={key}
              variant="secondary"
              className={
                isChanged
                  ? "border-transparent bg-[hsl(var(--destructive))] text-destructive-foreground"
                  : undefined
              }
              title={isChanged ? tooltip : undefined}
            >
              {key}: {formatValue(value)}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

function ArrayVisualizer({
  step,
  values,
  previousValues,
}: {
  step: VisualStep;
  values: number[];
  previousValues?: number[];
}) {
  const active = new Set(step.active ?? []);
  const sorted = new Set(step.sorted ?? []);
  const range = step.range ?? step.window;
  const pivotIndex = step.pivot;
  const changed = diffIndexSet(previousValues, values);
  const maxValue = Math.max(1, ...values.map((value) => Math.abs(Number(value) || 0)));
  const entries = pointerEntries(step, values.length);
  const template = gridTemplate(values.length, "2.6rem");

  // Stable identity per bar value so framer-motion can FLIP-animate swaps:
  // when two values exchange places, the keyed bars slide to their new spots.
  const occurrences = new Map<number, number>();
  const valueKeys = values.map((rawValue) => {
    const key = Number(rawValue) || 0;
    const occ = occurrences.get(key) ?? 0;
    occurrences.set(key, occ + 1);
    return `${key}-${occ}`;
  });

  // Spring FLIP layout animations are what make swaps readable on small
  // arrays, but on larger ones every step re-animates all bars (measure +
  // layout + paint per bar per frame), which is the main playback jank
  // source. Above the threshold the bars render statically — the diff and
  // active-cell colors still carry the story, and stepping stays smooth.
  const animateLayout = values.length <= 48;

  // Comparison bracket: when exactly 2 elements are active, draw a curved
  // arc connecting them with the comparison note in the middle.
  const activeArr = step.active ?? [];
  const showComparisonBracket = activeArr.length === 2 && step.title === "Branch";
  const bracketLeft = showComparisonBracket ? Math.min(activeArr[0], activeArr[1]) : -1;
  const bracketRight = showComparisonBracket ? Math.max(activeArr[0], activeArr[1]) : -1;

  return (
    <div className="overflow-x-auto rounded-md border bg-background/70 p-4">
      <div className="w-max space-y-1.5">
        <PointerArrowsRow step={step} length={values.length} changed={changed} min="2.6rem" />
        <div className="relative">
        <div
          className="grid h-56 min-w-max items-end gap-2"
          style={template}
          role="img"
          aria-label="Array values rendered as vertical bars"
        >
          {values.map((rawValue, index) => {
            const value = Number(rawValue) || 0;
            const isActive = active.has(index);
            const isSorted = sorted.has(index);
            const isInRange =
              range &&
              index >= Math.min(range[0], range[1]) &&
              index <= Math.max(range[0], range[1]);
            const isChanged = changed.has(index);
            const isPivot = pivotIndex === index;
            const barColor = isPivot
              ? "hsl(38 92% 50%)"
              : isActive
                ? chartColors.active
                : isSorted
                  ? chartColors.done
                  : isInRange
                    ? chartColors.focus
                    : isChanged
                      ? chartColors.changed
                      : chartColors.primary;
            const previousValue = previousValues?.[index];

            return (
              <div key={valueKeys[index]} className="flex flex-col items-center">
                {/* Pivot marker triangle above the bar */}
                {isPivot && (
                  <span className="mb-0.5 flex flex-col items-center leading-none" title="Pivot element">
                    <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">P</span>
                    <span className="text-amber-600 dark:text-amber-400">▼</span>
                  </span>
                )}
                <motion.div
                  layout={animateLayout}
                  initial={false}
                  transition={
                    animateLayout
                      ? { type: "spring", stiffness: 500, damping: 42 }
                      : { duration: 0 }
                  }
                  className={`flex w-full items-start justify-center rounded-t-md px-1 pt-2 text-xs font-medium transition-colors duration-300 ${
                    isPivot
                      ? "ring-2 ring-amber-500/50 text-white"
                      : isChanged
                        ? "text-destructive-foreground"
                        : "text-primary-foreground"
                  }`}
                  style={{
                    height: `${Math.max(18, (Math.abs(value) / maxValue) * 210)}px`,
                    backgroundColor: barColor,
                  }}
                  title={isPivot ? `Pivot element at index ${index}` : isChanged && previousValue !== undefined ? `changed from ${previousValue}` : undefined}
                >
                  <span className="truncate">{value}</span>
                </motion.div>
              </div>
            );
          })}
        </div>
        {/* Comparison bracket SVG overlay */}
        {showComparisonBracket && (
          <ComparisonBracket
            leftIndex={bracketLeft}
            rightIndex={bracketRight}
            cellWidthRem={2.6}
            gapRem={0.5}
            note={step.note}
          />
        )}
        </div>
        <div className="grid min-w-max gap-2" style={template} aria-hidden="true">
          {values.map((_, index) => (
            <div key={index} className="text-center text-xs text-muted-foreground">
              {index}
            </div>
          ))}
        </div>
        <PointerBand
          range={range}
          length={values.length}
          entries={entries}
          leftDefault="left"
          rightDefault="right"
          min="2.6rem"
        />
      </div>

      {step.hashMap && !step.string ? <HashMapInline hashMap={step.hashMap} /> : null}
    </div>
  );
}

function MatrixVisualizer({
  step,
  matrix,
  previousMatrix,
}: {
  step: VisualStep;
  matrix: Matrix;
  previousMatrix?: Matrix;
}) {
  const activeCell = step.activeCell;
  const changed = new Map<string, MatrixCellChange>();
  (step.changedCells ?? diffMatrixCells(previousMatrix, matrix)).forEach((change) => {
    changed.set(`${change.row},${change.col}`, change);
  });
  // DFS/BFS on grids often tracks visited/frontier as "row,col" keys.
  const visitedCells = parseCellKeys(step.visited ?? []);
  const frontierCells = parseCellKeys([
    ...(step.frontier ?? []),
    ...(step.queue ?? []),
    ...(step.stack ?? []),
  ]);
  // Ragged matrices: label columns up to the widest row.
  const colCount = Math.max(0, ...matrix.map((row) => row.length));
  const rowEntries = pointerEntries(step, matrix.length, MATRIX_ROW_POINTER_NAMES);
  const colEntries = pointerEntries(step, colCount, MATRIX_COL_POINTER_NAMES);
  const rowPointer = activeCell ? rowEntries.find((entry) => entry.index === activeCell.row) : undefined;
  const colPointer = activeCell ? colEntries.find((entry) => entry.index === activeCell.col) : undefined;

  // Matrix path: highlighted optimal route through DP grid cells.
  const matrixPath = step.matrixPath;
  const pathCellSet = new Set<string>();
  if (matrixPath) {
    for (const cell of matrixPath) pathCellSet.add(`${cell.row},${cell.col}`);
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-background/70 p-4">
      <div className="mb-1 text-sm font-medium">Matrix</div>
      {step.phase ? (
        <div className="mb-3 text-xs font-medium text-[hsl(var(--chart-4))]">{step.phase}</div>
      ) : null}
      <div className="inline-block" role="img" aria-label="Matrix cells with the active cell highlighted">
        <table className="border-separate" style={{ borderSpacing: "0.35rem" }}>
          <thead>
            <tr>
              <th className="px-1 pb-1 text-xs font-normal text-muted-foreground">row \ col</th>
              {Array.from({ length: colCount }, (_, col) => (
                <th key={col} className="px-2 pb-1 text-center text-xs font-normal text-muted-foreground">
                  {col === activeCell?.col && colPointer ? (
                    <div
                      className="flex flex-col items-center leading-none"
                      style={{ color: pointerColor(colPointer.name) }}
                      title={`${colPointer.name} points at column ${col}`}
                    >
                      <span className="text-xs font-bold">{colPointer.name}</span>
                      <span className="text-[15px]">▼</span>
                    </div>
                  ) : null}
                  <div>{col}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, r) => (
              <tr key={r}>
                <td className="pr-1 text-right text-xs text-muted-foreground">
                  {r === activeCell?.row && rowPointer ? (
                    <div
                      className="flex flex-col items-center leading-none"
                      style={{ color: pointerColor(rowPointer.name) }}
                      title={`${rowPointer.name} points at row ${r}`}
                    >
                      <span className="text-xs font-bold">{rowPointer.name}</span>
                      <span className="text-[15px]">→</span>
                    </div>
                  ) : null}
                  <div>{r}</div>
                </td>
                {row.map((value, c) => {
                  const isActive = activeCell?.row === r && activeCell?.col === c;
                  const isFrontier = frontierCells.has(`${r},${c}`);
                  const isVisited = visitedCells.has(`${r},${c}`);
                  const isOnPath = pathCellSet.has(`${r},${c}`);
                  const change = changed.get(`${r},${c}`);
                  const className = isActive
                    ? "rounded-md bg-primary px-3 py-2 text-center font-medium text-primary-foreground"
                    : isOnPath
                      ? "rounded-md bg-[hsl(var(--chart-1) / 0.18)] px-3 py-2 text-center font-medium ring-1 ring-[hsl(var(--chart-1))]"
                      : isFrontier
                        ? "rounded-md bg-[hsl(var(--chart-4) / 0.42)] px-3 py-2 text-center font-medium"
                        : isVisited
                          ? "rounded-md bg-[hsl(var(--chart-5) / 0.25)] px-3 py-2 text-center font-medium"
                          : change
                            ? "rounded-md bg-[hsl(var(--destructive))] px-3 py-2 text-center font-medium text-destructive-foreground"
                            : "rounded-md border bg-muted/35 px-3 py-2 text-center font-medium";
                  const tooltip = change
                    ? change.previousValue === undefined
                      ? "new cell"
                      : `changed from ${formatValue(change.previousValue)}`
                    : isActive
                      ? `active [${r},${c}]`
                      : isOnPath
                        ? `optimal path [${r},${c}]`
                        : undefined;
                  return (
                    <td key={c} title={tooltip} className={className}>
                      {formatValue(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function parseCellKeys(items: Array<string | number>) {
  const cells = new Set<string>();
  for (const item of items) {
    if (typeof item === "string" && /^\d+,\d+$/.test(item)) cells.add(item);
  }
  return cells;
}

function diffMatrixCells(previous: Matrix | undefined, current: Matrix) {
  if (!previous) return [];
  const changes: MatrixCellChange[] = [];
  for (let r = 0; r < current.length; r++) {
    const prevRow = previous[r];
    const currRow = current[r];
    if (!prevRow || !currRow) continue;
    for (let c = 0; c < currRow.length; c++) {
      if (!matrixCellsEqual(prevRow[c], currRow[c])) {
        changes.push({ row: r, col: c, previousValue: prevRow[c], value: currRow[c] });
      }
    }
  }
  return changes;
}

function matrixCellsEqual(a: MatrixCell | undefined, b: MatrixCell | undefined) {
  if (a === b) return true;
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

function GraphVisualizer({
  step,
  graph,
}: {
  step: VisualStep;
  graph: GraphInput;
}) {
  const markerId = useId();
  const nodes = getGraphNodes(graph);
  const positions = getNodePositions(graph, step);
  const edges = getGraphEdges(graph);
  const visited = new Set((step.visited ?? []).map(String));
  const frontier = new Set((step.frontier ?? step.stack ?? step.queue ?? []).map(String));
  const activeNode = step.activeNode === undefined ? undefined : String(step.activeNode);
  const discovery = new Map<string, number>();
  (step.visited ?? []).forEach((node, index) => {
    const key = String(node);
    if (!discovery.has(key)) discovery.set(key, index + 1);
  });

  // Graph path: highlighted route from start to goal (e.g. BFS shortest path).
  const graphPath = step.graphPath;
  const pathEdgeSet = new Set<string>();
  const pathNodeSet = new Set<string>();
  if (graphPath && graphPath.length > 1) {
    for (const node of graphPath) pathNodeSet.add(String(node));
    for (let i = 0; i < graphPath.length - 1; i++) {
      pathEdgeSet.add(`${String(graphPath[i])}->${String(graphPath[i + 1])}`);
    }
  }

  return (
    <div className="overflow-auto rounded-md border bg-background/70 p-3">
      <svg
        viewBox="0 0 620 340"
        width={620}
        height={340}
        className="max-w-full h-auto"
        role="img"
        aria-label="Graph traversal visualization"
      >
        <defs>
          <marker
            id={`${markerId}-arrow`}
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="8"
            refY="4"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill={chartColors.border} />
          </marker>
          <marker
            id={`${markerId}-arrow-path`}
            markerHeight="10"
            markerWidth="10"
            orient="auto"
            refX="10"
            refY="5"
          >
            <path d="M0,0 L10,5 L0,10 Z" fill="hsl(var(--chart-1))" />
          </marker>
        </defs>
        {edges.map(([from, to]) => {
          const start = positions.get(String(from));
          const end = positions.get(String(to));
          if (!start || !end) return null;
          const isTraversed = visited.has(String(from)) && visited.has(String(to));
          const isOnPath = pathEdgeSet.has(`${String(from)}->${String(to)}`);

          return (
            <line
              key={`${from}-${to}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isOnPath ? "hsl(var(--chart-1))" : isTraversed ? chartColors.done : chartColors.border}
              strokeWidth={isOnPath ? 4 : isTraversed ? 3 : 2}
              markerEnd={isOnPath ? `url(#${markerId}-arrow-path)` : `url(#${markerId}-arrow)`}
              opacity={isTraversed || isOnPath ? 0.95 : 0.75}
              strokeLinecap="round"
            />
          );
        })}

        {nodes.map((node) => {
          const position = positions.get(String(node));
          if (!position) return null;
          const nodeKey = String(node);
          const isActive = activeNode === nodeKey;
          const isVisited = visited.has(nodeKey);
          const isFrontier = frontier.has(nodeKey);
          const isOnPath = pathNodeSet.has(nodeKey);
          const fill = isActive
            ? chartColors.active
            : isOnPath
              ? "hsl(var(--chart-1) / 0.18)"
              : isVisited
                ? "hsl(var(--chart-5) / 0.22)"
                : isFrontier
                  ? "hsl(var(--chart-4) / 0.42)"
                  : chartColors.card;
          const stroke = isActive
            ? chartColors.active
            : isOnPath
              ? "hsl(var(--chart-1))"
              : isVisited
                ? chartColors.done
                : isFrontier
                  ? chartColors.focus
                  : chartColors.border;
          const textFill = isActive ? "hsl(var(--primary-foreground))" : chartColors.text;
          const discoveryOrder = discovery.get(nodeKey);

          return (
            <g key={nodeKey}>
              <circle
                cx={position.x}
                cy={position.y}
                r={28}
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive ? 4 : isOnPath ? 3 : 2}
              />
              <text
                x={position.x}
                y={position.y + 5}
                textAnchor="middle"
                fontSize="15"
                fontWeight="600"
                fill={textFill}
              >
                {nodeKey}
              </text>
              {discoveryOrder !== undefined ? (
                <g>
                  <circle
                    cx={position.x + 26}
                    cy={position.y - 26}
                    r={11}
                    fill={chartColors.done}
                    stroke="hsl(var(--card))"
                    strokeWidth={2}
                  />
                  <text
                    x={position.x + 26}
                    y={position.y - 22}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="hsl(0 0% 100%)"
                  >
                    {discoveryOrder}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function getGraphNodes(graph: GraphInput) {
  const nodeSet = new Set<string>();
  Object.entries(graph).forEach(([node, neighbors]) => {
    nodeSet.add(String(node));
    neighbors.forEach((neighbor) => nodeSet.add(String(neighbor)));
  });
  return Array.from(nodeSet).sort((a, b) => a.localeCompare(b));
}

function getGraphEdges(graph: GraphInput) {
  return Object.entries(graph).flatMap(([node, neighbors]) =>
    neighbors.map((neighbor) => [String(node), String(neighbor)] as const),
  );
}

// Layered BFS layout: nodes are placed left-to-right by discovery depth and
// stacked vertically within their layer, which keeps edges mostly uncrossed
// for the traversal graphs this app visualizes (vs. the old circle layout).
function getNodePositions(graph: GraphInput, step: VisualStep) {
  const nodes = getGraphNodes(graph);
  const adjacency = new Map<string, string[]>();
  nodes.forEach((node) => {
    adjacency.set(node, (graph[node] ?? []).map(String));
  });

  const depth = new Map<string, number>();
  const order: string[] = [];

  const bfsFrom = (root: string, startDepth: number) => {
    if (depth.has(root)) return;
    depth.set(root, startDepth);
    order.push(root);
    const queue = [root];
    while (queue.length) {
      const current = queue.shift()!;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (depth.has(neighbor)) continue;
        depth.set(neighbor, depth.get(current)! + 1);
        order.push(neighbor);
        queue.push(neighbor);
      }
    }
  };

  bfsFrom(pickGraphRoot(nodes, adjacency, graph, step), 0);

  // Disconnected components start a fresh column to the right.
  let maxDepth = Math.max(0, ...depth.values());
  for (const node of nodes) {
    if (!depth.has(node)) {
      maxDepth += 1;
      bfsFrom(node, maxDepth);
    }
  }

  const maxDepthValue = Math.max(1, ...depth.values());
  const width = 620;
  const height = 340;
  const marginX = 64;
  const marginY = 50;
  const innerWidth = width - marginX * 2;
  const innerHeight = height - marginY * 2;

  const layers = new Map<number, string[]>();
  order.forEach((node) => {
    const layer = depth.get(node)!;
    if (!layers.has(layer)) layers.set(layer, []);
    layers.get(layer)!.push(node);
  });

  const positions = new Map<string, { x: number; y: number }>();
  layers.forEach((layerNodes, layer) => {
    const x = marginX + (innerWidth * layer) / maxDepthValue;
    const spacing = Math.min(innerHeight / layerNodes.length, 96);
    const blockHeight = spacing * (layerNodes.length - 1);
    const startY = (height - blockHeight) / 2;
    layerNodes.forEach((node, index) => {
      positions.set(node, { x, y: startY + spacing * index });
    });
  });

  return positions;
}

function pickGraphRoot(
  nodes: string[],
  adjacency: Map<string, string[]>,
  graph: GraphInput,
  step: VisualStep,
) {
  if (step.activeNode !== undefined) return String(step.activeNode);
  const visited = step.visited ?? [];
  if (visited.length) return String(visited[0]);

  // Fall back to the node with the most connections.
  let best = nodes[0] ?? "";
  let bestScore = -1;
  for (const node of nodes) {
    const incoming = Object.entries(graph).filter(([, neighbors]) =>
      neighbors.map(String).includes(node),
    ).length;
    const score = (adjacency.get(node) ?? []).length + incoming;
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }
  return best;
}

function diffStringIndices(previous: string | undefined, current: string | undefined) {
  const result = new Set<number>();
  if (previous === undefined || current === undefined) return result;
  const length = Math.max(previous.length, current.length);
  for (let index = 0; index < length; index++) {
    if (previous[index] !== current[index]) result.add(index);
  }
  return result;
}

function formatValue(value: unknown) {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * SVG bracket arc connecting two active bars during a comparison.
 * Shows the branch note (e.g. "arr[i] > arr[j] → true") centered above
 * the arc so students can see exactly what condition is being tested.
 */
function ComparisonBracket({
  leftIndex,
  rightIndex,
  cellWidthRem,
  gapRem,
  note,
}: {
  leftIndex: number;
  rightIndex: number;
  cellWidthRem: number;
  gapRem: number;
  note?: string;
}) {
  // Each grid cell is cellWidthRem + gapRem wide (rem). Convert to approximate
  // px using a 16px base so the SVG coordinates align with the CSS grid.
  const pxPerRem = 16;
  const cellW = cellWidthRem * pxPerRem;
  const gap = gapRem * pxPerRem;
  const step = cellW + gap;
  const barCenter = cellW / 2;

  const x1 = leftIndex * step + barCenter;
  const x2 = rightIndex * step + barCenter;
  const midX = (x1 + x2) / 2;
  const arcHeight = Math.min(40, Math.max(20, (x2 - x1) * 0.25));

  // SVG sits absolutely on top of the bar grid; y=0 aligns with the top
  // of the grid (bars grow downward from items-end, but the grid itself
  // starts at the top of the h-56 container).
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-10 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {/* Arc from left bar to right bar */}
      <path
        d={`M ${x1} ${arcHeight} Q ${midX} ${-arcHeight * 0.3} ${x2} ${arcHeight}`}
        fill="none"
        stroke="hsl(var(--chart-2))"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.9}
      />
      {/* Small circles at each endpoint */}
      <circle cx={x1} cy={arcHeight} r={3.5} fill="hsl(var(--chart-2))" />
      <circle cx={x2} cy={arcHeight} r={3.5} fill="hsl(var(--chart-2))" />
      {/* Comparison note centered above the arc — width is generous
          so the text is never clipped even when bars are adjacent. */}
      {note ? (
        <foreignObject x={midX - 150} y={-20} width={300} height={24}>
          <div
            className="flex items-center justify-center text-center"
          >
            <span className="whitespace-nowrap rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary dark:text-primary">
              {note}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </svg>
  );
}

