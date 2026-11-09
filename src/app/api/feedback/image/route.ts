import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { requireSameOrigin } from "@/lib/security/csrf";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Allowed image MIME types and their magic-byte signatures.
 * An upload must match BOTH the declared MIME type AND the first bytes of
 * the file content. This prevents an HTML/JS file renamed to .jpg from
 * being served as a public URL that executes scripts.
 */
const ALLOWED_TYPES: Array<{
  mime: string;
  extension: string;
  /** First bytes of the file (hex), used as a magic-byte check. */
  magic: number[];
}> = [
  { mime: "image/jpeg", extension: "jpg", magic: [0xff, 0xd8, 0xff] },
  { mime: "image/png", extension: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", extension: "gif", magic: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", extension: "webp", magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
];

const MAX_MAGIC_CHECK_BYTES = 12;

export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image is larger than 8 MB." }, { status: 400 });
  }

  // --- MIME type + magic-byte validation ---
  const declaredType = file.type;
  const matchedType = ALLOWED_TYPES.find((t) => t.mime === declaredType);
  if (!matchedType) {
    return NextResponse.json(
      { error: `Unsupported image type: ${declaredType || "unknown"}. Allowed: JPEG, PNG, GIF, WebP.` },
      { status: 400 },
    );
  }

  // Read the first bytes to verify magic bytes match the declared type.
  const headerBuffer = await file.slice(0, MAX_MAGIC_CHECK_BYTES).arrayBuffer();
  const header = new Uint8Array(headerBuffer);
  const magicMatches = matchedType.magic.every((byte, i) => header[i] === byte);
  if (!magicMatches) {
    return NextResponse.json(
      { error: "File content does not match its declared type." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  const path = `${randomUUID()}.${matchedType.extension}`;

  // Re-create the File slice from offset to skip the already-read header,
  // then upload the full original file with the validated content type.
  const { error: uploadError } = await supabase.storage
    .from("feedback-images")
    .upload(path, file, { contentType: matchedType.mime });
  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message.includes("bucket") ? "bucket_not_configured" : uploadError.message },
      { status: 500 },
    );
  }

  const url = supabase.storage.from("feedback-images").getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ url });
}
