"use client";

import { Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type FooterBarProps = {
  speed: number;
  onSpeedChange: (ms: number) => void;
  onResetLayout: () => void;
  autoPlayAfterRun: boolean;
  onToggleAutoPlay: () => void;
};

const SPEEDS: Array<{ label: string; ms: number }> = [
  { label: "0.25x", ms: 2480 },
  { label: "0.5x", ms: 1240 },
  { label: "1x", ms: 620 },
  { label: "2x", ms: 310 },
  { label: "4x", ms: 155 },
];

export function FooterBar({
  speed,
  onSpeedChange,
  onResetLayout,
  autoPlayAfterRun,
  onToggleAutoPlay,
}: FooterBarProps) {
  return (
    <footer
      className="flex min-h-8 shrink-0 flex-wrap items-center gap-1.5 border-t border-border/80 bg-card px-2 py-0.5 text-xs text-muted-foreground sm:gap-2 sm:px-3"
      data-tour="footer"
    >
      <span className="hidden sm:inline">Speed</span>
      <div className="flex items-center gap-0.5">
        {SPEEDS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onSpeedChange(option.ms)}
            className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
              speed === option.ms
                ? "bg-primary text-primary-foreground"
                : "hover:text-foreground"
            }`}
            aria-pressed={speed === option.ms}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleAutoPlay}
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium transition-colors ${
          autoPlayAfterRun
            ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
            : "hover:text-foreground"
        }`}
        aria-pressed={autoPlayAfterRun}
        title="Automatically start playback after clicking Run"
      >
        <Play className="h-3 w-3" aria-hidden="true" />
        Auto-play
      </button>

      <div className="flex-1" />

      <span className="hidden text-[10px] text-muted-foreground/70 lg:inline">
        Space play · ←/→ step · Home/End jump
      </span>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-2 text-[11px] text-muted-foreground"
        onClick={onResetLayout}
        title="Reset layout"
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        <span className="hidden sm:inline">Reset layout</span>
      </Button>
    </footer>
  );
}
