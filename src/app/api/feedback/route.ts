import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const CATEGORIES = new Set(["bug", "idea", "confusing", "praise", "other"]);
const VERDICTS = new Set(["pass", "fail"]);

export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  // 20 feedback submissions per minute per IP.
  const ip = getClientIp(request);
  const limit = checkRateLimit(`feedback:${ip}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many feedback submissions. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const category = typeof body.category === "string" ? body.category : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  // The DB enforces char_length(message) between 1 and 4000 — mirror it here so
  // an oversized payload gets a clear 400 instead of a misleading server error.
  if (!CATEGORIES.has(category) || message.length < 1 || message.length > 4000) {
    return NextResponse.json(
      { error: "A valid category and a message of 1–4000 characters are required." },
      { status: 400 },
    );
  }

  // Guests can submit without an account; signed-in users get their id attached
  // so the maintainer can link the report to an account.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let userId: string | null = null;
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) userId = payload.sub;
  }

  const str = (value: unknown): string | null =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
  const int = (value: unknown): number | null =>
    typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;

  const { error } = await getServiceClient().from("feedback").insert({
    user_id: userId,
    category,
    message,
    email: str(body.email),
    page_url: str(body.page_url),
    algorithm: str(body.algorithm),
    language: str(body.language),
    image_url: str(body.image_url),
    code: str(body.code),
    input_text: str(body.input_text),
    step_index: int(body.step_index),
    step_count: int(body.step_count),
    result_text: str(body.result_text),
    expected_text: str(body.expected_text),
    verdict: typeof body.verdict === "string" && VERDICTS.has(body.verdict) ? body.verdict : null,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message.includes("feedback") ? "feedback_not_configured" : error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
