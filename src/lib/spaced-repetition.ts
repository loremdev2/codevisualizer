// ---------------------------------------------------------------------------
// Spaced repetition scheduler — tracks review levels per question and computes
// when each question is due for review based on SM-2-inspired intervals.
//
// Intervals: 1 day, 3 days, 7 days, 14 days, 30 days, 60 days.
// The level advances each time the question is re-solved (toggled on while
// already solved, or solved again after being unsolved).
// ---------------------------------------------------------------------------

const REVIEW_KEY = "dsa.reviewLevels";

const INTERVALS = [1, 3, 7, 14, 30, 60] as const;

/** Read the review-level map from localStorage. */
export function readReviewLevels(): Record<number, number> {
  try {
    const raw = window.localStorage.getItem(REVIEW_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<number, number>;
  } catch {
    return {};
  }
}

/** Write the review-level map to localStorage. */
export function writeReviewLevels(levels: Record<number, number>) {
  try {
    window.localStorage.setItem(REVIEW_KEY, JSON.stringify(levels));
  } catch {
    // Ignore.
  }
}

/** Advance a question's review level (called when it's re-solved). */
export function advanceReviewLevel(questionNo: number) {
  const levels = readReviewLevels();
  const current = levels[questionNo] ?? 0;
  levels[questionNo] = Math.min(current + 1, INTERVALS.length - 1);
  writeReviewLevels(levels);
}

/** Reset a question's review level (called when it's unsolved). */
export function resetReviewLevel(questionNo: number) {
  const levels = readReviewLevels();
  delete levels[questionNo];
  writeReviewLevels(levels);
}

/** Get the interval (in days) for a given review level. */
export function getIntervalDays(level: number): number {
  return INTERVALS[Math.min(level, INTERVALS.length - 1)];
}

/** Compute the next review epoch-ms for a question based on when it was solved and its review level. */
export function getNextReviewMs(solvedAt: number, level: number): number {
  const intervalDays = getIntervalDays(level);
  return solvedAt + intervalDays * 86_400_000;
}

/** Get the set of question numbers that are due for review. */
export function getDueQuestions(
  timestamps: Record<number, number>,
): Set<number> {
  const levels = readReviewLevels();
  const now = Date.now();
  const due = new Set<number>();
  for (const [noStr, solvedAt] of Object.entries(timestamps)) {
    if (solvedAt <= 0) continue;
    const no = Number(noStr);
    const level = levels[no] ?? 0;
    const nextReview = getNextReviewMs(solvedAt, level);
    if (now >= nextReview) {
      due.add(no);
    }
  }
  return due;
}

/** Check if a specific question is due for review. */
export function isDueForReview(
  questionNo: number,
  timestamps: Record<number, number>,
): boolean {
  const solvedAt = timestamps[questionNo] ?? 0;
  if (solvedAt <= 0) return false;
  const levels = readReviewLevels();
  const level = levels[questionNo] ?? 0;
  const nextReview = getNextReviewMs(solvedAt, level);
  return Date.now() >= nextReview;
}
