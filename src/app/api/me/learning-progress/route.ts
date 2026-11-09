import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import type { LearningProgress, TemplateProgress } from "@/lib/paths";

// ---------------------------------------------------------------------------
// GET  /api/me/learning-progress  →  { progress: LearningProgress }
// PUT  /api/me/learning-progress  →  { progress: LearningProgress }  (records a trace)
// DELETE /api/me/learning-progress  →  { progress: {} }
//
// Stores which templates the user has traced in Supabase. The server is
// authoritative for signed-in users — localStorage is not used.
// ---------------------------------------------------------------------------

/** Fetch the full progress map for the authenticated user. */
async function fetchProgress(userId: string): Promise<LearningProgress> {
  const { data, error } = await getServiceClient()
    .from("learning_progress")
    .select("template_id, traced, traced_at")
    .eq("user_id", userId)
    .order("template_id", { ascending: true });

  if (error) throw error;

  const progress: LearningProgress = {};
  for (const row of data ?? []) {
    const { template_id, traced, traced_at } = row as {
      template_id: string;
      traced: boolean;
      traced_at: string;
    };
    progress[template_id] = {
      traced,
      tracedAt: new Date(traced_at).getTime(),
    };
  }
  return progress;
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to load progress." },
      { status: 401 },
    );
  }

  try {
    const progress = await fetchProgress(userId);
    return NextResponse.json({ progress });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/me/learning-progress — wipe all learning progress for the user. */
export async function DELETE(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in." }, { status: 401 });
  }

  const { error } = await getServiceClient()
    .from("learning_progress")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ progress: {} });
}

export async function PUT(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to save progress." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const templateId =
    typeof body.template_id === "string" ? body.template_id : null;
  if (!templateId) {
    return NextResponse.json(
      { error: "template_id must be a non-empty string." },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  // Upsert: insert or update if the row already exists.
  const { error: upsertError } = await supabase
    .from("learning_progress")
    .upsert(
      {
        user_id: userId,
        template_id: templateId,
        traced: true,
        traced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,template_id" },
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Return the full fresh progress so the client can reconcile.
  try {
    const progress = await fetchProgress(userId);
    return NextResponse.json({ progress });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
