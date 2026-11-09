"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Layers, Loader2, Play, Route, Shuffle, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { neetcodeTopics, neetcodeTotal } from "@/lib/neetcode";
import { top150Topics, top150Total } from "@/lib/top150";
import { hasNeetCodeTemplate, hasTop150Template } from "@/lib/top150-coverage";
import { cancelServerSync, loadSolvedFromServer, resetTop150Solved, useSolvedTimestamps, useSolvedTop150 } from "@/lib/top150-status";
import { loadProgressFromServer, startPeriodicSync, stopPeriodicSync, useSyncing } from "@/lib/progress";
import { loadPreferencesFromServer } from "@/lib/user-preferences";
import { sortingAlgorithms } from "@/lib/sorting";
import { useUser } from "@/lib/auth/hooks";
import { QuestionBank, type BankTopic } from "./question-bank";
import { SortingBank } from "./sorting-bank";

// ---------------------------------------------------------------------------
// Learn hub: one card per bank on /learn; clicking one drills into that bank
// (questions with search/filters, or algorithms with solutions) and back.
// ---------------------------------------------------------------------------

type BankId = "top150" | "neetcode" | "sorting";

type BaseBankConfig = {
  id: BankId;
  title: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon chip. */
  accent: string;
};

type QuestionBankConfig = BaseBankConfig & {
  kind: "questions";
  topics: BankTopic[];
  total: number;
};

type SortingBankConfig = BaseBankConfig & {
  kind: "sorting";
};

type BankConfig = QuestionBankConfig | SortingBankConfig;

