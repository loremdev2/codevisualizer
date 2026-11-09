"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Layers,
  Play,
  Route,
  Search,
  Shuffle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// A curated preview of the Learn page for the homepage: shows the three
// question banks, the check/uncheck interaction, and progress tracking.
// Uses static mock data to avoid loading the full question lists.
// ---------------------------------------------------------------------------

const MOCK_TOPICS = [
  {
    id: "arrays-hashing",
    title: "Arrays & Hashing",
    questions: [
      { no: 1, title: "Two Sum", difficulty: "Easy" as const, checked: true },
      { no: 49, title: "Group Anagrams", difficulty: "Medium" as const, checked: true },
      { no: 128, title: "Longest Consecutive Sequence", difficulty: "Medium" as const, checked: false },
      { no: 238, title: "Product of Array Except Self", difficulty: "Medium" as const, checked: false },
    ],
  },
  {
    id: "two-pointers",
    title: "Two Pointers",
    questions: [
      { no: 125, title: "Valid Palindrome", difficulty: "Easy" as const, checked: true },
      { no: 15, title: "3Sum", difficulty: "Medium" as const, checked: false },
      { no: 11, title: "Container With Most Water", difficulty: "Medium" as const, checked: false },
    ],
  },
];

const SORTING_ALGORITHMS = [
  { name: "Bubble Sort", category: "Comparison", complexity: "O(n²)" },
  { name: "Merge Sort", category: "Divide & Conquer", complexity: "O(n log n)" },
  { name: "Quick Sort", category: "Divide & Conquer", complexity: "O(n log n)" },
];

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Hard: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function LearnPreview() {
  const [activeTab, setActiveTab] = useState<"top150" | "neetcode" | "sorting">("top150");
  const [openTopic, setOpenTopic] = useState<string | null>("arrays-hashing");
  const [checked, setChecked] = useState<Set<number>>(new Set([1, 49, 125]));

  const toggle = (no: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(no)) next.delete(no);
      else next.add(no);
      return next;
    });
  };

  const totalSolved = checked.size;
  const totalQuestions = MOCK_TOPICS.reduce((sum, t) => sum + t.questions.length, 0);
  const pct = Math.round((totalSolved / totalQuestions) * 100);

  return (
    <section className="border-y bg-muted/40 px-5 py-16 sm:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">Structured practice</p>
          <h2 className="mt-2 text-3xl font-medium tracking-normal sm:text-4xl">
            Work through interview questions, one by one.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Three question banks — Top Interview 150, NeetCode Roadmap, and Sorting Algorithms —
            with curated solutions in 5 languages, progress tracking, and one-click visualization.
          </p>
        </div>

        {/* Interactive preview */}
        <div className="mt-10 overflow-hidden rounded-2xl border bg-card shadow-lg">
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b bg-muted/30">
            {[
              { id: "top150" as const, label: "Top Interview 150", icon: Layers, count: "150 questions" },
              { id: "neetcode" as const, label: "NeetCode Roadmap", icon: Route, count: "362 questions" },
              { id: "sorting" as const, label: "Sorting Algorithms", icon: Shuffle, count: "7 algorithms" },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {tab.count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div className="p-4 sm:p-6">
            {activeTab === "sorting" ? (
              /* Sorting algorithms preview */
              <div className="space-y-3">
                {SORTING_ALGORITHMS.map((algo) => (
                  <div
                    key={algo.name}
                    className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Shuffle className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{algo.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {algo.category} · {algo.complexity}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-7 gap-1 px-2 text-[10px]">
                      <Link href="/visualizer?t=bubble-sort">
                        <Play className="h-3 w-3" />
                        Visualize
                      </Link>
                    </Button>
                  </div>
                ))}
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  + 4 more algorithms · JS · TS · Python · Java · C++
                </p>
              </div>
            ) : (
              /* Question banks preview */
              <div>
                {/* Progress bar */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <b className="text-foreground">{totalSolved} of {totalQuestions}</b> solved
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{pct}%</p>
                </div>
                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Search hint */}
                <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  <span>Search by title, number, or tag…</span>
                  <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                    /
                  </kbd>
                </div>

                {/* Topic accordions */}
                <div className="space-y-2">
                  {MOCK_TOPICS.map((topic) => {
                    const open = openTopic === topic.id;
                    const solved = topic.questions.filter((q) => checked.has(q.no)).length;
                    return (
                      <div key={topic.id} className="border bg-muted/10">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setOpenTopic(open ? null : topic.id)}
                            className="flex flex-1 items-center gap-2 text-left"
                          >
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                open ? "rotate-180" : ""
                              }`}
                            />
                            <span className="text-sm font-medium">{topic.title}</span>
                          </button>
                          <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                            {solved}/{topic.questions.length}
                          </Badge>
                        </div>

                        {open && (
                          <ol className="border-t divide-y divide-border/60">
                            {topic.questions.map((q) => (
                              <li key={q.no} className="flex items-center gap-3 px-4 py-2.5">
                                <button
                                  type="button"
                                  onClick={() => toggle(q.no)}
                                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                                    checked.has(q.no)
                                      ? "border-emerald-500/60 bg-emerald-500/90 text-white"
                                      : "border-border bg-muted/40 hover:border-primary/60"
                                  }`}
                                >
                                  {checked.has(q.no) && <Check className="h-3.5 w-3.5" />}
                                </button>
                                <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
                                  {q.no}
                                </span>
                                <span className="flex-1 truncate text-sm">{q.title}</span>
                                <Badge className={`h-5 shrink-0 px-2 text-[10px] ${DIFFICULTY_CLASS[q.difficulty]}`}>
                                  {q.difficulty}
                                </Badge>
                                {checked.has(q.no) ? (
                                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                    solved
                                  </span>
                                ) : (
                                  <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="h-6 shrink-0 gap-1 px-2 text-[10px]"
                                  >
                                    <Link href="/visualizer?t=two-sum">
                                      <Play className="h-3 w-3" />
                                      Visualize
                                    </Link>
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Keyboard shortcuts hint */}
                <p className="mt-4 text-[11px] text-muted-foreground/60">
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">j</kbd>
                  {" / "}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">k</kbd>
                  {" navigate · "}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Space</kbd>
                  {" toggle · "}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">/</kbd>
                  {" search"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/learn">
              Start practicing
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/guide">How it works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
