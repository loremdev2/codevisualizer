// ---------------------------------------------------------------------------
// Which NVIDIA NIM model answers, and how long we wait for it.
//
// Both are env-configurable because they are the two things that break in the
// field, and neither is visible from a 500:
//
//   - A model id can stop being entitled for an account. NIM then answers
//     404 "Function '<uuid>': Not found for account '<id>'" — which reads like
//     a bug in our route, not a permissions problem.
//   - A model can go end-of-life (410 Gone), as several Llama ids already have.
//   - A model can simply never respond (we measured 279s for a 60-token prompt
//     on kimi-k3). That surfaces as our own abort, which hides the real cause.
//
// Hard-coding the id meant the only repair was a redeploy, and a slow model was
// indistinguishable from a broken route. Run `npm run ai:check` to see which
// models the configured key can actually reach.
// ---------------------------------------------------------------------------

/** OpenAI-compatible chat-completions endpoint. */
export const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
/** Same model the translate route uses — the tutor only needs a short answer. */
export const DEFAULT_TUTOR_MODEL = "moonshotai/kimi-k3";
/**
 * Longer than translate's 60s: a chat answer is small, but a queued model can
 * still take a while to start, and aborting at 60s produced a mystery timeout
 * in practice.
 */
export const DEFAULT_TUTOR_TIMEOUT_MS = 90_000;
export const MIN_TIMEOUT_MS = 5_000;
export const MAX_TIMEOUT_MS = 300_000;

/** Just the env surface these resolvers need — keeps them trivially testable. */
export type AiEnv = Record<string, string | undefined>;

/** Parses a timeout in ms, clamped to a sane range; falls back when unparseable. */
export function parseTimeoutMs(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

export function resolveTutorModel(env: AiEnv = process.env): string {
  const configured = env.AI_TUTOR_MODEL?.trim();
  return configured ? configured : DEFAULT_TUTOR_MODEL;
}

export function resolveTutorTimeoutMs(env: AiEnv = process.env): number {
  return parseTimeoutMs(env.AI_TUTOR_TIMEOUT_MS, DEFAULT_TUTOR_TIMEOUT_MS);
}

/** Candidate models `npm run ai:check` probes, in order. */
export const PROVIDER_CANDIDATES = [
  DEFAULT_TUTOR_MODEL,
  "moonshotai/kimi-k2.6",
  "mistralai/mistral-7b-instruct-v0.3",
  "nv-mistralai/mistral-nemo-12b-instruct",
  "google/gemma-3-12b-it",
  "nvidia/llama-3.1-nemotron-70b-instruct",
] as const;
