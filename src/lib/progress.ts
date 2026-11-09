"use client";

import * as React from "react";
import type { LearningProgress, TemplateProgress } from "@/lib/paths";
import { API, fetchJson } from "@/lib/api-config";

// ---------------------------------------------------------------------------
// Learning progress — Supabase-backed, no localStorage.
//
// Progress is stored server-side in the `learning_progress` table. The client
// keeps an in-memory cache that is hydrated from the API on sign-in and
// updated optimistically when a template is traced.
//
// Exports:
//   useLearningProgress()       — React hook (useSyncExternalStore)
//   useSyncing()                — React hook: true while initial fetch is in flight
//   getLearningProgress()       — Synchronous read (in-memory cache)
//   recordTemplateTraced(id)    — PUT to server + update cache
//   loadProgressFromServer()    — Fetch all progress from server (optimistic merge)
//   resetLearningProgress()     — DELETE on server + clear cache
//   startPeriodicSync()         — Re-fetch every 60 s while signed in
//   stopPeriodicSync()          — Stop background re-sync
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// In-memory cache + subscriber pattern (for useSyncExternalStore)
// ---------------------------------------------------------------------------

const EMPTY_PROGRESS: LearningProgress = {};

let cachedProgress: LearningProgress = EMPTY_PROGRESS;
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

function getSnapshot(): LearningProgress {
  return cachedProgress;
}

function getServerSnapshot(): LearningProgress {
  return EMPTY_PROGRESS;
}

// ---------------------------------------------------------------------------
// Syncing state (true while the first server fetch is in flight)
// ---------------------------------------------------------------------------

let isSyncing = false;
const syncSubscribers = new Set<() => void>();

function notifySyncSubscribers() {
  for (const cb of syncSubscribers) cb();
}

function subscribeSyncing(onStoreChange: () => void) {
  syncSubscribers.add(onStoreChange);
  return () => {
    syncSubscribers.delete(onStoreChange);
  };
}

function getSyncSnapshot(): boolean {
  return isSyncing;
}

// ---------------------------------------------------------------------------
// One-time localStorage → Supabase migration
// ---------------------------------------------------------------------------

const LEGACY_LS_KEY = "dsa.learningProgress";
let migrationDone = false;

/**
 * One-time migration: read old localStorage progress, PUT each traced
 * template to the server, then clear localStorage. Safe to call multiple
 * times — runs at most once.
 */
async function migrateLocalStorageProgress(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  try {
    const raw = globalThis.localStorage.getItem(LEGACY_LS_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Record<
      string,
      { traced?: boolean; tracedAt?: number }
    >;
    if (!parsed || typeof parsed !== "object") return;

    const tracedEntries = Object.entries(parsed).filter(
      ([, v]) => v && v.traced,
    );
    if (tracedEntries.length === 0) {
      globalThis.localStorage.removeItem(LEGACY_LS_KEY);
      return;
    }

    // PUT each traced template to the server (fire-and-forget, parallel).
    await Promise.allSettled(
      tracedEntries.map(([templateId]) =>
        fetch(API.me.learningProgress, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: templateId }),
        }),
      ),
    );

    // Clear the legacy key.
    globalThis.localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    // If migration fails (e.g. not signed in yet), leave localStorage
    // alone — it will be retried on next sign-in.
    migrationDone = false;
  }
}

// ---------------------------------------------------------------------------
// Server sync
// ---------------------------------------------------------------------------

let syncInFlight = false;

/**
 * Fetch the full learning progress from the server and optimistically merge
 * with the local cache. Any entries the user traced locally (but that haven't
 * reached the server yet) are preserved in the merged result.
 */
export async function loadProgressFromServer(): Promise<void> {
  if (syncInFlight) return;
  syncInFlight = true;
  isSyncing = true;
  notifySyncSubscribers();

  try {
    // Run one-time localStorage migration before fetching.
    await migrateLocalStorageProgress();

    const result = await fetchJson<{ progress?: LearningProgress }>(API.me.learningProgress, {
      cache: "no-store",
    });
    if (!result.ok) return;
    const data = result.data;
    if (data.progress && typeof data.progress === "object") {
      // Optimistic merge: keep any locally-traced entries that the server
      // doesn't know about yet (PUT may still be in flight).
      const serverProgress = data.progress;
      const merged: LearningProgress = { ...serverProgress };
      for (const [templateId, local] of Object.entries(cachedProgress)) {
        if (
          local.traced &&
          (!merged[templateId] || !merged[templateId].traced)
        ) {
          merged[templateId] = local;
        }
      }
      cachedProgress = merged;
      notifySubscribers();
    }
  } catch {
    // Network error — keep existing cache.
  } finally {
    isSyncing = false;
    syncInFlight = false;
    notifySyncSubscribers();
  }
}

// ---------------------------------------------------------------------------
// Periodic background re-sync (60 s interval)
// ---------------------------------------------------------------------------

let periodicTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start a background re-fetch every 60 seconds. Safe to call multiple times
 * — duplicates are ignored. Call `stopPeriodicSync()` when the user signs out.
 */
export function startPeriodicSync(): void {
  if (periodicTimer !== null) return;
  periodicTimer = setInterval(() => {
    void loadProgressFromServer();
  }, 60_000);
}

/**
 * Stop the periodic background re-sync.
 */
export function stopPeriodicSync(): void {
  if (periodicTimer === null) return;
  clearInterval(periodicTimer);
  periodicTimer = null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * React hook — live, hydrated-safe read of the learner's progress.
 * Returns an empty object until the server response arrives.
 */
export function useLearningProgress(): LearningProgress {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * React hook — true while the initial server fetch is in flight.
 */
export function useSyncing(): boolean {
  return React.useSyncExternalStore(
    subscribeSyncing,
    getSyncSnapshot,
    () => true,
  );
}

/**
 * Plain read for use inside async callbacks (reads from in-memory cache).
 * Returns the latest cached progress — does NOT fetch from the server.
 */
export function getLearningProgress(): LearningProgress {
  return cachedProgress;
}

/**
 * Mark a template as successfully traced (Run produced steps, no error).
 * Updates the cache optimistically and PUTs to the server.
 */
export async function recordTemplateTraced(
  templateId: string,
): Promise<void> {
  // Optimistic update: immediately add to cache so UI reflects the trace.
  const existing = cachedProgress[templateId] ?? { traced: false };
  cachedProgress = {
    ...cachedProgress,
    [templateId]: { ...existing, traced: true, tracedAt: Date.now() },
  };
  notifySubscribers();

  // Persist to server (fire-and-forget — cache is already updated).
  try {
    await fetch(API.me.learningProgress, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: templateId }),
    });
  } catch {
    // Network error — optimistic update is already in the cache.
  }
}

/**
 * Wipe all learning progress (used by the /learn reset control).
 * Clears the cache and DELETEs on the server.
 */
export async function resetLearningProgress(): Promise<void> {
  cachedProgress = EMPTY_PROGRESS;
  notifySubscribers();

  try {
    await fetch(API.me.learningProgress, { method: "DELETE" });
  } catch {
    // Network error — cache is already cleared.
  }
}
