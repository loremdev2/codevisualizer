"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Play, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "dsa.welcome-banner.seen";

function hasSeenBanner(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // storage unavailable
  }
}

type WelcomeBannerProps = {
  onRun: () => void;
  onStartTour: () => void;
  /** Name of the currently loaded template (e.g. "Merge Sorted Array"). */
  templateName?: string;
};

/**
 * A prominent first-run welcome banner that shows above the workspace.
 * Displays once per browser (localStorage persisted) with:
 * - Algorithm name (Bubble Sort)
 * - "Hit Run" CTA button
 * - "Take the tour" link
 * - Dismiss button
 *
 * Auto-hides after the user runs a trace or dismisses it.
 */
export function WelcomeBanner({ onRun, onStartTour, templateName }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show on SSR or if already seen
    if (typeof window === "undefined") return;
    if (hasSeenBanner()) return;
    // Small delay so it doesn't flash on fast hydration
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    markSeen();
    setVisible(false);
  };

  const handleRun = () => {
    markSeen();
    setVisible(false);
    onRun();
  };

  if (!visible) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-5 py-4">
      {/* Decorative sparkle */}
      <Sparkles
        className="absolute right-4 top-3 h-5 w-5 text-primary/30"
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Welcome to DSA Lab 👋
          </p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            <span className="font-medium text-foreground/80">{templateName ?? "The algorithm"}</span> is loaded and ready.
            Hit <span className="font-medium text-foreground/80">Run</span> to see the algorithm
            step through comparisons and swaps in real time.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 px-3 text-xs font-semibold"
            onClick={handleRun}
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Run it
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2.5 text-xs text-muted-foreground"
            onClick={() => {
              dismiss();
              onStartTour();
            }}
          >
            Take the tour
          </Button>

          <button
            type="button"
            onClick={dismiss}
            className="rounded p-1 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            aria-label="Dismiss welcome banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
