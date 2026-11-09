import { getServiceClient } from "@/lib/db";

// ---------------------------------------------------------------------------
// AI usage caps (spend protection) for the two LLM paths — code translation
// (the translate route + its /usage quota endpoint) and the step tutor. Limits
// are env-configurable so a budget can be tuned without a deploy; 0 means
// unlimited (no rate limiting, no counter).
//
// Both paths draw on the same counters (ai_translation_usage via the
// bump_ai_usage RPC) and record 429s in the same denials table, so the admin
// dashboard's totals and cache hit-rate stay exact. The practical effect is one
// shared hourly/daily LLM budget per user, with the tighter of the two limits
// binding — see enforceAiUsageLimit.
// ---------------------------------------------------------------------------

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;

/**
 * Sentinel user id for guest translations. Guests can't use Java/C++ at all
 * (server-enforced 403), so the only guest path to the LLM is the
 * exotic-TypeScript fallback. Counting it under this sentinel keeps the admin
 * spend dashboard's LLM-call and cache hit-rate numbers exact. The table's
 * user_id is free text (no FK), and the admin aggregation functions filter
 * non-uuid ids out of the per-user table.
 */
export const GUEST_USER_ID = "__guest__";

const DEFAULT_HOURLY_LIMIT = 10;
const DEFAULT_DAILY_LIMIT = 60;
// A tutoring session is a burst of short questions, so the tutor's defaults are
// looser per hour than translation's (each answer is also far cheaper: one
// bounded fact sheet in, ~200 words out).
const DEFAULT_TUTOR_HOURLY_LIMIT = 20;
const DEFAULT_TUTOR_DAILY_LIMIT = 80;

function parseLimit(envValue: string | undefined, fallback: number): number {
  if (envValue === undefined || envValue.trim() === "") return fallback;
  const parsed = Number.parseInt(envValue, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function aiTranslationLimits(): { hourly: number; daily: number } {
  return {
    hourly: parseLimit(process.env.AI_TRANSLATION_HOURLY_LIMIT, DEFAULT_HOURLY_LIMIT),
    daily: parseLimit(process.env.AI_TRANSLATION_DAILY_LIMIT, DEFAULT_DAILY_LIMIT),
  };
}

export function aiTutorLimits(): { hourly: number; daily: number } {
  return {
    hourly: parseLimit(process.env.AI_TUTOR_HOURLY_LIMIT, DEFAULT_TUTOR_HOURLY_LIMIT),
    daily: parseLimit(process.env.AI_TUTOR_DAILY_LIMIT, DEFAULT_TUTOR_DAILY_LIMIT),
  };
}

/** UTC bucket start ISO strings for the given timestamp (same math as the translate route). */
export function usageBuckets(now: number): { hourStart: string; dayStart: string } {
  return {
    hourStart: new Date(now - (now % HOUR_MS)).toISOString(),
    dayStart: new Date(now - (now % DAY_MS)).toISOString(),
  };
}

/** The signed-in user's current translation usage in both windows. Fails open
 * (returns zeros) when the usage store is unreachable, so the counter badge
 * never breaks the page. */
export async function getAiUsage(userId: string): Promise<{ hourUsed: number; dayUsed: number }> {
  try {
    const { hourStart, dayStart } = usageBuckets(Date.now());
    const client = getServiceClient();
    const { data } = await client
      .from("ai_translation_usage")
      .select("bucket_type, count")
      .eq("user_id", userId)
      .in("bucket_start", [hourStart, dayStart]);
    const rows = (data ?? []) as Array<{ bucket_type: string; count: number }>;
    const hourUsed = rows.find((row) => row.bucket_type === "hour")?.count ?? 0;
    const dayUsed = rows.find((row) => row.bucket_type === "day")?.count ?? 0;
    return { hourUsed, dayUsed };
  } catch {
    return { hourUsed: 0, dayUsed: 0 };
  }
}

/** Shape returned by GET /api/translate/usage for the quota badge. */
export type AiTranslationQuota = {
  hourlyLimit: number;
  dailyLimit: number;
  hourUsed: number;
  dayUsed: number;
};

/** Outcome of a spend-cap check. Denied calls carry everything a 429 needs. */
export type AiLimitDecision =
  | { allowed: true; hourCount: number; dayCount: number }
  | {
      allowed: false;
      violatedBucket: "hour" | "day";
      retryAfterSeconds: number;
      hourCount: number;
      dayCount: number;
    };

/**
 * Atomically bumps the user's hour and day buckets and reports whether either
 * cap was exceeded. Fails open (allows the request) when the usage store is
 * unreachable: these caps are spend protection, not availability.
 *
 * The buckets are shared with translation, so the two features draw on one
 * budget and the tighter limit binds. Splitting them would need a `kind`
 * column in ai_translation_usage and a matching RPC signature.
 */
export async function enforceAiUsageLimit(
  userId: string,
  now: number,
  limits: { hourly: number; daily: number },
): Promise<AiLimitDecision> {
  // 0 = unlimited: skip counting entirely.
  if (limits.hourly === 0 || limits.daily === 0) {
    return { allowed: true, hourCount: 0, dayCount: 0 };
  }
  const { hourStart, dayStart } = usageBuckets(now);
  try {
    const client = getServiceClient();
    const [hour, day] = await Promise.all([
      client.rpc("bump_ai_usage", { p_user: userId, p_bucket: "hour", p_start: hourStart }),
      client.rpc("bump_ai_usage", { p_user: userId, p_bucket: "day", p_start: dayStart }),
    ]);
    const hourCount = Number(hour.data ?? 0);
    const dayCount = Number(day.data ?? 0);
    if (hourCount > limits.hourly || dayCount > limits.daily) {
      const nextHour = new Date(now - (now % HOUR_MS) + HOUR_MS);
      return {
        allowed: false,
        violatedBucket: hourCount > limits.hourly ? "hour" : "day",
        retryAfterSeconds: Math.max(60, Math.ceil((nextHour.getTime() - now) / 1000)),
        hourCount,
        dayCount,
      };
    }
    return { allowed: true, hourCount, dayCount };
  } catch (err) {
    console.error("[ai-usage] usage counter unavailable — allowing request", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { allowed: true, hourCount: 0, dayCount: 0 };
  }
}

/**
 * Records a rejected request for the admin spend dashboard (fire-and-forget —
 * losing this row must never turn a 429 into an error).
 */
export async function recordAiDenial(
  userId: string,
  bucket: "hour" | "day",
  count: number,
  retryAfterSeconds: number,
): Promise<void> {
  try {
    await getServiceClient().from("ai_translation_denials").insert({
      user_id: userId,
      bucket_type: bucket,
      count,
      retry_after_seconds: retryAfterSeconds,
    });
  } catch (err) {
    console.error("[ai-usage] denial record unavailable", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Counts a guest TS-fallback translation in the usage buckets (fail-open). */
export async function bumpGuestTranslationUsage(now: number): Promise<void> {
  try {
    const { hourStart, dayStart } = usageBuckets(now);
    const client = getServiceClient();
    await Promise.all([
      client.rpc("bump_ai_usage", { p_user: GUEST_USER_ID, p_bucket: "hour", p_start: hourStart }),
      client.rpc("bump_ai_usage", { p_user: GUEST_USER_ID, p_bucket: "day", p_start: dayStart }),
    ]);
  } catch (err) {
    // Non-critical telemetry — never block a translation on it.
    console.error("[ai-usage] guest usage counter unavailable", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
