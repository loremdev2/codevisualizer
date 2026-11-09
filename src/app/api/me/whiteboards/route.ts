import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { resolveFolderId } from "@/lib/whiteboard-folders";

const WB_LIST_COLUMNS = "id, name, thumbnail, user_id, folder_id, created_at, updated_at";

async function withAuthor(wb: Record<string, unknown>) {
  const client = getServiceClient();
  const { data: user } = await client
    .from("users")
    .select("name, username, avatar_url")
    .eq("id", wb.user_id)
    .maybeSingle();
  return { ...wb, author: user ?? null };
}

async function withAuthors(wbs: Record<string, unknown>[]) {
  const client = getServiceClient();
  const userIds = [...new Set(wbs.map((w) => w.user_id))];
  if (userIds.length === 0) return wbs.map((w) => ({ ...w, author: null }));
  const { data: users } = await client
    .from("users")
    .select("id, name, username, avatar_url")
    .in("id", userIds);
  const map = Object.fromEntries(
    (users ?? []).map((u) => [u.id, { name: u.name, username: u.username, avatar_url: u.avatar_url }]),
  );
  return wbs.map((w) => ({ ...w, author: map[w.user_id as string] ?? null }));
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your whiteboards." }, { status: 401 });
  }

  const { data, error } = await getServiceClient()
    .from("whiteboards")
    .select(WB_LIST_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const whiteboards = await withAuthors(data ?? []);
  return NextResponse.json({ whiteboards });
}

export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const ip = getClientIp(request);
  const limit = checkRateLimit(`whiteboard:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to create a whiteboard." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "Untitled whiteboard";
  if (name.length > 200) {
    return NextResponse.json({ error: "Name is too long." }, { status: 400 });
  }

  let folderId: string | null = null;
  if (body.folder_id !== undefined && body.folder_id !== null) {
    const resolved = await resolveFolderId(getServiceClient(), userId, body.folder_id);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    folderId = resolved.folderId;
  }

  const { data, error } = await getServiceClient()
    .from("whiteboards")
    .insert({
      user_id: userId,
      name,
      data: (body.data as unknown) ?? {},
      thumbnail: typeof body.thumbnail === "string" ? body.thumbnail : null,
      folder_id: folderId,
      updated_at: new Date().toISOString(),
    })
    .select(WB_LIST_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const whiteboard = await withAuthor(data as Record<string, unknown>);
  return NextResponse.json({ whiteboard });
}
