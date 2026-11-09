"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Edit2,
  Layers,
  Loader2,
  Play,
  Route,
  Save,
  Shuffle,
  User,
  X,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { UsernameBadge } from "@/components/ui/username-badge";
import { Button } from "@/components/ui/button";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { useUser } from "@/lib/auth/hooks";
import { API } from "@/lib/api-config";
import { validateUsername } from "@/lib/profanity-filter";
import { fetchActivitySummary, type DailyActivity } from "@/lib/activity-ledger";
import { loadSolvedFromServer, useSolvedTop150, useSolvedTimestamps } from "@/lib/top150-status";
import { neetcodeTopics, neetcodeTotal } from "@/lib/neetcode";
import { top150Topics, top150Total } from "@/lib/top150";
import { hasNeetCodeTemplate, hasTop150Template } from "@/lib/top150-coverage";
import { top150TemplateId } from "@/lib/top150-templates";
import { sortingAlgorithms } from "@/lib/sorting";
import { useLearningProgress, loadProgressFromServer, startPeriodicSync, stopPeriodicSync } from "@/lib/progress";
import { loadPreferencesFromServer } from "@/lib/user-preferences";
import { ActivityHeatmap } from "./activity-heatmap";
import { ProgressChart } from "./progress-chart";
import { StatsCards } from "./stats-cards";
import { TimeStats } from "./time-stats";

// ---------------------------------------------------------------------------
// User profile page: avatar, activity heatmap, stats, progress, recent activity.
// ---------------------------------------------------------------------------

function relativeTime(epochMs: number): string {
  if (epochMs === 0) return "";
  const seconds = Math.round((Date.now() - epochMs) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Avatar with Google referrer-safe fallback. */
function UserAvatar({
  name,
  picture,
  className,
}: {
  name: string;
  picture: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((p) => p.slice(0, 1))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className={`relative grid place-items-center overflow-hidden rounded-full bg-primary text-primary-foreground ${className ?? ""}`}
    >
      {picture && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picture}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span className="text-sm font-semibold">{initials}</span>
      )}
    </span>
  );
}

function solvedCountForTopics(
  solved: Set<number>,
  topics: Array<{ questions: Array<{ no: number }> }>,
): number {
  return topics.reduce(
    (sum, t) => sum + t.questions.filter((q) => solved.has(q.no)).length,
    0,
  );
}

