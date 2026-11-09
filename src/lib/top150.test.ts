import { describe, expect, it } from "vitest";

import {
  leetcodeProblemUrl,
  top150Questions,
  top150Topics,
  top150Total,
  validateTop150,
} from "./top150";
import { top150Tags } from "./top150-tags";
import { top150Brutes } from "./top150-brutes";

describe("Top Interview 150 question bank", () => {
  it("validates cleanly: 150 unique questions with valid slugs and difficulties", () => {
    expect(validateTop150()).toEqual([]);
  });

  it("has exactly the 23 official study-plan topics", () => {
    expect(top150Topics).toHaveLength(23);
  });

  it("every topic ships at least one question", () => {
    for (const topic of top150Topics) {
      expect(topic.questions.length, topic.title).toBeGreaterThan(0);
    }
  });

  it("the flat list totals 150 questions", () => {
    expect(top150Questions()).toHaveLength(top150Total);
    expect(top150Total).toBe(150);
  });

  it("the classic anchor questions live in the expected topics", () => {
    const topicByTitle = (title: string) => top150Topics.find((topic) => topic.title === title);

    expect(topicByTitle("Array / String")?.questions.some((q) => q.no === 88)).toBe(true);
    expect(topicByTitle("Two Pointers")?.questions.some((q) => q.no === 15)).toBe(true);
    expect(topicByTitle("Hashmap")?.questions.some((q) => q.no === 1)).toBe(true);
    expect(topicByTitle("Binary Tree General")?.questions.some((q) => q.no === 226)).toBe(true);
    expect(topicByTitle("1D DP")?.questions.some((q) => q.no === 70)).toBe(true);
  });

  it("every question has algorithm tags", () => {
    const missing = top150Questions()
      .filter((question) => top150Tags(question.no).length === 0)
      .map((question) => question.no);
    expect(missing).toEqual([]);
  });

  it("every brute-force variant maps to a question in the bank", () => {
    for (const no of Object.keys(top150Brutes)) {
      expect(top150Questions().some((q) => q.no === Number(no)), `#${no}`).toBe(true);
    }
  });

  it("builds canonical LeetCode URLs from slugs", () => {
    expect(leetcodeProblemUrl("two-sum")).toBe("https://leetcode.com/problems/two-sum/");
  });
});
