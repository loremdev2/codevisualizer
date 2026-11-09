/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Each key (typically the client IP) gets a fixed window. Once the window
 * fills, requests are rejected until the window slides past. Windows are
 * cleaned up lazily when they expire, so memory stays bounded.
 *
 * This is NOT a distributed rate limiter — it works per-serverless-instance.
 * For Vercel's edge network that means each instance has its own bucket,
 * which is fine for abuse prevention (an attacker hitting multiple edges
 * still gets rate-limited per edge) but won't give a global cap. A Redis-
 * backed limiter is the upgrade path if a global cap is needed.
 */

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

/** Evict expired buckets when the map grows past this size. */
const CLEANUP_THRESHOLD = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Seconds until the current window expires. */
  retryAfterSeconds: number;
};

/**
 * Check and increment the rate limit for `key`.
 *
 * @param key       Unique identifier (e.g. IP address or user id)
 * @param limit     Max requests per window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;

  const existing = buckets.get(key);
  if (existing && existing.windowStart === windowStart) {
    if (existing.count >= limit) {
      const retryAfterSeconds = Math.ceil((windowStart + windowMs - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    existing.count += 1;
    return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
  }

  // New window — reset the bucket.
  buckets.set(key, { count: 1, windowStart });

  // Lazy cleanup: when the map gets large, remove expired entries.
  if (buckets.size > CLEANUP_THRESHOLD) {
    for (const [k, b] of buckets) {
      if (b.windowStart < windowStart) buckets.delete(k);
    }
  }

  return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
}

/**
 * Extract a rate-limit key from the request. Uses X-Forwarded-For (when
 * behind a reverse proxy like Vercel) or falls back to the direct IP.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // X-Forwarded-For can be "client, proxy1, proxy2" — take the first.
    return forwarded.split(",")[0].trim();
  }
  // NextRequest doesn't expose .ip directly; fall back to a header or sentinel.
  return request.headers.get("x-real-ip") ?? "unknown";
}
