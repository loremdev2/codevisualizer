const CACHE_KEY = "dsa-lab-translation-cache";
const MAX_ENTRIES = 50;

type CacheEntry = {
  code: string;
  input: string;
  translatedCode: string;
  ts: number;
};

/**
 * Deterministic 64-bit hash used as a cache key. Not cryptographic — each
 * entry also stores the exact code/input so a (practically impossible)
 * collision is detected and falls back to a fresh translation.
 */
export function translationCacheKey(language: string, code: string, input: string): string {
  const text = `${language}\u0000${code}\u0000${input}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

function readEntries(): Record<string, CacheEntry> {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeEntries(entries: Record<string, CacheEntry>): void {
  try {
    const sorted = Object.entries(entries)
      .sort(([, a], [, b]) => b.ts - a.ts)
      .slice(0, MAX_ENTRIES);
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(sorted)));
  } catch {
    // Storage full or unavailable — caching is best-effort.
  }
}

export function getCachedTranslation(
  key: string,
  code: string,
  input: string,
): string | null {
  const entry = readEntries()[key];
  if (!entry) return null;
  // Verify the payload still matches (hash collision safety, staleness).
  if (entry.code !== code || entry.input !== input) return null;
  return entry.translatedCode;
}

export function setCachedTranslation(
  key: string,
  code: string,
  input: string,
  translatedCode: string,
): void {
  const entries = readEntries();
  entries[key] = { code, input, translatedCode, ts: Date.now() };
  writeEntries(entries);
}
