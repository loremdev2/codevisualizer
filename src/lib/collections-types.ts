// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SavedAlgorithm = {
  id: string;
  title: string;
  topic: string;
  language?: string;
  code: string;
  input_data: unknown;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
};

// ---------------------------------------------------------------------------
// Tag palette
// ---------------------------------------------------------------------------

export const TAG_PALETTE = [
  { label: "Interview Prep", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  { label: "Needs Review", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  { label: "Mastered", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  { label: "Tricky", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" },
  { label: "Template", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  { label: "Favorite", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30" },
] as const;

// ---------------------------------------------------------------------------
// localStorage helpers — tags
// ---------------------------------------------------------------------------

const TAGS_KEY = "dsa.collectionTags";

export function readTags(): Record<string, string[]> {
  try {
    const raw = window.localStorage.getItem(TAGS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

export function writeTags(tags: Record<string, string[]>) {
  try {
    window.localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// localStorage helpers — custom order
// ---------------------------------------------------------------------------

const ORDER_KEY = "dsa.collectionOrder";

export function readOrder(): Record<string, string[]> {
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

export function writeOrder(order: Record<string, string[]>) {
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Tag helpers
// ---------------------------------------------------------------------------

/** Toggle a tag on an algorithm. Returns the updated tags map. */
export function toggleTagInMap(
  prev: Record<string, string[]>,
  algorithmId: string,
  tag: string,
): Record<string, string[]> {
  const current = prev[algorithmId] ?? [];
  const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
  const updated = { ...prev };
  if (next.length === 0) delete updated[algorithmId];
  else updated[algorithmId] = next;
  return updated;
}

/** Collect all unique tags across all algorithms. */
export function collectAllTags(tags: Record<string, string[]>): string[] {
  const tagSet = new Set<string>();
  for (const id of Object.keys(tags)) {
    for (const t of tags[id] ?? []) tagSet.add(t);
  }
  return [...tagSet];
}
