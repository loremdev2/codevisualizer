import { describe, it, expect } from "vitest";
import { searchAll, groupByCategory, getDefaultSuggestions } from "./search-index";

// ---------------------------------------------------------------------------
// Tests for the Cmd+K search index.
// ---------------------------------------------------------------------------

describe("searchAll", () => {
  it("returns default suggestions for an empty query", async () => {
    const results = await searchAll("");
    expect(results.length).toBeGreaterThan(0);
    // Should include key pages and problem bank examples
    expect(results.some((r) => r.title === "Open Visualizer")).toBe(true);
    expect(results.some((r) => r.title === "Learn")).toBe(true);
    expect(results.some((r) => r.source === "top150")).toBe(true);
    expect(results.some((r) => r.source === "sorting")).toBe(true);
  });

  it("returns default suggestions for whitespace-only query", async () => {
    const results = await searchAll("   ");
    expect(results.length).toBeGreaterThan(0);
  });

  it("finds algorithms by exact name", async () => {
    const results = await searchAll("bubble sort");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].title).toBe("Bubble sort");
    expect(results[0].category).toBe("Algorithms");
    expect(results[0].url).toContain("/visualizer?t=bubble-sort");
  });

  it("finds algorithms by fuzzy/partial name", async () => {
    const results = await searchAll("fib");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.title.toLowerCase().includes("fibonacci"))).toBe(true);
  });

  it("finds pages", async () => {
    const results = await searchAll("visualizer");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.category === "Pages")).toBe(true);
  });

  it("finds learning paths", async () => {
    const results = await searchAll("dynamic programming");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.category === "Learning Paths")).toBe(true);
  });

  it("finds documentation sections", async () => {
    const results = await searchAll("instrumentation");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.category === "Documentation")).toBe(true);
  });

  it("finds question banks", async () => {
    const results = await searchAll("neetcode");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.category === "Question Banks")).toBe(true);
  });

  it("returns no results for gibberish", async () => {
    const results = await searchAll("xyzzyplugh");
    expect(results).toEqual([]);
  });

  it("deduplicates template names (no two 'Binary search' entries)", async () => {
    const results = await searchAll("binary search");
    const binarySearchResults = results.filter((r) => r.title === "Binary search");
    // Should be exactly 1, not 2 (JS + Python variants)
    expect(binarySearchResults).toHaveLength(1);
  });

  it("all results have required fields", async () => {
    const results = await searchAll("sort");
    for (const result of results) {
      expect(result.id).toBeTruthy();
      expect(result.title).toBeTruthy();
      expect(result.subtitle).toBeTruthy();
      expect(result.category).toBeTruthy();
      expect(result.url).toBeTruthy();
      expect(result.url.startsWith("/")).toBe(true);
    }
  });
});

describe("getDefaultSuggestions", () => {
  it("returns a curated list of popular algorithms and pages", () => {
    const suggestions = getDefaultSuggestions();
    expect(suggestions.length).toBeGreaterThanOrEqual(6);
    // Should have Quick links, Top 150, Sorting, and Algo categories
    expect(suggestions.some((s) => s.category === "Quick links")).toBe(true);
    expect(suggestions.some((s) => s.category === "Top Interview 150")).toBe(true);
    expect(suggestions.some((s) => s.category === "Sorting Algorithms")).toBe(true);
    expect(suggestions.some((s) => s.category === "Algorithms")).toBe(true);
    // All entries should have valid URLs
    for (const s of suggestions) {
      expect(s.url.startsWith("/")).toBe(true);
    }
  });
});

describe("groupByCategory", () => {
  it("groups results by category", async () => {
    const results = await searchAll("sort");
    const grouped = groupByCategory(results);
    expect(grouped.size).toBeGreaterThanOrEqual(1);
    for (const [category, entries] of grouped) {
      expect(category).toBeTruthy();
      for (const entry of entries) {
        expect(entry.category).toBe(category);
      }
    }
  });

  it("returns empty map for empty input", () => {
    const grouped = groupByCategory([]);
    expect(grouped.size).toBe(0);
  });
});
