import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { buildAuthorizeUrl, getGoogleConfig } from "@/lib/auth/google";

const OAUTH_STATE_COOKIE = "dsa_oauth";
const STATE_MAX_AGE = 10 * 60; // 10 minutes

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  // Friendly error while GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are missing,
  // instead of a raw 500.
  try {
    getGoogleConfig();
  } catch {
    return NextResponse.json(
      { error: "Google sign-in is not configured yet — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 },
    );
  }
  const next = request.nextUrl.searchParams.get("next") ?? "/visualizer";
  // Only same-origin paths are allowed as the post-login destination.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/visualizer";

  // PKCE: a random verifier is stored server-side (in an httpOnly cookie) and
  // its SHA-256 challenge goes to Google; the callback needs the verifier to
  // exchange the code, so a stolen code alone is useless.
  const codeVerifier = randomBytes(32).toString("base64url");
  const state = randomUUID();
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  const response = NextResponse.redirect(
    buildAuthorizeUrl({ origin, state, codeChallenge }),
  );
  response.cookies.set(
    OAUTH_STATE_COOKIE,
    JSON.stringify({ state, codeVerifier, next: safeNext }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: STATE_MAX_AGE,
    },
  );
  return response;
}
