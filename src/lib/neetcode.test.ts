import { describe, expect, it } from "vitest";

import {
  leetcodeProblemUrl,
  neetcodeQuestions,
  neetcodeTopics,
  neetcodeTotal,
  validateNeetCode,
} from "./neetcode";
import { top150Templates } from "./top150-templates";

/**
 * Per-category question counts from the source tracker (Leetcode-Aman.xlsx),
 * after dropping non-LeetCode links (LinkedIn posts appended under Bit
 * Manipulation) and duplicate rows within a category. Hard-coding these counts
 * guards against transcription drift just like validateTop150() does.
 */
const EXPECTED_COUNTS: Record<string, number> = {
  "arrays-hashing": 51,
  "two-pointers": 17,
  "sliding-window": 12,
  stack: 17,
  "binary-search": 17,
  "linked-list": 26,
  trees: 34,
  tries: 3,
  "heap-priority-queue": 16,
  backtracking: 44,
  "advanced-graphs": 7,
  "1d-dp": 22,
  "2d-dp": 11,
  greedy: 14,
  intervals: 7,
  "math-geometry": 16,
  "bit-manipulation": 48,
};

describe("NeetCode Roadmap question bank", () => {
  it("validates cleanly: valid numbers, slugs, difficulties, no in-topic repeats", () => {
    expect(validateNeetCode()).toEqual([]);
  });

  it("has exactly the 17 tracker categories with the tracker's per-category counts", () => {
    expect(neetcodeTopics).toHaveLength(17);
    const counts = Object.fromEntries(neetcodeTopics.map((topic) => [topic.id, topic.questions.length]));
    expect(counts).toEqual(EXPECTED_COUNTS);
  });

  it("the flat list totals match the sum of the tracker's categories", () => {
    const sum = neetcodeTopics.reduce((total, topic) => total + topic.questions.length, 0);
    expect(neetcodeTotal).toBe(362);
    expect(neetcodeQuestions()).toHaveLength(neetcodeTotal);
    expect(sum).toBe(neetcodeTotal);
  });

  it("every topic ships at least one question", () => {
    for (const topic of neetcodeTopics) {
      expect(topic.questions.length, topic.title).toBeGreaterThan(0);
    }
  });

  it("covers 350 distinct problems (repeats across categories are intentional)", () => {
    const unique = new Set(neetcodeQuestions().map((question) => question.no));
    expect(unique.size).toBe(350);
  });

  it("resolves classic anchor questions to their categories", () => {
    const topicByTitle = (title: string) => neetcodeTopics.find((topic) => topic.title === title);

    expect(topicByTitle("Arrays and Hashing")?.questions.some((q) => q.no === 217)).toBe(true);
    expect(topicByTitle("Two Pointers")?.questions.some((q) => q.no === 125)).toBe(true);
    expect(topicByTitle("Linked List")?.questions.some((q) => q.no === 206)).toBe(true);
    expect(topicByTitle("Trees")?.questions.some((q) => q.no === 94)).toBe(true);
    expect(topicByTitle("1-D Dynamic Programming")?.questions.some((q) => q.no === 70)).toBe(true);
    expect(topicByTitle("Bit Manipulation")?.questions.some((q) => q.no === 191)).toBe(true);
  });

  it("builds canonical LeetCode URLs from slugs", () => {
    expect(leetcodeProblemUrl("contains-duplicate")).toBe(
      "https://leetcode.com/problems/contains-duplicate/",
    );
  });

  it("a healthy share of the bank is immediately traceable via shared Top 150 templates", () => {
    // Problem numbers are canonical across banks, so the Visualize button on a
    // NeetCode row lights up whenever the same number already has a verified
    // template in the Top Interview 150 registry. Assert the overlap is real
    // and material, not accidental.
    const traced = new Set(
      neetcodeQuestions()
        .filter((question) => top150Templates[question.no] !== undefined)
        .map((question) => question.no),
    );
    expect(traced.size).toBeGreaterThan(90);
  });
});
