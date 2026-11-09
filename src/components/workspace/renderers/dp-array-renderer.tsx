"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Renders a 1-D DP array (e.g. fibonacci, coin change) as a row of cells.
 * Cells that haven't been computed yet appear as empty/placeholder; the
 * active cell is highlighted and dependency cells are marked.
 */
export function DpArrayRenderer({
  array,
  tableName,
  activeIndex,
  dependencies,
  previousArray,
}: {
  array: (string | number | boolean | null)[];
  tableName?: string;
  activeIndex?: number;
  dependencies?: number[];
  previousArray?: (string | number | boolean | null)[];
}) {
  // Hooks must run unconditionally (rules-of-hooks) — the empty-array early
  // return happens after them.
  const filledCount = useMemo(() => {
    let count = 0;
    for (const v of array ?? []) {
      if (v !== null && v !== undefined) count++;
    }
    return count;
  }, [array]);

  if (!array || array.length === 0) return null;

  const depSet = new Set(dependencies ?? []);
  const maxValue = Math.max(1, ...array.map((v) => Math.abs(Number(v) || 0)));

  // Detect changed cells.
  const changed = new Set<number>();
  if (previousArray) {
    for (let i = 0; i < array.length; i++) {
      if (previousArray[i] !== array[i] && array[i] !== null && array[i] !== undefined) {
        changed.add(i);
      }
    }
  }

  const progress = array.length > 0 ? (filledCount / array.length) * 100 : 0;

  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[11px] font-bold uppercase text-sky-700 dark:text-sky-400">
          DP Array
        </span>
        {tableName && (
          <span className="font-mono text-xs text-muted-foreground">{tableName}</span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {array.length} cells
        </span>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-sky-500/60 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {filledCount}/{array.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {array.map((value, index) => {
          const isActive = activeIndex === index;
          const isDependency = depSet.has(index);
          const isChanged = changed.has(index);
          const isEmpty = value === null || value === undefined;
          const height = !isEmpty ? Math.max(32, (Math.abs(Number(value) || 0) / maxValue) * 80) : 32;

          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <motion.div
                layout
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`flex flex-col items-center justify-center rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : isDependency
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                      : isChanged
                        ? "bg-destructive/15 text-destructive"
                        : isEmpty
                          ? "border border-dashed border-border/50 text-muted-foreground/40"
                          : "border border-border/60 bg-background/70"
                }`}
                style={{ minHeight: `${height}px` }}
                title={
                  isActive
                    ? `Computing dp[${index}]`
                    : isDependency
                      ? `Dependency of dp[${activeIndex}]`
                      : `[${index}] = ${value}`
                }
              >
                {value !== null && value !== undefined ? String(value) : ""}
              </motion.div>
              <span className="text-[10px] text-muted-foreground">{index}</span>
            </div>
          );
        })}
      </div>
      {activeIndex !== undefined && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          Computing{" "}
          <span className="font-mono font-semibold text-primary">
            {tableName ?? "dp"}[{activeIndex}]
          </span>
          {dependencies && dependencies.length > 0 && (
            <>
              {" "}from{" "}
              {dependencies.map((d, i) => (
                <span key={i}>
                  {i > 0 && " + "}
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                    [{d}]
                  </span>
                </span>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
