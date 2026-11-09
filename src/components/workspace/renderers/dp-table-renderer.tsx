"use client";

import { useId, useMemo } from "react";

/**
 * Renders a 2-D DP table (bottom-up tabulation) as a grid. Each cell shows
 * its value, with the active cell highlighted and dependency cells marked.
 * SVG overlay draws dependency arrows from dependency cells to the active cell.
 * A progress indicator shows how much of the table has been filled.
 */
export function DpTableRenderer({
  table,
  tableName,
  activeCell,
  dependencies,
  previousTable,
}: {
  table: (string | number | boolean | null)[][];
  tableName?: string;
  activeCell?: { row: number; col: number };
  dependencies?: Array<{ row: number; col: number }>;
  previousTable?: (string | number | boolean | null)[][];
}) {
  // Hooks must run unconditionally (rules-of-hooks) — the empty-table early
  // return happens after them.
  const arrowMarkerId = useId().replace(/:/g, "");
  const filledCells = useMemo(() => {
    let count = 0;
    for (const row of table ?? []) {
      for (const cell of row) {
        if (cell !== null && cell !== undefined) count++;
      }
    }
    return count;
  }, [table]);

  if (!table || table.length === 0) return null;

  const depSet = new Set(
    (dependencies ?? []).map((d) => `${d.row},${d.col}`),
  );
  const colCount = Math.max(0, ...table.map((row) => row.length));

  // Detect changed cells between steps for diff highlighting.
  const changed = new Set<string>();
  if (previousTable) {
    for (let r = 0; r < table.length; r++) {
      const prevRow = previousTable[r];
      const currRow = table[r];
      if (!prevRow || !currRow) continue;
      for (let c = 0; c < currRow.length; c++) {
        if (prevRow[c] !== currRow[c] && currRow[c] !== null && currRow[c] !== undefined) {
          changed.add(`${r},${c}`);
        }
      }
    }
  }

  // Progress: how many cells have been filled.
  const totalCells = table.length * colCount;
  const progress = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;

  // Cell dimensions for SVG overlay (approximate from Tailwind classes).
  const CELL_W = 44;
  const CELL_H = 32;
  const CELL_GAP = 10; // border-spacing 0.25rem = 4px, plus padding ~6px
  const HEADER_ROW_H = 24; // column header row
  const LABEL_COL_W = 28; // row label column

  return (
    <div className="overflow-x-auto rounded-md border border-border/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="rounded bg-teal-500/15 px-1.5 py-0.5 text-[11px] font-bold uppercase text-teal-700 dark:text-teal-400">
          DP Table
        </span>
        {tableName && (
          <span className="font-mono text-xs text-muted-foreground">{tableName}</span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {table.length}×{colCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-teal-500/60 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {filledCells}/{totalCells}
        </span>
      </div>

      {/* Table with SVG overlay for dependency arrows */}
      <div className="relative inline-block">
        <table
          className="border-separate"
          style={{ borderSpacing: "0.25rem" }}
          role="img"
          aria-label={`DP table ${tableName ?? ""} with ${table.length} rows and ${colCount} columns`}
        >
          <thead>
            <tr>
              <th className="px-1.5 pb-1 text-xs font-normal text-muted-foreground">
                i \ j
              </th>
              {Array.from({ length: colCount }, (_, c) => (
                <th
                  key={c}
                  className={`px-2.5 pb-1 text-center text-xs font-normal ${
                    activeCell?.col === c
                      ? "font-bold text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, r) => (
              <tr key={r}>
                <td
                  className={`pr-1.5 text-right text-xs ${
                    activeCell?.row === r
                      ? "font-bold text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {r}
                </td>
                {Array.from({ length: colCount }, (_, c) => {
                  const value = row[c];
                  const isActive = activeCell?.row === r && activeCell?.col === c;
                  const isDependency = depSet.has(`${r},${c}`);
                  const isChanged = changed.has(`${r},${c}`);
                  const isEmpty =
                    value === null || value === undefined;

                  return (
                    <td
                      key={c}
                      className={`px-2.5 py-1.5 text-center font-mono text-xs font-medium transition-colors ${
                        isActive
                          ? "rounded-md bg-primary text-primary-foreground ring-2 ring-primary/30"
                          : isDependency
                            ? "rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400"
                            : isChanged
                              ? "rounded-md bg-destructive/15 text-destructive"
                              : isEmpty
                                ? "rounded-md border border-dashed border-border/50 text-muted-foreground/40"
                                : "rounded-md border border-border/60 bg-background/70"
                      }`}
                      data-cell={`${r},${c}`}
                      title={
                        isActive
                          ? `Active cell [${r},${c}]`
                          : isDependency
                            ? `Dependency of active cell`
                            : isChanged
                              ? `Changed from ${previousTable?.[r]?.[c] ?? "?"}`
                              : `[${r},${c}] = ${value}`
                      }
                    >
                      {value !== null && value !== undefined ? String(value) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* SVG overlay for dependency arrows — only shown when there's an active cell with dependencies */}
        {activeCell && dependencies && dependencies.length > 0 && (
          <svg
            className="pointer-events-none absolute inset-0"
            style={{
              width: LABEL_COL_W + colCount * (CELL_W + CELL_GAP),
              height: HEADER_ROW_H + table.length * (CELL_H + CELL_GAP),
            }}
          >
            <defs>
              <marker
                id={arrowMarkerId}
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <path d="M0,0 L7,3.5 L0,7 Z" fill="hsl(38 92% 50% / 0.8)" />
              </marker>
            </defs>
            {dependencies.map((dep, i) => {
              // Source: dependency cell center
              const sx = LABEL_COL_W + dep.col * (CELL_W + CELL_GAP) + CELL_W / 2;
              const sy = HEADER_ROW_H + dep.row * (CELL_H + CELL_GAP) + CELL_H / 2;
              // Target: active cell center
              const tx = LABEL_COL_W + activeCell.col * (CELL_W + CELL_GAP) + CELL_W / 2;
              const ty = HEADER_ROW_H + activeCell.row * (CELL_H + CELL_GAP) + CELL_H / 2;

              // Curved bezier arrow from dependency to active
              const midX = (sx + tx) / 2;
              const midY = (sy + ty) / 2;
              const dx = tx - sx;
              const dy = ty - sy;
              // Perpendicular offset for the control point so the curve bows outward
              const bow = Math.min(Math.abs(dx + dy) * 0.15, 20);
              const cpx = midX + (dy > 0 ? bow : -bow);
              const cpy = midY + (dx > 0 ? -bow : bow);

              return (
                <path
                  key={i}
                  d={`M ${sx} ${sy} Q ${cpx} ${cpy} ${tx} ${ty}`}
                  fill="none"
                  stroke="hsl(38 92% 50% / 0.6)"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  markerEnd={`url(#${arrowMarkerId})`}
                />
              );
            })}
          </svg>
        )}
      </div>

      {activeCell && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          Computing <span className="font-mono font-semibold text-primary">{tableName ?? "dp"}[{activeCell.row}][{activeCell.col}]</span>
          {dependencies && dependencies.length > 0 && (
            <>
              {" "}from{" "}
              {dependencies.map((d, i) => (
                <span key={i}>
                  {i > 0 && " + "}
                  <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                    [{d.row}][{d.col}]
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
