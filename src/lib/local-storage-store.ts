"use client";

import { useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Generic localStorage store factory.
//
// Returns:
//   read()     — fresh read from localStorage (for async callbacks)
//   useStore() — React hook, re-renders only when the value changes
//   set(value) — write + notify subscribers
//   reset()    — remove key + notify subscribers
//
// The snapshot is cached and only re-parsed when a write or a cross-tab
// storage event invalidates it. This keeps `useSyncExternalStore` happy
// (referentially stable snapshots) and avoids parsing on every render.
// ---------------------------------------------------------------------------

export type LocalStorageStore<T> = {
  /** Fresh read from localStorage. Bypasses cache. */
  read: () => T;
  /** React hook — live, hydrated-safe read of the stored value. */
  useStore: () => T;
  /** Write a value and notify all subscribers (same-tab + cross-tab). */
  set: (value: T) => void;
  /** Remove the key and notify all subscribers. */
  reset: () => void;
  /** Subscribe to changes. Returns an unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
};

/**
 * Create a localStorage-backed store.
 *
 * @param key       localStorage key (e.g. "dsa.learningProgress")
 * @param eventName Custom event name for same-tab invalidation (e.g. "dsa-learning-progress")
 * @param serialize   value → string (default: JSON.stringify)
 * @param deserialize string → value (default: JSON.parse)
 * @param defaultValue  Server / SSR fallback (returned by the server snapshot)
 * @param isValid   Optional guard: return false to discard corrupt data
 */
export function createLocalStorageStore<T>({
  key,
  eventName,
  serialize = (v) => JSON.stringify(v),
  deserialize = (v) => JSON.parse(v) as T,
  defaultValue,
  isValid = () => true,
}: {
  key: string;
  eventName: string;
  serialize?: (value: T) => string;
  deserialize: (raw: string) => T;
  defaultValue: T;
  isValid?: (value: T) => boolean;
}): LocalStorageStore<T> {
  let cachedSnapshot: T | null = null;

  function readFromStorage(): T {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return defaultValue;
      const parsed = deserialize(raw);
      if (parsed === null || parsed === undefined) return defaultValue;
      return isValid(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /** Cached read — returns the cached value if available, otherwise parses. */
  function read(): T {
    if (cachedSnapshot !== null) return cachedSnapshot;
    cachedSnapshot = readFromStorage();
    return cachedSnapshot;
  }

  function subscribe(onStoreChange: () => void) {
    const invalidate = () => {
      cachedSnapshot = null;
      onStoreChange();
    };
    window.addEventListener("storage", invalidate);
    window.addEventListener(eventName, invalidate);
    return () => {
      window.removeEventListener("storage", invalidate);
      window.removeEventListener(eventName, invalidate);
    };
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, read, () => defaultValue);
  }

  function set(value: T) {
    try {
      window.localStorage.setItem(key, serialize(value));
    } catch {
      // Storage unavailable (e.g. private mode).
    }
    cachedSnapshot = null;
    window.dispatchEvent(new Event(eventName));
  }

  function reset() {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
    cachedSnapshot = null;
    window.dispatchEvent(new Event(eventName));
  }

  return { read, useStore, set, reset, subscribe };
}
