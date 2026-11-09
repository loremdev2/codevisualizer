"use client";

// ---------------------------------------------------------------------------
// PanelContainer — wraps any visualization panel with a floating export
// button in the top-right corner. The button lets the user copy the panel
// as a PNG to clipboard or download it as a file.
//
// Unlike a header-based approach, this overlays on top of the existing panel
// styling without modifying the internal renderer components.
// ---------------------------------------------------------------------------

import { useRef } from "react";

import { PanelExportButton } from "@/components/panel-export-button";

type PanelContainerProps = {
  /** Filename stem for downloads (e.g. "recursion-tree"). */
  filename?: string;
  /** The panel content to wrap. */
  children: React.ReactNode;
};

export function PanelContainer({ filename, children }: PanelContainerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={panelRef} className="relative">
      {children}
      {/* Floating export button in the top-right corner */}
      <div className="absolute right-2 top-2 z-10">
        <PanelExportButton panelRef={panelRef} filename={filename} />
      </div>
    </div>
  );
}
