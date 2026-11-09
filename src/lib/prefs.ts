"use client";

import { createLocalStorageStore } from "./local-storage-store";

// ---------------------------------------------------------------------------
// Persisted user preferences (localStorage).
// ---------------------------------------------------------------------------

const autoPlayStore = createLocalStorageStore<boolean>({
  key: "dsa.autoPlayAfterRun",
  eventName: "dsa-prefs",
  defaultValue: true,
  deserialize: (raw) => raw !== "false",
  serialize: (v) => String(v),
});

/** Live, hydrated-safe read of the Auto-play preference (default on). */
export const useAutoPlayAfterRun = autoPlayStore.useStore;

/** Plain read, for use inside async callbacks (reads localStorage fresh). */
export const getAutoPlayAfterRun = autoPlayStore.read;

/** Persist the preference and notify subscribers immediately. */
export const setAutoPlayAfterRun = autoPlayStore.set;
