import { NextResponse, type NextRequest } from "next/server";

import { getServiceClient } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth/session";
import { requireSameOrigin } from "@/lib/security/csrf";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const SELECT_COLUMNS = "id, title, topic, language, code, input_data, tags, created_at, updated_at";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your saved algorithms." }, { status: 401 });
  }

  const { data, error } = await getServiceClient()
    .from("saved_algorithms")
    .select(SELECT_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ algorithms: data });
}

export async function POST(request: NextRequest) {
  const csrfError = requireSameOrigin(request);
  if (csrfError) return csrfError;

  // 30 saves per minute per IP.
  const ip = getClientIp(request);
  const limit = checkRateLimit(`saved-algo:${ip}`, 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many saves. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to save code." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const code = typeof body.code === "string" ? body.code : "";
  if (!title || !topic || !code) {
    return NextResponse.json({ error: "Title, topic, and code are required." }, { status: 400 });
  }
  if (title.length > 120 || topic.length > 80) {
    return NextResponse.json({ error: "Title or topic is too long." }, { status: 400 });
  }

  const { data, error } = await getServiceClient()
    .from("saved_algorithms")
    .insert({
      user_id: userId,
      title,
      topic,
      language: typeof body.language === "string" ? body.language : "javascript",
      code,
      input_data: (body.input_data as unknown) ?? {},
      updated_at: new Date().toISOString(),
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ algorithm: data });
}
