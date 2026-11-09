import { NextResponse } from "next/server";

import { getServiceClient } from "@/lib/db";

const SELECT_COLUMNS = "id, name, thumbnail, user_id, created_at, updated_at";

export async function GET() {
  const client = getServiceClient();
  const { data, error } = await client
    .from("whiteboards")
    .select(SELECT_COLUMNS)
    .eq("public", true)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Manual join: fetch author info for each whiteboard's user_id.
  const userIds = [...new Set((data ?? []).map((wb) => wb.user_id))];
  let authorMap: Record<string, { name: string | null; username: string | null; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: users } = await client
      .from("users")
      .select("id, name, username, avatar_url")
      .in("id", userIds);
    if (users) {
      authorMap = Object.fromEntries(users.map((u) => [u.id, { name: u.name, username: u.username, avatar_url: u.avatar_url }]));
    }
  }

  const whiteboards = (data ?? []).map((wb) => ({
    ...wb,
    author: authorMap[wb.user_id] ?? null,
  }));
  return NextResponse.json({ whiteboards }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
