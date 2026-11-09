"use client";

import type { ReactNode } from "react";
import type { TreeStep } from "@/types/visualizer";
import type { VariableRow } from "./structure-renderer";

/**
 * Binary-tree diagram renderer.
 *
 * Draws the normalized capture (stable node ids + per-node left/right links)
 * as circles and arrows — the visual students expect from tree problems: a
 * root circle with edges dropping to left/right children, pointer arrows
 * (`node ↓`, `curr ↓`) riding above the node they reference, an active-node
 * ring, and a value-change flash. Shared by the Variables panel (compact) and
 * the Visualization canvas (large); node positions never shuffle between
 * steps because ids are stable, so recursion reads as the ring walking the
 * tree, not circles jumping.
 */
export function TreeRenderer({ row }: { row: VariableRow }) {
  return <TreeDiagram data={row.value as TreeStep} size="sm" />;
}

const NODE_W = 44;
const LEVEL_H = 66;
const GAP = 30;

export function TreeDiagram({ data, size = "sm" }: { data: TreeStep; size?: "sm" | "lg" }) {
  const rootEntries = Object.entries(data.roots);
  if (!rootEntries.length) {
    return <span className="font-mono text-[11px] text-muted-foreground/70">empty tree</span>;
  }
  return (
    <div className="space-y-3 overflow-x-auto pb-1 px-1">
      {rootEntries.map(([name, rootId]) => (
        <TreeRow key={name} name={name} rootId={rootId} data={data} size={size} />
      ))}
    </div>
  );
}

function TreeRow({
  name,
  rootId,
  data,
  size,
}: {
  name: string;
  rootId: number;
  data: TreeStep;
  size: "sm" | "lg";
}) {
  const large = size === "lg";
  const radius = large ? 18 : 13;
  const nodeH = radius * 2 + 4;

  // Room above the root for the pointer label ("root ↓") and the id badge,
  // so the top of the tree is never clipped by the SVG viewBox.
  const topPad = radius + 24;
  const positions = layoutTree(rootId, data, topPad);
  const width = Math.max(subtreeWidth(rootId, data) + radius * 2 + 40, 120);
  const maxDepth = Math.max(
    0,
    ...Array.from(positions.values()).map((position) => (position.y - topPad) / LEVEL_H),
  );
  const height = (maxDepth + 1) * LEVEL_H + nodeH / 2 + 12 + topPad;

  const nodeCount = Object.keys(data.values).length;

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="font-mono font-semibold text-lime-600/80 dark:text-lime-400/80">{name}</span>
        <span>
          {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="max-w-full h-auto" style={{ overflow: "visible" }}
        role="img"
        aria-label={`Binary tree ${name}`}
      >
        {Array.from(positions.entries()).flatMap(([id, position]) => {
          const left = data.left[id];
          const right = data.right[id];
          const edges: ReactNode[] = [];
          const pushEdge = (child: number | null | undefined, dx: number) => {
            if (child === null || child === undefined) return;
            const childPosition = positions.get(child);
            if (!childPosition) return;
            const isActiveChild = data.active === child;
            edges.push(
              <line
                key={`${id}-${dx}`}
                x1={position.x}
                y1={position.y + radius}
                x2={childPosition.x}
                y2={childPosition.y - radius}
                stroke={isActiveChild ? "hsl(var(--chart-2))" : "hsl(var(--border))"}
                strokeWidth={isActiveChild ? 2.5 : 1.5}
                opacity={0.85}
              />,
            );
          };
          pushEdge(left, -1);
          pushEdge(right, 1);
          return edges;
        })}

        {Array.from(positions.entries()).map(([id, position]) => {
          const isActive = data.active === id;
          const isChanged = data.changedValue === id;
          const pointers = Object.entries(data.pointers)
            .filter(([, nodeId]) => nodeId === id)
            .map(([pointerName]) => pointerName);
          const fill = isActive
            ? "hsl(var(--chart-2))"
            : isChanged
              ? "hsl(var(--destructive))"
              : "hsl(var(--card))";
          const stroke = isActive
            ? "hsl(var(--chart-2))"
            : isChanged
              ? "hsl(var(--destructive))"
              : "hsl(var(--border))";
          const textFill = isActive || isChanged ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))";
          return (
            <g key={id}>
              {pointers.length ? (
                <g>
                  <text
                    x={position.x}
                    y={position.y - radius - 5}
                    textAnchor="middle"
                    fontSize={large ? 11 : 9}
                    fontWeight="700"
                    fill="hsl(var(--chart-2))"
                  >
                    {pointers.join(", ")} ↓
                  </text>
                </g>
              ) : null}
              <circle
                cx={position.x}
                cy={position.y}
                r={radius}
                fill={fill}
                stroke={stroke}
                strokeWidth={isActive ? 3 : 1.5}
              />
              <text
                x={position.x}
                y={position.y + (large ? 5 : 3.5)}
                textAnchor="middle"
                fontSize={large ? 14 : 11}
                fontWeight="600"
                fill={textFill}
              >
                {formatValue(data.values[id])}
              </text>
              <g>
                <circle
                  cx={position.x + radius - 6}
                  cy={position.y - radius + 6}
                  r={large ? 8 : 6}
                  fill={isActive ? "hsl(var(--chart-2))" : "hsl(var(--muted))"}
                  stroke="hsl(var(--card))"
                  strokeWidth={1.5}
                />
                <text
                  x={position.x + radius - 6}
                  y={position.y - radius + (large ? 9 : 7)}
                  textAnchor="middle"
                  fontSize={large ? 8 : 6.5}
                  fontWeight="700"
                  fill={isActive ? "hsl(0 0% 100%)" : "hsl(var(--muted-foreground))"}
                >
                  {id}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function subtreeWidth(id: number | null | undefined, data: TreeStep): number {
  if (id === null || id === undefined) return NODE_W;
  const left = data.left[id];
  const right = data.right[id];
  const hasLeft = left !== null && left !== undefined;
  const hasRight = right !== null && right !== undefined;
  if (!hasLeft && !hasRight) return NODE_W;
  const leftWidth = hasLeft ? subtreeWidth(left, data) : NODE_W;
  const rightWidth = hasRight ? subtreeWidth(right, data) : NODE_W;
  return Math.max(NODE_W, leftWidth + rightWidth + GAP);
}

function layoutTree(
  rootId: number,
  data: TreeStep,
  topPad = 0,
): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>();
  const place = (id: number | null | undefined, x: number, depth: number) => {
    if (id === null || id === undefined) return;
    positions.set(id, { x, y: depth * LEVEL_H + topPad });
    const left = data.left[id];
    const right = data.right[id];
    const hasLeft = left !== null && left !== undefined;
    const hasRight = right !== null && right !== undefined;
    if (!hasLeft && !hasRight) return;
    const leftWidth = hasLeft ? subtreeWidth(left, data) : NODE_W;
    const offset = (leftWidth + GAP) / 2;
    place(left, x - offset, depth + 1);
    place(right, x + offset, depth + 1);
  };
  place(rootId, subtreeWidth(rootId, data) / 2, 0);
  return positions;
}

function formatValue(value: string | number | boolean | null | undefined): string {
  if (value === undefined) return "?";
  if (typeof value === "string") return value.length > 6 ? value.slice(0, 5) + "…" : value;
  return String(value);
}
