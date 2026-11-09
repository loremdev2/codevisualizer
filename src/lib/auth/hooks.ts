"use client";

import { useCallback, useEffect, useState } from "react";

import type { SessionUser } from "@/app/api/auth/session/route";
import { API } from "@/lib/api-config";

/**
 * Client-side auth for the first-party Google OAuth session. Replaces all
 * supabase.auth usage in components: the session lives in an httpOnly cookie,
 * so the client only ever talks to /api/auth/session (read) and
 * /api/auth/logout (clear). A window event keeps every mounted consumer in
 * sync after sign-in/sign-out.
 */

export const AUTH_CHANGED_EVENT = "dsa:auth-changed";

export type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  /** Re-fetches /api/auth/session and returns the fresh user. */
  refresh: () => Promise<SessionUser | null>;
};

// Module-level cache: the first useUser() call fetches /api/auth/session;
// every subsequent mount shares the same promise so only one request flies.
//
// A generation counter prevents stale in-flight promises from overwriting
// cachedSession after a refresh() busts the cache.
let sessionPromise: Promise<SessionUser | null> | null = null;
let cachedSession: SessionUser | null = null;
let sessionLoaded = false;
let sessionGeneration = 0;

function fetchSession(): Promise<SessionUser | null> {
  if (!sessionPromise) {
    const gen = sessionGeneration;
    sessionPromise = fetch(API.auth.session, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as { user: SessionUser | null };
        return data.user ?? null;
      })
      .catch(() => null)
      .then((user) => {
        // If refresh() was called while this request was in flight, the
        // generation will have advanced — discard this stale result.
        if (gen === sessionGeneration) {
          cachedSession = user;
          sessionLoaded = true;
        }
        return user;
      });
  }
  return sessionPromise;
}

export function useUser(): AuthState {
  const [user, setUser] = useState<SessionUser | null>(
    () => (sessionLoaded ? cachedSession : null),
  );
  const [loading, setLoading] = useState(!sessionLoaded);

  const refresh = useCallback(async () => {
    // Bust the cache so the next fetch is fresh. Advance the generation
    // so any in-flight promise from the old cache discards its result.
    sessionPromise = null;
    sessionLoaded = false;
    sessionGeneration++;
    try {
      const result = await fetchSession();
      setUser(result);
      return result;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Use the shared fetch so multiple useUser() mounts only fire one request.
    void fetchSession().then((result) => {
      if (!cancelled) {
        setUser(result);
        setLoading(false);
      }
    });

    const onChanged = () => {
      setLoading(true);
      void refresh();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, onChanged);
    };
  }, [refresh]);

  return { user, loading, refresh };
}

/** Redirect the browser to Google's consent screen (full-page navigation). */
export function signInWithGoogle(next?: string) {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  const query = params.toString();
  window.location.assign(`${API.auth.google}${query ? `?${query}` : ""}`);
}

/** Clear the session cookie and notify all consumers. */
export async function signOut() {
  try {
    await fetch(API.auth.logout, { method: "POST" });
  } finally {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}
