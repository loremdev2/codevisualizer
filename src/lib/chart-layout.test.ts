import { describe, expect, it } from "vitest";

import {
  computeBarChartLayout,
  BAR_MAX_H,
  MAX_BAR_W,
  MIN_BAR_W,
  TOP_PAD,
  LABEL_SPACE,
} from "./chart-layout";

describe("computeBarChartLayout", () => {
  it("fits 12 bars into a 320px phone width", () => {
    const layout = computeBarChartLayout(320, 12);
    expect(layout.fits).toBe(true);
    expect(layout.chartWidth).toBeLessThanOrEqual(320);
    expect(layout.barWidth).toBeGreaterThanOrEqual(MIN_BAR_W);
  });

  it("fits 12 bars into a 375px iPhone width", () => {
    const layout = computeBarChartLayout(375, 12);
    expect(layout.fits).toBe(true);
    expect(layout.barWidth).toBeGreaterThan(MIN_BAR_W);
  });

  it("caps bar width on desktop instead of stretching", () => {
    const layout = computeBarChartLayout(1200, 12);
    expect(layout.barWidth).toBe(MAX_BAR_W);
    expect(layout.chartWidth).toBeLessThan(1200);
    expect(layout.fits).toBe(true);
  });

  it("never returns a bar narrower than the floor", () => {
    // 80px input clamps up to the 120px minimum, where 12 bars still fit at
    // 7px — the floor only engages with far more buckets than fit.
    expect(computeBarChartLayout(120, 52).barWidth).toBe(MIN_BAR_W);
    expect(computeBarChartLayout(80, 12).barWidth).toBe(7);
  });

  it("uses the full height budget: top pad + bars + label space", () => {
    const layout = computeBarChartLayout(400, 12);
    expect(layout.chartHeight).toBe(TOP_PAD + BAR_MAX_H + LABEL_SPACE);
  });

  it("shows every label on desktop and thins on phones", () => {
    expect(computeBarChartLayout(1200, 12).labelEvery).toBe(1);
    const phone = computeBarChartLayout(320, 12);
    // With ~30px per label and <300px of usable width, labels must be thinned.
    expect(phone.labelEvery).toBeGreaterThan(1);
  });

  it("handles a single bar without dividing by zero", () => {
    const layout = computeBarChartLayout(400, 1);
    expect(layout.barWidth).toBe(MAX_BAR_W);
    expect(layout.chartWidth).toBeGreaterThan(0);
    expect(layout.fits).toBe(true);
  });

  it("handles tiny bucket counts and absurd widths gracefully", () => {
    for (const width of [0, 10, 50, 2000]) {
      for (const n of [1, 4, 12, 52]) {
        const layout = computeBarChartLayout(width, n);
        expect(layout.barWidth).toBeGreaterThanOrEqual(MIN_BAR_W);
        expect(layout.chartHeight).toBe(TOP_PAD + BAR_MAX_H + LABEL_SPACE);
        expect(layout.labelEvery).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("chart width accounts for every bar and gap", () => {
    const layout = computeBarChartLayout(400, 12);
    expect(layout.chartWidth).toBe(
      12 * layout.barWidth + 13 * layout.gap,
    );
  });
});
