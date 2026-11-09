"use client";

import * as React from "react";

// ---------------------------------------------------------------------------
// User preferences — daily practice goal with localStorage cache + server sync.
//
// The goal is read from localStorage on first render (instant), then hydrated
// from the server on sign-in. Updates are optimistic: localStorage + cache
// update immediately, server persists in the background.
// ---------------------------------------------------------------------------

const LS_KEY = "dsa.dailyGoal";
const DEFAULT_GOAL = 5;

// In-memory cache + subscriber pattern.
let cachedGoal: number = DEFAULT_GOAL;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  for (const cb of subscribers) cb();
}

function subscribe(onStoreChange: () => void) {
  subscribers.add(onStoreChange);
  return () => {
    subscribers.delete(onStoreChange);
  };
}

function getSnapshot(): number {
  return cachedGoal;
}

function getServerSnapshot(): number {
  // SSR: return default — localStorage isn't available.
  return DEFAULT_GOAL;
}

// Hydrate from localStorage on module load (client only).
if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "number" && parsed >= 1 && parsed <= 100) {
        cachedGoal = parsed;
      }
    }
  } catch {
    // Ignore corrupt localStorage.
  }
}

/**
 * React hook — the user's daily practice goal (default 5).
 * Hydrated from localStorage instantly, then from the server on sign-in.
 */
export function useDailyGoal(): number {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Synchronous read for use inside callbacks.
 */
export function getDailyGoal(): number {
  return cachedGoal;
}

/**
 * Optimistically update the daily goal (localStorage + cache + server).
 */
export async function setDailyGoal(goal: number): Promise<void> {
  const clamped = Math.max(1, Math.min(100, Math.round(goal)));
  cachedGoal = clamped;
  notifySubscribers();

  // Persist to localStorage.
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(clamped));
  } catch {
    // localStorage full or unavailable.
  }

  // Persist to server (fire-and-forget).
  try {
    await fetch("/api/me/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyGoal: clamped }),
    });
  } catch {
    // Network error — localStorage is the source of truth for guests.
  }
}

/**
 * Fetch the daily goal from the server and merge with local state.
 * Called on sign-in to hydrate from the server.
 */
export async function loadPreferencesFromServer(): Promise<void> {
  try {
    const res = await fetch("/api/me/preferences", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { dailyGoal?: number };
    if (typeof data.dailyGoal === "number" && data.dailyGoal >= 1 && data.dailyGoal <= 100) {
      cachedGoal = data.dailyGoal;
      notifySubscribers();
      // Sync to localStorage for offline use.
      try {
        window.localStorage.setItem(LS_KEY, JSON.stringify(data.dailyGoal));
      } catch {
        // Ignore.
      }
    }
  } catch {
    // Network error — keep existing cache.
  }
}
