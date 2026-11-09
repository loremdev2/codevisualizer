// ---------------------------------------------------------------------------
// Basic profanity filter for username validation.
//
// Uses a set of common offensive words (lowercase). The filter checks for
// exact matches and simple character substitutions (e.g., @ for a, 0 for o).
// This is a lightweight client/server-safe filter — not a replacement for
// a dedicated moderation system.
// ---------------------------------------------------------------------------

// Common offensive words and slurs (lowercase, no spaces)
const BLOCKED_WORDS = new Set([
  // Common slurs and offensive terms
  "asshole",
  "bitch",
  "bullshit",
  "cocksucker",
  "cunt",
  "dickhead",
  "dumbass",
  "fag",
  "faggot",
  "fuck",
  "fucking",
  "goddamn",
  "godsdamn",
  "hell",
  "homo",
  "jackass",
  "motherfucker",
  "nigga",
  "nigger",
  "piss",
  "pussy",
  "shit",
  "slut",
  "whore",
  // Common bypass attempts
  "f u c k",
  "f u c k i n g",
  "s h i t",
  "a s s",
]);

// Character substitution map for common bypasses
const CHAR_MAP: Record<string, string> = {
  "@": "a",
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "$": "s",
  "!": "i",
  "+": "t",
};

/**
 * Normalize a string by replacing common character substitutions and
 * removing non-alphanumeric characters.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((char) => CHAR_MAP[char] ?? char)
    .filter((char) => /[a-z0-9]/.test(char))
    .join("");
}

/**
 * Check if a username contains blocked words.
 * Returns null if clean, or the blocked word if found.
 */
export function checkProfanity(username: string): string | null {
  const normalized = normalize(username);

  // Check for blocked words (normalize already removes spaces and
  // substitutes characters, so split words like "f u c k" are caught)
  for (const word of BLOCKED_WORDS) {
    if (normalized.includes(word)) {
      return word;
    }
  }

  return null;
}

/**
 * Validate a username against all rules.
 * Returns null if valid, or an error message if invalid.
 */
export function validateUsername(name: string): string | null {
  // Length check
  if (name.length < 2) {
    return "Name must be at least 2 characters.";
  }
  if (name.length > 50) {
    return "Name must be 50 characters or less.";
  }

  // Character check — allow letters, numbers, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    return "Name can only contain letters, numbers, spaces, hyphens, and underscores.";
  }

  // Profanity check
  const blocked = checkProfanity(name);
  if (blocked) {
    return "This name contains inappropriate language.";
  }

  return null;
}
