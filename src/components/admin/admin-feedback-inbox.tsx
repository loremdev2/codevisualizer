"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Braces,
  Bug,
  CheckCircle2,
  ChevronDown,
  Code2,
  HelpCircle,
  Image as ImageIcon,
  Inbox,
  Lightbulb,
  ListOrdered,
  Mail,
  MailOpen,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { API } from "@/lib/api-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`;
}

export function AdminFeedbackInbox() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-10 w-full max-w-md animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-medium tracking-normal">Feedback Inbox</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review what users are telling you, triage it, and keep an eye on the metrics.
        </p>
      </div>

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
            const count = rows.filter((r) => r.category === key).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(active ? "all" : key)}
                className={chipClass(active)}
                aria-pressed={active}
              >
                {meta.label} · {count}
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
    </div>
  );
}
