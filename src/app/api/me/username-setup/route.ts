import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/me/username-setup?username=foo — check if a username is available.
//
// New users get a username derived from their email automatically at sign-up
// (see src/lib/auth/user.ts), so there is no claim/setup flow anymore. This
// endpoint only serves the availability check used when editing the username
// later from the profile page.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username")?.trim().toLowerCase() ?? "";

  if (username.length < 3 || username.length > 30 || !/^[a-z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false });
  }

  const client = getServiceClient();
  const { data } = await client
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
