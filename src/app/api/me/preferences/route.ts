import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";

// ---------------------------------------------------------------------------
// GET  /api/me/preferences  →  { dailyGoal: number }
// PUT  /api/me/preferences  →  { dailyGoal: number }  (upserts)
//
// Manages per-user preferences: daily practice goal, etc.
// ---------------------------------------------------------------------------

const DEFAULT_DAILY_GOAL = 5;
const MIN_DAILY_GOAL = 1;
const MAX_DAILY_GOAL = 100;

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in." }, { status: 401 });
  }

  try {
    const { data, error } = await getServiceClient()
      .from("user_preferences")
      .select("daily_goal")
      .eq("user_id", userId)
      .single();

    // No row yet → return defaults.
    if (error || !data) {
      return NextResponse.json({ dailyGoal: DEFAULT_DAILY_GOAL });
    }

    return NextResponse.json({ dailyGoal: data.daily_goal ?? DEFAULT_DAILY_GOAL });
  } catch {
    return NextResponse.json({ dailyGoal: DEFAULT_DAILY_GOAL });
  }
}

export async function PUT(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawGoal = body.dailyGoal;
  const dailyGoal =
    typeof rawGoal === "number" && Number.isInteger(rawGoal)
      ? Math.max(MIN_DAILY_GOAL, Math.min(MAX_DAILY_GOAL, rawGoal))
      : DEFAULT_DAILY_GOAL;

  try {
    const { error } = await getServiceClient().from("user_preferences").upsert(
      { user_id: userId, daily_goal: dailyGoal, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ dailyGoal });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
