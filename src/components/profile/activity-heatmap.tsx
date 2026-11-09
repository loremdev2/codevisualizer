"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import {
  computeHeatmapLayout,
  intensityLevel,
  DAY_LABELS,
  DAY_LABEL_WIDTH,
} from "@/lib/heatmap-layout";
import {
  subscribeToDarkTheme,
  getDarkThemeSnapshot,
  getDarkThemeServerSnapshot,
} from "@/lib/visualizer-utils";

// ---------------------------------------------------------------------------
// GitHub / LeetCode-style activity heatmap showing activity per day over the
// past ~12 months. Fully responsive — cell sizes adapt to fit the container
// without horizontal scrolling, down to phone widths. Sizing math lives in
// src/lib/heatmap-layout.ts (pure + unit-tested).
// ---------------------------------------------------------------------------

const CELL_COLORS = {
  light: [
    "bg-neutral-100", // 0 — empty
    "bg-emerald-200", // 1
    "bg-emerald-400", // 2
    "bg-emerald-500", // 3
    "bg-emerald-600", // 4+
  ],
  dark: [
    "bg-neutral-800", // 0 — empty
    "bg-emerald-900/60", // 1
    "bg-emerald-700/70", // 2
    "bg-emerald-600/80", // 3
    "bg-emerald-500", // 4+
  ],
};

export function ActivityHeatmap({
  timestamps,
}: {
  /** Record mapping question number → epoch-ms when first solved. */
  timestamps: Record<number, number>;
}) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  // Responsive sizing: measure container width and compute dimensions.
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    // ResizeObserver fires an initial callback on observe(), which delivers
    // the first measurement without a synchronous setState in the effect.
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track dark mode via the shared external store (correct SSR snapshot,
  // no setState-in-effect).
  const isDarkMode = useSyncExternalStore(
    subscribeToDarkTheme,
    getDarkThemeSnapshot,
    getDarkThemeServerSnapshot,
  );

  // Build the grid and compute responsive dimensions (pure math, unit-tested).
  const {
    grid,
    monthLabels,
    columnXOffsets,
    totalCount,
    cellSize,
    cellGap,
    todayKey,
  } = useMemo(
    () => computeHeatmapLayout(timestamps, containerWidth),
    [timestamps, containerWidth],
  );

  // Group grid into columns (weeks).
  const columns = useMemo(() => {
    const cols: Array<typeof grid> = [];
    for (let i = 0; i < grid.length; i += 7) {
      cols.push(grid.slice(i, i + 7));
    }
    return cols;
  }, [grid]);

  const colors = isDarkMode ? CELL_COLORS.dark : CELL_COLORS.light;

  // Touch devices don't fire mouseenter — open the tooltip on tap too.
  const handleActivate = (
    e: React.MouseEvent<HTMLDivElement>,
    date: string,
    count: number,
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, date, count });
  };

  function formatDateShort(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const gridHeight = 7 * cellSize + 6 * cellGap;
  const showDayLabels = cellSize >= 6;

  return (
    <div ref={containerRef} className="relative w-full pt-2">
      {/* Month labels — aligned with the grid columns. Hidden when cells get
          tiny (phones): consecutive 3-letter labels overlap into noise. */}
      {showDayLabels && (
        <div
          className="relative mb-1"
          style={{
            marginLeft: DAY_LABEL_WIDTH + cellGap,
            height: 20,
          }}
        >
          {monthLabels.map((ml, i) => (
            <span
              key={`${ml.label}-${i}`}
              className="absolute text-[10px] text-muted-foreground"
              style={{ left: ml.x }}
            >
              {ml.label}
            </span>
          ))}
        </div>
      )}

      <div
        className="flex w-full"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Day-of-week labels */}
        {showDayLabels && (
          <div
            className="flex shrink-0 flex-col"
            style={{ gap: cellGap }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground"
                style={{
                  width: DAY_LABEL_WIDTH,
                  height: cellSize,
                  lineHeight: `${cellSize}px`,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Heatmap grid — no overflow, fits container */}
        <div
          className="relative shrink-0"
          style={{
            marginLeft: showDayLabels ? cellGap : 0,
            height: gridHeight,
            width: columnXOffsets.length > 0
              ? columnXOffsets[columnXOffsets.length - 1] + cellSize
              : 0,
          }}
        >
          {columns.map((col, weekIdx) => (
            <div
              key={weekIdx}
              className="absolute flex flex-col"
              style={{
                left: columnXOffsets[weekIdx],
                gap: cellGap,
              }}
            >
              {col.map((day) => {
                const level = intensityLevel(day.count);
                const isToday = day.date === todayKey;
                return (
                  <div
                    key={day.date}
                    role="button"
                    tabIndex={-1}
                    aria-label={`${day.count} questions solved on ${day.date}`}
                    className={`rounded-sm transition-colors ${colors[level]} ${
                      isToday
                        ? "outline outline-2 outline-primary/50"
                        : "hover:outline hover:outline-1 hover:outline-foreground/20"
                    }`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                    }}
                    onMouseEnter={(e) =>
                      handleActivate(e, day.date, day.count)
                    }
                    onClick={(e) => handleActivate(e, day.date, day.count)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend — shrinks its swatches on phones so the row never wraps */}
      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Less</span>
        {colors.map((color, i) => (
          <div
            key={i}
            className={`rounded-sm ${color}`}
            style={{
              width: Math.max(cellSize, 5),
              height: Math.max(cellSize, 5),
            }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="font-medium">
            {tooltip.count === 0
              ? "No activity"
              : `${tooltip.count} question${tooltip.count === 1 ? "" : "s"} solved`}
          </span>{" "}
          on {formatDateShort(tooltip.date)}
        </div>
      )}

      {/* Summary */}
      <p className="mt-2 text-xs text-muted-foreground">
        {totalCount > 0
          ? `${totalCount} question${totalCount === 1 ? "" : "s"} solved in the last year`
          : "No activity yet — start solving to fill your heatmap!"}
      </p>
    </div>
  );
}
