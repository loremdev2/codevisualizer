/**
 * Pure diff helpers for the Variables panel structure renderers.
 *
 * These are plain functions over trace snapshots (previous step vs current
 * step) — no JSX, no tracer coupling. The UI decides how to render the
 * resulting added / updated / removed / pushed / popped hints.
 */

export type MapDiff = {
  /** Keys present in `current` but not `previous`, in current insertion order. */
  added: Array<[string, unknown]>;
  /** Keys present in both whose value changed. */
  updated: Array<[string, unknown]>;
  /** Keys present only in `previous`, in previous insertion order. */
  removed: Array<[string, unknown]>;
};

/** Entry-level diff between two map snapshots (object with primitive values). */
export function diffMaps(
  previous: Record<string, unknown> | undefined,
  current: Record<string, unknown> | undefined,
): MapDiff {
  const prev = previous ?? {};
  const curr = current ?? {};
  const added: Array<[string, unknown]> = [];
  const updated: Array<[string, unknown]> = [];
  const removed: Array<[string, unknown]> = [];

  for (const [key, value] of Object.entries(curr)) {
    if (!(key in prev)) added.push([key, value]);
    else if (!sameValue(prev[key], value)) updated.push([key, value]);
  }
  for (const key of Object.keys(prev)) {
    if (!(key in curr)) removed.push([key, prev[key]]);
  }
  return { added, updated, removed };
}

/** Indices where two arrays differ (same length assumed; shorter length = rest changed). */
export function changedIndices(
  previous: unknown[] | undefined,
  current: unknown[] | undefined,
): number[] {
  const prev = previous ?? [];
  const curr = current ?? [];
  const indices: number[] = [];
  const length = Math.max(prev.length, curr.length);
  for (let index = 0; index < length; index++) {
    if (!sameValue(prev[index], curr[index])) indices.push(index);
  }
  return indices;
}

/** Unique items present in `current` but not `previous` (by JSON identity). */
export function uniqueAdditions(previous: unknown[] | undefined, current: unknown[] | undefined): unknown[] {
  const prevKeys = new Set((previous ?? []).map(identity));
  return (current ?? []).filter((item) => !prevKeys.has(identity(item)));
}

/** Unique items present in `previous` but not `current` (by JSON identity). */
export function uniqueRemovals(previous: unknown[] | undefined, current: unknown[] | undefined): unknown[] {
  const currKeys = new Set((current ?? []).map(identity));
  return (previous ?? []).filter((item) => !currKeys.has(identity(item)));
}

function identity(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  return identity(a) === identity(b);
}
