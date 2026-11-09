import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";

/**
 * Public, unauthenticated user profile endpoint.
 *
 * Returns user info + aggregated DSA stats from the question_solved table.
 * Only exposes data for users with a public profile (all users by default;
 * can be restricted via a `profile_public` column later).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = getServiceClient();

  // Support both UUID and username lookup
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  let userQuery = client
    .from("users")
    .select("id, name, username, avatar_url, created_at");
  
  if (isUuid) {
    userQuery = userQuery.eq("id", id);
  } else {
    // Lookup by username (case-insensitive)
    userQuery = userQuery.ilike("username", id);
  }
  
  const { data: user, error: userError } = await userQuery.single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Use user.id for queries (always the UUID)
  const userId = user.id;

  // Fetch solved questions for both banks
  const [top150Result, neetcodeResult] = await Promise.all([
    client
      .from("question_solved")
      .select("question_no, solved_at")
      .eq("user_id", userId)
      .eq("bank", "top150"),
    client
      .from("question_solved")
      .select("question_no, solved_at")
      .eq("user_id", userId)
      .eq("bank", "neetcode"),
  ]);

  const top150Solved = top150Result.data ?? [];
  const neetcodeSolved = neetcodeResult.data ?? [];

  // Calculate stats
  const totalSolved = new Set([
    ...top150Solved.map((r) => r.question_no),
    ...neetcodeSolved.map((r) => r.question_no),
  ]).size;

  // Streak calculation: consecutive days with at least one solve
  const allTimestamps = [
    ...top150Solved.map((r) => new Date(r.solved_at).getTime()),
    ...neetcodeSolved.map((r) => new Date(r.solved_at).getTime()),
  ].sort((a, b) => b - a); // newest first

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: string | null = null;

  // Group by day
  const daySet = new Set(
    allTimestamps.map((ts) => new Date(ts).toISOString().split("T")[0]),
  );
  const sortedDays = Array.from(daySet).sort().reverse();

  // Calculate current streak (from today backwards)
  const today = new Date().toISOString().split("T")[0];
  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    const expected = expectedDate.toISOString().split("T")[0];
    if (sortedDays[i] === expected) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let prevDay: string | null = null;
  for (const day of sortedDays.reverse()) {
    if (prevDay) {
      // Check if current day is consecutive with previous day
      const dayDate = new Date(day + "T00:00:00Z");
      const prevDateObj = new Date(prevDay + "T00:00:00Z");
      const diffMs = prevDateObj.getTime() - dayDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    prevDay = day;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    },
    stats: {
      totalSolved,
      top150Solved: top150Solved.length,
      neetcodeSolved: neetcodeSolved.length,
      currentStreak,
      longestStreak,
      totalDaysActive: daySet.size,
    },
  }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
