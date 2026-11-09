// ---------------------------------------------------------------------------
// API configuration — single source of truth for all endpoint URLs.
//
// Every fetch call in the app imports from here instead of hardcoding paths.
// If an endpoint moves, only this file needs to change.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Endpoint constants
// ---------------------------------------------------------------------------

export const API = {
  // Auth
  auth: {
    session: "/api/auth/session",
    logout: "/api/auth/logout",
    google: "/api/auth/google",
  },

  // User data
  me: {
    learningProgress: "/api/me/learning-progress",
    solvedQuestions: "/api/me/solved-questions",
    savedAlgorithms: "/api/me/saved-algorithms",
    savedAlgorithm: (id: string) => `/api/me/saved-algorithms/${encodeURIComponent(id)}` as const,
    whiteboards: "/api/me/whiteboards",
    whiteboard: (id: string) => `/api/me/whiteboards/${encodeURIComponent(id)}` as const,
    whiteboardFolders: "/api/me/whiteboard-folders",
    whiteboardFolder: (id: string) =>
      `/api/me/whiteboard-folders/${encodeURIComponent(id)}` as const,
    profile: "/api/me/profile",
    username: "/api/me/username",
    // Availability check only — usernames are auto-assigned from the email at
    // sign-up; there is no claim/setup flow anymore.
    usernameSetup: "/api/me/username-setup",
  },

  // Services
  translate: "/api/translate",
  translateUsage: "/api/translate/usage",
  /** Step tutor: one question about the run in view (sign-in required). */
  tutor: "/api/tutor",
  traceReport: "/api/trace-report",
  feedback: "/api/feedback",
  feedbackImage: "/api/feedback/image",

  // Admin
  admin: {
    dashboard: "/api/admin/dashboard",
    feedback: (id: string) => `/api/admin/feedback/${encodeURIComponent(id)}` as const,
  },

  // Public (no auth) — shared whiteboards visible to anyone
  publicWhiteboard: (id: string) =>
    `/api/whiteboards/public/${encodeURIComponent(id)}` as const,
} as const;

// ---------------------------------------------------------------------------
// URL builders for endpoints with query parameters
// ---------------------------------------------------------------------------

export function solvedQuestionsUrl(bank: string): string {
  return `${API.me.solvedQuestions}?bank=${encodeURIComponent(bank)}`;
}

// ---------------------------------------------------------------------------
// Typed fetch helpers
// ---------------------------------------------------------------------------

/** Fetch that returns parsed JSON, swallowing errors gracefully. */
export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, init);
    const data = (await response.json().catch(() => ({}))) as T;
    if (!response.ok) {
      const err = (data as { error?: string }).error ?? `HTTP ${response.status}`;
      return { ok: false, error: err };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

/** Simple fetch that only checks response.ok (no JSON parsing). */
export async function fetchOk(
  url: string,
  init?: RequestInit,
): Promise<boolean> {
  try {
    const response = await fetch(url, init);
    return response.ok;
  } catch {
    return false;
  }
}
