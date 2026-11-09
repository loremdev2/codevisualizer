"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Clock, Cloud, CloudOff, ExternalLink, ListChecks, Loader2, Play, RotateCcw, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AuthState } from "@/lib/auth/hooks";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { type NeetCodeDifficulty, type NeetCodeQuestion } from "@/lib/neetcode";
import {
  leetcodeProblemUrl,
  type Top150Difficulty,
  type Top150Question,
} from "@/lib/top150";
import {
  pushSolvedToggleToServer,
  replaceSolvedFromServer,
  resetSolvedOnServer,
  resetTop150Solved,
  toggleTopicSolved,
  toggleTop150Solved,
  useLastSyncedAt,
  useSolvedTimestamps,
  useSolvedTop150,
  useSyncState,
} from "@/lib/top150-status";
import { toast } from "@/components/ui/toaster";
import {
  hasNeetCodeTemplate,
  hasTop150Brute,
  hasTop150MultiLang,
  hasTop150Template,
  top150TemplateId,
} from "@/lib/top150-coverage";
import { top150Tags } from "@/lib/top150-tags";
import { advanceReviewLevel, isDueForReview, readReviewLevels, resetReviewLevel } from "@/lib/spaced-repetition";
import { getElapsedMs } from "@/lib/time-tracking";

// ---------------------------------------------------------------------------
// Generic question bank used by both the Top Interview 150 and NeetCode
// Roadmap sections on /learn. The banks differ only in their topic lists;
// everything else (solved status, tags, template coverage, deep links) is
// keyed by canonical LeetCode problem number, so one component renders both.
// ---------------------------------------------------------------------------

export type BankQuestion = Pick<Top150Question, "no" | "title" | "difficulty"> &
  Pick<NeetCodeQuestion, "slug">;

export type BankTopic = {
  id: string;
  title: string;
  questions: BankQuestion[];
};

const DIFFICULTY_CLASS: Record<Top150Difficulty | NeetCodeDifficulty, string> = {
  Easy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Hard: "border-destructive/30 bg-destructive/10 text-destructive",
};

const DIFFICULTY_FILTERS: Array<{
  id: Top150Difficulty | "All";
  label: string;
  activeClass: string;
}> = [
  { id: "All", label: "All", activeClass: "bg-primary text-primary-foreground" },
  { id: "Easy", label: "Easy", activeClass: "bg-emerald-500 text-white" },
  { id: "Medium", label: "Medium", activeClass: "bg-amber-500 text-white" },
  { id: "Hard", label: "Hard", activeClass: "bg-destructive text-destructive-foreground" },
];

type FilteredQuestion = {
  question: BankQuestion;
  topicId: string;
  topicTitle: string;
};

