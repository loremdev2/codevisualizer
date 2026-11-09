import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

/**
 * First-party session: a short HS256 JWT stored in an httpOnly, SameSite=Lax
 * cookie. Stateless — no server-side session store needed. The payload carries
 * the user id and email; admin status is re-read from the database on every
 * request that needs it (the cookie is never trusted for authorization alone).
 */

export const SESSION_COOKIE = "dsa_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
};

function getSessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is not configured (min 32 characters) — generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      picture: typeof payload.picture === "string" ? payload.picture : null,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/** Returns the verified user id from the request's session cookie, or null when unauthenticated. */
export async function getSessionUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  return payload?.sub ?? null;
}
