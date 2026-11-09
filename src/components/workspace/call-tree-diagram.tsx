"use client";

import { useId, useMemo } from "react";

import { buildCallTree, findActivePath, type CallNode } from "@/lib/call-tree";
import type { VisualStep } from "@/types/visualizer";

// ---------------------------------------------------------------------------
// Tree diagram layout: layers by depth, centers each parent over its children,
// and auto-sizes node width to the call label / return pill.
// ---------------------------------------------------------------------------

const X_GAP = 30;
const NODE_H = 36;
const PILL_H = 16;
const PILL_GAP = 6;
// Node block (36) + return pill (6 + 16) leaves a ~30px gap before the next
// depth, so every call's result stays visible under its own node.
const Y_GAP = NODE_H + PILL_GAP + PILL_H + 30;
const PADDING = 14;
const PILL_MAX_CHARS = 46;
// Room above the root call for the order badge, so the top of the tree is
// never clipped by the SVG viewBox.
const TOP_PAD = 22;

type PlacedNode = {
  node: CallNode;
  x: number;
  y: number;
  w: number;
  cx: number;
};

/** Compact one-line summary of what a returned call produced. */
export function callPillText(node: CallNode): string | undefined {
  if (!node.returned) return undefined;
  const expr = node.returnExpr?.trim();
  const value = node.returnValue;
  let text: string;
  if (expr && value) text = `→ ${expr} = ${value}`;
  else if (value) text = `= ${value}`;
  else if (expr) text = `→ ${expr}`;
  else text = "returned";
  return text.length > PILL_MAX_CHARS ? `${text.slice(0, PILL_MAX_CHARS - 1)}…` : text;
}

function measureNodeWidth(label: string, pill: string | undefined): number {
  const labelWidth = label.length * 6.1 + 24;
  const pillWidth = pill ? pill.length * 6.1 + 18 : 0;
  return Math.max(54, labelWidth, pillWidth);
}

function layoutCallTree(roots: CallNode[]) {
  const placed: PlacedNode[] = [];
  const byNode = new Map<CallNode, PlacedNode>();
  let nextX = 0;

  const place = (node: CallNode, depth: number): number => {
    const w = measureNodeWidth(node.label, callPillText(node));
    const childCenters = node.children.map((child) => place(child, depth + 1));
    let cx: number;
    if (childCenters.length === 0) {
      cx = nextX + w / 2;
      nextX += w + X_GAP;
    } else {
      cx = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
      if (cx - w / 2 < 0) {
        const shift = w / 2 - cx + 2;
        for (const entry of placed) entry.x += shift;
        cx += shift;
      }
    }
    const entry: PlacedNode = { node, x: cx - w / 2, y: depth * Y_GAP + TOP_PAD, w, cx };
    placed.push(entry);
    byNode.set(node, entry);
    return cx;
  };

  for (const root of roots) place(root, 0);

  const minX = Math.min(...placed.map((entry) => entry.x));
  const width = Math.max(...placed.map((entry) => entry.x + entry.w)) - minX + PADDING * 2;
  const height = Math.max(...placed.map((entry) => entry.y)) + NODE_H + PILL_GAP + PILL_H + 40;
  for (const entry of placed) entry.x += PADDING - minX;

  const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (const entry of placed) {
    for (const child of entry.node.children) {
      const childEntry = byNode.get(child);
      if (!childEntry) continue;
      edges.push({
        x1: entry.cx,
        y1: entry.y + NODE_H / 2,
        x2: childEntry.cx,
        y2: childEntry.y - NODE_H / 2,
      });
    }
  }

  return { nodes: placed, edges, width, height };
}

