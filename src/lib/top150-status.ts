// ---------------------------------------------------------------------------
// Re-export barrel — backward-compatible facade over the split modules.
//
// All logic now lives in:
//   solved-store.ts  — pure localStorage CRUD
//   server-sync.ts   — fetch calls, merge logic, offline queue
//   solved-hooks.ts  — React hooks
//
// New code should import from the specific module directly.
// ---------------------------------------------------------------------------

export {
  EMPTY_SOLVED,
  EMPTY_TIMESTAMPS,
  readSolved,
  readTimestamps,
  solvedTimestamp,
  subscribeToSolved,
  toggleTop150Solved,
  toggleTopicSolved,
  resetTop150Solved,
} from "./solved-store";

export {
  type SyncState,
  cancelServerSync,
  loadSolvedFromServer,
  pushSolvedToggleToServer,
  replaceSolvedFromServer,
  resetSolvedOnServer,
} from "./server-sync";

export {
  useLastSyncedAt,
  useSolvedTimestamps,
  useSolvedTop150,
  useSyncState,
} from "./solved-hooks";
