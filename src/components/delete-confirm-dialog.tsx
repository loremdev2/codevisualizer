"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type DeleteConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  /** Show a loading spinner on the confirm button while the delete is in flight. */
  deleting?: boolean;
};

/**
 * Styled confirmation dialog for destructive actions. Follows the same overlay
 * pattern as FeedbackDialog: fixed backdrop, centered card, keyboard dismiss,
 * and ARIA attributes for screen readers.
 */
export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  deleting = false,
}: DeleteConfirmDialogProps) {
  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, deleting, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget && !deleting) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
            aria-label="Close"
            onClick={onClose}
            disabled={deleting}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onConfirm}
            disabled={deleting}
            className="gap-1.5"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
