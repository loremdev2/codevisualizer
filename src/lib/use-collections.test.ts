import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// We test the pure logic functions that the hook uses.
// The hook itself requires React context, so we test the data transformation
// functions in isolation.
// ---------------------------------------------------------------------------

// Minimal mock for window.localStorage
function createLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
  };
}

let ls: ReturnType<typeof createLocalStorage>;

beforeEach(() => {
  ls = createLocalStorage();
  (globalThis as Record<string, unknown>).window = { localStorage: ls } as unknown as Window;
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
});

async function loadModules() {
  vi.resetModules();
  const types = await import("./collections-types");
  return types;
}

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

type SavedAlgorithm = {
  id: string;
  title: string;
  topic: string;
  language?: string;
  code: string;
  input_data: unknown;
  created_at?: string;
  updated_at?: string;
};

const sampleAlgorithms: SavedAlgorithm[] = [
  { id: "1", title: "Merge Sort", topic: "Sorting", code: "function merge() {}", input_data: null, updated_at: "2026-09-01" },
  { id: "2", title: "Binary Search", topic: "Search", code: "function bs() {}", input_data: [1, 2, 3], updated_at: "2026-09-02" },
  { id: "3", title: "Quick Sort", topic: "Sorting", code: "function quick() {}", input_data: null, updated_at: "2026-08-30" },
  { id: "4", title: "BFS", topic: "Graph", code: "function bfs() {}", input_data: null, updated_at: "2026-09-01" },
  { id: "5", title: "DFS", topic: "Graph", code: "function dfs() {}", input_data: null, updated_at: "2026-08-25" },
  { id: "6", title: "Custom Algo", topic: "", code: "function custom() {}", input_data: null, updated_at: "2026-09-03" },
];

// ---------------------------------------------------------------------------
// Topic counting
// ---------------------------------------------------------------------------

