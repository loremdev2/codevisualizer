import { NextResponse, type NextRequest } from "next/server";

import { ANONYMOUS_TRACE_LIMIT, type ActivityBank } from "@/lib/activity-ledger";
import {
  attachAnonCookie,
  countTraceRuns,
  insertLedgerEvent,
  readAnonActor,
} from "@/lib/activity-ledger-server";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

// ---------------------------------------------------------------------------
// POST /api/activity/events — appends one event to the activity ledger.
//
// Signed-in users  → actor_kind 'user', no quota in response.
// Guests           → actor_kind 'anon' (cookie minted on first event); a
//                    successful trace_run consumes a free trace, and the
//                    fresh quota comes back in the same response.
//
// Telemetry, not control flow: the client must never await this before
// showing a result. Failures return an error body but never block a run.
// ---------------------------------------------------------------------------

const EVENTS = new Set(["trace_run", "question_solved", "template_traced"]);
const BANKS = new Set(["top150", "neetcode", "sorting"]);

export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const ip = getClientIp(request);
  const limit = checkRateLimit(`activity-events:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many events. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eventName = typeof body.event === "string" ? body.event : "";
  if (!EVENTS.has(eventName)) {
    return NextResponse.json(
      { error: "event must be one of trace_run, question_solved, template_traced." },
      { status: 400 },
    );
  }

  const str = (value: unknown, max: number): string | null =>
    typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, max) : null;

  const bank = str(body.bank, 20);
  if (bank && !BANKS.has(bank)) {
    return NextResponse.json({ error: "Unknown bank." }, { status: 400 });
  }

  const questionNo =
    typeof body.questionNo === "number" && Number.isInteger(body.questionNo) && body.questionNo > 0
      ? body.questionNo
      : null;
  const bankValue = (bank ?? null) as ActivityBank | null;

  // Time tracking: duration in ms for question_solved events.
  const durationMs =
    typeof body.durationMs === "number" && body.durationMs >= 0
      ? Math.round(body.durationMs)
      : null;

  const userId = await getSessionUserId(request);

  // Signed-in path: attribute directly to the user.
  if (userId) {
    await insertLedgerEvent({
      actorKind: "user",
      actorId: userId,
      event: eventName,
      templateId: str(body.templateId, 100),
      bank: bankValue,
      questionNo,
      outcome: str(body.outcome, 32),
      durationMs,
    });
    // Fail open: ledger is telemetry, not control flow.
    return NextResponse.json({ ok: true });
  }

  // Guest path.
  const actor = readAnonActor(request, true);
  if (!actor) return NextResponse.json({ error: "Could not resolve actor." }, { status: 500 });

  await insertLedgerEvent({
    actorKind: "anon",
    actorId: actor.actorId,
    event: eventName,
    templateId: str(body.templateId, 100),
    bank: bankValue,
    questionNo,
    outcome: str(body.outcome, 32),
    durationMs,
  });

  const response = NextResponse.json({ ok: true });
  if (eventName === "trace_run") {
    const used = await countTraceRuns("anon", actor.actorId);
    if (used >= 0) {
      response.headers.set("Cache-Control", "no-store");
      return attachAnonCookie(
        NextResponse.json({
          ok: true,
          quota: {
            used,
            limit: ANONYMOUS_TRACE_LIMIT,
            remaining: Math.max(ANONYMOUS_TRACE_LIMIT - used, 0),
          },
        }),
        actor.actorId,
      );
    }
  }
  return actor.minted ? attachAnonCookie(response, actor.actorId) : response;
}
