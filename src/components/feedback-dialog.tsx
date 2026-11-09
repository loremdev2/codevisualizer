"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, MessageSquare, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { checkResult } from "@/lib/result-check";
import { useUser } from "@/lib/auth/hooks";
import { API } from "@/lib/api-config";

// Client-side screenshot prep: downscale large images so uploads stay small.
const MAX_IMAGE_DIMENSION = 1600;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function prepareImage(
  file: File,
): Promise<{ blob: Blob; name: string; type: string }> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is larger than 8 MB — please pick a smaller one.");
  }
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) {
      bitmap.close();
      return { blob: file, name: file.name, type: file.type };
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return { blob: file, name: file.name, type: file.type };
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8),
    );
    if (!blob) throw new Error("Couldn't process the image.");
    return {
      blob,
      name: `${file.name.replace(/\.[^.]+$/, "")}.jpg`,
      type: "image/jpeg",
    };
  } catch {
    // HEIC or other undecodable formats — upload as-is.
    return { blob: file, name: file.name, type: file.type };
  }
}

const CATEGORIES = [
  { value: "bug", label: "Bug report" },
  { value: "idea", label: "Feature idea" },
  { value: "confusing", label: "Confusing" },
  { value: "praise", label: "Praise" },
  { value: "other", label: "Other" },
] as const;

type FeedbackDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Current algorithm preset name, attached for context. */
  algorithm?: string;
  /** Current language label, attached for context. */
  language?: string;
  /** Current editor code, pre-filled into the code field (editable). */
  code?: string;
  /** Current input JSON text, offered via the include-input toggle. */
  inputText?: string;
  /** 1-based step the user was viewing, attached for context. */
  stepIndex?: number;
  /** Total steps in the current run, attached for context. */
  stepCount?: number;
  /** Actual result of the last run, attached for context. */
  resultText?: string;
  /** Known expected answer, attached for context. */
  expectedText?: string;
};

/**
 * In-app feedback form. Submissions land in the Supabase `feedback` table
 * (insert-only RLS — anyone can send, only the maintainer can read via
 * Supabase Studio). Guests can submit without an account; signed-in users
 * have their email pre-filled so the maintainer can reply. Users can attach
 * the code that misbehaved (pre-filled from the editor, editable/paste-able)
 * and optionally the input. When opened from the visualizer, the run's
 * context — algorithm, language, step index, verdict, and expected-vs-actual
 * result — is attached automatically so the maintainer can reproduce the
 * issue without follow-up questions.
 */
export function FeedbackDialog({
  open,
  onClose,
  algorithm,
  language,
  code,
  inputText,
  stepIndex,
  stepCount,
  resultText,
  expectedText,
}: FeedbackDialogProps) {
  // Render nothing when closed — the form below mounts fresh on every open,
  // so its state initializes from the current props (fresh code prefill, no
  // stale values from a previous session).
  if (!open) return null;
  return (
    <FeedbackForm
      onClose={onClose}
      algorithm={algorithm}
      language={language}
      code={code}
      inputText={inputText}
      stepIndex={stepIndex}
      stepCount={stepCount}
      resultText={resultText}
      expectedText={expectedText}
    />
  );
}

