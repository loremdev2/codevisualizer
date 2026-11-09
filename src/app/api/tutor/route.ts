import { NextResponse, type NextRequest } from "next/server";

import { aiTutorLimits, enforceAiUsageLimit, recordAiDenial } from "@/lib/ai-usage";
import {
  NVIDIA_API_URL,
  resolveTutorModel,
  resolveTutorTimeoutMs,
} from "@/lib/ai-provider";
import { getSessionUserId } from "@/lib/auth/session";
import { buildTutorMessages, clampTutorRequest, type TutorMessage } from "@/lib/tutor-context";

// ---------------------------------------------------------------------------
// POST /api/tutor — one question about the run in view, answered from the
// trace facts the client sent.
//
// Same provider and guard rails as the translate route: NVIDIA NIM
// (OpenAI-compatible), a signed-in user, and a per-hour/per-day spend cap.
// Guests are refused outright (401) — a chat context is much bigger than a
// translation, and the panel shows a sign-in card rather than pretending.
//
// There is deliberately no server-side cache: a conversational answer depends
// on the whole history, so caching would only serve stale replies.
// ---------------------------------------------------------------------------

const TUTOR_MAX_TOKENS = 900;
const TUTOR_TEMPERATURE = 0.3;

function log(message: string, extra?: Record<string, unknown>) {
  const fields = extra
    ? " " + Object.entries(extra).map(([k, v]) => `${k}=${v}`).join(" ")
    : "";
  console.log(`[tutor] ${message}${fields}`);
}

function logError(message: string, extra?: Record<string, unknown>) {
  const fields = extra
    ? " " + Object.entries(extra).map(([k, v]) => `${k}=${v}`).join(" ")
    : "";
  console.error(`[tutor] ${message}${fields}`);
}

