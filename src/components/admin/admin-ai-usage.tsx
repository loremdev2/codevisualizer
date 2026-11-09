"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";

import { API } from "@/lib/api-config";
import { AiUsageSection, type AiUsageSectionData } from "@/components/admin/ai-usage-section";

export function AdminAiUsage() {
  const [data, setData] = useState<AiUsageSectionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(API.admin.dashboard, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json) setData(json.aiUsage ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed bg-card/30 p-10 text-center">
          <Coins className="mx-auto h-9 w-9 text-muted-foreground" />
          <h3 className="mt-3 text-base font-medium">No AI usage data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            AI translation data will appear here once users start translating code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <h1 className="text-2xl font-medium tracking-normal">AI Usage</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Translation spend, cache effectiveness, and rate-limit denials.
        </p>
      </div>

      <AiUsageSection data={data} />
    </div>
  );
}
