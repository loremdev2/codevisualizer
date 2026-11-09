// ---------------------------------------------------------------------------
// Activity ledger — one append-only event stream behind every "did something"
// surface (solve-rate chart, heatmap, streaks, guest free-trace quota).
//
// Server writes land in `activity_events` via /api/activity/*; this module
// holds the client-safe pieces: types, local-time date keys, weekly
// bucketing (shared by the chart and the summary route so they can never
// disagree), and typed fetch helpers.
//
// Safe to import from client components — no server-only dependencies.
// ---------------------------------------------------------------------------

import { ANONYMOUS_TRACE_LIMIT } from "@/lib/visualizer-utils";

export { ANONYMOUS_TRACE_LIMIT };

/** httpOnly cookie carrying the anonymous actor id (a random uuid). */
export const ANON_ACTOR_COOKIE = "dsa_anon";

/** Anon cookie lifetime: 180 days — long enough to survive casual gaps. */
export const ANON_ACTOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type ActivityEventName =
  | "trace_run"
  | "question_solved"
  | "template_traced";

export type ActivityBank = "top150" | "neetcode" | "sorting";

/** One day of aggregated activity, keyed by local date `YYYY-MM-DD`. */
export type DailyActivity = {
  date: string;
  traceRuns: number;
  questionsSolved: number;
};

/** Guest free-trace quota as reported by the server. */
export type AnonQuota = {
  used: number;
  limit: number;
  remaining: number;
};

export type WeekBucket = {
  label: string;
  /** Human-readable range, e.g. "Aug 3 – Aug 9". */
  range: string;
  count: number;
  /** Timestamp of the most recent event in the week (day precision, 0 if none). */
  lastEventAt: number;
};

/** Local-timezone date key — matches how the heatmap buckets timestamps. */
export function localDateKey(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Builds daily aggregates from a `{ questionNo: solvedAtMs }` map. */
export function daysFromTimestamps(
  timestamps: Record<number, number>,
): DailyActivity[] {
  const byDay = new Map<string, DailyActivity>();
  for (const ts of Object.values(timestamps)) {
    if (!(ts > 0)) continue;
    const key = localDateKey(ts);
    const day = byDay.get(key) ?? { date: key, traceRuns: 0, questionsSolved: 0 };
    day.questionsSolved += 1;
    byDay.set(key, day);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Merges two day lists (e.g. local guest data + server summary). */
export function mergeDays(a: DailyActivity[], b: DailyActivity[]): DailyActivity[] {
  const byDay = new Map<string, DailyActivity>();
  for (const day of [...a, ...b]) {
    const merged = byDay.get(day.date) ?? { date: day.date, traceRuns: 0, questionsSolved: 0 };
    merged.traceRuns += day.traceRuns;
    merged.questionsSolved += day.questionsSolved;
    byDay.set(day.date, merged);
  }
  return [...byDay.values()].sort((x, y) => x.date.localeCompare(y.date));
}

/**
 * Buckets daily activity into `weeks` weekly windows ending today.
 * Week = [start, end) in local time; the last bucket is the current,
 * still-running week. `metric` picks what gets counted.
 */
export function weeklyBuckets(
  days: DailyActivity[],
  metric: "questionsSolved" | "traceRuns",
  weeks = 12,
  now = new Date(),
): WeekBucket[] {
  const byDay = new Map(days.map((d) => [d.date, d]));
  const buckets: WeekBucket[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    // Windows are tomorrow-anchored: bucket w covers [end − 7d, end) with
    // end = tomorrow − 7·w, so the LAST bucket ([today − 6d, tomorrow))
    // includes today. A plain "now − 7·w" end would silently drop everything
    // that happened today from the current week.
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 1 - 7 * w);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    let count = 0;
    let lastEventAt = 0;
    const cursor = new Date(weekStart);
    while (cursor < weekEnd) {
      const day = byDay.get(localDateKey(cursor.getTime()));
      if (day) {
        count += day[metric];
        if (day[metric] > 0) {
          lastEventAt = Math.max(lastEventAt, cursor.getTime());
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    // Labels show the last *included* day (end − 1d), so the current week is
    // labeled with today's date, matching the old chart's labels.
    const lastDay = new Date(weekEnd);
    lastDay.setDate(lastDay.getDate() - 1);
    buckets.push({
      label: fmt(lastDay),
      range: `${fmt(weekStart)} – ${fmt(lastDay)}`,
      count,
      lastEventAt,
    });
  }

  return buckets;
}

// ---------------------------------------------------------------------------
// Client fetch helpers
// ---------------------------------------------------------------------------

/** Fetches the guest's server-side free-trace quota. Null on any failure. */
export async function fetchAnonQuota(): Promise<AnonQuota | null> {
  try {
    const res = await fetch("/api/activity/quota", { credentials: "same-origin" });
    if (!res.ok) return null;
    const body = (await res.json()) as { quota?: AnonQuota };
    return body.quota ?? null;
  } catch {
    return null;
  }
}

/**
 * Records a ledger event. Returns the fresh quota when the server includes
 * one (guest trace_run), so the badge updates without a second round-trip.
 * Never throws — telemetry must not break a run.
 */
export async function postActivityEvent(body: {
  event: ActivityEventName;
  templateId?: string;
  bank?: ActivityBank;
  questionNo?: number;
  outcome?: string;
}): Promise<AnonQuota | null> {
  try {
    const res = await fetch("/api/activity/events", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { quota?: AnonQuota };
    return data.quota ?? null;
  } catch {
    return null;
  }
}

/** Shape of GET /api/activity/summary. */
export type ActivitySummary = { days: DailyActivity[] };

/** Fetches the signed-in user's aggregated activity (last 90 days). */
export async function fetchActivitySummary(): Promise<ActivitySummary | null> {
  try {
    const res = await fetch("/api/activity/summary", { credentials: "same-origin" });
    if (!res.ok) return null;
    const body = (await res.json()) as ActivitySummary;
    return Array.isArray(body.days) ? body : null;
  } catch {
    return null;
  }
}
