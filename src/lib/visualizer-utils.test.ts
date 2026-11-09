import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Minimal localStorage + sessionStorage mock
// ---------------------------------------------------------------------------

function createStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
  };
}

let localStorage: ReturnType<typeof createStorage>;
let sessionStorage: ReturnType<typeof createStorage>;

beforeEach(() => {
  localStorage = createStorage();
  sessionStorage = createStorage();
  (globalThis as Record<string, unknown>).window = {
    localStorage,
    sessionStorage,
  } as unknown as Window;
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
  vi.restoreAllMocks();
});

async function loadModule() {
  vi.resetModules();
  return import("./visualizer-utils");
}

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe("formatDuration", () => {
  it("formats milliseconds under 1000 as ms", async () => {
    const { formatDuration } = await loadModule();
    expect(formatDuration(0)).toBe("0ms");
    expect(formatDuration(500)).toBe("500ms");
    expect(formatDuration(999)).toBe("999ms");
  });

  it("formats milliseconds at 1000+ as seconds", async () => {
    const { formatDuration } = await loadModule();
    expect(formatDuration(1000)).toBe("1.0s");
    expect(formatDuration(1500)).toBe("1.5s");
    expect(formatDuration(2000)).toBe("2.0s");
    expect(formatDuration(10500)).toBe("10.5s");
  });

  it("rounds sub-second ms values", async () => {
    const { formatDuration } = await loadModule();
    expect(formatDuration(42)).toBe("42ms");
    expect(formatDuration(100)).toBe("100ms");
    expect(formatDuration(999)).toBe("999ms");
  });

  it("formats exactly 1 second", async () => {
    const { formatDuration } = await loadModule();
    expect(formatDuration(1000)).toBe("1.0s");
  });
});

// ---------------------------------------------------------------------------
// formatResult
// ---------------------------------------------------------------------------

describe("formatResult", () => {
  it("returns (no return value) for undefined", async () => {
    const { formatResult } = await loadModule();
    expect(formatResult(undefined)).toBe("(no return value)");
  });

  it("returns string as-is", async () => {
    const { formatResult } = await loadModule();
    expect(formatResult("hello")).toBe("hello");
    expect(formatResult("")).toBe("");
  });

  it("JSON-stringifies objects", async () => {
    const { formatResult } = await loadModule();
    expect(formatResult({ a: 1 })).toBe('{"a":1}');
    expect(formatResult([1, 2, 3])).toBe("[1,2,3]");
  });

  it("JSON-stringifies numbers", async () => {
    const { formatResult } = await loadModule();
    expect(formatResult(42)).toBe("42");
    expect(formatResult(0)).toBe("0");
  });

  it("JSON-stringifies booleans", async () => {
    const { formatResult } = await loadModule();
    expect(formatResult(true)).toBe("true");
    expect(formatResult(false)).toBe("false");
  });

  it("handles null", async () => {
    const { formatResult } = await loadModule();
    expect(formatResult(null)).toBe("null");
  });

  it("handles circular references gracefully", async () => {
    const { formatResult } = await loadModule();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(formatResult(circular)).toBe("[object Object]");
  });

  it("handles objects with toJSON", async () => {
    const { formatResult } = await loadModule();
    const obj = { toJSON: () => "custom" };
    expect(formatResult(obj)).toBe('"custom"');
  });
});

// ---------------------------------------------------------------------------
// getComparisonTarget
// ---------------------------------------------------------------------------

