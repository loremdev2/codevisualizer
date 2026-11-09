"use client";

import { useMemo } from "react";
import { uniqueAdditions, uniqueRemovals } from "@/lib/structure-diff";
import type { VariableRow } from "./structure-renderer";

const MAX_CHIPS = 18;

export function SetRenderer({ row }: { row: VariableRow }) {
  const items = useMemo(() => (Array.isArray(row.value) ? (row.value as unknown[]) : []), [row.value]);
  const added = useMemo(
    () => uniqueAdditions(Array.isArray(row.previousValue) ? (row.previousValue as unknown[]) : undefined, items),
    [row.previousValue, items],
  );
  const removed = useMemo(
    () => uniqueRemovals(Array.isArray(row.previousValue) ? (row.previousValue as unknown[]) : undefined, items),
    [row.previousValue, items],
  );

  const addedSet = new Set(added.map(identity));
  const removedSet = new Set(removed.map(identity));
  const visible = items.slice(0, MAX_CHIPS);
  const truncated = items.length > MAX_CHIPS;

  return (
    <div>
      <div className="flex max-w-full flex-wrap gap-1">
        {visible.map((item, index) => {
          const isAdded = addedSet.has(identity(item));
          const chipClass = isAdded
            ? "border-emerald-500/70 bg-emerald-500/15 text-emerald-400"
            : "border-border bg-background text-foreground/85";
          return (
            <span
              key={identity(item) + index}
              className={`rounded-full border px-2 py-px font-mono text-[10.5px] leading-4 transition-colors ${chipClass}`}
            >
              {isAdded ? "+" : ""}
              {formatItem(item)}
            </span>
          );
        })}
        {truncated ? (
          <span className="rounded-full border border-dashed border-border px-2 py-px font-mono text-[10.5px] leading-4 text-muted-foreground/70">
            +{items.length - MAX_CHIPS}
          </span>
        ) : null}
      </div>
      {added.length > 0 ? (
        <div className="mt-1 font-mono text-[9.5px] text-emerald-500">↑ inserted {added.map(formatItem).join(", ")}</div>
      ) : null}
      {removed.length > 0 ? (
        <div className="mt-1 font-mono text-[9.5px] text-red-400">− removed {removed.map(formatItem).join(", ")}</div>
      ) : null}
    </div>
  );
}

function identity(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatItem(item: unknown): string {
  if (item === null) return "null";
  if (typeof item === "string") return item.length > 8 ? item.slice(0, 7) + "…" : item;
  return String(item);
}
