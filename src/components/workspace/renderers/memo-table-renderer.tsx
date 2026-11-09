"use client";

import { motion } from "framer-motion";

/**
 * Renders a memoization cache (Map/Object) as a grid of key→value badges.
 * Each entry shows whether it was the most recently computed (`active`) and
 * whether it's new since the previous step. Designed to sit alongside the
 * recursion tree panel for top-down DP traces.
 */
export function MemoTableRenderer({
  memo,
  previousMemo,
  activeEntry,
  tableName,
}: {
  memo: Record<string, string | number | boolean | null>;
  previousMemo?: Record<string, string | number | boolean | null>;
  activeEntry?: { key: string; value: string | number | boolean | null };
  tableName?: string;
}) {
  const entries = Object.entries(memo);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[11px] font-bold uppercase text-violet-700 dark:text-violet-400">
          Memo
        </span>
        {tableName && (
          <span className="font-mono text-xs text-muted-foreground">{tableName}</span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([key, value]) => {
          const isActive = activeEntry?.key === key;
          const isNew = previousMemo === undefined || previousMemo[key] === undefined;
          const wasChanged =
            previousMemo !== undefined && previousMemo[key] !== undefined && previousMemo[key] !== value;

          return (
            <motion.div
              key={key}
              layout
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs transition-colors ${
                isActive
                  ? "border-primary bg-primary/15 text-primary-foreground ring-2 ring-primary/30"
                  : isNew
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : wasChanged
                      ? "border-destructive/40 bg-destructive/10"
                      : "border-border bg-muted/30"
              }`}
              title={
                isActive
                  ? `Most recently computed: ${key} = ${formatValue(value)}`
                  : isNew
                    ? `New entry: ${key} = ${formatValue(value)}`
                    : wasChanged
                      ? `Updated: ${key} = ${formatValue(value)} (was ${formatValue(previousMemo?.[key])})`
                      : `${key} = ${formatValue(value)} (cached)`
              }
            >
              <span className="text-muted-foreground">{key}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold">{formatValue(value)}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function formatValue(value: string | number | boolean | null | undefined): string {
  if (value === null) return "null";
  if (value === undefined) return "?";
  return String(value);
}
