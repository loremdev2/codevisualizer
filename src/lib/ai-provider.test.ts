import { describe, expect, it } from "vitest";

import {
  DEFAULT_TUTOR_MODEL,
  DEFAULT_TUTOR_TIMEOUT_MS,
  MAX_TIMEOUT_MS,
  MIN_TIMEOUT_MS,
  parseTimeoutMs,
  resolveTutorModel,
  resolveTutorTimeoutMs,
} from "@/lib/ai-provider";

describe("resolveTutorModel", () => {
  it("defaults to the model the translate route uses", () => {
    expect(resolveTutorModel({})).toBe(DEFAULT_TUTOR_MODEL);
  });

  it("honours a configured model, trimming stray whitespace", () => {
    // A copy-pasted id often carries a trailing space — sending that verbatim
    // is a 404 that reads like a permissions bug.
    expect(resolveTutorModel({ AI_TUTOR_MODEL: "  nvidia/llama-3.1-nemotron-70b-instruct  " })).toBe(
      "nvidia/llama-3.1-nemotron-70b-instruct",
    );
  });

  it("falls back when the variable is present but blank", () => {
    expect(resolveTutorModel({ AI_TUTOR_MODEL: "   " })).toBe(DEFAULT_TUTOR_MODEL);
  });
});

describe("parseTimeoutMs", () => {
  it("uses the fallback for missing, blank, or unparseable values", () => {
    expect(parseTimeoutMs(undefined, 1_000)).toBe(1_000);
    expect(parseTimeoutMs("", 1_000)).toBe(1_000);
    expect(parseTimeoutMs("soon", 1_000)).toBe(1_000);
  });

  it("accepts a real value", () => {
    expect(parseTimeoutMs("45000", 1_000)).toBe(45_000);
  });

  it("clamps so a typo can't disable the abort or hang a request forever", () => {
    // 0 would mean "no timeout" to AbortSignal, which turns a hung model into a
    // request that never answers.
    expect(parseTimeoutMs("0", 1_000)).toBe(MIN_TIMEOUT_MS);
    expect(parseTimeoutMs("1", 1_000)).toBe(MIN_TIMEOUT_MS);
    expect(parseTimeoutMs("999999", 1_000)).toBe(MAX_TIMEOUT_MS);
  });
});

describe("resolveTutorTimeoutMs", () => {
  it("defaults to the tutor budget", () => {
    expect(resolveTutorTimeoutMs({})).toBe(DEFAULT_TUTOR_TIMEOUT_MS);
  });

  it("reads the env override", () => {
    expect(resolveTutorTimeoutMs({ AI_TUTOR_TIMEOUT_MS: "150000" })).toBe(150_000);
  });
});
