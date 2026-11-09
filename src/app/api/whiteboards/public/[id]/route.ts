import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";

/**
 * Public, unauthenticated read access to a single shared whiteboard.
 *
 * Only whiteboards explicitly marked `public: true` are exposed — the
 * `.eq("public", true)` filter runs server-side, so a visitor can never read
 * a private whiteboard by guessing its id. Write access stays behind the
 * user-scoped /api/me/whiteboards routes.
 */
const SELECT_COLUMNS = "id, name, data, thumbnail, public, created_at, updated_at";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await getServiceClient()
    .from("whiteboards")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .eq("public", true)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "This whiteboard is not shared publicly." },
      { status: 404 },
    );
  }
  return NextResponse.json({ whiteboard: data });
}
