// ---------------------------------------------------------------------------
// Bar-chart layout math — pure, unit-testable sizing for the weekly Solve
// Rate chart. Mirrors heatmap-layout.ts: the component measures its container
// and renders the SVG 1:1 instead of stretching a fixed viewBox, so labels
// stay at their true font size on phones.
// ---------------------------------------------------------------------------

export const BAR_MAX_H = 80;
/** Headroom above the tallest bar so the count label is never clipped. */
export const TOP_PAD = 14;
/** Space below the baseline for week labels. */
export const LABEL_SPACE = 18;

export const MIN_BAR_W = 6;
export const MAX_BAR_W = 28;
export const MIN_GAP = 2;
export const MAX_GAP = 10;

/** Minimum horizontal room one week label needs (font-size 9px). */
const LABEL_SLOT_PX = 30;

export type BarChartLayout = {
  barWidth: number;
  gap: number;
  /** Total SVG width at 1:1 scale. */
  chartWidth: number;
  /** Total SVG height at 1:1 scale. */
  chartHeight: number;
  /** Show the week label under bar i only when i % labelEvery === 0. */
  labelEvery: number;
  /** True when the natural chart width fits the container exactly. */
  fits: boolean;
};

/**
 * Solve barWidth/gap for `bucketCount` bars in `containerWidth`.
 *
 * Phones get the full container width with slim bars; desktops cap the bar
 * at 28px and the gap at 10px, leaving the chart narrower than the container
 * (the component centers it) instead of stretching labels out of shape.
 */
export function computeBarChartLayout(
  containerWidth: number,
  bucketCount: number,
): BarChartLayout {
  const n = Math.max(1, bucketCount);
  const width = Math.max(containerWidth, 120);

  // Base gap grows with the slot size, capped so desktop doesn't stretch.
  const slot = width / n;
  const gap = Math.min(MAX_GAP, Math.max(MIN_GAP, Math.floor(slot * 0.2)));

  let barWidth = Math.floor((width - (n + 1) * gap) / n);
  if (barWidth > MAX_BAR_W) barWidth = MAX_BAR_W;
  if (barWidth < MIN_BAR_W) barWidth = MIN_BAR_W;

  const chartWidth = n * barWidth + (n + 1) * gap;
  const chartHeight = TOP_PAD + BAR_MAX_H + LABEL_SPACE;

  // Label density: on narrow widths show every k-th week label so adjacent
  // labels never collide (each label needs ~LABEL_SLOT_PX).
  const maxLabels = Math.max(1, Math.floor(width / LABEL_SLOT_PX));
  const labelEvery = n <= maxLabels ? 1 : Math.ceil(n / maxLabels);

  return {
    barWidth,
    gap,
    chartWidth,
    chartHeight,
    labelEvery,
    fits: chartWidth <= width,
  };
}
