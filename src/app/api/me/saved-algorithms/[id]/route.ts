import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your saved algorithms." }, { status: 401 });
  }
  const { id } = await context.params;

  const { data, error } = await getServiceClient()
    .from("saved_algorithms")
    .select("id, title, topic, language, code, input_data, tags, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ algorithm: data });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to delete saved algorithms." }, { status: 401 });
  }
  const { id } = await context.params;

  // .select() returns the deleted rows, so we can tell "deleted" from
  // "didn't exist / not yours" — the latter must be a 404, not a fake success.
  const { data, error } = await getServiceClient()
    .from("saved_algorithms")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}


export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to update saved algorithms." }, { status: 401 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};
  if (typeof body.topic === "string") updates.topic = body.topic;
  if (typeof body.title === "string") updates.title = body.title;
  if (Array.isArray(body.tags)) updates.tags = body.tags;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await getServiceClient()
    .from("saved_algorithms")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, title, topic, language, code, input_data, tags, created_at, updated_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json({ algorithm: data[0] });
}
