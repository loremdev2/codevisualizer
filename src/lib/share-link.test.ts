import { describe, expect, it } from "vitest";

import { decodeSharePayload, encodeSharePayload } from "./share-link";

describe("share-link payload round trip", () => {
  it("encodes and decodes code, input, language, and step", () => {
    const payload = {
      v: 1 as const,
      code: "function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const want = target - nums[i];\n    if (seen.has(want)) return [seen.get(want), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}",
      input: '{"nums":[2,7,11,15],"target":9}',
      language: "javascript" as const,
      s: 12,
    };

    const encoded = encodeSharePayload(payload);
    expect(encoded.startsWith("v1:")).toBe(true);
    // Compressed payload should be far smaller than the raw JSON.
    expect(encoded.length).toBeLessThan(400);

    const decoded = decodeSharePayload(`#${encoded}`);
    expect(decoded).toEqual(payload);
  });

  it("drops the step when it is missing", () => {
    const encoded = encodeSharePayload({
      v: 1,
      code: "const a = 1;",
      input: "{}",
      language: "typescript",
    });
    const decoded = decodeSharePayload(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.s).toBeUndefined();
    expect(decoded?.language).toBe("typescript");
  });

  it("rejects non-share hashes, garbage, and wrong versions", () => {
    expect(decodeSharePayload("")).toBeNull();
    expect(decodeSharePayload("#plain")).toBeNull();
    expect(decodeSharePayload("#other:whatever")).toBeNull();
    expect(decodeSharePayload("#v1:!!!not-lz-string!!!")).toBeNull();
    // Wrong format version decodes to a payload whose v isn't 1 → null.
    const wrongVersion = encodeSharePayload({
      v: 1,
      code: "x",
      input: "{}",
      language: "javascript",
    });
    const tampered = wrongVersion.replace(/^v1:/, "v2:");
    expect(decodeSharePayload(tampered)).toBeNull();
  });

  it("falls back to javascript for an unknown language", () => {
    const payload = {
      v: 1 as const,
      code: "x",
      input: "{}",
      language: "cobol" as never,
    };
    const decoded = decodeSharePayload(encodeSharePayload(payload));
    expect(decoded?.language).toBe("javascript");
  });
});
