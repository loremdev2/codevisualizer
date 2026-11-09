import { NextResponse, type NextRequest } from "next/server";

/**
 * Global proxy: adds security headers to every response.
 *
 * Sessions are first-party stateless httpOnly cookies (signed with
 * SESSION_SECRET), so there is no session refresh to run on every request.
 * The matcher excludes static assets so this is a near-free no-op for
 * cached files.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // --- X-Frame-Options: DENY everywhere except /embed ---
  // /embed is designed to be iframeable by third-party sites, so we
  // skip X-Frame-Options entirely and let frame-ancestors in the CSP
  // control it (see below).
  if (!pathname.startsWith("/embed")) {
    response.headers.set("X-Frame-Options", "DENY");
  }

  // --- Content-Type sniffing ---
  response.headers.set("X-Content-Type-Options", "nosniff");

  // --- Referrer: send origin only on cross-origin, full URL on same-origin ---
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // --- Permissions: disable features the app never uses ---
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  // --- Strict-Transport-Security: enforce HTTPS in production ---
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // --- Content-Security-Policy (report-only until validated in production) ---
  // The app needs:
  //   - blob: for Web Worker creation (trace runner)
  //   - https://cdn.jsdelivr.net for Pyodide WASM + Python stdlib
  //   - https://www.googleapis.com + lh3.googleusercontent.com for Google OAuth avatars
  //   - inline scripts for Next.js hydration and theme init
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://www.googleapis.com https://lh3.googleusercontent.com https://*.supabase.co data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://integrate.api.nvidia.com https://cdn.jsdelivr.net https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    `frame-ancestors ${pathname.startsWith("/embed") ? "*" : "'self'"}`,
  ].join("; ");
  response.headers.set("Content-Security-Policy-Report-Only", csp);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
