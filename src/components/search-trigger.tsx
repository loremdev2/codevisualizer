"use client";

// ---------------------------------------------------------------------------
// SearchTrigger — provides the Cmd+K / Ctrl+K keyboard shortcut and renders
// the search button that appears in the SiteNav. The actual palette modal is
// rendered once at the layout level; this component just controls its open
// state and exposes it to the nav via a shared context / callback pattern.
//
// Because SiteNav is a server-safe component, the keyboard listener and the
// search button it renders are separated into this client-only wrapper that
// mounts inside the layout.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Search } from "lucide-react";

import { CommandPalette } from "@/components/command-palette";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Context so the nav bar can trigger the palette open without prop drilling.
// ---------------------------------------------------------------------------

type SearchContextValue = {
  openPalette: () => void;
};

const SearchContext = createContext<SearchContextValue>({
  openPalette: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

// ---------------------------------------------------------------------------
// Provider — wraps the children and renders the palette + keyboard listener.
// ---------------------------------------------------------------------------

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openPalette = useCallback(() => setOpen(true), []);
  const closePalette = useCallback(() => setOpen(false), []);

  // Global keyboard shortcut: Cmd+K (macOS) or Ctrl+K (others).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider value={{ openPalette }}>
      {children}
      <CommandPalette open={open} onClose={closePalette} />
    </SearchContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SearchButton — the trigger that appears in the SiteNav. On click it opens
// the palette. Also shows the ⌘K / Ctrl+K shortcut hint.
// ---------------------------------------------------------------------------

export function SearchButton({ className }: { className?: string }) {
  const { openPalette } = useSearch();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={openPalette}
      className={className}
      aria-label="Search (⌘K)"
    >
      <Search className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:flex">
        ⌘K
      </kbd>
    </Button>
  );
}
