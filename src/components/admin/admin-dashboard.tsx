"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Braces,
  Bug,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Inbox,
  Lightbulb,
  ListOrdered,
  Mail,
  MailOpen,
  MapPin,
  MessageSquare,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  UserX,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { AuthControls } from "@/components/auth-controls";
import { API } from "@/lib/api-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { TraceReportsSection, type TraceReportRow } from "@/components/admin/trace-reports";
import {
  AiUsageSection,
  type AiUsageSectionData,
} from "@/components/admin/ai-usage-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
export type FeedbackRow = {
  id: string;
  user_id: string | null;
  category: string;
  message: string;
  email: string | null;
  page_url: string | null;
  algorithm: string | null;
  language: string | null;
  image_url: string | null;
  code: string | null;
  input_text: string | null;
  step_index: number | null;
  step_count: number | null;
  result_text: string | null;
  expected_text: string | null;
  verdict: string | null;
  status: string | null;
  created_at: string;
};

const CATEGORY_META: Record<
  string,
  { label: string; icon: LucideIcon; bar: string; chip: string }
> = {
  bug: {
    label: "Bug report",
    icon: Bug,
    bar: "bg-red-500",
    chip: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  },
  idea: {
    label: "Feature idea",
    icon: Lightbulb,
    bar: "bg-amber-500",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  confusing: {
    label: "Confusing",
    icon: HelpCircle,
    bar: "bg-violet-500",
    chip: "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  praise: {
    label: "Praise",
    icon: Sparkles,
    bar: "bg-emerald-500",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  other: {
    label: "Other",
    icon: MessageSquare,
    bar: "bg-slate-500",
    chip: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
};

const STATUS_META: Record<string, { label: string; chip: string }> = {
  new: {
    label: "New",
    chip: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  read: {
    label: "Read",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  resolved: {
    label: "Resolved",
    chip: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

function topEntries(map: Map<string, number>, limit: number): Array<[string, number]> {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

// Deterministic across server/client render (avoids hydration mismatches).
function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

/**
 * Admin feedback inbox. Renders metrics computed from the fetched rows, a
 * filterable list of submissions, and inline status actions (new → read →
 * resolved) that go through the normal RLS-gated API.
 */
export function AdminDashboard({
  feedback,
  traceReports,
  aiUsage,
}: {
  feedback: FeedbackRow[];
  traceReports: TraceReportRow[];
  aiUsage: AiUsageSectionData;
}) {
  const [rows, setRows] = useState<FeedbackRow[]>(feedback);
  // Reference "now" captured once on mount (kept out of the render body so
  // the metrics memo stays pure; the 7-day window is relative to page load).
  const [now] = useState(() => Date.now());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      if (row.algorithm)
        algorithms.set(row.algorithm, (algorithms.get(row.algorithm) ?? 0) + 1);
      if (row.language)
        languages.set(row.language, (languages.get(row.language) ?? 0) + 1);
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
  }, [rows, now]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      const status = row.status ?? "new";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (!query) return true;
      return (
        row.message.toLowerCase().includes(query) ||
        (row.email ?? "").toLowerCase().includes(query) ||
        (row.algorithm ?? "").toLowerCase().includes(query) ||
        (row.language ?? "").toLowerCase().includes(query) ||
        (row.page_url ?? "").toLowerCase().includes(query)
      );
    });
  }, [rows, searchQuery, statusFilter, categoryFilter]);

  const updateStatus = async (id: string, status: string) => {
    const previous = rows.find((row) => row.id === id);
    setUpdatingId(id);
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    const response = await fetch(API.admin.feedback(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingId(null);
    if (!response.ok && previous) {
      setRows((prev) =>
        prev.map((row) => (row.id === previous.id ? { ...row, status: previous.status } : row)),
      );
    }
  };

  const chipClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
      active
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border bg-card text-muted-foreground hover:text-foreground"
    }`;

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="inline-flex items-center gap-2 hover:opacity-85">
                <Badge variant="secondary" className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Badge>
                <h1 className="text-2xl font-medium tracking-normal sm:text-3xl">
                  Feedback inbox
                </h1>
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Review what users are telling you, triage it, and keep an eye on the metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/visualizer">
                <Play className="h-4 w-4" />
                Visualizer
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <AuthControls />
            <ThemeToggle />
          </div>
        </header>

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
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
              <CardTitle className="text-sm font-semibold">Top pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.pages.length === 0 ? (
                <p className="text-xs text-muted-foreground">No page data yet.</p>
              ) : (
                metrics.pages.map(([page, count], index) => (
                  <div key={page} className="flex items-center gap-2 text-xs">
                    <span className="w-4 shrink-0 text-right tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <code className="min-w-0 flex-1 truncate font-mono text-foreground/80">
                      {page}
                    </code>
                    <Badge variant="secondary" className="tabular-nums">
                      {count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Top algorithms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.algorithms.length === 0 ? (
                <p className="text-xs text-muted-foreground">No algorithm data yet.</p>
              ) : (
                metrics.algorithms.map(([algorithm, count], index) => (
                  <div key={algorithm} className="flex items-center gap-2 text-xs">
                    <span className="w-4 shrink-0 text-right tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <Braces className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">{algorithm}</span>
                    <Badge variant="secondary" className="tabular-nums">
                      {count}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Actionability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "With code attached", value: metrics.withCode, icon: Code2 },
                { label: "With screenshot", value: metrics.withScreenshot, icon: ImageIcon },
                { label: "With reply email", value: metrics.withEmail, icon: Mail },
                { label: "Signed-in users", value: metrics.signedIn, icon: User },
                { label: "Anonymous", value: metrics.anonymous, icon: UserX },
              ].map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.label} className="flex items-center gap-2 text-xs">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {signal.label}
                    </span>
                    <span className="tabular-nums font-medium">{signal.value}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Filters */}
        <section className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages, emails, algorithms…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { value: "all", label: "All" },
                { value: "new", label: "New" },
                { value: "read", label: "Read" },
                { value: "resolved", label: "Resolved" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={chipClass(statusFilter === option.value)}
                  aria-pressed={statusFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={chipClass(categoryFilter === "all")}
              aria-pressed={categoryFilter === "all"}
            >
              All categories
            </button>
            {Object.entries(CATEGORY_META).map(([key, meta]) => {
              const active = categoryFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategoryFilter(active ? "all" : key)}
                  className={chipClass(active)}
                  aria-pressed={active}
                >
                  {meta.label} · {metrics.categories[key] ?? 0}
                </button>
              );
            })}
          </div>
        </section>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/30 p-12 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">
              {rows.length === 0 ? "No feedback yet" : "Nothing matches"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows.length === 0
                ? "Submissions from the feedback form will appear here."
                : "Try a different filter or search query."}
            </p>
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <section className="space-y-2.5">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {rows.length} submissions
            </p>
            {filtered.map((row) => {
              const category = CATEGORY_META[row.category] ?? CATEGORY_META.other;
              const status = STATUS_META[row.status ?? "new"] ?? STATUS_META.new;
              const CategoryIcon = category.icon;
              const expanded = expandedId === row.id;
              return (
                <div key={row.id} className="overflow-hidden rounded-xl border bg-card">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : row.id)}
                    aria-expanded={expanded}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-accent/40"
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${category.chip}`}
                    >
                      <CategoryIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{row.message}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="tabular-nums">{formatDate(row.created_at)}</span>
                        {row.algorithm ? <span>· {row.algorithm}</span> : null}
                        {row.language ? <span>· {row.language}</span> : null}
                        {row.email ? (
                          <span className="flex items-center gap-0.5">
                            <Mail className="h-3 w-3" />
                            {row.email}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <Badge className={status.chip}>{status.label}</Badge>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expanded ? (
                    <div className="space-y-4 border-t border-border/70 px-4 py-4">
                      <p className="whitespace-pre-wrap text-sm leading-6">{row.message}</p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {row.email ? (
                          <div className="flex items-center gap-2 text-xs">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <a
                              href={`mailto:${row.email}`}
                              className="truncate font-medium text-primary hover:underline"
                            >
                              {row.email}
                            </a>
                          </div>
                        ) : null}
                        {row.page_url ? (
                          <div className="flex items-center gap-2 text-xs">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <code className="truncate font-mono">{row.page_url}</code>
                          </div>
                        ) : null}
                        {row.algorithm ? (
                          <div className="flex items-center gap-2 text-xs">
                            <Braces className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">{row.algorithm}</span>
                          </div>
                        ) : null}
                        {row.language ? (
                          <div className="flex items-center gap-2 text-xs">
                            <Code2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">{row.language}</span>
                          </div>
                        ) : null}
                        {row.step_count ? (
                          <div className="flex items-center gap-2 text-xs">
                            <ListOrdered className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">
                              step {row.step_index ?? 1} of {row.step_count}
                            </span>
                          </div>
                        ) : null}
                        {row.verdict ? (
                          <div className="flex items-center gap-2 text-xs">
                            {row.verdict === "pass" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                            )}
                            <span className="truncate font-medium">
                              {row.verdict === "pass" ? "Run passed" : "Run failed"}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {row.code ? (
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Code
                          </p>
                          <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-5">
                            {row.code}
                          </pre>
                        </div>
                      ) : null}

                      {row.input_text ? (
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Input
                          </p>
                          <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-5">
                            {row.input_text}
                          </pre>
                        </div>
                      ) : null}

                      {row.result_text || row.expected_text ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {row.expected_text ? (
                            <div>
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                Expected
                              </p>
                              <pre className="max-h-32 overflow-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-5">
                                {row.expected_text}
                              </pre>
                            </div>
                          ) : null}
                          {row.result_text ? (
                            <div>
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                Actual result
                              </p>
                              <pre className="max-h-32 overflow-auto rounded-lg border border-border bg-muted/50 p-3 font-mono text-[11px] leading-5">
                                {row.result_text}
                              </pre>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {row.image_url ? (
                        <div>
                          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            Screenshot
                          </p>
                          {/* eslint-disable-next-line @next/next/no-img-element -- external storage URL */}
                          <img
                            src={row.image_url}
                            alt="Feedback screenshot"
                            className="max-h-72 rounded-lg border border-border object-contain"
                          />
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
                        <span className="text-[11px] text-muted-foreground">
                          {row.user_id ? "Signed-in submission" : "Anonymous submission"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {row.status !== "read" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              disabled={updatingId === row.id}
                              onClick={() => updateStatus(row.id, "read")}
                            >
                              <MailOpen className="h-3.5 w-3.5" />
                              Mark read
                            </Button>
                          ) : null}
                          {row.status !== "resolved" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-emerald-600 dark:text-emerald-400"
                              disabled={updatingId === row.id}
                              onClick={() => updateStatus(row.id, "resolved")}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Resolve
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        )}

        {/* AI translation spend — cache, per-user usage, rate-limit denials */}
        <div className="border-t pt-6">
          <AiUsageSection data={aiUsage} />
        </div>

        {/* Trace reports — bad-trace flags grouped by code hash */}
        <div className="border-t pt-6">
          <TraceReportsSection reports={traceReports} />
        </div>
      </div>
    </main>
  );
}
