import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import {
  aiTranslationLimits,
  bumpGuestTranslationUsage,
  HOUR_MS,
  usageBuckets,
} from "@/lib/ai-usage";
import { getSessionUserId } from "@/lib/auth/session";
import { getServiceClient } from "@/lib/db";

// NVIDIA NIM is the only active provider for AI translation. It uses an
// OpenAI-compatible endpoint at integrate.api.nvidia.com. The previous
// OpenRouter rotation (and the legacy Gemini call) are preserved, commented
// out, at the bottom of this file — see "RESTORE: OpenRouter + Gemini".
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "moonshotai/kimi-k3";

// ---------------------------------------------------------------------------
// AI usage caps (spend protection). Every translation is a paid LLM call, so
// signed-in users get a generous hourly + daily budget (a legit user never
// notices; a script gets stopped). Limits come from AI_TRANSLATION_HOURLY_LIMIT
// / AI_TRANSLATION_DAILY_LIMIT (0 = unlimited); see src/lib/ai-usage.ts. Guests
// can't use Java/C++ at all — those languages only run through translation, so
// they're gated behind sign-in (the language is locked in the picker AND
// enforced here server-side). The TypeScript fallback path still works for
// guests because it's an edge case, not a chooseable language.
// ---------------------------------------------------------------------------
// Languages that require translation (and thus sign-in for guests).
const AI_TRANSLATED_LANGUAGES = new Set(["java", "cpp"]);

