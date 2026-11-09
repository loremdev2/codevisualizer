// ---------------------------------------------------------------------------
// React hooks for solved status — wires useSyncExternalStore to the store
// and sync state modules. This is the only file that imports React.
// ---------------------------------------------------------------------------

"use client";

import { useSyncExternalStore } from "react";

import {
  EMPTY_SOLVED,
  EMPTY_TIMESTAMPS,
  readSolved,
  readTimestamps,
  subscribeToSolved,
} from "./solved-store";

import {
  type SyncState,
  getSyncState,
  getLastSyncedAt,
  subscribeToSyncState,
} from "./server-sync";

/** Live, hydrated-safe read of the set of solved question numbers. */
export function useSolvedTop150(): Set<number> {
  return useSyncExternalStore(subscribeToSolved, readSolved, () => EMPTY_SOLVED);
}

/** Live read of all solved timestamps. */
export function useSolvedTimestamps(): Record<number, number> {
  return useSyncExternalStore(subscribeToSolved, readTimestamps, () => EMPTY_TIMESTAMPS);
}

/** Current sync state — "idle" | "syncing" | "synced" | "offline". */
export function useSyncState(): SyncState {
  return useSyncExternalStore(
    subscribeToSyncState,
    getSyncState,
    () => "idle" as SyncState,
  );
}

/** Epoch-ms timestamp of the last successful sync, or 0 if never synced. */
export function useLastSyncedAt(): number {
  return useSyncExternalStore(
    subscribeToSyncState,
    getLastSyncedAt,
    () => 0,
  );
}
