import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";

// ---------------------------------------------------------------------------
// GET /api/activity/time-stats → { avgByDifficulty, totalTimeMs, questionCount }
//
// Returns time tracking statistics for the signed-in user, broken down by
// question difficulty. Used by the profile page to show "avg 23 min on Medium".
// ---------------------------------------------------------------------------

type DifficultyStats = {
  difficulty: string;
  avgMs: number;
  count: number;
  totalMs: number;
};

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in." }, { status: 401 });
  }

  try {
    // Fetch all question_solved events with duration_ms from the activity ledger.
    const { data, error } = await getServiceClient()
      .from("activity_events")
      .select("question_no, duration_ms, created_at")
      .eq("actor_kind", "user")
      .eq("actor_id", userId)
      .eq("event", "question_solved")
      .not("duration_ms", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ avgByDifficulty: [], totalTimeMs: 0, questionCount: 0 });
    }

    const rows = (data ?? []) as Array<{
      question_no: number;
      duration_ms: number;
      created_at: string;
    }>;

    if (rows.length === 0) {
      return NextResponse.json({ avgByDifficulty: [], totalTimeMs: 0, questionCount: 0 });
    }

    // Look up difficulty for each question from the Top 150 + NeetCode lists.
    // Dynamic import to avoid circular deps — the question lists are static.
    const { top150Topics } = await import("@/lib/top150");
    const { neetcodeTopics } = await import("@/lib/neetcode");

    const difficultyMap = new Map<number, string>();
    for (const topic of top150Topics) {
      for (const q of topic.questions) {
        difficultyMap.set(q.no, q.difficulty);
      }
    }
    for (const topic of neetcodeTopics) {
      for (const q of topic.questions) {
        if (!difficultyMap.has(q.no)) {
          difficultyMap.set(q.no, q.difficulty);
        }
      }
    }

    // Aggregate by difficulty.
    const byDifficulty = new Map<string, { totalMs: number; count: number }>();
    let totalTimeMs = 0;

    for (const row of rows) {
      const difficulty = difficultyMap.get(row.question_no) ?? "Unknown";
      const existing = byDifficulty.get(difficulty) ?? { totalMs: 0, count: 0 };
      existing.totalMs += row.duration_ms;
      existing.count += 1;
      byDifficulty.set(difficulty, existing);
      totalTimeMs += row.duration_ms;
    }

    const avgByDifficulty: DifficultyStats[] = [...byDifficulty.entries()]
      .map(([difficulty, stats]) => ({
        difficulty,
        avgMs: Math.round(stats.totalMs / stats.count),
        count: stats.count,
        totalMs: stats.totalMs,
      }))
      .sort((a, b) => {
        const order = ["Easy", "Medium", "Hard"];
        return order.indexOf(a.difficulty) - order.indexOf(b.difficulty);
      });

    return NextResponse.json({
      avgByDifficulty,
      totalTimeMs,
      questionCount: rows.length,
    });
  } catch {
    return NextResponse.json({ avgByDifficulty: [], totalTimeMs: 0, questionCount: 0 });
  }
}
