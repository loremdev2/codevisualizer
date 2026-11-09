"use client";

import { LogIn, X } from "lucide-react";
import { signInWithGoogle } from "@/lib/auth/hooks";

// ---------------------------------------------------------------------------
// Lightweight sign-in prompt shown when a guest tries to use a feature that
// requires authentication. Renders as a centered overlay with a backdrop.
// ---------------------------------------------------------------------------

export function SignInPrompt({
  open,
  onClose,
  redirectPath,
}: {
  open: boolean;
  onClose: () => void;
  redirectPath?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Card */}
      <div className="relative mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <LogIn className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Sign in to track progress</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Save your solved questions and sync them across all your devices.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={() => signInWithGoogle(redirectPath)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
