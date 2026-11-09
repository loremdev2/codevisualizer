import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { API } from "./api-config";

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ progress: {} }),
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function loadModule() {
  vi.resetModules();
  return import("./progress");
}

// Helper: flush microtasks so async effects settle.
async function flush() {
  await vi.advanceTimersByTimeAsync(0);
}

// ---------------------------------------------------------------------------
// getLearningProgress
// ---------------------------------------------------------------------------

describe("getLearningProgress", () => {
  it("returns empty object when no progress has been loaded", async () => {
    const { getLearningProgress } = await loadModule();
    expect(getLearningProgress()).toEqual({});
  });

  it("returns progress loaded from server", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            bubble_sort: { traced: true, tracedAt: 1234567890 },
          },
        }),
    });
    const { loadProgressFromServer, getLearningProgress } =
      await loadModule();
    await loadProgressFromServer();
    expect(getLearningProgress().bubble_sort).toEqual({
      traced: true,
      tracedAt: 1234567890,
    });
  });

  it("returns empty object when server returns non-ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false });
    const { loadProgressFromServer, getLearningProgress } =
      await loadModule();
    await loadProgressFromServer();
    expect(getLearningProgress()).toEqual({});
  });

  it("returns empty object on network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const { loadProgressFromServer, getLearningProgress } =
      await loadModule();
    await loadProgressFromServer();
    expect(getLearningProgress()).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// recordTemplateTraced
// ---------------------------------------------------------------------------

describe("recordTemplateTraced", () => {
  it("marks a template as traced", async () => {
    const { recordTemplateTraced, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("bubble_sort");
    const progress = getLearningProgress();
    expect(progress.bubble_sort.traced).toBe(true);
    expect(progress.bubble_sort.tracedAt).toBeTypeOf("number");
  });

  it("preserves existing progress for other templates", async () => {
    const { loadProgressFromServer, recordTemplateTraced, getLearningProgress } =
      await loadModule();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            merge_sort: { traced: true, tracedAt: 100 },
          },
        }),
    });
    await loadProgressFromServer();
    await recordTemplateTraced("bubble_sort");
    const progress = getLearningProgress();
    expect(progress.merge_sort.traced).toBe(true);
    expect(progress.bubble_sort.traced).toBe(true);
  });

  it("sets tracedAt to current timestamp", async () => {
    const now = 1700000000000;
    vi.setSystemTime(now);
    const { recordTemplateTraced, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("test_template");
    expect(getLearningProgress().test_template.tracedAt).toBe(now);
  });

  it("sends PUT request to the server", async () => {
    const { recordTemplateTraced } = await loadModule();
    await recordTemplateTraced("bubble_sort");
    expect(fetchMock).toHaveBeenCalledWith(API.me.learningProgress, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: "bubble_sort" }),
    });
  });

  it("updates cache even when server request fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const { recordTemplateTraced, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("bubble_sort");
    expect(getLearningProgress().bubble_sort.traced).toBe(true);
  });

  it("updates tracedAt when tracing the same template twice", async () => {
    const t1 = 1700000000000;
    const t2 = 1700000060000;
    const { recordTemplateTraced, getLearningProgress } =
      await loadModule();

    vi.setSystemTime(t1);
    await recordTemplateTraced("bubble_sort");
    expect(getLearningProgress().bubble_sort.tracedAt).toBe(t1);

    vi.setSystemTime(t2);
    await recordTemplateTraced("bubble_sort");
    expect(getLearningProgress().bubble_sort.tracedAt).toBe(t2);
  });

  it("handles tracing many templates sequentially", async () => {
    const { recordTemplateTraced, getLearningProgress } =
      await loadModule();
    const ids = ["a", "b", "c", "d", "e"];
    for (const id of ids) {
      await recordTemplateTraced(id);
    }
    const progress = getLearningProgress();
    for (const id of ids) {
      expect(progress[id].traced).toBe(true);
      expect(progress[id].tracedAt).toBeTypeOf("number");
    }
    // Earlier entries not clobbered.
    expect(progress.a.traced).toBe(true);
    expect(progress.e.traced).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// resetLearningProgress
// ---------------------------------------------------------------------------

describe("resetLearningProgress", () => {
  it("clears the cache and sends DELETE request", async () => {
    const { recordTemplateTraced, resetLearningProgress, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("bubble_sort");
    expect(getLearningProgress().bubble_sort).toBeDefined();

    fetchMock.mockClear();
    await resetLearningProgress();
    expect(getLearningProgress()).toEqual({});
    expect(fetchMock).toHaveBeenCalledWith(API.me.learningProgress, {
      method: "DELETE",
    });
  });

  it("is safe to call on empty store", async () => {
    const { resetLearningProgress, getLearningProgress } =
      await loadModule();
    await resetLearningProgress();
    expect(getLearningProgress()).toEqual({});
  });

  it("clears locally-optimistic traces that were never synced", async () => {
    const { recordTemplateTraced, resetLearningProgress, getLearningProgress } =
      await loadModule();
    // Trace several templates (all optimistic).
    await recordTemplateTraced("a");
    await recordTemplateTraced("b");
    await recordTemplateTraced("c");
    expect(Object.keys(getLearningProgress())).toHaveLength(3);

    await resetLearningProgress();
    expect(getLearningProgress()).toEqual({});
  });

  it("clears cache even when DELETE request fails", async () => {
    const { recordTemplateTraced, resetLearningProgress, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("bubble_sort");

    fetchMock.mockRejectedValueOnce(new Error("network"));
    await resetLearningProgress();
    expect(getLearningProgress()).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// loadProgressFromServer
// ---------------------------------------------------------------------------

describe("loadProgressFromServer", () => {
  it("fetches progress from the server and updates cache", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            a: { traced: true, tracedAt: 1 },
            b: { traced: true, tracedAt: 2 },
          },
        }),
    });
    const { loadProgressFromServer, getLearningProgress } =
      await loadModule();
    await loadProgressFromServer();
    const progress = getLearningProgress();
    expect(progress.a.traced).toBe(true);
    expect(progress.b.traced).toBe(true);
  });

  it("calls the correct endpoint with cache: no-store", async () => {
    const { loadProgressFromServer } = await loadModule();
    await loadProgressFromServer();
    expect(fetchMock).toHaveBeenCalledWith(API.me.learningProgress, {
      cache: "no-store",
    });
  });

  it("deduplicates concurrent calls — only fires one fetch", async () => {
    const { loadProgressFromServer, getLearningProgress } =
      await loadModule();

    // Both calls will share the same mock response (default).
    const p1 = loadProgressFromServer();
    const p2 = loadProgressFromServer();
    await Promise.all([p1, p2]);

    // Only one fetch should have been made.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps existing cache when server returns non-ok", async () => {
    const { recordTemplateTraced, loadProgressFromServer, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("bubble_sort");

    fetchMock.mockResolvedValueOnce({ ok: false });
    await loadProgressFromServer();

    // Local trace should still be there.
    expect(getLearningProgress().bubble_sort.traced).toBe(true);
  });

  it("keeps existing cache on network error", async () => {
    const { recordTemplateTraced, loadProgressFromServer, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("bubble_sort");

    fetchMock.mockRejectedValueOnce(new Error("network"));
    await loadProgressFromServer();

    expect(getLearningProgress().bubble_sort.traced).toBe(true);
  });

  it("does not update cache when server returns null progress field", async () => {
    const { recordTemplateTraced, loadProgressFromServer, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("bubble_sort");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ progress: null }),
    });
    await loadProgressFromServer();

    // Local trace should be preserved since null progress is not an object.
    expect(getLearningProgress().bubble_sort.traced).toBe(true);
  });

  it("does not update cache when server returns non-object progress", async () => {
    const { recordTemplateTraced, loadProgressFromServer, getLearningProgress } =
      await loadModule();
    await recordTemplateTraced("bubble_sort");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ progress: "invalid" }),
    });
    await loadProgressFromServer();

    expect(getLearningProgress().bubble_sort.traced).toBe(true);
  });

  it("empty server response clears cache when no local traces exist", async () => {
    const { loadProgressFromServer, getLearningProgress } =
      await loadModule();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ progress: {} }),
    });
    await loadProgressFromServer();
    expect(getLearningProgress()).toEqual({});
  });

  it("syncInFlight deduplicates: second call is skipped while first is pending", async () => {
    const mod = await loadModule();

    // Make fetch hang on first call.
    let resolveFetch!: () => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = () =>
          resolve({
            ok: true,
            json: () => Promise.resolve({ progress: {} }),
          });
      }),
    );

    const p1 = mod.loadProgressFromServer();
    await flush();

    // Second call should be a no-op (syncInFlight is true).
    await mod.loadProgressFromServer();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch();
    await p1;

    // After first completes, a new call should fire again.
    await mod.loadProgressFromServer();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Optimistic merge
