import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// We need a fresh module for each test group so module-level state
// (cachedSolved, syncInFlight, pendingToggles) resets cleanly.
// ---------------------------------------------------------------------------

const SOLVED_KEY = "dsa.top150Solved";
const SOLVED_EVENT = "dsa-top150-solved";

// Minimal localStorage mock backed by a plain Map.
function createLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
}

let localStorage: ReturnType<typeof createLocalStorage>;
let dispatchedEvents: string[];
const eventListeners = new Map<string, Set<EventListener>>();

beforeEach(() => {
  localStorage = createLocalStorage();
  dispatchedEvents = [];
  eventListeners.clear();

  // Set up window mock directly on globalThis so it survives vi.resetModules().
  (globalThis as Record<string, unknown>).window = {
    localStorage,
    dispatchEvent: (event: Event) => {
      dispatchedEvents.push(event.type);
      const listeners = eventListeners.get(event.type);
      if (listeners) {
        for (const listener of listeners) {
          listener(event);
        }
      }
      return true;
    },
    addEventListener: (type: string, listener: EventListener) => {
      if (!eventListeners.has(type)) eventListeners.set(type, new Set());
      eventListeners.get(type)!.add(listener);
    },
    removeEventListener: (type: string, listener: EventListener) => {
      eventListeners.get(type)?.delete(listener);
    },
  } as unknown as Window;
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window;
  vi.restoreAllMocks();
});

// Helper: import the module fresh so module-level state resets.
async function loadModule() {
  vi.resetModules();
  return import("./top150-status");
}

// ---------------------------------------------------------------------------
// localStorage toggle / reset
// ---------------------------------------------------------------------------

describe("toggleTop150Solved", () => {
  it("adds a question number to localStorage", async () => {
    const { toggleTop150Solved } = await loadModule();
    toggleTop150Solved(88);

    const raw = localStorage.getItem(SOLVED_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual([88]);
  });

  it("removes a question number when toggled twice", async () => {
    // First toggle: add.
    const mod1 = await loadModule();
    mod1.toggleTop150Solved(88);
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([88]);

    // Second toggle: remove (fresh module to reset cachedSolved).
    const mod2 = await loadModule();
    mod2.toggleTop150Solved(88);
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([]);
  });

  it("stores multiple questions sorted numerically", async () => {
    // Add 200, then 1, then 88 — each with a fresh module.
    const mod1 = await loadModule();
    mod1.toggleTop150Solved(200);
    const mod2 = await loadModule();
    mod2.toggleTop150Solved(1);
    const mod3 = await loadModule();
    mod3.toggleTop150Solved(88);

    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([1, 88, 200]);
  });

  it("dispatches a SOLVED_EVENT after each toggle", async () => {
    const { toggleTop150Solved } = await loadModule();
    dispatchedEvents.length = 0;

    toggleTop150Solved(88);
    expect(dispatchedEvents).toContain(SOLVED_EVENT);
  });
});

describe("resetTop150Solved", () => {
  it("removes the solved key from localStorage", async () => {
    const { toggleTop150Solved, resetTop150Solved } = await loadModule();
    toggleTop150Solved(88);
    resetTop150Solved();

    expect(localStorage.getItem(SOLVED_KEY)).toBeNull();
  });

  it("dispatches a SOLVED_EVENT", async () => {
    const { resetTop150Solved } = await loadModule();
    dispatchedEvents.length = 0;

    resetTop150Solved();
    expect(dispatchedEvents).toContain(SOLVED_EVENT);
  });

  it("is safe to call on an empty store", async () => {
    const { resetTop150Solved } = await loadModule();
    // Should not throw.
    resetTop150Solved();
    expect(localStorage.getItem(SOLVED_KEY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// loadSolvedFromServer — fetch mock
// ---------------------------------------------------------------------------

describe("loadSolvedFromServer", () => {
  it("union-merges server set with localStorage", async () => {
    // Pre-populate localStorage with question 1.
    localStorage.setItem(SOLVED_KEY, JSON.stringify([1]));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ solved: [88, 200] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadSolvedFromServer } = await loadModule();
    await loadSolvedFromServer();

    const raw = localStorage.getItem(SOLVED_KEY);
    const solved = JSON.parse(raw!) as number[];
    expect(solved).toEqual([1, 88, 200]);
  });

  it("calls GET /api/me/solved-questions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ solved: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadSolvedFromServer } = await loadModule();
    await loadSolvedFromServer();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/me/solved-questions"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("silently skips on non-OK response", async () => {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([1]));

    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    vi.stubGlobal("fetch", fetchMock);

    const { loadSolvedFromServer } = await loadModule();
    await loadSolvedFromServer();

    // localStorage should be unchanged.
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([1]);
  });

  it("silently skips on network error", async () => {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([1]));

    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    const { loadSolvedFromServer } = await loadModule();
    await loadSolvedFromServer();

    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([1]);
  });

  it("handles server returning empty/missing solved array", async () => {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([1]));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadSolvedFromServer } = await loadModule();
    await loadSolvedFromServer();

    // localStorage should be unchanged when server returns no solved array.
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([1]);
  });
});

// ---------------------------------------------------------------------------
// pushSolvedToggleToServer — fetch mock
// ---------------------------------------------------------------------------

describe("pushSolvedToggleToServer", () => {
  it("calls PUT with the question number", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ solved: [88] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();
    await pushSolvedToggleToServer(88);

    expect(fetchMock).toHaveBeenCalledWith("/api/me/solved-questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_no: 88, bank: "top150" }),
    });
  });

  it("replaces localStorage with the server response", async () => {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([1]));

    // Server response is authoritative — it replaces localStorage entirely.
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ solved: [88] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();
    await pushSolvedToggleToServer(88);

    // Server set is union-merged with local set — local entry [1] is preserved.
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([1, 88]);
  });

  it("silently returns on non-OK response", async () => {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([1]));

    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();
    await pushSolvedToggleToServer(88);

    // localStorage unchanged.
    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([1]);
  });

  it("silently returns on network error", async () => {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([1]));

    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();
    await pushSolvedToggleToServer(88);

    expect(JSON.parse(localStorage.getItem(SOLVED_KEY)!)).toEqual([1]);
  });

  it("deduplicates rapid toggles for the same question", async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount += 1;
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: () => Promise.resolve({ solved: [88] }),
            }),
          50,
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();

    // Fire two rapid toggles for the same question.
    await Promise.all([
      pushSolvedToggleToServer(88),
      pushSolvedToggleToServer(88),
    ]);

    // Only one PUT should have been made.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(callCount).toBe(1);
  });

  it("allows toggles for different questions concurrently", async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ solved: [] }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();
    await Promise.all([
      pushSolvedToggleToServer(88),
      pushSolvedToggleToServer(200),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// resetSolvedOnServer — fetch mock
// ---------------------------------------------------------------------------

describe("resetSolvedOnServer", () => {
  it("calls DELETE /api/me/solved-questions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const { resetSolvedOnServer } = await loadModule();
    await resetSolvedOnServer();

    expect(fetchMock).toHaveBeenCalledWith("/api/me/solved-questions?bank=top150", {
      method: "DELETE",
    });
  });

  it("does not throw on network error", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    const { resetSolvedOnServer } = await loadModule();
    await expect(resetSolvedOnServer()).resolves.toBeUndefined();
  });

  it("passes bank parameter to DELETE URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const { resetSolvedOnServer } = await loadModule();
    await resetSolvedOnServer("neetcode");

    expect(fetchMock).toHaveBeenCalledWith("/api/me/solved-questions?bank=neetcode", {
      method: "DELETE",
    });
  });
});

