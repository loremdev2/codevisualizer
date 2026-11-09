/**
 * Pure input generators for the structured input editor.
 *
 * Kept free of React so the random-generation rules are unit-testable. The
 * editor components own the slider/checkbox UI state and call these on Apply.
 */

export interface ArrayGenOptions {
  size: number;
  maxVal: number;
  distinct: boolean;
}

/** Random numeric array. `distinct` guarantees uniqueness (capped at maxVal+1). */
export function generateArray({ size, maxVal, distinct }: ArrayGenOptions): number[] {
  if (distinct) {
    const pool = Array.from({ length: maxVal + 1 }, (_, i) => i);
    // Fisher–Yates shuffle.
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, Math.min(size, pool.length));
  }
  return Array.from({ length: size }, () => Math.floor(Math.random() * (maxVal + 1)));
}

export interface MatrixGenOptions {
  rows: number;
  cols: number;
  maxVal: number;
}

/** Random numeric matrix of the given dimensions. */
export function generateMatrix({ rows, cols, maxVal }: MatrixGenOptions): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.floor(Math.random() * (maxVal + 1))),
  );
}

export interface GraphGenOptions {
  nodes: number;
  /** Edge probability in percent, 0–100. */
  density: number;
}

/** Random directed graph on nodes A.. (no self-loops). */
export function generateGraph({ nodes, density }: GraphGenOptions): Record<string, string[]> {
  const names = Array.from({ length: nodes }, (_, i) => String.fromCharCode(65 + i));
  const next: Record<string, string[]> = {};
  for (const name of names) next[name] = [];
  for (let i = 0; i < nodes; i++) {
    for (let j = 0; j < nodes; j++) {
      if (i !== j && Math.random() < density / 100) {
        next[names[i]].push(names[j]);
      }
    }
  }
  return next;
}

export type StringAlphabet = "upper" | "binary" | "lower" | "digits";

/** Character pools per alphabet — "binary" (A/B) is the classic sliding-window input. */
export const STRING_ALPHABETS: Record<StringAlphabet, string> = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  binary: "AB",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
};

/** Random string of `length` characters drawn from the chosen alphabet. */
export function generateString(length: number, alphabet: StringAlphabet): string {
  const pool = STRING_ALPHABETS[alphabet];
  return Array.from({ length }, () => pool[Math.floor(Math.random() * pool.length)]).join("");
}

/** Pick the alphabet a string most likely uses, for sensible generator defaults. */
export function detectStringAlphabet(value: string): StringAlphabet {
  if (!value) return "upper";
  if (/^[AB]+$/.test(value)) return "binary";
  if (/^[0-9]+$/.test(value)) return "digits";
  if (/^[a-z]+$/.test(value)) return "lower";
  return "upper";
}
