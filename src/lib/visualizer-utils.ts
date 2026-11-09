// ---------------------------------------------------------------------------
// Pure helper functions extracted from dsa-visualizer.tsx.
// No React imports, no side effects — fully testable in isolation.
// ---------------------------------------------------------------------------

import type { AlgorithmTemplate } from "@/types/visualizer";
import type { SupportedLanguage } from "@/lib/detect-language";
import { algorithmTemplates } from "@/lib/templates";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Format a duration in milliseconds to a human-readable string. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format a trace result for display in the Result box.
 * Handles undefined, strings, and objects.
 */
export function formatResult(result: unknown): string {
  if (result === undefined) return "(no return value)";
  if (typeof result === "string") return result;
  try {
    const text = JSON.stringify(result);
    return text === undefined ? String(result) : text;
  } catch {
    return String(result);
  }
}

// ---------------------------------------------------------------------------
// Comparison target resolution (A/B mode)
// ---------------------------------------------------------------------------

/**
 * Comparison target for A/B mode: first a JavaScript template with the exact
 * same input shape (e.g. two sorters), otherwise the same template on a
 * reversed copy of the current input (arrays only), which still teaches how
 * input order changes step counts.
 */
export function getComparisonTarget(
  template: AlgorithmTemplate,
  input: Record<string, unknown>,
): { code: string; input: Record<string, unknown>; label: string } | null {
  const inputKeys = Object.keys(input).sort().join(",");
  const peer = algorithmTemplates.find(
    (candidate) =>
      candidate.id !== template.id &&
      (!candidate.language || candidate.language === "javascript") &&
      Object.keys(candidate.input).sort().join(",") === inputKeys,
  );
  if (peer) return { code: peer.code, input, label: peer.name };

  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value) && value.length > 0) {
      return {
        code: template.code,
        input: { ...input, [key]: [...value].reverse() },
        label: `${template.name} · reversed input`,
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Anonymous trace gate (freemium funnel)
// ---------------------------------------------------------------------------

/** Maximum number of free traces for anonymous (guest) users. */
export const ANONYMOUS_TRACE_LIMIT = 3;

/** localStorage key for anonymous trace count. */
const ANON_TRACE_KEY = "dsa-lab-anon-traces";

/** Read the current anonymous trace count from localStorage. */
export function getAnonymousTraceCount(): number {
  try {
    const raw = window.localStorage.getItem(ANON_TRACE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

/** Increment the anonymous trace count and return the new value. */
export function incrementAnonymousTraceCount(): number {
  const next = getAnonymousTraceCount() + 1;
  try {
    window.localStorage.setItem(ANON_TRACE_KEY, String(next));
  } catch {
    // Storage unavailable (e.g. private mode) — the in-memory badge still updates.
  }
  return next;
}

// ---------------------------------------------------------------------------
// Session restore (survives OAuth redirect)
// ---------------------------------------------------------------------------

const SESSION_RESTORE_KEY = "dsa-lab-session-restore";

export type SessionRestore = {
  code?: string;
  inputText?: string;
  language?: SupportedLanguage;
};

/**
 * Read and consume the session restore payload (stashed before OAuth redirect).
 * The payload is removed from sessionStorage after reading (one-shot).
 */
export function readSessionRestore(): SessionRestore | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_RESTORE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(SESSION_RESTORE_KEY);
    const parsed = JSON.parse(raw) as SessionRestore;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Write the session restore payload before an OAuth redirect. */
export function writeSessionRestore(data: SessionRestore): void {
  try {
    window.sessionStorage.setItem(SESSION_RESTORE_KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable — proceed without restoring.
  }
}

// ---------------------------------------------------------------------------
// Dark theme detection
// ---------------------------------------------------------------------------

/**
 * Subscribe to the `class` attribute on <html> for dark mode changes.
 * Used with `useSyncExternalStore` in the component.
 */
export function subscribeToDarkTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** Snapshot: is dark mode currently active? */
export function getDarkThemeSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

/** Server snapshot: always returns false (light) for SSR hydration. */
export function getDarkThemeServerSnapshot(): boolean {
  return false;
}
