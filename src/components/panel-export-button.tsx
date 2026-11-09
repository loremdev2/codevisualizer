"use client";

// ---------------------------------------------------------------------------
// PanelExportButton — a small dropdown in the top-right corner of each
// visualization panel that lets the user copy the panel as a PNG image
// to the clipboard or download it as a file.
//
// Uses html-to-image (already installed) to capture the parent panel's DOM
// node as a PNG blob. The button renders a Download icon; clicking it opens
// a small dropdown with "Copy as image" and "Download as PNG" options.
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Check, Copy, Download, Camera } from "lucide-react";

import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/** Detect dark mode from the document's class list (Tailwind dark class). */
function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

type PanelExportButtonProps = {
  /** Ref to the DOM node that should be captured (the panel wrapper). */
  panelRef: React.RefObject<HTMLDivElement | null>;
  /** Optional filename stem for downloads (e.g. "recursion-tree"). */
  filename?: string;
};

export function PanelExportButton({ panelRef, filename = "visualization" }: PanelExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const capture = useCallback(async (): Promise<string | null> => {
    const node = panelRef.current;
    if (!node) return null;

    // Temporarily hide the export button (and its dropdown) so it doesn't
    // appear in the captured image.
    const exportContainer = menuRef.current;
    const previousDisplay = exportContainer?.style.display;
    if (exportContainer) exportContainer.style.display = "none";

    try {
      return await toPng(node, {
        pixelRatio: 2,
        backgroundColor: isDarkMode() ? "hsl(240 10% 3.9%)" : "hsl(0 0% 100%)",
        style: { borderRadius: "0" },
      });
    } finally {
      if (exportContainer) exportContainer.style.display = previousDisplay ?? "";
    }
  }, [panelRef]);

  const handleCopy = useCallback(async () => {
    setCopying(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast({ title: "Copied to clipboard", description: "Image copied — paste it anywhere." });
    } catch {
      // Clipboard API may fail in some browsers/contexts — silently ignore.
    } finally {
      setCopying(false);
      setOpen(false);
    }
  }, [capture]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const dataUrl = await capture();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Image downloaded", description: `${filename}.png saved to your downloads.` });
    } catch {
      // silently ignore
    } finally {
      setDownloading(false);
      setOpen(false);
    }
  }, [capture, filename]);

  // Attach/detach outside click listener.
  // We use a mousedown listener to close before the button's own click fires.
  const handleTriggerClick = useCallback(() => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    const listener = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        document.removeEventListener("mousedown", listener);
      }
    };
    // Delay to avoid the current click from immediately closing the menu.
    setTimeout(() => document.addEventListener("mousedown", listener), 0);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleTriggerClick}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-foreground",
          open && "bg-accent text-foreground",
        )}
        aria-label="Export panel as image"
        aria-expanded={open}
      >
        <Camera className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={copying}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {copying ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copying ? "Copied!" : "Copy as image"}
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {downloading ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {downloading ? "Downloading…" : "Download as PNG"}
          </button>
        </div>
      )}
    </div>
  );
}