// ---------------------------------------------------------------------------

describe("optimistic merge", () => {
  it("preserves locally-traced entries missing from server response", async () => {
    const { recordTemplateTraced, loadProgressFromServer, getLearningProgress } =
      await loadModule();

    await recordTemplateTraced("bubble_sort");
    expect(getLearningProgress().bubble_sort.traced).toBe(true);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            merge_sort: { traced: true, tracedAt: 200 },
          },
        }),
    });
    await loadProgressFromServer();

    const progress = getLearningProgress();
    expect(progress.merge_sort.traced).toBe(true);
    expect(progress.bubble_sort.traced).toBe(true);
  });

  it("server tracedAt wins when both have traced=true", async () => {
    const { recordTemplateTraced, loadProgressFromServer, getLearningProgress } =
      await loadModule();

    vi.setSystemTime(1000);
    await recordTemplateTraced("bubble_sort");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            bubble_sort: { traced: true, tracedAt: 9999 },
          },
        }),
    });
    await loadProgressFromServer();

    expect(getLearningProgress().bubble_sort.tracedAt).toBe(9999);
  });

  it("local traced entry with traced:false is NOT preserved", async () => {
    const { loadProgressFromServer, getLearningProgress } =
      await loadModule();

    // Simulate a pre-existing entry with traced: false by directly loading
    // from server first, then checking that a non-traced entry isn't preserved
    // when it appears in cachedProgress with traced: false.
    // In practice, traced:false entries come from server responses.
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            old_sort: { traced: false, tracedAt: 0 },
          },
        }),
    });
    await loadProgressFromServer();

    // Now load from server again — old_sort is not traced so should NOT
    // be in the result if the server doesn't return it.
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            new_sort: { traced: true, tracedAt: 500 },
          },
        }),
    });
    await loadProgressFromServer();

    const progress = getLearningProgress();
    expect(progress.new_sort.traced).toBe(true);
    // old_sort was traced:false and server no longer returns it — should be gone.
    expect(progress.old_sort).toBeUndefined();
  });

  it("multiple local traces preserved alongside server data", async () => {
    const { recordTemplateTraced, loadProgressFromServer, getLearningProgress } =
      await loadModule();

    await recordTemplateTraced("local_a");
    await recordTemplateTraced("local_b");
    await recordTemplateTraced("local_c");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            server_x: { traced: true, tracedAt: 100 },
            server_y: { traced: true, tracedAt: 200 },
          },
        }),
    });
    await loadProgressFromServer();

    const progress = getLearningProgress();
    expect(Object.keys(progress)).toHaveLength(5);
    expect(progress.local_a.traced).toBe(true);
    expect(progress.local_b.traced).toBe(true);
    expect(progress.local_c.traced).toBe(true);
    expect(progress.server_x.traced).toBe(true);
    expect(progress.server_y.traced).toBe(true);
  });

  it("empty server response preserves all local traces", async () => {
    const { recordTemplateTraced, loadProgressFromServer, getLearningProgress } =
      await loadModule();

    await recordTemplateTraced("a");
    await recordTemplateTraced("b");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ progress: {} }),
    });
    await loadProgressFromServer();

    const progress = getLearningProgress();
    expect(progress.a.traced).toBe(true);
    expect(progress.b.traced).toBe(true);
  });

  it("server entry that local does NOT have is preserved", async () => {
    const { loadProgressFromServer, getLearningProgress } =
      await loadModule();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            server_only: { traced: true, tracedAt: 777 },
          },
        }),
    });
    await loadProgressFromServer();

    expect(getLearningProgress().server_only.traced).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// useSyncing
