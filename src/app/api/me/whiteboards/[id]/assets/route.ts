import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import { WHITEBOARD_ASSETS_BUCKET } from "@/lib/whiteboard-storage";

const MAX_FILES_PER_REQUEST = 100;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to upload whiteboard assets." }, { status: 401 });
  }

  let body: { files?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!Array.isArray(body.files) || body.files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: "Invalid whiteboard asset list." }, { status: 400 });
  }

  const { id: boardId } = await params;
  const client = getServiceClient();
  const { data: board, error: boardError } = await client
    .from("whiteboards")
    .select("id")
    .eq("id", boardId)
    .eq("user_id", userId)
    .maybeSingle();
  if (boardError || !board) {
    return NextResponse.json({ error: "Whiteboard not found." }, { status: 404 });
  }

  const requests: { id: string; mimeType: string; size: number }[] = [];
  for (const raw of body.files) {
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Invalid whiteboard asset." }, { status: 400 });
    }
    const file = raw as Record<string, unknown>;
    if (
      typeof file.id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(file.id) ||
      typeof file.mimeType !== "string" || !ALLOWED_TYPES.has(file.mimeType) ||
      typeof file.size !== "number" || !Number.isInteger(file.size) ||
      file.size <= 0 || file.size > MAX_FILE_BYTES
    ) {
      return NextResponse.json({ error: "Unsupported or oversized whiteboard asset." }, { status: 400 });
    }
    requests.push({ id: file.id, mimeType: file.mimeType, size: file.size });
  }

  const uploads = await Promise.all(requests.map(async (file) => {
    const extension = file.mimeType === "image/jpeg" ? "jpg" : file.mimeType.split("/")[1];
    const path = `${userId}/${boardId}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await client.storage
      .from(WHITEBOARD_ASSETS_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) throw new Error("Could not prepare whiteboard asset upload.");
    return { id: file.id, path, signedUrl: data.signedUrl };
  }));

  return NextResponse.json({ uploads });
}
