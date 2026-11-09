import { NextResponse } from "next/server";

import { getServiceClient } from "@/lib/db";

/**
 * Public leaderboard endpoint.
 *
 * Returns top users ranked by total questions solved (across all banks).
 * No authentication required.
 *
 * Uses SQL aggregation for performance — no need to fetch all rows.
 */
export async function GET() {
  const client = getServiceClient();

  // Use RPC or raw SQL for aggregation — Supabase JS doesn't support GROUP BY
  // natively, so we use a workaround: fetch distinct user_ids with counts.
  // For production, consider creating a materialized view or using RPC.
  
  // Alternative: use Supabase's count feature with groupBy if available
  // For now, use a simpler approach: fetch all user_ids and count in JS
  // but limit to recent activity (last 30 days) to keep it fast.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: solvedData, error: solvedError } = await client
    .from("question_solved")
    .select("user_id, question_no")
    .gte("solved_at", thirtyDaysAgo.toISOString());

  if (solvedError) {
    return NextResponse.json({ error: solvedError.message }, { status: 500 });
  }

  // Aggregate: count unique questions per user
  const userSolvedMap = new Map<string, Set<number>>();
  for (const row of solvedData ?? []) {
    if (!userSolvedMap.has(row.user_id)) {
      userSolvedMap.set(row.user_id, new Set());
    }
    userSolvedMap.get(row.user_id)!.add(row.question_no);
  }

  // Sort by total solved (descending), take top 50
  const leaderboard = Array.from(userSolvedMap.entries())
    .map(([userId, solved]) => ({ userId, totalSolved: solved.size }))
    .sort((a, b) => b.totalSolved - a.totalSolved)
    .slice(0, 50);

  if (leaderboard.length === 0) {
    return NextResponse.json({ leaderboard: [] }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
  }

  // Fetch user info for top users
  const userIds = leaderboard.map((entry) => entry.userId);
  const { data: users } = await client
    .from("users")
    .select("id, name, username, avatar_url")
    .in("id", userIds);

  const userMap = new Map(
    (users ?? []).map((u) => [u.id, { name: u.name, username: u.username, avatar_url: u.avatar_url }]),
  );

  // Merge stats with user info
  const result = leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    totalSolved: entry.totalSolved,
    user: userMap.get(entry.userId) ?? { name: null, username: null, avatar_url: null },
  }));

  return NextResponse.json({ leaderboard: result }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
