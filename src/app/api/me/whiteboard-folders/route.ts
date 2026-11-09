import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const FOLDER_COLUMNS = "id, name, created_at, updated_at";
const MAX_FOLDERS = 50;

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your folders." }, { status: 401 });
  }

  const { data, error } = await getServiceClient()
    .from("whiteboard_folders")
    .select(FOLDER_COLUMNS)
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ folders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const ip = getClientIp(request);
  const limit = checkRateLimit(`whiteboard-folder:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to create a folder." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length === 0 || name.length > 100) {
    return NextResponse.json(
      { error: "Folder name must be between 1 and 100 characters." },
      { status: 400 },
    );
  }

  const client = getServiceClient();
  const { count } = await client
    .from("whiteboard_folders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= MAX_FOLDERS) {
    return NextResponse.json(
      { error: `You can have at most ${MAX_FOLDERS} folders.` },
      { status: 400 },
    );
  }

  const { data, error } = await client
    .from("whiteboard_folders")
    .insert({ user_id: userId, name })
    .select(FOLDER_COLUMNS)
    .single();

  if (error) {
    // Unique index on (user_id, lower(name)).
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `A folder named “${name}” already exists.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ folder: data });
}
