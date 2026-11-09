"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";

import { API } from "@/lib/api-config";
import { TraceReportsSection, type TraceReportRow } from "@/components/admin/trace-reports";

export function AdminTraceReports() {
  const [reports, setReports] = useState<TraceReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch(API.admin.dashboard, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json) setReports(json.traceReports ?? []);
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-500" aria-hidden="true" />
          <h1 className="text-2xl font-medium tracking-normal">Trace Reports</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          &quot;This trace was wrong&quot; flags grouped by code hash.
        </p>
      </div>

      <TraceReportsSection reports={reports} />
    </div>
  );
}
