"use client";

import { useMemo } from "react";
import { uniqueAdditions, uniqueRemovals } from "@/lib/structure-diff";
import type { VariableRow } from "./structure-renderer";

const MAX_ITEMS = 10;

export function StackRenderer({ row }: { row: VariableRow }) {
  const items = useMemo(() => (Array.isArray(row.value) ? (row.value as unknown[]) : []), [row.value]);
  const additions = useMemo(
    () => uniqueAdditions(Array.isArray(row.previousValue) ? (row.previousValue as unknown[]) : undefined, items),
    [row.previousValue, items],
  );
  const removals = useMemo(
    () => uniqueRemovals(Array.isArray(row.previousValue) ? (row.previousValue as unknown[]) : undefined, items),
    [row.previousValue, items],
  );

  const visible = items.slice(0, MAX_ITEMS);
  const truncated = items.length > MAX_ITEMS;
  const top = visible[0];
  const pushed = additions.length > 0 && additions.some((item) => same(item, top));

  return (
    <div className="inline-block">
      <div className="min-w-[72px] overflow-hidden rounded-md border border-border/80">
        {pushed ? (
          <div className="border-b border-emerald-500/60 bg-emerald-500/15 px-3 py-0.5 text-center font-mono text-[11px] text-emerald-500">
            {formatItem(top)} <span className="text-[8.5px]">← pushed</span>
          </div>
        ) : null}
        {visible.map((item, index) => (
          <div
            key={index}
            className={`px-3 py-0.5 text-center font-mono text-[11px] leading-4 ${
              index === 0 && !pushed
                ? "border border-violet-500/60 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                : "border-t border-border/60 bg-background text-foreground/85"
            }`}
          >
            {formatItem(item)}
          </div>
        ))}
        {truncated ? (
          <div className="border-t border-border/60 px-3 py-0.5 text-center text-[9px] text-muted-foreground/60">
            +{items.length - MAX_ITEMS} more
          </div>
        ) : null}
      </div>
      <div className="mt-0.5 text-center text-[8.5px] font-semibold uppercase tracking-widest text-violet-400/80">
        top
      </div>
      {removals.length > 0 && items.length < (Array.isArray(row.previousValue) ? (row.previousValue as unknown[]).length : 0) ? (
        <div className="mt-0.5 text-center font-mono text-[9px] text-red-400/80">popped {removals.map(formatItem).join(", ")}</div>
      ) : null}
    </div>
  );
}

export function QueueRenderer({ row }: { row: VariableRow }) {
  const items = useMemo(() => (Array.isArray(row.value) ? (row.value as unknown[]) : []), [row.value]);
  const additions = useMemo(
    () => uniqueAdditions(Array.isArray(row.previousValue) ? (row.previousValue as unknown[]) : undefined, items),
    [row.previousValue, items],
  );
  const removals = useMemo(
    () => uniqueRemovals(Array.isArray(row.previousValue) ? (row.previousValue as unknown[]) : undefined, items),
    [row.previousValue, items],
  );

  const visible = items.slice(0, MAX_ITEMS);
  const truncated = items.length > MAX_ITEMS;
  const front = visible[0];
  const rear = visible[visible.length - 1];
  const enqueued = additions.length > 0 && additions.some((item) => same(item, rear));

  return (
    <div className="inline-block">
      <div className="flex gap-1">
        {visible.map((item, index) => {
          const isFront = index === 0;
          const isRear = index === visible.length - 1;
          const cellClass = isFront && removals.length > 0
            ? "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-300"
            : enqueued && isRear
              ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400"
              : "border-border bg-background text-foreground/85";
          return (
            <span
              key={index}
              className={`flex min-w-8 items-center justify-center rounded-[5px] border px-1.5 py-0.5 font-mono text-[11px] leading-4 ${cellClass}`}
            >
              {formatItem(item)}
            </span>
          );
        })}
        {truncated ? <span className="flex items-center text-[9px] text-muted-foreground/60">+{items.length - MAX_ITEMS}</span> : null}
      </div>
      <div className="mt-0.5 flex justify-between text-[8.5px] font-semibold uppercase tracking-widest">
        <span className={removals.length > 0 ? "text-red-400" : "text-sky-400/80"}>
          front{removals.length > 0 ? " ↓" : ""}
        </span>
        <span className={enqueued ? "text-emerald-500" : "text-muted-foreground/60"}>
          {enqueued ? "enqueued →" : "rear"}
        </span>
      </div>
    </div>
  );
}

function same(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

function formatItem(item: unknown): string {
  if (item === null) return "null";
  if (typeof item === "string") return item.length > 6 ? item.slice(0, 5) + "…" : item;
  return String(item);
}
