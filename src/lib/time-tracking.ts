"use client";

// ---------------------------------------------------------------------------
// Time tracking — measures how long a user spends on a question between
// opening it in the visualizer and marking it solved.
//
// Flow:
//   1. Visualizer mounts → startTimer(questionNo) stores { questionNo, startedAt } in localStorage
//   2. User marks solved → getElapsedMs(questionNo) reads the timer, calculates duration
//   3. Duration is sent to the server via the activity ledger
//   4. Timer is cleared
//
// This crosses page boundaries (visualizer → learn page) via localStorage.
// ---------------------------------------------------------------------------

const LS_KEY = "dsa.activeTimer";

type ActiveTimer = {
  questionNo: number;
  startedAt: number;
};

/**
 * Start a timer when the user opens a question in the visualizer.
 * Overwrites any existing timer (only one question at a time).
 */
export function startTimer(questionNo: number): void {
  try {
    const timer: ActiveTimer = { questionNo, startedAt: Date.now() };
    window.localStorage.setItem(LS_KEY, JSON.stringify(timer));
  } catch {
    // localStorage unavailable — time tracking is best-effort.
  }
}

/**
 * Get the elapsed time in milliseconds for a question, then clear the timer.
 * Returns null if no timer exists or the question doesn't match.
 */
export function getElapsedMs(questionNo: number): number | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;

    const timer = JSON.parse(raw) as ActiveTimer;
    if (timer.questionNo !== questionNo) return null;

    const elapsed = Date.now() - timer.startedAt;

    // Clear the timer.
    window.localStorage.removeItem(LS_KEY);

    // Sanity check: ignore timers > 2 hours (user left tab open overnight).
    if (elapsed > 2 * 60 * 60 * 1000) return null;

    return elapsed;
  } catch {
    return null;
  }
}

/**
 * Clear the active timer without recording (e.g., user navigated away).
 */
export function clearTimer(): void {
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * Get the currently active timer (for display purposes).
 */
export function getActiveTimer(): ActiveTimer | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveTimer;
  } catch {
    return null;
  }
}
