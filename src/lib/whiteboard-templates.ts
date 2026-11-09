import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";

// ---------------------------------------------------------------------------
// DSA starter templates — proper visual representations
//
// - Linked list: boxes in a row, arrows right→left between them
// - Doubly linked list: arrows both directions
// - Binary tree: circles in a pyramid, arrows bottom→top to children
// - Graph: circles with edges
// - Stack: vertical boxes
// - Queue: horizontal boxes
// - Array: indexed cells
// - Hash map: buckets with entries
// ---------------------------------------------------------------------------

export type DsaTemplate = {
  id: string;
  label: string;
  description: string;
  elements: ExcalidrawElementSkeleton[];
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const NW = 80; // node width (rectangles)
const NH = 48; // node height (rectangles)
const CW = 64; // circle diameter
const CH = 64;

// ---------------------------------------------------------------------------
// Shape helpers
// ---------------------------------------------------------------------------

function rect(
  id: string,
  x: number,
  y: number,
  text: string,
  w = NW,
  h = NH,
  fill = "transparent",
  stroke = "#1e1e1e",
): ExcalidrawElementSkeleton {
  return {
    type: "rectangle",
    id,
    x,
    y,
    width: w,
    height: h,
    strokeColor: stroke,
    backgroundColor: fill,
    fillStyle: fill !== "transparent" ? "solid" : "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    label: { text, fontSize: 16 },
  };
}

function circle(
  id: string,
  x: number,
  y: number,
  text: string,
  w = CW,
  h = CH,
  fill = "transparent",
  stroke = "#1e1e1e",
): ExcalidrawElementSkeleton {
  return {
    type: "ellipse",
    id,
    x,
    y,
    width: w,
    height: h,
    strokeColor: stroke,
    backgroundColor: fill,
    fillStyle: fill !== "transparent" ? "solid" : "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    label: { text, fontSize: 16 },
  };
}

function textLabel(
  x: number,
  y: number,
  value: string,
  fontSize = 16,
  stroke = "#868e96",
): ExcalidrawElementSkeleton {
  return {
    type: "text",
    x,
    y,
    text: value,
    fontSize,
    strokeColor: stroke,
    opacity: 100,
    roughness: 1,
  };
}

// ---------------------------------------------------------------------------
// Arrow helpers — different connection styles for different structures
// ---------------------------------------------------------------------------

/** Horizontal arrow: right-center of source → left-center of target (for linked list / queue). */
function hArrow(
  fromId: string,
  toId: string,
  from: { x: number; y: number; w: number; h: number },
  to: { x: number; y: number; w: number; h: number },
  opts?: { label?: string; directed?: boolean },
): ExcalidrawElementSkeleton {
  const sx = from.x + from.w;
  const sy = from.y + from.h / 2;
  const ex = to.x;
  const ey = to.y + to.h / 2;
  const dx = ex - sx;
  const dy = ey - sy;

  return {
    type: "arrow",
    x: sx,
    y: sy,
    width: Math.abs(dx) || 1,
    height: Math.abs(dy) || 1,
    points: [
      [0, 0],
      [dx, dy],
    ],
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    startBinding: { elementId: fromId, focus: 0, gap: 5 },
    endBinding: { elementId: toId, focus: 0, gap: 5 },
    startArrowhead: null,
    endArrowhead: opts?.directed === false ? null : "arrow",
    ...(opts?.label ? { label: { text: opts.label, fontSize: 14 } } : {}),
  };
}

/** Vertical arrow: bottom-center of source → top-center of target (for stack). */
function vArrow(
  fromId: string,
  toId: string,
  from: { x: number; y: number; w: number; h: number },
  to: { x: number; y: number; w: number; h: number },
  opts?: { label?: string; directed?: boolean },
): ExcalidrawElementSkeleton {
  const sx = from.x + from.w / 2;
  const sy = from.y + from.h;
  const ex = to.x + to.w / 2;
  const ey = to.y;
  const dx = ex - sx;
  const dy = ey - sy;

  return {
    type: "arrow",
    x: sx,
    y: sy,
    width: Math.abs(dx) || 1,
    height: Math.abs(dy) || 1,
    points: [
      [0, 0],
      [dx, dy],
    ],
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    startBinding: { elementId: fromId, focus: 0, gap: 5 },
    endBinding: { elementId: toId, focus: 0, gap: 5 },
    startArrowhead: null,
    endArrowhead: opts?.directed === false ? null : "arrow",
    ...(opts?.label ? { label: { text: opts.label, fontSize: 14 } } : {}),
  };
}

/** Diagonal arrow: bottom-center of source → top-center of target (for tree). */
function tArrow(
  fromId: string,
  toId: string,
  from: { x: number; y: number; w: number; h: number },
  to: { x: number; y: number; w: number; h: number },
  opts?: { label?: string; directed?: boolean },
): ExcalidrawElementSkeleton {
  // Bottom-center of parent
  const sx = from.x + from.w / 2;
  const sy = from.y + from.h;
  // Top-center of child
  const ex = to.x + to.w / 2;
  const ey = to.y;
  const dx = ex - sx;
  const dy = ey - sy;

  return {
    type: "arrow",
    x: sx,
    y: sy,
    width: Math.abs(dx) || 1,
    height: Math.abs(dy) || 1,
    points: [
      [0, 0],
      [dx, dy],
    ],
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    startBinding: { elementId: fromId, focus: 0, gap: 4 },
    endBinding: { elementId: toId, focus: 0, gap: 4 },
    startArrowhead: null,
    endArrowhead: opts?.directed === false ? null : "arrow",
    ...(opts?.label ? { label: { text: opts.label, fontSize: 14 } } : {}),
  };
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

// -- Linked List (singly) ---------------------------------------------------

function linkedList(): ExcalidrawElementSkeleton[] {
  const fill = "#a5d8ff";
  const stroke = "#1971c2";
  const vals = ["12", "99", "37"];
  const elements: ExcalidrawElementSkeleton[] = [];

  const nodeW = NW + 16; // slightly wider for readability
  const nodeH = NH;
  const gap = 64; // space for arrows between nodes

  const nodes: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
  vals.forEach((val, i) => {
    const x = i * (nodeW + gap);
    nodes.push({ id: `ll-${i}`, x, y: 0, w: nodeW, h: nodeH });
    elements.push(rect(`ll-${i}`, x, 0, val, nodeW, nodeH, fill, stroke));
  });

  // Null terminator
  const nullX = vals.length * (nodeW + gap);
  nodes.push({ id: "ll-n", x: nullX, y: 0, w: nodeW, h: nodeH });
  elements.push(rect("ll-n", nullX, 0, "null", nodeW, nodeH, "#dee2e6", "#868e96"));

  // "head" label
  elements.push(textLabel(18, -40, "head ↓"));

  // Arrows: right → left
  for (let i = 0; i < nodes.length - 1; i++) {
    elements.push(
      hArrow(nodes[i].id, nodes[i + 1].id, nodes[i], nodes[i + 1], { label: "next" }),
    );
  }

  return elements;
}

// -- Doubly Linked List ------------------------------------------------------

function doublyLinkedList(): ExcalidrawElementSkeleton[] {
  const fill = "#b2f2bb";
  const stroke = "#2f9e44";
  const vals = ["A", "B", "C"];
  const elements: ExcalidrawElementSkeleton[] = [];

  const nodeW = NW + 16;
  const nodeH = NH;
  const gap = 64;

  const nodes: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
  vals.forEach((val, i) => {
    const x = i * (nodeW + gap);
    nodes.push({ id: `dll-${i}`, x, y: 0, w: nodeW, h: nodeH });
    elements.push(rect(`dll-${i}`, x, 0, val, nodeW, nodeH, fill, stroke));
  });

  // Labels
  elements.push(textLabel(18, -40, "head"));
  elements.push(textLabel((vals.length - 1) * (nodeW + gap) + 18, -40, "tail"));

  // Forward arrows (top row, right → left)
  for (let i = 0; i < nodes.length - 1; i++) {
    elements.push(hArrow(nodes[i].id, nodes[i + 1].id, nodes[i], nodes[i + 1]));
  }

  // Backward arrows (bottom row, left → right)
  for (let i = nodes.length - 1; i > 0; i--) {
    const from = { ...nodes[i], y: nodes[i].y + nodeH + 20 };
    const to = { ...nodes[i - 1], y: nodes[i - 1].y + nodeH + 20 };
    elements.push(
      hArrow(nodes[i].id, nodes[i - 1].id, from, to, { label: "prev" }),
    );
  }

  return elements;
}

// -- Binary Tree (3 levels, 7 nodes) ----------------------------------------

function binaryTree(): ExcalidrawElementSkeleton[] {
  const fill = "#ffec99";
  const stroke = "#e8590c";
  const elements: ExcalidrawElementSkeleton[] = [];

  // Tree layout: root at top, children below
  // Level 0: root at x=210 (center of 420-wide canvas)
  // Level 1: children at x=80, x=340
  // Level 2: grandchildren at x=20, x=140, x=280, x=400
  const layout: Array<{
    id: string;
    x: number;
    y: number;
    val: string;
    children: string[];
  }> = [
    { id: "bt-0", x: 210, y: 0, val: "8", children: ["bt-1", "bt-2"] },
    { id: "bt-1", x: 80, y: 120, val: "3", children: ["bt-3", "bt-4"] },
    { id: "bt-2", x: 340, y: 120, val: "10", children: ["bt-5", "bt-6"] },
    { id: "bt-3", x: 20, y: 240, val: "1", children: [] },
    { id: "bt-4", x: 140, y: 240, val: "6", children: [] },
    { id: "bt-5", x: 280, y: 240, val: "9", children: [] },
    { id: "bt-6", x: 400, y: 240, val: "14", children: [] },
  ];

  const posMap = new Map<string, { x: number; y: number }>();
  for (const n of layout) {
    posMap.set(n.id, { x: n.x, y: n.y });
    elements.push(circle(n.id, n.x, n.y, n.val, CW, CH, fill, stroke));
  }

  // Arrows: bottom-center of parent → top-center of child
  for (const n of layout) {
    for (const childId of n.children) {
      const child = posMap.get(childId)!;
      elements.push(
        tArrow(n.id, childId, { x: n.x, y: n.y, w: CW, h: CH }, { x: child.x, y: child.y, w: CW, h: CH }),
      );
    }
  }

  return elements;
}

// -- Weighted Graph (5 nodes in pentagon) ------------------------------------

function graph(): ExcalidrawElementSkeleton[] {
  const fill = "#fcc2d7";
  const stroke = "#c2255c";
  const elements: ExcalidrawElementSkeleton[] = [];

  const center = { x: 180, y: 140 };
  const radius = 140;
  const ids = ["g-0", "g-1", "g-2", "g-3", "g-4"];
  const labels = ["A", "B", "C", "D", "E"];

  const posMap = new Map<string, { x: number; y: number }>();
  ids.forEach((id, i) => {
    const angle = (Math.PI * 2 * i) / ids.length - Math.PI / 2;
    const x = center.x + radius * Math.cos(angle) - CW / 2;
    const y = center.y + radius * Math.sin(angle) - CH / 2;
    posMap.set(id, { x, y });
    elements.push(circle(id, x, y, labels[i], CW, CH, fill, stroke));
  });

  const edges: Array<[string, string, string?]> = [
    ["g-0", "g-1", "4"],
    ["g-1", "g-2", "8"],
    ["g-2", "g-3", "2"],
    ["g-3", "g-4", "5"],
    ["g-4", "g-0", "7"],
    ["g-0", "g-2", "11"],
    ["g-1", "g-3", "9"],
  ];

  for (const [fromId, toId, weight] of edges) {
    const from = posMap.get(fromId)!;
    const to = posMap.get(toId)!;
    elements.push(
      tArrow(fromId, toId, { ...from, w: CW, h: CH }, { ...to, w: CW, h: CH }, { label: weight }),
    );
  }

  return elements;
}

// -- Stack (vertical) --------------------------------------------------------

function stack(): ExcalidrawElementSkeleton[] {
  const stroke = "#6741d9";
  const vals = ["top", "42", "7", "3"];
  const elements: ExcalidrawElementSkeleton[] = [];

  const nodeW = 120;
  const nodeH = NH;
  const gap = 16; // vertical gap between boxes

  const nodes: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
  vals.forEach((val, i) => {
    const y = i * (nodeH + gap);
    nodes.push({ id: `st-${i}`, x: 0, y, w: nodeW, h: nodeH });
    elements.push(
      rect(`st-${i}`, 0, y, val, nodeW, nodeH, i === 0 ? "#d0bfff" : "#e9ecef", stroke),
    );
  });

  // Arrows: bottom → top
  for (let i = 0; i < nodes.length - 1; i++) {
    elements.push(vArrow(nodes[i].id, nodes[i + 1].id, nodes[i], nodes[i + 1]));
  }

  elements.push(textLabel(140, 50, "push ↑ / pop ↓"));

  return elements;
}

// -- Queue (horizontal) ------------------------------------------------------

function queue(): ExcalidrawElementSkeleton[] {
  const fill = "#ffec99";
  const stroke = "#e8590c";
  const vals = ["7", "4", "9"];
  const elements: ExcalidrawElementSkeleton[] = [];

  const nodeW = NW + 16;
  const nodeH = NH;
  const gap = 64;

  const nodes: Array<{ id: string; x: number; y: number; w: number; h: number }> = [];
  vals.forEach((val, i) => {
    const x = i * (nodeW + gap);
    nodes.push({ id: `q-${i}`, x, y: 0, w: nodeW, h: nodeH });
    elements.push(rect(`q-${i}`, x, 0, val, nodeW, nodeH, fill, stroke));
  });

  // Labels
  elements.push(textLabel(18, -40, "front (dequeue)"));
  elements.push(textLabel((vals.length - 1) * (nodeW + gap) + 10, -40, "rear (enqueue)"));

  // Arrows: right → left
  for (let i = 0; i < nodes.length - 1; i++) {
    elements.push(hArrow(nodes[i].id, nodes[i + 1].id, nodes[i], nodes[i + 1]));
  }

  return elements;
}

// -- Array (indexed cells) ---------------------------------------------------

function arrayTemplate(): ExcalidrawElementSkeleton[] {
  const fill = "#a5d8ff";
  const stroke = "#1971c2";
  const vals = ["10", "20", "30", "40", "50"];
  const elements: ExcalidrawElementSkeleton[] = [];

  vals.forEach((val, i) => {
    const x = i * NW;
    elements.push(rect(`a-${i}`, x, 40, val, NW, NH, fill, stroke));
    elements.push(textLabel(x + NW / 2 - 4, 12, String(i), 14, "#868e96"));
  });

  elements.push(textLabel(0, 108, "arr = [10, 20, 30, 40, 50]", 14, "#495057"));

  return elements;
}

// -- Hash Map (buckets with entries) -----------------------------------------

function hashMap(): ExcalidrawElementSkeleton[] {
  const elements: ExcalidrawElementSkeleton[] = [];

  const buckets: Array<{ key: string; value: string }> = [
    { key: "0", value: "apple" },
    { key: "1", value: "banana" },
    { key: "2", value: "cherry" },
  ];

  const bucketW = 48;
  const bucketH = 48;
  const valW = 120;
  const valH = 48;
  const arrowGap = 112;

  buckets.forEach((bucket, i) => {
    const y = i * 68;
    const bucketBox = { x: 0, y, w: bucketW, h: bucketH };
    const valueBox = { x: bucketW + arrowGap, y, w: valW, h: valH };

    elements.push(rect(`hm-${i}`, 0, y, bucket.key, bucketW, bucketH, "#dee2e6", "#495057"));
    elements.push(rect(`hm-${i}-v`, bucketW + arrowGap, y, bucket.value, valW, valH, "#a5d8ff", "#1971c2"));
    elements.push(
      hArrow(`hm-${i}`, `hm-${i}-v`, bucketBox, valueBox, { label: bucket.key, directed: false }),
    );
  });

  elements.push(textLabel(0, -36, "buckets"));

  return elements;
}

// ---------------------------------------------------------------------------
// Exported template list
// ---------------------------------------------------------------------------

export const DSA_TEMPLATES: DsaTemplate[] = [
  {
    id: "linked-list",
    label: "Linked list",
    description: "3 nodes, next pointers, null terminator",
    elements: linkedList(),
  },
  {
    id: "doubly-linked-list",
    label: "Doubly linked list",
    description: "prev + next pointers",
    elements: doublyLinkedList(),
  },
  {
    id: "binary-tree",
    label: "Binary tree",
    description: "3 levels, 7 nodes",
    elements: binaryTree(),
  },
  {
    id: "graph",
    label: "Weighted graph",
    description: "5 nodes, 7 edges",
    elements: graph(),
  },
  {
    id: "stack",
    label: "Stack",
    description: "LIFO — push at top, pop from top",
    elements: stack(),
  },
  {
    id: "queue",
    label: "Queue",
    description: "FIFO — enqueue at rear, dequeue from front",
    elements: queue(),
  },
  {
    id: "array",
    label: "Array",
    description: "5 indexed cells",
    elements: arrayTemplate(),
  },
  {
    id: "hash-map",
    label: "Hash map",
    description: "Buckets with entries",
    elements: hashMap(),
  },
];
