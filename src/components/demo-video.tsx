"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DemoDefinition, DemoNode, DemoState } from "@/components/demo-data";

const STEP_MS = 950;
const PAUSE_MS = 2000;

export function DemoVideo({
  demo,
  className,
}: {
  demo: DemoDefinition;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  // Respect reduced-motion: start paused instead of auto-playing.
  const [playing, setPlaying] = useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!playing) return;

    const isLast = index === demo.states.length - 1;
    timer.current = setTimeout(() => {
      setIndex((i) => (i + 1) % demo.states.length);
    }, isLast ? PAUSE_MS : STEP_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, playing, demo.states.length]);

  const toggle = () => {
    if (timer.current) clearTimeout(timer.current);
    setPlaying((p) => !p);
  };

  const state = demo.states[index];
  const progress = ((index + 1) / demo.states.length) * 100;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-soft",
        className,
      )}
    >
      {/* Player chrome */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          aria-label={playing ? `Pause ${demo.label} demo` : `Play ${demo.label} demo`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {playing ? (
              <Pause className="h-3 w-3" aria-hidden="true" />
            ) : (
              <Play className="h-3 w-3 translate-x-px" aria-hidden="true" />
            )}
          </span>
          {demo.label}
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          Step {index + 1} / {demo.states.length}
        </span>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Code panel with live line highlight — min-w-0 lets the grid column
            shrink, and overflow-x-auto keeps long lines inside the panel
            instead of spilling into the visualization next to it. */}
        <div className="min-w-0 overflow-x-auto border-b bg-muted/30 p-3 font-mono text-[11px] leading-5 sm:border-b-0 sm:border-r">
          {demo.codeLines.map((line, i) => {
            const lineNumber = i + 1;
            const isActive = lineNumber === state.line;
            return (
              <div
                key={lineNumber}
                className={cn(
                  "flex gap-2 rounded px-2 transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "w-4 shrink-0 select-none text-right",
                    isActive ? "text-primary-foreground/70" : "text-muted-foreground/50",
                  )}
                >
                  {lineNumber}
                </span>
                <span className="whitespace-pre">{line || " "}</span>
              </div>
            );
          })}
        </div>

        {/* Visualization + note */}
        <div className="flex flex-col gap-3 p-4">
          {state.visual.kind === "bars" ? (
            <BarsVisual visual={state.visual} />
          ) : state.visual.kind === "pointers" ? (
            <PointersVisual visual={state.visual} />
          ) : state.visual.kind === "tree" ? (
            <TreeVisual visual={state.visual} />
          ) : state.visual.kind === "hashmap" ? (
            <HashMapVisual visual={state.visual} />
          ) : (
            <CallStackVisual visual={state.visual} />
          )}
          <p className="min-h-8 text-center text-xs text-muted-foreground">{state.note}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted" aria-hidden="true">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function BarsVisual({ visual }: { visual: Extract<DemoState["visual"], { kind: "bars" }> }) {
  const max = Math.max(...visual.arr);

  return (
    // Auto margins center the bars when they fit and keep the start reachable
    // when they overflow (justify-center would clip the left edge on scroll).
    <div className="flex h-40 items-end overflow-x-auto">
      <div className="mx-auto flex items-end gap-2 sm:gap-3">
      {visual.arr.map((value, i) => {
        const isActive = visual.active.includes(i);
        return (
          <div
            key={i}
            className="flex h-full w-9 shrink-0 flex-col items-center justify-end gap-1 sm:w-11"
          >
            <span className="text-[10px] font-medium text-foreground">{value}</span>
            <div
              className={cn(
                "w-full rounded-t transition-all duration-500",
                visual.done
                  ? "bg-[hsl(var(--chart-5))]"
                  : isActive
                    ? "bg-[hsl(var(--chart-2))]"
                    : "bg-[hsl(var(--chart-1))]",
              )}
              style={{ height: `${Math.max(6, (value / max) * 116)}px` }}
            />
            <span className="text-[10px] text-muted-foreground">{i}</span>
          </div>
        );
      })}
      </div>
    </div>
  );
}

