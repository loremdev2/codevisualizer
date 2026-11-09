import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";

// ---------------------------------------------------------------------------
// GET /api/me/activity → { timestamps: Record<number, number> }
//
// Returns ALL solved timestamps from Supabase for the authenticated user,
// across all banks. Used by the /profile heatmap so it's backed by Supabase,
// not just localStorage.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in." }, { status: 401 });
  }

  try {
    const { data, error } = await getServiceClient()
      .from("question_solved")
      .select("question_no, solved_at")
      .eq("user_id", userId)
      .order("solved_at", { ascending: false });

    if (error) throw error;

    const timestamps: Record<number, number> = {};
    for (const row of data ?? []) {
      const no = (row as { question_no: number; solved_at: string }).question_no;
      const ts = new Date(
        (row as { question_no: number; solved_at: string }).solved_at,
      ).getTime();
      // Keep the older timestamp if the question appears in multiple banks.
      if (!timestamps[no] || ts < timestamps[no]) {
        timestamps[no] = ts;
      }
    }

    return NextResponse.json({ timestamps });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
