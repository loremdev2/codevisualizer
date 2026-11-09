"use client";

import { useState } from "react";

// Tiny build identity in the site footer: shows the deployed commit SHA by
// default and expands to the full SHA + build time on click. Lets you confirm
// a deployed UI matches the latest commit. NEXT_PUBLIC_BUILD_SHA/TIME are
// inlined at build time by next.config.ts.
const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA ?? "dev";
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";

export function BuildStamp() {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((value) => !value)}
      title={expanded ? "Hide build details" : "Show build details"}
      className="font-mono text-[10px] leading-4 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
    >
      {expanded ? (
        <>
          build {BUILD_SHA}
          {BUILD_TIME ? ` · ${new Date(BUILD_TIME).toLocaleString()}` : ""}
        </>
      ) : (
        <>v{BUILD_SHA}</>
      )}
    </button>
  );
}
