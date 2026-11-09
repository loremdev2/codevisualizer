import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Inbox, Mail, CheckCircle2, Clock } from "lucide-react";

/**
 * Skeleton loader that mirrors the admin dashboard layout.
 * Shows animated placeholders while data loads from the API.
 */
export function AdminDashboardSkeleton() {
  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header skeleton */}
        <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </span>
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
            <Skeleton className="mt-2 h-4 w-96" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </header>

        {/* Metric cards skeleton */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { icon: Inbox, label: "Total submissions" },
            { icon: Mail, label: "New / unread" },
            { icon: CheckCircle2, label: "Resolved" },
            { icon: Clock, label: "Last 7 days" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-xl border bg-card px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {card.label}
                  </p>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </span>
                </div>
                <Skeleton className="mt-2 h-8 w-16" />
              </div>
            );
          })}
        </section>

        {/* Breakdown cards skeleton */}
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-4"
            >
              <Skeleton className="mb-3 h-4 w-28" />
              <div className="space-y-2.5">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j}>
                    <div className="mb-1 flex items-center justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Filters skeleton */}
        <section className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-16 rounded-full" />
              ))}
            </div>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </section>

        {/* Feedback list skeleton */}
        <section className="space-y-2.5">
          <Skeleton className="h-3 w-40" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-xl border bg-card px-4 py-3"
            >
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-64" />
                <div className="mt-1 flex gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </section>

        {/* AI Usage skeleton */}
        <div className="border-t pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted">
                <span className="h-4 w-4" />
              </span>
              <div>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-1 h-3 w-72" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card px-4 py-3"
                >
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-8 w-12" />
                  <Skeleton className="mt-1 h-2.5 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trace Reports skeleton */}
        <div className="border-t pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted">
                <span className="h-4 w-4" />
              </span>
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-3 w-64" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card px-4 py-3"
                >
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-8 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
