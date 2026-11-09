"use client";

// Device-aware diagram: on screens at or above the Tailwind `sm` breakpoint
// (640px) the Mermaid chart is rendered client-side (dynamically imported, so
// Next code-splits it into a chunk loaded only where it's shown). Below that
// breakpoint the mermaid chunk is never downloaded — readers get a clean,
// numbered text flow instead, which stays legible on a phone where a wide
// diagram would be cramped. Re-renders when the site theme flips and when the
// viewport crosses the breakpoint (rotate / resize).

import { useEffect, useRef } from "react";

const SM_BREAKPOINT = "(min-width: 640px)";

type MermaidDiagramProps = {
  /** Unique, url-safe id (used inside the generated SVG). */
  id: string;
  /** The Mermaid source to render (desktop only). */
  chart: string;
  /** Accessible label + caption shown under the diagram. */
  caption?: string;
  /** Ordered steps shown in place of the diagram on small screens. */
  flow?: string[];
};

let renderCounter = 0;

export function MermaidDiagram({ id, chart, caption, flow }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let media: MediaQueryList | null = null;

    const render = async () => {
      if (cancelled) return;
      // Below the sm breakpoint the figure is hidden and the text flow is
      // shown instead — never download or run mermaid there.
      if (!window.matchMedia(SM_BREAKPOINT).matches) return;
      const mermaid = (await import("mermaid")).default;
      const dark = document.documentElement.classList.contains("dark");
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? "dark" : "default",
        securityLevel: "strict",
        themeVariables: {
          fontSize: "13.5px",
          fontFamily: "inherit",
        },
      });
      const svgId = `mmd-${id}-${++renderCounter}`;
      try {
        const { svg } = await mermaid.render(svgId, chart);
        if (!cancelled) container.innerHTML = svg;
      } catch (error) {
        if (!cancelled) {
          // Sanitize error message to prevent XSS via innerHTML.
          const safeMsg = (error instanceof Error ? error.message : String(error))
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .slice(0, 500);
          container.innerHTML = `<pre class="p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap">Diagram failed to render: ${safeMsg}</pre>`;
        }
      }
    };

    void render();

    // The site theme is a `dark` class on <html>; flip the diagram with it.
    observer = new MutationObserver(() => void render());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Re-render when the viewport crosses the sm breakpoint (rotate / resize).
    media = window.matchMedia(SM_BREAKPOINT);
    const onMediaChange = () => void render();
    media.addEventListener("change", onMediaChange);

    return () => {
      cancelled = true;
      observer?.disconnect();
      media?.removeEventListener("change", onMediaChange);
      container.innerHTML = "";
    };
  }, [id, chart]);

  return (
    <div>
      {/* Text flow — small screens, where the diagram is hidden */}
      {flow && flow.length > 0 ? (
        <ol className="space-y-2.5 rounded-md border bg-muted/30 p-4 sm:hidden">
          {flow.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 font-mono text-xs text-primary">0{index + 1}</span>
              <span className="text-sm leading-6 text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {/* Mermaid — desktop and above */}
      <figure className="hidden overflow-hidden rounded-md border bg-card sm:block">
        <div className="overflow-x-auto p-3 sm:p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full">
          <div ref={ref} role="img" aria-label={caption} />
        </div>
        {caption ? (
          <figcaption className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">{caption}</figcaption>
        ) : null}
      </figure>
    </div>
  );
}
