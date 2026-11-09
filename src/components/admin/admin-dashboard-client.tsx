"use client";

import { useEffect, useState } from "react";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminDashboardSkeleton } from "@/components/admin/admin-dashboard-skeleton";
import type { FeedbackRow } from "@/components/admin/admin-dashboard";
import type { TraceReportRow } from "@/components/admin/trace-reports";
import type { AiUsageSectionData } from "@/components/admin/ai-usage-section";
import { API } from "@/lib/api-config";

type DashboardData = {
  feedback: FeedbackRow[];
  traceReports: TraceReportRow[];
  aiUsage: AiUsageSectionData;
};

/**
 * Client component that fetches admin dashboard data asynchronously.
 * Shows skeleton loaders while the data loads, then renders the full dashboard.
 */
export function AdminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const response = await fetch(API.admin.dashboard, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = "/login";
            return;
          }
          throw new Error(`Failed to load dashboard: ${response.status}`);
        }

        const result = await response.json();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard",
          );
        }
      }
    }

    void fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <AdminDashboard
      feedback={data.feedback}
      traceReports={data.traceReports}
      aiUsage={data.aiUsage}
    />
  );
}
