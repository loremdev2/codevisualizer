import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/user";
import { requireSameOrigin } from "@/lib/security/csrf";

const STATUSES = new Set(["new", "read", "resolved"]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const payload = await verifySessionToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await getUserById(payload.sub);
  if (!admin?.is_admin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.status || !STATUSES.has(body.status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { error } = await getServiceClient()
    .from("feedback")
    .update({ status: body.status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
