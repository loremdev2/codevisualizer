"use client";

// Shared site navigation in the classic shadcnblocks "Navbar 1" pattern:
// a single h-14 row with the logo on the left and the primary actions on the
// right; nav links live inline on md+ and collapse behind a hamburger that
// opens a full-width panel below the bar on phones. Used by Home (overlay
// variant, floating over the hero image), Guide, and Learn.

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Binary, Menu, X } from "lucide-react";

import { AuthControls } from "@/components/auth-controls";
import { SearchButton } from "@/components/search-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SHOW_WHITEBOARD_UI } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

// Student-facing surfaces only — secondary links (docs, sign-in, admin) live
// in the SiteFooter so the primary nav stays focused on practice.
const NAV_ITEMS = [
  { label: "Learn", href: "/learn" },
  { label: "Guide", href: "/guide" },
  { label: "Collections", href: "/collections" },
  ...(SHOW_WHITEBOARD_UI ? [{ label: "Whiteboard", href: "/whiteboard" }] : []),
  { label: "Leaderboard", href: "/leaderboard" },
];


type SiteNavProps = {
  /** "overlay" floats transparently over a dark hero section (home page). */
  variant?: "default" | "overlay";
};

export function SiteNav({ variant = "default" }: SiteNavProps) {
  const [open, setOpen] = useState(false);
  const overlay = variant === "overlay";

  const desktopLinkClass = cn(
    "text-sm font-medium transition-colors",
    overlay ? "text-white/85 hover:text-white" : "text-muted-foreground hover:text-foreground",
  );
  const mobileLinkClass = cn(
    "block rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
    overlay
      ? "text-white/85 hover:bg-white/10 hover:text-white"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );

  return (
    <header
      className={cn(
        "z-50",
        overlay
          ? "absolute inset-x-0 top-0"
          : "sticky top-0 border-b border-border/80 bg-background/85 backdrop-blur",
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setOpen(false)}
          aria-label="DSA Lab home"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
            <Binary className="h-4 w-4" aria-hidden="true" />
          </span>
          <span
            className={cn(
              "text-sm font-semibold tracking-tight",
              overlay ? "text-white" : "text-foreground",
            )}
          >
            DSA Lab
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={desktopLinkClass}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Search + right cluster */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/visualizer">
              Open visualizer
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
          <SearchButton
            className={cn(
              "hidden md:inline-flex",
              overlay &&
                "border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white",
            )}
          />
          <ThemeToggle tone={overlay ? "dark" : "default"} />
          <div className="hidden md:block">
            <AuthControls tone={overlay ? "dark" : "light"} />
          </div>
          <Button
            type="button"
            variant={overlay ? "ghost" : "outline"}
            size="icon"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "h-9 w-9 md:hidden",
              overlay &&
                "border-white/30 bg-transparent text-white hover:bg-white/15 hover:text-white",
            )}
          >
            {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </nav>

      {/* Mobile panel — full-width dropdown under the bar (shadcnblocks pattern) */}
      <div
        className={cn(
          "md:hidden",
          overlay
            ? "border-b border-white/10 bg-neutral-950/95 backdrop-blur"
            : "border-b border-border/80 bg-background",
          open ? "block" : "hidden",
        )}
      >
        <nav className="space-y-1 px-4 py-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={mobileLinkClass}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <SearchButton className="flex-1" />
            <Button asChild size="sm" className="flex-1">
              <Link href="/visualizer" onClick={() => setOpen(false)}>
                Open visualizer
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 pt-3">
            <AuthControls tone={overlay ? "dark" : "light"} />
          </div>
        </nav>
      </div>
    </header>
  );
}
