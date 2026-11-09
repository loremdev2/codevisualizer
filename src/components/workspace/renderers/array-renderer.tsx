"use client";

import { useMemo, useState } from "react";
import { changedIndices } from "@/lib/structure-diff";
import type { VariableRow } from "./structure-renderer";

const MAX_CELLS = 24;

export function ArrayRenderer({ row }: { row: VariableRow }) {
  const [showAll, setShowAll] = useState(false);
  const values = useMemo(() => (Array.isArray(row.value) ? (row.value as unknown[]) : []), [row.value]);

  const changed = useMemo(() => {
    const indices = changedIndices(
      Array.isArray(row.previousValue) ? (row.previousValue as unknown[]) : undefined,
      values,
    );
    const swapped =
      (row.ops?.swaps ?? 0) > (row.previousOps?.swaps ?? 0) &&
      indices.length === 2 &&
      !Array.isArray(row.previousValue);
    return { indices, swapped };
  }, [row.previousValue, row.ops, row.previousOps, values]);

  const pointerIndices = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(row.activeLabels ?? {}).map(([index, labels]) => [Number(index), labels]),
      ),
    [row.activeLabels],
  );

  const cellCount = values.length;
  const visible = showAll ? values : values.slice(0, MAX_CELLS);
  const truncated = cellCount > MAX_CELLS && !showAll;
  return (
    <div className="overflow-x-auto pb-0.5">
      <div className="min-w-max">
        {/* index row */}
        <div className="flex gap-1 pl-0.5">
          {visible.map((_, index) => (
            <span key={index} className="w-7 shrink-0 text-center font-mono text-[9px] leading-3 text-muted-foreground/70">
              {index}
            </span>
          ))}
          {truncated ? <span className="w-10 text-[9px] text-muted-foreground/60">…</span> : null}
        </div>
        {/* cells */}
        <div className="mt-0.5 flex gap-1">
          {visible.map((value, index) => {
            const isPointer = index in pointerIndices;
            const isChanged = changed.indices.includes(index);
            const cellClass = isChanged
              ? changed.swapped
                ? "border-orange-500/70 bg-orange-500/15 text-orange-700 dark:text-orange-300"
                : "border-cyan-500/70 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
              : isPointer
                ? "border-cyan-500/60 bg-cyan-500/10 text-foreground"
                : "border-border bg-background text-foreground/85";
            return (
              <span
                key={index}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border font-mono text-[11px] transition-colors ${cellClass}`}
              >
                {formatCell(value)}
              </span>
            );
          })}
          {truncated ? <span className="flex h-7 w-10 items-center justify-center text-[10px] text-muted-foreground/60">…</span> : null}
        </div>
        {/* pointer labels */}
        {(Object.keys(pointerIndices).length > 0 || truncated) && (
          <div className="mt-0.5 flex gap-1">
            {visible.map((_, index) => (
              <span key={index} className="flex h-4 w-7 shrink-0 flex-col items-center leading-3">
                {index in pointerIndices ? (
                  <>
                    <span className="text-[8px] leading-3 text-cyan-400">▼</span>
                    <span className="truncate text-[9px] leading-3 text-cyan-400">
                      {pointerIndices[index].join(",")}
                    </span>
                  </>
                ) : null}
              </span>
            ))}
            {truncated ? <span className="w-10" /> : null}
          </div>
        )}
        {truncated ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-1 rounded border border-border px-1.5 py-px text-[10px] text-cyan-500 transition-colors hover:bg-cyan-500/10"
          >
            view all {cellCount}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") {
    return value.length > 4 ? value.slice(0, 3) + "…" : value;
  }
  return String(value);
}
