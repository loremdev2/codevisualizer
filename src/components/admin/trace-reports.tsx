"use client";

import { useMemo, useState } from "react";
import {
  Bug,
  Check,
  ChevronDown,
  Clock,
  Code2,
  Copy,
  Flag,
  Hash,
  Inbox,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type TraceReportRow = {
  id: string;
  code_hash: string;
  input_hash: string | null;
  language: string | null;
  template: string | null;
  outcome: string | null;
  error: string | null;
  note: string | null;
  created_at: string;
};

const OUTCOME_META: Record<string, { label: string; bar: string; chip: string }> = {
  success: {
    label: "Success",
    bar: "bg-emerald-500",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  zero_steps: {
    label: "Zero steps",
    bar: "bg-amber-500",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  step_limit: {
    label: "Step limit",
    bar: "bg-orange-500",
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  timeout: {
    label: "Timeout",
    bar: "bg-red-500",
    chip: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  error: {
    label: "Error",
    bar: "bg-rose-500",
    chip: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  instrument_error: {
    label: "Instrument error",
    bar: "bg-violet-500",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
};

// Deterministic across server/client render (avoids hydration mismatches).
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

function shortHash(hash: string): string {
  return hash.length > 12 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash;
}

/**
 * "This trace was wrong" reports, grouped by code hash so the same broken
 * snippet shows up as one group. The reports only carry hashes + run context
 * (never the raw source) — a report tells you *which* code failed and *how*,
 * and the feedback form remains the place for full code.
 */
export function TraceReportsSection({ reports }: { reports: TraceReportRow[] }) {
  const [query, setQuery] = useState("");
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const outcomeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const report of reports) {
      const key = report.outcome ?? "unknown";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [reports]);

  const metrics = useMemo(() => {
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    let last7d = 0;
    const hashes = new Set<string>();
    for (const report of reports) {
      hashes.add(report.code_hash);
      const created = new Date(report.created_at).getTime();
      if (!Number.isNaN(created) && created >= weekAgo) last7d++;
    }
    return { total: reports.length, uniqueHashes: hashes.size, last7d };
  }, [reports, now]);

  const groups = useMemo(() => {
    const byHash = new Map<string, TraceReportRow[]>();
    for (const report of reports) {
      const list = byHash.get(report.code_hash) ?? [];
      list.push(report);
      byHash.set(report.code_hash, list);
    }
    return Array.from(byHash.entries())
      .map(([hash, rows]) => {
        const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
        return {
          hash,
          rows: sorted,
          count: sorted.length,
          latest: sorted[0].created_at,
          outcomes: Array.from(
            new Set(sorted.map((row) => row.outcome).filter((o): o is string => Boolean(o))),
          ),
          languages: Array.from(
            new Set(sorted.map((row) => row.language).filter((l): l is string => Boolean(l))),
          ),
        };
      })
      .sort((a, b) => b.latest.localeCompare(a.latest));
  }, [reports]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (group) =>
        group.hash.toLowerCase().includes(q) ||
        group.languages.some((language) => language.toLowerCase().includes(q)) ||
        group.rows.some((row) => (row.template ?? "").toLowerCase().includes(q)),
    );
  }, [groups, query]);

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      window.setTimeout(() => setCopiedHash(null), 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
          <Flag className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-medium">Trace reports</h2>
          <p className="text-xs text-muted-foreground">
            One-click &quot;This trace was wrong&quot; flags, grouped by code hash. Reports carry
            hashes and run context only — never the raw source.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/30 p-10 text-center">
          <Inbox className="mx-auto h-9 w-9 text-muted-foreground" />
          <h3 className="mt-3 text-base font-medium">No trace reports yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When a user clicks &quot;Wrong trace?&quot; in the visualizer, the report lands here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[
              { label: "Total reports", value: metrics.total, icon: Flag, tint: "bg-red-500/10 text-red-600 dark:text-red-400" },
              { label: "Unique code hashes", value: metrics.uniqueHashes, icon: Hash, tint: "bg-primary/10 text-primary" },
              { label: "Last 7 days", value: metrics.last7d, icon: Clock, tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-xl border bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {card.label}
                    </p>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${card.tint}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">By outcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {Object.entries(OUTCOME_META).map(([key, meta]) => {
                const count = outcomeCounts[key] ?? 0;
                const pct = metrics.total ? Math.round((count / metrics.total) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.bar}`} />
                        {meta.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${meta.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by code hash, language, or template…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card/30 p-8 text-center text-sm text-muted-foreground">
              No reports match that search.
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-muted-foreground">
                {filtered.length} unique {filtered.length === 1 ? "code" : "codes"} ·{" "}
                {filtered.reduce((sum, group) => sum + group.count, 0)} reports
              </p>
              {filtered.map((group) => {
                const expanded = expandedHash === group.hash;
                return (
                  <div key={group.hash} className="overflow-hidden rounded-xl border bg-card">
                    <button
                      type="button"
                      onClick={() => setExpandedHash(expanded ? null : group.hash)}
                      aria-expanded={expanded}
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                        <Bug className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <code className="truncate font-mono text-sm font-medium">{shortHash(group.hash)}</code>
                          <span
                            role="button"
                            tabIndex={0}
                            className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="Copy full code hash"
                            title={group.hash}
                            onClick={(event) => {
                              event.stopPropagation();
                              void copyHash(group.hash);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.stopPropagation();
                                void copyHash(group.hash);
                              }
                            }}
                          >
                            {copiedHash === group.hash ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                          <span className="tabular-nums">{formatDate(group.latest)}</span>
                          <span>· {group.count} {group.count === 1 ? "report" : "reports"}</span>
                          {group.languages.length ? (
                            <span className="flex items-center gap-0.5">
                              <Code2 className="h-3 w-3" />
                              {group.languages.join(", ")}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <span className="hidden gap-1 sm:flex">
                        {group.outcomes.slice(0, 3).map((outcome) => {
                          const meta = OUTCOME_META[outcome] ?? OUTCOME_META.error;
                          return (
                            <Badge key={outcome} className={meta.chip}>
                              {meta.label}
                            </Badge>
                          );
                        })}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expanded ? (
                      <div className="space-y-3 border-t border-border/70 px-4 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Hash className="h-3.5 w-3.5 shrink-0" />
                          <code className="break-all font-mono">{group.hash}</code>
                        </div>
                        {group.rows.map((report) => {
                          const meta = OUTCOME_META[report.outcome ?? "error"] ?? OUTCOME_META.error;
                          return (
                            <div key={report.id} className="rounded-lg border border-border/70 bg-muted/30 p-3">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                                <span className="tabular-nums">{formatDate(report.created_at)}</span>
                                {report.language ? <span>· {report.language}</span> : null}
                                {report.template ? <span>· {report.template}</span> : null}
                                <Badge className={meta.chip}>{meta.label}</Badge>
                              </div>
                              {report.input_hash ? (
                                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                  <Hash className="h-3 w-3 shrink-0" />
                                  <code className="truncate font-mono">{shortHash(report.input_hash)}</code>
                                  <span>· input</span>
                                </p>
                              ) : null}
                              {report.error ? (
                                <p className="mt-1.5 whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-red-600 dark:text-red-400">
                                  {report.error}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
