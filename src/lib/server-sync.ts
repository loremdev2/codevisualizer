// ---------------------------------------------------------------------------
// Server sync — fetch calls, merge logic, offline queue, and sync state.
//
// Depends on solved-store for localStorage reads/writes. No React.
// ---------------------------------------------------------------------------

import {
  readSolved,
  writeSolved,
  readTimestamps,
  writeTimestamps,
} from "./solved-store";
import { API, solvedQuestionsUrl } from "./api-config";

// ---------------------------------------------------------------------------
// Sync state — exposed via useSyncState() for the "Synced ✓" indicator.
// ---------------------------------------------------------------------------

export type SyncState = "idle" | "syncing" | "synced" | "offline";

let syncState: SyncState = "idle";
let lastSyncedAt: number = 0;
const syncSubscribers = new Set<() => void>();

export function getSyncState(): SyncState {
  return syncState;
}

export function getLastSyncedAt(): number {
  return lastSyncedAt;
}

export function setSyncState(next: SyncState) {
  if (syncState === next) return;
  syncState = next;
  if (next === "synced") lastSyncedAt = Date.now();
  for (const cb of syncSubscribers) cb();
}

export function subscribeToSyncState(onStoreChange: () => void) {
  syncSubscribers.add(onStoreChange);
  return () => {
    syncSubscribers.delete(onStoreChange);
  };
}

// ---------------------------------------------------------------------------
// Offline toggle queue
// ---------------------------------------------------------------------------

type PendingToggle = {
  question_no: number;
  bank: string;
  timestamp: number;
};

const PENDING_QUEUE_KEY = "dsa.pendingServerToggles";

function readPendingQueue(): PendingToggle[] {
  try {
    const raw = window.localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as PendingToggle[];
  } catch {
    return [];
  }
}

function writePendingQueue(queue: PendingToggle[]) {
  try {
    if (queue.length === 0) {
      window.localStorage.removeItem(PENDING_QUEUE_KEY);
    } else {
      window.localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch {
    // Ignore.
  }
}

function enqueuePendingToggle(questionNo: number, bank: string) {
  const queue = readPendingQueue();
  // Deduplicate: if the same question+bank is already pending, remove the old entry.
  const filtered = queue.filter(
    (entry) => !(entry.question_no === questionNo && entry.bank === bank),
  );
  filtered.push({ question_no: questionNo, bank, timestamp: Date.now() });
  writePendingQueue(filtered);
}

function dequeuePendingToggle(): PendingToggle | undefined {
  const queue = readPendingQueue();
  const entry = queue.shift();
  writePendingQueue(queue);
  return entry;
}

// ---------------------------------------------------------------------------
// Server sync (signed-in users only)
// ---------------------------------------------------------------------------

let syncInFlight = false;
let syncAbort: AbortController | null = null;

/**
 * Cancel any in-flight server sync. Called on sign-out so the response
 * doesn't overwrite the freshly cleared localStorage.
 */
export function cancelServerSync(): void {
  syncAbort?.abort();
  setSyncState("idle");
}

/** Fetch the server's solved set and timestamps for a single bank. */
async function fetchBankFromServer(
  bank: string,
  signal?: AbortSignal,
): Promise<{ solved: number[]; timestamps: Record<number, number> }> {
  const response = await fetch(solvedQuestionsUrl(bank), {
    cache: "no-store",
    signal,
  });
  if (!response.ok) return { solved: [], timestamps: {} };
  const data = (await response.json()) as {
    solved?: number[];
    timestamps?: Record<number, number>;
  };
  return {
    solved: Array.isArray(data.solved) ? data.solved : [],
    timestamps: data.timestamps && typeof data.timestamps === "object" ? data.timestamps : {},
  };
}

/**
 * Fetch the server's solved sets for all banks and UNION-merge with localStorage.
 * Called once on sign-in so cross-device progress is pulled down without
 * overwriting any local-only work.
 */
export async function loadSolvedFromServer(): Promise<void> {
  if (syncInFlight) return;
  syncInFlight = true;
  const controller = new AbortController();
  syncAbort = controller;
  setSyncState("syncing");
  try {
    const [top150, neetcode] = await Promise.all([
      fetchBankFromServer("top150", controller.signal).catch(() => ({ solved: [] as number[], timestamps: {} })),
      fetchBankFromServer("neetcode", controller.signal).catch(() => ({ solved: [] as number[], timestamps: {} })),
    ]);

    // Union: keep everything from both sources.
    const localSet = readSolved();
    const merged = new Set([...localSet, ...top150.solved, ...neetcode.solved]);
    writeSolved(merged);

    // Merge server timestamps — keep the newer of local vs server for each question.
    const localTs = readTimestamps();
    const mergedTs = { ...localTs };
    for (const [noStr, serverMs] of Object.entries({ ...top150.timestamps, ...neetcode.timestamps })) {
      const no = Number(noStr);
      if (!mergedTs[no] || serverMs > mergedTs[no]) mergedTs[no] = serverMs;
    }
    writeTimestamps(mergedTs);

    setSyncState("synced");
  } catch {
    // Network error or abort — fall back to localStorage.
    setSyncState("idle");
  } finally {
    syncInFlight = false;
    syncAbort = null;
  }
}

// ---------------------------------------------------------------------------
// Push toggle to server (with offline queue)
// ---------------------------------------------------------------------------

const pendingToggles = new Map<string, Promise<void>>();

function toggleKey(questionNo: number, bank: string): string {
  return `${bank}:${questionNo}`;
}

/**
 * Push a single toggle to the server and reconcile localStorage with the
 * server's response. The server is authoritative for signed-in users.
 * Deduplicates rapid clicks on the same question: if a PUT for this
 * question_no is already in flight, the call is a no-op.
 *
 * If the network is unavailable, the toggle is queued for retry.
 */
export async function pushSolvedToggleToServer(
  questionNo: number,
  bank: string = "top150",
  options?: { force?: boolean },
): Promise<void> {
  const key = toggleKey(questionNo, bank);
  if (!options?.force && pendingToggles.has(key)) return;

  setSyncState("syncing");

  const promise = fetch(API.me.solvedQuestions, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_no: questionNo, bank }),
  })
    .then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as {
        solved?: number[];
        timestamps?: Record<number, number>;
      };
      if (!Array.isArray(data.solved)) return;
      // Merge: keep local entries from other banks, replace this bank's set
      // with the server response so both sources stay in sync.
      const serverSet = new Set(data.solved);
      const localSet = readSolved();
      const merged = new Set([...localSet, ...serverSet]);
      writeSolved(merged);

      // Merge server timestamps — keep the newer of local vs server.
      if (data.timestamps && typeof data.timestamps === "object") {
        const localTs = readTimestamps();
        const mergedTs = { ...localTs };
        for (const [noStr, serverMs] of Object.entries(data.timestamps)) {
          const no = Number(noStr);
          if (!mergedTs[no] || serverMs > mergedTs[no]) mergedTs[no] = serverMs;
        }
        writeTimestamps(mergedTs);
      }

      setSyncState("synced");
    })
    .catch(() => {
      // Network error — queue for retry.
      enqueuePendingToggle(questionNo, bank);
      setSyncState("offline");
    })
    .finally(() => {
      pendingToggles.delete(key);
    });
  pendingToggles.set(key, promise);
  await promise;
}

