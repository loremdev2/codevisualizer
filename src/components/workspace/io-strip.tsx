"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Braces,
  Check,
  ChevronRight,
  CircleCheck,
  CircleX,
  Copy,
  Download,
  Flag,
  Loader2,
  NotebookPen,
  PanelBottomClose,
  PanelBottomOpen,
  Terminal,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { StructuredInputEditor, type InputExample } from "@/components/workspace/input-editor";
import { checkResult } from "@/lib/result-check";

/** Where a run is in the pipeline, driving the progress stepper in the result tab. */
export type RunPhase = "idle" | "translate" | "trace" | "done" | "error";

type IoStripProps = {
  inputText: string;
  onInputChange: (value: string) => void;
  examples?: InputExample[];
  resultText: string;
  consoleLines: string[];
  stepCount: number;
  durationMs: number | null;
  error: string | null;
  /** Current stage of the run pipeline ("idle" hides the stepper). */
  runPhase: RunPhase;
  /** True for languages traced via AI translation (Java/C++), which adds a Translate stage. */
  needsTranslation: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Markdown study notes for the current run (null before a run). */
  studyNotes: string | null;
  /** Unabridged notes used by the Download button (null before a run). */
  fullStudyNotes: string | null;
  /** Known correct output for the loaded question (pre-filled, may be empty). */
  expectedText: string;
  onExpectedTextChange: (value: string) => void;
  /** Whether the "Wrong trace?" button should be shown (a run has completed). */
  reportable: boolean;
  /** Stores the last run as a bad-trace report; resolves true when saved. */
  onReportTrace: () => Promise<boolean>;
  /** Generate and download a PDF report with visualization screenshot. */
  onDownloadPdf: () => void;
  /** Whether a PDF is currently being generated. */
  generatingPdf: boolean;
};

function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Compact pipeline stepper explaining what the runner is doing right now.
 * Translated languages (Java/C++) get a Translate stage; JS/TS/Python just
 * show Trace → Visualize. "idle" hides it entirely.
 */
function RunPipelineStepper({ runPhase, needsTranslation }: { runPhase: RunPhase; needsTranslation: boolean }) {
  const stages = needsTranslation
    ? ["Translate", "Trace", "Visualize"]
    : ["Trace", "Visualize"];
  // Index of the stage currently running, or -1 when not mid-run.
  const activeIndex =
    runPhase === "translate" ? 0 : runPhase === "trace" ? (needsTranslation ? 1 : 0) : -1;

  return (
    <div
      className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/20 px-2.5 py-1.5 text-[11px]"
      aria-live="polite"
      role="status"
    >
      {stages.map((label, index) => {
        const done = runPhase === "done" || (activeIndex >= 0 && index < activeIndex);
        const active = index === activeIndex;
        return (
          <Fragment key={label}>
            {index > 0 ? (
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" aria-hidden="true" />
            ) : null}
            <span
              className={`flex shrink-0 items-center gap-1 font-medium ${
                active
                  ? "text-foreground"
                  : done
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
              }`}
            >
              {active ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : done ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
              )}
              {label}
            </span>
          </Fragment>
        );
      })}
      {runPhase === "error" ? (
        <span className="ml-auto flex shrink-0 items-center gap-1 font-medium text-rose-500">
          <CircleX className="h-3 w-3" aria-hidden="true" />
          Stopped
        </span>
      ) : null}
    </div>
  );
}

