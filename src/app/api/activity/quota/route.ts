import { NextResponse, type NextRequest } from "next/server";

import { ANONYMOUS_TRACE_LIMIT } from "@/lib/activity-ledger";
import { attachAnonCookie, countTraceRuns, readAnonActor } from "@/lib/activity-ledger-server";
import { getSessionUserId } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

// ---------------------------------------------------------------------------
// GET /api/activity/quota → { quota: { used, limit, remaining } | null }
//
// Server truth for the guest free-trace gate. Signed-in users get
// `{ quota: null }` (no gate). When the anon cookie is missing or invalid a
// fresh identity is minted (used = 0). If the ledger is unreachable the
// response fails OPEN ({ quota: null }) — telemetry downtime must not lock
// guests out of the product.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Cheap abuse cap on the endpoint itself; the real gate is event-counted.
  const ip = getClientIp(request);
  const limit = checkRateLimit(`activity-quota:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  // Signed-in users have no guest quota.
  const userId = await getSessionUserId(request);
  if (userId) {
    return NextResponse.json({ quota: null });
  }

  const actor = readAnonActor(request, true);
  if (!actor) return NextResponse.json({ quota: null });

  const used = await countTraceRuns("anon", actor.actorId);
  if (used < 0) {
    // Ledger unavailable — fail open.
    return NextResponse.json({ quota: null });
  }

  const response = NextResponse.json({
    quota: { used, limit: ANONYMOUS_TRACE_LIMIT, remaining: Math.max(ANONYMOUS_TRACE_LIMIT - used, 0) },
  });
  return actor.minted ? attachAnonCookie(response, actor.actorId) : response;
}
