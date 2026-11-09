"use client";

// ---------------------------------------------------------------------------
// Command palette — Cmd+K / Ctrl+K search overlay.
//
// Opens as a centered modal with a search input at the top, grouped fuzzy
// results below, keyboard navigation (↑/↓/Enter/Escape), and a footer with
// shortcut hints. Every result navigates via next/link-style push.
//
// Built with framer-motion (already in the project) for enter/exit
// animations and Tailwind for styling — no new UI library dependencies.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Hash,
  Home,
  Play,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { searchAll, groupByCategory, type SearchEntry, type SearchEntrySource } from "@/lib/search-index";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Icon resolver — maps the optional `icon` name on a SearchEntry to a
// small Lucide icon. Keeps the index data as plain strings.
// ---------------------------------------------------------------------------

function ResultIcon({ entry }: { entry: SearchEntry }) {
  // Use a simple switch for the icons we actually use. Falls back to Hash.
  switch (entry.icon) {
    case "Home":
      return <Home className="h-4 w-4" />;
    case "Play":
      return <Play className="h-4 w-4" />;
    case "FileText":
      return <FileText className="h-4 w-4" />;
    default:
      return <Hash className="h-4 w-4" />;
  }
}

// ---------------------------------------------------------------------------
// Source badge — colored pill showing which problem bank a result comes from.
// ---------------------------------------------------------------------------

const SOURCE_STYLES: Record<SearchEntrySource, { label: string; className: string }> = {
  general: { label: "", className: "" },
  top150: {
    label: "Top 150",
    className: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  },
  neetcode: {
    label: "NeetCode",
    className: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
  },
  sorting: {
    label: "Sorting",
    className: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/10 dark:text-violet-400",
  },
  template: {
    label: "Algo",
    className: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  },
};

function SourceBadge({ source }: { source?: SearchEntrySource }) {
  if (!source || source === "general") return null;
  const style = SOURCE_STYLES[source];
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-none",
        style.className,
      )}
    >
      {style.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Flatten grouped results into a single navigable list.
  const [results, setResults] = useState<SearchEntry[]>([]);
  useEffect(() => {
    let cancelled = false;
    searchAll(query).then((r) => {
      if (!cancelled) {
        setResults(r);
        setActiveIndex(0); // reset selection whenever results change
      }
    });
    return () => { cancelled = true; };
  }, [query]);
  const grouped = useMemo(() => groupByCategory(results), [results]);
  const flatResults = useMemo(() => results, [results]);

  // Reset the query/selection when the palette opens. Render-phase state
  // adjustment is the React-documented alternative to a reset effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  // Focus the input when opened.
  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM is painted.
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Scroll the active item into view.
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Navigate to a result.
  const navigate = useCallback(
    (entry: SearchEntry) => {
      onClose();
      router.push(entry.url);
    },
    [onClose, router],
  );

  // Keyboard handling.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (flatResults[activeIndex]) {
            navigate(flatResults[activeIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab":
          // Prevent Tab from leaving the modal.
          e.preventDefault();
          break;
      }
    },
    [activeIndex, flatResults, navigate, onClose],
  );

  // Click outside to close.
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b px-4">
              <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search algorithms, Top 150, NeetCode, sorting…"
                className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Search"
                autoComplete="off"
                spellCheck={false}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                  ESC
                </kbd>
              )}
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[50vh] overflow-y-auto overscroll-contain p-2"
            >
              {query.trim() && flatResults.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : flatResults.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Type to search across algorithms, Top 150, NeetCode, sorting, pages, and docs
                </div>
              ) : (
                <div className="space-y-1">
                  {Array.from(grouped.entries()).map(([category, entries]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        {category}
                      </div>
                      {entries.map((entry) => {
                        const globalIndex = flatResults.indexOf(entry);
                        const isActive = globalIndex === activeIndex;
                        return (
                          <button
                            key={entry.id}
                            data-index={globalIndex}
                            type="button"
                            onClick={() => navigate(entry)}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                              isActive
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground hover:bg-accent/50",
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-md border",
                                isActive
                                  ? "border-primary/30 bg-primary/10 text-primary"
                                  : "border-border bg-muted/50 text-muted-foreground",
                              )}
                            >
                              <ResultIcon entry={entry} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium">
                                  {entry.title}
                                </span>
                                <SourceBadge source={entry.source} />
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {entry.subtitle}
                              </div>
                            </div>
                            <ArrowRight
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 transition-opacity",
                                isActive ? "opacity-100 text-primary" : "opacity-0",
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="flex items-center gap-4 border-t px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">esc</kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
