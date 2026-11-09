/**
 * Pending-load store for the Run-after-Load race fix.
 *
 * Clicking Load then Run immediately used to run the *previous* editor buffer,
 * because React's setState for the new code hadn't flushed yet. The fix writes
 * the exact payload to a synchronous store at Load time; Run consumes it before
 * reading component state. The store is consume-once and cleared on any user
 * edit, so a consumed payload can never leak into a later run.
 */

export interface PendingLoadPayload {
  code: string;
  inputText: string;
}

export interface PendingLoadStore {
  /** Stage a freshly loaded payload (from Load / Collections / share link). */
  set(payload: PendingLoadPayload): void;
  /** Return the staged payload (if any) and clear it — consume-once semantics. */
  consume(): PendingLoadPayload | null;
  /** Drop any staged payload — called when the user edits the code. */
  clear(): void;
}

export function createPendingLoadStore(): PendingLoadStore {
  let pending: PendingLoadPayload | null = null;
  return {
    set(payload) {
      pending = payload;
    },
    consume() {
      const value = pending;
      pending = null;
      return value;
    },
    clear() {
      pending = null;
    },
  };
}
