"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Clock,
  Coins,
  Database,
  Gauge,
  Sparkles,
  TimerReset,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type AiUsageRow = {
  userId: string;
  email: string | null;
  /** Translations in the last 7 days (from day buckets, so hour buckets aren't double counted). */
  total: number;
  lastActive: string;
};

export type AiDenialRow = {
  id: string;
  userId: string;
  email: string | null;
  bucketType: string;
  count: number;
  retryAfterSeconds: number;
  createdAt: string;
};

export type AiUsageSectionData = {
  cacheRows: number;
  cacheHits: number;
  /** LLM calls since the 7-day window, including guest TS fallbacks (exact spend). */
  llmCalls: number;
  /** Guest TypeScript-fallback translations in the same window (subset of llmCalls). */
  guestCalls: number;
  denials24h: number;
  denials7d: number;
  /** Current env-configured limits (0 = unlimited). */
  hourlyLimit: number;
  dailyLimit: number;
  usageByUser: AiUsageRow[];
  denials: AiDenialRow[];
};

// Deterministic across server/client render (avoids hydration mismatches).
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * AI translation spend — the only paid part of the pipeline. Shows the server
 * cache's effectiveness, per-user usage, and rate-limit denials so the budget
 * stays visible: which users burn the most, how much caching saves, and who
 * is being stopped.
 */
export function AiUsageSection({ data }: { data: AiUsageSectionData }) {
  // Reference "now" captured once on mount (kept out of the render body so
  // the metrics memo stays pure; windows are relative to page load).
  const [now] = useState(() => Date.now());

  const metrics = useMemo(() => {
    const totalRequests = data.cacheHits + data.llmCalls;
    return {
      hitRate: totalRequests > 0 ? data.cacheHits / totalRequests : 0,
      unlimited: data.hourlyLimit === 0 || data.dailyLimit === 0,
    };
  }, [data]);

  const cards = [
    {
      label: "Cache rows",
      value: data.cacheRows,
      icon: Database,
      tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      hint: "Distinct translations stored",
    },
    {
      label: "Cache hits",
      value: data.cacheHits,
      icon: Sparkles,
      tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      hint: "Served without an LLM call",
    },
    {
      label: "LLM calls · 7d",
      value: data.llmCalls,
      icon: Coins,
      tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      hint:
        data.guestCalls > 0
          ? `Paid translations · ${data.guestCalls} guest TS fallback`
          : "Paid translations · incl. guest TS fallbacks",
    },
    {
      label: "Cache hit rate",
      value: metrics.hitRate > 0 ? percent(metrics.hitRate) : "—",
      icon: Gauge,
      tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      hint: "hits ÷ (hits + LLM calls)",
    },
    {
      label: "Denials · 24h",
      value: data.denials24h,
      icon: Ban,
      tint: "bg-red-500/10 text-red-600 dark:text-red-400",
      hint: "429 rate-limit rejections",
    },
    {
      label: "Denials · 7d",
      value: data.denials7d,
      icon: TimerReset,
      tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      hint: "429 rate-limit rejections",
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Coins className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-medium">AI translation spend</h2>
          <p className="text-xs text-muted-foreground">
            The only paid part of the pipeline. Cache stats, per-user usage, and rate-limit
            denials — current limits: {data.hourlyLimit || "∞"}/hour · {data.dailyLimit || "∞"}
            /day.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card px-4 py-3" title={card.hint}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${card.tint}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">{card.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Per-user usage (7 days) */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Top users · last 7 days</h3>
            {metrics.unlimited ? (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                unlimited
              </Badge>
            ) : null}
          </div>
          {data.usageByUser.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No translation usage yet.
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {data.usageByUser.map((row, index) => (
                <div key={row.userId} className="flex items-center gap-2.5 px-4 py-2.5 text-xs">
                  <span className="w-5 shrink-0 text-right tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {row.email ?? shortId(row.userId)}
                  </span>
                  <span className="tabular-nums text-muted-foreground" title={`Last active ${formatDate(row.lastActive)}`}>
                    {row.total} translations
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent denials */}
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
            <Ban className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Recent rate-limit denials</h3>
            <Badge variant="secondary" className="ml-auto text-[10px] tabular-nums">
              {data.denials7d} in 7d
            </Badge>
          </div>
          {data.denials.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No one has hit the translation limit yet.
            </p>
          ) : (
            <div className="max-h-96 divide-y divide-border/60 overflow-auto">
              {data.denials.map((denial) => (
                <div key={denial.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-4 py-2.5 text-xs">
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {denial.email ?? shortId(denial.userId)}
                  </span>
                  <span className="flex items-center gap-1 tabular-nums text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatDate(denial.createdAt)}
                  </span>
                  <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
                    {denial.bucketType} · {denial.count} used
                  </Badge>
                  <span className="tabular-nums text-muted-foreground">
                    retry {Math.ceil(denial.retryAfterSeconds / 60)}m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
