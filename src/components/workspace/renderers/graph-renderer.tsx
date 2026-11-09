"use client";

import { useMemo } from "react";

import type { VariableRow } from "./structure-renderer";

type GraphInput = Record<string, Array<string | number>>;

type LayoutNode = {
  id: string;
  x: number;
  y: number;
};

/**
 * Graph renderer — SVG force-directed layout with nodes, edges, active/visited highlighting.
 * Replaces the old text adjacency list.
 */
export function GraphRenderer({ row }: { row: VariableRow }) {
  // Memoized so the entries memo below sees a stable dependency identity.
  const graph: GraphInput = useMemo(
    () =>
      row.value && typeof row.value === "object" && !Array.isArray(row.value)
        ? (row.value as GraphInput)
        : {},
    [row.value],
  );

  const activeNode = row.active?.[0] != null ? String(row.active[0]) : undefined;

  const entries = useMemo(() => {
    const nodes = Object.keys(graph);
    if (nodes.length === 0) return { nodes: [], edges: [] };

    // Collect all unique nodes (including targets not in keys)
    const allNodes = new Set<string>();
    for (const [src, targets] of Object.entries(graph)) {
      allNodes.add(src);
      for (const t of targets) allNodes.add(String(t));
    }

    const nodeList = [...allNodes];
    const positions = forceLayout(nodeList, graph);

    // Build edges (deduplicate)
    const edgeSet = new Set<string>();
    const edges: Array<{ from: string; to: string; directed: boolean }> = [];
    for (const [src, targets] of Object.entries(graph)) {
      for (const t of targets) {
        const key = `${src}->${t}`;
        const reverseKey = `${t}->${src}`;
        if (!edgeSet.has(key)) {
          const directed = !edgeSet.has(reverseKey);
          edges.push({ from: src, to: String(t), directed });
          edgeSet.add(key);
        }
      }
    }

    return { nodes: positions, edges };
  }, [graph]);

  if (entries.nodes.length === 0) {
    return (
      <span className="font-mono text-[11px] text-muted-foreground/70">
        (empty graph)
      </span>
    );
  }

  const nodeMap = new Map(entries.nodes.map((n) => [n.id, n]));
  const padding = 30;
  const minX = Math.min(...entries.nodes.map((n) => n.x)) - padding;
  const minY = Math.min(...entries.nodes.map((n) => n.y)) - padding;
  const maxX = Math.max(...entries.nodes.map((n) => n.x)) + padding;
  const maxY = Math.max(...entries.nodes.map((n) => n.y)) + padding;
  const width = Math.max(maxX - minX, 120);
  const height = Math.max(maxY - minY, 80);

  return (
    <div className="overflow-x-auto rounded-md border border-border/70 p-2">
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        width={width}
        height={height}
        className="max-w-full h-auto"
        role="img"
        aria-label="Graph visualization"
      >
        {/* Edges */}
        {entries.edges.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;

          const isActiveEdge =
            !!activeNode && (edge.from === activeNode || edge.to === activeNode);

          return (
            <g key={`e-${i}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={
                  isActiveEdge
                    ? "hsl(var(--chart-2))"
                    : "hsl(var(--border))"
                }
                strokeWidth={isActiveEdge ? 2.5 : 1.5}
                opacity={0.85}
              />
              {edge.directed && (
                <DirectedArrow from={from} to={to} active={isActiveEdge} />
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {entries.nodes.map((node) => {
          const isActive = node.id === activeNode;
          const r = 16;

          return (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={
                  isActive
                    ? "hsl(var(--chart-2))"
                    : "hsl(var(--card))"
                }
                stroke={
                  isActive
                    ? "hsl(var(--chart-2))"
                    : "hsl(var(--border))"
                }
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight="600"
                fontFamily="monospace"
                fill={
                  isActive
                    ? "hsl(var(--primary-foreground))"
                    : "hsl(var(--foreground))"
                }
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function DirectedArrow({
  from,
  to,
  active,
}: {
  from: LayoutNode;
  to: LayoutNode;
  active: boolean;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;

  const nodeR = 16;
  // Arrow tip is nodeR pixels from center along the edge
  const tipX = to.x - (dx / len) * nodeR;
  const tipY = to.y - (dy / len) * nodeR;

  // Small triangle pointing at the target node
  const arrowLen = 8;
  const arrowW = 4;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy; // perpendicular
  const py = ux;

  const baseX = tipX - ux * arrowLen;
  const baseY = tipY - uy * arrowLen;

  const points = [
    `${tipX},${tipY}`,
    `${baseX + px * arrowW},${baseY + py * arrowW}`,
    `${baseX - px * arrowW},${baseY - py * arrowW}`,
  ].join(" ");

  return (
    <polygon
      points={points}
      fill={active ? "hsl(var(--chart-2))" : "hsl(var(--border))"}
      opacity={0.85}
    />
  );
}

/**
 * Simple force-directed layout. Positions nodes in a circle initially,
 * then runs a few iterations of repulsion + attraction.
 */
function forceLayout(
  nodeIds: string[],
  graph: GraphInput,
  iterations = 60,
): LayoutNode[] {
  const n = nodeIds.length;
  if (n === 0) return [];
  if (n === 1)
    return [{ id: nodeIds[0], x: 0, y: 0 }];

  // Initial positions: circle
  const radius = Math.max(40, n * 12);
  const nodes: LayoutNode[] = nodeIds.map((id, i) => ({
    id,
    x: radius * Math.cos((2 * Math.PI * i) / n),
    y: radius * Math.sin((2 * Math.PI * i) / n),
  }));

  const nodeIndex = new Map(nodes.map((nd, i) => [nd.id, i]));

  // Build edge set for attraction
  const edges: Array<[number, number]> = [];
  for (const [src, targets] of Object.entries(graph)) {
    const si = nodeIndex.get(src);
    if (si === undefined) continue;
    for (const t of targets) {
      const ti = nodeIndex.get(String(t));
      if (ti !== undefined && si !== ti) {
        edges.push([si, ti]);
      }
    }
  }

  const k = Math.sqrt((radius * radius * 2) / Math.max(n, 1)); // ideal distance
  const temp = radius * 0.5;

  for (let iter = 0; iter < iterations; iter++) {
    const t = temp * (1 - iter / iterations); // cooling

    // Repulsion between all pairs
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].x -= fx * 0.5;
        nodes[i].y -= fy * 0.5;
        nodes[j].x += fx * 0.5;
        nodes[j].y += fy * 0.5;
      }
    }

    // Attraction along edges
    for (const [i, j] of edges) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.1);
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      nodes[i].x += fx * 0.1;
      nodes[i].y += fy * 0.1;
      nodes[j].x -= fx * 0.1;
      nodes[j].y -= fy * 0.1;
    }

    // Center gravity
    for (const nd of nodes) {
      nd.x *= 0.95;
      nd.y *= 0.95;
    }

    // Temperature clamping
    for (const nd of nodes) {
      const dx = nd.x;
      const dy = nd.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > t * 3) {
        nd.x = (dx / dist) * t * 3;
        nd.y = (dy / dist) * t * 3;
      }
    }
  }

  return nodes;
}
