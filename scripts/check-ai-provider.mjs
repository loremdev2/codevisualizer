#!/usr/bin/env node
// Which NVIDIA NIM models can this key actually call, and how fast?
//
// Usage: npm run ai:check
//
// Why this exists: when the model id is wrong for the account, NIM answers
// 404 "Function '<uuid>': Not found for account '<id>'", and when the model is
// too slow it never answers at all. Both look like a broken route from the
// outside, and neither is visible in a 500 from /api/tutor or /api/translate.
// This probes each candidate with a tiny prompt so you can see the difference
// and pick a model that works.
//
// Reads the key the way Next.js does (first file that defines it wins), so it
// agrees with the dev server: .env.development.local, .env.local,
// .env.development, .env — plus anything already in process.env.

import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ENV_FILES = [".env.development.local", ".env.local", ".env.development", ".env"];

const API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const PROBE_TIMEOUT_MS = 25_000;

// Must match PROVIDER_CANDIDATES in src/lib/ai-provider.ts.
const CANDIDATES = [
  "moonshotai/kimi-k3",
  "moonshotai/kimi-k2.6",
  "mistralai/mistral-7b-instruct-v0.3",
  "nv-mistralai/mistral-nemo-12b-instruct",
  "google/gemma-3-12b-it",
  "nvidia/llama-3.1-nemotron-70b-instruct",
];

/** Minimal dotenv-compatible parser — note the trim, which Next.js also does. */
function parseEnvFile(contents) {
  const parsed = {};
  for (const rawLine of contents.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals === -1) continue;
    const key = line.slice(0, equals).trim();
    if (!key) continue;
    let value = line.slice(equals + 1).trim();
    const quote = value[0];
    if ((quote === '"' || quote === "'" || quote === "`") && value.endsWith(quote)) {
      value = value.slice(1, -1);
    } else {
      const comment = value.indexOf(" #");
      if (comment !== -1) value = value.slice(0, comment).trim();
    }
    parsed[key] = value;
  }
  return parsed;
}

function loadEnv() {
  const merged = { ...process.env };
  for (const file of ENV_FILES) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    const parsed = parseEnvFile(fs.readFileSync(full, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      // First definition wins, like dotenv's populate().
      if (merged[key] === undefined || merged[key] === "") merged[key] = value;
    }
  }
  return merged;
}

/** One tiny completion; returns a verdict rather than throwing. */
async function probe(key, model) {
  const startedAt = Date.now();
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply with the single word: ready" }],
        max_tokens: 16,
        temperature: 0,
        stream: false,
      }),
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    const ms = Date.now() - startedAt;
    if (response.ok) {
      const body = await response.json().catch(() => ({}));
      const text = body?.choices?.[0]?.message?.content ?? "";
      return text
        ? { verdict: "OK", ms }
        : { verdict: "OK (empty reply)", ms };
    }
    const detail = await response.text().catch(() => "");
    if (response.status === 404) return { verdict: "not enabled for this account", ms };
    if (response.status === 410) return { verdict: "retired (end of life)", ms };
    if (response.status === 401) return { verdict: "key rejected", ms };
    if (response.status === 429) return { verdict: "rate limited / no credit", ms };
    if (response.status >= 500) return { verdict: `provider failing upstream (HTTP ${response.status})`, ms };
    return { verdict: `HTTP ${response.status} ${detail.slice(0, 80)}`, ms };
  } catch (err) {
    const ms = Date.now() - startedAt;
    const aborted = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    return {
      verdict: aborted ? `no response in ${PROBE_TIMEOUT_MS / 1000}s` : `request failed: ${err.message}`,
      ms,
    };
  }
}

const env = loadEnv();
const apiKey = env.NVIDIA_API_KEY?.trim();
const configured = env.AI_TUTOR_MODEL?.trim() || CANDIDATES[0];

if (!apiKey) {
  console.error("No NVIDIA_API_KEY found in process.env or " + ENV_FILES.join(", "));
  console.error("Add it to .env.local (server-only) — see .env.example.");
  process.exit(1);
}

console.log(`key: ${apiKey.slice(0, 8)}… (${apiKey.length} chars)`);
console.log(`AI_TUTOR_MODEL: ${env.AI_TUTOR_MODEL?.trim() || "(unset — default " + CANDIDATES[0] + ")"}`);
console.log(`probing ${CANDIDATES.length} models with a 16-token prompt (${PROBE_TIMEOUT_MS / 1000}s cap each)\n`);

const results = [];
for (const model of CANDIDATES) {
  const result = await probe(apiKey, model);
  results.push({ model, ...result });
  const marker = model === configured ? " *" : "";
  console.log(`${result.verdict.padEnd(46)} ${String(result.ms).padStart(6)}ms  ${model}${marker}`);
}

const working = results.filter((result) => result.verdict.startsWith("OK"));
const configuredResult = results.find((result) => result.model === configured);

console.log("\n* = the model the tutor will use");
if (configuredResult?.verdict.startsWith("OK")) {
  console.log(`\nThe tutor's model (${configured}) answers. Translation uses the same provider.`);
} else if (working.length > 0) {
  console.log(
    `\nThe tutor's model (${configured}) does not answer, but these do:\n` +
      working.map((result) => `  ${result.model} (${result.ms}ms)`).join("\n") +
      `\n\nSet AI_TUTOR_MODEL in .env.local to one of them and restart the dev server.`,
  );
  process.exitCode = 1;
} else {
  console.log(
    "\nNo model answered. The three things this usually means, in order of likelihood:" +
      "\n  1. The account is out of quota/credits for the model it can reach (throttled" +
      " keys hang, then answer 429). Add credits at https://build.nvidia.com." +
      "\n  2. The key is entitled to a different model than the ones probed here — check" +
      " the model catalog in your NVIDIA account and add the id to CANDIDATES." +
      "\n  3. NVIDIA's inference is degraded right now." +
      "\n/api/translate uses the same provider, so it hits the same wall — this is not a" +
      " bug in the app's routes.",
  );
  process.exitCode = 1;
}
