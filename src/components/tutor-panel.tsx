"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LogIn, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { API } from "@/lib/api-config";
import { useUser } from "@/lib/auth/hooks";
import { TUTOR_HISTORY_MAX_MESSAGES, type TutorContext } from "@/lib/tutor-context";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Step tutor — a chat about the run currently in view.
//
// The panel is deliberately thin: the fact sheet it sends comes from
// tutor-context.ts (pure + unit tested), and the route re-clamps everything, so
// nothing here is trusted for spend or grounding.
//
// Ephemeral by design: the thread lives in component state only, and the
// workspace remounts the panel (keyed by runKey) when the code/input change, so
// a new run starts a new conversation while stepping keeps the old one.
// ---------------------------------------------------------------------------

type TutorMessageRow = { role: "user" | "assistant"; content: string };

export function TutorPanel({
  open,
  onClose,
  context,
  onSignIn,
}: {
  open: boolean;
  onClose: () => void;
  /** Null until a trace exists — the trigger is disabled in that case. */
  context: TutorContext | null;
  onSignIn: () => void;
}) {
  const { user } = useUser();
  const [messages, setMessages] = useState<TutorMessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Keep the newest turn in view as the thread grows.
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages, pending]);

  if (!context) return null;

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    // Send the tail of the thread, not the whole thing: the route caps it again
    // and only recent turns matter for a follow-up.
    const history = messages.slice(-TUTOR_HISTORY_MAX_MESSAGES);
    setMessages((previous) => [...previous, { role: "user", content: trimmed }]);
    setDraft("");
    setError(null);
    setPending(true);
    try {
      const response = await fetch(API.tutor, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, brief: context.brief, history }),
      });
      const data = (await response.json().catch(() => ({}))) as { answer?: string; error?: string };
      if (!response.ok) {
        setError(
          response.status === 401
            ? "The step tutor is free with an account. Sign in to ask about a run."
            : data.error ?? `The tutor hit a snag (HTTP ${response.status}).`,
        );
        return;
      }
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.answer ?? "" },
      ]);
    } catch {
      setError("Network error — the tutor could not be reached.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="flex max-h-[85vh] max-w-xl flex-col gap-0 p-0">
        <DialogHeader className="gap-1 border-b px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Ask about this step
          </DialogTitle>
          <DialogDescription className="truncate text-xs">
            {context.stepLabel}
            {context.changeSummary ? ` — ${context.changeSummary}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Answers come from the trace you&apos;re looking at — the current step, what changed,
                and the data in it — so they stay about <em>this</em> run.
              </p>
              <div className="flex flex-wrap gap-2">
                {context.chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void ask(chip)}
                    disabled={!user || pending}
                    className="rounded-full border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {messages.map((message, index) => (
                <li
                  key={`${message.role}-${index}`}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {message.content}
                  </div>
                </li>
              ))}
              {pending ? (
                <li className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Reading the trace…
                  </div>
                </li>
              ) : null}
            </ul>
          )}
          <div ref={logEndRef} />
        </div>

        {user ? (
          <div className="border-t px-5 py-4">
            {error ? (
              <p role="alert" className="mb-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void ask(draft);
                  }
                }}
                rows={2}
                maxLength={500}
                disabled={pending}
                aria-label="Your question about this step"
                placeholder="Why did this swap happen? Is this the worst case?"
                className="min-h-0 resize-none text-sm"
              />
              <Button
                type="button"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={pending || draft.trim().length === 0}
                onClick={() => void ask(draft)}
                aria-label="Send question"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Enter to send · Shift+Enter for a new line
            </p>
          </div>
        ) : (
          <div className="border-t px-5 py-4">
            <p className="text-sm text-muted-foreground">
              The tutor reads a trace on every question, so it&apos;s free with an account rather
              than open to everyone. Your code and inputs stay in the workspace.
            </p>
            <Button type="button" size="sm" className="mt-3 gap-1.5" onClick={onSignIn}>
              <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
              Continue with Google
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
