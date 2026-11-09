"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Reusable toast/snackbar system.
 *
 * Store-based (no provider): call `toast({...})` from anywhere — callbacks,
 * event handlers, async flows — and render <Toaster /> once near the root of
 * the tree (see app/layout.tsx). Toasts slide up from the bottom center,
 * auto-dismiss after a few seconds (loading toasts stay until dismissed or
 * replaced), and stack up to three.
 */

export type ToastVariant = "success" | "error" | "info" | "loading";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** Auto-dismiss delay in ms; null keeps the toast until dismissed/replaced. */
  duration: number | null;
  action?: ToastAction;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
};

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4200;

let nextId = 1;
let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Shows a toast and returns its id (for dismissToast). */
export function toast(input: ToastInput) {
  const variant = input.variant ?? "info";
  const item: ToastItem = {
    id: nextId++,
    title: input.title,
    description: input.description,
    variant,
    duration: input.duration ?? (variant === "loading" ? null : DEFAULT_DURATION),
    action: input.action,
  };
  // Only one loading toast at a time — a new one replaces the old, so
  // consecutive "Tracing…" steps never pile up.
  toasts =
    variant === "loading"
      ? [...toasts.filter((entry) => entry.variant !== "loading"), item]
      : [...toasts, item];
  toasts = toasts.slice(-MAX_TOASTS);
  emit();
  return item.id;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((entry) => entry.id !== id);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

// The server render must hand back a stable reference (a fresh [] each call
// makes React suspect an infinite loop) — nothing ever calls toast() during
// SSR, so a single shared empty array is always correct there.
const EMPTY_TOASTS: ToastItem[] = [];

/** Global toast host — mount once in the root layout. */
export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_TOASTS);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const VARIANT_STYLES: Record<
  ToastVariant,
  { chip: string; icon: React.ReactNode; border: string }
> = {
  success: {
    chip: "bg-emerald-500/15",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />,
    border: "border-emerald-500/40",
  },
  error: {
    chip: "bg-rose-500/15",
    icon: <AlertTriangle className="h-4 w-4 text-rose-500" aria-hidden="true" />,
    border: "border-rose-500/40",
  },
  info: {
    chip: "bg-blue-500/15",
    icon: <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />,
    border: "border-blue-500/40",
  },
  loading: {
    chip: "bg-primary/15",
    icon: <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />,
    border: "border-primary/40",
  },
};

function ToastCard({ item }: { item: ToastItem }) {
  const styles = VARIANT_STYLES[item.variant];
  // Auto-dismiss: a timer per toast, paused while the pointer hovers so a
  // long description or action link is never snatched away mid-read. The
  // countdown keeps its original start time, so hovering doesn't extend it.
  const [paused, setPaused] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (item.duration === null) return undefined;
    if (paused) {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
      return undefined;
    }
    const elapsed = startedAtRef.current === null ? 0 : Date.now() - startedAtRef.current;
    const remaining = Math.max(0, item.duration - elapsed);
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => dismissToast(item.id), remaining);
    return () => {
      if (timerRef.current !== undefined) window.clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, paused]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97, transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-background/95 px-3.5 py-3 shadow-lg shadow-black/25 backdrop-blur",
        styles.border,
      )}
      role={item.variant === "error" ? "alert" : "status"}
    >
      <span
        className={cn(
          "mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          styles.chip,
        )}
      >
        {styles.icon}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-[13px] font-medium leading-5 text-foreground/90">{item.title}</p>
        {item.description ? (
          <p className="text-[12px] leading-5 text-muted-foreground">{item.description}</p>
        ) : null}
        {item.action ? (
          <button
            type="button"
            onClick={() => {
              dismissToast(item.id);
              item.action?.onClick();
            }}
            className="mt-1 rounded-md border border-border px-2 py-0.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent"
          >
            {item.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismissToast(item.id)}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