function FeedbackForm({
  onClose,
  algorithm,
  language,
  code,
  inputText,
  stepIndex,
  stepCount,
  resultText,
  expectedText,
}: {
  onClose: () => void;
  algorithm?: string;
  language?: string;
  code?: string;
  inputText?: string;
  stepIndex?: number;
  stepCount?: number;
  resultText?: string;
  expectedText?: string;
}) {
  const { user } = useUser();
  const [category, setCategory] = useState<string>("bug");
  const [message, setMessage] = useState("");
  const [codeText, setCodeText] = useState(() => code ?? "");
  // Input auto-included when a run provided one — the user can still opt out.
  const [includeInput, setIncludeInput] = useState(Boolean(inputText));

  // Verdict from the actual run vs the known expected answer. Attached
  // automatically so a bug report about a wrong visualization or failed run
  // carries the pass/fail state without the user having to describe it.
  const check = useMemo(
    () => checkResult(resultText ?? "", expectedText ?? ""),
    [resultText, expectedText],
  );
  const verdict: "pass" | "fail" | null =
    !check.hasActual || !check.hasExpected ? null : check.match ? "pass" : "fail";
  const stepContext =
    stepCount && stepCount > 0 ? `step ${stepIndex ?? 1} of ${stepCount}` : null;
  // The dialog mounts fresh on every open (FeedbackDialog renders null when
  // closed), so initializing from the session user is safe — by the time a
  // user opens the form, /api/auth/session has long resolved.
  const [email, setEmail] = useState(user?.email ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorText, setErrorText] = useState("");
  // Hidden honeypot: bots auto-fill it, humans never see it.
  const [honeypot, setHoneypot] = useState("");
  const imageInput = useRef<HTMLInputElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");



  // Clean up the preview object URL on unmount.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const close = () => {
    if (status === "sending") return;
    onClose();
  };

  const submit = async () => {
    if (honeypot) {
      // Spam trap tripped — pretend it worked without storing anything.
      setStatus("sent");
      return;
    }
    const trimmed = message.trim();
    if (trimmed.length < 5) {
      setErrorText("Please write a short message first.");
      return;
    }
    setStatus("sending");
    setErrorText("");

    // Upload the screenshot first (if any) via the server route, then insert
    // the row referencing it. Both routes are authenticated by the session
    // cookie (guests may still submit without an account).
    let imageUrl: string | null = null;
    if (imageFile) {
      try {
        const prepared = await prepareImage(imageFile);
        const formData = new FormData();
        formData.append("file", prepared.blob, prepared.name);
        const uploadResponse = await fetch(API.feedbackImage, {
          method: "POST",
          body: formData,
        });
        const uploadJson = (await uploadResponse.json().catch(() => ({}))) as {
          url?: string;
          error?: string;
        };
        if (!uploadResponse.ok || !uploadJson.url) {
          throw new Error(uploadJson.error ?? "upload failed");
        }
        imageUrl = uploadJson.url;
      } catch {
        setStatus("error");
        setErrorText(
          "Couldn't upload the image — the feedback-images storage bucket may not be set up yet. Run the migration in Supabase and try again.",
        );
        return;
      }
    }

    const insertResponse = await fetch(API.feedback, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        message: trimmed,
        email: email.trim() || null,
        page_url: typeof window !== "undefined" ? window.location.pathname : null,
        algorithm: algorithm ?? null,
        language: language ?? null,
        image_url: imageUrl,
        code: codeText.trim() || null,
        input_text: includeInput && inputText ? inputText : null,
        step_index: stepContext ? (stepIndex ?? 1) : null,
        step_count: stepCount && stepCount > 0 ? stepCount : null,
        result_text: check.hasActual && resultText ? resultText : null,
        expected_text: expectedText?.trim() ? expectedText : null,
        verdict,
      }),
    });
    const insertJson = (await insertResponse.json().catch(() => ({}))) as { error?: string };

    if (!insertResponse.ok) {
      setStatus("error");
      setErrorText(
        (insertJson.error ?? "").includes("feedback")
          ? "Couldn't send feedback — the feedback table may not be set up yet. Run the migration in Supabase and try again."
          : insertJson.error ?? "Couldn't send feedback — please try again.",
      );
      return;
    }
    setStatus("sent");
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Send feedback"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Send feedback</h2>
              <p className="text-[11px] text-muted-foreground">
                What&apos;s working, what&apos;s confusing, what should we build next?
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            aria-label="Close feedback dialog"
            onClick={close}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
            <p className="text-sm font-medium">Thanks for the feedback!</p>
            <p className="text-xs text-muted-foreground">
              It&apos;s been saved and the maintainer will see it.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={close} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="space-y-3"
          >
            {/* Honeypot — hidden from humans, irresistible to bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              value={honeypot}
              onChange={(event) => setHoneypot(event.target.value)}
            />

            <div>
              <Label className="text-xs">What is it about?</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CATEGORIES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    aria-pressed={category === option.value}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      category === option.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="feedback-message" className="text-xs">
                Your message
              </Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What happened, or what would you love to see?"
                className="mt-1.5 min-h-24 text-xs"
                maxLength={4000}
              />
            </div>

            <div>
              <Label htmlFor="feedback-code" className="text-xs">
                Code{" "}
                <span className="font-normal text-muted-foreground">
                  (optional — the code that isn&apos;t working, pre-filled from your editor)
                </span>
              </Label>
              <Textarea
                id="feedback-code"
                value={codeText}
                onChange={(event) => setCodeText(event.target.value)}
                placeholder="Paste the code that isn't working in the visualizer…"
                className="mt-1.5 min-h-16 font-mono text-[11px] leading-5"
                maxLength={20000}
              />
              <label className="mt-1.5 flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeInput}
                  onChange={(event) => setIncludeInput(event.target.checked)}
                  className="h-3 w-3 accent-primary"
                />
                Also include the input JSON
              </label>
            </div>

            <div>
              <Label htmlFor="feedback-email" className="text-xs">
                Email <span className="font-normal text-muted-foreground">(optional — for a reply)</span>
              </Label>
              <Input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 h-8 text-xs"
                autoComplete="email"
              />
            </div>

            <div>
              <span className="text-xs font-medium">
                Screenshot <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input
                ref={imageInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setImagePreview((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return URL.createObjectURL(file);
                  });
                  setImageFile(file);
                  setErrorText("");
                }}
              />
              {imageFile ? (
                <div className="mt-1.5 flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md border border-border/70 bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                    <img
                      src={imagePreview}
                      alt="Selected screenshot preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium">{imageFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {Math.max(1, Math.round(imageFile.size / 1024))} KB · large images are
                      downscaled automatically
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground"
                    aria-label="Remove screenshot"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview((current) => {
                        if (current) URL.revokeObjectURL(current);
                        return "";
                      });
                      if (imageInput.current) imageInput.current.value = "";
                    }}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInput.current?.click()}
                  className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Add a screenshot
                </button>
              )}
            </div>

            {algorithm || language || codeText.trim() || stepContext || verdict ? (
              <p className="text-[10px] text-muted-foreground/80">
                Sending from: {[algorithm, language].filter(Boolean).join(" · ")}
                {stepContext ? ` · ${stepContext}` : ""}
                {verdict
                  ? ` · ${verdict === "pass" ? "✅ run passed" : "❌ run failed (expected vs actual attached)"}`
                  : ""}
                {codeText.trim() ? " · code attached" : ""}
                {includeInput && inputText ? " · input attached" : ""} — added automatically so the
                maintainer knows the context.
              </p>
            ) : null}

            {status === "error" ? (
              <p className="text-[11px] font-medium text-red-500" role="alert">
                {errorText}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" size="sm" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={status === "sending"} className="gap-1.5">
                {status === "sending" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {status === "sending" ? "Sending…" : "Send feedback"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