export function IoStrip({
  inputText,
  onInputChange,
  examples,
  resultText,
  consoleLines,
  stepCount,
  durationMs,
  error,
  runPhase,
  needsTranslation,
  collapsed,
  onToggleCollapsed,
  studyNotes,
  fullStudyNotes,
  expectedText,
  onExpectedTextChange,
  reportable,
  onReportTrace,
  onDownloadPdf,
  generatingPdf,
}: IoStripProps) {
  const [tab, setTab] = useState<"input" | "output">("input");
  const [copied, setCopied] = useState<"result" | "notes" | "input" | null>(null);
  const [saved, setSaved] = useState<"notes" | null>(null);
  const [reported, setReported] = useState(false);
  // Expected output the student wants to verify the run against (✅/❌ verdict).
  // Controlled from above so known-answer questions (Top 150) pre-fill it.
  const check = useMemo(() => checkResult(resultText, expectedText), [resultText, expectedText]);

  const copy = async (kind: "result" | "notes" | "input", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable — ignore.
    }
  };

  const downloadPdf = () => {
    onDownloadPdf();
    setSaved("notes");
    window.setTimeout(() => setSaved(null), 2000);
  };

  const meta = [
    stepCount > 0 ? `${stepCount} step${stepCount === 1 ? "" : "s"}` : null,
    durationMs != null ? formatDuration(durationMs) : null,
  ].filter((part): part is string => Boolean(part));

  const tabClass = (active: boolean) =>
    `inline-flex h-8 items-center gap-1.5 border-b-2 px-2.5 text-xs font-medium transition-colors ${
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <section
      className="flex h-full min-h-0 flex-col bg-card"
      aria-label="Input and output"
      data-tour="io"
    >
      {error && !collapsed ? (
        <div className="shrink-0 border-b border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <header className="flex h-8 shrink-0 items-center gap-1 border-b border-border/80 px-2">
        <button type="button" className={tabClass(tab === "input")} onClick={() => setTab("input")}>
          <Braces className="h-3.5 w-3.5" aria-hidden="true" />
          Input
        </button>
        <button type="button" className={tabClass(tab === "output")} onClick={() => setTab("output")}>
          <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
          Output
        </button>
        <div className="flex-1" />
        {!collapsed && meta.length ? (
          <Badge variant="outline" className="hidden md:inline-flex">
            {meta.join(" · ")}
          </Badge>
        ) : null}
        {tab === "input" && !collapsed ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={() => void copy("input", inputText)}
            title="Copy the input JSON"
          >
            {copied === "input" ? (
              <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
            ) : (
              <Copy className="h-3 w-3" aria-hidden="true" />
            )}
            {copied === "input" ? "Copied" : "Copy"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground"
          aria-label={collapsed ? "Expand input/output" : "Collapse input/output"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <PanelBottomOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelBottomClose className="h-3.5 w-3.5" />
          )}
        </Button>
      </header>

      {collapsed ? null : (
        <div className="min-h-0 flex-1">
          {tab === "input" ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1">
                <StructuredInputEditor value={inputText} onChange={onInputChange} examples={examples} />
              </div>
            </div>
          ) : (
            <div className="h-full space-y-3 overflow-auto p-3">
              {runPhase !== "idle" ? (
                <RunPipelineStepper runPhase={runPhase} needsTranslation={needsTranslation} />
              ) : null}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {check.hasExpected && check.hasActual ? (
                      check.match ? (
                        <CircleCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                      ) : (
                        <CircleX className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                      )
                    ) : null}
                    Result
                  </div>
                  <div className="flex items-center gap-1">
                    {reportable ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 gap-1 px-2 text-[11px]"
                        onClick={async () => {
                          const ok = await onReportTrace();
                          if (ok) {
                            setReported(true);
                            window.setTimeout(() => setReported(false), 2000);
                            toast({
                              title: "Trace flagged for review",
                              description: "Thanks — the maintainer will investigate this run.",
                              variant: "success",
                            });
                          }
                        }}
                        title="The tracer produced a wrong or confusing result — flag it so the maintainer can investigate"
                      >
                        {reported ? (
                          <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                        ) : (
                          <Flag className="h-3 w-3" aria-hidden="true" />
                        )}
                        {reported ? "Reported" : "Wrong trace?"}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={() => void copy("notes", studyNotes ?? "")}
                      disabled={!studyNotes}
                      title={studyNotes ? "Copy markdown study notes for this run" : "Run the code first"}
                    >
                      {copied === "notes" ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <NotebookPen className="h-3 w-3" aria-hidden="true" />
                      )}
                      {copied === "notes" ? "Copied" : "Notes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={downloadPdf}
                      disabled={!fullStudyNotes || generatingPdf}
                      title={
                        fullStudyNotes
                          ? "Download an interactive HTML report with step-by-step visualization"
                          : "Run the code first"
                      }
                    >
                      {generatingPdf ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                      ) : saved === "notes" ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Download className="h-3 w-3" aria-hidden="true" />
                      )}
                      {generatingPdf ? "Generating…" : saved === "notes" ? "Saved" : "Report"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 gap-1 px-2 text-[11px]"
                      onClick={() => void copy("result", resultText)}
                    >
                      {copied === "result" ? (
                        <Check className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3 w-3" aria-hidden="true" />
                      )}
                      {copied === "result" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-mono text-[13px] leading-6">
                  {resultText}
                </pre>
              </div>

              {consoleLines.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Console
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 font-mono text-[13px] leading-6">
                    {consoleLines.join("\n")}
                  </pre>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
