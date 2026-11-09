"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Minus, Plus } from "lucide-react";

// ---------------------------------------------------------------------------
// Panel content zoom (Variables / Call stack), persisted per panel — mirrors
// the code editor's font-size zoom UX. Applied as the CSS `zoom` property on
// the panel's content wrapper so every child (text, tables, SVGs) scales.
// ---------------------------------------------------------------------------

export const PANEL_ZOOM_MIN = 0.7;
export const PANEL_ZOOM_MAX = 1.6;
export const PANEL_ZOOM_STEP = 0.05;
const ZOOM_EVENT = "dsa-panel-zoom";

const clampZoom = (value: number) =>
  Math.min(PANEL_ZOOM_MAX, Math.max(PANEL_ZOOM_MIN, Math.round(value * 100) / 100));

function readZoom(key: string): number {
  try {
    const raw = window.localStorage.getItem(`dsa.panelZoom.${key}`);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed) ? clampZoom(parsed) : 1;
  } catch {
    return 1;
  }
}

function writeZoom(key: string, value: number) {
  try {
    window.localStorage.setItem(`dsa.panelZoom.${key}`, String(clampZoom(value)));
  } catch {
    // Storage unavailable — the zoom just won't persist.
  }
  window.dispatchEvent(new Event(ZOOM_EVENT));
}

// getServerSnapshot keeps SSR and the first client render in agreement; the
// real stored value is read after hydration (same pattern as the media query
// hook in resizable-workspace).
function subscribeToZoom(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(ZOOM_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(ZOOM_EVENT, onStoreChange);
  };
}

export function usePanelZoom(key: string) {
  const zoom = useSyncExternalStore(
    subscribeToZoom,
    () => readZoom(key),
    () => 1,
  );
  const setZoom = useCallback((next: number) => writeZoom(key, next), [key]);
  return [zoom, setZoom] as const;
}

/** Removes every stored panel zoom and notifies panels to fall back to 100%. */
export function resetPanelZoom() {
  const prefix = "dsa.panelZoom.";
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(prefix)) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable — the zoom just won't reset there.
  }
  window.dispatchEvent(new Event(ZOOM_EVENT));
}

/** Compact `− 100% +` stepper for a panel header. */
export function PanelZoomControls({
  zoom,
  onZoomChange,
}: {
  zoom: number;
  onZoomChange: (value: number) => void;
}) {
  const percent = Math.round(zoom * 100);
  return (
    <div
      className="flex h-6 shrink-0 items-center gap-0.5 rounded-md bg-muted p-0.5"
      aria-label="Panel zoom"
    >
      <button
        type="button"
        aria-label="Decrease panel zoom"
        title="Zoom out"
        onClick={() => onZoomChange(zoom - PANEL_ZOOM_STEP)}
        className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
      >
        <Minus className="h-3 w-3" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Reset panel zoom"
        title="Reset zoom to 100%"
        onClick={() => onZoomChange(1)}
        className="min-w-8 rounded px-1 text-center text-[10px] font-semibold tabular-nums text-muted-foreground transition-colors hover:text-foreground"
      >
        {percent}%
      </button>
      <button
        type="button"
        aria-label="Increase panel zoom"
        title="Zoom in"
        onClick={() => onZoomChange(zoom + PANEL_ZOOM_STEP)}
        className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Ctrl/Cmd + wheel zooms the panel content, matching the code editor. Attach
 * to the content wrapper: `onWheel={handlePanelWheel(zoom, onZoomChange)}`.
 */
export function handlePanelWheel(
  event: React.WheelEvent,
  zoom: number,
  onZoomChange: (value: number) => void,
) {
  if (!(event.ctrlKey || event.metaKey)) return;
  event.preventDefault();
  onZoomChange(zoom + (event.deltaY < 0 ? PANEL_ZOOM_STEP : -PANEL_ZOOM_STEP));
}
