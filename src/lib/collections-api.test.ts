import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { API } from "./api-config";

// ---------------------------------------------------------------------------
// Import the module
// ---------------------------------------------------------------------------

// We need to mock `fetch` before importing the module.
// Since the module uses `fetch` at call time (not import time), we can stub it.

async function loadModule() {
  vi.resetModules();
  return import("./collections-api");
}

// ---------------------------------------------------------------------------
// fetchCollectionsApi
// ---------------------------------------------------------------------------

describe("fetchCollectionsApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns algorithms on success", async () => {
    const algorithms = [
      { id: "1", title: "Merge Sort", topic: "Sorting", code: "function merge() {}", input_data: null },
    ];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ algorithms }),
    } as Response);

    const { fetchCollectionsApi } = await loadModule();
    const result = await fetchCollectionsApi();

    expect(result).toEqual(algorithms);
    expect(fetch).toHaveBeenCalledWith(API.me.savedAlgorithms, { cache: "no-store" });
  });

  it("returns empty array on non-OK response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "unauthorized" }),
    } as Response);

    const { fetchCollectionsApi } = await loadModule();
    const result = await fetchCollectionsApi();

    expect(result).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network"));

    const { fetchCollectionsApi } = await loadModule();
    const result = await fetchCollectionsApi();

    expect(result).toEqual([]);
  });

  it("returns empty array when json() rejects", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error("bad json")),
    } as Response);

    const { fetchCollectionsApi } = await loadModule();
    const result = await fetchCollectionsApi();

    expect(result).toEqual([]);
  });

  it("returns empty array when response has no algorithms key", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);

    const { fetchCollectionsApi } = await loadModule();
    const result = await fetchCollectionsApi();

    expect(result).toEqual([]);
  });

  it("returns empty array when algorithms is undefined", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ algorithms: undefined }),
    } as Response);

    const { fetchCollectionsApi } = await loadModule();
    const result = await fetchCollectionsApi();

    expect(result).toEqual([]);
  });

  it("returns multiple algorithms", async () => {
    const algorithms = [
      { id: "1", title: "Merge Sort", topic: "Sorting", code: "function merge() {}", input_data: null },
      { id: "2", title: "Binary Search", topic: "Search", code: "function bs() {}", input_data: [1, 2, 3] },
    ];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ algorithms }),
    } as Response);

    const { fetchCollectionsApi } = await loadModule();
    const result = await fetchCollectionsApi();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("2");
  });
});

// ---------------------------------------------------------------------------
// deleteAlgorithmApi
// ---------------------------------------------------------------------------

describe("deleteAlgorithmApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true on successful deletion", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const { deleteAlgorithmApi } = await loadModule();
    const result = await deleteAlgorithmApi("algo-1");

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(API.me.savedAlgorithm("algo-1"), { method: "DELETE" });
  });

  it("returns false on non-OK response", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);

    const { deleteAlgorithmApi } = await loadModule();
    const result = await deleteAlgorithmApi("algo-1");

    expect(result).toBe(false);
  });

  it("returns false on network error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network"));

    const { deleteAlgorithmApi } = await loadModule();
    const result = await deleteAlgorithmApi("algo-1");

    expect(result).toBe(false);
  });

  it("passes the correct URL with algorithm id", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const { deleteAlgorithmApi } = await loadModule();
    await deleteAlgorithmApi("test-id-123");

    expect(fetch).toHaveBeenCalledWith(API.me.savedAlgorithm("test-id-123"), { method: "DELETE" });
  });
});

// ---------------------------------------------------------------------------
// deleteMultipleApi
// ---------------------------------------------------------------------------

describe("deleteMultipleApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deletes all algorithms and returns their ids", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const { deleteMultipleApi } = await loadModule();
    const result = await deleteMultipleApi(["a1", "a2", "a3"]);

    expect(result).toEqual(new Set(["a1", "a2", "a3"]));
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("returns only successfully deleted ids", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    const { deleteMultipleApi } = await loadModule();
    const result = await deleteMultipleApi(["a1", "a2", "a3"]);

    expect(result).toEqual(new Set(["a1", "a3"]));
  });

  it("returns empty set when nothing is deleted", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const { deleteMultipleApi } = await loadModule();
    const result = await deleteMultipleApi(["a1", "a2"]);

    expect(result).toEqual(new Set());
  });

  it("handles empty input", async () => {
    const { deleteMultipleApi } = await loadModule();
    const result = await deleteMultipleApi([]);

    expect(result).toEqual(new Set());
    expect(fetch).not.toHaveBeenCalled();
  });

  it("handles network errors gracefully", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network"));

    const { deleteMultipleApi } = await loadModule();
    const result = await deleteMultipleApi(["a1", "a2"]);

    expect(result).toEqual(new Set());
  });

  it("makes concurrent requests", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const { deleteMultipleApi } = await loadModule();
    await deleteMultipleApi(["a1", "a2", "a3", "a4", "a5"]);

    expect(fetch).toHaveBeenCalledTimes(5);
  });
});
