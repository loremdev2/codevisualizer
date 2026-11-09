import { NextResponse } from "next/server";

import { getServiceClient } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/user";
import { aiTranslationLimits } from "@/lib/ai-usage";

export const dynamic = "force-dynamic";

/**
 * Returns all admin dashboard data in one request.
 * Auth-gated: only admin users can call this.
 */
export async function GET(request: Request) {
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const dbUser = await getUserById(payload.sub);
  if (!dbUser?.is_admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const sc = getServiceClient();

  // Fire all independent queries in parallel for fastest load.
  const [
    { data: feedback },
    { data: traceReports },
    { data: aiSummary },
    { data: aiUsageByUser },
    { data: aiDenialRows },
  ] = await Promise.all([
    sc
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    sc
      .from("trace_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    sc.rpc("ai_translation_summary", { p_days: 7 }),
    sc.rpc("ai_translation_usage_by_user", { p_days: 7 }),
    sc
      .from("ai_translation_denials")
      .select(
        "id, user_id, bucket_type, count, retry_after_seconds, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  // Resolve denial user emails.
  const denialRows = (aiDenialRows ?? []) as Array<{
    id: string;
    user_id: string;
    bucket_type: string;
    count: number;
    retry_after_seconds: number;
    created_at: string;
  }>;
  const denialUserIds = Array.from(
    new Set(denialRows.map((row) => row.user_id)),
  );
  const { data: userRows } =
    denialUserIds.length > 0
      ? await getServiceClient()
          .from("users")
          .select("id, email")
          .in("id", denialUserIds)
      : { data: null };
  const emailById = new Map(
    ((userRows ?? []) as Array<{ id: string; email: string }>).map((u) => [
      u.id,
      u.email,
    ]),
  );

  const usageByUser = ((aiUsageByUser ?? []) as Array<{
    user_id: string;
    email: string | null;
    total: number;
    last_active: string;
  }>).map((row) => ({
    userId: row.user_id,
    email: row.email ?? null,
    total: row.total,
    lastActive: row.last_active,
  }));

  const denials = denialRows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: emailById.get(row.user_id) ?? null,
    bucketType: row.bucket_type,
    count: row.count,
    retryAfterSeconds: row.retry_after_seconds,
    createdAt: row.created_at,
  }));

  const { hourly, daily } = aiTranslationLimits();

  return NextResponse.json({
    feedback: feedback ?? [],
    traceReports: traceReports ?? [],
    aiUsage: {
      cacheRows: Number(
        (aiSummary as Record<string, unknown> | null)?.cache_rows ?? 0,
      ),
      cacheHits: Number(
        (aiSummary as Record<string, unknown> | null)?.cache_hits ?? 0,
      ),
      llmCalls: Number(
        (aiSummary as Record<string, unknown> | null)?.llm_calls ?? 0,
      ),
      guestCalls: Number(
        (aiSummary as Record<string, unknown> | null)?.guest_llm_calls ?? 0,
      ),
      denials24h: Number(
        (aiSummary as Record<string, unknown> | null)?.denials_24h ?? 0,
      ),
      denials7d: Number(
        (aiSummary as Record<string, unknown> | null)?.denials_7d ?? 0,
      ),
      hourlyLimit: hourly,
      dailyLimit: daily,
      usageByUser,
      denials,
    },
  });
}
