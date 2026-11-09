"use client";

import { useMemo, useState } from "react";
import { diffMaps } from "@/lib/structure-diff";
import type { VariableRow } from "./structure-renderer";

const MAX_ROWS = 8;

export function MapRenderer({ row }: { row: VariableRow }) {
  const [showAll, setShowAll] = useState(false);

  const diff = useMemo(
    () =>
      diffMaps(
        row.previousValue && typeof row.previousValue === "object" && !Array.isArray(row.previousValue)
          ? (row.previousValue as Record<string, unknown>)
          : undefined,
        row.value && typeof row.value === "object" && !Array.isArray(row.value)
          ? (row.value as Record<string, unknown>)
          : undefined,
      ),
    [row],
  );

  const current = (row.value && typeof row.value === "object" && !Array.isArray(row.value)
    ? (row.value as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const addedKeys = new Set(diff.added.map(([key]) => key));
  const updatedKeys = new Set(diff.updated.map(([key]) => key));
  const removedKeys = new Set(diff.removed.map(([key]) => key));

  const entries = Object.entries(current);
  const removedEntries = diff.removed;
  const allRows: Array<{ key: string; value: unknown; state: "added" | "updated" | "removed" | "same" }> = [
    ...removedEntries.map(([key, value]) => ({ key, value, state: "removed" as const })),
    ...entries.map(([key, value]) => {
      if (addedKeys.has(key)) return { key, value, state: "added" as const };
      if (updatedKeys.has(key)) return { key, value, state: "updated" as const };
      return { key, value, state: "same" as const };
    }),
  ];

  const total = allRows.length;
  const visible = showAll ? allRows : allRows.slice(0, MAX_ROWS);
  const truncated = total > MAX_ROWS && !showAll;

  if (total === 0) {
    return <span className="font-mono text-[11px] text-muted-foreground/70">(empty)</span>;
  }

  return (
    <div className="max-w-full overflow-hidden rounded-md border border-border/70">
      <div className="flex bg-muted/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="w-1/2">Key</span>
        <span className="w-1/2">Value</span>
      </div>
      <div className="max-h-40 overflow-auto">
        {visible.map(({ key, value, state }) => (
          <div
            key={state + key}
            className={`flex items-center border-t border-border/50 px-2 py-0.5 font-mono text-[11px] leading-4 ${
              state === "added"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : state === "updated"
                  ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                  : state === "removed"
                    ? "opacity-60"
                    : "text-foreground/85"
            }`}
          >
            <span className={`w-1/2 truncate ${state === "removed" ? "line-through text-red-500" : ""}`}>
              {state === "added" ? "+" : state === "removed" ? "−" : ""}
              {formatKey(key)}
            </span>
            <span className={`w-1/2 truncate ${state === "removed" ? "line-through text-red-500" : ""}`}>
              {formatCell(value)}
            </span>
            {state !== "same" ? (
              <span
                className={`ml-auto shrink-0 text-[9px] ${
                  state === "added" ? "text-emerald-500" : state === "updated" ? "text-cyan-400" : "text-red-500"
                }`}
              >
                {state === "added" ? "added" : state === "updated" ? "← updated" : "removed"}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {truncated ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full border-t border-border/50 px-2 py-0.5 text-left text-[10px] text-cyan-500 transition-colors hover:bg-cyan-500/10"
        >
          view all {total} entries
        </button>
      ) : null}
    </div>
  );
}

function formatKey(key: string): string {
  if (/^-?\d+$/.test(key)) return key;
  return key.length > 12 ? `"${key.slice(0, 11)}…"` : `"${key}"`;
}

function formatCell(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value.length > 18 ? `"${value.slice(0, 17)}…"` : `"${value}"`;
  return String(value);
}