export function CallTreeDiagram({
  roots,
  activePath,
  topFrame,
}: {
  roots: CallNode[];
  activePath: CallNode[];
  topFrame: CallNode | null;
}) {
  const markerId = useId().replace(/:/g, "");
  const { nodes, edges, width, height } = useMemo(() => layoutCallTree(roots), [roots]);
  if (nodes.length === 0) return null;

  return (
    <div className="flex flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="max-w-full h-auto"
        role="img"
        aria-label="Recursion tree diagram showing how each call invokes the next and what each call returns"
      >
        <defs>
          <marker
            id={markerId}
            markerWidth="9"
            markerHeight="9"
            refX="7.5"
            refY="4.5"
            orient="auto"
          >
            <path d="M0,0 L9,4.5 L0,9 Z" fill="hsl(var(--muted-foreground) / 0.75)" />
          </marker>
        </defs>

        {edges.map((edge, index) => {
          const midY = (edge.y1 + edge.y2) / 2;
          return (
            <path
              key={index}
              d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
              fill="none"
              stroke="hsl(var(--muted-foreground) / 0.55)"
              strokeWidth="1.5"
              markerEnd={`url(#${markerId})`}
            />
          );
        })}

        {nodes.map(({ node, x, y, w, cx }) => {
          const isTop = node === topFrame;
          const isActive = activePath.includes(node);
          const rx = w / 2;
          const ry = NODE_H / 2;
          const fill = isTop
            ? "hsl(160 84% 39% / 0.26)"
            : isActive
              ? "hsl(160 84% 39% / 0.12)"
              : "hsl(var(--muted) / 0.55)";
          const stroke = isActive
            ? "hsl(160 84% 39% / 0.85)"
            : "hsl(var(--border))";
          const opacity = node.returned && !isActive ? 0.72 : 1;
          const pill = callPillText(node);
          const pillWidth = pill ? Math.min(pill.length * 6.1 + 18, w) : 0;

          return (
            <g key={`${node.order}-${node.label}-${x}`} opacity={opacity}>
              <ellipse cx={cx} cy={y + ry} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={isTop ? 2 : 1.5} />
              <text
                x={cx}
                y={y + ry}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fill="hsl(var(--foreground) / 0.95)"
              >
                {node.label}
              </text>

              {/* Call order badge (top-left corner). */}
              <circle cx={x + 1} cy={y + 1} r="7" fill="hsl(var(--primary))" />
              <text
                x={x + 1}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="8.5"
                fontWeight="700"
                fill="hsl(var(--primary-foreground))"
              >
                {node.order}
              </text>

              {/* Returned check (bottom-right corner). */}
              {node.returned ? (
                <g>
                  <circle cx={x + w - 1} cy={y + NODE_H - 1} r="7" fill="hsl(160 84% 39%)" />
                  <text
                    x={x + w - 1}
                    y={y + NODE_H - 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontWeight="700"
                    fill="white"
                  >
                    ✓
                  </text>
                </g>
              ) : null}

              {/* Return pill: `→ <expr> = <value>` bubbling the result back up. */}
              {pill ? (
                <g>
                  <rect
                    x={cx - pillWidth / 2}
                    y={y + NODE_H + PILL_GAP}
                    width={pillWidth}
                    height={PILL_H}
                    rx={PILL_H / 2}
                    className="fill-teal-500/10 stroke-teal-500/60"
                  />
                  <text
                    x={cx}
                    y={y + NODE_H + PILL_GAP + PILL_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    className="fill-teal-700 dark:fill-teal-400"
                  >
                    {pill}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
            1
          </span>
          call order
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-teal-500" />
          active call
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-teal-500 text-[8px] font-bold text-white">
            ✓
          </span>
          returned
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="rounded-full border border-teal-500/60 bg-teal-500/10 px-1.5 py-px font-mono text-[9px] text-teal-700 dark:text-teal-400">
            → expr = value
          </span>
          return value
        </span>
      </p>
    </div>
  );
}

/**
 * Builds the tree for a run up to `currentIndex` and renders it — shared by the
 * Call Stack panel (compact) and the Visualization panel's Call tree tab (large).
 */
export function CallTreeView({
  steps,
  currentIndex,
  topFrame,
}: {
  steps: VisualStep[];
  currentIndex: number;
  topFrame?: CallNode | null;
}) {
  const currentStep = steps[currentIndex];
  const frames = useMemo(() => currentStep?.callStack ?? [], [currentStep]);

  // The tree reflects only the calls seen so far, so it grows as the user
  // steps and future calls never appear "returned" prematurely.
  const tree = useMemo(
    () => buildCallTree(steps.slice(0, currentIndex + 1)),
    [steps, currentIndex],
  );
  const activePath = useMemo(() => findActivePath(tree, frames), [tree, frames]);

  // On a Return step the top frame is the one that just left — it gets the
  // returned ✓ but no "currently executing" highlight.
  const isReturnStep = currentStep?.title === "Return";
  const activeTop =
    !isReturnStep && activePath.length > 0 ? activePath[activePath.length - 1] : null;

  if (tree.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-xs text-muted-foreground">
        No calls to draw yet — run code that uses functions to see the recursion tree.
      </p>
    );
  }

  return (
    <CallTreeDiagram
      roots={tree}
      activePath={activePath}
      topFrame={topFrame === undefined ? activeTop : topFrame}
    />
  );
}
