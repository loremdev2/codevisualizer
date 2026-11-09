import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Direct Google OAuth (no Supabase Auth). Server-side authorization-code flow
 * with PKCE: the client secret never leaves the server, and the ID token is
 * cryptographically verified against Google's published keys before a session
 * is minted.
 */

export const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
export const GOOGLE_SCOPES = "openid email profile";

export type GoogleProfile = {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
};

export function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Google OAuth is not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    );
  }
  return { clientId, clientSecret };
}

/** redirect_uri is always this app's callback on the request's own origin. */
export function getCallbackUrl(origin: string): string {
  return `${origin}/api/auth/callback`;
}

export function buildAuthorizeUrl(params: {
  origin: string;
  state: string;
  codeChallenge: string;
}): string {
  const { clientId } = getGoogleConfig();
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", getCallbackUrl(params.origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

/** Exchange the authorization code for tokens, then verify the ID token. */
export async function exchangeCodeForTokens(params: {
  origin: string;
  code: string;
  codeVerifier: string;
}): Promise<{ profile: GoogleProfile; idToken: string }> {
  const { clientId, clientSecret } = getGoogleConfig();
  const body = new URLSearchParams({
    code: params.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getCallbackUrl(params.origin),
    grant_type: "authorization_code",
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed (${response.status}): ${text.slice(0, 300)}`);
  }
  const tokens = (await response.json()) as { id_token?: string; access_token?: string };
  if (!tokens.id_token) {
    throw new Error("Google returned no ID token.");
  }

  const profile = await verifyIdToken(tokens.id_token, clientId);
  return { profile, idToken: tokens.id_token };
}

/** Verify a Google-issued ID token (signature, issuer, audience, expiry). */
const googleKeys = createRemoteJWKSet(new URL(GOOGLE_CERTS_URL));

export async function verifyIdToken(idToken: string, clientId: string): Promise<GoogleProfile> {
  const { payload } = await jwtVerify(idToken, googleKeys, {
    issuer: ["accounts.google.com", "https://accounts.google.com"],
    audience: clientId,
  });

  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Google ID token is missing sub/email claims.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
    emailVerified: payload.email_verified === true,
  };
}
