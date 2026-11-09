// ---------------------------------------------------------------------------
// Heatmap layout math — pure, unit-testable sizing for the GitHub-style
// activity heatmap. Kept free of React so the width→cell-size policy can be
// tested directly across phone / tablet / desktop widths.
// ---------------------------------------------------------------------------

export const HEATMAP_WEEKS = 53;
export const DAYS_IN_WEEK = 7;

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""] as const;

/** Width reserved for the day-of-week labels column (px). */
export const DAY_LABEL_WIDTH = 28;

/**
 * Smallest cell we allow. The old floor of 8px made each week column ~10px
 * wide, so 53 weeks needed ~530px — wider than any phone (~360px). That
 * forced gridHeight/totalWidth to overflow the container on mobile. 3px
 * cells with 0.75px gaps fit a 320px-wide phone: 53*3 + 52*0.75 ≈ 199px,
 * comfortably inside 320 - 28 (day labels) = 292px of available width.
 */
export const MIN_CELL_SIZE = 3;
export const MAX_CELL_SIZE = 13;

export type HeatmapLayout = {
  /** Row-major day cells (53 weeks × 7 days), oldest first. */
  grid: Array<{ date: string; count: number }>;
  /** One label per month visible in the window, positioned at its column. */
  monthLabels: Array<{ label: string; x: number }>;
  /** Left offset of each week column inside the grid area (px). */
  columnXOffsets: number[];
  /** Total solves across the window. */
  totalCount: number;
  /** Computed cell size and gap in px. */
  cellSize: number;
  cellGap: number;
  /** YYYY-MM-DD key for "today" in the local timezone. */
  todayKey: string;
  /** True when the computed grid is narrower than the available width. */
  fits: boolean;
};

/** Convert epoch-ms to a YYYY-MM-DD string in the local timezone. */
export function toDateKey(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Build a color intensity level (0-4) from the count. */
export function intensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

/** Solve cellSize/cellGap so 53 week-columns fit `availableWidth`. */
export function solveCellSize(availableWidth: number): {
  cellSize: number;
  cellGap: number;
  totalWidth: number;
  fits: boolean;
} {
  const width = Math.max(availableWidth, 120);
  // totalWidth = WEEKS*cellSize + (WEEKS-1)*gap, gap = cellSize*0.25
  // => cellSize <= width / (WEEKS + (WEEKS-1)*0.25)  (≈ 65.75 for 53 weeks)
  const divisor = HEATMAP_WEEKS + (HEATMAP_WEEKS - 1) * 0.25;
  let cellSize = Math.max(
    MIN_CELL_SIZE,
    Math.min(MAX_CELL_SIZE, Math.floor(width / divisor)),
  );
  let cellGap = Math.max(0, Math.floor(cellSize * 0.25));
  let totalWidth = HEATMAP_WEEKS * cellSize + (HEATMAP_WEEKS - 1) * cellGap;
  while (totalWidth > width && cellSize > MIN_CELL_SIZE) {
    cellSize--;
    cellGap = Math.max(0, Math.floor(cellSize * 0.25));
    totalWidth = HEATMAP_WEEKS * cellSize + (HEATMAP_WEEKS - 1) * cellGap;
  }
  return { cellSize, cellGap, totalWidth, fits: totalWidth <= width };
}

/**
 * Build the full heatmap layout. Pure apart from reading the current date —
 * pass `nowMs` in tests for deterministic output.
 */
export function computeHeatmapLayout(
  timestamps: Record<number, number>,
  containerWidth: number,
  nowMs: number = Date.now(),
): HeatmapLayout {
  const now = new Date(nowMs);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Count solves per day.
  const dayCounts = new Map<string, number>();
  for (const epochMs of Object.values(timestamps)) {
    if (epochMs <= 0) continue;
    const key = toDateKey(epochMs);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  // Grid ends on the Saturday of the current week.
  const totalDays = HEATMAP_WEEKS * DAYS_IN_WEEK;
  const gridEnd = new Date(today);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridStart.getDate() - (totalDays - 1));

  const cells: Array<{ date: string; count: number }> = [];
  let totalCount = 0;
  for (let i = 0; i < totalDays; i++) {
    const cellDate = new Date(gridStart.getTime() + i * 86_400_000);
    const key = toDateKey(cellDate.getTime());
    const count = dayCounts.get(key) ?? 0;
    totalCount += count;
    cells.push({ date: key, count });
  }

  const { cellSize, cellGap, fits } = solveCellSize(
    Math.max(containerWidth - DAY_LABEL_WIDTH, 120),
  );

  // Compute x-position of each week column (uniform spacing).
  const columnXOffsets: number[] = [];
  let x = 0;
  for (let week = 0; week < HEATMAP_WEEKS; week++) {
    columnXOffsets.push(x);
    if (week < HEATMAP_WEEKS - 1) {
      x += cellSize + cellGap;
    }
  }

  // Month labels — one per month, placed at the column where the 1st falls.
  const monthLabels: Array<{ label: string; x: number }> = [];
  const labeledMonths = new Set<string>();

  for (let week = 0; week < HEATMAP_WEEKS; week++) {
    for (let day = 0; day < DAYS_IN_WEEK; day++) {
      const dayMs =
        gridStart.getTime() + (week * DAYS_IN_WEEK + day) * 86_400_000;
      const d = new Date(dayMs);
      if (d.getDate() === 1) {
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!labeledMonths.has(key)) {
          labeledMonths.add(key);
          monthLabels.push({
            label: MONTHS[d.getMonth()],
            x: columnXOffsets[week],
          });
        }
      }
    }
  }

  // Ensure today's month is labeled.
  const todayMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
  if (!labeledMonths.has(todayMonthKey)) {
    for (let i = 0; i < cells.length; i++) {
      const d = new Date(gridStart.getTime() + i * 86_400_000);
      const mk = `${d.getFullYear()}-${d.getMonth()}`;
      if (mk === todayMonthKey) {
        const weekCol = Math.floor(i / DAYS_IN_WEEK);
        monthLabels.push({
          label: MONTHS[d.getMonth()],
          x: columnXOffsets[weekCol],
        });
        labeledMonths.add(todayMonthKey);
        break;
      }
    }
  }

  monthLabels.sort((a, b) => a.x - b.x);

  return {
    grid: cells,
    monthLabels,
    columnXOffsets,
    totalCount,
    cellSize,
    cellGap,
    todayKey: toDateKey(today.getTime()),
    fits,
  };
}
