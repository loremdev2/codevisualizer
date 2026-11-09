import { describe, expect, it } from "vitest";

import { checkResult, deepEqualJson } from "./result-check";

describe("checkResult", () => {
  it("matches JSON arrays deeply", () => {
    expect(checkResult("[0, 1]", "[0, 1]")).toEqual({ match: true, hasActual: true, hasExpected: true });
    expect(checkResult("[0, 1]", "[0, 2]")).toMatchObject({ match: false });
  });

  it("ignores whitespace and formatting differences in JSON", () => {
    expect(checkResult("[[2,4],[1,3],[2,4],[1,3]]", "[[2, 4], [1, 3], [2, 4], [1, 3]]")).toMatchObject({ match: true });
    expect(checkResult('{"a":1,"b":2}', '{"b": 2, "a": 1}')).toMatchObject({ match: true });
  });

  it("matches primitives and booleans", () => {
    expect(checkResult("true", "true")).toMatchObject({ match: true });
    expect(checkResult("true", "false")).toMatchObject({ match: false });
    expect(checkResult("42", "42")).toMatchObject({ match: true });
    expect(checkResult("5", "42")).toMatchObject({ match: false });
  });

  it("falls back to trimmed string comparison for non-JSON output", () => {
    expect(checkResult("Hello world", "Hello world")).toMatchObject({ match: true });
    expect(checkResult(" Hello world ", "Hello world")).toMatchObject({ match: true });
    expect(checkResult("Hello world", "Hello there")).toMatchObject({ match: false });
  });

  it("reports hasActual false for placeholder results", () => {
    for (const placeholder of ["No result yet", "Running...", "No output", "No result"]) {
      expect(checkResult(placeholder, "[1]")).toEqual({ match: false, hasActual: false, hasExpected: true });
    }
  });

  it("reports hasExpected false when empty", () => {
    expect(checkResult("[1, 2]", "")).toEqual({ match: false, hasActual: true, hasExpected: false });
    expect(checkResult("[1, 2]", "   ")).toMatchObject({ hasExpected: false });
  });
});

describe("deepEqualJson", () => {
  it("handles nested structures and key-order independence", () => {
    expect(deepEqualJson({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqualJson({ a: 1, b: { c: [1, 2] } }, { b: { c: [1, 2] }, a: 1 })).toBe(true);
    expect(deepEqualJson({ a: [1, 2] }, { a: [2, 1] })).toBe(false);
    expect(deepEqualJson([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqualJson(null, null)).toBe(true);
    expect(deepEqualJson(null, {})).toBe(false);
  });
});