const BANKS: BankConfig[] = [
  {
    id: "top150",
    kind: "questions",
    title: "Top Interview 150",
    tagline: "The official interview-prep list",
    description:
      "150 classic problems across 23 topics, straight from the study plan. Expand a topic to see its questions and tick them off as you solve them — each one links to the original problem, and every traced question opens in the visualizer.",
    topics: top150Topics,
    total: top150Total,
    icon: Layers,
    accent: "bg-primary/10 text-primary",
  },
  {
    id: "neetcode",
    kind: "questions",
    title: "NeetCode Roadmap",
    tagline: "The classic coding-interview roadmap",
    description:
      "362 problems across 17 categories — arrays and hashing through dynamic programming — with numbers, titles, and difficulties verified against LeetCode. Solved status is shared with the Top Interview 150 bank, so progress stays in sync.",
    topics: neetcodeTopics,
    total: neetcodeTotal,
    icon: Route,
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    id: "sorting",
    kind: "sorting",
    title: "Sorting Algorithms",
    tagline: "Watch the classics sort, step by step",
    description:
      "Seven classic array-sorting algorithms — bubble through counting — each with a traceable visualization and the canonical implementation in every language the app provides: JavaScript, TypeScript, Python, Java, and C++. Pick an algorithm, watch its passes in the tracer, and compare the same code across languages.",
    icon: Shuffle,
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
];

/** Problems in the bank that have a verified traceable template (unique numbers). */
function visualizeCount(topics: BankTopic[]): number {
  const seen = new Set<number>();
  for (const topic of topics) {
    for (const question of topic.questions) {
      if (hasTop150Template(question.no) || hasNeetCodeTemplate(question.no)) seen.add(question.no);
    }
  }
  return seen.size;
}

function solvedInBank(solved: Set<number>, topics: BankTopic[]): number {
  return topics.reduce(
    (sum, topic) => sum + topic.questions.filter((question) => solved.has(question.no)).length,
    0,
  );
}

/** Most recent solved timestamp across all questions in the bank, or 0. */
function lastSolvedInBank(timestamps: Record<number, number>, topics: BankTopic[]): number {
  let latest = 0;
  for (const topic of topics) {
    for (const question of topic.questions) {
      const ts = timestamps[question.no] ?? 0;
      if (ts > latest) latest = ts;
    }
  }
  return latest;
}

function formatRelativeTime(epochMs: number): string {
  if (epochMs === 0) return "";
  const seconds = Math.round((Date.now() - epochMs) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function QuestionBanks() {
  const solved = useSolvedTop150();
  const timestamps = useSolvedTimestamps();
  const { user, loading: authLoading } = useUser();
  const [selected, setSelected] = useState<BankId | null>(null);
  const bank = BANKS.find((candidate) => candidate.id === selected);

  const prevUserRef = useRef(user);
  const didSyncRef = useRef(false);
  const syncing = useSyncing();

  useEffect(() => {
    const prev = prevUserRef.current;
    prevUserRef.current = user;
    if (user && (!prev || !didSyncRef.current)) {
      // Signed in (or already signed in on first render): pull server data.
      didSyncRef.current = true;
      void loadSolvedFromServer();
      void loadProgressFromServer();
      void loadPreferencesFromServer();
      startPeriodicSync();
    } else if (!user && prev) {
      // Signed out: abort any in-flight server sync, then clear localStorage.
      didSyncRef.current = false;
      stopPeriodicSync();
      cancelServerSync();
      resetTop150Solved();
    }
    return () => {
      if (!user) stopPeriodicSync();
    };
  }, [user]);

  // Drill-down view: the bank's content with a way back to the cards.
  if (bank) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            All banks
          </Button>
          {bank.kind === "questions" ? (
            <Badge variant="secondary" className="h-6 px-2 text-[11px]">
              {solvedInBank(solved, bank.topics)} of {bank.total} solved
            </Badge>
          ) : (
            <Badge variant="secondary" className="h-6 px-2 text-[11px]">
              {sortingAlgorithms.length} algorithms · 5 languages
            </Badge>
          )}
        </div>
        <section className="mt-6 max-w-3xl">
          <h2 className="text-3xl font-medium tracking-normal sm:text-4xl">{bank.title}</h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">{bank.description}</p>
        </section>
        <div className="mt-8">
          {bank.kind === "questions" ? (
            <QuestionBank topics={bank.topics} total={bank.total} user={user} authLoading={authLoading} bank={bank.id} />
          ) : (
            <SortingBank />
          )}
        </div>
      </div>
    );
  }

  // Card view: one clickable card per bank.
  return (
    <div>
    {syncing && user ? (
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        Syncing progress from server…
      </div>
    ) : null}
    <div className="grid gap-4 sm:grid-cols-2">
      {BANKS.map((candidate) => {
        const Icon = candidate.icon;
        if (candidate.kind === "sorting") {
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSelected(candidate.id)}
              className="group rounded-lg border bg-card p-5 text-left shadow-soft transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${candidate.accent}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-4 text-lg font-medium tracking-normal">{candidate.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{candidate.tagline}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                  {sortingAlgorithms.length} algorithms
                </Badge>
                <Badge
                  variant="outline"
                  className="h-5 gap-1 border-primary/25 bg-primary/5 px-2 text-[10px] text-primary"
                >
                  <Play className="h-3 w-3" aria-hidden="true" />
                  {sortingAlgorithms.length} with Visualize
                </Badge>
                <Badge
                  variant="outline"
                  className="h-5 border-border/60 bg-muted/40 px-2 text-[10px] font-mono text-muted-foreground"
                >
                  JS · TS · Py · Java · C++
                </Badge>
              </div>
            </button>
          );
        }
        const solvedCount = solvedInBank(solved, candidate.topics);
        const vizCount = visualizeCount(candidate.topics);
        const pct = candidate.total === 0 ? 0 : Math.round((solvedCount / candidate.total) * 100);
        return (
          <button
            key={candidate.id}
            type="button"
            onClick={() => setSelected(candidate.id)}
            className="group rounded-lg border bg-card p-5 text-left shadow-soft transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-lg ${candidate.accent}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <ChevronRight
                className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </div>
            <h3 className="mt-4 text-lg font-medium tracking-normal">{candidate.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{candidate.tagline}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {solvedCount} of {candidate.total} solved
                </span>
                <span className="font-mono">{pct}%</span>
              </div>
              {(() => {
                const lastTs = lastSolvedInBank(timestamps, candidate.topics);
                const rel = formatRelativeTime(lastTs);
                return rel ? (
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    Last solved {rel}
                  </p>
                ) : null;
              })()}
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${candidate.title} progress`}
              >
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                {candidate.total} questions
              </Badge>
              <Badge
                variant="outline"
                className="h-5 gap-1 border-primary/25 bg-primary/5 px-2 text-[10px] text-primary"
              >
                <Play className="h-3 w-3" aria-hidden="true" />
                {vizCount} with Visualize
              </Badge>
            </div>
          </button>
        );
      })}
    </div>
    </div>
  );
}