/** One NVIDIA NIM chat-completions call. Returns the text, or a ready response. */
async function callNvidia(
  messages: TutorMessage[],
  startedAt: number,
  nvidiaKey: string,
  model: string,
  timeoutMs: number,
): Promise<{ ok: true; answer: string } | { ok: false; response: NextResponse }> {
  const response = await fetch(NVIDIA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${nvidiaKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: TUTOR_TEMPERATURE,
      max_tokens: TUTOR_MAX_TOKENS,
      stream: false,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  log("NVIDIA response received", { status: response.status, ms: Date.now() - startedAt });

  if (!response.ok) {
    const errorText = await response.text();
    logError("NVIDIA returned an error status", {
      status: response.status,
      model,
      ms: Date.now() - startedAt,
      bodyPreview: errorText.slice(0, 200).replace(/\n/g, " "),
    });
    if (response.status === 401) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              "NVIDIA rejected the API key (HTTP 401). Check that NVIDIA_API_KEY is valid " +
              "(get one at https://build.nvidia.com) and that you redeployed after adding it.",
          },
          { status: 502 },
        ),
      };
    }
    // 404 "Function not found for account" and 410 Gone (model retired) are
    // configuration problems, not outages — say so, and name the fix, or this
    // looks like a broken route.
    if (response.status === 404 || response.status === 410) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              `The model ${model} is not available to this NVIDIA account (HTTP ${response.status}). ` +
              "Run `npm run ai:check` to see which models your key can call, then set AI_TUTOR_MODEL to one of them.",
          },
          { status: 502 },
        ),
      };
    }
    // A throttled free-tier key answers 429 for minutes at a time. Report it as
    // rate limiting rather than a 502 outage: the fix is quota, not a retry.
    if (response.status === 429) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              `NVIDIA is rate limiting this key for ${model} (HTTP 429) — the account is out of ` +
              "quota or credits for that model. Add credits at https://build.nvidia.com, or set " +
              "AI_TUTOR_MODEL to a model with quota (`npm run ai:check` shows what responds).",
          },
          { status: 429 },
        ),
      };
    }
    if (response.status === 502 || response.status === 503) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error:
              `${model} did not answer (HTTP ${response.status} from NVIDIA). The model provider is ` +
              "failing upstream — try again, or set AI_TUTOR_MODEL to a different model.",
          },
          { status: 502 },
        ),
      };
    }
    return {
      ok: false,
      response: NextResponse.json(
        { error: `The tutor model ${model} is unavailable right now (HTTP ${response.status}).` },
        { status: 502 },
      ),
    };
  }

  const result = (await response.json()) as {
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
        { error: `The tutor model is unavailable right now: ${result.error.message}` },
        { status: 502 },
      ),
    };
  }

  const answer = (result.choices?.[0]?.message?.content ?? "").trim();
  if (!answer) {
    logError("model returned an empty answer", { ms: Date.now() - startedAt });
    return {
      ok: false,
      response: NextResponse.json(
        { error: "The tutor returned an empty answer. Try asking again." },
        { status: 502 },
      ),
    };
  }
  return { ok: true, answer };
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "The step tutor is free with an account. Sign in to ask about a run." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logError("invalid request body (JSON parse failed)", { userId });
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const clamped = clampTutorRequest(body);
  if (!clamped.ok) {
    logError("request rejected", { userId, error: clamped.error });
    return NextResponse.json({ error: clamped.error }, { status: 400 });
  }
  const { question, brief, history } = clamped.request;

  const limits = aiTutorLimits();
  const decision = await enforceAiUsageLimit(userId, startedAt, limits);
  if (!decision.allowed) {
    logError("rate limit hit", {
      userId,
      violatedBucket: decision.violatedBucket,
      hourCount: decision.hourCount,
      dayCount: decision.dayCount,
      hourlyLimit: limits.hourly,
      dailyLimit: limits.daily,
      retryAfterSeconds: decision.retryAfterSeconds,
    });
    void recordAiDenial(
      userId,
      decision.violatedBucket,
      decision.violatedBucket === "hour" ? decision.hourCount : decision.dayCount,
      decision.retryAfterSeconds,
    );
    return NextResponse.json(
      {
        error:
          decision.violatedBucket === "hour"
            ? `You've used all ${limits.hourly} tutor questions for this hour. Try again in ${Math.ceil(decision.retryAfterSeconds / 60)} minutes.`
            : `You've used all ${limits.daily} tutor questions for today. Try again tomorrow.`,
        retryAfterSeconds: decision.retryAfterSeconds,
      },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } },
    );
  }

  const model = resolveTutorModel();
  const timeoutMs = resolveTutorTimeoutMs();

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (!nvidiaKey) {
    logError("NVIDIA_API_KEY is not configured");
    return NextResponse.json(
      {
        error:
          "No AI provider key is configured. Add NVIDIA_API_KEY to your environment variables " +
          "(free-tier key from https://build.nvidia.com) to enable the tutor.",
      },
      { status: 500 },
    );
  }

  log("question received", {
    userId,
    questionChars: question.length,
    briefChars: brief.length,
    historyTurns: history.length,
    model,
    timeoutMs,
  });

  try {
    const result = await callNvidia(
      buildTutorMessages(clamped.request),
      startedAt,
      nvidiaKey,
      model,
      timeoutMs,
    );
    if (!result.ok) return result.response;
    log("answer returned", { ms: Date.now() - startedAt, answerChars: result.answer.length });
    return NextResponse.json({ answer: result.answer });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "TimeoutError";
    logError(aborted ? "model call timed out" : "model call failed", {
      model,
      timeoutMs,
      ms: Date.now() - startedAt,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: aborted
          ? `${model} did not respond within ${Math.round(timeoutMs / 1000)}s. Either the model is ` +
            "overloaded (try again), or it is not a good fit — set AI_TUTOR_MODEL to a faster model and " +
            "raise AI_TUTOR_TIMEOUT_MS if you expect long answers. `npm run ai:check` lists what your key can call."
          : "The tutor could not be reached. Try again in a moment.",
      },
      { status: 502 },
    );
  }
}
