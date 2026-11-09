import type { VisualStep } from "@/types/visualizer";

/**
 * Index-variable names that the visualizer treats as pointers into arrays,
 * strings, and matrices. Values are only rendered as arrows when they land in
 * bounds, so harmless collisions (e.g. a `target` of 9 on a 10-item array) are
 * avoided by not listing non-index names at all.
 */
export const INDEX_POINTER_NAMES = [
  "i",
  "j",
  "k",
  "x",
  "y",
  "index",
  "idx",
  "left",
  "right",
  "mid",
  "low",
  "high",
  "start",
  "end",
  "lo",
  "hi",
  "l",
  "r",
  "fast",
  "slow",
  "p",
  "q",
  "p1",
  "p2",
  "p3",
] as const;

/** Row/column index names used for matrix axis arrows. */
export const MATRIX_ROW_POINTER_NAMES = ["i", "row", "r", "x", "top", "bottom"] as const;
export const MATRIX_COL_POINTER_NAMES = ["j", "col", "c", "y", "left", "right"] as const;

/**
 * Stable per-variable colors so a pointer keeps one color for the whole run —
 * the same way debuggers colorize index variables. `i` is cyan, `j` orange,
 * `left` teal, `right` amber, `mid` violet, etc. Any name not listed here
 * gets a deterministic color derived from its own name, so *every* variable
 * (custom loop vars, cursors, anything) renders as a pointer with a stable
 * color — no whitelist needed.
 */
const POINTER_NAME_COLORS: Record<string, string> = {
  i: "hsl(190 95% 62%)",
  j: "hsl(30 95% 62%)",
  k: "hsl(45 100% 65%)",
  x: "hsl(175 85% 50%)",
  y: "hsl(285 85% 72%)",
  index: "hsl(280 80% 74%)",
  idx: "hsl(280 80% 74%)",
  left: "hsl(160 80% 58%)",
  low: "hsl(160 80% 58%)",
  lo: "hsl(160 80% 58%)",
  l: "hsl(160 80% 58%)",
  start: "hsl(160 80% 58%)",
  right: "hsl(38 95% 64%)",
  high: "hsl(38 95% 64%)",
  hi: "hsl(38 95% 64%)",
  r: "hsl(38 95% 64%)",
  end: "hsl(38 95% 64%)",
  mid: "hsl(265 90% 76%)",
  fast: "hsl(210 90% 68%)",
  slow: "hsl(330 85% 70%)",
  p: "hsl(140 85% 62%)",
  q: "hsl(20 90% 66%)",
  p1: "hsl(140 90% 45%)",
  p2: "hsl(200 90% 60%)",
  p3: "hsl(320 85% 65%)",
};

/** Deterministic per-name color for pointer variables not in the known map. */
function hashedColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index++) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return `hsl(${hash % 360} 85% 62%)`;
}

export function pointerColor(name: string): string {
  return POINTER_NAME_COLORS[name] ?? hashedColor(name);
}

/**
 * Pointer entries (variable name → index) whose value is a valid integer
 * index into a structure of `length` cells. Data-driven: every pointer
 * variable — known index names *and* any custom variable — renders as an
 * arrow when its value lands in bounds, so students get freedom over names.
 * Passing `names` (matrix axes) restricts to that ordered subset.
 */
export function pointerEntries(
  step: VisualStep | undefined,
  length: number,
  names?: readonly string[],
): Array<{ name: string; index: number }> {
  if (!step?.pointers || length <= 0) return [];
  const candidates: Array<[string, unknown]> = names
    ? names.map((name) => [name, step.pointers?.[name]] as [string, unknown])
    : Object.entries(step.pointers);
  const entries: Array<{ name: string; index: number }> = [];
  for (const [name, value] of candidates) {
    if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length) {
      entries.push({ name, index: value });
    }
  }
  if (names) return entries;
  // Deterministic ordering: the classic index names first (in whitelist
  // order), then any remaining variables alphabetically — so i/j/k keep their
  // familiar left-to-right layout no matter what else is in scope.
  const known = new Set<string>(INDEX_POINTER_NAMES);
  const knownEntries: Array<{ name: string; index: number }> = [];
  const otherEntries: Array<{ name: string; index: number }> = [];
  for (const entry of entries) {
    (known.has(entry.name) ? knownEntries : otherEntries).push(entry);
  }
  otherEntries.sort((a, b) => a.name.localeCompare(b.name));
  return [...knownEntries, ...otherEntries];
}

/** Indexes that differ between two arrays (used for read/write coloring). */
export function diffIndexSet(previous: number[] | undefined, current: number[] | undefined): Set<number> {
  const result = new Set<number>();
  if (!previous || !current) return result;
  const length = Math.max(previous.length, current.length);
  for (let index = 0; index < length; index++) {
    if (previous[index] !== current[index]) result.add(index);
  }
  return result;
}
