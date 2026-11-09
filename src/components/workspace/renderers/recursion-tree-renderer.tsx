"use client";

import { useId, useMemo } from "react";
import type { RecursionTreeNode } from "@/types/visualizer";

// ---------------------------------------------------------------------------
// Tree layout constants — tuned for readability at typical recursion depths.
// ---------------------------------------------------------------------------

const X_GAP = 24;
const NODE_H = 40;
const PILL_H = 18;
const PILL_GAP = 5;
// Node block (40) + return pill (5 + 18) + gap before next depth.
const Y_GAP = NODE_H + PILL_GAP + PILL_H + 28;
const PADDING = 16;
const TOP_PAD = 24;

type PlacedNode = {
  node: RecursionTreeNode;
  x: number;
  y: number;
  w: number;
  cx: number;
};

type PlacedEdge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fromId: string;
  toId: string;
};

function measureNodeWidth(label: string, result: string | undefined): number {
  const labelW = label.length * 7.2 + 28;
  const resultW = result !== undefined ? (String(result).length * 7.2 + 24) : 0;
  return Math.max(60, labelW, resultW);
}

function resultText(node: RecursionTreeNode): string | undefined {
  if (node.result === undefined) return undefined;
  return `= ${String(node.result)}`;
}

// ---------------------------------------------------------------------------
// Layout: parent-centered over children, like the call-tree diagram.
// ---------------------------------------------------------------------------

