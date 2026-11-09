import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Minimal localStorage mock
// ---------------------------------------------------------------------------

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
  };
}

let ls: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  ls = createLocalStorageMock();
  (globalThis as Record<string, unknown>).window = {
    localStorage: ls,
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  } as unknown as Window;
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
  vi.restoreAllMocks();
});

async function loadModule() {
  vi.resetModules();
  return import("./prefs");
}

// ---------------------------------------------------------------------------
// getAutoPlayAfterRun
// ---------------------------------------------------------------------------

describe("getAutoPlayAfterRun", () => {
  it("defaults to true when localStorage is empty", async () => {
    const { getAutoPlayAfterRun } = await loadModule();
    expect(getAutoPlayAfterRun()).toBe(true);
  });

  it("returns false when stored as 'false'", async () => {
    ls.setItem("dsa.autoPlayAfterRun", "false");
    const { getAutoPlayAfterRun } = await loadModule();
    expect(getAutoPlayAfterRun()).toBe(false);
  });

  it("returns true when stored as 'true'", async () => {
    ls.setItem("dsa.autoPlayAfterRun", "true");
    const { getAutoPlayAfterRun } = await loadModule();
    expect(getAutoPlayAfterRun()).toBe(true);
  });

  it("returns true for any non-'false' value", async () => {
    ls.setItem("dsa.autoPlayAfterRun", "something-else");
    const { getAutoPlayAfterRun } = await loadModule();
    expect(getAutoPlayAfterRun()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// setAutoPlayAfterRun
// ---------------------------------------------------------------------------

describe("setAutoPlayAfterRun", () => {
  it("persists false to localStorage", async () => {
    const { setAutoPlayAfterRun } = await loadModule();
    setAutoPlayAfterRun(false);
    expect(ls.getItem("dsa.autoPlayAfterRun")).toBe("false");
  });

  it("persists true to localStorage", async () => {
    const { setAutoPlayAfterRun } = await loadModule();
    setAutoPlayAfterRun(true);
    expect(ls.getItem("dsa.autoPlayAfterRun")).toBe("true");
  });

  it("toggles the value", async () => {
    const { getAutoPlayAfterRun, setAutoPlayAfterRun } = await loadModule();
    expect(getAutoPlayAfterRun()).toBe(true);
    setAutoPlayAfterRun(false);
    expect(getAutoPlayAfterRun()).toBe(false);
    setAutoPlayAfterRun(true);
    expect(getAutoPlayAfterRun()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useAutoPlayAfterRun (smoke test — just verify it exports)
// ---------------------------------------------------------------------------

describe("useAutoPlayAfterRun", () => {
  it("exports a function", async () => {
    const { useAutoPlayAfterRun } = await loadModule();
    expect(typeof useAutoPlayAfterRun).toBe("function");
  });
});
