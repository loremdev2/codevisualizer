import type { VisualStep } from "@/types/visualizer";

export type CallNode = {
  label: string;
  children: CallNode[];
  returned: boolean;
  /** Source text of the return statement (without the leading `return`). */
  returnExpr?: string;
  /** Actual value the call produced, formatted (captured by the worker). */
  returnValue?: string;
  /** 1-based order in which this call was made. */
  order: number;
};

/**
 * Builds the recursion/call tree from the sequence of step call stacks.
 *
 * Frames that left the stack between steps are no longer active; frames that
 * grew are created under their caller. A "Return" step still carries the
 * leaving frame as the top of the stack (the worker emits before popping), so
 * that's where the returned ✓, the return expression, and the actual return
 * value get attached.
 */
export function buildCallTree(steps: VisualStep[]): CallNode[] {
  const roots: CallNode[] = [];
  const path: CallNode[] = [];
  let nextOrder = 0;

  for (const step of steps) {
    const frames = step.callStack ?? [];

    // Align the path to the new frame list. The worker emits a Return step
    // *before* popping, so a returning call is followed directly by its
    // caller's next statement — the stack never passes through empty between
    // a return and a sibling call at the same depth. Popping only on length
    // would leave the old label on the path, so also pop while the top label
    // no longer matches the frame at that position.
    while (path.length > 0) {
      const frame = frames[path.length - 1];
      if (frame !== undefined && String(frame) === path[path.length - 1].label) break;
      path.pop();
    }

    // Grow to match: find-or-create each frame under its caller.
    while (path.length < frames.length) {
      const label = String(frames[path.length]);
      const parent = path.length > 0 ? path[path.length - 1] : undefined;
      const siblings = parent ? parent.children : roots;
      let node = siblings.find((candidate) => candidate.label === label);
      if (!node) {
        node = { label, children: [], returned: false, order: ++nextOrder };
        siblings.push(node);
      }
      path.push(node);
    }

    if (step.title === "Return" && path.length > 0) {
      const leaving = path[path.length - 1];
      leaving.returned = true;
      const note = step.note;
      if (typeof note === "string" && note.startsWith("return ")) {
        leaving.returnExpr = note.slice("return ".length);
      } else if (typeof note === "string" && note.startsWith("return")) {
        leaving.returnExpr = note.slice("return".length);
      }
      if (step.returnValue !== undefined) leaving.returnValue = step.returnValue;
    }
  }

  return roots;
}

export function findActivePath(nodes: CallNode[], frames: Array<string | number>): CallNode[] {
  const active: CallNode[] = [];
  let level = nodes;
  for (const frame of frames) {
    const node = level.find((candidate) => candidate.label === String(frame));
    if (!node) break;
    active.push(node);
    level = node.children;
  }
  return active;
}
