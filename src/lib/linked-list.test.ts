import { describe, expect, it } from "vitest";

import { algorithmTemplates } from "./templates";
import type { AlgorithmTemplate, LinkedListStep, VisualStep } from "@/types/visualizer";
import { normalizeSteps, runTraceInNode } from "./trace-runner";

function byId(id: string): AlgorithmTemplate {
  const template = algorithmTemplates.find((candidate) => candidate.id === id);
  if (!template) throw new Error(`Missing template ${id}`);
  return template;
}

async function trace(
  template: AlgorithmTemplate,
  input: Record<string, unknown> = template.input,
): Promise<{ steps: VisualStep[]; result: unknown }> {
  const message = await runTraceInNode(template.code, JSON.stringify(input));
  expect(message.ok, `${template.id}: ${message.error ?? ""}`).toBe(true);
  return { steps: normalizeSteps(message.steps ?? []), result: message.result };
}

const node = (val: number, next: unknown) => ({ val, next });

function list(values: number[]): unknown {
  let result: unknown = null;
  for (let index = values.length - 1; index >= 0; index--) {
    result = node(values[index], result);
  }
  return result;
}

const llSteps = (steps: VisualStep[]) =>
  steps.filter((step): step is VisualStep & { linkedList: LinkedListStep } => step.linkedList !== undefined);

