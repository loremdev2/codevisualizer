import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";

// ---------------------------------------------------------------------------
// GET /api/activity/summary?days=90 → { days: [{ date, traceRuns, questionsSolved }] }
//
// Aggregates the signed-in user's ledger events into per-day counts, keyed by
// the *client's* local date (pass `tzOffset` = new Date().getTimezoneOffset()
// from the browser). Feeds the solve-rate chart, heatmap, and stats strip
// from one truth instead of four parallel records.
// ---------------------------------------------------------------------------

const DEFAULT_DAYS = 90;
const MAX_DAYS = 365;

function dateKeyFor(epochMs: number, tzOffsetMinutes: number): string {
  // Client convention: getTimezoneOffset() returns minutes to add to local
  // time to get UTC (e.g. -330 for UTC+5:30). Shifting by it yields a UTC
  // timestamp whose date equals the client's local date.
  const shifted = new Date(epochMs - tzOffsetMinutes * 60_000);
  return shifted.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in." }, { status: 401 });
  }

  const daysParam = Number(request.nextUrl.searchParams.get("days"));
  const days =
    Number.isFinite(daysParam) && daysParam > 0
      ? Math.min(Math.floor(daysParam), MAX_DAYS)
      : DEFAULT_DAYS;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const tzRaw = Number(request.nextUrl.searchParams.get("tzOffset"));
  const tzOffset = Number.isFinite(tzRaw) ? Math.max(-840, Math.min(840, tzRaw)) : 0;

  try {
    const { data, error } = await getServiceClient()
      .from("activity_events")
      .select("event, created_at")
      .eq("actor_kind", "user")
      .eq("actor_id", userId)
      .in("event", ["trace_run", "question_solved"])
      .gte("created_at", since);

    // Fail open: if the table does not exist yet (migration pending) or the
    // query fails for any reason, return empty results — the client treats
    // null/empty as "no ledger data, use local timestamps".
    if (error) return NextResponse.json({ days: [] });

    const byDay = new Map<string, { date: string; traceRuns: number; questionsSolved: number }>();
    for (const row of (data ?? []) as Array<{ event: string; created_at: string }>) {
      const date = dateKeyFor(new Date(row.created_at).getTime(), tzOffset);
      const day = byDay.get(date) ?? { date, traceRuns: 0, questionsSolved: 0 };
      if (row.event === "trace_run") day.traceRuns += 1;
      else day.questionsSolved += 1;
      byDay.set(date, day);
    }

    const out = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json({ days: out });
  } catch {
    return NextResponse.json({ days: [] });
  }
}
