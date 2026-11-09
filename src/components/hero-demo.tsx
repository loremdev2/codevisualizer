"use client";

import { useEffect, useRef, useState } from "react";

import { BUBBLE_SORT_DEMO, BINARY_SEARCH_DEMO, FIBONACCI_DEMO } from "@/components/demo-data";
import type { DemoDefinition, DemoState } from "@/components/demo-data";
import { cn } from "@/lib/utils";

const DEMOS = [BUBBLE_SORT_DEMO, BINARY_SEARCH_DEMO, FIBONACCI_DEMO];
const STEP_MS = 800;
const PAUSE_MS = 1800;
const CYCLE_MS = 3000; // pause between switching demos

/**
 * A compact, auto-playing algorithm demo for the homepage hero.
 * Cycles through 3 demos (bubble sort → binary search → fibonacci),
 * showing code + visualization side-by-side in a glass-morphism card.
 */
export function HeroDemo() {
  const [demoIdx, setDemoIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const demo = DEMOS[demoIdx];
  const state = demo.states[stepIdx];
  const isLastStep = stepIdx === demo.states.length - 1;

  // Respect reduced motion — checked in the timer callback so no state is
  // set synchronously in the effect body.
  useEffect(() => {
    if (!playing) return;

    const delay = isLastStep ? CYCLE_MS : STEP_MS;
    timer.current = setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setPlaying(false);
        return;
      }
      if (isLastStep) {
        // Move to next demo
        setDemoIdx((d) => (d + 1) % DEMOS.length);
        setStepIdx(0);
      } else {
        setStepIdx((s) => s + 1);
      }
    }, delay);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [stepIdx, demoIdx, isLastStep, playing]);

  const progress = ((stepIdx + 1) / demo.states.length) * 100;

  return (
    <div
      className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <span className="ml-2 text-xs font-medium text-muted-foreground">{demo.label}</span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {stepIdx + 1}/{demo.states.length}
        </span>
      </div>

      <div className="grid sm:grid-cols-[1fr_1fr]">
        {/* Code panel */}
        <div className="min-h-[200px] overflow-hidden border-b border-border/40 bg-muted/30 p-3 font-mono text-[10px] leading-[18px] sm:border-b-0 sm:border-r sm:border-border/40">
          {demo.codeLines.map((line, i) => {
            const lineNum = i + 1;
            const isActive = lineNum === state.line;
            return (
              <div
                key={lineNum}
                className={cn(
                  "flex gap-1.5 rounded px-1.5 transition-colors duration-200",
                  isActive
                    ? "bg-primary/90 text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="w-3 shrink-0 select-none text-right text-muted-foreground/50">
                  {lineNum}
                </span>
                <span className="whitespace-pre">{line || "\u00A0"}</span>
              </div>
            );
          })}
        </div>

        {/* Visualization panel */}
        <div className="flex min-h-[200px] flex-col justify-center p-4">
          {state.visual.kind === "bars" ? (
            <HeroBars visual={state.visual} />
          ) : state.visual.kind === "pointers" ? (
            <HeroPointers visual={state.visual} />
          ) : state.visual.kind === "call-stack" ? (
            <HeroCallStack visual={state.visual} />
          ) : null}
          <p className="mt-3 min-h-[32px] text-center text-[11px] text-muted-foreground">{state.note}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Demo indicator dots */}
      <div className="flex items-center justify-center gap-2 py-2">
        {DEMOS.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              if (timer.current) clearTimeout(timer.current);
              setDemoIdx(i);
              setStepIdx(0);
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === demoIdx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
            aria-label={`Switch to ${d.label} demo`}
          />
        ))}
      </div>
    </div>
  );
}

function HeroBars({ visual }: { visual: Extract<DemoState["visual"], { kind: "bars" }> }) {
  const max = Math.max(...visual.arr);
  return (
    <div className="flex h-32 items-end justify-center gap-2">
      {visual.arr.map((value, i) => {
        const isActive = visual.active.includes(i);
        return (
          <div key={i} className="flex h-full w-8 flex-col items-center justify-end gap-1">
            <span className="text-[9px] font-semibold text-foreground">{value}</span>
            <div
              className={cn(
                "w-full rounded-t transition-all duration-400",
                visual.done
                  ? "bg-emerald-400"
                  : isActive
                    ? "bg-primary"
                    : "bg-muted-foreground/20",
              )}
              style={{ height: `${Math.max(4, (value / max) * 100)}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function HeroPointers({
  visual,
}: { visual: Extract<DemoState["visual"], { kind: "pointers" }> }) {
  const { arr, lo, hi, mid, found } = visual;
  const max = Math.max(...arr);

  return (
    <div className="flex h-32 flex-col">
      <div className="flex min-h-0 flex-1 items-end justify-center gap-2">
        {arr.map((value, i) => {
          const inRange = i >= lo && i <= hi;
          const isMid = i === mid;
          return (
            <div key={i} className="flex h-full w-8 flex-col items-center justify-end gap-1">
              {isMid ? (
                <span
                  className={cn(
                    "rounded px-1 text-[9px] font-bold",
                    found ? "bg-emerald-500 text-white" : "bg-amber-400 text-black",
                  )}
                >
                  mid
                </span>
              ) : (
                <span className="h-3.5" />
              )}
              <span className="text-[9px] font-medium text-foreground">{value}</span>
              <div
                className={cn(
                  "w-full rounded-t transition-all duration-400",
                  found && isMid
                    ? "bg-emerald-400"
                    : inRange
                      ? isMid
                        ? "bg-amber-400"
                        : "bg-primary/60"
                      : "bg-muted-foreground/15",
                )}
                style={{ height: `${Math.max(4, (value / max) * 80)}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-center gap-2 font-mono text-[10px]">
        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-semibold text-blue-700 dark:text-blue-300">
          lo {lo}
        </span>
        <span className="rounded bg-orange-500/20 px-1.5 py-0.5 font-semibold text-orange-700 dark:text-orange-300">
          hi {hi}
        </span>
        {mid !== undefined && (
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
            mid {mid}
          </span>
        )}
      </div>
    </div>
  );
}

function HeroCallStack({
  visual,
}: { visual: Extract<DemoState["visual"], { kind: "call-stack" }> }) {
  const { callStack, done } = visual;

  return (
    <div className="flex h-32 flex-col">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground/60">
          call stack
        </span>
        <span className="text-[9px] text-muted-foreground/40">top ↑</span>
      </div>
      <div className="flex flex-1 flex-col-reverse gap-1">
        {callStack.length ? (
          callStack.map((frame, i) => (
            <div
              key={`${frame}-${i}`}
              className={cn(
                "rounded px-2 py-0.5 font-mono text-[10px] transition-colors duration-200",
                done
                  ? "bg-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : i === callStack.length - 1
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/40 bg-muted/30 text-muted-foreground",
              )}
            >
              {frame}
            </div>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded border border-dashed border-border/40 text-[10px] text-muted-foreground/50">
            {done ? "✓ complete" : "— empty —"}
          </div>
        )}
      </div>
    </div>
  );
}
