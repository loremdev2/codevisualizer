import { NextResponse, type NextRequest } from "next/server";

/**
 * Validates that a state-changing request originated from the same origin.
 *
 * SameSite=Lax cookies block cross-site POST from forms, but not from
 * fetch/XMLHttpRequest. This check catches the latter by verifying the
 * Origin or Referer header matches the server's own host.
 *
 * Returns null when the request is same-origin (proceed), or a 403 response
 * when it looks cross-origin. Fails open when headers are absent (some
 * privacy extensions strip them) — the cookie is still the primary defense.
 */
export function requireSameOrigin(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? "";
  if (!host) return null; // no host header — let the route handle it

  // Origin is present on fetch/XHR, absent on top-level navigations.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "Cross-origin request rejected." },
          { status: 403 },
        );
      }
    } catch {
      // Malformed Origin header — reject rather than guess.
      return NextResponse.json(
        { error: "Invalid Origin header." },
        { status: 403 },
      );
    }
  }

  // Referer is a fallback when Origin is absent (some browsers/clients).
  const referer = request.headers.get("referer");
  if (!origin && referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        return NextResponse.json(
          { error: "Cross-origin request rejected." },
          { status: 403 },
        );
      }
    } catch {
      // Malformed Referer — let it through (fail open).
    }
  }

  return null; // same-origin or no headers — proceed
}
