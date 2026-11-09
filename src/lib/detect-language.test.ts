import { describe, expect, it } from "vitest";

import {
  AVAILABLE_LANGUAGE_OPTIONS,
  COMING_SOON_LANGUAGE_OPTIONS,
  detectLanguage,
} from "./detect-language";

describe("detectLanguage", () => {
  it("defaults to JavaScript for empty input", () => {
    expect(detectLanguage("").language).toBe("javascript");
  });

  it("detects plain JavaScript with new Map() as JavaScript", () => {
    // Regression: `new Map()` previously matched the Java `new X()` rule.
    const result = detectLanguage("const m = new Map();\nconsole.log(m.size);");
    expect(result.language).toBe("javascript");
    expect(result.isJavaScript).toBe(true);
    expect(result.status).toBe("available");
  });

  it("detects JavaScript with arrow functions and let", () => {
    const result = detectLanguage("const sum = (a, b) => a + b;\nlet total = 0;");
    expect(result.language).toBe("javascript");
  });

  it("detects a JavaScript switch statement as JavaScript", () => {
    // `case 1:` ends with a colon, which alone would match the Python rule.
    const result = detectLanguage(
      "function pick(x) {\n  switch (x) {\n    case 1: return 'a';\n    default: return 'b';\n  }\n}",
    );
    expect(result.language).toBe("javascript");
  });

  it("detects Python", () => {
    const result = detectLanguage(
      "def binary_search(arr, target):\n    left = 0\n    right = len(arr) - 1\n    return -1",
    );
    expect(result.language).toBe("python");
    expect(result.isJavaScript).toBe(false);
    expect(result.status).toBe("available");
  });

  it("detects Java", () => {
    const result = detectLanguage(
      "public class Solution {\n  public static void main(String[] args) {\n    System.out.println(\"hi\");\n  }\n}",
    );
    expect(result.language).toBe("java");
    expect(result.status).toBe("available");
  });

  it("detects C++", () => {
    const result = detectLanguage(
      "#include <vector>\nusing namespace std;\nint main() {\n  vector<int> v;\n  cout << v.size();\n}",
    );
    expect(result.language).toBe("cpp");
    expect(result.status).toBe("available");
  });

  it("detects TypeScript with interface and annotations", () => {
    const result = detectLanguage(
      "interface Item { value: number }\nconst items: Item[] = [];",
    );
    expect(result.language).toBe("typescript");
    expect(result.isJavaScript).toBe(true);
    expect(result.status).toBe("available");
  });

  it("prefers TypeScript over JavaScript on a tie", () => {
    // `let max: number` and `return` score equally for JS and TS; the TS
    // annotations mean the stripper (not the AI path) must run.
    const result = detectLanguage(
      "interface Item {\n  value: number;\n}\nfunction maxItem(items: Item[]): number {\n  let max: number = -Infinity;\n  for (const item of items) {\n    if (item.value > max) max = item.value;\n  }\n  return max;\n}",
    );
    expect(result.language).toBe("typescript");
    expect(result.isJavaScript).toBe(true);
    expect(result.status).toBe("available");
  });

  it("exposes JavaScript, TypeScript, Python, Java, and C++ as the available options", () => {
    expect(AVAILABLE_LANGUAGE_OPTIONS.map((opt) => opt.value)).toEqual([
      "javascript",
      "typescript",
      "python",
      "java",
      "cpp",
    ]);
    expect(COMING_SOON_LANGUAGE_OPTIONS).toHaveLength(7);
    for (const available of ["javascript", "typescript", "python", "java", "cpp"]) {
      expect(COMING_SOON_LANGUAGE_OPTIONS.map((opt) => opt.value)).not.toContain(available);
    }
  });
});
