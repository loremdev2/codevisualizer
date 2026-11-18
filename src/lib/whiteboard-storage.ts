import type { SupabaseClient } from "@supabase/supabase-js";

export const WHITEBOARD_ASSETS_BUCKET = "whiteboard-assets";
export const WHITEBOARD_STORAGE_PREFIX = "storage://";
export const WHITEBOARD_SIGNED_URL_TTL_SECONDS = 60 * 60;

export type WhiteboardAssetMap = Record<string, string>;

export function getWhiteboardAssetMap(data: unknown): WhiteboardAssetMap {
  if (!data || typeof data !== "object") return {};
  const value = (data as Record<string, unknown>).storageAssets;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] =>
      typeof entry[1] === "string",
    ),
  );
}

/** Replace compact storage markers with temporary URLs only in API responses. */
export async function hydrateWhiteboardAssets(
  client: SupabaseClient,
  data: unknown,
): Promise<Record<string, unknown>> {
  if (!data || typeof data !== "object") return {};
  const result = structuredClone(data) as Record<string, unknown>;
  const files = result.files;
  const assets = getWhiteboardAssetMap(result);
  const entries = Object.entries(assets);
  if (!files || typeof files !== "object" || entries.length === 0) return result;

  const { data: signed, error } = await client.storage
    .from(WHITEBOARD_ASSETS_BUCKET)
    .createSignedUrls(entries.map(([, path]) => path), WHITEBOARD_SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error("Could not create whiteboard asset URLs.");

  const signedByPath = new Map((signed ?? []).map((item) => [item.path, item.signedUrl]));
  const hydratedFiles = { ...(files as Record<string, Record<string, unknown>>) };
  for (const [fileId, path] of entries) {
    const signedUrl = signedByPath.get(path);
    if (signedUrl && hydratedFiles[fileId]) {
      hydratedFiles[fileId] = { ...hydratedFiles[fileId], dataURL: signedUrl };
    }
  }
  result.files = hydratedFiles;
  return result;
}

