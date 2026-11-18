import { API, fetchJson } from "@/lib/api-config";
import { WHITEBOARD_STORAGE_PREFIX } from "@/lib/whiteboard-storage";

export type WhiteboardClientFile = {
  id: string;
  mimeType: string;
  dataURL: string;
  created: number;
  [key: string]: unknown;
};

export async function uploadWhiteboardFiles(
  boardId: string,
  files: Record<string, WhiteboardClientFile>,
  existingAssets: Record<string, string> = {},
): Promise<
  | { ok: true; files: Record<string, WhiteboardClientFile>; storageAssets: Record<string, string> }
  | { ok: false; error: string }
> {
  const storageAssets = { ...existingAssets };
  const pendingFiles = Object.values(files).filter(
    (file) =>
      !storageAssets[file.id] &&
      (file.dataURL.startsWith("data:") || file.dataURL.startsWith("https://")),
  );
  const blobs = new Map<string, Blob>();
  for (const file of pendingFiles) {
    try {
      blobs.set(file.id, await (await fetch(file.dataURL)).blob());
    } catch {
      return { ok: false, error: "Could not read a whiteboard image." };
    }
  }

  if (pendingFiles.length > 0) {
    const plan = await fetchJson<{
      uploads?: { id: string; path: string; signedUrl: string }[];
    }>(API.me.whiteboardAssets(boardId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: pendingFiles.map((file) => ({
          id: file.id,
          mimeType: file.mimeType,
          size: blobs.get(file.id)?.size ?? 0,
        })),
      }),
    });
    if (!plan.ok || !plan.data.uploads) {
      return { ok: false, error: plan.ok ? "Could not prepare image uploads." : plan.error };
    }

    const uploadsById = new Map(plan.data.uploads.map((upload) => [upload.id, upload]));
    for (const file of pendingFiles) {
      const upload = uploadsById.get(file.id);
      const blob = blobs.get(file.id);
      if (!upload || !blob) return { ok: false, error: "Could not prepare an image upload." };
      const form = new FormData();
      form.append("cacheControl", "31536000");
      form.append("", blob, file.id);
      try {
        const response = await fetch(upload.signedUrl, { method: "POST", body: form });
        if (!response.ok) {
          return { ok: false, error: "Could not upload a whiteboard image. Please try again." };
        }
      } catch {
        return { ok: false, error: "Could not upload a whiteboard image. Please try again." };
      }
      storageAssets[file.id] = upload.path;
    }
  }

  const persistedFiles = Object.fromEntries(
    Object.entries(files).map(([fileId, file]) => [
      fileId,
      storageAssets[file.id]
        ? { ...file, dataURL: `${WHITEBOARD_STORAGE_PREFIX}${storageAssets[file.id]}` }
        : file,
    ]),
  );
  return { ok: true, files: persistedFiles, storageAssets };
}