export function ProfilePage() {
  const { user, loading: authLoading } = useUser();
  const prevUserRef = useRef(user);
  const didSyncRef = useRef(false);
  const solved = useSolvedTop150();
  const solvedTimestamps = useSolvedTimestamps();
  const learningProgress = useLearningProgress();
  const [signInOpen, setSignInOpen] = useState(false);
  // Name editing state
  const [editingName, setEditingName] = useState(false);
  const [firstNameValue, setFirstNameValue] = useState("");
  const [lastNameValue, setLastNameValue] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<string | null>(null);
  // Username display and editing
  const [username, setUsername] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameCooldown, setUsernameCooldown] = useState<number | null>(null);
  // Ledger activity (trace runs per day) from the server — feeds the solve-
  // rate chart's runs metric. Null while loading or when unavailable; the
  // chart falls back to locally derived solves in that case.
  const [ledgerDays, setLedgerDays] = useState<DailyActivity[] | null>(null);

  // Timestamp captured once at mount for "member since" and trace fallbacks
  // — avoids calling the impure Date.now() during render.
  const [mountedAt] = useState(() => Date.now());
  const [memberSince, setMemberSince] = useState<number | null>(null);

  // Fetch username on mount (must be before any early returns). New accounts
  // are auto-assigned one from their email at sign-up; fall back to the email
  // prefix for legacy rows that somehow have none.
  useEffect(() => {
    if (user) {
      fetch(API.me.profile)
        .then((r) => r.json())
        .then((data) => {
          if (data.username) {
            setUsername(data.username);
          } else if (data.email) {
            setUsername(data.email.split("@")[0]);
          }
          if (data.firstName) setFirstNameValue(data.firstName);
          if (data.lastName) setLastNameValue(data.lastName);
          if (typeof data.createdAt === "string") {
            const createdMs = new Date(data.createdAt).getTime();
            if (!Number.isNaN(createdMs)) setMemberSince(createdMs);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  // Check username cooldown status
  useEffect(() => {
    if (user && username) {
      fetch(API.me.username)
        .then((r) => r.json())
        .then((data) => {
          if (!data.canChange) {
            setUsernameCooldown(data.cooldownRemaining);
          }
        })
        .catch(() => {});
    }
  }, [user, username]);

  // Check username availability with debounce
  useEffect(() => {
    if (usernameValue.length < 3 || usernameValue === username) {
      // Reset via the cleanup path instead of a synchronous effect-body
      // setState (React Compiler rule).
      return () => setUsernameAvailable(null);
    }

    // Start the check inside the timer callback — no synchronous setState in
    // the effect body (React Compiler rule).
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const checkRes = await fetch(API.me.usernameSetup + `?username=${encodeURIComponent(usernameValue)}`);
        const data = await checkRes.json();
        setUsernameAvailable(data.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    // Reset the checking flag if the value changed mid-flight.
    return () => {
      clearTimeout(timer);
      setCheckingUsername(false);
      setUsernameAvailable(null);
    };
  }, [usernameValue, username]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchActivitySummary().then((summary) => {
      if (!cancelled && summary) setLedgerDays(summary.days);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
      didSyncRef.current = false;
      stopPeriodicSync();
    }
    return () => {
      if (!user) stopPeriodicSync();
    };
  }, [user]);

  // Timestamps come from the shared store — for signed-in users, these are
  // populated from Supabase by loadSolvedFromServer() on sign-in.

  // Combined timestamps: merge solved timestamps (Top 150/NeetCode) with
  // traced timestamps (all banks including Sorting) for a unified activity view.
  const combinedTimestamps = useMemo(() => {
    const merged: Record<number, number> = { ...solvedTimestamps };
    // Build a reverse lookup: template ID → question number for sorting algos.
    const sortingByTemplate = new Map<string, number>();
    sortingAlgorithms.forEach((algo, idx) => {
      // Use negative indices to avoid collision with question numbers.
      sortingByTemplate.set(algo.id, -(idx + 1));
    });
    // Add traced templates with their timestamps.
    for (const [templateId, progress] of Object.entries(learningProgress)) {
      if (progress.traced) {
        const ts = progress.tracedAt ?? mountedAt;
        const sortingIdx = sortingByTemplate.get(templateId);
        if (sortingIdx !== undefined) {
          merged[sortingIdx] = ts;
        }
      }
    }
    return merged;
  }, [solvedTimestamps, learningProgress, mountedAt]);

  // Recent activity: last 10 items (solved questions + traced templates),
  // sorted by timestamp descending.
  const recentActivity = useMemo(() => {
    type ActivityItem = {
      id: string;
      no: number;
      ts: number;
      title: string;
      bank: string;
      traceable: boolean;
      href?: string;
    };

    const items: ActivityItem[] = [];

    // Add solved questions.
    for (const [noStr, ts] of Object.entries(solvedTimestamps)) {
      if (ts <= 0) continue;
      const no = Number(noStr);
      const questionMap = new Map<number, { title: string; bank: string; traceable: boolean }>();
      for (const topic of top150Topics) {
        for (const q of topic.questions) {
          questionMap.set(q.no, {
            title: q.title,
            bank: "Top Interview 150",
            traceable: hasTop150Template(q.no),
          });
        }
      }
      for (const topic of neetcodeTopics) {
        for (const q of topic.questions) {
          if (!questionMap.has(q.no)) {
            questionMap.set(q.no, {
              title: q.title,
              bank: "NeetCode",
              traceable: hasNeetCodeTemplate(q.no),
            });
          }
        }
      }
      const meta = questionMap.get(no);
      items.push({
        id: `solved-${no}`,
        no,
        ts,
        title: meta?.title ?? `Question ${no}`,
        bank: meta?.bank ?? "Unknown",
        traceable: meta?.traceable ?? false,
        href: meta?.traceable ? `/visualizer?t=${top150TemplateId(no)}` : undefined,
      });
    }

    // Add traced sorting algorithms.
    for (const algo of sortingAlgorithms) {
      const progress = learningProgress[algo.id];
      if (progress?.traced) {
        items.push({
          id: `traced-${algo.id}`,
          no: 0,
          ts: progress.tracedAt ?? mountedAt,
          title: algo.name,
          bank: "Sorting Algorithms",
          traceable: true,
          href: `/visualizer?t=${algo.id}`,
        });
      }
    }

    return items.sort((a, b) => b.ts - a.ts).slice(0, 10);
  }, [solvedTimestamps, learningProgress, mountedAt]);

  // Topic breakdown for Top 150.
  const topicBreakdown = useMemo(() => {
    return top150Topics.map((topic) => {
      const total = topic.questions.length;
      const solvedCount = topic.questions.filter((q) => solved.has(q.no)).length;
      return { title: topic.title, solved: solvedCount, total };
    });
  }, [solved]);

  // Loading skeleton.
  if (authLoading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border bg-card"
            />
          ))}
        </div>
        <div className="mt-8 h-40 animate-pulse rounded-lg border bg-card" />
      </div>
    );
  }

  // Guest state: show sign-in prompt.
  if (!user) {
    return (
      <>
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-muted">
              <User className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-medium tracking-tight">Your Profile</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to see your activity heatmap, streaks, and progress.
              </p>
            </div>
            <Button
              onClick={() => setSignInOpen(true)}
              className="mt-2"
            >
              Sign in to view profile
            </Button>
          </div>
        </div>
        <SignInPrompt
          open={signInOpen}
          onClose={() => setSignInOpen(false)}
          redirectPath="/profile"
        />
      </>
    );
  }

  const displayName = user.name || user.email.split("@")[0] || "User";

  // Username editing handlers
  const startEditingUsername = () => {
    setUsernameValue(username || "");
    setUsernameError(null);
    setEditingUsername(true);
  };
  const cancelEditingUsername = () => {
    setEditingUsername(false);
    setUsernameValue("");
    setUsernameError(null);
    setUsernameAvailable(null);
  };

  const saveUsername = async () => {
    const trimmed = usernameValue.trim().toLowerCase();
    if (!trimmed) {
      setUsernameError("Username is required.");
      return;
    }

    if (trimmed === username) {
      setUsernameError("This is already your username.");
      return;
    }

    setSavingUsername(true);
    setUsernameError(null);

    try {
      const res = await fetch(API.me.username, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setUsernameError(data.error ?? "Failed to change username.");
        if (data.retryAfterMs) {
          setUsernameCooldown(data.retryAfterMs);
        }
      } else {
        setEditingUsername(false);
        setUsername(data.username);
        window.location.reload();
      }
    } catch {
      setUsernameError("Network error.");
    } finally {
      setSavingUsername(false);
    }
  };

  // Name editing handlers
  const startEditingName = () => {
    // Split the current name into first and last
    const parts = (user.name || "").split(" ");
    setFirstNameValue(parts[0] || "");
    setLastNameValue(parts.slice(1).join(" ") || "");
    setNameError(null);
    setEditingName(true);
  };

  const cancelEditingName = () => {
    setEditingName(false);
    setNameError(null);
  };

  const saveName = async () => {
    const trimmedFirst = firstNameValue.trim();
    const trimmedLast = lastNameValue.trim();

    if (!trimmedFirst) {
      setNameError("First name is required.");
      return;
    }

    setSavingName(true);
    setNameError(null);

    try {
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: trimmedFirst, lastName: trimmedLast }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNameError(data.error ?? "Failed to update name.");
        if (data.retryAfterMs) {
          const hours = Math.ceil(data.retryAfterMs / (60 * 60 * 1000));
          setCooldownInfo(`You can change your name again in ${hours} hour${hours === 1 ? "" : "s"}.`);
        }
      } else {
        setEditingName(false);
        window.location.reload();
      }
    } catch {
      setNameError("Network error.");
    } finally {
      setSavingName(false);
    }
  };
  const totalSolved = solved.size;
  const top150Solved = solvedCountForTopics(solved, top150Topics);
  const neetcodeSolved = solvedCountForTopics(solved, neetcodeTopics);
  const top150Pct = Math.round((top150Solved / top150Total) * 100);
  const neetcodePct = Math.round((neetcodeSolved / neetcodeTotal) * 100);

  // Sorting algorithms traced.
  const sortingTraced = sortingAlgorithms.filter(
    (algo) => learningProgress[algo.id]?.traced,
  ).length;
  const sortingPct = Math.round((sortingTraced / sortingAlgorithms.length) * 100);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <UserAvatar
          name={displayName}
          picture={user.picture}
          className="h-16 w-16 shrink-0"
        />
        <div className="flex-1">
          {editingName ? (
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">First Name</label>
                  <input
                    autoFocus
                    value={firstNameValue}
                    onChange={(e) => setFirstNameValue(e.target.value)}
                    className="mt-1 w-full rounded border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    maxLength={50}
                    disabled={savingName}
                    placeholder="First name"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Last Name</label>
                  <input
                    value={lastNameValue}
                    onChange={(e) => setLastNameValue(e.target.value)}
                    className="mt-1 w-full rounded border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    maxLength={50}
                    disabled={savingName}
                    placeholder="Last name (optional)"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={saveName} disabled={savingName}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEditingName} disabled={savingName}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
              {cooldownInfo && !nameError && (
                <p className="text-xs text-muted-foreground">{cooldownInfo}</p>
              )}
            </div>
          ) : (
            <div className="group">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-medium tracking-tight">{displayName}</h1>
                <button
                  type="button"
                  onClick={startEditingName}
                  className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  title="Edit name"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
              {username && (
                <div className="flex items-center gap-2">
                  <UsernameBadge username={username} size="sm" />
                  {usernameCooldown === null && (
                    <button
                      type="button"
                      onClick={startEditingUsername}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      title="Change username"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                {memberSince !== null ? `Member since ${formatDate(memberSince)}` : null}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Username edit dialog */}
      {editingUsername && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-medium">Change Username</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your current username is @{username}. You can change it once every 30 days.
            </p>
            <div className="mt-4 space-y-2">
              <div className="relative">
                <input
                  autoFocus
                  value={usernameValue}
                  onChange={(e) => {
                    setUsernameValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                    setUsernameError(null);
                  }}
                  className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                  maxLength={30}
                  disabled={savingUsername}
                  placeholder="new_username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!checkingUsername && usernameAvailable === true && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {!checkingUsername && usernameAvailable === false && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                3-30 characters, lowercase letters, numbers, and underscores only
              </p>
              {usernameAvailable === false && (
                <p className="text-xs text-red-500">This username is already taken</p>
              )}
              {usernameError && (
                <p className="text-xs text-red-500">{usernameError}</p>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={cancelEditingUsername}
                disabled={savingUsername}
              >
                Cancel
              </Button>
              <Button
                onClick={saveUsername}
                disabled={savingUsername || usernameAvailable === false || usernameValue.length < 3 || usernameValue === username}
              >
                {savingUsername ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Change Username
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="mt-8">
        <StatsCards timestamps={combinedTimestamps} totalSolvedCount={totalSolved} />
      </div>

      {/* Activity heatmap */}
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-medium tracking-tight">Activity</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Questions solved and algorithms traced per day
        </p>
        <div className="mt-4">
          <ActivityHeatmap timestamps={combinedTimestamps} />
        </div>
      </section>

      {/* Progress chart */}
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-medium tracking-tight">Solve Rate</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Questions solved and traces run per week — hover or click a bar for details
        </p>
        <div className="mt-4">
          <ProgressChart timestamps={combinedTimestamps} runDays={ledgerDays} />
        </div>
      </section>

      {/* Time tracking stats */}
      <section className="mt-8">
        <TimeStats />
      </section>

      {/* Progress by bank */}
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-medium tracking-tight">Progress by Bank</h2>
        <div className="mt-4 space-y-4">
          {/* Top 150 */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
                Top Interview 150
              </span>
              <span className="text-muted-foreground">
                {top150Solved} / {top150Total}{" "}
                <span className="font-mono text-xs">({top150Pct}%)</span>
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={top150Pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${top150Pct}%` }}
              />
            </div>
          </div>
          {/* NeetCode */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Route className="h-4 w-4 text-amber-500" aria-hidden="true" />
                NeetCode Roadmap
              </span>
              <span className="text-muted-foreground">
                {neetcodeSolved} / {neetcodeTotal}{" "}
                <span className="font-mono text-xs">({neetcodePct}%)</span>
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={neetcodePct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${neetcodePct}%` }}
              />
            </div>
          </div>
          {/* Sorting Algorithms */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                <Shuffle className="h-4 w-4 text-sky-500" aria-hidden="true" />
                Sorting Algorithms
              </span>
              <span className="text-muted-foreground">
                {sortingTraced} / {sortingAlgorithms.length}{" "}
                <span className="font-mono text-xs">({sortingPct}%)</span>
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={sortingPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: `${sortingPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Topic breakdown */}
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-medium tracking-tight">Topic Breakdown</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Top Interview 150 progress by topic
        </p>
        <div className="mt-4 space-y-2.5">
          {topicBreakdown.map((topic) => (
            <div key={topic.title}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{topic.title}</span>
                <span className="font-mono text-muted-foreground">
                  {topic.solved}/{topic.total}
                </span>
              </div>
              <div
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={topic.total === 0 ? 0 : Math.round((topic.solved / topic.total) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${
                      topic.total === 0
                        ? 0
                        : Math.round((topic.solved / topic.total) * 100)
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-medium tracking-tight">Recent Activity</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Solved questions and traced algorithms across all banks
        </p>
        {recentActivity.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No activity yet. Head to{" "}
            <Link href="/learn" className="text-primary hover:underline">
              Learn
            </Link>{" "}
            to start practicing!
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-border/60">
            {recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {item.no > 0 ? (
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.no}
                      </span>
                    ) : (
                      <Shuffle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="truncate text-sm font-medium">
                      {item.title}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge
                      variant="secondary"
                      className="h-4 px-1.5 text-[9px]"
                    >
                      {item.bank}
                    </Badge>
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span title={new Date(item.ts).toLocaleString()}>
                      {relativeTime(item.ts)}
                    </span>
                  </div>
                </div>
                {item.traceable && item.href ? (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 gap-1 px-2 text-[10px]"
                  >
                    <Link href={item.href}>
                      <Play className="h-3 w-3" aria-hidden="true" />
                      Trace
                    </Link>
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Quick links */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/learn">
            Continue Learning
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/collections">
            My Collections
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