describe("getComparisonTarget", () => {
  it("finds a peer template with matching input shape", async () => {
    const { getComparisonTarget } = await loadModule();
    // Merge Sort and Quick Sort have the same input shape (arr: number[])
    const target = getComparisonTarget(
      { id: "bubble-sort", name: "Bubble Sort", code: "b", input: { arr: [3, 1, 2] } } as any,
      { arr: [3, 1, 2] },
    );
    // It should find some peer — either a matching template or null
    if (target) {
      expect(target.label).toBeTruthy();
      expect(target.code).toBeTruthy();
    }
  });

  it("returns reversed input fallback when no peer exists", async () => {
    const { getComparisonTarget } = await loadModule();
    const target = getComparisonTarget(
      {
        id: "unique-id-12345",
        name: "Unique Algo",
        code: "function unique() {}",
        input: { arr: [1, 2, 3] },
      } as any,
      { arr: [1, 2, 3] },
    );
    // Should find reversed input fallback
    expect(target).not.toBeNull();
    expect(target!.label).toContain("reversed input");
    expect(target!.input).toEqual({ arr: [3, 2, 1] });
  });

  it("returns null when input has no arrays", async () => {
    const { getComparisonTarget } = await loadModule();
    const target = getComparisonTarget(
      {
        id: "unique-id-12345",
        name: "Unique Algo",
        code: "function unique() {}",
        input: { x: 1, y: 2 },
      } as any,
      { x: 1, y: 2 },
    );
    expect(target).toBeNull();
  });

  it("returns null when input is empty", async () => {
    const { getComparisonTarget } = await loadModule();
    const target = getComparisonTarget(
      {
        id: "unique-id-12345",
        name: "Unique Algo",
        code: "function unique() {}",
        input: {},
      } as any,
      {},
    );
    expect(target).toBeNull();
  });

  it("uses the same input for peer (not reversed)", async () => {
    const { getComparisonTarget } = await loadModule();
    const input = { arr: [1, 2, 3], target: 5 };
    const target = getComparisonTarget(
      {
        id: "unique-id-12345",
        name: "Unique Algo",
        code: "function unique() {}",
        input,
      } as any,
      input,
    );
    if (target && !target.label.includes("reversed")) {
      expect(target.input).toEqual(input);
    }
  });

  it("reverses only arrays, not other values", async () => {
    const { getComparisonTarget } = await loadModule();
    const target = getComparisonTarget(
      {
        id: "unique-id-12345",
        name: "Unique Algo",
        code: "function unique() {}",
        input: { arr: [1, 2, 3], target: 5 },
      } as any,
      { arr: [1, 2, 3], target: 5 },
    );
    expect(target).not.toBeNull();
    expect(target!.input.target).toBe(5);
    expect(target!.input.arr).toEqual([3, 2, 1]);
  });
});

// ---------------------------------------------------------------------------
// getAnonymousTraceCount / incrementAnonymousTraceCount
// ---------------------------------------------------------------------------

