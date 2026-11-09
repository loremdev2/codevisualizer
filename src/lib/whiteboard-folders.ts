import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Validate a client-supplied `folder_id` against the signed-in user's folders.
 *
 * Folders are owner-scoped, so a folder id from another account must never be
 * accepted (the service-role client bypasses RLS). Returns `null` folderId for
 * "no folder" (Unfiled) and a friendly error otherwise.
 */
export async function resolveFolderId(
  client: SupabaseClient,
  userId: string,
  raw: unknown,
): Promise<{ ok: true; folderId: string | null } | { ok: false; error: string }> {
  if (raw === null) return { ok: true, folderId: null };
  if (typeof raw !== "string" || raw.length === 0) {
    return { ok: false, error: "Invalid folder id." };
  }

  const { data, error } = await client
    .from("whiteboard_folders")
    .select("id")
    .eq("id", raw)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Could not verify folder." };
  }
  if (!data) {
    return { ok: false, error: "Folder not found." };
  }

  return { ok: true, folderId: data.id as string };
}
