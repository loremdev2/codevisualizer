"use client";

import { Fragment } from "react";

import type { LinkedListStep } from "@/types/visualizer";
import type { VariableRow } from "./structure-renderer";

/**
 * Linked-list chain renderer.
 *
 * Draws the normalized capture (stable node ids + per-node next/prev links)
 * as horizontal chains: node boxes with tiny `#id` badges, `→` / `⇄` links,
 * pointer arrows riding above the node they point to, an active-node ring,
 * value/link-change flashes, a `null` terminator, and a loop-back marker when
 * the list has a cycle. Shared by the Variables panel (compact) and the
 * Visualization canvas (large) — node positions never shuffle between steps
 * because ids are stable, so reversals read as arrows flipping, not boxes
 * jumping.
 */
export function LinkedListRenderer({ row }: { row: VariableRow }) {
  return <LinkedListChain data={row.value as LinkedListStep} size="sm" />;
}

export function LinkedListChain({ data, size = "sm" }: { data: LinkedListStep; size?: "sm" | "lg" }) {
  const listEntries = Object.entries(data.lists);
  if (!listEntries.length) {
    return <span className="font-mono text-[11px] text-muted-foreground/70">empty list</span>;
  }
  return (
    <div className="space-y-2">
      {listEntries.map(([name, list]) => (
        <ChainRow key={name} name={name} list={list} data={data} size={size} />
      ))}
    </div>
  );
}

function ChainRow({
  name,
  list,
  data,
  size,
}: {
  name: string;
  list: { order: number[]; cycleStart?: number | null };
  data: LinkedListStep;
  size: "sm" | "lg";
}) {
  const { order, cycleStart } = list;
  const hasCycle = cycleStart !== null && cycleStart !== undefined;

  // A chain is doubly-linked when every node's prev is the previous node in
  // the walk (the worker only emits `prev` when nodes actually carry it).
  const doubly =
    data.prev !== null &&
    data.prev !== undefined &&
    order.every((id, index) => data.prev?.[id] === (index === 0 ? null : order[index - 1]));

  const pointersOn = (id: number) =>
    Object.entries(data.pointers)
      .filter(([, nodeId]) => nodeId === id)
      .map(([name]) => name);

  const linkWasChanged = (id: number) => data.changedLink?.node === id;

  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="font-mono font-semibold text-fuchsia-600/80 dark:text-fuchsia-400/80">{name}</span>
        <span>
          {order.length} {order.length === 1 ? "node" : "nodes"}
        </span>
        {hasCycle ? (
          <span
            className="rounded bg-amber-500/15 px-1.5 font-semibold text-amber-700 dark:text-amber-400"
            title="The tail loops back into the list — a cycle."
          >
            ↺ cycle → #{cycleStart}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <div className="flex items-start overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: "thin" }}>

        {order.map((id, index) => {
          const isLast = index === order.length - 1;
          const pointers = pointersOn(id);
          const isActive = data.active === id;
          const isChanged = data.changedValue === id;
          return (
            <Fragment key={id}>
              <div className="flex shrink-0 flex-col items-center">
                <div className="flex h-4 items-end gap-1">
                  {pointers.length ? (
                    pointers.map((pointer) => (
                      <span
                        key={pointer}
                        className="whitespace-nowrap rounded bg-fuchsia-500/15 px-1 font-mono text-[9px] font-semibold leading-4 text-fuchsia-700 dark:text-fuchsia-400"
                      >
                        {pointer} ↓
                      </span>
                    ))
                  ) : (
                    <span className="h-4" aria-hidden="true" />
                  )}
                </div>
                <NodeBox
                  value={data.values[id]}
                  id={id}
                  active={isActive}
                  changed={isChanged}
                  size={size}
                />
              </div>
              <LinkArrow
                doubly={doubly}
                changed={linkWasChanged(id)}
                title={
                  linkWasChanged(id) && data.changedLink
                    ? `#${id}.next: ${fmtTarget(data.changedLink.previousTo)} → ${fmtTarget(data.changedLink.to)}`
                    : doubly
                      ? "doubly-linked"
                      : undefined
                }
                isLast={isLast}
                hasCycle={hasCycle}
                cycleStart={hasCycle ? cycleStart : null}
              />
            </Fragment>
          );
        })}
        </div>
        {/* Gradient fade + scroll hint when content overflows */}
        {order.length > 4 ? (
          <div className="pointer-events-none absolute right-0 top-0 flex h-full items-center">
            <div className="h-full w-8 bg-gradient-to-l from-background to-transparent" />
            <span className="pr-1 text-[9px] text-muted-foreground/50">→</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function fmtTarget(target: number | null | undefined): string {
  return target === null || target === undefined ? "null" : `#${target}`;
}

function LinkArrow({
  doubly,
  changed,
  title,
  isLast,
  hasCycle,
  cycleStart,
}: {
  doubly: boolean;
  changed: boolean;
  title?: string;
  isLast: boolean;
  hasCycle: boolean;
  cycleStart?: number | null;
}) {
  if (isLast) {
    return (
      <div className="flex shrink-0 items-start pt-4 pl-1.5 pr-1">
        {hasCycle ? (
          <span
            className="whitespace-nowrap rounded bg-amber-500/15 px-1.5 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-400"
            title="The last node points back into the list."
          >
            ↺ #{cycleStart}
          </span>
        ) : (
          <span className="whitespace-nowrap font-mono text-[10px] text-muted-foreground/50">null</span>
        )}
      </div>
    );
  }
  return (
    <div className="flex shrink-0 items-start pt-[1.05rem] px-0.5" title={title}>
      <span
        className={`select-none text-[13px] leading-none ${
          changed
            ? "font-bold text-amber-500"
            : doubly
              ? "text-sky-500/70"
              : "text-foreground/35"
        }`}
      >
        {doubly ? "⇄" : "→"}
      </span>
    </div>
  );
}

function NodeBox({
  value,
  id,
  active,
  changed,
  size,
}: {
  value: string | number | boolean | null | undefined;
  id: number;
  active: boolean;
  changed: boolean;
  size: "sm" | "lg";
}) {
  const large = size === "lg";
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-md border font-mono transition-all ${
        large ? "h-10 min-w-12 px-2 text-base" : "h-7 min-w-9 px-1.5 text-[12px]"
      } ${
        active
          ? "border-fuchsia-500 bg-fuchsia-500/15 ring-2 ring-fuchsia-500/40"
          : changed
            ? "border-cyan-400 bg-cyan-500/10"
            : "border-border bg-background"
      }`}
    >
      <span className={active || changed ? "text-foreground" : "text-foreground/85"}>{formatValue(value)}</span>
      <span
        className={`absolute -right-1.5 -top-1.5 rounded px-0.5 font-mono leading-3 ${
          active ? "bg-fuchsia-500 text-white" : "bg-muted text-muted-foreground"
        } ${large ? "text-[9px]" : "text-[8px]"}`}
        title={`node #${id}`}
      >
        #{id}
      </span>
    </div>
  );
}

function formatValue(value: string | number | boolean | null | undefined): string {
  if (value === undefined) return "?";
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}
