import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import { resolveFolderId } from "@/lib/whiteboard-folders";

const SELECT_COLUMNS =
  "id, name, data, thumbnail, public, user_id, folder_id, created_at, updated_at";
const UPDATE_RESPONSE_COLUMNS = "id, name, public, folder_id, updated_at";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your whiteboards." }, { status: 401 });
  }

  const { id } = await params;
  const client = getServiceClient();

  const { data, error } = await client
    .from("whiteboards")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: "Whiteboard not found." }, { status: 404 });
  }

  const { data: user } = await client
    .from("users")
    .select("name, avatar_url")
    .eq("id", data.user_id)
    .maybeSingle();

  return NextResponse.json({ whiteboard: { ...data, author: user ?? null } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to update whiteboards." }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length === 0 || name.length > 200) {
      return NextResponse.json({ error: "Name must be between 1 and 200 characters." }, { status: 400 });
    }
    updates.name = name;
  }
  if (body.data !== undefined) {
    updates.data = body.data;
  }
  if (typeof body.public === "boolean") {
    updates.public = body.public;
  }
  if (typeof body.thumbnail === "string") {
    updates.thumbnail = body.thumbnail;
  } else if (body.thumbnail === null) {
    updates.thumbnail = null;
  }
  // Move between folders: a string id, or null to unfile.
  if (body.folder_id !== undefined) {
    const resolved = await resolveFolderId(getServiceClient(), userId, body.folder_id);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    updates.folder_id = resolved.folderId;
  }

  const { data, error } = await getServiceClient()
    .from("whiteboards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select(UPDATE_RESPONSE_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ whiteboard: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to delete whiteboards." }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await getServiceClient()
    .from("whiteboards")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