export function QuestionBank({
  topics,
  total,
  user,
  authLoading,
  bank = "top150",
}: {
  topics: BankTopic[];
  total: number;
  user: AuthState["user"];
  authLoading: boolean;
  bank?: string;
}) {
  const solved = useSolvedTop150();
  const timestamps = useSolvedTimestamps();
  const [openTopicId, setOpenTopicId] = useState<string | null>(topics[0]?.id ?? null);
  const [resetArmed, setResetArmed] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the armed timeout on unmount.
  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    };
  }, []);

  // Search / filter state: query matches title, number, or tags; difficulty
  // and topic narrow the result set. Any active filter switches the bank into
  // a flat results list (accordions hide), so matches are never buried.
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Top150Difficulty | "All">("All");
  const [topicFilter, setTopicFilter] = useState<string>("All");
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation: focusedIndex tracks which question row is highlighted.
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Clock captured once at mount — reading Date.now() during render is
  // impure; the due set is refreshed on each mount/filter change anyway.
  const [nowAtMount] = useState(() => Date.now());

  // Compute due-for-review questions (spaced repetition)
  const dueSet = useMemo(() => {
    const levels = readReviewLevels();
    const now = nowAtMount;
    const set = new Set<number>();
    for (const [noStr, ts] of Object.entries(timestamps)) {
      if (ts <= 0) continue;
      const no = Number(noStr);
      const level = levels[no] ?? 0;
      const INTERVALS = [1, 3, 7, 14, 30, 60];
      const intervalDays = INTERVALS[Math.min(level, INTERVALS.length - 1)];
      if (now >= ts + intervalDays * 86_400_000) set.add(no);
    }
    return set;
  }, [timestamps, nowAtMount]);

  const totalSolved = topics.reduce(
    (sum, topic) => sum + topic.questions.filter((question) => solved.has(question.no)).length,
    0,
  );

  const filtering = query.trim() !== "" || difficulty !== "All" || topicFilter !== "All";

  const filtered = useMemo<FilteredQuestion[]>(() => {
    if (!filtering) return [];
    const needle = query.trim().toLowerCase();
    const matches: FilteredQuestion[] = [];
    for (const topic of topics) {
      for (const question of topic.questions) {
        if (difficulty !== "All" && question.difficulty !== difficulty) continue;
        if (topicFilter !== "All" && topic.id !== topicFilter) continue;
        if (needle) {
          const haystack = `${question.no} ${question.title} ${top150Tags(question.no).join(" ")}`.toLowerCase();
          if (!haystack.includes(needle)) continue;
        }
        matches.push({ question, topicId: topic.id, topicTitle: topic.title });
      }
    }
    return matches;
  }, [filtering, query, difficulty, topicFilter, topics]);

  const clearFilters = () => {
    setQuery("");
    setDifficulty("All");
    setTopicFilter("All");
    setFocusedIndex(null);
  };

  // Reset keyboard focus when filters change so the index doesn't go stale.
  // Render-phase adjustment is the React-documented alternative to a reset
  // effect (no cascading render).
  const [prevFilters, setPrevFilters] = useState({ query, difficulty, topicFilter });
  if (prevFilters.query !== query || prevFilters.difficulty !== difficulty || prevFilters.topicFilter !== topicFilter) {
    setPrevFilters({ query, difficulty, topicFilter });
    setFocusedIndex(null);
  }

  // Build a flat list of all visible questions for keyboard nav.
  const visibleQuestions = useMemo(() => {
    if (filtering) return filtered.map((f) => f.question);
    const list: BankQuestion[] = [];
    for (const topic of topics) list.push(...topic.questions);
    return list;
  }, [filtering, filtered, topics]);

  // Keyboard shortcuts: j/k navigate, Space toggles, / focuses search, Escape clears.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Ignore if typing in an input or dialog is open.
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.closest("[role=dialog]")) return;

      if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (visibleQuestions.length === 0) return;

      if (event.key === "j" || (event.key === "ArrowDown" && !event.altKey)) {
        event.preventDefault();
        setFocusedIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, visibleQuestions.length - 1)));
      } else if (event.key === "k" || (event.key === "ArrowUp" && !event.altKey)) {
        event.preventDefault();
        setFocusedIndex((prev) => (prev === null ? 0 : Math.max(prev - 1, 0)));
      } else if (event.key === " " && focusedIndex !== null) {
        event.preventDefault();
        const q = visibleQuestions[focusedIndex];
        if (user && q) {
          toggleTop150Solved(q.no);
          void pushSolvedToggleToServer(q.no, bank);
        }
      } else if (event.key === "Escape") {
        setFocusedIndex(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visibleQuestions, focusedIndex, user, bank]);

  // Scroll the focused row into view.
  useEffect(() => {
    if (focusedIndex === null) return;
    const el = document.getElementById(`q-row-${focusedIndex}`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedIndex]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
        <p className="text-sm text-muted-foreground">
          {authLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-4 w-24 animate-pulse rounded bg-muted" />
              <span className="h-4 w-14 animate-pulse rounded bg-muted" />
            </span>
          ) : (
            <>
              <b className="text-foreground">
                {totalSolved} of {total}
              </b>{" "}
              solved
              {!user ? (
                <button
                  type="button"
                  onClick={() => setSignInPromptOpen(true)}
                  className="ml-2 inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  Sign in to sync
                </button>
              ) : (
                <SyncIndicator />
              )}
            </>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={!user}
          title={!user ? "Sign in to track progress" : undefined}
          onClick={() => {
            if (resetArmed) {
              if (user) {
                // Per-bank reset: clear this bank on the server, then replace
                // localStorage with the remaining server data.
                void resetSolvedOnServer(bank).then(() => replaceSolvedFromServer());
              } else {
                // Guest: clear all localStorage.
                resetTop150Solved();
              }
              setResetArmed(false);
            } else {
              setResetArmed(true);
              if (resetTimer.current !== null) clearTimeout(resetTimer.current);
              resetTimer.current = setTimeout(() => {
                resetTimer.current = null;
                setResetArmed(false);
              }, 3000);
            }
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {resetArmed ? "Click again to reset" : "Reset solved"}
        </Button>
      </div>

      {/* Keyboard shortcut hints */}
      <p className="mt-4 text-[11px] text-muted-foreground/60">
        {" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">j</kbd>
        {" / "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">k</kbd>
        {" navigate \u00b7 "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">Space</kbd>
        {" toggle \u00b7 "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">/</kbd>
        {" search"}
      </p>

      {/* Search + filter bar */}
      <div className="mt-3 rounded-xl border bg-card p-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, number, or tag… ( / )"
              aria-label="Search questions"
              className="h-9 pl-8"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              role="group"
              aria-label="Filter by difficulty"
              className="flex h-9 items-center gap-0.5 rounded-md border bg-muted/40 p-0.5"
            >
              {DIFFICULTY_FILTERS.map((option) => {
                const active = difficulty === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDifficulty(option.id)}
                    className={`h-7 rounded px-2.5 text-xs font-medium transition-colors ${
                      active ? option.activeClass : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="h-9 w-full text-xs sm:w-48" aria-label="Filter by topic">
                <SelectValue placeholder="All topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filtering ? (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              <b className="text-foreground">{filtered.length}</b> of {total}{" "}
              {filtered.length === 1 ? "question matches" : "questions match"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </Button>
          </div>
          {filtered.length > 0 ? (
            <ol className="mt-2 divide-y divide-border/60 border bg-card">
              {filtered.map(({ question, topicTitle }, idx) => (
                <QuestionRow
                  key={`${question.no}-${topicTitle}`}
                  question={question}
                  solved={solved.has(question.no)}
                  solvedAt={timestamps[question.no] ?? 0}
                  topicTitle={topicTitle}
                  user={user}
                  onSignIn={() => setSignInPromptOpen(true)}
                  bank={bank}
                  focused={focusedIndex === idx}
                  rowIndex={idx}
                />
              ))}
            </ol>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center">
              <Search className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                No questions match your filters. Try a different search or topic.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {topics.map((topic) => {
            const open = openTopicId === topic.id;
            return (
              <TopicAccordion
                key={topic.id}
                topic={topic}
                solved={solved}
                timestamps={timestamps}
                open={open}
                onToggle={() => setOpenTopicId(open ? null : topic.id)}
                user={user}
                onSignIn={() => setSignInPromptOpen(true)}
                bank={bank}
              />
            );
          })}
        </div>
      )}

      <SignInPrompt
        open={signInPromptOpen}
        onClose={() => setSignInPromptOpen(false)}
        redirectPath="/learn"
      />
    </div>
  );
}

function TopicAccordion({
  topic,
  solved,
  timestamps,
  open,
  onToggle,
  user,
  onSignIn,
  bank,
  dueSet,
}: {
  topic: BankTopic;
  solved: Set<number>;
  timestamps: Record<number, number>;
  open: boolean;
  onToggle: () => void;
  user: AuthState["user"];
  onSignIn: () => void;
  bank?: string;
  dueSet?: Set<number>;
}) {
  const solvedInTopic = topic.questions.filter((question) => solved.has(question.no)).length;
  const allSolved = solvedInTopic === topic.questions.length && topic.questions.length > 0;

  return (
    <div className={`border bg-card transition-colors ${open ? "" : "hover:bg-accent/40"}`}>
      <div className="flex w-full items-center gap-3 px-5 py-4">
        {/* Batch select-all checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={allSolved}
          aria-label={`${allSolved ? "Uncheck" : "Check"} all ${topic.title} questions`}
          onClick={(event) => {
            event.stopPropagation();
            const nos = topic.questions.map((q) => q.no);
            const wasAllSolved = nos.every((no) => solved.has(no));
            toggleTopicSolved(nos, solved);
            // Sync each toggled question to the server.
            for (const no of nos) {
              void pushSolvedToggleToServer(no, bank);
            }
            // Show undo toast.
            const actionLabel = wasAllSolved ? "Uncheck all" : "Check all";
            toast({
              title: wasAllSolved ? `Unchecked all ${topic.title}` : `Checked all ${topic.title}`,
              description: `${nos.length} questions ${wasAllSolved ? "unsolved" : "solved"}`,
              variant: "info",
              duration: 5000,
              action: {
                label: `Undo ${actionLabel}`,
                onClick: () => {
                  // Read fresh solved state from localStorage — the captured
                  // `solved` prop may be stale if the user toggled another
                  // topic before clicking Undo.
                  const freshSolved = new Set(
                    JSON.parse(window.localStorage.getItem("dsa.top150Solved") ?? "[]") as number[],
                  );
                  toggleTopicSolved(nos, freshSolved);
                  // Force-push to bypass dedup: the original toggle's server
                  // calls may still be in flight, and without force the undo
                  // would be silently skipped.
                  for (const no of nos) {
                    void pushSolvedToggleToServer(no, bank, { force: true });
                  }
                },
              },
            });
          }}
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
            allSolved
              ? "border-emerald-500/60 bg-emerald-500/90 text-white"
              : solvedInTopic > 0
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-muted/40 hover:border-primary/60"
          }`}
        >
          {allSolved ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : solvedInTopic > 0 ? (
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`topic-${topic.id}-panel`}
          className="flex flex-1 items-center justify-between gap-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-3">
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
            <span className="truncate text-base font-medium tracking-tight">{topic.title}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {solvedInTopic > 0 ? (
              <Badge
                variant="outline"
                className="h-5 gap-1 border-emerald-500/30 bg-emerald-500/10 px-2 text-[10px] text-emerald-600 dark:text-emerald-400"
              >
                <Check className="h-3 w-3" aria-hidden="true" />
                {solvedInTopic}/{topic.questions.length}
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                {topic.questions.length} questions
              </Badge>
            )}
            {/* Mini progress bar with animated fill on mount */}
            <div
              className="h-1 w-12 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={topic.questions.length === 0 ? 0 : Math.round((solvedInTopic / topic.questions.length) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${topic.title} progress`}
            >
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{
                  width: `${topic.questions.length === 0 ? 0 : Math.round((solvedInTopic / topic.questions.length) * 100)}%`,
                  transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>
          </span>
        </button>
      </div>

      {open ? (
        <ol
          id={`topic-${topic.id}-panel`}
          className="border-t border-border/80 divide-y divide-border/60"
        >
          {topic.questions.map((question) => (
            <QuestionRow
              key={question.no}
              question={question}
              solved={solved.has(question.no)}
              solvedAt={timestamps[question.no] ?? 0}
              user={user}
              onSignIn={onSignIn}
              bank={bank}
              dueForReview={dueSet?.has(question.no) ?? false}
            />
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function QuestionRow({
  question,
  solved,
  solvedAt,
  topicTitle,
  user,
  onSignIn,
  bank = "top150",
  focused,
  rowIndex,
  dueForReview,
}: {
  question: BankQuestion;
  solved: boolean;
  solvedAt: number;
  /** Shown as a chip above the tags when the row appears outside its topic
   * accordion (i.e. in the filtered flat list). */
  topicTitle?: string;
  user: AuthState["user"];
  onSignIn: () => void;
  bank?: string;
  focused?: boolean;
  rowIndex?: number;
  dueForReview?: boolean;
}) {
  const traceable = hasTop150Template(question.no) || hasNeetCodeTemplate(question.no);
  const hasBrute = hasTop150Brute(question.no);
  const hasMultiLang = hasTop150MultiLang(question.no);
  const tags = top150Tags(question.no);

  return (
    <li
      id={rowIndex !== undefined ? `q-row-${rowIndex}` : undefined}
      className={`px-5 py-2.5 transition-colors ${focused ? "bg-primary/5 ring-1 ring-primary/30" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={solved}
          aria-label={`Mark ${question.title} as ${solved ? "not solved" : "solved"}`}
          onClick={() => {
            if (!user) {
              onSignIn();
              return;
            }
            if (!solved) {
              advanceReviewLevel(question.no);
              // Record time spent on this question (started when opened in visualizer).
              const elapsedMs = getElapsedMs(question.no);
              if (elapsedMs !== null) {
                // Fire-and-forget: send duration to the server via activity ledger.
                void fetch("/api/activity/events", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event: "question_solved",
                    questionNo: question.no,
                    bank,
                    durationMs: elapsedMs,
                  }),
                });
              }
            }
            toggleTop150Solved(question.no);
            void pushSolvedToggleToServer(question.no, bank);
          }}
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
            solved
              ? "border-emerald-500/60 bg-emerald-500/90 text-white"
              : "border-border bg-muted/40 hover:border-primary/60"
          }`}
        >
          {solved ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        </button>
        <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
          {question.no}
        </span>
        <a
          href={leetcodeProblemUrl(question.slug)}
          target="_blank"
          rel="noreferrer"
          className="group flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium text-foreground/90 transition-colors hover:text-primary"
          title={`Open ${question.title} on the original problem`}
        >
          <span className="truncate">{question.title}</span>
          <ExternalLink
            className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </a>
        {traceable ? (
          <Button asChild variant="outline" size="sm" className="h-6 shrink-0 gap-1 px-2 text-[10px]">
            <Link
              href={`/visualizer?t=${top150TemplateId(question.no)}`}
              title={`Load and trace ${question.title} in the visualizer${hasBrute ? " — Brute + Optimal variants available" : ""}${hasMultiLang ? " — JavaScript, TypeScript, and Python solutions" : ""}`}
            >
              <Play className="h-3 w-3" aria-hidden="true" />
              Visualize
            </Link>
          </Button>
        ) : (
          <Badge variant="secondary" className="h-6 shrink-0 gap-1 px-2 text-[10px]" title="No traceable template yet — coming soon">
            <Clock className="h-3 w-3" aria-hidden="true" />
            Coming soon
          </Badge>
        )}
        <Badge className={`h-5 shrink-0 px-2 text-[10px] ${DIFFICULTY_CLASS[question.difficulty]}`}>
          {question.difficulty}
        </Badge>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-[5.25rem]">
        {solved && solvedAt > 0 ? (
          <span
            className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
            title={`Solved ${new Date(solvedAt).toLocaleString()}`}
          >
            solved {formatRelativeTime(solvedAt)}
          </span>
        ) : null}
        {dueForReview ? (
          <span
            className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
            title="This question is due for review based on spaced repetition"
          >
            due for review
          </span>
        ) : null}
        {topicTitle ? (
          <span
            className="rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
            title="Study-plan topic"
          >
            {topicTitle}
          </span>
        ) : null}
        {hasMultiLang ? (
          <span
            className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 font-mono text-[10px] font-medium text-primary"
            title="JavaScript, TypeScript, and Python solutions available in the visualizer"
          >
            JS · TS · Py
          </span>
        ) : null}
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
    </li>
  );
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

function SyncIndicator() {
  const syncState = useSyncState();
  const lastSynced = useLastSyncedAt();
  const [, setTick] = useState(0);

  // Re-render every 30s so the relative timestamp stays fresh.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (syncState === "idle") return null;

  const relativeTime = formatRelativeTime(lastSynced);

  return (
    <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      {syncState === "syncing" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          Syncing…
        </>
      )}
      {syncState === "synced" && (
        <>
          <Cloud className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          Synced ✓{relativeTime ? ` ${relativeTime}` : ""}
        </>
      )}
      {syncState === "offline" && (
        <>
          <CloudOff className="h-3 w-3 text-amber-500" aria-hidden="true" />
          Offline — will retry
        </>
      )}
    </span>
  );
}