/**
 * Clear server-side solved status for the authenticated user in a specific bank.
 * Called by the reset control so progress doesn't reappear on next load.
 */
export async function resetSolvedOnServer(bank: string = "top150"): Promise<void> {
  try {
    await fetch(solvedQuestionsUrl(bank), { method: "DELETE" });
  } catch {
    // Network error — localStorage is already cleared.
  }
}

/**
 * Replace localStorage with the server's solved sets (all banks).
 * Used after a per-bank reset so the cleared bank's entries are removed
 * from the unified localStorage set.
 */
export async function replaceSolvedFromServer(): Promise<void> {
  if (syncInFlight) return;
  syncInFlight = true;
  const controller = new AbortController();
  syncAbort = controller;
  setSyncState("syncing");
  try {
    const [top150, neetcode] = await Promise.all([
      fetchBankFromServer("top150", controller.signal).catch(() => ({ solved: [] as number[], timestamps: {} })),
      fetchBankFromServer("neetcode", controller.signal).catch(() => ({ solved: [] as number[], timestamps: {} })),
    ]);

    // Replace: write only what the server has (no union with old localStorage).
    const merged = new Set([...top150.solved, ...neetcode.solved]);
    writeSolved(merged);

    // Replace timestamps with server data.
    const mergedTs = { ...top150.timestamps, ...neetcode.timestamps };
    writeTimestamps(mergedTs);

    setSyncState("synced");
  } catch {
    // Network error or abort — leave localStorage unchanged.
    setSyncState("idle");
  } finally {
    syncInFlight = false;
    syncAbort = null;
  }
}

// ---------------------------------------------------------------------------
// Offline queue replay
// ---------------------------------------------------------------------------

let replayInFlight = false;

async function replayPendingToggles(): Promise<void> {
  if (replayInFlight) return;
  replayInFlight = true;
  try {
    while (true) {
      const entry = dequeuePendingToggle();
      if (!entry) break;
      try {
        await fetch(API.me.solvedQuestions, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question_no: entry.question_no, bank: entry.bank }),
        });
      } catch {
        // Still offline — re-enqueue and stop.
        enqueuePendingToggle(entry.question_no, entry.bank);
        break;
      }
    }
    // Refresh from server after replaying.
    const queue = readPendingQueue();
    if (queue.length === 0) {
      setSyncState("synced");
    }
  } finally {
    replayInFlight = false;
  }
}

/** Set up online/offline listeners for the retry queue. Called once on module load. */
function initOfflineQueue() {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    void replayPendingToggles();
  });
}

// Initialize on module load (client only).
initOfflineQueue();
