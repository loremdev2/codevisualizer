import { describe, expect, it } from "vitest";

import {
  curriculumStats,
  isPathComplete,
  isTemplateComplete,
  learningPaths,
  orderedPaths,
  pathCompletion,
  pathForTemplate,
  validatePathAssignments,
  type LearningPath,
  type LearningProgress,
} from "./paths";
import { algorithmTemplates } from "./templates";

const CORE_SEQUENCE = [
  "arrays",
  "two-pointers",
  "sliding-window",
  "recursion",
  "trees",
  "graphs",
  "dp",
];

function pathById(id: string): LearningPath {
  const path = learningPaths.find((candidate) => candidate.id === id);
  if (!path) throw new Error(`missing path ${id}`);
  return path;
}

/** Progress where every template in `path` has been traced. */
function completePath(path: LearningPath): LearningProgress {
  const progress: LearningProgress = {};
  for (const templateId of path.templateIds) {
    progress[templateId] = { traced: true };
  }
  return progress;
}

describe("path assignments", () => {
  it("every template belongs to exactly one path and every path references real templates", () => {
    expect(validatePathAssignments()).toEqual([]);
  });

  it("assigns all shipped templates", () => {
    const assigned = new Set(learningPaths.flatMap((path) => path.templateIds));
    expect(assigned.size).toBe(algorithmTemplates.length);
  });

  it("keeps the core sequence in the requested order", () => {
    const orders = CORE_SEQUENCE.map((id) => pathById(id).order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
  });

  it("sorts orderedPaths strictly by order with no gaps in position", () => {
    expect(orderedPaths.map((path) => path.order)).toEqual(
      orderedPaths.map((_, index) => index + 1),
    );
  });

  it("dp is live with memoization and table templates", () => {
    expect(pathById("dp").comingSoon).toBeUndefined();
    expect(pathById("dp").templateIds.length).toBeGreaterThan(0);
  });
});

describe("completion", () => {
  it("a path is complete when every template has been traced", () => {
    const arrays = pathById("arrays");
    const partial: LearningProgress = {};
    for (const templateId of arrays.templateIds) {
      partial[templateId] = { traced: true };
    }
    expect(isPathComplete(arrays, partial)).toBe(true);
    expect(isPathComplete(arrays, completePath(arrays))).toBe(true);
  });

  it("a live dp path completes once its templates are mastered", () => {
    expect(isPathComplete(pathById("dp"), {})).toBe(false);
    expect(isPathComplete(pathById("dp"), completePath(pathById("dp")))).toBe(true);
  });
});

describe("progress math", () => {
  it("pathCompletion counts mastered templates", () => {
    const arrays = pathById("arrays");
    expect(pathCompletion(arrays, {})).toEqual({ done: 0, total: arrays.templateIds.length });
    expect(pathCompletion(arrays, completePath(arrays))).toEqual({
      done: arrays.templateIds.length,
      total: arrays.templateIds.length,
    });
  });

  it("a live path with no progress reports zero done", () => {
    expect(pathCompletion(pathById("dp"), {})).toEqual({ done: 0, total: pathById("dp").templateIds.length });
  });

  it("curriculumStats excludes coming-soon paths", () => {
    const empty = curriculumStats({});
    expect(empty.pathsTotal).toBe(learningPaths.filter((path) => !path.comingSoon).length);
    expect(empty.pathsDone).toBe(0);

    const first = orderedPaths[0];
    const afterFirst = curriculumStats(completePath(first));
    expect(afterFirst.pathsDone).toBe(1);
  });

  it("isTemplateComplete mirrors traced", () => {
    expect(isTemplateComplete({}, "bubble-sort")).toBe(false);
    expect(isTemplateComplete({ "bubble-sort": { traced: true } }, "bubble-sort")).toBe(true);
  });

  it("pathForTemplate finds the owning path", () => {
    expect(pathForTemplate("bubble-sort")?.id).toBe("arrays");
    expect(pathForTemplate("nth-node-from-end")?.id).toBe("two-pointers");
    expect(pathForTemplate("two-sum")?.id).toBe("stacks-hashing");
    expect(pathForTemplate("does-not-exist")).toBeUndefined();
  });
});
