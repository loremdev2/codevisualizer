/**
 * Trace telemetry — client-side analytics for the trace engine.
 *
 * Every run reports one `trace_outcome` event so Vercel Analytics can show the
 * north-star reliability numbers from IMPROVEMENT_PLAN.md: trace success rate,
 * timeout rate, step-limit rate, zero-step runs, and language mix. The "This
 * trace was wrong" button sends a `trace_report` event and stores the code
 * hash server-side (see /api/trace-report). Everything here is defensive:
 * analytics must never break or slow down a trace.
 */

import { track } from "@vercel/analytics";

export type TraceOutcome =
  | "success"
  | "zero_steps"
  | "step_limit"
  | "timeout"
  | "error"
  | "instrument_error";

export type TraceTelemetry = {
  outcome: TraceOutcome;
  /** The language the run was attempted in (as selected). */
  language: string;
  /** The loaded template id ("custom" is never sent — the template id is always present). */
  template: string;
  /** True when the editor content differs from the template's code. */
  customCode: boolean;
  /** True when the run went through AI translation. */
  translated: boolean;
  /** True for the auto-run boot/deep-link preview (count: false). */
  preview: boolean;
  /** Normalized steps produced (0 for failures). */
  steps: number;
  durationMs: number | null;
  error: string | null;
};

/** Records one trace outcome to Vercel Analytics. Never throws. */
export function trackTraceOutcome(telemetry: TraceTelemetry): void {
  try {
    track("trace_outcome", {
      outcome: telemetry.outcome,
      language: telemetry.language,
      template: telemetry.template,
      customCode: telemetry.customCode,
      translated: telemetry.translated,
      preview: telemetry.preview,
      steps: telemetry.steps,
      durationMs: telemetry.durationMs,
      error: telemetry.error ? truncate(telemetry.error, 200) : null,
    });
  } catch {
    // Analytics must never break a trace.
  }
}

/** Counts "This trace was wrong" reports (details are stored server-side). */
export function trackTraceReported(): void {
  try {
    track("trace_report", {});
  } catch {
    // no-op
  }
}

/**
 * SHA-256 hex digest of arbitrary text, used to flag traces by code identity
 * without sending the full source to the report endpoint. Falls back to a
 * non-crypto FNV-1a hash if crypto.subtle is unavailable, so reports still
 * dedupe by identical code.
 */
export async function sha256Hex(text: string): Promise<string> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return fnv1aHex(text);
  }
}

function fnv1aHex(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(16).padStart(8, "0")}-fnv`;
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
