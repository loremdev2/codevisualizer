// ---------------------------------------------------------------------------
// Solved-status store — pure localStorage CRUD with in-memory cache.
//
// This is the lowest layer: read/write solved sets and timestamps to
// localStorage, with a module-level cache so reads are fast. No React, no
// network, no sync logic.
// ---------------------------------------------------------------------------

const SOLVED_KEY = "dsa.top150Solved";
const SOLVED_EVENT = "dsa-top150-solved";
const TIMESTAMPS_KEY = "dsa.solvedTimestamps";

// ---------------------------------------------------------------------------
// Solved set (Set<number> of question numbers)
// ---------------------------------------------------------------------------

/** Stable empty snapshot (shared by the server and the no-data client read). */
export const EMPTY_SOLVED = new Set<number>();

let cachedSolved: Set<number> | null = null;

function parseFromStorage(): Set<number> {
  try {
    const raw = window.localStorage.getItem(SOLVED_KEY);
    if (!raw) return EMPTY_SOLVED;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY_SOLVED;
    const set = new Set<number>();
    for (const value of parsed) {
      if (Number.isInteger(value) && (value as number) > 0) set.add(value as number);
    }
    return set;
  } catch {
    return EMPTY_SOLVED;
  }
}

export function readSolved(): Set<number> {
  if (cachedSolved !== null) return cachedSolved;
  cachedSolved = parseFromStorage();
  return cachedSolved;
}

export function writeSolved(next: Set<number>) {
  try {
    window.localStorage.setItem(SOLVED_KEY, JSON.stringify([...next].sort((a, b) => a - b)));
  } catch {
    // Storage unavailable (e.g. private mode) — solved status just won't persist.
  }
  window.dispatchEvent(new Event(SOLVED_EVENT));
}

export function invalidateSolvedCache() {
  cachedSolved = null;
}

// ---------------------------------------------------------------------------
// Solved timestamps — epoch-ms when each question was first marked solved.
// ---------------------------------------------------------------------------

export const EMPTY_TIMESTAMPS: Record<number, number> = {};
let cachedTimestamps: Record<number, number> | null = null;

export function readTimestamps(): Record<number, number> {
  if (cachedTimestamps !== null) return cachedTimestamps;
  try {
    const raw = window.localStorage.getItem(TIMESTAMPS_KEY);
    if (!raw) { cachedTimestamps = EMPTY_TIMESTAMPS; return cachedTimestamps; }
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      cachedTimestamps = EMPTY_TIMESTAMPS;
      return cachedTimestamps;
    }
    cachedTimestamps = parsed as Record<number, number>;
    return cachedTimestamps;
  } catch {
    cachedTimestamps = EMPTY_TIMESTAMPS;
    return cachedTimestamps;
  }
}

export function writeTimestamps(ts: Record<number, number>) {
  cachedTimestamps = null; // Invalidate cache so next read picks up changes.
  try {
    window.localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(ts));
  } catch {
    // Ignore.
  }
}

export function invalidateTimestampsCache() {
  cachedTimestamps = null;
}

export function setSolvedTimestamp(questionNo: number) {
  const ts = readTimestamps();
  if (!ts[questionNo]) {
    writeTimestamps({ ...ts, [questionNo]: Date.now() });
  }
}

export function removeSolvedTimestamp(questionNo: number) {
  const ts = readTimestamps();
  if (ts[questionNo]) {
    const { [questionNo]: _, ...rest } = ts;
    writeTimestamps(rest);
  }
}

/** Epoch-ms when a question was first marked solved, or 0 if unsolved. */
export function solvedTimestamp(questionNo: number): number {
  const ts = readTimestamps();
  return ts[questionNo] ?? 0;
}

// ---------------------------------------------------------------------------
// Event subscription (for useSyncExternalStore)
// ---------------------------------------------------------------------------

export function subscribeToSolved(onStoreChange: () => void) {
  const invalidate = () => {
    invalidateSolvedCache();
    invalidateTimestampsCache();
    onStoreChange();
  };
  window.addEventListener("storage", invalidate);
  window.addEventListener(SOLVED_EVENT, invalidate);
  return () => {
    window.removeEventListener("storage", invalidate);
    window.removeEventListener(SOLVED_EVENT, invalidate);
  };
}

// ---------------------------------------------------------------------------
// Toggle helpers (localStorage only — no server sync)
// ---------------------------------------------------------------------------

/**
 * Toggle an entire topic's questions as solved/unsolved.
 * If any question in the topic is unsolved, all are solved.
 * If all are already solved, all are unsolved.
 */
export function toggleTopicSolved(
  questionNos: number[],
  solved: Set<number>,
) {
  const allSolved = questionNos.every((no) => solved.has(no));
  const next = new Set(solved);
  for (const no of questionNos) {
    if (allSolved) {
      next.delete(no);
      removeSolvedTimestamp(no);
    } else {
      next.add(no);
      setSolvedTimestamp(no);
    }
  }
  writeSolved(next);
}

/** Mark / unmark a question as solved (localStorage only). */
export function toggleTop150Solved(questionNo: number) {
  const current = readSolved();
  const next = new Set(current);
  if (next.has(questionNo)) {
    next.delete(questionNo);
    removeSolvedTimestamp(questionNo);
  } else {
    next.add(questionNo);
    setSolvedTimestamp(questionNo);
  }
  writeSolved(next);
}

/** Wipe all solved status (used by the /learn reset control). */
export function resetTop150Solved() {
  try {
    window.localStorage.removeItem(SOLVED_KEY);
    window.localStorage.removeItem(TIMESTAMPS_KEY);
  } catch {
    // Ignore.
  }
  window.dispatchEvent(new Event(SOLVED_EVENT));
}
