import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { insertLedgerEvent } from "@/lib/activity-ledger-server";

// ---------------------------------------------------------------------------
// GET  /api/me/solved-questions?bank=top150  →  { solved: number[] }
// PUT  /api/me/solved-questions              →  { solved: number[] }  (toggles, returns fresh list)
// DELETE /api/me/solved-questions?bank=top150  →  { solved: [] }
//
// The `bank` parameter scopes the query to a specific question bank.
// Defaults to "top150" for backward compatibility.
//
// PUT is atomic: it attempts an INSERT first; if the row already exists (PK
// conflict), it deletes instead. This avoids the check-then-act race where
// two concurrent toggles for the same question could both try to insert.
// ---------------------------------------------------------------------------

const VALID_BANKS = new Set(["top150", "neetcode"]);

function parseBank(value: string | null): string {
  if (value && VALID_BANKS.has(value)) return value;
  return "top150";
}

/** Fetch the full solved set for the authenticated user in a given bank. */
async function fetchSolved(userId: string, bank: string): Promise<Array<{ question_no: number; solved_at: string }>> {
  const { data, error } = await getServiceClient()
    .from("question_solved")
    .select("question_no, solved_at")
    .eq("user_id", userId)
    .eq("bank", bank)
    .order("question_no", { ascending: true });

  if (error) throw error;
  return (data as Array<{ question_no: number; solved_at: string }>) ?? [];
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to load progress." }, { status: 401 });
  }

  const bank = parseBank(request.nextUrl.searchParams.get("bank"));

  try {
    const rows = await fetchSolved(userId, bank);
    const solved = rows.map((r) => r.question_no);
    const timestamps: Record<number, number> = {};
    for (const row of rows) {
      timestamps[row.question_no] = new Date(row.solved_at).getTime();
    }
    return NextResponse.json({ solved, timestamps, bank });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/me/solved-questions — wipe solved for the user in a bank (used by reset). */
export async function DELETE(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in." }, { status: 401 });
  }

  const bank = parseBank(request.nextUrl.searchParams.get("bank"));

  const { error } = await getServiceClient()
    .from("question_solved")
    .delete()
    .eq("user_id", userId)
    .eq("bank", bank);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ solved: [], bank });
}

export async function PUT(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to save progress." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const questionNo = typeof body.question_no === "number" ? body.question_no : null;
  if (!questionNo || !Number.isInteger(questionNo) || questionNo <= 0) {
    return NextResponse.json({ error: "question_no must be a positive integer." }, { status: 400 });
  }

  const bank = parseBank(typeof body.bank === "string" ? body.bank : null);

  const supabase = getServiceClient();

  // Atomic toggle: attempt insert first.
  const { error: insertError } = await supabase
    .from("question_solved")
    .insert({ user_id: userId, bank, question_no: questionNo });

  if (insertError) {
    // 23505 = unique_violation (PK already exists) → un-solve: delete the row.
    if (insertError.code === "23505") {
      const { error: deleteError } = await supabase
        .from("question_solved")
        .delete()
        .eq("user_id", userId)
        .eq("bank", bank)
        .eq("question_no", questionNo);
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // New solve → append to the activity ledger (the history behind the
  // profile charts). Un-solves don't append: the ledger is an activity
  // record, and the toggle-off removed the authoritative row.
  if (!insertError) {
    await insertLedgerEvent({
      actorKind: "user",
      actorId: userId,
      event: "question_solved",
      bank,
      questionNo,
    });
  }

  // Return the full fresh set so the client can reconcile.
  try {
    const rows = await fetchSolved(userId, bank);
    const solved = rows.map((r) => r.question_no);
    const timestamps: Record<number, number> = {};
    for (const row of rows) {
      timestamps[row.question_no] = new Date(row.solved_at).getTime();
    }
    return NextResponse.json({ solved, timestamps, bank });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message, }, { status: 500 });
  }
}
