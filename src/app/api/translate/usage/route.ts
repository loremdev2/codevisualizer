import { NextResponse, type NextRequest } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import {
  aiTranslationLimits,
  getAiUsage,
  type AiTranslationQuota,
} from "@/lib/ai-usage";

/** Returns the signed-in user's AI translation budget (limits + current usage),
 * so the top bar can show a remaining-translations counter. Guests get 401 —
 * they don't have a quota to display (Java/C++ are locked for them). */
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to view your translation quota." }, { status: 401 });
  }

  const { hourly, daily } = aiTranslationLimits();
  const { hourUsed, dayUsed } = await getAiUsage(userId);

  const quota: AiTranslationQuota = { hourlyLimit: hourly, dailyLimit: daily, hourUsed, dayUsed };
  return NextResponse.json(quota);
}
