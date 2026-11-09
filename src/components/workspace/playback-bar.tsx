"use client";

import {
  ChevronLeft,
  ChevronRight,
  Link2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type PlaybackBarProps = {
  canStep: boolean;
  currentIndex: number;
  maxIndex: number;
  isPlaying: boolean;
  onSeek: (index: number) => void;
  onTogglePlay: () => void;
  stepTitle?: string;
  onCopyLink: () => void;
  /** Opens the step tutor. Omitted in embeds, where the tutor is not shown. */
  onAskTutor?: () => void;
  canAskTutor?: boolean;
};

export function PlaybackBar({
  canStep,
  currentIndex,
  maxIndex,
  isPlaying,
  onSeek,
  onTogglePlay,
  stepTitle,
  onCopyLink,
  onAskTutor,
  canAskTutor,
}: PlaybackBarProps) {
  return (
    <div
      className="flex h-14 shrink-0 items-center gap-3 border-b border-border/80 bg-card px-3"
      data-tour="playback"
    >
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="First step"
          disabled={!canStep || currentIndex === 0}
          onClick={() => onSeek(0)}
        >
          <SkipBack className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Previous step"
          disabled={!canStep || currentIndex === 0}
          onClick={() => onSeek(Math.max(currentIndex - 1, 0))}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          disabled={!canStep}
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="h-8 w-8 rounded-full p-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4 translate-x-px" aria-hidden="true" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Next step"
          disabled={!canStep || currentIndex >= maxIndex}
          onClick={() => onSeek(Math.min(currentIndex + 1, maxIndex))}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          aria-label="Last step"
          disabled={!canStep || currentIndex >= maxIndex}
          onClick={() => onSeek(maxIndex)}
        >
          <SkipForward className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <Slider
        className="min-w-0 flex-1"
        value={[currentIndex]}
        min={0}
        max={maxIndex}
        step={1}
        disabled={!canStep}
        onValueChange={(value) => onSeek(value[0] ?? 0)}
      />

      <div className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {canStep ? currentIndex + 1 : 0} / {maxIndex + 1}
        </span>
        {stepTitle ? (
          <span className="hidden max-w-56 truncate text-xs text-muted-foreground md:inline">
            — {stepTitle}
          </span>
        ) : null}
        {onAskTutor ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground"
            disabled={!canAskTutor}
            onClick={onAskTutor}
            aria-label="Ask about this step"
            title="Ask the tutor about the step you're looking at"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Ask</span>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hidden h-7 w-7 text-muted-foreground sm:inline-flex"
          aria-label="Copy link to this step"
          title="Copy a link that opens this run at the current step"
          disabled={!canStep}
          onClick={onCopyLink}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
