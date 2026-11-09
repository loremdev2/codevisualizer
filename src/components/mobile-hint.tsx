"use client";

import { useEffect, useState } from "react";
import { Monitor, X } from "lucide-react";

/**
 * Sticky banner that appears on mobile screens suggesting the user try
 * the app on a larger screen. Shows on every page load on mobile — the ×
 * button dismisses it for the current page only.
 */
export function MobileHint() {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile-width viewports.
    if (window.innerWidth >= 768) return;

    // Small delay so it doesn't flash on page load.
    const showTimer = setTimeout(() => {
      setShow(true);
      // Trigger the slide-in animation on the next frame after mounting.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    }, 800);

    return () => clearTimeout(showTimer);
  }, []);

  function dismiss() {
    setVisible(false);
    setTimeout(() => setShow(false), 300);
  }

  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-0 right-0 top-14 z-[60] flex items-center justify-center gap-2.5 border-b border-border/80 bg-card/95 px-4 py-2.5 text-sm text-foreground shadow-md backdrop-blur-sm transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <Monitor className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="text-center text-[13px] leading-tight">
        <span className="font-medium">Best on desktop</span>{" "}
        <span className="text-muted-foreground">
          — try it on a bigger screen for the full experience.
        </span>
      </span>
      <button
        type="button"
        onClick={dismiss}
        className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