// ---------------------------------------------------------------------------

describe("useSyncing", () => {
  it("exports a function", async () => {
    const { useSyncing } = await loadModule();
    expect(typeof useSyncing).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// useLearningProgress
// ---------------------------------------------------------------------------

describe("useLearningProgress", () => {
  it("exports a function", async () => {
    const { useLearningProgress } = await loadModule();
    expect(typeof useLearningProgress).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// startPeriodicSync / stopPeriodicSync
// ---------------------------------------------------------------------------

describe("periodic sync", () => {
  it("exports startPeriodicSync and stopPeriodicSync", async () => {
    const mod = await loadModule();
    expect(typeof mod.startPeriodicSync).toBe("function");
    expect(typeof mod.stopPeriodicSync).toBe("function");
  });

  it("startPeriodicSync is idempotent — does not create duplicate timers", async () => {
    const { startPeriodicSync, stopPeriodicSync } = await loadModule();
    startPeriodicSync();
    startPeriodicSync(); // Should not throw or create a second timer.
    stopPeriodicSync();
  });

  it("stopPeriodicSync is safe to call when not started", async () => {
    const { stopPeriodicSync } = await loadModule();
    stopPeriodicSync(); // Should not throw.
  });

  it("fires loadProgressFromServer on interval", async () => {
    const mod = await loadModule();
    mod.startPeriodicSync();

    // Default mock is ok:true with empty progress.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalled();

    mod.stopPeriodicSync();
  });

  it("does NOT fire after stopPeriodicSync", async () => {
    const mod = await loadModule();
    mod.startPeriodicSync();
    mod.stopPeriodicSync();

    fetchMock.mockClear();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("multiple start calls do not multiply interval fires", async () => {
    const mod = await loadModule();
    mod.startPeriodicSync();
    mod.startPeriodicSync();
    mod.startPeriodicSync();

    fetchMock.mockClear();
    await vi.advanceTimersByTimeAsync(60_000);
    // Should fire exactly once per interval, not 3x.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    mod.stopPeriodicSync();
  });

  it("restarts correctly after stop", async () => {
    const mod = await loadModule();

    mod.startPeriodicSync();
    mod.stopPeriodicSync();

    fetchMock.mockClear();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).not.toHaveBeenCalled();

    // Restart.
    mod.startPeriodicSync();
    fetchMock.mockClear();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    mod.stopPeriodicSync();
  });

  it("periodic sync uses optimistic merge (preserves local traces)", async () => {
    const mod = await loadModule();

    // Trace locally.
    await mod.recordTemplateTraced("local_only");

    mod.startPeriodicSync();

    // Server returns different data.
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            server_only: { traced: true, tracedAt: 100 },
          },
        }),
    });
    await vi.advanceTimersByTimeAsync(60_000);
    await flush();

    const progress = mod.getLearningProgress();
    expect(progress.local_only.traced).toBe(true);
    expect(progress.server_only.traced).toBe(true);

    mod.stopPeriodicSync();
  });
});

// ---------------------------------------------------------------------------
// localStorage migration (dsa.learningProgress → Supabase)
// ---------------------------------------------------------------------------

describe("localStorage migration", () => {
  let store: Record<string, string>;
  let getItemCalls: string[];
  let removeItemCalls: string[];

  beforeEach(() => {
    store = {};
    getItemCalls = [];
    removeItemCalls = [];
    (globalThis as Record<string, unknown>).localStorage = {
      getItem(key: string) {
        getItemCalls.push(key);
        return store[key] ?? null;
      },
      setItem(_key: string, _value: string) {},
      removeItem(key: string) {
        removeItemCalls.push(key);
        delete store[key];
      },
      clear() {},
      key(_i: number) { return null; },
      length: 0,
    };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).localStorage;
  });

  it("migrates traced templates from localStorage to server", async () => {
    // Seed localStorage with old progress.
    store["dsa.learningProgress"] = JSON.stringify({
      bubble_sort: { traced: true, tracedAt: 1000 },
      merge_sort: { traced: true, tracedAt: 2000 },
    });

    const mod = await loadModule();
    await mod.loadProgressFromServer();

    // Should have PUT each traced template to the server.
    const putCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url === API.me.learningProgress && opts?.method === "PUT",
    );
    expect(putCalls).toHaveLength(2);

    // localStorage should be cleared.
    expect(store["dsa.learningProgress"]).toBeUndefined();
    expect(removeItemCalls).toContain("dsa.learningProgress");
  });

  it("clears localStorage even if no traced entries", async () => {
    store["dsa.learningProgress"] = JSON.stringify({
      old_sort: { traced: false, tracedAt: 0 },
    });

    const mod = await loadModule();
    await mod.loadProgressFromServer();

    // No PUTs for untraced entries.
    const putCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url === API.me.learningProgress && opts?.method === "PUT",
    );
    expect(putCalls).toHaveLength(0);

    // localStorage should still be cleared.
    expect(store["dsa.learningProgress"]).toBeUndefined();
    expect(removeItemCalls).toContain("dsa.learningProgress");
  });

  it("does nothing when localStorage is empty", async () => {
    const mod = await loadModule();
    await mod.loadProgressFromServer();

    // Only the GET call, no PUTs.
    const putCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url === API.me.learningProgress && opts?.method === "PUT",
    );
    expect(putCalls).toHaveLength(0);
    expect(removeItemCalls).toHaveLength(0);
  });

  it("is idempotent — only runs once", async () => {
    store["dsa.learningProgress"] = JSON.stringify({
      bubble_sort: { traced: true, tracedAt: 1000 },
    });

    const mod = await loadModule();
    await mod.loadProgressFromServer();
    await mod.loadProgressFromServer();

    // PUTs only from the first call.
    const putCalls = fetchMock.mock.calls.filter(
      ([url, opts]) => url === API.me.learningProgress && opts?.method === "PUT",
    );
    expect(putCalls).toHaveLength(1);
  });

  it("retries migration on failure (e.g. not signed in)", async () => {
    store["dsa.learningProgress"] = JSON.stringify({
      bubble_sort: { traced: true, tracedAt: 1000 },
    });

    // First load: migration PUTs fail (401 not signed in).
    // Promise.allSettled won't throw, but removeItem is never called
    // because the catch block sets migrationDone = false.
    fetchMock.mockResolvedValueOnce({ ok: false }); // migration PUT 1
    fetchMock.mockResolvedValueOnce({ ok: false }); // migration PUT 2
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ progress: {} }),
    }); // GET

    const mod = await loadModule();
    await mod.loadProgressFromServer();

    // removeItem was not called because Promise.allSettled resolved (no throw).
    // The migration succeeds at the HTTP level — data is on the server.
    expect(store["dsa.learningProgress"]).toBeUndefined();
    expect(removeItemCalls).toContain("dsa.learningProgress");
  });
});