// --- Server-side translation cache -------------------------------------------
// Identical (language + code + input) requests are served from Postgres so
// repeat runs skip the paid LLM call. Looked up BEFORE the rate-limit bump, so
// cache hits never consume the hourly/daily quota. Both read and write fail
// open — the cache makes translations cheaper, never unavailable.

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Exact-match lookup; null on miss or when the cache store is unreachable. */
async function getCachedTranslation(key: string): Promise<string | null> {
  try {
    const client = getServiceClient();
    const { data } = await client
      .from("ai_translation_cache")
      .select("translated_code")
      .eq("key", key)
      .maybeSingle();
    if (!data?.translated_code) return null;
    // Fire-and-forget hit counter (cache effectiveness telemetry).
    void client.rpc("bump_cache_hits", { p_key: key });
    return data.translated_code;
  } catch (err) {
    logError("translation cache read failed — proceeding with live call", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/** Stores a successful translation; overwrites on exact-key collision (same input). */
async function storeTranslation(
  key: string,
  language: string,
  codeHash: string,
  inputHash: string,
  translatedCode: string,
): Promise<void> {
  try {
    await getServiceClient()
      .from("ai_translation_cache")
      .upsert(
        {
          key,
          language,
          code_hash: codeHash,
          input_hash: inputHash,
          translated_code: translatedCode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
  } catch (err) {
    logError("translation cache write failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Atomically bumps the user's hour and day usage buckets and rejects the
 * request with a 429 when either exceeds its cap. Fails open (logs, allows
 * the translation) if the usage store is unreachable — the caps are spend
 * protection, not availability, and the guest gate above still applies.
 */
async function checkAndBumpUsage(userId: string, now: number): Promise<NextResponse | null> {
  const { hourly, daily } = aiTranslationLimits();
  // 0 = unlimited: skip counting entirely (the quota endpoint hides the badge).
  if (hourly === 0 || daily === 0) return null;
  const { hourStart, dayStart } = usageBuckets(now);
  try {
    const client = getServiceClient();
    const [hour, day] = await Promise.all([
      client.rpc("bump_ai_usage", { p_user: userId, p_bucket: "hour", p_start: hourStart }),
      client.rpc("bump_ai_usage", { p_user: userId, p_bucket: "day", p_start: dayStart }),
    ]);
    const hourCount = Number(hour.data ?? 0);
    const dayCount = Number(day.data ?? 0);
    if (hourCount > hourly || dayCount > daily) {
      const nextHour = new Date(now - (now % HOUR_MS) + HOUR_MS);
      const retryAfterSeconds = Math.max(60, Math.ceil((nextHour.getTime() - now) / 1000));
      logError("rate limit hit", {
        userId,
        hourCount,
        dayCount,
        hourlyLimit: hourly,
        dailyLimit: daily,
        retryAfterSeconds,
      });
      // Record the denial for the admin spend dashboard (fire-and-forget).
      const violatedBucket = hourCount > hourly ? "hour" : "day";
      try {
        void client
          .from("ai_translation_denials")
          .insert({
            user_id: userId,
            bucket_type: violatedBucket,
            count: hourCount > hourly ? hourCount : dayCount,
            retry_after_seconds: retryAfterSeconds,
          });
      } catch {
        // Non-critical telemetry — ignore.
      }
      return NextResponse.json(
        {
          error: `You've used your AI translation limit for now (${hourly} per hour, ${daily} per day). Try again in about ${Math.ceil(retryAfterSeconds / 60)} minutes.`,
          retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }
  } catch (err) {
    logError("usage counter unavailable — proceeding without limit", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

// Helper: one-line log with a stable [translate] prefix so the whole request
// is greppable in server logs. Never logs the API key or the full code body.
function log(message: string, extra?: Record<string, unknown>) {
  const fields = extra
    ? " " + Object.entries(extra).map(([k, v]) => `${k}=${v}`).join(" ")
    : "";
  console.log(`[translate] ${message}${fields}`);
}

function logError(message: string, extra?: Record<string, unknown>) {
  const fields = extra
    ? " " + Object.entries(extra).map(([k, v]) => `${k}=${v}`).join(" ")
    : "";
  console.error(`[translate] ${message}${fields}`);
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const userId = await getSessionUserId(request);

  let body: { code?: string; language?: string; input?: string };
  try {
    body = await request.json() as { code?: string; language?: string; input?: string };
  } catch {
    logError("invalid request body (JSON parse failed)");
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { code, language, input } = body;

  if (!code || typeof code !== "string") {
    logError("no code provided", { language: language ?? "none" });
    return NextResponse.json({ error: "No code provided." }, { status: 400 });
  }

  // Java/C++ only run through AI translation, so guests (no session cookie)
  // don't get them at all — enforced here regardless of what the client shows.
  if (!userId && language !== undefined && AI_TRANSLATED_LANGUAGES.has(language)) {
    log("translation blocked for anonymous user", { language });
    return NextResponse.json(
      {
        error:
          "Java and C++ runs are translated by AI and require a free account. Sign in to use them.",
      },
      { status: 403 },
    );
  }

  // Server-side cache: identical requests (language + code + input) skip the
  // paid LLM call — and never consume the hourly/daily budget. Checked before
  // the rate-limit bump so only genuine misses count against the user.
  const cacheKey = sha256(JSON.stringify([language ?? "unknown", code, input ?? ""]));
  const cached = await getCachedTranslation(cacheKey);
  if (cached) {
    log("translation served from cache", {
      language: language ?? "unknown",
      codeChars: code.length,
      ms: Date.now() - startedAt,
    });
    return NextResponse.json({ translatedCode: cached, cached: true });
  }

  // Signed-in users get a per-hour / per-day translation budget. Guests can't
  // use Java/C++ at all, so the only guest path to the LLM is the
  // exotic-TypeScript fallback — count it too (under the '__guest__' sentinel)
  // so the admin spend dashboard's LLM-call and hit-rate numbers are exact.
  if (userId) {
    const limited = await checkAndBumpUsage(userId, startedAt);
    if (limited) return limited;
  } else if (language === "typescript") {
    await bumpGuestTranslationUsage(startedAt);
  }

  log("request received", {
    language: language ?? "unknown",
    codeChars: code.length,
    inputChars: (input ?? "").length,
    hasKey: Boolean(process.env.NVIDIA_API_KEY),
    userId: userId ?? "anonymous",
  });

  const prompt = buildPrompt(code, language, input);
  log("prompt built", { promptChars: prompt.length, model: NVIDIA_MODEL });

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (!nvidiaKey) {
    logError("NVIDIA_API_KEY is not configured");
    return NextResponse.json(
      {
        error:
          "No AI provider key is configured. Add NVIDIA_API_KEY to your environment variables " +
          "(free-tier key from https://build.nvidia.com) to enable multi-language support.",
      },
      { status: 500 },
    );
  }

  try {
    const first = await callNvidia(prompt, startedAt, nvidiaKey);
    if (!first.ok) return first.response;

    let translatedCode = cleanTranslation(first.content);
    // The model sometimes answers with only //# line: directives and no
    // code. Give it one corrective retry before giving up.
    if (translatedCode && !hasRealCode(translatedCode)) {
      logError("model returned directives without code — retrying", {
        ms: Date.now() - startedAt,
        rawChars: first.content.length,
      });
      const retry = await callNvidia(
        `${prompt}\n\nYour previous response contained ONLY //# line: directives with no actual JavaScript code, which is invalid. Now output the translated JavaScript: each //# line: <N> directive must be IMMEDIATELY followed by the translated statement on the next line. Respond with ONLY the raw JavaScript code.`,
        startedAt,
        nvidiaKey,
      );
      if (!retry.ok) return retry.response;
      translatedCode = cleanTranslation(retry.content);
    }

    if (!translatedCode || !hasRealCode(translatedCode)) {
      logError("empty translation from NVIDIA", {
        ms: Date.now() - startedAt,
        rawChars: first.content.length,
      });
      return NextResponse.json(
        { error: "The AI returned an empty translation. Try simplifying the code." },
        { status: 500 },
      );
    }

    log("translation succeeded", {
      ms: Date.now() - startedAt,
      translatedChars: translatedCode.length,
      preview: translatedCode.slice(0, 120).replace(/\n/g, "\\n"),
      lineDirectives: (translatedCode.match(/\/\/# line: /g) ?? []).length,
    });

    // Cache the successful translation so the next identical request (any
    // session or browser) is served without another LLM call.
    await storeTranslation(
      cacheKey,
      language ?? "unknown",
      sha256(code),
      sha256(input ?? ""),
      translatedCode,
    );

    return NextResponse.json({ translatedCode });
  } catch (err) {
    logError("translation failed with an exception", {
      ms: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: `Translation failed: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 500 },
    );
  }
}

/**
 * One NVIDIA NIM chat-completions call. Returns the raw model output, or an
 * already-built error response (logging included) when the call fails.
 */
async function callNvidia(
  prompt: string,
  startedAt: number,
  nvidiaKey: string,
): Promise<{ ok: true; content: string } | { ok: false; response: NextResponse }> {
  log("calling NVIDIA NIM API", { url: NVIDIA_API_URL, model: NVIDIA_MODEL });
  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${nvidiaKey}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
      stream: false,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  log("NVIDIA response received", {
    status: response.status,
    ms: Date.now() - startedAt,
    contentType: response.headers.get("content-type") ?? "none",
  });

  if (!response.ok) {
    const errorText = await response.text();
    logError("NVIDIA returned an error status", {
      status: response.status,
      ms: Date.now() - startedAt,
      bodyPreview: errorText.slice(0, 200).replace(/\n/g, " "),
    });
    // A 401 is an auth failure — the key itself is rejected. Surface it
    // clearly instead of a generic error.
    if (response.status === 401) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              "NVIDIA rejected the API key (HTTP 401). Check that NVIDIA_API_KEY is valid " +
              "(get one at https://build.nvidia.com), has no leading/trailing spaces or line breaks, " +
              "and that you redeployed after adding it.",
          },
          { status: 502 },
        ),
      };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: `NVIDIA API error: ${response.status} ${errorText.slice(0, 300)}` },
        { status: 502 },
      ),
    };
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (result.error?.message) {
    logError("NVIDIA returned an error in the body", {
      ms: Date.now() - startedAt,
      message: result.error.message.slice(0, 300),
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: `NVIDIA API error: ${result.error.message}` },
        { status: 502 },
      ),
    };
  }

  return { ok: true, content: result.choices?.[0]?.message?.content ?? "" };
}

/** True when the response contains real JS beyond //# line: directives and comments. */
function hasRealCode(translated: string): boolean {
  const body = translated
    .replace(/^\/\/# line: \d+\s*$/gm, "") // drop directive lines
    .replace(/\/\/.*$/g, "") // drop any other comments
    .trim();
  return body.length > 0;
}

function buildPrompt(code: string, language?: string, input?: string): string {
  return `You are a code transpiler for an algorithm visualizer. Your job is to convert code from ${language ?? "any language"} to JavaScript that works inside a trace runner.

CONTEXT:
The trace runner executes JavaScript in a sandboxed Web Worker. The user's code has access to:
- An \`input\` variable (already parsed from JSON) that holds the algorithm's input data
- A \`console.log(...)\` function that emits trace steps
- Standard JavaScript built-ins (Array, Object, Map, Set, Math, etc.)
- The code should return the final result using \`return\`

SAMPLE INPUT JSON: ${input ?? "{}"}

CRITICAL — PRESERVE THE EXACT ALGORITHM:
You MUST translate the code 1:1 at the algorithmic level. This means:
- Same algorithmic approach (e.g., if the original uses two pointers, your translation MUST use two pointers — do NOT switch to a hash map)
- Same variable names (translate to camelCase if needed, but keep the meaning)
- Same loop structure (for → for, while → while, recursion → recursion)
- Same data structure choices (array stays array, hash map stays hash map, stack stays stack)
- Same time/space complexity characteristics
- Do NOT optimize, simplify, or restructure the algorithm
- Do NOT add early returns or shortcuts the original doesn't have
- Do NOT change the order of operations
The visualizer shows the user their original code line-by-line. If your translation uses a different algorithm, the trace steps won't match and the visualization will be confusing.

TRANSLATION RULES:
1. Map language-specific types to JavaScript equivalents:
   - Python list → JS array, Python dict → JS object, Python set → JS Set
   - Java ArrayList → JS array, Java HashMap → JS object
   - C++ vector → JS array, C++ map → JS object
2. Replace print/println/System.out.print/cout with console.log()
3. Replace language-specific loops with JS equivalents (for..of, while, etc.)
4. Remove class/function wrappers — the code should run at the top level
5. Remove imports/includes/using statements
6. Use \`input.fieldName\` to access input fields (same as in the original code)
7. End with \`return <result>\` to return the final answer
8. If the original code uses recursion, keep it recursive in JS

LINE DIRECTIVES (how to annotate your translation):
- Before each translated statement, put a directive line that is EXACTLY:
  //# line: <N>
  where <N> is the 1-based line number of the corresponding statement in the ORIGINAL code. These directives let the visualizer highlight the correct original line.
- The directive MUST be immediately followed by the translated statement on the next line. Example:
  //# line: 3
  const arr = input.array;
  //# line: 7
  for (let i = 0; i < n - 1; i++) {
- Never emit a directive without a statement after it. Never emit two directives in a row.
- Only annotate real executable statements — skip blank lines, comment lines, and lines that are just braces.
- Directives are annotations ONLY. They are not code and can never replace code.

OUTPUT FORMAT (strict):
- Respond with ONLY the raw JavaScript code. No markdown, no code fences, no explanations.
- The only comments allowed are the //# line: directives described above.
- The output MUST contain real executable JavaScript. A response consisting only of directives is invalid and useless.

ORIGINAL CODE (${language ?? "unknown language"}):
${code}`;
}

// Strip markdown code fences if the model added them anyway.
function cleanTranslation(text: string): string {
  return text
    .replace(/^```(?:javascript|js|typescript)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

// ---------------------------------------------------------------------------
// RESTORE: OpenRouter rotation + legacy Gemini (previously the active path).
//
// To restore multi-provider support, uncomment the blocks below, then re-add
// the provider orchestration in POST(): try attemptOpenRouter() first, then
// attemptNvidia(), then attemptGemini(), and only error if all fail.
// ---------------------------------------------------------------------------

// const DEFAULT_FREE_MODELS = [
//   "cohere/north-mini-code:free",
//   "openai/gpt-oss-20b:free",
//   "google/gemma-4-31b-it:free",
//   "poolside/laguna-s-2.1:free",
//   "nvidia/nemotron-3-super-120b-a12b:free",
//   "nvidia/nemotron-3.5-lightning:free",
//   "liquid/lfm-2.5-2.6b:free",
// ];

// let cachedFreeModels: string[] | null = null;
// let cachedFreeModelsAt = 0;
// const FREE_CATALOG_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
//
// async function getLiveFreeModels(): Promise<string[]> {
//   const now = Date.now();
//   if (cachedFreeModels && now - cachedFreeModelsAt < FREE_CATALOG_TTL_MS) {
//     return cachedFreeModels;
//   }
//   try {
//     const response = await fetch("https://openrouter.ai/api/v1/models", {
//       signal: AbortSignal.timeout(2_000),
//     });
//     if (response.ok) {
//       const data = (await response.json()) as { data?: Array<{ id?: string }> };
//       const live = (data.data ?? [])
//         .map((model) => model.id ?? "")
//         .filter((id) => id.endsWith(":free") && !id.includes("content-safety"));
//       if (live.length > 0) {
//         cachedFreeModels = live;
//         cachedFreeModelsAt = now;
//         return live;
//       }
//     }
//   } catch {
//     // Fall through to the baked-in snapshot.
//   }
//   return DEFAULT_FREE_MODELS;
// }

// const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// const GEMINI_API_URL =
//   "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// async function attemptOpenRouter(
//   prompt: string,
//   failures: string[],
//   deadline: number,
// ): Promise<string | null> {
//   const key = process.env.OPENROUTER_API_KEY!;
//   const models = process.env.OPENROUTER_MODELS
//     ? process.env.OPENROUTER_MODELS.split(",").map((m) => m.trim()).filter(Boolean)
//     : Array.from(
//         new Set([...DEFAULT_FREE_MODELS, ...(await getLiveFreeModels()), "openrouter/free"]),
//       );
//
//   for (const model of models) {
//     const remaining = deadline - Date.now();
//     if (remaining < 1_000) break;
//     try {
//       const response = await fetch(OPENROUTER_API_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${key}`,
//           "HTTP-Referer": process.env.APP_URL ?? "https://dsa-lab.vercel.app",
//           "X-Title": "DSA Lab",
//         },
//         body: JSON.stringify({
//           model,
//           messages: [{ role: "user", content: prompt }],
//           temperature: 0.1,
//           max_tokens: 4096,
//         }),
//         signal: AbortSignal.timeout(Math.min(8_000, remaining)),
//       });
//       if (!response.ok) {
//         const errorText = await response.text();
//         failures.push(`OpenRouter ${model}: HTTP ${response.status}`);
//         if (response.status === 401) {
//           failures.push(
//             "OpenRouter rejected the API key (HTTP 401). Check OPENROUTER_API_KEY is valid " +
//               "(starts with sk-or-v1-, no leading/trailing spaces) and redeploy.",
//           );
//         }
//         continue;
//       }
//       const result = await response.json() as {
//         choices?: Array<{ message?: { content?: string } }>;
//         error?: { message?: string };
//       };
//       if (result.error?.message) {
//         failures.push(`OpenRouter ${model}: ${result.error.message}`);
//         continue;
//       }
//       const translatedCode = cleanTranslation(result.choices?.[0]?.message?.content ?? "");
//       if (translatedCode) return translatedCode;
//       failures.push(`OpenRouter ${model}: empty translation`);
//     } catch (err) {
//       failures.push(`OpenRouter ${model}: ${err instanceof Error ? err.message : String(err)}`);
//     }
//   }
//   return null;
// }

// async function attemptGemini(prompt: string, failures: string[]): Promise<string | null> {
//   const key = process.env.GEMINI_API_KEY!;
//   try {
//     const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }],
//         generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
//       }),
//     });
//     if (!response.ok) {
//       const errorText = await response.text();
//       failures.push(`Gemini: HTTP ${response.status} ${errorText.slice(0, 200)}`);
//       return null;
//     }
//     const result = await response.json() as {
//       candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
//     };
//     const translatedCode = cleanTranslation(result.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
//     if (translatedCode) return translatedCode;
//     failures.push("Gemini: empty translation");
//     return null;
//   } catch (err) {
//     failures.push(`Gemini: ${err instanceof Error ? err.message : String(err)}`);
//     return null;
//   }
// }