describe("linked-list capture", () => {
  it("reverse: emits linkedList steps with stable node ids", async () => {
    const { steps } = await trace(byId("reverse-linked-list"), { head: list([1, 2, 3, 4]) });
    const linked = llSteps(steps);
    expect(linked.length).toBeGreaterThan(0);

    // Ids are stable across the run — node 0 is always value 1.
    for (const step of linked) {
      expect(step.linkedList.values["0"]).toBe(1);
      expect(step.linkedList.values["1"]).toBe(2);
      expect(step.linkedList.values["2"]).toBe(3);
      expect(step.linkedList.values["3"]).toBe(4);
    }
  });

  it("reverse: head and prev chains exist and links flip as the reversal runs", async () => {
    const { steps } = await trace(byId("reverse-linked-list"), { head: list([1, 2, 3]) });
    const linked = llSteps(steps);

    // The `head` chain starts 0→1→2 and ends as a single node; `prev` grows
    // into the reversed list 2→1→0.
    const first = linked[0];
    expect(first.linkedList.lists.head.order).toEqual([0, 1, 2]);

    const last = linked[linked.length - 1];
    expect(last.linkedList.lists.prev.order).toEqual([2, 1, 0]);
    expect(last.linkedList.lists.head.order).toEqual([0]);
    expect(last.linkedList.next["0"]).toBeNull();

    // Some step redirected node 0's link away from node 1 (to null).
    const flips = linked.filter((step) => step.linkedList.changedLink?.node === 0);
    expect(flips.length).toBeGreaterThan(0);
    expect(flips[0].linkedList.changedLink).toMatchObject({ node: 0, previousTo: 1, to: null });
  });

  it("reverse: curr starts as a pointer arrow, then becomes the remaining-list row", async () => {
    const { steps } = await trace(byId("reverse-linked-list"), { head: list([1, 2, 3]) });
    const linked = llSteps(steps);
    const withPointers = linked.filter((step) => Object.keys(step.linkedList.pointers).length > 0);
    expect(withPointers.length).toBeGreaterThan(0);
    // Early on curr is a pointer onto the head chain.
    const early = linked.find((step) => step.linkedList.pointers.curr !== undefined);
    expect(early).toBeDefined();
    // Once links are rewritten, curr holds the not-yet-reversed remainder.
    const currRow = linked.find((step) => step.linkedList.lists.curr);
    expect(currRow).toBeDefined();
    expect(currRow?.linkedList.lists.curr?.order).toEqual([1, 2]);
  });

  it("reverse: writes counter grows with link flips", async () => {
    const { steps } = await trace(byId("reverse-linked-list"), { head: list([1, 2, 3, 4]) });
    const linked = llSteps(steps);
    const finalOps = linked[linked.length - 1].ops;
    expect(finalOps?.writes ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("floyd's: a cyclic list is captured without crashing and reports the cycle start", async () => {
    const template = byId("floyds-cycle-detection");
    // 1 → 2 → 3 → 4 → (back to 2): cycleStart should be node 1 (value 2).
    const head = node(1, node(2, node(3, node(4, null))));
    const { steps } = await trace(template, { head, cycleAt: 1 });

    const linked = llSteps(steps);
    // The cycle builder + detector both capture the list; some step must
    // carry the loop-back marker.
    const withCycle = linked.filter((step) => step.linkedList.lists.head?.cycleStart !== undefined);
    expect(withCycle.length).toBeGreaterThan(0);
    expect(withCycle[0].linkedList.lists.head.cycleStart).toBe(1);
    // The tail's next points back into the list, not null.
    const tailNext = withCycle[withCycle.length - 1].linkedList.next["3"];
    expect(tailNext).toBe(1);
  });

  it("floyd's: returns the meeting node for a cyclic list", async () => {
    const template = byId("floyds-cycle-detection");
    const head = node(1, node(2, node(3, node(4, node(5, null)))));
    const { result } = await trace(template, { head, cycleAt: 1 });
    // Node results are converted to LeetCode arrays — the cycle walked from
    // the meeting node (each cycle value appears exactly once).
    expect(Array.isArray(result)).toBe(true);
    const values = result as number[];
    expect(values.length).toBe(4);
    expect(values.every((value) => [2, 3, 4, 5].includes(value))).toBe(true);
  });

  it("merge: both input lists and the dummy result render as chain rows", async () => {
    const template = byId("merge-two-sorted-lists");
    const { steps } = await trace(template, {
      l1: list([1, 3]),
      l2: list([2, 4]),
    });
    const linked = llSteps(steps);
    const withRows = linked.find((step) => step.linkedList.lists.dummy && step.linkedList.lists.l1 && step.linkedList.lists.l2);
    expect(withRows).toBeDefined();
    // The merged dummy chain is 0 → 1 → 2 → 3 → 4.
    const dummyOrder = linked[linked.length - 1].linkedList.lists.dummy.order;
    expect(dummyOrder.length).toBe(5);
    expect(linked[linked.length - 1].linkedList.values[dummyOrder[1]]).toBe(1);
    expect(linked[linked.length - 1].linkedList.values[dummyOrder[4]]).toBe(4);
  });
});

describe("linked-list templates (golden results)", () => {
  it("reverse: result is the reversed list 4→3→2→1", async () => {
    const template = byId("reverse-linked-list");
    const { result } = await trace(template, { head: list([1, 2, 3, 4]) });
    expect(result).toEqual([4, 3, 2, 1]);
  });

  it("middle: odd list returns the center, even list returns the second center", async () => {
    const middle = byId("middle-of-linked-list");
    expect((await trace(middle, { head: list([1, 2, 3, 4, 5]) })).result).toEqual([3, 4, 5]);
    expect((await trace(middle, { head: list([1, 2, 3, 4]) })).result).toEqual([3, 4]);
  });

  it("nth from end: returns the nth node from the tail", async () => {
    const nth = byId("nth-node-from-end");
    const { result } = await trace(nth, { head: list([1, 2, 3, 4, 5, 6]), n: 2 });
    expect(result).toEqual([5, 6]);
  });

  it("merge: returns the merged sorted list", async () => {
    const merge = byId("merge-two-sorted-lists");
    const { result } = await trace(merge, { l1: list([1, 3, 5]), l2: list([2, 4]) });
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it("floyd's: returns null for an acyclic list", async () => {
    const floyds = byId("floyds-cycle-detection");
    const { result } = await trace(floyds, { head: list([1, 2, 3, 4]), cycleAt: null });
    expect(result).toBeNull();
  });
});
