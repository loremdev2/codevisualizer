import { NextResponse, type NextRequest } from "next/server";

import { exchangeCodeForTokens } from "@/lib/auth/google";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth/session";
import { upsertUserFromGoogle } from "@/lib/auth/user";
import { adoptAnonEvents } from "@/lib/activity-ledger-server";
import { ANON_ACTOR_COOKIE } from "@/lib/activity-ledger";

const OAUTH_STATE_COOKIE = "dsa_oauth";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const stateCookie = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/login?auth_error=${encodeURIComponent(reason)}`);

  if (!code || !state || !stateCookie) {
    return fail("missing_code");
  }

  let stored: { state: string; codeVerifier: string; next: string };
  try {
    stored = JSON.parse(stateCookie) as { state: string; codeVerifier: string; next: string };
  } catch {
    return fail("bad_state");
  }
  if (stored.state !== state || typeof stored.codeVerifier !== "string") {
    return fail("state_mismatch");
  }

  try {
    const { profile } = await exchangeCodeForTokens({
      origin,
      code,
      codeVerifier: stored.codeVerifier,
    });
    const user = await upsertUserFromGoogle(profile);
    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      picture: user.avatar_url,
    });

    const response = NextResponse.redirect(`${origin}${stored.next || "/visualizer"}`);
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    response.cookies.delete(OAUTH_STATE_COOKIE);

    // Adopt the guest's ledger events (trace runs, etc.) into their new
    // account so their pre-sign-in activity counts. Best-effort: the session
    // is already valid at this point, so a ledger hiccup must not fail the
    // OAuth flow. The anon cookie is dropped either way — a later sign-out
    // yields a fresh guest identity instead of resurrecting the old quota.
    const anonId = request.cookies.get(ANON_ACTOR_COOKIE)?.value;
    if (anonId) {
      try {
        await adoptAnonEvents(anonId, user.id);
      } catch (error) {
        console.error("Anon event adoption failed:", error);
      }
      response.cookies.delete(ANON_ACTOR_COOKIE);
    }
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return fail("auth_failed");
  }
}
