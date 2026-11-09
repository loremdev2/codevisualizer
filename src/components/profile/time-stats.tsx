"use client";

import { useEffect, useState } from "react";
import { Clock, Timer } from "lucide-react";

// ---------------------------------------------------------------------------
// Time stats card: shows average time to solve per difficulty level.
// Data comes from /api/activity/time-stats (duration_ms recorded when the
// user marks a question as solved after viewing it in the visualizer).
// ---------------------------------------------------------------------------

type DifficultyStats = {
  difficulty: string;
  avgMs: number;
  count: number;
  totalMs: number;
};

type TimeStatsData = {
  avgByDifficulty: DifficultyStats[];
  totalTimeMs: number;
  questionCount: number;
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard: "bg-destructive",
  Unknown: "bg-muted-foreground",
};

function formatDuration(ms: number): string {
  if (ms < 60_000) {
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
  }
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function TimeStats() {
  const [stats, setStats] = useState<TimeStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/activity/time-stats", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.questionCount === 0) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <h2 className="text-lg font-medium tracking-tight">Time Tracking</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Average time to solve per difficulty
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/20 py-8">
          <Timer className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No time data yet. Open a question in the visualizer, then mark it solved to start tracking.
          </p>
        </div>
      </div>
    );
  }

  // Find the max avg for the bar chart scale.
  const maxAvg = Math.max(...stats.avgByDifficulty.map((d) => d.avgMs), 1);

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium tracking-tight">Time Tracking</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Average time to solve per difficulty
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2.5 py-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Total: <b className="text-foreground">{formatDuration(stats.totalTimeMs)}</b>
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {stats.avgByDifficulty.map((diff) => (
          <div key={diff.difficulty}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${DIFFICULTY_COLORS[diff.difficulty] ?? "bg-muted-foreground"}`}
                />
                <span className="font-medium">{diff.difficulty}</span>
                <span className="text-xs text-muted-foreground">
                  ({diff.count} solved)
                </span>
              </span>
              <span className="font-mono text-sm text-muted-foreground">
                {formatDuration(diff.avgMs)} avg
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${DIFFICULTY_COLORS[diff.difficulty] ?? "bg-muted-foreground"}`}
                style={{ width: `${Math.round((diff.avgMs / maxAvg) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
