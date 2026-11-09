import type { NextRequest, NextResponse } from "next/server";

import { ANON_ACTOR_COOKIE, ANON_ACTOR_MAX_AGE_SECONDS } from "@/lib/activity-ledger";
import { getServiceClient } from "@/lib/db";

// ---------------------------------------------------------------------------
// Server-only helpers for the activity ledger routes: reading and minting the
// anonymous actor cookie, event writes/counts, and anon→user adoption on
// sign-in. Never import from client components (pulls in the service client).
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AnonActor = { actorId: string; minted: boolean };

/**
 * Reads the anon actor cookie, validating it as a uuid. When `mint` is set,
 * a missing/invalid cookie yields a fresh uuid that the caller MUST attach to
 * its response via `attachAnonCookie`.
 */
export function readAnonActor(request: NextRequest, mint = false): AnonActor | null {
  const raw = request.cookies.get(ANON_ACTOR_COOKIE)?.value;
  if (raw && UUID_RE.test(raw)) return { actorId: raw, minted: false };
  if (!mint) return null;
  return { actorId: crypto.randomUUID(), minted: true };
}

/** Attaches (or refreshes) the anon actor cookie on an outgoing response. */
export function attachAnonCookie(
  response: NextResponse,
  actorId: string,
): NextResponse {
  response.cookies.set(ANON_ACTOR_COOKIE, actorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ANON_ACTOR_MAX_AGE_SECONDS,
  });
  return response;
}

/** Deletes the anon cookie (after adoption on sign-in). */
export function clearAnonCookie(response: NextResponse): NextResponse {
  response.cookies.delete(ANON_ACTOR_COOKIE);
  return response;
}

/**
 * Server-truth count of an actor's `trace_run` events. Returns -1 when the
 * ledger is unavailable so callers can fail open (telemetry must not gate
 * harder than the old localStorage gate — a Supabase hiccup shouldn't lock
 * everyone out of the product).
 */
export async function countTraceRuns(actorKind: string, actorId: string): Promise<number> {
  try {
    const { count, error } = await getServiceClient()
      .from("activity_events")
      .select("id", { count: "exact", head: true })
      .eq("actor_kind", actorKind)
      .eq("actor_id", actorId)
      .eq("event", "trace_run");
    if (error) return -1;
    return count ?? 0;
  } catch {
    return -1;
  }
}

export type LedgerEventInput = {
  actorKind: "user" | "anon";
  actorId: string;
  event: string;
  templateId?: string | null;
  bank?: string | null;
  questionNo?: number | null;
  outcome?: string | null;
  durationMs?: number | null;
};

/** Appends one ledger row. Returns false on failure (callers fail open). */
export async function insertLedgerEvent(input: LedgerEventInput): Promise<boolean> {
  const { error } = await getServiceClient().from("activity_events").insert({
    actor_kind: input.actorKind,
    actor_id: input.actorId,
    event: input.event,
    template_id: input.templateId ?? null,
    bank: input.bank ?? null,
    question_no: input.questionNo ?? null,
    outcome: input.outcome ?? null,
    duration_ms: input.durationMs ?? null,
  });
  return !error;
}

/**
 * Re-points a guest's anon events to their user identity on sign-in, so the
 * traces they ran as a guest count toward their profile (and the guest quota
 * effectively transfers into their account history). One keyed UPDATE.
 */
export async function adoptAnonEvents(anonId: string, userId: string): Promise<void> {
  await getServiceClient()
    .from("activity_events")
    .update({ actor_kind: "user", actor_id: userId })
    .eq("actor_kind", "anon")
    .eq("actor_id", anonId);
}
