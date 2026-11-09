import { afterEach, describe, expect, it, vi } from "vitest";

import {
  detectStringAlphabet,
  generateArray,
  generateGraph,
  generateMatrix,
  generateString,
  STRING_ALPHABETS,
} from "./input-generators";

afterEach(() => {
  vi.restoreAllMocks();
});

function seedRandom(sequence: number[]) {
  let index = 0;
  vi.spyOn(Math, "random").mockImplementation(() => {
    const value = sequence[index % sequence.length];
    index += 1;
    return value;
  });
}

describe("generateArray", () => {
  it("produces the requested size with values in [0, maxVal]", () => {
    seedRandom([0.5]);
    const result = generateArray({ size: 6, maxVal: 10, distinct: false });
    expect(result).toHaveLength(6);
    for (const value of result) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  it("distinct arrays are unique and exactly size long when size <= maxVal + 1", () => {
    const result = generateArray({ size: 8, maxVal: 20, distinct: true });
    expect(result).toHaveLength(8);
    expect(new Set(result).size).toBe(8);
    for (const value of result) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it("distinct arrays are capped at maxVal + 1 entries", () => {
    const result = generateArray({ size: 50, maxVal: 5, distinct: true });
    expect(result).toHaveLength(6);
    expect(new Set(result).size).toBe(6);
  });

  it("distinct arrays shuffle rather than emit a sorted run", () => {
    // One draw per Fisher–Yates pass; each picks the previous index, which
    // reorders the pool instead of leaving it sorted.
    seedRandom([0.7, 0.6, 0.5, 0.4]);
    const result = generateArray({ size: 5, maxVal: 4, distinct: true });
    expect(result).not.toEqual([0, 1, 2, 3, 4]);
    expect(new Set(result)).toEqual(new Set([0, 1, 2, 3, 4]));
  });
});

describe("generateMatrix", () => {
  it("matches the requested dimensions and value range", () => {
    seedRandom([0.5]);
    const result = generateMatrix({ rows: 3, cols: 4, maxVal: 9 });
    expect(result).toHaveLength(3);
    for (const row of result) {
      expect(row).toHaveLength(4);
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThanOrEqual(9);
      }
    }
  });

  it("handles a 1×1 matrix", () => {
    const result = generateMatrix({ rows: 1, cols: 1, maxVal: 5 });
    expect(result).toEqual([[expect.any(Number)]]);
  });
});

describe("generateGraph", () => {
  it("creates the requested node count with no self-loops and valid neighbors", () => {
    seedRandom([0.5]);
    const result = generateGraph({ nodes: 4, density: 50 });
    const names = Object.keys(result);
    expect(names).toEqual(["A", "B", "C", "D"]);
    for (const [node, neighbors] of Object.entries(result)) {
      expect(neighbors).not.toContain(node);
      for (const neighbor of neighbors) {
        expect(names).toContain(neighbor);
      }
    }
  });

  it("density 0 produces an edgeless graph", () => {
    const result = generateGraph({ nodes: 5, density: 0 });
    for (const neighbors of Object.values(result)) {
      expect(neighbors).toHaveLength(0);
    }
  });

  it("density 100 produces the complete graph (both directions, no self-loops)", () => {
    const result = generateGraph({ nodes: 3, density: 100 });
    expect(result.A.sort()).toEqual(["B", "C"]);
    expect(result.B.sort()).toEqual(["A", "C"]);
    expect(result.C.sort()).toEqual(["A", "B"]);
  });
});

describe("generateString", () => {
  it("matches the requested length", () => {
    seedRandom([0.5]);
    expect(generateString(7, "upper")).toHaveLength(7);
    expect(generateString(1, "binary")).toHaveLength(1);
  });

  it("draws every character from the chosen alphabet", () => {
    for (const [alphabet, pool] of Object.entries(STRING_ALPHABETS)) {
      const result = generateString(50, alphabet as keyof typeof STRING_ALPHABETS);
      for (const char of result) {
        expect(pool, `${alphabet} produced ${char}`).toContain(char);
      }
    }
  });

  it("binary alphabet only ever yields A and B (the sliding-window classic)", () => {
    seedRandom([0.99]);
    const result = generateString(20, "binary");
    expect(result).toMatch(/^[AB]+$/);
  });

  it("digits alphabet only ever yields 0–9", () => {
    seedRandom([0.99]);
    const result = generateString(20, "digits");
    expect(result).toMatch(/^[0-9]+$/);
  });
});

describe("detectStringAlphabet", () => {
  it("detects a binary A/B string", () => {
    expect(detectStringAlphabet("AABABBA")).toBe("binary");
  });

  it("detects digits", () => {
    expect(detectStringAlphabet("120045")).toBe("digits");
  });

  it("detects lowercase", () => {
    expect(detectStringAlphabet("abcdef")).toBe("lower");
  });

  it("defaults mixed/empty strings to upper", () => {
    expect(detectStringAlphabet("")).toBe("upper");
    expect(detectStringAlphabet("HelloWorld")).toBe("upper");
  });
});
