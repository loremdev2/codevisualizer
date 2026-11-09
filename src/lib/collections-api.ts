// ---------------------------------------------------------------------------
// API helpers for the collections feature.
// All fetch calls live here so they can be tested in isolation.
// ---------------------------------------------------------------------------

import type { SavedAlgorithm } from "./collections-types";
import { API, fetchJson, fetchOk } from "./api-config";

export type FetchCollectionsResult = {
  algorithms: SavedAlgorithm[];
};

/**
 * Fetch all saved algorithms for the current user.
 * Returns an empty array on error.
 */
export async function fetchCollectionsApi(): Promise<SavedAlgorithm[]> {
  try {
    const result = await fetchJson<{ algorithms?: SavedAlgorithm[] }>(API.me.savedAlgorithms, {
      cache: "no-store",
    });
    if (result.ok && result.data.algorithms) {
      return result.data.algorithms;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Delete a single saved algorithm by id.
 * Returns true on success, false on failure.
 */
export async function deleteAlgorithmApi(id: string): Promise<boolean> {
  try {
    return fetchOk(API.me.savedAlgorithm(id), { method: "DELETE" });
  } catch {
    return false;
  }
}

/**
 * Delete multiple saved algorithms by id.
 * Returns the set of successfully deleted ids.
 */
export async function deleteMultipleApi(ids: string[]): Promise<Set<string>> {
  const results = await Promise.all(
    ids.map(async (id) => {
      const ok = await deleteAlgorithmApi(id);
      return ok ? id : null;
    }),
  );
  return new Set(results.filter((id): id is string => id !== null));
}


/**
 * Update a saved algorithm (e.g. move to a different topic).
 * Returns the updated algorithm on success, null on failure.
 */
export async function updateAlgorithmApi(
  id: string,
  updates: { topic?: string; title?: string },
): Promise<SavedAlgorithm | null> {
  try {
    const result = await fetchJson<{ algorithm?: SavedAlgorithm }>(API.me.savedAlgorithm(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (result.ok && result.data.algorithm) {
      return result.data.algorithm;
    }
    return null;
  } catch {
    return null;
  }
}


/**
 * Update tags on a saved algorithm.
 * Returns the updated algorithm on success, null on failure.
 */
export async function updateTagsApi(
  id: string,
  tags: string[],
): Promise<SavedAlgorithm | null> {
  try {
    const result = await fetchJson<{ algorithm?: SavedAlgorithm }>(API.me.savedAlgorithm(id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    if (result.ok && result.data.algorithm) {
      return result.data.algorithm;
    }
    return null;
  } catch {
    return null;
  }
}