function CallStackVisual({
  visual,
}: {
  visual: Extract<DemoState["visual"], { kind: "call-stack" }>;
}) {
  const { callStack, done } = visual;

  return (
    <div className="flex h-40 flex-col">
      <div className="mb-1.5 flex items-center justify-between px-0.5">
        <span className="text-[10px] font-medium uppercase tracking-normal text-muted-foreground">
          Recursive call stack
        </span>
        <span className="text-[10px] text-muted-foreground" aria-hidden="true">
          top ↑
        </span>
      </div>
      <div className="flex flex-1 flex-col-reverse gap-1.5">
        {callStack.length ? (
          callStack.map((frame, index) => (
            <div
              key={`${frame}-${index}`}
              className={cn(
                "rounded-md px-3 py-1 font-mono text-[11px] transition-colors",
                done
                  ? "bg-[hsl(var(--chart-5))] text-primary-foreground"
                  : index === callStack.length - 1
                    ? "bg-primary text-primary-foreground"
                    : "border bg-muted/35 text-muted-foreground",
              )}
            >
              {frame}
            </div>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed text-[11px] text-muted-foreground">
            — empty —
          </div>
        )}
      </div>
    </div>
  );
}

function PointersVisual({
  visual,
}: {
  visual: Extract<DemoState["visual"], { kind: "pointers" }>;
}) {
  const { arr, lo, hi, mid, found, done } = visual;
  const max = Math.max(...arr);

  return (
    <div className="flex h-40 flex-col">
      {/* Bars flex to fill the space above the lo/hi/mid legend (which sits in
          normal flow so it can never overlap the note below the card). */}
      <div className="min-h-0 flex-1 overflow-x-auto">
        {/* Auto margins center when they fit; the start stays scrollable when not. */}
        <div className="mx-auto flex h-full items-end gap-2 sm:gap-3">
        {arr.map((value, i) => {
          const inRange = i >= lo && i <= hi;
          const isMid = i === mid;
          const isFound = found && isMid;
          return (
            <div key={i} className="flex h-full w-9 shrink-0 flex-col items-center justify-end gap-1 sm:w-11">
              {isMid ? (
                <span
                  className={`rounded px-1 font-mono text-[10px] font-bold ${
                    isFound ? "bg-emerald-500 text-white" : "bg-amber-500 text-black"
                  }`}
                >
                  mid
                </span>
              ) : (
                <span className="h-4" aria-hidden="true" />
              )}
              <span className="text-[10px] font-medium text-foreground">{value}</span>
              <div
                className={cn(
                  "w-full rounded-t transition-all duration-500",
                  done && isFound
                    ? "bg-[hsl(var(--chart-5))]"
                    : inRange
                      ? isMid
                        ? "bg-amber-500"
                        : "bg-[hsl(var(--chart-1))]"
                      : "bg-muted-foreground/20",
                )}
                style={{ height: `${Math.max(6, (value / max) * 96)}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{i}</span>
            </div>
          );
        })}
        </div>
      </div>
      <div className="mt-1.5 flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px]">
        <span className="rounded bg-blue-500/15 px-1.5 py-0.5 font-semibold text-blue-600 dark:text-blue-400">
          lo {lo}
        </span>
        <span className="rounded bg-orange-500/15 px-1.5 py-0.5 font-semibold text-orange-600 dark:text-orange-400">
          hi {hi}
        </span>
        {mid !== undefined ? (
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-600 dark:text-amber-400">
            mid {mid}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// Heap-style layout: row d holds up to 2^d nodes at columns 0..2^d-1.
const TREE_GAP_X = 56;
const TREE_GAP_Y = 56;
const TREE_RADIUS = 20;
const TREE_PAD = 34;

type PositionedNode = {
  value: number;
  depth: number;
  col: number;
};

function layoutTree(root: DemoNode): PositionedNode[] {
  const nodes: PositionedNode[] = [];
  const queue: Array<{ node: DemoNode; depth: number; col: number }> = [{ node: root, depth: 0, col: 0 }];
  while (queue.length) {
    const { node, depth, col } = queue.shift()!;
    nodes.push({ value: node.value, depth, col });
    if (node.left) queue.push({ node: node.left, depth: depth + 1, col: col * 2 });
    if (node.right) queue.push({ node: node.right, depth: depth + 1, col: col * 2 + 1 });
  }
  return nodes;
}

function xFor(depth: number, col: number): number {
  return (col - (Math.pow(2, depth) - 1) / 2) * TREE_GAP_X;
}

function TreeVisual({ visual }: { visual: Extract<DemoState["visual"], { kind: "tree" }> }) {
  const { root, active, done } = visual;
  const nodes = layoutTree(root);
  const maxDepth = Math.max(...nodes.map((n) => n.depth));
  // The heap layout is centered on x=0, so the left subtree sits at negative
  // x — shift everything right so the whole tree (and its node circles) fits
  // inside the viewBox, which starts at x=0.
  const rawXs = nodes.map((n) => xFor(n.depth, n.col));
  const minX = Math.min(...rawXs) - TREE_RADIUS;
  const maxX = Math.max(...rawXs) + TREE_RADIUS;
  const offsetX = TREE_PAD - minX;
  const width = maxX - minX + TREE_PAD * 2;
  const height = TREE_PAD * 2 + maxDepth * TREE_GAP_Y;

  const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  nodes.forEach((n) => {
    if (n.depth === 0) return;
    // Parent of heap-index (depth, col) is (depth - 1, floor(col / 2)).
    const parentNode = nodes.find((p) => p.depth === n.depth - 1 && p.col === Math.floor(n.col / 2));
    if (parentNode) {
      edges.push({
        x1: xFor(parentNode.depth, parentNode.col) + offsetX,
        y1: TREE_PAD + parentNode.depth * TREE_GAP_Y,
        x2: xFor(n.depth, n.col) + offsetX,
        y2: TREE_PAD + n.depth * TREE_GAP_Y,
      });
    }
  });

  return (
    <div className="flex h-40 items-center justify-center overflow-hidden">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full h-auto"
      >
        {edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="hsl(var(--border))"
            strokeWidth={1.5}
          />
        ))}
        {nodes.map((n) => {
          const x = xFor(n.depth, n.col) + offsetX;
          const y = TREE_PAD + n.depth * TREE_GAP_Y;
          const isActive = String(n.value) === active;
          const fill = done
            ? "hsl(var(--chart-5))"
            : isActive
              ? "hsl(var(--chart-2))"
              : "hsl(var(--chart-1))";
          return (
            <g key={`${n.depth}-${n.col}`}>
              <circle cx={x} cy={y} r={TREE_RADIUS} fill={fill} />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill="hsl(var(--card))"
              >
                {n.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HashMapVisual({
  visual,
}: {
  visual: Extract<DemoState["visual"], { kind: "hashmap" }>;
}) {
  const { arr, active, map, done } = visual;

  return (
    <div className="flex h-40 flex-col gap-3">
      <div className="flex items-end justify-center gap-1.5">
        {arr.map((value, i) => {
          const isActive = active?.includes(i);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "rounded-md px-2 py-1 font-mono text-[11px] font-semibold transition-colors",
                  done && isActive
                    ? "bg-[hsl(var(--chart-5))] text-primary-foreground"
                    : isActive
                      ? "bg-[hsl(var(--chart-2))] text-primary-foreground"
                      : "border bg-muted/35 text-foreground",
                )}
              >
                {value}
              </span>
              <span className="text-[10px] text-muted-foreground">{i}</span>
            </div>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">
        <div className="mb-1 flex items-center justify-between px-0.5">
          <span className="text-[10px] font-medium uppercase tracking-normal text-muted-foreground">
            seen map
          </span>
          {map.length > 0 ? (
            <span className="text-[10px] text-muted-foreground">{map.length} {map.length === 1 ? "entry" : "entries"}</span>
          ) : null}
        </div>
        {map.length ? (
          <div className="overflow-hidden rounded-md border">
            {map.map(([key, value], index) => (
              <div
                key={`${key}-${index}`}
                className={cn(
                  "flex items-center justify-between gap-3 border-b px-2.5 py-1 font-mono text-[11px] last:border-b-0",
                  done && index === map.length - 1
                    ? "bg-[hsl(var(--chart-5))]/15"
                    : "bg-muted/20",
                )}
              >
                <span className="text-foreground">{key}</span>
                <span className="text-muted-foreground">→ {value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-12 items-center justify-center rounded-md border border-dashed text-[11px] text-muted-foreground">
            — empty —
          </div>
        )}
      </div>
    </div>
  );
}
