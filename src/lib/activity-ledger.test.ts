import { describe, expect, it } from "vitest";

import {
  daysFromTimestamps,
  localDateKey,
  mergeDays,
  weeklyBuckets,
  type DailyActivity,
} from "@/lib/activity-ledger";

// ---------------------------------------------------------------------------
// Pure helpers for the activity ledger (weekly bucketing, day aggregation).
// All dates below are constructed in *local* time to match how the helpers
// key days, so the tests are timezone-independent.
// ---------------------------------------------------------------------------

const day = (offsetDays: number, hour = 12): Date => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const ms = (d: Date) => d.getTime();

describe("localDateKey", () => {
  it("formats as YYYY-MM-DD in local time", () => {
    const d = new Date(2026, 8, 13, 14, 30); // Sep 13 2026 local
    expect(localDateKey(ms(d))).toBe("2026-09-13");
  });

  it("zero-pads month and day", () => {
    const d = new Date(2026, 0, 5);
    expect(localDateKey(ms(d))).toBe("2026-01-05");
  });
});

describe("daysFromTimestamps", () => {
  it("aggregates multiple timestamps on the same day", () => {
    const days = daysFromTimestamps({
      1: ms(day(0, 9)),
      2: ms(day(0, 15)),
      3: ms(day(1)),
    });
    expect(days).toHaveLength(2);
    const today = days.find((d) => d.date === localDateKey(ms(day(0))));
    expect(today?.questionsSolved).toBe(2);
    expect(today?.traceRuns).toBe(0);
  });

  it("drops non-positive timestamps", () => {
    expect(daysFromTimestamps({ 1: 0, 2: -5 })).toHaveLength(0);
  });

  it("sorts days ascending", () => {
    const days = daysFromTimestamps({ 1: ms(day(2)), 2: ms(day(0)), 3: ms(day(1)) });
    expect(days.map((d) => d.date)).toEqual(
      days.map((d) => d.date).sort((a, b) => a.localeCompare(b)),
    );
  });
});

describe("mergeDays", () => {
  it("sums both metrics for overlapping days", () => {
    const a: DailyActivity[] = [{ date: "2026-09-13", traceRuns: 2, questionsSolved: 1 }];
    const b: DailyActivity[] = [{ date: "2026-09-13", traceRuns: 3, questionsSolved: 0 }];
    const merged = mergeDays(a, b);
    expect(merged).toEqual([{ date: "2026-09-13", traceRuns: 5, questionsSolved: 1 }]);
  });

  it("keeps non-overlapping days", () => {
    const merged = mergeDays(
      [{ date: "2026-09-12", traceRuns: 1, questionsSolved: 0 }],
      [{ date: "2026-09-13", traceRuns: 0, questionsSolved: 2 }],
    );
    expect(merged.map((d) => d.date)).toEqual(["2026-09-12", "2026-09-13"]);
  });
});

describe("weeklyBuckets", () => {
  it("returns 12 buckets by default with the current week last", () => {
    const buckets = weeklyBuckets([], "questionsSolved");
    expect(buckets).toHaveLength(12);
  });

  it("counts events inside each weekly window", () => {
    const days: DailyActivity[] = [
      { date: localDateKey(ms(day(1))), traceRuns: 0, questionsSolved: 2 },
      { date: localDateKey(ms(day(8))), traceRuns: 0, questionsSolved: 3 },
    ];
    const buckets = weeklyBuckets(days, "questionsSolved");
    expect(buckets[11].count).toBe(2); // current week
    expect(buckets[10].count).toBe(3); // one week ago
    expect(buckets[0].count).toBe(0); // 12 weeks ago
  });

  it("counts the requested metric independently", () => {
    const days: DailyActivity[] = [
      { date: localDateKey(ms(day(0))), traceRuns: 7, questionsSolved: 1 },
    ];
    expect(weeklyBuckets(days, "traceRuns")[11].count).toBe(7);
    expect(weeklyBuckets(days, "questionsSolved")[11].count).toBe(1);
  });

  it("records the last event day for weeks with activity", () => {
    const days: DailyActivity[] = [
      { date: localDateKey(ms(day(1))), traceRuns: 0, questionsSolved: 1 },
    ];
    const buckets = weeklyBuckets(days, "questionsSolved");
    expect(buckets[11].lastEventAt).toBeGreaterThan(0);
    expect(buckets[10].lastEventAt).toBe(0);
  });

  it("handles metric-less days without breaking totals", () => {
    const days: DailyActivity[] = [
      { date: localDateKey(ms(day(0))), traceRuns: 0, questionsSolved: 0 },
    ];
    expect(weeklyBuckets(days, "traceRuns")[11].count).toBe(0);
  });
});
