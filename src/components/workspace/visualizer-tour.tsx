"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { VisualStep } from "@/types/visualizer";

const TOUR_SEEN_KEY = "dsa.tour.seen";
const SEEN_EVENT = "dsa-tour-seen";

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function writeSeen() {
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    // Storage unavailable — the tour will just show again next visit.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

function subscribeToSeen(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SEEN_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SEEN_EVENT, onStoreChange);
  };
}

type TourStep = {
  id: string;
  title: string;
  body: string;
  /** Value of the `data-tour` attribute on the element to spotlight. */
  target?: string;
  /** Advance the trace by this many steps shortly after showing (live demo). */
  autoStep?: number;
};

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to DSA Lab 👋",
    body: "This is a step-by-step visualizer for algorithms. Bubble sort is loaded — let's see it in action.",
  },
  {
    id: "run",
    target: "run",
    title: "1 · Hit Run",
    body: "Run traces your code line by line and builds the step timeline. You can also write your own code or pick a different algorithm from the presets.",
  },
  {
    id: "playback",
    target: "playback",
    title: "2 · Step through it",
    body: "Step forward and back, press ▶ to auto-play, or drag the slider. The active code line follows along — watch comparisons, swaps, and variable changes happen.",
    autoStep: 4,
  },
  {
    id: "viz",
    target: "viz",
    title: "3 · The visualization",
    body: "Arrays become animated bars, trees grow, graphs trace paths. Colored arrows show which index each variable points at.",
    autoStep: 6,
  },
  {
    id: "finish",
    title: "You're all set 🚀",
    body: "Try the Compare mode to pit brute force vs optimal side-by-side, or head to the Learn page for the Top Interview 150 question bank.",
  },
];

const CARD_WIDTH = 372;

type VisualizerTourProps = {
  /** Forced open from a button; closes via onClose. */
  open: boolean;
  onClose: () => void;
  /** Auto-show once for first-time visitors (persisted). */
  autoOpen: boolean;
  steps: VisualStep[];
  currentIndex: number;
  onSeek: (index: number) => void;
};

export function VisualizerTour({
  open,
  onClose,
  autoOpen,
  steps,
  currentIndex,
  onSeek,
}: VisualizerTourProps) {
  const seen = useSyncExternalStore(subscribeToSeen, readSeen, () => true);
  const [ready, setReady] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const activatedRef = useRef<number | null>(null);

  // getServerSnapshot returns true, so SSR and the first client render agree
  // (no tour flash for returning users); the real flag is read after hydration.
  const visible = open || (ready && autoOpen && !seen);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const handleClose = useCallback(() => {
    writeSeen();
    setStepIndex(0);
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleClose();
      return;
    }
    // Clamp against overshoot: rapid repeated clicks share a stale `isLast`
    // closure, and the functional update would otherwise push stepIndex past
    // the end of TOUR_STEPS (step becomes undefined → crash).
    setStepIndex((index) => (index >= TOUR_STEPS.length - 1 ? index : index + 1));
  }, [isLast, handleClose]);

  // Measure the spotlighted element; re-measure on resize or any scroll.
  const measure = useCallback(() => {
    const target = step?.target;
    if (!target) {
      setRect(null);
      return;
    }
    const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    const next = element?.getBoundingClientRect();
    setRect(next && next.width > 0 && next.height > 0 ? next : null);
  }, [step?.target]);

  useEffect(() => {
    // Defer the first measurement so the layout has settled before reading rects.
    const raf = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    document.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      document.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  // Escape skips the tour; keep focus on Next so Enter advances it.
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    nextRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, handleClose]);

  // Live demo: when a step asks for it, advance the trace a few steps so the
  // user watches the visualization/variables react (only if a trace exists).
  useEffect(() => {
    if (!visible) return;
    if (activatedRef.current === stepIndex) return;
    activatedRef.current = stepIndex;
    const autoStep = step?.autoStep;
    if (!autoStep || steps.length <= 1) return;
    const timer = window.setTimeout(() => {
      onSeek(Math.min(currentIndex + autoStep, steps.length - 1));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [visible, stepIndex, step?.autoStep, steps.length, currentIndex, onSeek]);

  const cardPlacement = useMemo(() => {
    // Runs during SSR too (hooks can't be conditional), so guard browser-only
    // globals — the card is centered as a safe fallback pre-hydration.
    if (typeof window === "undefined") {
      return { left: "50%", top: "40%", transform: "translate(-50%, -50%)", width: CARD_WIDTH } as const;
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(CARD_WIDTH, viewportWidth - 24);
    if (!rect) {
      return { left: "50%", top: "40%", transform: "translate(-50%, -50%)", width } as const;
    }
    const gap = 14;
    const placeAbove = rect.top > viewportHeight / 2;
    const left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12));
    return placeAbove
      ? ({ left, bottom: viewportHeight - rect.top + gap, width } as const)
      : ({ left, top: rect.bottom + gap, width } as const);
  }, [rect]);

  if (!visible) return null;

  const highlight = rect
    ? {
        left: rect.left - 5,
        top: rect.top - 5,
        width: rect.width + 10,
        height: rect.height + 10,
      }
    : null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Visualizer tour">
      {highlight ? (
        <div
          className="pointer-events-none fixed rounded-lg border-2 border-[hsl(var(--ring))]"
          style={{
            ...highlight,
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)",
          }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-foreground/25" />
      )}

      <div
        className="pointer-events-auto fixed max-h-[72vh] overflow-y-auto rounded-xl border bg-card p-4 shadow-2xl"
        style={cardPlacement as React.CSSProperties}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Step {stepIndex + 1} of {TOUR_STEPS.length}
          </span>
          <button
            type="button"
            aria-label="Skip tour"
            className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="mt-2 text-base font-semibold leading-6">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((item, index) => (
              <span
                key={item.id}
                className={`h-1 rounded-full transition-all ${
                  index === stepIndex ? "w-4 bg-primary" : "w-1 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleClose}>
              Skip tour
            </Button>
            <Button type="button" size="sm" className="h-7 gap-1 px-2.5 text-xs" ref={nextRef} onClick={handleNext}>
              {isLast ? "Finish" : "Next"}
              {!isLast ? <ChevronRight className="h-3.5 w-3.5" /> : null}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
