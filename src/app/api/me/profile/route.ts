import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";

// ---------------------------------------------------------------------------
// POST /api/me/profile — update first name and last name
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";

  // Validate first name (required)
  if (!firstName) {
    return NextResponse.json({ error: "First name is required." }, { status: 400 });
  }
  if (firstName.length > 50) {
    return NextResponse.json({ error: "First name must be 50 characters or less." }, { status: 400 });
  }

  // Validate last name (optional)
  if (lastName && lastName.length > 50) {
    return NextResponse.json({ error: "Last name must be 50 characters or less." }, { status: 400 });
  }

  const client = getServiceClient();

  // Build display name
  const displayName = lastName ? `${firstName} ${lastName}` : firstName;

  // Update user profile
  const { error: updateError } = await client
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName || null,
      name: displayName,
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    name: displayName,
    firstName,
    lastName,
  });
}

// ---------------------------------------------------------------------------
// GET /api/me/profile — get current user's profile info
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });
  }

  const client = getServiceClient();
  const { data, error } = await client
    .from("users")
    .select("username, first_name, last_name, name, email, avatar_url, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    name: data.name,
    email: data.email,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  });
}
