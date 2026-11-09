"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { PanelImperativeHandle, PanelSize } from "react-resizable-panels";

const COLLAPSED_KEY = "dsa-lab-collapsed";

function readCollapsedState(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCollapsedState(key: string, collapsed: boolean) {
  try {
    const next = { ...readCollapsedState(), [key]: collapsed };
    window.localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — collapse state just won't persist.
  }
}

/**
 * Manages a collapsible resizable panel: a header toggle collapses the panel to
 * a thin strip (its header stays visible), drags past the min size collapse it
 * too, and the collapsed state survives reloads.
 */
export function useCollapsiblePanel(
  storageKey: string,
  ref: RefObject<PanelImperativeHandle | null>,
) {
  // Start expanded on every render (server and hydration agree); the persisted
  // collapse state is restored by the effect below after the panel mounts.
  const [collapsed, setCollapsed] = useState(false);
  const restoredRef = useRef(false);

  // Restore a persisted collapsed state after the panel mounts.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const shouldCollapse = readCollapsedState()[storageKey] ?? false;
    if (shouldCollapse) {
      // Defer so the initial layout (saved sizes) applies first.
      window.setTimeout(() => {
        const panel = ref.current;
        if (panel && !panel.isCollapsed()) panel.collapse();
      }, 0);
    }
  }, [ref, storageKey]);

  const onResize = useCallback(
    (size: PanelSize) => {
      // A collapsed strip is ~34px; treat anything under 60px as collapsed so
      // drag-collapses and double-click resets stay in sync with the toggle.
      const next = size.inPixels <= 60;
      setCollapsed((current) => {
        if (current === next) return current;
        writeCollapsedState(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const toggle = useCallback(() => {
    const panel = ref.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
    // onResize will flip the state; the toggle itself is just the trigger.
  }, [ref]);

  return { collapsed, onResize, toggle };
}

export function clearCollapsedState() {
  try {
    window.localStorage.removeItem(COLLAPSED_KEY);
  } catch {
    // Ignore.
  }
}