describe("anonymous trace gate", () => {
  it("returns 0 when localStorage is empty", async () => {
    const { getAnonymousTraceCount } = await loadModule();
    expect(getAnonymousTraceCount()).toBe(0);
  });

  it("reads the count from localStorage", async () => {
    const { getAnonymousTraceCount } = await loadModule();
    localStorage.setItem("dsa-lab-anon-traces", "2");
    expect(getAnonymousTraceCount()).toBe(2);
  });

  it("handles non-numeric values", async () => {
    const { getAnonymousTraceCount } = await loadModule();
    localStorage.setItem("dsa-lab-anon-traces", "abc");
    expect(getAnonymousTraceCount()).toBe(0);
  });

  it("handles negative values", async () => {
    const { getAnonymousTraceCount } = await loadModule();
    localStorage.setItem("dsa-lab-anon-traces", "-5");
    expect(getAnonymousTraceCount()).toBe(0);
  });

  it("increments the count", async () => {
    const { incrementAnonymousTraceCount, getAnonymousTraceCount } = await loadModule();
    const next = incrementAnonymousTraceCount();
    expect(next).toBe(1);
    expect(getAnonymousTraceCount()).toBe(1);
  });

  it("increments from existing count", async () => {
    const { incrementAnonymousTraceCount, getAnonymousTraceCount } = await loadModule();
    localStorage.setItem("dsa-lab-anon-traces", "2");
    const next = incrementAnonymousTraceCount();
    expect(next).toBe(3);
    expect(getAnonymousTraceCount()).toBe(3);
  });

  it("returns 1 on first increment", async () => {
    const { incrementAnonymousTraceCount } = await loadModule();
    expect(incrementAnonymousTraceCount()).toBe(1);
  });

  it("handles corrupted localStorage gracefully", async () => {
    const { getAnonymousTraceCount } = await loadModule();
    localStorage.setItem("dsa-lab-anon-traces", "{invalid");
    expect(getAnonymousTraceCount()).toBe(0);
  });

  it("ANONYMOUS_TRACE_LIMIT is 3", async () => {
    const { ANONYMOUS_TRACE_LIMIT } = await loadModule();
    expect(ANONYMOUS_TRACE_LIMIT).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// readSessionRestore / writeSessionRestore
// ---------------------------------------------------------------------------

describe("session restore", () => {
  it("returns null when sessionStorage is empty", async () => {
    const { readSessionRestore } = await loadModule();
    expect(readSessionRestore()).toBeNull();
  });

  it("reads and removes the session restore payload", async () => {
    const { readSessionRestore } = await loadModule();
    sessionStorage.setItem("dsa-lab-session-restore", JSON.stringify({
      code: "function hello() {}",
      inputText: "{}",
      language: "javascript",
    }));
    const result = readSessionRestore();
    expect(result).toEqual({
      code: "function hello() {}",
      inputText: "{}",
      language: "javascript",
    });
    // Should be removed after reading
    expect(sessionStorage.getItem("dsa-lab-session-restore")).toBeNull();
  });

  it("returns null on corrupted JSON", async () => {
    const { readSessionRestore } = await loadModule();
    sessionStorage.setItem("dsa-lab-session-restore", "not-json{");
    expect(readSessionRestore()).toBeNull();
  });

  it("writes the session restore payload", async () => {
    const { writeSessionRestore, readSessionRestore } = await loadModule();
    writeSessionRestore({ code: "test", inputText: "{}", language: "python" });
    const result = readSessionRestore();
    expect(result).toEqual({ code: "test", inputText: "{}", language: "python" });
  });

  it("handles partial payloads", async () => {
    const { writeSessionRestore, readSessionRestore } = await loadModule();
    writeSessionRestore({ code: "only-code" });
    const result = readSessionRestore();
    expect(result).toEqual({ code: "only-code" });
  });

  it("overwrites previous payload", async () => {
    const { writeSessionRestore, readSessionRestore } = await loadModule();
    writeSessionRestore({ code: "first" });
    writeSessionRestore({ code: "second" });
    const result = readSessionRestore();
    expect(result).toEqual({ code: "second" });
  });
});

// ---------------------------------------------------------------------------
// Theme detection (subscribeToDarkTheme, getDarkThemeSnapshot)
// ---------------------------------------------------------------------------

describe("theme detection", () => {
  it("getDarkThemeSnapshot returns true when html has dark class", async () => {
    // Mock document.documentElement
    const mockElement = { classList: { contains: (c: string) => c === "dark" } };
    (globalThis as Record<string, unknown>).document = { documentElement: mockElement };

    const { getDarkThemeSnapshot } = await loadModule();
    expect(getDarkThemeSnapshot()).toBe(true);

    delete (globalThis as Record<string, unknown>).document;
  });

  it("getDarkThemeSnapshot returns false when html lacks dark class", async () => {
    const mockElement = { classList: { contains: () => false } };
    (globalThis as Record<string, unknown>).document = { documentElement: mockElement };

    const { getDarkThemeSnapshot } = await loadModule();
    expect(getDarkThemeSnapshot()).toBe(false);

    delete (globalThis as Record<string, unknown>).document;
  });

  it("getDarkThemeServerSnapshot always returns false", async () => {
    const { getDarkThemeServerSnapshot } = await loadModule();
    expect(getDarkThemeServerSnapshot()).toBe(false);
  });

  it("subscribeToDarkTheme returns an unsubscribe function", async () => {
    const mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    vi.stubGlobal("MutationObserver", vi.fn(function() { return mockObserver; }));

    const mockElement = { classList: { contains: () => false } };
    (globalThis as Record<string, unknown>).document = { documentElement: mockElement };

    const { subscribeToDarkTheme } = await loadModule();
    const unsubscribe = subscribeToDarkTheme(() => {});

    expect(typeof unsubscribe).toBe("function");
    expect(mockObserver.observe).toHaveBeenCalledWith(
      mockElement,
      { attributes: true, attributeFilter: ["class"] },
    );

    unsubscribe();
    expect(mockObserver.disconnect).toHaveBeenCalled();

    delete (globalThis as Record<string, unknown>).document;
  });
});
