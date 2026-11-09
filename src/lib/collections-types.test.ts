import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Minimal localStorage mock
// ---------------------------------------------------------------------------

function createLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
  };
}

let localStorage: ReturnType<typeof createLocalStorage>;

beforeEach(() => {
  localStorage = createLocalStorage();
  (globalThis as Record<string, unknown>).window = { localStorage } as unknown as Window;
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
});

// ---------------------------------------------------------------------------
// Import fresh module for each test to reset module-level state
// ---------------------------------------------------------------------------

async function loadModule() {
  vi.resetModules();
  return import("./collections-types");
}

// ---------------------------------------------------------------------------
// TAG_PALETTE
// ---------------------------------------------------------------------------

describe("TAG_PALETTE", () => {
  it("has 6 predefined tags", async () => {
    const { TAG_PALETTE } = await loadModule();
    expect(TAG_PALETTE).toHaveLength(6);
  });

  it("each tag has label and color", async () => {
    const { TAG_PALETTE } = await loadModule();
    for (const tag of TAG_PALETTE) {
      expect(tag.label).toBeTruthy();
      expect(tag.color).toBeTruthy();
    }
  });

  it("contains expected labels", async () => {
    const { TAG_PALETTE } = await loadModule();
    const labels = TAG_PALETTE.map((t) => t.label);
    expect(labels).toContain("Interview Prep");
    expect(labels).toContain("Needs Review");
    expect(labels).toContain("Mastered");
    expect(labels).toContain("Tricky");
    expect(labels).toContain("Template");
    expect(labels).toContain("Favorite");
  });
});

// ---------------------------------------------------------------------------
// readTags / writeTags
// ---------------------------------------------------------------------------

