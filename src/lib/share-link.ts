// ---------------------------------------------------------------------------
// Shareable deep links (C.1) + embed mode (C.2)
//
// The whole workspace — code, input JSON, language, and the current step — is
// compressed with lz-string into the URL hash, so a link works with zero auth
// and zero server state (the Python Tutor distribution model):
//
//   /visualizer#v1:<payload>   — full workspace, opens and auto-runs
//   /embed#v1:<payload>        — chrome-free iframe variant for courses/slides
//
// The payload is deliberately self-contained: decoding never touches the
// network, so shared links work in private tabs, email, and LMS embeds.
// ---------------------------------------------------------------------------

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

import type { SupportedLanguage } from "@/lib/detect-language";

export type SharePayload = {
  /** Format version — bump when the shape changes; old links decode to null. */
  v: 1;
  code: string;
  /** Raw input JSON text, exactly as the user typed it. */
  input: string;
  language: SupportedLanguage;
  /** 0-based step index to seek to after the trace runs. */
  s?: number;
};

const HASH_PREFIX = "v1:";
const MAX_HASH_CHARS = 16_000;
/** Maximum decompressed payload size — prevents zip-bomb / decompression attacks. */
const MAX_DECOMPRESSED_BYTES = 512 * 1024; // 512 KB

/** `#v1:<lz-string>` — the only string that goes after the `#`. */
export function encodeSharePayload(payload: SharePayload): string {
  return HASH_PREFIX + compressToEncodedURIComponent(JSON.stringify(payload));
}

/** Decodes a `location.hash` value; returns null for anything malformed/foreign. */
export function decodeSharePayload(hash: string): SharePayload | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.startsWith(HASH_PREFIX)) return null;
  try {
    const json = decompressFromEncodedURIComponent(raw.slice(HASH_PREFIX.length));
    if (!json) return null;
    // Guard against decompression bombs: reject payloads that expand beyond
    // a reasonable limit (code + input JSON should never be this large).
    if (json.length > MAX_DECOMPRESSED_BYTES) return null;
    const parsed = JSON.parse(json) as Partial<SharePayload>;
    if (parsed.v !== 1 || typeof parsed.code !== "string" || typeof parsed.input !== "string") {
      return null;
    }
    const payload: SharePayload = {
      v: 1,
      code: parsed.code,
      input: parsed.input,
      language: isValidLanguage(parsed.language) ? parsed.language : "javascript",
    };
    if (Number.isInteger(parsed.s) && (parsed.s as number) >= 0) payload.s = parsed.s;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Absolute share URL for the current state, or "" when the payload is too big
 * to be a practical link (guard against absurdly long URLs breaking messengers).
 */
export function buildShareUrl(payload: SharePayload): string {
  const hash = encodeSharePayload(payload);
  if (hash.length > MAX_HASH_CHARS) return "";
  return `${window.location.origin}/visualizer#${hash}`;
}

/** Same payload, but the chrome-free `/embed` route (for iframes). */
export function buildEmbedUrl(payload: SharePayload): string {
  const hash = encodeSharePayload(payload);
  if (hash.length > MAX_HASH_CHARS) return "";
  return `${window.location.origin}/embed#${hash}`;
}

/** Copy-paste iframe snippet for course notes / slides / blogs. */
export function buildEmbedCode(payload: SharePayload): string {
  const url = buildEmbedUrl(payload);
  if (!url) return "";
  return (
    `<iframe src="${url}" width="100%" height="600" style="border:1px solid #e2e8f0;` +
    `border-radius:8px" loading="lazy" title="DSA Lab — interactive algorithm trace" ` +
    `allowfullscreen></iframe>`
  );
}

function isValidLanguage(value: unknown): value is SupportedLanguage {
  return (
    value === "javascript" ||
    value === "typescript" ||
    value === "python" ||
    value === "java" ||
    value === "cpp" ||
    value === "go" ||
    value === "rust" ||
    value === "ruby" ||
    value === "swift" ||
    value === "kotlin" ||
    value === "csharp" ||
    value === "php"
  );
}
