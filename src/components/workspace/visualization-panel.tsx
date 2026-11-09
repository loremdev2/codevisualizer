"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Columns2, GitBranch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PanelContainer } from "@/components/panel-container";
import { CallTreeView } from "@/components/workspace/call-tree-diagram";
import { VisualizationCanvas } from "@/components/visualization-canvas";
import type { RunPhase } from "@/components/workspace/io-strip";
import { getLanguageInfo, type SupportedLanguage } from "@/lib/detect-language";
import type { VisualStep } from "@/types/visualizer";

type VisualizationPanelProps = {
  step?: VisualStep;
  previousStep?: VisualStep;
  stepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  mainLabel: string;
  // Full trace for the Call tree tab (recursion data-flow diagram).
  steps: VisualStep[];
  currentIndex: number;
  // Run-pipeline stage (drives the run-in-progress skeleton when a new run
  // is building and there are no steps yet).
  runPhase: RunPhase;
  /** True for languages traced via AI translation (Java/C++). */
  needsTranslation: boolean;
  language: SupportedLanguage;
  // Comparison (A/B) mode
  compareMode: boolean;
  onToggleCompare: () => void;
  compareLabel: string;
  compareSteps: VisualStep[];
};

type ViewMode = "state" | "tree";

export function VisualizationPanel({
  step,
  previousStep,
  stepIndex,
  totalSteps,
  isPlaying,
  mainLabel,
  steps,
  currentIndex,
  runPhase,
  needsTranslation,
  language,
  compareMode,
  onToggleCompare,
  compareLabel,
  compareSteps,
}: VisualizationPanelProps) {
  const [view, setView] = useState<ViewMode>("state");
  const hasCompare = compareSteps.length > 0;
  const compareIndex = Math.min(stepIndex, Math.max(compareSteps.length - 1, 0));
  // A run is building the trace (translate or trace stage) and there is
  // nothing to show yet — render the animated placeholder instead of the
  // static "Run the code" empty state, so the canvas reads as working.
  const runInProgress = (runPhase === "translate" || runPhase === "trace") && totalSteps === 0;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Switching tabs starts from the top. Stepping keeps the current scroll
  // position so the part of the visualization the student is looking at stays
  // put — the step header is sticky, so it never scrolls out of view even on
  // tall content, and its height is constant across steps.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [view]);

  const viewToggle = (
    <div className="flex h-6 shrink-0 items-center gap-0.5 rounded-md bg-muted p-0.5">
      {(
        [
          { mode: "state", label: "State" },
          { mode: "tree", label: "Call tree" },
        ] as const
      ).map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => setView(mode)}
          className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
            view === mode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={view === mode}
          title={
            mode === "tree"
              ? "Recursion data-flow: one circle per call, with return values bubbling back up"
              : "Current data-structure state"
          }
        >
          {mode === "tree" ? <GitBranch className="h-3 w-3" aria-hidden="true" /> : null}
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <section
      className="flex h-full min-h-0 flex-col bg-card"
      aria-label="Visualization"
      data-tour="viz"
    >
      <header className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-border/80 px-2">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          Visualization
          {compareMode ? (
            <span className="text-[10px] font-medium normal-case tracking-normal text-muted-foreground">
              · A/B
            </span>
          ) : null}
        </span>
        {viewToggle}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={compareMode ? "default" : "ghost"}
            size="sm"
            className="h-6 gap-1 px-2 text-[10px]"
            aria-pressed={compareMode}
            data-tour="compare"
            title={
              compareMode
                ? "Comparing this run against a second run — toggle off to focus"
                : "Run a second trace side-by-side (same template, reversed input)"
            }
            onClick={onToggleCompare}
          >
            <Columns2 className="h-3 w-3" aria-hidden="true" />
            Compare
          </Button>
          {totalSteps > 0 ? (
            <Badge variant="outline" className="h-5 px-2 text-[10px]" title="Current step in this run">
              Step {stepIndex + 1} / {totalSteps}
            </Badge>
          ) : null}
          <Badge variant={isPlaying ? "default" : "secondary"} className="h-5 px-2 text-[10px]">
            {isPlaying ? "Playing" : "Paused"}
          </Badge>
        </div>
      </header>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto p-3">
        {view === "tree" ? (
          <PanelContainer filename="call-tree">
            <div className="rounded-md border border-border/60 bg-background/40 p-3">
              <CallTreeView steps={steps} currentIndex={currentIndex} />
            </div>
          </PanelContainer>
        ) : compareMode && hasCompare ? (
          <div className="grid gap-3 xl:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {mainLabel}
              </div>
              <VisualizationCanvas step={step} previousStep={previousStep} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {compareLabel}
                </span>
                <Badge variant="outline" className="h-5 shrink-0 px-2 text-[10px]">
                  Step {compareIndex + 1} / {compareSteps.length}
                </Badge>
              </div>
              <VisualizationCanvas
                step={compareSteps[compareIndex]}
                previousStep={compareSteps[Math.max(compareIndex - 1, 0)]}
              />
            </div>
          </div>
        ) : runInProgress ? (
          <RunInProgressLoader
            runPhase={runPhase}
            needsTranslation={needsTranslation}
            language={language}
          />
        ) : (
          <VisualizationCanvas step={step} previousStep={previousStep} />
        )}
      </div>
    </section>
  );
}

/**
 * Animated placeholder shown while a run is building its first steps
 * (translate / trace stages with no trace yet). Mirrors the shape of the
 * array visualizer — a shimmering header card and a row of bars — so the
 * canvas reads as "working" instead of a static gray empty state. The pulse
 * dot captions the exact pipeline stage.
 */
function RunInProgressLoader({
  runPhase,
  needsTranslation,
  language,
}: {
  runPhase: RunPhase;
  needsTranslation: boolean;
  language: SupportedLanguage;
}) {
  const languageLabel = getLanguageInfo(language).label;
  const label =
    runPhase === "translate"
      ? `Translating ${languageLabel} → JavaScript…`
      : needsTranslation
        ? "Tracing the translated code…"
        : `Tracing your ${languageLabel} code…`;
  const sublabel =
    language === "python" && runPhase === "trace"
      ? "The Python runtime loads on the first run (~15 MB)"
      : "Building the trace — every state change becomes a step";

  // Varied bar heights so the placeholder reads like an array, not a block.
  const bars = [64, 96, 52, 120, 76, 140, 60, 104, 84, 128, 70, 92];

  return (
    <div className="space-y-4" aria-live="polite" role="status">
      <div className="rounded-lg border border-border/70 bg-card p-3">
        <div className="dsa-shimmer h-4 w-40 rounded" />
        <div className="dsa-shimmer mt-2 h-3 w-64 max-w-full rounded" />
      </div>
      <div className="rounded-md border bg-background/70 p-4">
        <div className="flex h-56 items-end gap-2">
          {bars.map((height, index) => (
            <div
              key={index}
              className="dsa-shimmer flex-1 rounded-t-md"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
        <div className="mt-2 grid grid-cols-12 gap-2">
          {Array.from({ length: 12 }, (_, index) => (
            <div key={index} className="dsa-shimmer h-3 rounded" />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2.5 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="hidden sm:inline">· {sublabel}</span>
      </div>
    </div>
  );
}