// ---------------------------------------------------------------------------
// pushSolvedToggleToServer — bank parameter
// ---------------------------------------------------------------------------

describe("pushSolvedToggleToServer bank parameter", () => {
  it("sends bank in the PUT body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ solved: [42] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();
    await pushSolvedToggleToServer(42, "neetcode");

    expect(fetchMock).toHaveBeenCalledWith("/api/me/solved-questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_no: 42, bank: "neetcode" }),
    });
  });

  it("defaults to top150 when bank is omitted", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ solved: [88] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();
    await pushSolvedToggleToServer(88);

    expect(fetchMock).toHaveBeenCalledWith("/api/me/solved-questions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_no: 88, bank: "top150" }),
    });
  });

  it("queues failed toggles for offline retry", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    const { pushSolvedToggleToServer } = await loadModule();
    await pushSolvedToggleToServer(88, "neetcode");

    // The pending queue should contain the failed toggle.
    const queue = JSON.parse(localStorage.getItem("dsa.pendingServerToggles") || "[]");
    expect(queue).toEqual([
      { question_no: 88, bank: "neetcode", timestamp: expect.any(Number) },
    ]);
  });
});

// ---------------------------------------------------------------------------
// loadSolvedFromServer — bank-scoped fetches
// ---------------------------------------------------------------------------

describe("loadSolvedFromServer bank-scoped", () => {
  it("fetches both top150 and neetcode banks", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("bank=neetcode")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ solved: [42, 100] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ solved: [1, 88] }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { loadSolvedFromServer } = await loadModule();
    await loadSolvedFromServer();

    // Both banks should be merged into localStorage.
    const raw = localStorage.getItem(SOLVED_KEY);
    const solved = JSON.parse(raw!) as number[];
    expect(solved).toEqual([1, 42, 88, 100]);

    // Both banks should have been fetched.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// useSyncState — basic smoke test
// ---------------------------------------------------------------------------

describe("useSyncState", () => {
  it("exports a function", async () => {
    const { useSyncState } = await loadModule();
    expect(typeof useSyncState).toBe("function");
  });
});
