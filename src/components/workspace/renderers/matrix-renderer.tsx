"use client";

import { useMemo } from "react";
import type { VariableRow } from "./structure-renderer";

export function MatrixRenderer({ row }: { row: VariableRow }) {
  const matrix = useMemo(
    () =>
      Array.isArray(row.value) && Array.isArray(row.value[0]) ? (row.value as unknown[][]) : [],
    [row.value],
  );

  const changedCells = useMemo(() => {
    if (row.changedCells && row.changedCells.length > 0) return row.changedCells;
    // Fallback: cell-wise diff against the previous snapshot.
    const prev = Array.isArray(row.previousValue) && Array.isArray(row.previousValue[0])
      ? (row.previousValue as unknown[][])
      : undefined;
    if (!prev) return [];
    const changed: Array<{ row: number; col: number }> = [];
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < (matrix[r]?.length ?? 0); c++) {
        if (prev[r]?.[c] !== matrix[r]?.[c]) changed.push({ row: r, col: c });
      }
    }
    return changed;
  }, [row.changedCells, row.previousValue, matrix]);

  const active = row.activeCell;

  return (
    <div className="overflow-x-auto pb-0.5">
      <div className="min-w-max">
        <div className="flex gap-1 pl-[18px]">
          {(matrix[0] ?? []).map((_, col) => (
            <span key={col} className="w-7 shrink-0 text-center font-mono text-[9px] leading-3 text-muted-foreground/70">
              c{col}
            </span>
          ))}
        </div>
        {matrix.map((cells, r) => (
          <div key={r} className="mt-0.5 flex items-center gap-1">
            <span className="w-[14px] shrink-0 pr-1 text-right font-mono text-[9px] leading-3 text-muted-foreground/70">
              r{r}
            </span>
            {cells.map((value, c) => {
              const isActive = active?.row === r && active?.col === c;
              const isChanged = changedCells.some((cell) => cell.row === r && cell.col === c);
              const cellClass = isActive
                ? "border-teal-500/70 bg-teal-500/15 text-teal-700 dark:text-teal-300"
                : isChanged
                  ? "border-orange-500/70 bg-orange-500/15 text-orange-700 dark:text-orange-300"
                  : "border-border bg-background text-foreground/85";
              return (
                <span
                  key={c}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] border font-mono text-[11px] transition-colors ${cellClass}`}
                >
                  {formatCell(value)}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null) return "·";
  if (typeof value === "string") return value.length > 3 ? value.slice(0, 3) : value;
  if (typeof value === "object") return "{}";
  return String(value);
}