function layoutTree(nodes: RecursionTreeNode[]) {
  if (nodes.length === 0) return { placed: [] as PlacedNode[], edges: [] as PlacedEdge[], width: 0, height: 0 };

  const nodeById = new Map<string, RecursionTreeNode>();
  for (const n of nodes) nodeById.set(n.id, n);

  // Build adjacency: children strings → actual node objects.
  const childNodes = (node: RecursionTreeNode): RecursionTreeNode[] =>
    node.children.map(id => nodeById.get(id)).filter((n): n is RecursionTreeNode => !!n);

  const placed: PlacedNode[] = [];
  const byNode = new Map<RecursionTreeNode, PlacedNode>();
  let nextX = 0;

  const place = (node: RecursionTreeNode, depth: number): number => {
    const w = measureNodeWidth(node.label, resultText(node));
    const children = childNodes(node);
    const childCenters = children.map(child => place(child, depth + 1));
    let cx: number;
    if (childCenters.length === 0) {
      cx = nextX + w / 2;
      nextX += w + X_GAP;
    } else {
      cx = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
      // Shift all existing nodes right if this parent would clip left edge.
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

  // Find root nodes (nodes that are nobody's child).
  const childIds = new Set(nodes.flatMap(n => n.children));
  const roots = nodes.filter(n => !childIds.has(n.id));

  for (const root of roots) place(root, 0);

  // If no explicit roots found (cyclic or data issue), place all nodes.
  if (roots.length === 0) {
    for (const node of nodes) {
      if (!byNode.has(node)) place(node, node.depth ?? 0);
    }
  }

  const minX = Math.min(...placed.map(e => e.x));
  const maxX = Math.max(...placed.map(e => e.x + e.w));
  const maxY = Math.max(...placed.map(e => e.y));
  const width = maxX - minX + PADDING * 2;
  const height = maxY + NODE_H + PILL_GAP + PILL_H + 40;

  // Normalize x positions so nothing is negative.
  for (const entry of placed) entry.x += PADDING - minX;

  // Build edges — store from/to ids for reliable active-path matching.
  const edges: PlacedEdge[] = [];
  for (const entry of placed) {
    for (const childId of entry.node.children) {
      const childEntry = byNode.get(nodeById.get(childId)!);
      if (!childEntry) continue;
      edges.push({
        x1: entry.cx,
        y1: entry.y + NODE_H / 2,
        x2: childEntry.cx,
        y2: childEntry.y - NODE_H / 2,
        fromId: entry.node.id,
        toId: childId,
      });
    }
  }

  return { placed, edges, width, height };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecursionTreeRenderer({
  nodes,
  activeNodeId,
  tableName,
}: {
  nodes: RecursionTreeNode[];
  activeNodeId?: string;
  tableName?: string;
}) {
  const markerId = useId().replace(/:/g, "");
  const { placed, edges, width, height } = useMemo(() => layoutTree(nodes), [nodes]);

  // Memoize parent lookup so activePath useMemo doesn't recompute every
  // render. Hooks run unconditionally (rules-of-hooks); the empty-tree early
  // return happens after them.
  const parentOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      for (const cid of n.children) {
        map.set(cid, n.id);
      }
    }
    return map;
  }, [nodes]);

  const activePath = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    const path = new Set<string>();
    let cur: string | undefined = activeNodeId;
    while (cur) {
      path.add(cur);
      cur = parentOf.get(cur);
    }
    return path;
  }, [activeNodeId, parentOf]);

  if (placed.length === 0) return null;

  const cachedCount = nodes.filter(n => n.cached).length;
  const pendingCount = nodes.filter(n => n.result === undefined && !n.cached).length;

  return (
    <div className="overflow-x-auto rounded-md border border-border/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-bold uppercase text-blue-700 dark:text-blue-400">
          Recursion Tree
        </span>
        {tableName && (
          <span className="font-mono text-xs text-muted-foreground">{tableName}</span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {nodes.length} {nodes.length === 1 ? "call" : "calls"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="max-w-full h-auto"
          role="img"
          aria-label="Recursion tree showing subproblem calls and cached results"
        >
          <defs>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="hsl(var(--muted-foreground) / 0.6)" />
            </marker>
            <marker
              id={`${markerId}-active`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="hsl(160 84% 39% / 0.8)" />
            </marker>
          </defs>

          {/* Edges — curved bezier like the call tree */}
          {edges.map((edge, index) => {
            const midY = (edge.y1 + edge.y2) / 2;
            const isActiveEdge = activePath.has(edge.fromId) && activePath.has(edge.toId);

            return (
              <path
                key={index}
                d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
                fill="none"
                stroke={isActiveEdge ? "hsl(160 84% 39% / 0.7)" : "hsl(var(--muted-foreground) / 0.4)"}
                strokeWidth={isActiveEdge ? 2.5 : 1.5}
                markerEnd={`url(#${isActiveEdge ? `${markerId}-active` : markerId})`}
              />
            );
          })}

          {/* Nodes */}
          {placed.map(({ node, x, y, w, cx }) => {
            const isActive = activePath.has(node.id);
            const isCurrent = activeNodeId === node.id;
            const isCached = node.cached;
            const hasResult = node.result !== undefined;
            const pill = resultText(node);

            // Node colors — three tiers: current (brightest), on-path (glow), cached (muted), computed (done), pending.
            const rx = w / 2;
            const ry = NODE_H / 2;

            let fill: string;
            let stroke: string;
            let strokeW: number;
            let opacity: number;

            if (isCurrent) {
              fill = "hsl(var(--primary))";
              stroke = "hsl(var(--primary))";
              strokeW = 3;
              opacity = 1;
            } else if (isCached) {
              fill = "hsl(var(--muted) / 0.6)";
              stroke = "hsl(var(--muted-foreground) / 0.35)";
              strokeW = 1.5;
              opacity = 0.7;
            } else if (hasResult) {
              fill = isActive
                ? "hsl(160 84% 39% / 0.18)"
                : "hsl(var(--card))";
              stroke = isActive
                ? "hsl(160 84% 39% / 0.8)"
                : "hsl(var(--chart-5) / 0.7)";
              strokeW = isActive ? 2.5 : 2;
              opacity = 1;
            } else {
              fill = isActive
                ? "hsl(160 84% 39% / 0.1)"
                : "hsl(var(--card))";
              stroke = isActive
                ? "hsl(160 84% 39% / 0.6)"
                : "hsl(var(--border))";
              strokeW = isActive ? 2 : 1.5;
              opacity = 1;
            }

            const textColor = isCurrent
              ? "hsl(var(--primary-foreground))"
              : "hsl(var(--foreground) / 0.95)";

            return (
              <g key={node.id} opacity={opacity}>
                {/* Main node ellipse */}
                <ellipse
                  cx={cx}
                  cy={y + ry}
                  rx={rx}
                  ry={ry}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeW}
                />

                {/* Label */}
                <text
                  x={cx}
                  y={hasResult ? y + ry - 5 : y + ry + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fill={textColor}
                >
                  {node.label}
                </text>

                {/* Result */}
                {hasResult && (
                  <text
                    x={cx}
                    y={y + ry + 11}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10.5"
                    fontWeight="700"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fill={
                      isCurrent
                        ? "hsl(var(--primary-foreground))"
                        : isCached
                          ? "hsl(var(--muted-foreground))"
                          : "hsl(var(--chart-5))"
                    }
                  >
                    {pill}
                  </text>
                )}

                {/* Cached badge (top-right) */}
                {isCached && (
                  <g>
                    <rect
                      x={cx + rx - 36}
                      y={y - ry + 2}
                      width={34}
                      height={12}
                      rx={6}
                      fill="hsl(var(--muted-foreground) / 0.2)"
                    />
                    <text
                      x={cx + rx - 19}
                      y={y - ry + 8}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="7"
                      fontWeight="700"
                      fill="hsl(var(--muted-foreground))"
                    >
                      CACHED
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          current
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500/80 bg-emerald-500/15" />
          on call path
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500/70 bg-card" />
          computed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full border border-muted-foreground/35 bg-muted/60" style={{ opacity: 0.7 }} />
          cached
        </span>
        {cachedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="font-semibold">{cachedCount}</span> cache {cachedCount === 1 ? "hit" : "hits"}
          </span>
        )}
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold">{pendingCount}</span> pending
          </span>
        )}
      </div>
    </div>
  );
}
