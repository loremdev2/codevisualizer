"use client";

import { useMemo, useState } from "react";
import { CornerDownRight, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PanelContainer } from "@/components/panel-container";
import { CallTreeView } from "@/components/workspace/call-tree-diagram";
import {
  handlePanelWheel,
  PanelZoomControls,
  usePanelZoom,
} from "@/components/workspace/panel-zoom";
import type { VisualStep } from "@/types/visualizer";

type CallStackPanelProps = {
  steps: VisualStep[];
  currentIndex: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

type ViewMode = "stack" | "tree";

export function CallStackPanel({
  steps,
  currentIndex,
  collapsed,
  onToggleCollapsed,
}: CallStackPanelProps) {
  const [view, setView] = useState<ViewMode>("stack");
  const [zoom, setZoom] = usePanelZoom("callstack");

  const currentStep = steps[currentIndex];
  const frames = useMemo(() => currentStep?.callStack ?? [], [currentStep]);

  const isReturnStep = currentStep?.title === "Return";
  const topFrameReturned =
    isReturnStep && frames.length > 0 ? currentStep?.note : undefined;

  const viewToggle = (
    <div className="flex h-6 shrink-0 items-center gap-0.5 rounded-md bg-muted p-0.5">
      {(["stack", "tree"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setView(mode)}
          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
            view === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={view === mode}
        >
          {mode}
        </button>
      ))}
    </div>
  );

  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-label="Call stack"
      data-tour="callstack"
    >
      <header className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-border/80 px-2">
        <h2 className="truncate text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
          Call stack
        </h2>
        {!collapsed ? viewToggle : null}
        {!collapsed ? <PanelZoomControls zoom={zoom} onZoomChange={setZoom} /> : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground"
          aria-label={collapsed ? "Expand call stack" : "Collapse call stack"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <Plus className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
        </Button>
      </header>

      {collapsed ? null : (
        <div
          className="min-h-0 flex-1 overflow-auto p-1.5"
          style={{ zoom }}
          onWheel={(event) => handlePanelWheel(event, zoom, setZoom)}
        >
          {!currentStep ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Run the code to see the call stack here.
            </p>
          ) : view === "stack" ? (
            frames.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No active calls at this step.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {[...frames].reverse().map((frame, index) => {
                  const isTop = index === frames.length - 1;
                  return (
                    <div
                      key={`${frame}-${index}`}
                      className={
                        isTop
                          ? "rounded-md border border-teal-500/50 bg-teal-500/10 px-2.5 py-1.5"
                          : "rounded-md border border-border bg-muted/30 px-2.5 py-1.5"
                      }
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="min-w-0 flex-1 truncate font-mono text-[12px] text-foreground/90"
                          title={String(frame)}
                        >
                          {String(frame)}
                        </span>
                        {isTop && currentStep?.line ? (
                          <span className="shrink-0 rounded bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                            line {currentStep.line}
                          </span>
                        ) : null}
                      </div>
                      {isTop && topFrameReturned ? (
                        <div className="mt-0.5 flex items-center gap-1 truncate font-mono text-[11px] text-teal-500">
                          <CornerDownRight className="h-3 w-3 shrink-0" />
                          <span className="truncate">{topFrameReturned}</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <PanelContainer filename="call-tree">
              <CallTreeView steps={steps} currentIndex={currentIndex} />
            </PanelContainer>
          )}
        </div>
      )}
    </section>
  );
}
