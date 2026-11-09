import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";

const FOLDER_COLUMNS = "id, name, created_at, updated_at";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to rename folders." }, { status: 401 });
  }

  const { id } = await params;

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

  const { data, error } = await getServiceClient()
    .from("whiteboard_folders")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select(FOLDER_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `A folder named “${name}” already exists.` },
        { status: 409 },
      );
    }
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ folder: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to delete folders." }, { status: 401 });
  }

  const { id } = await params;

  // whiteboards.folder_id is ON DELETE SET NULL, so the whiteboards inside
  // survive and fall back to "Unfiled".
  const { error } = await getServiceClient()
    .from("whiteboard_folders")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
