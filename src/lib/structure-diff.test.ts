import { describe, expect, it } from "vitest";
import {
  changedIndices,
  diffMaps,
  uniqueAdditions,
  uniqueRemovals,
} from "./structure-diff";

describe("diffMaps", () => {
  it("detects added, updated, and removed entries", () => {
    const diff = diffMaps(
      { 2: 0, 7: 1, 11: 2 },
      { 2: 0, 7: 2, 13: 5 },
    );
    expect(diff.added).toEqual([["13", 5]]);
    expect(diff.updated).toEqual([["7", 2]]);
    expect(diff.removed).toEqual([["11", 2]]);
  });

  it("treats missing previous as all-added", () => {
    const diff = diffMaps(undefined, { a: 1, b: 2 });
    expect(diff.added).toEqual([
      ["a", 1],
      ["b", 2],
    ]);
    expect(diff.updated).toEqual([]);
    expect(diff.removed).toEqual([]);
  });

  it("keeps insertion order of the current map", () => {
    const diff = diffMaps({ z: 9 }, { b: 2, a: 1 });
    expect(diff.added.map(([key]) => key)).toEqual(["b", "a"]);
  });
});

describe("changedIndices", () => {
  it("finds differing positions between two snapshots", () => {
    expect(changedIndices([1, 2, 3, 4], [1, 9, 3, 4])).toEqual([1]);
    expect(changedIndices([1, 2], [2, 1])).toEqual([0, 1]);
  });

  it("treats length growth as changed tail", () => {
    expect(changedIndices([1, 2], [1, 2, 3])).toEqual([2]);
  });

  it("handles missing previous", () => {
    expect(changedIndices(undefined, [1, 2, 3])).toEqual([0, 1, 2]);
  });
});

describe("uniqueAdditions / uniqueRemovals", () => {
  it("finds set-like additions and removals by identity", () => {
    expect(uniqueAdditions([1, 2, 3], [1, 2, 3, 4])).toEqual([4]);
    expect(uniqueRemovals([1, 2, 3, 4], [1, 2, 3])).toEqual([4]);
  });

  it("is stable across value types", () => {
    const added = uniqueAdditions(["A", "B"], ["A", "B", "C", "D"]);
    expect(added).toEqual(["C", "D"]);
  });

  it("ignores duplicates within the same snapshot", () => {
    expect(uniqueAdditions([1], [1, 1, 2])).toEqual([2]);
  });
});