describe("readTags / writeTags", () => {
  it("returns empty object when localStorage is empty", async () => {
    const { readTags } = await loadModule();
    expect(readTags()).toEqual({});
  });

  it("writes and reads tags correctly", async () => {
    const { readTags, writeTags } = await loadModule();
    const tags = { "algo-1": ["Interview Prep", "Mastered"], "algo-2": ["Tricky"] };
    writeTags(tags);
    expect(readTags()).toEqual(tags);
  });

  it("returns empty object on corrupted JSON", async () => {
    const { readTags } = await loadModule();
    localStorage.setItem("dsa.collectionTags", "not-json{");
    expect(readTags()).toEqual({});
  });

  it("handles empty string in localStorage", async () => {
    const { readTags } = await loadModule();
    localStorage.setItem("dsa.collectionTags", "");
    expect(readTags()).toEqual({});
  });

  it("handles tag arrays with multiple tags", async () => {
    const { readTags, writeTags } = await loadModule();
    const tags = { "algo-1": ["Interview Prep", "Mastered", "Template"] };
    writeTags(tags);
    expect(readTags()).toEqual(tags);
    expect(readTags()["algo-1"]).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// readOrder / writeOrder
// ---------------------------------------------------------------------------

describe("readOrder / writeOrder", () => {
  it("returns empty object when localStorage is empty", async () => {
    const { readOrder } = await loadModule();
    expect(readOrder()).toEqual({});
  });

  it("writes and reads order correctly", async () => {
    const { readOrder, writeOrder } = await loadModule();
    const order = { "Arrays": ["algo-2", "algo-1", "algo-3"] };
    writeOrder(order);
    expect(readOrder()).toEqual(order);
  });

  it("returns empty object on corrupted JSON", async () => {
    const { readOrder } = await loadModule();
    localStorage.setItem("dsa.collectionOrder", "[invalid");
    expect(readOrder()).toEqual({});
  });

  it("handles empty string in localStorage", async () => {
    const { readOrder } = await loadModule();
    localStorage.setItem("dsa.collectionOrder", "");
    expect(readOrder()).toEqual({});
  });

  it("handles multiple topics with different orders", async () => {
    const { readOrder, writeOrder } = await loadModule();
    const order = {
      "Arrays": ["a1", "a2", "a3"],
      "Strings": ["s1", "s2"],
    };
    writeOrder(order);
    expect(readOrder()).toEqual(order);
    expect(readOrder()["Arrays"]).toHaveLength(3);
    expect(readOrder()["Strings"]).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// toggleTagInMap
// ---------------------------------------------------------------------------

describe("toggleTagInMap", () => {
  it("adds a tag to an algorithm", async () => {
    const { toggleTagInMap } = await loadModule();
    const result = toggleTagInMap({}, "algo-1", "Mastered");
    expect(result["algo-1"]).toEqual(["Mastered"]);
  });

  it("removes a tag when toggled twice", async () => {
    const { toggleTagInMap } = await loadModule();
    let result = toggleTagInMap({}, "algo-1", "Mastered");
    result = toggleTagInMap(result, "algo-1", "Mastered");
    expect(result["algo-1"]).toBeUndefined();
  });

  it("adds multiple tags", async () => {
    const { toggleTagInMap } = await loadModule();
    let result = toggleTagInMap({}, "algo-1", "Mastered");
    result = toggleTagInMap(result, "algo-1", "Tricky");
    expect(result["algo-1"]).toEqual(["Mastered", "Tricky"]);
  });

  it("removes one tag while keeping others", async () => {
    const { toggleTagInMap } = await loadModule();
    let result = toggleTagInMap({}, "algo-1", "Mastered");
    result = toggleTagInMap(result, "algo-1", "Tricky");
    result = toggleTagInMap(result, "algo-1", "Mastered");
    expect(result["algo-1"]).toEqual(["Tricky"]);
  });

  it("deletes the algorithm key when all tags are removed", async () => {
    const { toggleTagInMap } = await loadModule();
    let result = toggleTagInMap({}, "algo-1", "Mastered");
    expect(result["algo-1"]).toBeDefined();
    result = toggleTagInMap(result, "algo-1", "Mastered");
    expect(result["algo-1"]).toBeUndefined();
  });

  it("does not mutate the previous state", async () => {
    const { toggleTagInMap } = await loadModule();
    const prev = { "algo-1": ["Mastered"] };
    const result = toggleTagInMap(prev, "algo-1", "Tricky");
    expect(prev["algo-1"]).toEqual(["Mastered"]);
    expect(result["algo-1"]).toEqual(["Mastered", "Tricky"]);
  });

  it("handles different algorithms independently", async () => {
    const { toggleTagInMap } = await loadModule();
    let result = toggleTagInMap({}, "algo-1", "Mastered");
    result = toggleTagInMap(result, "algo-2", "Tricky");
    expect(result["algo-1"]).toEqual(["Mastered"]);
    expect(result["algo-2"]).toEqual(["Tricky"]);
  });
});

// ---------------------------------------------------------------------------
// collectAllTags
// ---------------------------------------------------------------------------

describe("collectAllTags", () => {
  it("returns empty array for empty tags", async () => {
    const { collectAllTags } = await loadModule();
    expect(collectAllTags({})).toEqual([]);
  });

  it("collects unique tags from multiple algorithms", async () => {
    const { collectAllTags } = await loadModule();
    const tags = {
      "algo-1": ["Mastered", "Tricky"],
      "algo-2": ["Tricky", "Favorite"],
      "algo-3": ["Mastered"],
    };
    const result = collectAllTags(tags);
    expect(result).toContain("Mastered");
    expect(result).toContain("Tricky");
    expect(result).toContain("Favorite");
    expect(result).toHaveLength(3);
  });

  it("deduplicates tags", async () => {
    const { collectAllTags } = await loadModule();
    const tags = {
      "algo-1": ["Mastered", "Mastered"],
      "algo-2": ["Mastered"],
    };
    const result = collectAllTags(tags);
    expect(result.filter((t) => t === "Mastered")).toHaveLength(1);
  });

  it("handles algorithms with no tags", async () => {
    const { collectAllTags } = await loadModule();
    const tags = {
      "algo-1": [],
      "algo-2": ["Mastered"],
    };
    const result = collectAllTags(tags);
    expect(result).toEqual(["Mastered"]);
  });

  it("returns all tags when each algorithm has a unique tag", async () => {
    const { collectAllTags } = await loadModule();
    const tags = {
      "a": ["Interview Prep"],
      "b": ["Needs Review"],
      "c": ["Mastered"],
      "d": ["Tricky"],
      "e": ["Template"],
      "f": ["Favorite"],
    };
    const result = collectAllTags(tags);
    expect(result).toHaveLength(6);
  });
});
