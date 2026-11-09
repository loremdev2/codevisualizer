import { INDEX_POINTER_NAMES } from "@/lib/pointers";
import type { VisualStep } from "@/types/visualizer";

export type ChangeKind =
  | "swap"
  | "write-array"
  | "write-matrix"
  | "visit-matrix"
  | "write-string"
  | "map"
  | "visit"
  | "call"
  | "return"
  | "pointer"
  | "link"
  | "node-value";

export type ChangeDescription = {
  kind: ChangeKind;
  sentence: string;
  /** Swap pair (array indices). */
  indices?: [number, number];
  /** Single written array index. */
  arrayIndex?: number;
  /** Matrix cell written / visited. */
  cell?: { row: number; col: number };
  /** Graph node visited. */
  node?: string;
  /** Hash-map key touched. */
  mapKey?: string;
};

function fmt(value: unknown): string {
  if (value === undefined) return "?";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function fmtTarget(target: number | null | undefined): string {
  return target === null || target === undefined ? "null" : `#${target}`;
}

export function swapSentence(name: string, i: number, j: number, a: unknown, b: unknown) {
  return `Swapped ${name}[${i}] (${fmt(a)}) with ${name}[${j}] (${fmt(b)})`;
}

export function writeSentence(name: string, i: number, value: unknown) {
  return `Wrote ${name}[${i}] = ${fmt(value)}`;
}

/**
 * Describes the most concrete change a step made versus the previous step —
 * structure writes first, then pointer movement, then reads/visits. Returns
 * null for steps that changed nothing visible (branch checks, console lines).
 */
export function describeChange(step: VisualStep | undefined, previous: VisualStep | undefined): ChangeDescription | null {
  if (!step) return null;

  // Branch and console steps carry their own explanation in `note`.
  if (step.title === "Branch" || step.title === "Console") return null;

  const arrayName = step.arrayName ?? "arr";

  // Array swap / write.
  if (step.array && previous?.array) {
    const changed: number[] = [];
    const length = Math.max(previous.array.length, step.array.length);
    for (let index = 0; index < length; index++) {
      if (previous.array[index] !== step.array[index]) changed.push(index);
    }
    if (
      changed.length === 2 &&
      previous.array[changed[0]] === step.array[changed[1]] &&
      previous.array[changed[1]] === step.array[changed[0]]
    ) {
      const [a, b] = [changed[0], changed[1]];
      return {
        kind: "swap",
        indices: [a, b],
        sentence: swapSentence(arrayName, a, b, previous.array[a], previous.array[b]),
      };
    }
    if (changed.length === 1) {
      const index = changed[0];
      return {
        kind: "write-array",
        arrayIndex: index,
        sentence: writeSentence(arrayName, index, step.array[index]),
      };
    }
    if (changed.length > 1) {
      return { kind: "write-array", sentence: `Updated ${changed.length} positions in ${arrayName}` };
    }
  }

  // Matrix write or visit.
  if (step.matrix) {
    const changed = step.changedCells ?? [];
    if (changed.length === 1) {
      const cell = changed[0];
      return {
        kind: "write-matrix",
        cell: { row: cell.row, col: cell.col },
        sentence: `Wrote cell [${cell.row},${cell.col}] = ${fmt(cell.value)}`,
      };
    }
    if (changed.length > 1) {
      return { kind: "write-matrix", sentence: `Updated ${changed.length} cells` };
    }
    if (step.activeCell) {
      const { row, col } = step.activeCell;
      return { kind: "visit-matrix", cell: { row, col }, sentence: `Visiting cell [${row},${col}]` };
    }
  }

  // String write.
  if (step.string && previous?.string !== undefined) {
    const changed: number[] = [];
    const length = Math.max(previous.string.length, step.string.length);
    for (let index = 0; index < length; index++) {
      if (previous.string[index] !== step.string[index]) changed.push(index);
    }
    if (changed.length === 1) {
      const index = changed[0];
      const from = previous.string[index] ?? "";
      return {
        kind: "write-string",
        arrayIndex: index,
        sentence: `Wrote index ${index} (${fmt(from)} → ${fmt(step.string[index])})`,
      };
    }
    if (changed.length > 1) {
      return { kind: "write-string", sentence: `Updated ${changed.length} characters` };
    }
  }

  // Linked-list change: link flip first (the reversal/merge core), then a
  // value write, then pointer movement onto a node.
  if (step.linkedList) {
    const linkedList = step.linkedList;
    const previousLinkedList = previous?.linkedList;
    if (linkedList.changedLink) {
      const { node, to, previousTo } = linkedList.changedLink;
      return {
        kind: "link",
        sentence: `Redirected #${node}'s link: ${fmtTarget(previousTo)} → ${fmtTarget(to)}`,
      };
    }
    if (linkedList.changedValue !== null && linkedList.changedValue !== undefined) {
      return {
        kind: "node-value",
        sentence: `Updated node #${linkedList.changedValue} → ${fmt(linkedList.values[linkedList.changedValue])}`,
      };
    }
    if (previousLinkedList) {
      for (const [name, nodeId] of Object.entries(linkedList.pointers)) {
        const previousNodeId = previousLinkedList.pointers[name];
        if (previousNodeId !== undefined && previousNodeId !== nodeId) {
          return {
            kind: "pointer",
            sentence:
              nodeId === null
                ? `${name} → null`
                : `Moved ${name} → node #${nodeId} (${fmt(linkedList.values[nodeId])})`,
          };
        }
      }
    }
  }

  // Binary-tree change: a value write, then a walker moving onto a node.
  if (step.tree) {
    const tree = step.tree;
    const previousTree = previous?.tree;
    if (tree.changedValue !== null && tree.changedValue !== undefined) {
      return {
        kind: "node-value",
        sentence: `Updated node #${tree.changedValue} → ${fmt(tree.values[tree.changedValue])}`,
      };
    }
    if (previousTree) {
      for (const [name, nodeId] of Object.entries(tree.pointers)) {
        const previousNodeId = previousTree.pointers[name];
        if (previousNodeId !== undefined && previousNodeId !== nodeId) {
          return {
            kind: "pointer",
            sentence:
              nodeId === null
                ? `${name} → null`
                : `Moved ${name} → node #${nodeId} (${fmt(tree.values[nodeId])})`,
          };
        }
      }
    }
  }

  // Hash-map change (first differing entry).
  if (step.hashMap && previous?.hashMap) {
    const name = step.hashMapName ?? "map";
    for (const [key, value] of Object.entries(step.hashMap)) {
      if (previous.hashMap[key] !== value) {
        return {
          kind: "map",
          mapKey: key,
          sentence:
            previous.hashMap[key] === undefined
              ? `Set ${name}[${key}] = ${fmt(value)}`
              : `Updated ${name}[${key}] → ${fmt(value)}`,
        };
      }
    }
  }

  // Graph discovery / visit.
  if (step.activeNode !== undefined) {
    const node = String(step.activeNode);
    const previousVisited = new Set((previous?.visited ?? []).map(String));
    const isNew = !previousVisited.has(node);
    return {
      kind: "visit",
      node,
      sentence: isNew ? `Discovered node ${node}` : `Visiting node ${node}`,
    };
  }

  // Function calls and returns.
  if (step.title?.startsWith("Call")) {
    return { kind: "call", sentence: step.note?.replace(/^Call\s+/, "") ?? `Called function` };
  }
  if (step.title === "Return") {
    return {
      kind: "return",
      sentence: step.note?.startsWith("Return") ? step.note : `Returned ${fmt(step.result)}`,
    };
  }

  // Pointer movement (only when nothing more concrete happened this step).
  if (step.pointers && previous?.pointers) {
    for (const name of INDEX_POINTER_NAMES) {
      const before = previous.pointers[name];
      const after = step.pointers[name];
      if (typeof before === "number" && typeof after === "number" && before !== after) {
        return { kind: "pointer", sentence: `${name} moved ${before} → ${after}` };
      }
    }
  }

  return null;
}

/** One-line natural-language explanation of what changed at this step. */
export function explainStep(step: VisualStep | undefined, previous: VisualStep | undefined): string | null {
  const description = describeChange(step, previous);
  if (!description) return null;
  if (description.kind === "call") return `Called ${description.sentence}`;
  return description.sentence;
}
