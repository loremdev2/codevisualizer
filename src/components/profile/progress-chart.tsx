"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Target, TrendingDown, TrendingUp } from "lucide-react";

import {
  daysFromTimestamps,
  fetchActivitySummary,
  weeklyBuckets,
  type DailyActivity,
  type WeekBucket,
} from "@/lib/activity-ledger";
import { computeBarChartLayout, BAR_MAX_H } from "@/lib/chart-layout";

// ---------------------------------------------------------------------------
// Interactive SVG progress chart — weekly solve counts over the past 12 weeks.
// No external charting library needed. Hover shows a tooltip; click pins the
// week's details; a stats strip summarizes the whole period.
//
// Responsive: the container is measured and the SVG is rendered 1:1 at the
// solved layout size (bars shrink, labels thin out on phones) instead of
// stretching a fixed viewBox, which used to shrink the 9px labels to ~7px on
// phones. Desktop keeps the capped bar width and centers the chart.
// ---------------------------------------------------------------------------

const WEEKS = 12;

function getWeekBuckets(timestamps: Record<number, number>): WeekBucket[] {
  const days = daysFromTimestamps(timestamps);
  return weeklyBuckets(days, "questionsSolved", WEEKS);
}

export function ProgressChart({
  timestamps,
  runDays,
}: {
  timestamps: Record<number, number>;
  /** Ledger activity (runs/solves per day) from /api/activity/summary. */
  runDays?: DailyActivity[] | null;
}) {
  const buckets = useMemo(() => getWeekBuckets(timestamps), [timestamps]);
  const runBuckets = useMemo(
    () =>
      runDays && runDays.length > 0
        ? weeklyBuckets(runDays, "traceRuns", WEEKS)
        : null,
    [runDays],
  );
  // Metric toggle: runs come from the server ledger, solves from the same
  // timestamps the rest of the profile uses. Falls back to solves whenever
  // ledger data isn't available.
  const [metric, setMetric] = useState<"solves" | "runs">("solves");
  const chartBuckets = metric === "runs" && runBuckets ? runBuckets : buckets;
  const unit = chartBuckets === runBuckets ? "run" : "solve";
  const unitPlural = unit === "run" ? "runs" : "solves";
  const maxCount = Math.max(1, ...chartBuckets.map((b) => b.count));
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Measure the wrapper so the SVG renders 1:1 (no viewBox stretching).
  const [wrapWidth, setWrapWidth] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWrapWidth(entry.contentRect.width);
    });
    // ResizeObserver fires an initial callback on observe().
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(
    () => computeBarChartLayout(wrapWidth, chartBuckets.length),
    [wrapWidth, chartBuckets.length],
  );

  // Hovered (transient) and pinned (clicked) week indices.
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const activeIdx = hovered ?? pinned;
  const active = activeIdx !== null ? chartBuckets[activeIdx] : null;

  // Tooltip position, measured from the rendered SVG so it tracks the bar
  // position at the current 1:1 scale. Fixed positioning lets the tooltip
  // escape the scroll container, like the heatmap's.
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);

  /** Screen-space anchor above week `idx`'s bar (measured, event-time only). */
  const posFor = (idx: number): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / layout.chartWidth;
    const bucket = chartBuckets[idx];
    const h =
      bucket.count === 0 ? 0 : Math.max(4, (bucket.count / maxCount) * BAR_MAX_H);
    const barX = layout.gap + idx * (layout.barWidth + layout.gap);
    return {
      x: rect.left + (barX + layout.barWidth / 2) * scale,
      y: rect.top + (BAR_MAX_H - h) * scale,
    };
  };

  // Click outside the chart clears a pinned selection.
  useEffect(() => {
    if (pinned === null) return;
    const onPointerDown = (e: PointerEvent) => {
      if (svgRef.current && !svgRef.current.contains(e.target as Node)) {
        setPinned(null);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [pinned]);

  // Summary stats over the full window.
  const stats = useMemo(() => {
    const counts = chartBuckets.map((b) => b.count);
    const total = counts.reduce((a, b) => a + b, 0);
    const activeWeeks = counts.filter((c) => c > 0).length;
    const bestIdx = counts.indexOf(Math.max(...counts));
    const lastWeek = counts[counts.length - 1] ?? 0;
    const prevWeek = counts.length >= 2 ? counts[counts.length - 2] : 0;
    const delta = lastWeek - prevWeek;
    return { total, activeWeeks, bestIdx, lastWeek, delta };
  }, [chartBuckets]);

  const fmtDay = (epochMs: number) =>
    new Date(epochMs).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const { barWidth, gap, chartWidth, chartHeight, labelEvery } = layout;

  return (
    <div>
      {/* Metric toggle — only when server ledger runs exist. */}
      {runBuckets ? (
        <div
          role="group"
          aria-label="Chart metric"
          className="mb-2 flex items-center justify-end gap-1 text-xs"
        >
          {(["solves", "runs"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              aria-pressed={metric === m}
              className={`rounded-full px-2.5 py-1 font-medium capitalize transition-colors ${
                metric === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      ) : null}

      {/* Chart wrapper — measured; SVG is centered when narrower (desktop). */}
      <div ref={wrapRef} className="w-full">
        <div
          className="mx-auto"
          style={{ width: Math.min(chartWidth, wrapWidth || chartWidth) }}
        >
          <svg
            ref={svgRef}
            width={chartWidth}
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="block h-auto"
            aria-label={`${unit === "run" ? "Runs" : "Solves"} per week over the past ${WEEKS} weeks`}
            role="img"
            onMouseLeave={() => {
              setHovered(null);
              // Fall back to the pinned week's position (or hide the tooltip).
              setTipPos(pinned !== null ? posFor(pinned) : null);
            }}
          >
            {/* Y-axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = BAR_MAX_H - pct * BAR_MAX_H;
              return (
                <line
                  key={pct}
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  className="stroke-border/40"
                  strokeWidth={0.5}
                />
              );
            })}

            {/* Bars */}
            {chartBuckets.map((bucket, i) => {
              const h = bucket.count === 0 ? 0 : Math.max(4, (bucket.count / maxCount) * BAR_MAX_H);
              const x = gap + i * (barWidth + gap);
              const y = BAR_MAX_H - h;
              const isActive = activeIdx === i;
              const dimmed = activeIdx !== null && !isActive;

              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    setHovered(i);
                    setTipPos(posFor(i));
                  }}
                  onClick={() => {
                    if (pinned === i) {
                      setPinned(null);
                    } else {
                      setPinned(i);
                      setTipPos(posFor(i));
                    }
                  }}
                >
                  {/* Full-height invisible hit area so hovering/clicking is
                      easy even for empty weeks (bar height 0). */}
                  <rect
                    x={x - gap / 2}
                    y={0}
                    width={barWidth + gap}
                    height={BAR_MAX_H}
                    fill="transparent"
                  />
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    rx={Math.min(4, barWidth / 3)}
                    height={h}
                    className={`transition-all ${dimmed ? "fill-primary/40" : "fill-primary"}`}
                  />
                  {/* Count label above bar — hidden on very slim bars where
                      it would collide with neighbors. */}
                  {bucket.count > 0 && barWidth >= 10 ? (
                    <text
                      x={x + barWidth / 2}
                      y={y - 4}
                      textAnchor="middle"
                      className={isActive ? "fill-foreground font-medium" : "fill-muted-foreground"}
                      fontSize={10}
                    >
                      {bucket.count}
                    </text>
                  ) : null}
                  {/* Week label below — thinned on narrow widths. */}
                  <text
                    x={x + barWidth / 2}
                    y={BAR_MAX_H + 14}
                    textAnchor="middle"
                    className={`text-[9px] ${
                      isActive ? "fill-foreground font-medium" : "fill-muted-foreground"
                    }`}
                    fontSize={9}
                  >
                    {i % labelEvery === 0 || chartBuckets.length <= 8
                      ? bucket.label
                      : ""}
                  </text>
                </g>
              );
            })}

            {/* Baseline */}
            <line
              x1={0}
              y1={BAR_MAX_H}
              x2={chartWidth}
              y2={BAR_MAX_H}
              className="stroke-border"
              strokeWidth={1}
            />

            {/* Pinned indicator: small caret under the selected bar. */}
            {pinned !== null && (
              <path
                d={`M ${gap + pinned * (barWidth + gap) + barWidth / 2 - 4} ${BAR_MAX_H + 18} l 4 5 l 4 -5 z`}
                className="fill-foreground/60"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Tooltip — fixed-position HTML overlay so it can escape the SVG box. */}
      {active && tipPos && (
        <div
          className="pointer-events-none fixed z-50 w-max max-w-[90vw] rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          style={{
            left: tipPos.x,
            top: tipPos.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="font-medium">
            {active.count === 0
              ? `No ${unitPlural}`
              : `${active.count} ${unit}${active.count === 1 ? "" : "s"}`}
          </span>
          <span className="text-muted-foreground"> · {active.range}</span>
          {active.count > 0 && active.lastEventAt > 0 ? (
            <div className="text-muted-foreground">
              Last {unit} {fmtDay(active.lastEventAt)}
            </div>
          ) : null}
          {pinned !== null && (
            <div className="text-[10px] text-muted-foreground/70">
              Click again to unpin
            </div>
          )}
        </div>
      )}

      {/* Summary — wraps into a column on phones instead of colliding. */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>Past {WEEKS} weeks — tap a bar for details</span>
        <span className="font-mono">{stats.total} total {unitPlural}</span>
      </div>

      {/* Stats strip */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            Best week
          </div>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {chartBuckets[stats.bestIdx]?.count ?? 0}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {unitPlural}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground/80">
            {chartBuckets[stats.bestIdx]?.range ?? ""}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
            Active weeks
          </div>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {stats.activeWeeks}
            <span className="text-sm font-normal text-muted-foreground">
              / {WEEKS}
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground/80">
            weeks with ≥1 {unit}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
            {unit === "run" ? "Runs this week" : "Solves this week"}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-semibold tracking-tight">
            {stats.lastWeek}
            {stats.delta !== 0 && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  stats.delta > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {stats.delta > 0 ? (
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                )}
                {stats.delta > 0 ? "+" : ""}
                {stats.delta}
              </span>
            )}
          </p>
          <p className="text-[10px] text-muted-foreground/80">vs. last week</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-violet-500" aria-hidden="true" />
            Weekly average
          </div>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {(stats.total / WEEKS).toFixed(1)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              / week
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground/80">
            across the full window
          </p>
        </div>
      </div>
    </div>
  );
}
