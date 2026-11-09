import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import { validateUsername } from "@/lib/profanity-filter";

// 30-day cooldown for username changes (in milliseconds)
const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// POST /api/me/username — change username with 30-day cooldown
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to change your username." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const newUsername = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";

  // Validate username
  if (!newUsername) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  if (newUsername.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters." }, { status: 400 });
  }

  if (newUsername.length > 30) {
    return NextResponse.json({ error: "Username must be 30 characters or less." }, { status: 400 });
  }

  if (!/^[a-z0-9_]+$/.test(newUsername)) {
    return NextResponse.json({ error: "Username can only contain lowercase letters, numbers, and underscores." }, { status: 400 });
  }

  // Profanity check
  if (validateUsername(newUsername)) {
    return NextResponse.json({ error: "This username is not allowed." }, { status: 400 });
  }

  const client = getServiceClient();

  // Get current user data
  const { data: user, error: fetchError } = await client
    .from("users")
    .select("username, last_username_change_at")
    .eq("id", userId)
    .single();

  if (fetchError || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Check if username is the same
  if (user.username === newUsername) {
    return NextResponse.json({ error: "This is already your username." }, { status: 400 });
  }

  // Check cooldown. The auto-assigned default from sign-up (email local part)
  // can be changed immediately; the cooldown only applies after the first
  // deliberate change.
  if (user.username && user.last_username_change_at) {
    const lastChange = new Date(user.last_username_change_at).getTime();
    const now = Date.now();
    const timeSinceChange = now - lastChange;

    if (timeSinceChange < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - timeSinceChange;
      const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
      return NextResponse.json({
        error: `You can change your username again in ${days} day${days === 1 ? "" : "s"}.`,
        retryAfterMs: remainingMs,
      }, { status: 429 });
    }
  }

  // Check if new username is already taken
  const { data: taken } = await client
    .from("users")
    .select("id")
    .eq("username", newUsername)
    .maybeSingle();

  if (taken) {
    return NextResponse.json({ error: "This username is already taken." }, { status: 409 });
  }

  // Update username and track change time
  const { error: updateError } = await client
    .from("users")
    .update({
      username: newUsername,
      last_username_change_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log the change to audit table (best-effort)
  await client
    .from("username_audit_log")
    .insert({
      user_id: userId,
      old_username: user.username,
      new_username: newUsername,
    });

  return NextResponse.json({
    success: true,
    username: newUsername,
    message: "Username changed successfully!",
  });
}

// ---------------------------------------------------------------------------
// GET /api/me/username — check cooldown status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to check username status." }, { status: 401 });
  }

  const client = getServiceClient();
  const { data: user } = await client
    .from("users")
    .select("username, last_username_change_at")
    .eq("id", userId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  let cooldownRemaining = 0;
  if (user.last_username_change_at) {
    const lastChange = new Date(user.last_username_change_at).getTime();
    const now = Date.now();
    const timeSinceChange = now - lastChange;
    if (timeSinceChange < COOLDOWN_MS) {
      cooldownRemaining = COOLDOWN_MS - timeSinceChange;
    }
  }

  return NextResponse.json({
    username: user.username,
    cooldownRemaining,
    canChange: cooldownRemaining === 0,
  });
}
