import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";

/**
 * Public activity endpoint for user profiles.
 *
 * Returns solved timestamps for any user, so their heatmap can be
 * rendered on public profiles. No authentication required.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = getServiceClient();

  // Support both UUID and username lookup
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  
  let userQuery = client.from("users").select("id");
  
  if (isUuid) {
    userQuery = userQuery.eq("id", id);
  } else {
    userQuery = userQuery.ilike("username", id);
  }
  
  const { data: userData } = await userQuery.single();
  
  if (!userData) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  
  const userId = userData.id;

  try {
    const { data, error } = await client
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

    return NextResponse.json(
      { timestamps },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
