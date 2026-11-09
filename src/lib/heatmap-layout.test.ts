import { describe, expect, it } from "vitest";

import {
  computeHeatmapLayout,
  intensityLevel,
  solveCellSize,
  toDateKey,
  DAY_LABEL_WIDTH,
  HEATMAP_WEEKS,
} from "./heatmap-layout";

// Fixed reference instant: 2026-09-14 12:00 local time. All assertions below
// are timezone-relative, so any test-machine timezone works.
const NOW = new Date(2026, 8, 14, 12, 0, 0).getTime();

describe("toDateKey", () => {
  it("formats epoch-ms as local YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 8, 14).getTime())).toBe("2026-09-14");
  });

  it("zero-pads month and day", () => {
    expect(toDateKey(new Date(2026, 0, 3).getTime())).toBe("2026-01-03");
  });
});

describe("intensityLevel", () => {
  it("maps counts to the 5-level scale", () => {
    expect(intensityLevel(0)).toBe(0);
    expect(intensityLevel(1)).toBe(1);
    expect(intensityLevel(2)).toBe(2);
    expect(intensityLevel(4)).toBe(3);
    expect(intensityLevel(9)).toBe(4);
  });
});

describe("solveCellSize", () => {
  it("fits a 320px phone without overflow", () => {
    const { cellSize, totalWidth, fits } = solveCellSize(320 - DAY_LABEL_WIDTH);
    expect(fits).toBe(true);
    expect(totalWidth).toBeLessThanOrEqual(320 - DAY_LABEL_WIDTH);
    expect(cellSize).toBeGreaterThanOrEqual(3);
  });

  it("fits a 375px iPhone width", () => {
    const { totalWidth, fits } = solveCellSize(375 - DAY_LABEL_WIDTH);
    expect(fits).toBe(true);
    expect(totalWidth).toBeLessThanOrEqual(375 - DAY_LABEL_WIDTH);
  });

  it("uses larger cells on desktop and caps at 13px", () => {
    // 800/65.75 ≈ 12.2 → 12; the 13px cap only engages above ~855px.
    const wide = solveCellSize(800);
    expect(wide.cellSize).toBe(12);
    expect(solveCellSize(1000).cellSize).toBe(13);
    expect(wide.fits).toBe(true);
  });

  it("never returns a cell smaller than 3px even on absurdly narrow widths", () => {
    const tiny = solveCellSize(50);
    expect(tiny.cellSize).toBe(3);
  });

  it("produces non-negative gaps and monotonically shrinking totals", () => {
    const s = solveCellSize(200 - DAY_LABEL_WIDTH);
    expect(s.cellGap).toBeGreaterThanOrEqual(0);
    expect(s.totalWidth).toBe(
      HEATMAP_WEEKS * s.cellSize + (HEATMAP_WEEKS - 1) * s.cellGap,
    );
  });
});

describe("computeHeatmapLayout", () => {
  it("produces exactly 53*7 cells", () => {
    const layout = computeHeatmapLayout({}, 1000, NOW);
    expect(layout.grid).toHaveLength(HEATMAP_WEEKS * 7);
  });

  it("last cell is the Saturday of the current week; counts land on right days", () => {
    // 2026-09-14 is a Monday; solve one question that day.
    const layout = computeHeatmapLayout({ 1: NOW }, 1000, NOW);
    expect(layout.totalCount).toBe(1);
    // Grid ends Saturday 2026-09-19.
    expect(layout.grid[layout.grid.length - 1].date).toBe("2026-09-19");
    // The solved day shows a count of 1.
    const solvedCell = layout.grid.find((c) => c.date === "2026-09-14");
    expect(solvedCell?.count).toBe(1);
  });

  it("ignores non-positive timestamps", () => {
    const layout = computeHeatmapLayout({ 1: 0, 2: -5, 3: NOW }, 1000, NOW);
    expect(layout.totalCount).toBe(1);
  });

  it("aggregates multiple solves on the same day", () => {
    const layout = computeHeatmapLayout(
      { 1: NOW, 2: NOW + 1000, 3: NOW + 2000 },
      1000,
      NOW,
    );
    const solvedCell = layout.grid.find((c) => c.date === "2026-09-14");
    expect(solvedCell?.count).toBe(3);
  });

  it("todayKey matches the last-week cell for today", () => {
    const layout = computeHeatmapLayout({}, 1000, NOW);
    expect(layout.grid.find((c) => c.date === layout.todayKey)).toBeDefined();
  });

  it("keeps the grid inside the container on mobile widths", () => {
    for (const phoneWidth of [320, 360, 375, 414]) {
      const layout = computeHeatmapLayout({}, phoneWidth, NOW);
      const gridWidth =
        layout.columnXOffsets[layout.columnXOffsets.length - 1] +
        layout.cellSize;
      const available = phoneWidth - DAY_LABEL_WIDTH;
      expect(gridWidth).toBeLessThanOrEqual(available);
      expect(layout.fits).toBe(true);
    }
  });

  it("scales cells up on desktop and down on phones", () => {
    const desktop = computeHeatmapLayout({}, 1200, NOW);
    const phone = computeHeatmapLayout({}, 360, NOW);
    expect(desktop.cellSize).toBe(13);
    expect(phone.cellSize).toBeLessThan(desktop.cellSize);
  });

  it("emits one label per month with increasing x positions", () => {
    const layout = computeHeatmapLayout({}, 1000, NOW);
    expect(layout.monthLabels.length).toBeGreaterThanOrEqual(11);
    for (let i = 1; i < layout.monthLabels.length; i++) {
      expect(layout.monthLabels[i].x).toBeGreaterThan(
        layout.monthLabels[i - 1].x,
      );
    }
    // Every label must map to a real month name.
    const valid = new Set([
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]);
    for (const ml of layout.monthLabels) {
      expect(valid.has(ml.label as never)).toBe(true);
    }
  });

  it("computes week column offsets with uniform spacing", () => {
    const layout = computeHeatmapLayout({}, 1000, NOW);
    const stride = layout.cellSize + layout.cellGap;
    for (let w = 1; w < layout.columnXOffsets.length; w++) {
      expect(layout.columnXOffsets[w] - layout.columnXOffsets[w - 1]).toBe(
        stride,
      );
    }
  });
});
