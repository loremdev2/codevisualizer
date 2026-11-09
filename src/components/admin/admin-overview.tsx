"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  MessageSquare,
} from "lucide-react";

import { API } from "@/lib/api-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORY_META: Record<string, { label: string; bar: string }> = {
  bug: { label: "Bug report", bar: "bg-red-500" },
  idea: { label: "Feature idea", bar: "bg-amber-500" },
  confusing: { label: "Confusing", bar: "bg-violet-500" },
  praise: { label: "Praise", bar: "bg-emerald-500" },
  other: { label: "Other", bar: "bg-slate-500" },
};

function topEntries(map: Map<string, number>, limit: number): Array<[string, number]> {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

type FeedbackRow = {
  id: string;
  category: string;
  status: string | null;
  created_at: string;
  code: string | null;
  image_url: string | null;
  email: string | null;
  user_id: string | null;
  page_url: string | null;
  algorithm: string | null;
  language: string | null;
};

export function AdminOverview() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Clock captured once at mount via a lazy initializer — reading
  // Date.now() during render is impure (React Compiler rule). The metric
  // window is per-mount, which is fine for a dashboard that remounts on
  // each visit.
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    void fetch(API.admin.dashboard, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setRows(data.feedback ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    let newCount = 0;
    let resolved = 0;
    let last7d = 0;
    let withCode = 0;
    let withScreenshot = 0;
    let withEmail = 0;
    let signedIn = 0;
    const categories: Record<string, number> = {};
    const pages = new Map<string, number>();
    const algorithms = new Map<string, number>();
    const languages = new Map<string, number>();

    for (const row of rows) {
      if ((row.status ?? "new") === "new") newCount++;
      if (row.status === "resolved") resolved++;
      const created = new Date(row.created_at).getTime();
      if (!Number.isNaN(created) && created >= weekAgo) last7d++;
      if (row.code) withCode++;
      if (row.image_url) withScreenshot++;
      if (row.email) withEmail++;
      if (row.user_id) signedIn++;
      categories[row.category] = (categories[row.category] ?? 0) + 1;
      if (row.page_url) pages.set(row.page_url, (pages.get(row.page_url) ?? 0) + 1);
      if (row.algorithm) algorithms.set(row.algorithm, (algorithms.get(row.algorithm) ?? 0) + 1);
      if (row.language) languages.set(row.language, (languages.get(row.language) ?? 0) + 1);
    }

    return {
      total: rows.length,
      newCount,
      resolved,
      last7d,
      withCode,
      withScreenshot,
      withEmail,
      signedIn,
      anonymous: rows.length - signedIn,
      categories,
      pages: topEntries(pages, 5),
      algorithms: topEntries(algorithms, 5),
      languages: topEntries(languages, 5),
    };
  }, [rows]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-medium tracking-normal">Overview</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Key metrics and category breakdowns for feedback submissions.
        </p>
      </div>

      {/* Metric cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total submissions",
            value: metrics.total,
            icon: Inbox,
            tint: "bg-primary/10 text-primary",
          },
          {
            label: "New / unread",
            value: metrics.newCount,
            icon: Mail,
            tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          },
          {
            label: "Resolved",
            value: metrics.resolved,
            icon: CheckCircle2,
            tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Last 7 days",
            value: metrics.last7d,
            icon: Clock,
            tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
          },
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
      </section>

      {/* Breakdowns */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">By category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const count = metrics.categories[key] ?? 0;
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Actionability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "With code attached", value: metrics.withCode },
              { label: "With screenshot", value: metrics.withScreenshot },
              { label: "With reply email", value: metrics.withEmail },
              { label: "Signed-in users", value: metrics.signedIn },
              { label: "Anonymous", value: metrics.anonymous },
            ].map((signal) => (
              <div key={signal.label} className="flex items-center gap-2 text-xs">
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {signal.label}
                </span>
                <span className="tabular-nums font-medium">{signal.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
