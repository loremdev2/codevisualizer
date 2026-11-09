/**
 * Expected-vs-actual checking for the Output strip. Students paste what they
 * expect the algorithm to return (e.g. `[0, 1]`, `true`, `[[2,4],[1,3]]`) and
 * the app verifies it against the run's actual result with a pass/fail verdict.
 *
 * Comparison is JSON-aware: when both sides parse, they are deep-compared (so
 * `{"a":1,"b":2}` matches `{"b":2,"a":1}`); otherwise the trimmed strings are
 * compared. Everything here is pure so it is unit-testable.
 */

export type ResultCheck = {
  /** Whether actual equals expected (only meaningful when both are present). */
  match: boolean;
  /** True when a real (non-placeholder) run result exists. */
  hasActual: boolean;
  /** True when the student entered an expected value. */
  hasExpected: boolean;
};

// Placeholder states the visualizer writes before/during/after failed runs —
// never meaningful output to compare against.
const PLACEHOLDER_RESULTS = new Set([
  "No result yet",
  "No result",
  "Running...",
  "Running Python…",
  "No output",
  "(no return value)",
  "Translating...",
  "Loading the Python runtime (first run downloads ~15 MB)…",
]);

export function checkResult(actualText: string, expectedText: string): ResultCheck {
  const hasActual = Boolean(actualText) && !PLACEHOLDER_RESULTS.has(actualText.trim());
  const hasExpected = Boolean(expectedText.trim());
  if (!hasActual || !hasExpected) return { match: false, hasActual, hasExpected };

  const actual = tryParse(actualText);
  const expected = tryParse(expectedText);
  if (actual.parsed && expected.parsed) {
    return { match: deepEqualJson(actual.value, expected.value), hasActual, hasExpected };
  }
  return { match: actualText.trim() === expectedText.trim(), hasActual, hasExpected };
}

function tryParse(text: string): { parsed: boolean; value: unknown } {
  try {
    return { parsed: true, value: JSON.parse(text) as unknown };
  } catch {
    return { parsed: false, value: undefined };
  }
}

/** Structural equality for JSON values (arrays, plain objects, primitives). */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqualJson(item, b[index]));
  }

  if (typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqualJson((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
  }

  return false;
}