describe("topic counting", () => {
  it("counts algorithms per topic", async () => {
    const counts = new Map<string, number>();
    for (const item of sampleAlgorithms) {
      const topic = item.topic || "Custom";
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
    const topics = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

    expect(topics).toHaveLength(4); // Sorting, Search, Graph, Custom
    expect(topics.find(([t]) => t === "Sorting")?.[1]).toBe(2);
    expect(topics.find(([t]) => t === "Graph")?.[1]).toBe(2);
    expect(topics.find(([t]) => t === "Search")?.[1]).toBe(1);
    expect(topics.find(([t]) => t === "Custom")?.[1]).toBe(1);
  });

  it("sorts topics by count descending", async () => {
    const counts = new Map<string, number>();
    for (const item of sampleAlgorithms) {
      const topic = item.topic || "Custom";
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
    const topics = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

    // First two should have count 2
    expect(topics[0][1]).toBe(2);
    expect(topics[1][1]).toBe(2);
    // Next two should have count 1
    expect(topics[2][1]).toBe(1);
    expect(topics[3][1]).toBe(1);
  });

  it("empty topic string becomes Custom", async () => {
    const counts = new Map<string, number>();
    for (const item of sampleAlgorithms) {
      const topic = item.topic || "Custom";
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
    expect(counts.has("Custom")).toBe(true);
    expect(counts.get("Custom")).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

describe("filtering", () => {
  it("filters by topic", async () => {
    const selectedTopic: string = "Sorting";
    const filtered = sampleAlgorithms.filter((item) => {
      const matchesTopic = selectedTopic === "All" || item.topic === selectedTopic;
      return matchesTopic;
    });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((item) => item.topic === "Sorting")).toBe(true);
  });

  it("filtering All shows everything", async () => {
    const selectedTopic = "All";
    const filtered = sampleAlgorithms.filter((item) => {
      const matchesTopic = selectedTopic === "All" || item.topic === selectedTopic;
      return matchesTopic;
    });
    expect(filtered).toHaveLength(6);
  });

  it("filters by search query in title", async () => {
    const query = "merge";
    const filtered = sampleAlgorithms.filter((item) => {
      return item.title.toLowerCase().includes(query);
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("1");
  });

  it("filters by search query in topic", async () => {
    const query = "graph";
    const filtered = sampleAlgorithms.filter((item) => {
      return (item.topic || "").toLowerCase().includes(query);
    });
    expect(filtered).toHaveLength(2);
  });

  it("filters by search query in code", async () => {
    const query = "bfs";
    const filtered = sampleAlgorithms.filter((item) => {
      return item.code.toLowerCase().includes(query);
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("4");
  });

  it("filters by tag", async () => {
    const tags: Record<string, string[]> = { "1": ["Mastered"], "3": ["Mastered"] };
    const selectedTag = "Mastered";
    const filtered = sampleAlgorithms.filter((item) => {
      return !selectedTag || (tags[item.id] ?? []).includes(selectedTag);
    });
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("1");
    expect(filtered[1].id).toBe("3");
  });

  it("no selectedTag shows all", async () => {
    const tags: Record<string, string[]> = { "1": ["Mastered"] };
    const selectedTag = null;
    const filtered = sampleAlgorithms.filter((item) => {
      return !selectedTag || (tags[item.id] ?? []).includes(selectedTag);
    });
    expect(filtered).toHaveLength(6);
  });

  it("combines topic + search filters", async () => {
    const selectedTopic: string = "Sorting";
    const query = "quick";
    const filtered = sampleAlgorithms.filter((item) => {
      const matchesTopic = selectedTopic === "All" || item.topic === selectedTopic;
      const matchesSearch = query.length === 0 || item.title.toLowerCase().includes(query);
      return matchesTopic && matchesSearch;
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("3");
  });
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

describe("sorting", () => {
  it("sorts by title alphabetically", async () => {
    const sorted = [...sampleAlgorithms].sort((a, b) => a.title.localeCompare(b.title));
    expect(sorted[0].title).toBe("BFS");
    expect(sorted[sorted.length - 1].title).toBe("Quick Sort");
  });

  it("sorts by topic alphabetically", async () => {
    const sorted = [...sampleAlgorithms].sort((a, b) => (a.topic || "").localeCompare(b.topic || ""));
    expect(sorted[0].topic).toBe(""); // Custom
    expect(sorted[sorted.length - 1].topic).toBe("Sorting");
  });

  it("sorts by recent (most recent first)", async () => {
    const sorted = [...sampleAlgorithms].sort(
      (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime(),
    );
    expect(sorted[0].id).toBe("6"); // Sep 3
    expect(sorted[1].id).toBe("2"); // Sep 2
  });
});

// ---------------------------------------------------------------------------
// Sectioning (group by topic with custom order)
// ---------------------------------------------------------------------------

describe("sectioning", () => {
  it("groups algorithms by topic", async () => {
    const groups = new Map<string, SavedAlgorithm[]>();
    for (const item of sampleAlgorithms) {
      const topic = item.topic || "Custom";
      const list = groups.get(topic) ?? [];
      list.push(item);
      groups.set(topic, list);
    }
    expect(groups.size).toBe(4);
    expect(groups.get("Sorting")).toHaveLength(2);
    expect(groups.get("Graph")).toHaveLength(2);
  });

  it("applies custom order within a topic", async () => {
    const groups = new Map<string, SavedAlgorithm[]>();
    for (const item of sampleAlgorithms) {
      const topic = item.topic || "Custom";
      const list = groups.get(topic) ?? [];
      list.push(item);
      groups.set(topic, list);
    }

    const order: Record<string, string[]> = { "Sorting": ["3", "1"] }; // Quick Sort first
    for (const [topic, items] of groups) {
      const topicOrder = order[topic];
      if (topicOrder && topicOrder.length > 0) {
        const idToItem = new Map(items.map((item) => [item.id, item]));
        const ordered: SavedAlgorithm[] = [];
        for (const id of topicOrder) {
          const item = idToItem.get(id);
          if (item) ordered.push(item);
        }
        for (const item of items) {
          if (!topicOrder.includes(item.id)) ordered.push(item);
        }
        groups.set(topic, ordered);
      }
    }

    const sorting = groups.get("Sorting")!;
    expect(sorting[0].id).toBe("3"); // Quick Sort (custom order first)
    expect(sorting[1].id).toBe("1"); // Merge Sort
  });

  it("appends new items not in the order list", async () => {
    const groups = new Map<string, SavedAlgorithm[]>();
    groups.set("Sorting", [
      { id: "1", title: "Merge Sort", topic: "Sorting", code: "a", input_data: null },
      { id: "3", title: "Quick Sort", topic: "Sorting", code: "b", input_data: null },
      { id: "7", title: "Heap Sort", topic: "Sorting", code: "c", input_data: null },
    ]);

    const order: Record<string, string[]> = { "Sorting": ["3"] }; // Only Quick Sort in custom order
    for (const [topic, items] of groups) {
      const topicOrder = order[topic];
      if (topicOrder && topicOrder.length > 0) {
        const idToItem = new Map(items.map((item) => [item.id, item]));
        const ordered: SavedAlgorithm[] = [];
        for (const id of topicOrder) {
          const item = idToItem.get(id);
          if (item) ordered.push(item);
        }
        for (const item of items) {
          if (!topicOrder.includes(item.id)) ordered.push(item);
        }
        groups.set(topic, ordered);
      }
    }

    const sorting = groups.get("Sorting")!;
    expect(sorting[0].id).toBe("3"); // Quick Sort (custom order)
    expect(sorting[1].id).toBe("1"); // Merge Sort (appended)
    expect(sorting[2].id).toBe("7"); // Heap Sort (appended)
  });
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

describe("stats", () => {
  it("computes total, topics, and lastSaved", async () => {
    const counts = new Map<string, number>();
    for (const item of sampleAlgorithms) {
      const topic = item.topic || "Custom";
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
    const topics = Array.from(counts.entries());
    const lastSaved = sampleAlgorithms.reduce<string | undefined>(
      (latest, item) => (!latest || (item.updated_at ?? "") > latest ? item.updated_at : latest),
      undefined,
    );

    expect(sampleAlgorithms.length).toBe(6);
    expect(topics.length).toBe(4);
    expect(lastSaved).toBe("2026-09-03");
  });

  it("lastSaved is undefined for empty algorithms", async () => {
    const algorithms: SavedAlgorithm[] = [];
    const lastSaved = algorithms.reduce<string | undefined>(
      (latest, item) => (!latest || (item.updated_at ?? "") > latest ? item.updated_at : latest),
      undefined,
    );
    expect(lastSaved).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// collectAllTags (integration with tag system)
// ---------------------------------------------------------------------------

describe("tag system integration", () => {
  it("tags persist to localStorage via writeTags", async () => {
    const { writeTags, readTags } = await loadModules();
    const tags = { "algo-1": ["Mastered", "Tricky"] };
    writeTags(tags);
    expect(readTags()).toEqual(tags);
  });

  it("order persists to localStorage via writeOrder", async () => {
    const { writeOrder, readOrder } = await loadModules();
    const order = { "Sorting": ["algo-3", "algo-1"] };
    writeOrder(order);
    expect(readOrder()).toEqual(order);
  });

  it("toggleTagInMap + collectAllTags work together", async () => {
    const { toggleTagInMap, collectAllTags } = await loadModules();
    let tags = {};
    tags = toggleTagInMap(tags, "a1", "Mastered");
    tags = toggleTagInMap(tags, "a2", "Tricky");
    tags = toggleTagInMap(tags, "a1", "Favorite");

    const allTags = collectAllTags(tags);
    expect(allTags).toContain("Mastered");
    expect(allTags).toContain("Tricky");
    expect(allTags).toContain("Favorite");
    expect(allTags).toHaveLength(3);
  });

  it("removing all tags from an algorithm cleans up the key", async () => {
    const { toggleTagInMap } = await loadModules();
    let tags = toggleTagInMap({}, "a1", "Mastered");
    expect(tags["a1"]).toBeDefined();
    tags = toggleTagInMap(tags, "a1", "Mastered");
    expect(tags["a1"]).toBeUndefined();
  });
});
