import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { requireSameOrigin } from "@/lib/security/csrf";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const OUTCOMES = new Set([
  "success",
  "zero_steps",
  "step_limit",
  "timeout",
  "error",
  "instrument_error",
]);

/**
 * Stores a one-click "This trace was wrong" report. The client sends only the
 * code's SHA-256 hash (never the raw source — the feedback form is the place
 * for full code), plus the run context needed to reproduce the failure.
 */
export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  // 30 trace reports per minute per IP.
  const ip = getClientIp(request);
  const limit = checkRateLimit(`trace-report:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many reports. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const codeHash = typeof body.code_hash === "string" ? body.code_hash.trim() : "";
  if (codeHash.length < 8 || codeHash.length > 128) {
    return NextResponse.json(
      { error: "A code hash (8–128 characters) is required." },
      { status: 400 },
    );
  }

  const str = (value: unknown): string | null =>
    typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, 500) : null;

  const { error } = await getServiceClient().from("trace_reports").insert({
    code_hash: codeHash,
    input_hash: str(body.input_hash),
    language: str(body.language),
    template: str(body.template),
    outcome: typeof body.outcome === "string" && OUTCOMES.has(body.outcome) ? body.outcome : null,
    error: str(body.error),
    note: str(body.note),
  });

  if (error) {
    return NextResponse.json(
      {
        error: error.message.includes("trace_reports")
          ? "trace_reports_not_configured"
          : error.message,
      },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
