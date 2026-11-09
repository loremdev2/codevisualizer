"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { startTimer } from "@/lib/time-tracking";
import Link from "next/link";
import { AlertTriangle, BookmarkPlus, Languages, Loader2, LogIn, Sparkles, Trophy, X } from "lucide-react";
import type { EditorView } from "@codemirror/view";

import { AuthLoaderScreen } from "@/components/auth-loader-screen";
import { TutorPanel } from "@/components/tutor-panel";
import { FooterBar } from "@/components/workspace/footer-bar";
import { PlaybackBar } from "@/components/workspace/playback-bar";
import { ResizableWorkspace } from "@/components/workspace/resizable-workspace";
import type { RunPhase } from "@/components/workspace/io-strip";
import { TopBar } from "@/components/workspace/top-bar";
import { VisualizerTour } from "@/components/workspace/visualizer-tour";
import { WelcomeBanner } from "@/components/workspace/welcome-banner";
import { clearCollapsedState } from "@/components/workspace/use-collapsible-panel";
import { resetPanelZoom } from "@/components/workspace/panel-zoom";
import { setTraceLineEffect } from "@/components/workspace/code-panel";
import type { SavedAlgorithm } from "@/components/workspace/code-panel";
import { signInWithGoogle, useUser } from "@/lib/auth/hooks";
import {
  getAutoPlayAfterRun,
  setAutoPlayAfterRun,
  useAutoPlayAfterRun,
} from "@/lib/prefs";
import type { AiTranslationQuota } from "@/lib/ai-usage";
import {
  getCachedTranslation,
  setCachedTranslation,
  translationCacheKey,
} from "@/lib/translation-cache";
import {
  detectLanguage,
  getLanguageInfo,
  type SupportedLanguage,
} from "@/lib/detect-language";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { algorithmTemplates, BLANK_TEMPLATE_ID } from "@/lib/templates";
import {
  sha256Hex,
  trackTraceOutcome,
  trackTraceReported,
  type TraceOutcome,
  type TraceTelemetry,
} from "@/lib/telemetry";
import { explainStep } from "@/lib/explain-step";
import { buildTutorContext } from "@/lib/tutor-context";
import { isPathComplete, learningPaths, pathForTemplate } from "@/lib/paths";
import { getLearningProgress, recordTemplateTraced } from "@/lib/progress";
import { API } from "@/lib/api-config";
import {
  hasBruteVariant,
  neetcodeTemplateAsAlgorithmTemplate,
  neetcodeTemplateFromId,
  normalizeLanguage,
  resolveExternalCode,
  resolveExternalLanguages,
} from "@/lib/neetcode-templates";
import { top150QuestionByNo } from "@/lib/top150";
import {
  top150TemplateAsAlgorithmTemplate,
  top150TemplateFromId,
  top150TemplateId,
  type SolutionLanguage,
} from "@/lib/top150-templates";
import { type AlgorithmTemplate, type VisualStep } from "@/types/visualizer";
import {
  createWorkerSource,
  instrumentForTrace,
  isStepLimitError,
  normalizeSteps,
  type InstrumentResult,
  type WorkerTraceMessage,
} from "@/lib/trace-runner";
import { buildPythonHarness, detectPythonEntry } from "@/lib/trace/leetcode";
import { createPendingLoadStore, type PendingLoadStore } from "@/lib/pending-load";
import {
  buildPythonSteps,
  pythonConsoleOutput,
} from "@/lib/trace/python-steps";
import {
  runPythonTrace,
  terminatePythonWorker,
} from "@/lib/trace/python-runner";
import {
  buildEmbedCode,
  buildShareUrl,
  decodeSharePayload,
} from "@/lib/share-link";
import {
  ANONYMOUS_TRACE_LIMIT,
  formatDuration,
  formatResult,
  getAnonymousTraceCount,
  getComparisonTarget,
  incrementAnonymousTraceCount,
  readSessionRestore,
  writeSessionRestore,
  getDarkThemeSnapshot,
  subscribeToDarkTheme,
  getDarkThemeServerSnapshot,
  type SessionRestore,
} from "@/lib/visualizer-utils";
import {
  fetchAnonQuota,
  postActivityEvent,
  type AnonQuota,
} from "@/lib/activity-ledger";

const initialTemplate = algorithmTemplates[0];

function useIsDark() {
  return useSyncExternalStore(subscribeToDarkTheme, getDarkThemeSnapshot, getDarkThemeServerSnapshot);
}





export function DsaVisualizer({ embed = false }: { embed?: boolean } = {}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplate.id);
  const [code, setCode] = useState(initialTemplate.code);
  const [inputText, setInputText] = useState(
    JSON.stringify(initialTemplate.input, null, 2),
  );
  const [steps, setSteps] = useState<VisualStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [speed, setSpeed] = useState([620]);
  const [error, setError] = useState("");
  const [resultText, setResultText] = useState("No result yet");
  // Known correct output for the loaded question (Top 150 pre-fills this and
  // the Result box so the answer is visible without running first).
  const [expectedText, setExpectedText] = useState("");
  const [runDurationMs, setRunDurationMs] = useState<number | null>(null);
  // Outcome of the most recent completed run — feeds trace telemetry and the
  // "This trace was wrong" report button. Reset at the start of every run.
  const [lastTrace, setLastTrace] = useState<TraceTelemetry | null>(null);
  const [language, setLanguage] = useState<SupportedLanguage>(
    (initialTemplate.language as SupportedLanguage) ?? "javascript",
  );
  // Language/code mismatch guard: when Run is clicked and the code clearly
  // reads as a different available language than the picker, we stop and ask
  // instead of failing with a cryptic parse error.
  const [languageMismatch, setLanguageMismatch] = useState<{
    detected: SupportedLanguage;
    selected: SupportedLanguage;
  } | null>(null);
  const bypassMismatchRef = useRef(false);
  const [translatedFromLabel, setTranslatedFromLabel] = useState<string | null>(null);
  const [translationSource, setTranslationSource] = useState<"live" | "cache" | null>(null);
  const [translatedCode, setTranslatedCode] = useState<string | null>(null);
  const [hasOriginalLineMapping, setHasOriginalLineMapping] = useState(false);

  // Comparison (A/B) mode.
  const [compareMode, setCompareMode] = useState(false);
  const compareModeRef = useRef(compareMode);
  const [compareSteps, setCompareSteps] = useState<VisualStep[]>([]);
  const [compareLabel, setCompareLabel] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const autoPlayAfterRun = useAutoPlayAfterRun();
  // Set when a run completes a learning path; drives the "path complete"
  // banner until dismissed.
  const [completedPathId, setCompletedPathId] = useState<string | null>(null);
  // A Top Interview 150 question loaded via /visualizer?t=top150-<no>. While
  // set, the workspace shows that question's canonical solution instead of a
  // curated preset. `externalVariant` picks which solution the editor shows:
  // the canonical "optimal" one or the naive "brute" one (when it exists).
  const [externalTemplateId, setExternalTemplateId] = useState<string | null>(null);
  const [externalVariant, setExternalVariant] = useState<"brute" | "optimal">("optimal");
  const currentIndexRef = useRef(0);

  // Keep the latest values available to interval/event callbacks without
  // recreating them on every step (refs are written in an effect, not render).
  useEffect(() => {
    compareModeRef.current = compareMode;
    currentIndexRef.current = currentIndex;
  }, [compareMode, currentIndex]);

  const [layoutResetKey, setLayoutResetKey] = useState(0);

  // Soft gate state: `user` is undefined while the session is still loading, so
  // the gate only ever applies to confirmed guests (user === null).
  const restoredSessionRef = useRef<SessionRestore | null>(null);
  if (restoredSessionRef.current === null) {
    restoredSessionRef.current = readSessionRestore();
  }
  const [restored, setRestored] = useState(false);
  // First-party session (httpOnly cookie via /api/auth/session); `user` stays
  // null for guests, so the soft trace gate only ever applies to confirmed
  // guests.
  const { user, loading: authLoading } = useUser();
  // Read the count only after mount so the SSR render and the hydration
  // render agree (localStorage doesn't exist on the server, so a lazy
  // initializer made the badge text differ and triggered a hydration error).
  const [tracesUsed, setTracesUsed] = useState(0);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only localStorage read so the SSR and hydration renders agree; not a cascading render
    setTracesUsed(getAnonymousTraceCount());
  }, []);
  // Server-truth guest quota: /api/activity/quota counts trace_run events in
  // the ledger keyed by the anon cookie, so the limit survives localStorage
  // clears and follows the guest across devices. The ref feeds the gate (the
  // run closure must not depend on reactive quota state); localStorage stays
  // as an offline fallback. Fail-open: null quota → the local gate applies.
  const quotaRef = useRef<AnonQuota | null>(null);
  useEffect(() => {
    if (embed || user !== null) return;
    void fetchAnonQuota().then((quota) => {
      if (quota) {
        quotaRef.current = quota;
        setTracesUsed(quota.used);
      }
    });
  }, [embed, user]);
  const applyQuota = useCallback((quota: AnonQuota | null) => {
    if (!quota) return;
    quotaRef.current = quota;
    setTracesUsed(quota.used);
  }, []);
  // Login prompt intent: "traces" (free-trace limit reached while running),
  // "save" (guest clicked Save code), or "ai" (guest tried Java/C++, which
  // require AI translation). The modal tailors its copy to the moment.
  const [loginPrompt, setLoginPrompt] = useState<"traces" | "save" | "ai" | null>(null);
  // Step tutor dialog ("Ask" in the playback bar). Ephemeral: the panel keys
  // off tutorContext.runKey below, so a new run clears the thread.
  const [tutorOpen, setTutorOpen] = useState(false);
  // Signed-in user's AI translation budget (limits + usage), for the
  // remaining-translations badge in the top bar. Null for guests / unknown.
  const [translationQuota, setTranslationQuota] = useState<AiTranslationQuota | null>(null);
  const refreshTranslationQuota = useCallback(async () => {
    try {
      const response = await fetch(API.translateUsage, { cache: "no-store" });
      if (!response.ok) {
        setTranslationQuota(null);
        return;
      }
      setTranslationQuota((await response.json()) as AiTranslationQuota);
    } catch {
      setTranslationQuota(null);
    }
  }, []);
  // Poll the quota while signed in (the badge updates as the hour rolls over);
  // a run just completed refreshes it immediately (see the lastTrace effect).
  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot reset when the auth session resolves; the polling below re-reads the real value
      setTranslationQuota(null);
      return;
    }
    void refreshTranslationQuota();
    const interval = setInterval(() => void refreshTranslationQuota(), 60_000);
    return () => clearInterval(interval);
  }, [user, refreshTranslationQuota]);
  useEffect(() => {
    if (!user || !lastTrace) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; refreshes the badge after a run
    void refreshTranslationQuota();
  }, [user, lastTrace, refreshTranslationQuota]);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootedRef = useRef(false);
  // Deep-link run requested by applyUrlState; consumed by an effect declared
  // after runTrace (so the call site doesn't reference it before declaration).
  const pendingDeepLinkRef = useRef<{
    code: string;
    inputText: string;
    language?: SupportedLanguage;
  } | null>(null);
  // 0-based step to seek to after the auto-run of a shared/embed link (the
  // payload's `s`); read inside runTrace's boot-run block, like `?s=`.
  const shareStepRef = useRef<number | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Lets the Run button switch the mobile workspace to the Visualization tab.
  const mobileTabApiRef = useRef<{ showViz: () => void } | null>(null);
  const isDark = useIsDark();

  const externalTemplate = externalTemplateId
    ? top150TemplateFromId(externalTemplateId)
    : undefined;
  const externalQuestion = externalTemplate
    ? top150QuestionByNo(externalTemplate.no)
    : undefined;
  // Languages with a real solution for the loaded question; the language
  // selector disables everything else (see TopBar). For Top 150, reads
  // from the template's languages map. For regular templates, reads from
  // the template's languages field. Java/C++ are always available via AI
  // translation for Top 150; for regular templates they're available when
  // the languages map includes them.
  const builtinTemplate = useMemo(
    () => algorithmTemplates.find((t) => t.id === selectedTemplateId),
    [selectedTemplateId],
  );
  const availableLanguages = useMemo(
    () => resolveExternalLanguages(externalTemplate?.no ?? 0, builtinTemplate),
    [externalTemplate, builtinTemplate],
  );

  const selectedTemplate = useMemo(() => {
    if (selectedTemplateId === BLANK_TEMPLATE_ID) {
      // The blank-file state isn't a real template: keep the shape (so the
      // editor, save dialog, and load button have something to hang off)
      // but with no code, no input shape, and no known answer.
      return {
        ...initialTemplate,
        id: BLANK_TEMPLATE_ID,
        name: "Blank file",
        code: "",
        input: {},
        expected: undefined,
        examples: [],
      };
    }
    if (externalTemplate && externalQuestion) {
      // Check if this is a Top 150 template or a NeetCode template
      if (top150TemplateFromId(`top150-${externalTemplate.no}`)) {
        return top150TemplateAsAlgorithmTemplate(
          externalQuestion.no,
          externalQuestion.title,
          externalQuestion.topic.title,
          code,
        );
      }
      return neetcodeTemplateAsAlgorithmTemplate(
        externalQuestion.no,
        externalQuestion.title,
        externalQuestion.topic.title,
        code,
      );
    }
    return (
      algorithmTemplates.find((template) => template.id === selectedTemplateId) ??
      initialTemplate
    );
  }, [externalTemplate, externalQuestion, selectedTemplateId, code]);

  const currentStep = steps[currentIndex];
  // The editor always shows the user's source. When a translation ran without
  // line directives, step lines point at the translated JS, so skip highlighting.
  const editorActiveLine =
    translatedCode && !hasOriginalLineMapping ? null : (currentStep?.line ?? null);
  const codeLines = useMemo(() => code.split("\n"), [code]);
  const consoleLines = useMemo(
    () =>
      steps
        .filter((step) => step.title === "Console")
        .map((step) => step.note)
        .filter((note): note is string => typeof note === "string"),
    [steps],
  );
  const canStep = steps.length > 0;
  const completedPath = completedPathId
    ? learningPaths.find((path) => path.id === completedPathId)
    : null;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("code-visualizer-theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark) ? "dark" : "light";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");

    // URL-driven startup state: preselect a template from a /learn start link
    // or share link (?t=id), and restore a shared saved algorithm
    // (?savedId=...). Runs async so state updates land after the boot preview
    // effect has observed them.
    const applyUrlState = async () => {
      const params = new URLSearchParams(window.location.search);

      // Self-contained share/embed links (/visualizer#v1:<payload> or
      // /embed#v1:<payload>) fully determine the workspace — code, input,
      // language, and target step — so they win over every other startup
      // signal (?t=, ?lang=, defaults). Decoding is local (lz-string), so
      // shared links hydrate instantly with no network round-trip.
      const shared = decodeSharePayload(window.location.hash);
      if (shared) {
        bootedRef.current = true;
        setExternalTemplateId(null);
        setExternalVariant("optimal");
        setSelectedTemplateId(initialTemplate.id);
        setCode(shared.code);
        setInputText(shared.input);
        setLanguage(shared.language);
        setExpectedText("");
        setResultText("No result yet");
        setSteps([]);
        setCurrentIndex(0);
        setIsPlaying(false);
        setTranslatedCode(null);
        setHasOriginalLineMapping(false);
        setRunDurationMs(null);
        pendingLoadRef.current.set({ code: shared.code, inputText: shared.input });
        pendingDeepLinkRef.current = {
          code: shared.code,
          inputText: shared.input,
          language: shared.language,
        };
        if (shared.s !== undefined) shareStepRef.current = shared.s;
        return;
      }

      const presetId = params.get("t");
      const preset = presetId
        ? algorithmTemplates.find((template) => template.id === presetId)
        : undefined;
      if (preset) {
        // Preset deep links (/learn start buttons): load the template and
        // trace it right away instead of the default boot template.
        bootedRef.current = true;
        setSelectedTemplateId(preset.id);
        setCode(preset.code);
        setInputText(JSON.stringify(preset.input, null, 2));
        setLanguage((preset.language as SupportedLanguage) ?? "javascript");
        if (preset.expected !== undefined) {
          const answer =
            typeof preset.expected === "string" ? preset.expected : JSON.stringify(preset.expected);
          setResultText(answer);
          setExpectedText(answer);
        } else {
          setResultText("No result yet");
          setExpectedText("");
        }
        setSteps([]);
        setCurrentIndex(0);
        setIsPlaying(false);
        pendingLoadRef.current.set({
          code: preset.code,
          inputText: JSON.stringify(preset.input, null, 2),
        });
        pendingDeepLinkRef.current = {
          code: preset.code,
          inputText: JSON.stringify(preset.input, null, 2),
          language: (preset.language as SupportedLanguage) ?? "javascript",
        };
      } else if (presetId) {
        // Top Interview 150 / NeetCode Roadmap deep link:
        // /visualizer?t=top150-<no>[&lang=python|typescript]. Both banks share
        // the top150-<no> id scheme (problem numbers are canonical); the Top
        // 150 registry wins on overlap, then the NeetCode registry.
        const external = top150TemplateFromId(presetId) ?? neetcodeTemplateFromId(presetId);
        if (external) {
          const externalId = top150TemplateId(external.no);
          const urlLang = params.get("lang");
          // Only honor ?lang= when the question actually has that language's
          // solution — otherwise the language would switch but the code stay
          // JavaScript, and the run would fail with a confusing parse error.
          const activeLanguage: SolutionLanguage =
            urlLang && resolveExternalCode(external.no, urlLang, "optimal")
              ? normalizeLanguage(urlLang)
              : "javascript";
          const activeCode =
            resolveExternalCode(external.no, activeLanguage, "optimal") ??
            external.code;
          bootedRef.current = true;
          setExternalTemplateId(externalId);
          setSelectedTemplateId(externalId);
          setCode(activeCode);
          setInputText(JSON.stringify(external.input, null, 2));
          setLanguage(activeLanguage);
          // Known-answer question: pre-fill the expected output AND show the
          // correct answer in the Result box right away.
          if (external.expected !== undefined) {
            const answer =
              typeof external.expected === "string"
                ? external.expected
                : JSON.stringify(external.expected);
            setExpectedText(answer);
            setResultText(answer);
          } else {
            setExpectedText("");
            setResultText("No result yet");
          }
          setSteps([]);
          setCurrentIndex(0);
          setIsPlaying(false);
          pendingLoadRef.current.set({
            code: activeCode,
            inputText: JSON.stringify(external.input, null, 2),
          });
          pendingDeepLinkRef.current = {
            code: activeCode,
            inputText: JSON.stringify(external.input, null, 2),
            language: activeLanguage,
          };
        }
      }

      // Guide "Take the tour" deep link: open the guided tour on arrival.
      if (params.get("tour") === "1") setShowTour(true);

      const savedId = params.get("savedId");
      if (!savedId) return;

      const savedResponse = await fetch(API.me.savedAlgorithm(savedId), {
        cache: "no-store",
      });
      if (!savedResponse.ok) return;
      const savedJson = (await savedResponse.json()) as { algorithm?: SavedAlgorithm };
      const data = savedJson.algorithm;

      if (data) {
        if (data.code) setCode(data.code);
        if (data.input_data) {
          try {
            setInputText(typeof data.input_data === "string" ? data.input_data : JSON.stringify(data.input_data, null, 2));
          } catch {
            setInputText(String(data.input_data));
          }
        }
      }
    };

    void applyUrlState();
  }, []);

  // Restore code stashed before the sign-in redirect so logging in from the
  // soft-gate prompt doesn't lose the user's work-in-progress.
  useEffect(() => {
    const restoredSession = restoredSessionRef.current;
    if (restoredSession?.code) setCode(restoredSession.code);
    if (restoredSession?.inputText) setInputText(restoredSession.inputText);
    if (restoredSession?.language) setLanguage(restoredSession.language);
    setRestored(true);
  }, []);

  // Load→Run race guard. `loadSelectedTemplate` / `handleLoadSaved` write the
  // exact payload here synchronously; `runTrace` prefers it over state so a Run
  // clicked immediately after Load executes the freshly loaded code even before
  // the editor/state has re-rendered. Cleared the moment the user edits code.
  // Eager init: the factory is cheap and only the first result is kept, which
  // also keeps the type non-null in the callbacks below.
  const pendingLoadRef = useRef<PendingLoadStore>(createPendingLoadStore());

  const cleanupWorker = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  /** After a successful run: mark the template traced and surface the
   * path-complete banner when this finishes a path. */
  const recordRunProgress = useCallback((templateId: string) => {
    const path = pathForTemplate(templateId);
    if (!path) return;
    recordTemplateTraced(templateId);
    if (isPathComplete(path, getLearningProgress())) setCompletedPathId(path.id);
  }, []);

  /**
   * Runs already-instrumented code inside the trace worker and resolves with
   * the raw outcome. The soft gate, translation, and state updates live in
   * `runTrace`; this helper is also reused for the A/B comparison trace.
   */
  const executeTrace = useCallback(
    (instrumented: InstrumentResult, parsedInput: unknown) => {
      return new Promise<{ ok: boolean; steps?: unknown[]; result?: unknown; error?: string }>(
        (resolve) => {
          cleanupWorker();

          let objectUrl: string;
          let worker: Worker;
          try {
            objectUrl = URL.createObjectURL(
              new Blob([createWorkerSource()], { type: "application/javascript" }),
            );
            worker = new Worker(objectUrl);
          } catch (workerError) {
            resolve({
              ok: false,
              error: `Unable to start the trace runner: ${
                workerError instanceof Error ? workerError.message : String(workerError)
              }`,
            });
            return;
          }

          objectUrlRef.current = objectUrl;
          workerRef.current = worker;

          const timeoutMs = Math.max(5000, Math.min(15000, instrumented.code.length * 10));
          timeoutRef.current = setTimeout(() => {
            resolve({
              ok: false,
              error:
                "The code ran for too long and was stopped. Check for an infinite loop, or try a smaller input.",
            });
          }, timeoutMs);

          worker.onmessage = (event: MessageEvent<WorkerTraceMessage>) => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            resolve({
              ok: event.data.ok,
              steps: event.data.steps ?? [],
              result: event.data.result,
              error: event.data.error,
            });
          };

          worker.onerror = (event) => {
            resolve({ ok: false, error: event.message || "The trace worker crashed." });
          };

          worker.postMessage({
            code: instrumented.code,
            inputText: JSON.stringify(parsedInput),
          });
        },
      );
    },
    [cleanupWorker],
  );

  const runComparisonFor = useCallback(async () => {
    let parsedInput: unknown;
    try {
      parsedInput = JSON.parse(inputText);
    } catch {
      setCompareSteps([]);
      setCompareLabel("");
      return;
    }
    if (!parsedInput || typeof parsedInput !== "object" || Array.isArray(parsedInput)) {
      setCompareSteps([]);
      setCompareLabel("");
      return;
    }

    const target = getComparisonTarget(selectedTemplate, parsedInput as Record<string, unknown>);
    if (!target) {
      setCompareSteps([]);
      setCompareLabel("");
      return;
    }

    try {
      const instrumented = instrumentForTrace(target.code, { inputText: JSON.stringify(target.input) });
      const outcome = await executeTrace(instrumented, target.input);
      cleanupWorker();
      if (outcome.ok) {
        setCompareSteps(normalizeSteps(outcome.steps ?? []));
        setCompareLabel(target.label);
      } else {
        setCompareSteps([]);
        setCompareLabel("");
      }
    } catch {
      setCompareSteps([]);
      setCompareLabel("");
    }
  }, [executeTrace, inputText, selectedTemplate, cleanupWorker]);

  /**
   * One-click "This trace was wrong" — stores the code hash and run context
   * server-side (so flagged traces are queryable by code hash) and counts the
   * report as an analytics event. Never throws; returns whether the report
   * was stored.
   */
  const reportTrace = useCallback(async (): Promise<boolean> => {
    if (!lastTrace) return false;
    try {
      const [codeHash, inputHash] = await Promise.all([sha256Hex(code), sha256Hex(inputText)]);
      const response = await fetch(API.traceReport, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code_hash: codeHash,
          input_hash: inputHash,
          language: lastTrace.language,
          template: lastTrace.template,
          outcome: lastTrace.outcome,
          error: lastTrace.error,
        }),
      });
      trackTraceReported();
      return response.ok;
    } catch {
      return false;
    }
  }, [lastTrace, code, inputText]);

  const runTrace = useCallback(
    async (opts?: { count?: boolean; language?: SupportedLanguage; autoPlay?: boolean }) => {
      // `language` override lets the mismatch banner run with the detected
      // language before the picker state re-renders (no stale closure).
      // `autoPlay` (default true) starts the playback immediately after a
      // user-initiated run, gated by the persisted Auto-play preference; the
      // boot preview opts out so the landing page stays static.
      const activeLanguage = opts?.language ?? language;
      // Consume any pending Load payload so Run immediately after Load traces
      // the freshly loaded code rather than a stale editor buffer. Consume is
      // one-shot: a payload used by this run never leaks into the next.
      const pendingLoad = pendingLoadRef.current.consume();
      const activeCode = pendingLoad?.code ?? code;
      const activeInputText = pendingLoad?.inputText ?? inputText;
      // Boot/shared runs may seek straight to a step from a share link (payload
      // `s` takes precedence over the older `?s=` query param). Shared by the
      // JS and Python paths so shared links honor the step in every language.
      // Telemetry: record the outcome of this run (Vercel Analytics) and keep
      // the most recent one in state so the "Wrong trace?" button can report it.
      const recordTrace = (
        outcome: TraceOutcome,
        extra?: Partial<Pick<TraceTelemetry, "steps" | "durationMs" | "error" | "translated">>,
      ) => {
        const template = algorithmTemplates.find(
          (candidate) => candidate.id === selectedTemplateId,
        );
        const telemetry: TraceTelemetry = {
          outcome,
          language: activeLanguage,
          template: selectedTemplateId,
          customCode: activeCode !== (template?.code ?? initialTemplate.code),
          translated: false,
          preview: opts?.count === false,
          steps: 0,
          durationMs: null,
          error: null,
          ...extra,
        };
        trackTraceOutcome(telemetry);
        setLastTrace(telemetry);
      };

      // Hide the report button while a new run is in flight.
      setLastTrace(null);

      const seekBootStep = (nextSteps: VisualStep[]) => {
        if (opts?.count === false) {
          const shareStep =
            shareStepRef.current ?? Number(new URLSearchParams(window.location.search).get("s"));
          if (Number.isInteger(shareStep)) {
            setCurrentIndex(Math.min(Math.max(shareStep, 0), Math.max(nextSteps.length - 1, 0)));
            shareStepRef.current = null;
          }
        }
      };
      // Soft gate: confirmed guests get a limited number of free traces. Server
      // preview run (count: false) stays free so the visualizer always demos itself.
      // `authLoading` keeps the gate from firing on a signed-in user before the
      // session fetch has finished. Embeds are public shared traces — no gate.
      if (!embed && user === null && !authLoading && opts?.count !== false) {
        // Prefer server-truth quota (ledger-backed, survives localStorage
        // clears); fall back to the local counter when it's unavailable.
        const quota = quotaRef.current;
        const used = Math.max(quota?.used ?? 0, getAnonymousTraceCount());
        if (used >= ANONYMOUS_TRACE_LIMIT) {
          setError("");
          setLoginPrompt("traces");
          setIsPlaying(false);
          return;
        }
      }

      // A blank file is a real state now (startBlank) — explain instead of
      // failing with a cryptic parse/instrument error.
      if (!activeCode.trim()) {
        setError(
          "Write some code first — pick a preset above and press Load, or start from a blank file and type your own.",
        );
        setResultText("No result");
        setIsPlaying(false);
        recordTrace("error", { error: "empty_code" });
        return;
      }

      let parsedInput: unknown;

      try {
        parsedInput = JSON.parse(activeInputText);
      } catch (parseError) {
        setError(
          `Input JSON is invalid: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`,
        );
        setIsPlaying(false);
        return;
      }

      // Java/C++ only run through AI translation (a paid server-side call), so
      // confirmed guests are stopped here with the sign-in prompt — the server
      // enforces the same rule. TS is unaffected: its fallback is an edge case.
      if (
        (activeLanguage === "java" || activeLanguage === "cpp") &&
        user === null &&
        !authLoading
      ) {
        setIsPlaying(false);
        if (embed) {
          setError("Java and C++ runs are translated by AI and require sign-in.");
        } else {
          setLoginPrompt("ai");
        }
        return;
      }

      const langInfo = getLanguageInfo(activeLanguage);

      // Languages on the roadmap can't be traced yet; Java and C++ are
      // available and route through the AI translation path below.
      if (langInfo.status === "coming-soon") {
        setError(
          `${langInfo.label} support is coming soon — JavaScript, TypeScript, Python, Java, and C++ are available now.`,
        );
        setResultText("No result");
        setIsPlaying(false);
        return;
      }

      // Language/code mismatch: if the code clearly reads as a different
      // available language than the picker, stop and ask — running it as-is
      // would just fail with a cryptic parse error. JavaScript/TypeScript are
      // treated as one family (both trace locally).
      if (!bypassMismatchRef.current) {
        const detected = detectLanguage(activeCode);
        const detectedInfo = getLanguageInfo(detected.language);
        const sameFamily = (a: SupportedLanguage, b: SupportedLanguage) =>
          (a === "javascript" || a === "typescript") ===
          (b === "javascript" || b === "typescript");
        if (
          detected.language !== "unknown" &&
          detectedInfo.status === "available" &&
          !sameFamily(detected.language, activeLanguage)
        ) {
          setLanguageMismatch({ detected: detected.language, selected: activeLanguage });
          setIsPlaying(false);
          return;
        }
      }
      bypassMismatchRef.current = false;

      // Native Python tracing via Pyodide + sys.settrace — no Gemini, real
      // line numbers from CPython itself. Runs entirely in the browser.
      if (activeLanguage === "python") {
        setTranslatedCode(null);
        setTranslatedFromLabel(null);
        setTranslationSource(null);
        setHasOriginalLineMapping(true);
        setCompareSteps([]);
        setCompareLabel("");

        setIsRunning(true);
        setIsPlaying(false);
        setError("");
        setResultText("Running Python…");
        setRunDurationMs(null);

        const startTime = performance.now();
        let outcome: Awaited<ReturnType<typeof runPythonTrace>>;
        try {
          // Use the pending-load payload (deep links / language swaps), not the
          // closure's code — the closure can be stale when this run was
          // triggered right after swapping the editor contents.
          const entry = detectPythonEntry(activeCode, activeInputText);
          outcome = await runPythonTrace(activeCode, activeInputText, {
            entryCode: entry ? buildPythonHarness(entry, activeCode, activeInputText) : undefined,
            onStatus: (message) => {
              if (message === "loading-pyodide") {
                setResultText("Loading the Python runtime (first run downloads ~15 MB)…");
              }
            },
            timeoutMs: 120_000,
          });
        } catch (runError) {
          setIsRunning(false);
          const message = runError instanceof Error ? runError.message : String(runError);
          setError(message);
          setResultText("No result");
          recordTrace("error", { error: message });
          return;
        }
        setIsRunning(false);
        const durationMs = performance.now() - startTime;
        setRunDurationMs(durationMs);

        const built = buildPythonSteps(outcome.steps ?? []);
        const nextSteps = normalizeSteps(built.steps);
        setSteps(nextSteps);
        setCurrentIndex(0);

        if (!outcome.ok) {
          setError(outcome.error ?? "The Python trace runner stopped with an unknown error.");
          setResultText("No result");
          recordTrace("error", {
            steps: nextSteps.length,
            durationMs,
            error: outcome.error ?? null,
          });
          return;
        }
        if (!nextSteps.length) {
          setError(
            "The Python code ran but didn't change any visible state. Try code that builds or updates an array, string, map, or graph.",
          );
          recordTrace("zero_steps", { steps: 0, durationMs });
        } else if (outcome.truncated) {
          setError(
            "The trace hit the step limit and was cut short — try a smaller input or a simpler loop.",
          );
          recordTrace("step_limit", { steps: nextSteps.length, durationMs });
        } else {
          recordTrace("success", { steps: nextSteps.length, durationMs });
        }

        // Learning paths: count successful runs (boot preview excluded).
        if (opts?.count !== false && nextSteps.length > 0) {
          recordRunProgress(selectedTemplateId);
        }

        // Freemium gate / ledger: a counted successful run is recorded as a
        // trace_run event. For guests it consumes one free trace (server truth
        // with fresh quota on the same response; local counter as fallback);
        // for signed-in users it feeds the profile activity charts.
        if (!embed && opts?.count !== false && !authLoading) {
          if (user === null) {
            incrementAnonymousTraceCount();
            void postActivityEvent({
              event: "trace_run",
              templateId: selectedTemplateId,
              outcome: "success",
            }).then(applyQuota);
          } else {
            void postActivityEvent({
              event: "trace_run",
              templateId: selectedTemplateId,
              outcome: "success",
            });
          }
        }

        const consoleOutput = pythonConsoleOutput(nextSteps);
        setResultText(consoleOutput.length ? consoleOutput[consoleOutput.length - 1] : "No output");
        // Run button auto-plays the trace (the existing interval handles
        // speed and stopping at the end), gated by the persisted Auto-play
        // preference.
        if (getAutoPlayAfterRun() && opts?.autoPlay !== false && nextSteps.length > 1) {
          setIsPlaying(true);
        }
        seekBootStep(nextSteps);
        return;
      }

      let codeToRun = activeCode;
      let usedTranslation = false;

      // AI-translate non-JavaScript languages first (cached client-side).
      const translateWithAi = async (): Promise<string | null> => {
        setIsTranslating(true);
        setError("");
        setResultText(`Translating ${langInfo.label} → JavaScript…`);
        try {
          const cacheKey = translationCacheKey(activeLanguage, activeCode, activeInputText);
          const cached = getCachedTranslation(cacheKey, activeCode, activeInputText);
          if (cached) {
            setTranslatedFromLabel(langInfo.label);
            setTranslationSource("cache");
            return cached;
          }

          const res = await fetch(API.translate, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: activeCode, language: activeLanguage, input: activeInputText }),
          });
          const data = await res.json() as { translatedCode?: string; error?: string };
          if (!res.ok || !data.translatedCode) {
            setError(data.error ?? "Translation failed. Check your OPENROUTER_API_KEY in Vercel settings.");
            return null;
          }
          setCachedTranslation(cacheKey, activeCode, activeInputText, data.translatedCode);
          setTranslatedFromLabel(langInfo.label);
          setTranslationSource("live");
          return data.translatedCode;
        } catch (err) {
          setError(`Translation request failed: ${err instanceof Error ? err.message : String(err)}`);
          return null;
        } finally {
          setIsTranslating(false);
        }
      };

      if (!langInfo.isJavaScript) {
        const translated = await translateWithAi();
        if (!translated) {
          setResultText("No result");
          recordTrace("error", { translated: true, error: "translation_failed" });
          return;
        }
        codeToRun = translated;
        usedTranslation = true;
      } else {
        setTranslatedFromLabel(null);
        setTranslationSource(null);
      }

      // Instrument the code. TypeScript is tried directly first; unsupported type
      // syntax falls back to the AI translation path like any other language.
      let instrumented: InstrumentResult;
      try {
        instrumented = instrumentForTrace(codeToRun, {
          typescript: activeLanguage === "typescript",
          inputText: activeInputText,
        });
      } catch (instrumentError) {
        if (activeLanguage !== "typescript") {
          setError(instrumentError instanceof Error ? instrumentError.message : String(instrumentError));
          setResultText("No result");
          recordTrace("instrument_error", {
            error: instrumentError instanceof Error ? instrumentError.message : String(instrumentError),
          });
          return;
        }

        const translated = await translateWithAi();
        if (!translated) {
          setResultText("No result");
          return;
        }
        codeToRun = translated;
        usedTranslation = true;
        try {
          instrumented = instrumentForTrace(codeToRun, { inputText: activeInputText });
        } catch (secondError) {
          setError(
            `Couldn't trace the translated code: ${secondError instanceof Error ? secondError.message : String(secondError)}`,
          );
          setResultText("No result");
          recordTrace("instrument_error", {
            translated: true,
            error: secondError instanceof Error ? secondError.message : String(secondError),
          });
          return;
        }
      }

      setTranslatedCode(usedTranslation ? codeToRun : null);
      setHasOriginalLineMapping(instrumented.lineMap.size > 0);

      setIsRunning(true);
      setIsPlaying(false);
      setError("");
      setResultText("Running...");
      setRunDurationMs(null);

      const startTime = performance.now();
      const outcome = await executeTrace(instrumented, parsedInput);
      cleanupWorker();
      setIsRunning(false);

      const nextSteps = normalizeSteps(outcome.steps ?? []);
      setSteps(nextSteps);
      setCurrentIndex(0);
      const durationMs = performance.now() - startTime;
      setRunDurationMs(durationMs);

      if (!outcome.ok) {
        // Step-limit hits keep the partial trace (like Python): show the same
        // friendly notice and the last console line instead of a bare failure.
        if (isStepLimitError(outcome.error)) {
          setError(
            "The trace hit the step limit and was cut short — try a smaller input or a simpler loop.",
          );
          const jsConsoleOutput = nextSteps
            .filter((step) => step.title === "Console")
            .map((step) => step.note)
            .filter((note): note is string => typeof note === "string");
          setResultText(jsConsoleOutput.length ? jsConsoleOutput[jsConsoleOutput.length - 1] : "No output");
          recordTrace("step_limit", { steps: nextSteps.length, durationMs });
          return;
        }
        const timedOut = outcome.error?.includes("ran for too long") ?? false;
        setError(outcome.error ?? "The trace runner stopped with an unknown error.");
        setResultText(timedOut ? "Timed out" : "No result");
        recordTrace(timedOut ? "timeout" : "error", {
          steps: nextSteps.length,
          durationMs,
          error: outcome.error ?? null,
        });
        return;
      }

      if (!nextSteps.length) {
        setError(
          "The code ran but didn't change any visible state. Try code that builds or updates an array, string, map, or graph.",
        );
        recordTrace("zero_steps", { steps: 0, durationMs });
      } else {
        recordTrace("success", { steps: nextSteps.length, durationMs });
      }

      // Learning paths: count successful runs (boot preview excluded).
      if (opts?.count !== false && nextSteps.length > 0) {
        recordRunProgress(selectedTemplateId);
      }

      // Freemium gate / ledger: a counted successful run is recorded as a
      // trace_run event. For guests it consumes one free trace (server truth
      // with fresh quota on the same response; local counter as fallback);
      // for signed-in users it feeds the profile activity charts.
      if (!embed && opts?.count !== false && !authLoading) {
        if (user === null) {
          incrementAnonymousTraceCount();
          void postActivityEvent({
            event: "trace_run",
            templateId: selectedTemplateId,
            outcome: "success",
          }).then(applyQuota);
        } else {
          void postActivityEvent({
            event: "trace_run",
            templateId: selectedTemplateId,
            outcome: "success",
          });
        }
      }

      setResultText(formatResult(outcome.result));

      // Run button auto-plays the trace (the existing interval handles
      // speed and stopping at the end), gated by the persisted Auto-play
      // preference.
      if (getAutoPlayAfterRun() && opts?.autoPlay !== false && nextSteps.length > 1) {
        setIsPlaying(true);
      }

      seekBootStep(nextSteps);

      // Rebuild the A/B comparison trace after every run.
      if (compareModeRef.current) void runComparisonFor();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cleanupWorker, code, inputText, language, user, authLoading, runComparisonFor],
  );

  // Wait for the session fetch to settle before auto-running: the Java/C++
  // gate inside runTrace only fires once auth is known, so without this a
  // guest deep link would race ahead, get a server 403, and land in the error
  // strip instead of the sign-in modal.
  useEffect(() => {
    if (bootedRef.current || !restored || authLoading) return;
    bootedRef.current = true;
    // The Python runtime is heavy (~15 MB WASM) — don't auto-download it on
    // page load; the user clicks Run when they want to trace.
    if (language === "python") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot boot preview gated by bootedRef
    runTrace({ count: false, autoPlay: false });
  }, [restored, runTrace, language, authLoading]);

  // Deep links (/learn start buttons, Top 150 Visualize) run the loaded code
  // once — the boot preview was skipped for them (bootedRef), so this is the
  // single auto-run that shows the question's own trace and output. Deferred
  // until the session settles for the same reason as the boot preview.
  useEffect(() => {
    const payload = pendingDeepLinkRef.current;
    if (!payload || authLoading) return;
    pendingDeepLinkRef.current = null;
    void runTrace({ count: false, autoPlay: false, language: payload.language });
  }, [runTrace, authLoading]);

  // Start time tracking when a question is loaded in the visualizer.
  // The timer runs until the user marks the question as solved in the learn page.
  useEffect(() => {
    if (externalQuestion?.no) {
      startTimer(externalQuestion.no);
    }
  }, [externalQuestion?.no]);

  useEffect(() => cleanupWorker, [cleanupWorker]);

  useEffect(() => () => terminatePythonWorker(), []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({ effects: setTraceLineEffect.of(editorActiveLine) });
    if (!editorActiveLine || editorActiveLine < 1 || editorActiveLine > view.state.doc.lines) return;

    // Scroll the active line into view inside the editor's own scroller only.
    // EditorView.scrollIntoView also scrolls the window to center the line,
    // which on small screens yanks the page back up to the code while stepping
    // or playing and makes the visualization unreachable.
    const line = view.state.doc.line(editorActiveLine);
    const coords = view.coordsAtPos(line.from);
    const scroller = view.scrollDOM;
    if (!coords) return;

    const scrollerRect = scroller.getBoundingClientRect();
    const lineCenter = (coords.top + coords.bottom) / 2 - scrollerRect.top;
    const targetScroll = scroller.scrollTop + lineCenter - scroller.clientHeight / 2;
    scroller.scrollTop = Math.max(0, targetScroll);
  }, [editorActiveLine]);

  // Auto-play: advance one step per tick until the trace ends.
  useEffect(() => {
    if (!isPlaying || steps.length <= 1) return;

    const interval = setInterval(() => {
      const next = currentIndexRef.current + 1;
      if (next >= steps.length) {
        setIsPlaying(false);
        return;
      }
      setCurrentIndex(next);
    }, speed[0]);

    return () => clearInterval(interval);
  }, [isPlaying, speed, steps]);

  // Keep the address bar shareable: /visualizer?s=N (+ ?t= when it's a preset).
  // A self-contained share hash (#v1:<payload>) is preserved so a shared link
  // stays valid while the recipient steps through it. Updates are batched to
  // one per animation frame: playback ticks and slider drags fire dozens of
  // index changes a second, and history.replaceState churns layout for no
  // user-visible benefit — the throttled write always lands on the latest
  // index, so the URL stays correct when the stepping stops.
  useEffect(() => {
    if (!steps.length) return;
    let frame = 0;
    const writeUrl = () => {
      frame = 0;
      const params = new URLSearchParams(window.location.search);
      params.set("s", String(currentIndexRef.current));
      if (code === selectedTemplate.code) params.set("t", selectedTemplateId);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}${window.location.hash}`,
      );
    };
    frame = requestAnimationFrame(writeUrl);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length, currentIndex]);

  /** Clears the workspace to a blank file: no code, empty input, no trace.
   * Keeps the current language (JavaScript by default); the user can switch
   * first. The old code stays in the URL (?t=) until the next run, so
   * reloading the page still restores the preset they had before. */
  const startBlank = useCallback(() => {
    setExternalTemplateId(null);
    setExternalVariant("optimal");
    setSelectedTemplateId(BLANK_TEMPLATE_ID);
    pendingLoadRef.current.clear();
    setCode("");
    setInputText("{}");
    setSteps([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setError("");
    setResultText("No result yet");
    setExpectedText("");
    setTranslatedCode(null);
    setHasOriginalLineMapping(false);
    setRunDurationMs(null);
    setCompareSteps([]);
    setCompareLabel("");
    setLanguageMismatch(null);
  }, []);

  const loadSelectedTemplate = () => {
    pendingLoadRef.current.set({
      code: selectedTemplate.code,
      inputText: JSON.stringify(selectedTemplate.input, null, 2),
    });
    setCode(selectedTemplate.code);
    setInputText(JSON.stringify(selectedTemplate.input, null, 2));
    setSteps([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setError("");
    // Known-answer template: pre-fill the correct output and show it in the
    // Result box right away (same contract as the Top 150 bank).
    if (selectedTemplate.expected !== undefined) {
      const answer =
        typeof selectedTemplate.expected === "string"
          ? selectedTemplate.expected
          : JSON.stringify(selectedTemplate.expected);
      setResultText(answer);
      setExpectedText(answer);
    } else {
      setResultText("No result yet");
      setExpectedText("");
    }
    setTranslatedCode(null);
    setHasOriginalLineMapping(false);
    setRunDurationMs(null);
    setCompareSteps([]);
    setCompareLabel("");
  };

  const resetLayout = () => {
    for (const id of [
      "dsa-lab-workspace",
      "dsa-lab-main",
      "dsa-lab-rail",
      "dsa-lab-workspace-narrow",
      "dsa-lab-main-narrow",
      "dsa-lab-rail-narrow",
    ]) {
      try {
        window.localStorage.removeItem(`react-resizable-panels:${id}`);
      } catch {
        // Ignore.
      }
    }
    clearCollapsedState();
    resetPanelZoom();
    setLayoutResetKey((key) => key + 1);
  };

  // Guests who press "Save code" land here — a much stronger conversion moment
  // than the old inline status line, since saving is the reason to log in.
  const requireSignInForSave = useCallback(() => {
    setAuthError("");
    setLoginPrompt("save");
  }, []);

  const signInFromPrompt = () => {
    setAuthError("");
    setIsSigningIn(true);
    // Stash work-in-progress so the OAuth round-trip back to /visualizer can
    // restore the exact code the user was working on.
    try {        writeSessionRestore({ code, inputText, language });
    } catch {
      // Storage unavailable — proceed without restoring.
    }
    signInWithGoogle("/visualizer");
  };

  const handleSeek = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((value) => !value);
  }, []);

  // Keyboard shortcuts: Space play/pause, ←/→ step, Home/End jump. Ignored
  // while typing in the editor, inputs, or when a button/dialog is focused.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element | null;
      if (
        target instanceof Element &&
        target.closest(
          "input, textarea, select, button, [contenteditable='true'], .cm-editor, [role='dialog'], [role='listbox']",
        )
      ) {
        return;
      }
      if (!steps.length) return;

      switch (event.key) {
        case " ":
          event.preventDefault();
          handleTogglePlay();
          break;
        case "ArrowRight":
          event.preventDefault();
          handleSeek(Math.min(currentIndexRef.current + 1, steps.length - 1));
          break;
        case "ArrowLeft":
          event.preventDefault();
          handleSeek(Math.max(currentIndexRef.current - 1, 0));
          break;
        case "Home":
          event.preventDefault();
          handleSeek(0);
          break;
        case "End":
          event.preventDefault();
          handleSeek(steps.length - 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [steps.length, handleSeek, handleTogglePlay]);

  const handleToggleCompare = useCallback(() => {
    setCompareMode((current) => {
      const next = !current;
      if (next) void runComparisonFor();
      else setCompareSteps([]);
      return next;
    });
  }, [runComparisonFor]);

  const handleDownloadPdf = useCallback(async () => {
    if (!steps.length || generatingReport) return;
    setGeneratingReport(true);
    try {
      const { generateHtmlReport } = await import("@/lib/html-report");
      // Save and restore the current step after capture
      const savedIndex = currentIndex;
      await generateHtmlReport({
        algorithmName: selectedTemplate.name,
        language,
        inputText,
        code,
        steps,
        resultText,
        runDurationMs,
        seekToStep: async (index: number) => {
          setCurrentIndex(index);
          // Yield to let React commit the DOM update before capturing.
          await new Promise((r) => setTimeout(r, 80));
        },
      });
      setCurrentIndex(savedIndex);
      toast({ title: "Report downloaded", description: "Your interactive visualization report is ready." });
    } catch (error) {
      toast({ title: "Report generation failed", description: String(error), variant: "error" });
    } finally {
      setGeneratingReport(false);
    }
  }, [steps, selectedTemplate.name, language, inputText, code, resultText, runDurationMs, generatingReport, currentIndex]);

  const handleLoadSaved = useCallback((saved: SavedAlgorithm) => {
    setExternalTemplateId(null);
    pendingLoadRef.current.set({
      code: saved.code,
      inputText: JSON.stringify(saved.input_data, null, 2),
    });
    setCode(saved.code);
    setInputText(JSON.stringify(saved.input_data, null, 2));
    setSteps([]);
    setCurrentIndex(0);
    setIsPlaying(false);
    setError("");
    setResultText(`Loaded: ${saved.title}`);
    setExpectedText("");
    setTranslatedCode(null);
    setHasOriginalLineMapping(false);
    setRunDurationMs(null);
    setCompareSteps([]);
    setCompareLabel("");
  }, []);

  // Brute/Optimal toggle for Top Interview 150 questions: swaps the editor to
  // the naive solution (when one exists), clears stale trace state, and
  // immediately re-traces it (free — the boot preview pattern) so learners see
  // the alternative approach without another click.
  const handleExternalVariantChange = useCallback(
    (variant: "brute" | "optimal") => {
      if (!externalTemplate) return;
      const nextCode =
        resolveExternalCode(externalTemplate.no, language, variant) ??
        externalTemplate.code;
      if (nextCode === code) return;
      pendingLoadRef.current.set({
        code: nextCode,
        inputText: JSON.stringify(externalTemplate.input, null, 2),
      });
      setExternalVariant(variant);
      setCode(nextCode);
      setInputText(JSON.stringify(externalTemplate.input, null, 2));
      setSteps([]);
      setCurrentIndex(0);
      setIsPlaying(false);
      setError("");
      setResultText("No result yet");
      void runTrace({ count: false, autoPlay: false, language: normalizeLanguage(language) });
    },
    [externalTemplate, code, language, runTrace],
  );

  // Shared logic for switching the editor to a different language's solution.
  // Both the TopBar and Workspace language pickers call this after setting
  // the language state and (optionally) clearing the mismatch warning.
  const switchLanguage = useCallback(
    (lang: string) => {
      const fromLang = normalizeLanguage(language);
      const toLang = normalizeLanguage(lang);
      const externalNo = externalTemplate?.no ?? 0;
      const nextCode = resolveExternalCode(
        externalNo, toLang, externalVariant, builtinTemplate,
      );
      const nextInput = externalTemplate?.input ?? builtinTemplate?.input;
      const currentCode = resolveExternalCode(
        externalNo, fromLang, externalVariant, builtinTemplate,
      );
      // If switching to a language with no pre-written code (Java/C++),
      // the existing AI translation path handles it — don't block.
      if (nextCode && currentCode !== undefined && currentCode === code && nextCode !== code) {
        pendingLoadRef.current.set({
          code: nextCode,
          inputText: JSON.stringify(nextInput ?? {}, null, 2),
        });
        setCode(nextCode);
        setSteps([]);
        setCurrentIndex(0);
        setIsPlaying(false);
        setError("");
        setResultText("No result yet");
        void runTrace({ count: false, autoPlay: false, language: toLang });
      }
    },
    [language, externalTemplate, externalVariant, builtinTemplate, code, runTrace],
  );

  const copyLink = useCallback(async () => {
    const url = buildShareUrl({
      v: 1,
      code,
      input: inputText,
      language,
      s: steps.length > 0 ? currentIndex : undefined,
    });
    if (!url) {
      toast({
        title: "Code is too large to share",
        description: "Share links carry the full source — try a smaller example.",
        variant: "error",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Step link copied",
        description: "Anyone with the link opens this run at step " + (currentIndex + 1) + ".",
        variant: "success",
      });
    } catch {
      // Clipboard unavailable (permissions/iframe) — ignore.
    }
  }, [code, inputText, language, currentIndex, steps.length]);

  // Share dropdown actions: a self-contained link, or an iframe snippet for
  // course notes / slides (embed mode). Both encode the live workspace state.
  const copyShareLink = useCallback(async () => {
    const url = buildShareUrl({
      v: 1,
      code,
      input: inputText,
      language,
      s: steps.length > 0 ? currentIndex : undefined,
    });
    if (!url) {
      toast({
        title: "Code is too large to share",
        description: "Share links carry the full source — try a smaller example.",
        variant: "error",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Share link copied",
        description: "Anyone with the link opens this exact run, no account needed.",
        variant: "success",
      });
    } catch {
      // Clipboard unavailable (permissions/iframe) — ignore.
    }
  }, [code, inputText, language, currentIndex, steps.length]);

  const copyEmbedCode = useCallback(async () => {
    const snippet = buildEmbedCode({
      v: 1,
      code,
      input: inputText,
      language,
      s: steps.length > 0 ? currentIndex : undefined,
    });
    if (!snippet) {
      toast({
        title: "Code is too large to embed",
        description: "Embeds carry the full source — try a smaller example.",
        variant: "error",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(snippet);
      toast({
        title: "Embed code copied",
        description: "Paste the iframe snippet into any HTML page or slide deck.",
        variant: "success",
      });
    } catch {
      // Clipboard unavailable (permissions/iframe) — ignore.
    }
  }, [code, inputText, language, currentIndex, steps.length]);

  const translationLabel =
    translatedFromLabel != null
      ? `✓ Translated from ${translatedFromLabel}${translationSource === "cache" ? " (cached)" : ""}`
      : null;

  // Run-pipeline stage for the output-strip stepper (Translate → Trace →
  // Visualize). Translated languages (Java/C++) get the Translate stage;
  // JS/TS/Python go straight to Trace.
  const needsTranslation = language === "java" || language === "cpp";
  const runPhase: RunPhase =
    error !== ""
      ? "error"
      : isTranslating
        ? "translate"
        : isRunning
          ? "trace"
          : steps.length > 0
            ? "done"
            : "idle";

  const studyNotes = useMemo(() => {
    if (!steps.length) return null;
    const lines: string[] = [];
    const variantLabel = externalVariant === "brute" ? " (Brute)" : "";
    const langLabel = language.charAt(0).toUpperCase() + language.slice(1);
    lines.push(`# ${selectedTemplate.name}${variantLabel} — ${langLabel} study notes`);
    lines.push("");
    lines.push(`- **Language:** ${language}`);
    lines.push(`- **Input:** \`${inputText.trim()}\``);
    lines.push(
      `- **Steps:** ${steps.length}${runDurationMs != null ? ` · ${formatDuration(runDurationMs)}` : ""}`,
    );
    const finalOps = steps[steps.length - 1]?.ops;
    if (finalOps) {
      lines.push(
        `- **Operations:** ${finalOps.comparisons} comparisons · ${finalOps.swaps} swaps · ${finalOps.writes} writes`,
      );
    }
    lines.push(`- **Result:** \`${resultText}\``);
    lines.push("");
    lines.push("## Code");
    lines.push("```" + (language === "javascript" ? "js" : language));
    lines.push(code.trim());
    lines.push("```");
    lines.push("");
    lines.push("## Step log");

    const MAX_STEPS = 60;
    const indices =
      steps.length > MAX_STEPS
        ? [
            ...Array.from({ length: 40 }, (_, index) => index),
            ...Array.from({ length: 20 }, (_, index) => steps.length - 20 + index),
          ]
        : steps.map((_, index) => index);

    for (const index of indices) {
      const step = steps[index];
      const explanation = explainStep(step, steps[index - 1]);
      const note = step.note && step.note !== explanation ? ` — ${step.note}` : "";
      lines.push(
        `${index + 1}. **${step.title ?? "Step"}**${note}${explanation ? ` — ${explanation}` : ""}`,
      );
    }
    if (steps.length > MAX_STEPS) {
      lines.push(`… (${steps.length - MAX_STEPS} steps elided)`);
    }
    return lines.join("\n");
  }, [steps, selectedTemplate.name, inputText, runDurationMs, resultText, language, code, externalVariant]);

  // Complete, unabridged notes for the Download button (clipboard-friendly copy
  // above stays capped at 60 steps).
  const fullStudyNotes = useMemo(() => {
    if (!steps.length) return null;
    const lines: string[] = [];
    const variantLabel = externalVariant === "brute" ? " (Brute)" : "";
    const langLabel = language.charAt(0).toUpperCase() + language.slice(1);
    lines.push(`# ${selectedTemplate.name}${variantLabel} — ${langLabel} complete run notes`);
    lines.push("");
    lines.push(`- **Language:** ${language}`);
    lines.push(`- **Input:** \`${inputText.trim()}\``);
    lines.push(
      `- **Steps:** ${steps.length}${runDurationMs != null ? ` · ${formatDuration(runDurationMs)}` : ""}`,
    );
    const finalOps = steps[steps.length - 1]?.ops;
    if (finalOps) {
      lines.push(
        `- **Operations:** ${finalOps.comparisons} comparisons · ${finalOps.swaps} swaps · ${finalOps.writes} writes`,
      );
    }
    lines.push(`- **Result:** \`${resultText}\``);
    lines.push("");
    lines.push("## Code");
    lines.push("```" + (language === "javascript" ? "js" : language));
    lines.push(code.trim());
    lines.push("```");
    lines.push("");
    lines.push("## Step log (every step)");
    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      const explanation = explainStep(step, steps[index - 1]);
      const note = step.note && step.note !== explanation ? ` — ${step.note}` : "";
      lines.push(
        `${index + 1}. **${step.title ?? "Step"}**${note}${explanation ? ` — ${explanation}` : ""}`,
      );
    }
    return lines.join("\n");
  }, [steps, selectedTemplate.name, inputText, runDurationMs, resultText, language, code, externalVariant]);

  // Fact sheet for the tutor: everything it may know about the run in view,
  // rebuilt whenever the step, code, input, or result changes. Built here (not
  // in the panel) because this is where the trace state lives; the panel stays
  // presentational and the route re-clamps it all anyway.
  const tutorContext = useMemo(() => {
    if (steps.length === 0) return null;
    return buildTutorContext({
      problem: externalQuestion?.title ?? selectedTemplate.name,
      language,
      code,
      inputText,
      currentLineText:
        currentStep?.line !== undefined ? codeLines[currentStep.line - 1] : undefined,
      steps,
      currentIndex,
      resultText,
    });
  }, [
    steps,
    currentIndex,
    code,
    language,
    inputText,
    codeLines,
    currentStep,
    resultText,
    externalQuestion,
    selectedTemplate,
  ]);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <TopBar
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={(id) => {
          // "New · Blank" isn't a template — clear the workspace instead of
          // selecting a preset that doesn't exist.
          if (id === BLANK_TEMPLATE_ID) {
            startBlank();
            return;
          }
          setExternalTemplateId(null);
          setExternalVariant("optimal");
          setExpectedText("");
          setSelectedTemplateId(id);
          setLanguageMismatch(null);
          setLanguage("javascript");
        }}
        onLoadTemplate={loadSelectedTemplate}
        language={language}
        availableLanguages={availableLanguages}
        onLanguageChange={(lang) => {
          setLanguageMismatch(null);
          // A Top 150 question with no solution in the target language would
          // leave the editor in JS while the selector claims a different
          // language — refuse the switch and say why instead of breaking the
          // next run with a parse error.
          if (
            externalTemplate &&
            lang !== "javascript" &&
            !availableLanguages?.includes(lang as SolutionLanguage)
          ) {
            setError(
              `${getLanguageInfo(lang).label} isn't available for this question yet — JavaScript is.`,
            );
            return;
          }
          setLanguage(lang);
          switchLanguage(lang);
        }}
        isRunning={isRunning}
        isTranslating={isTranslating}
        onRun={() => {
          // On phones the workspace is one tab at a time — surface the trace
          // by switching to the Visualization tab when Run is pressed.
          mobileTabApiRef.current?.showViz();
          void runTrace();
        }}
        stepsCount={steps.length}
        tracesLeft={!embed && user === null ? Math.max(ANONYMOUS_TRACE_LIMIT - tracesUsed, 0) : null}
        translationLabel={translationLabel}
        onStartTour={() => setShowTour(true)}
        code={code}
        inputText={inputText}
        stepIndex={steps.length > 0 ? currentIndex + 1 : undefined}
        stepCount={steps.length}
        resultText={resultText}
        expectedText={expectedText}
        presetLabel={externalQuestion ? externalQuestion.title : undefined}
        externalVariant={externalVariant}
        onExternalVariantChange={handleExternalVariantChange}
        hasBruteVariant={
          hasBruteVariant(externalTemplate?.no ?? 0, language, builtinTemplate)
        }
        guestLockedLanguages={!embed && user === null ? ["java", "cpp"] : undefined}
        translationQuota={user ? translationQuota : null}
        embed={embed}
        onCopyShareLink={() => void copyShareLink()}
        onCopyEmbedCode={() => void copyEmbedCode()}
      />

      {!embed && completedPath ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[12.5px]"
        >
          <Trophy className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-foreground/90">
            You completed the <b>{completedPath.title}</b> learning path. Nice work!
          </p>
          <Button
            asChild
            size="sm"
            className="h-6 bg-emerald-600/90 px-2.5 text-[12px] text-white hover:bg-emerald-500"
          >
            <Link href="/learn">View learning paths</Link>
          </Button>
          <button
            type="button"
            className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss"
            onClick={() => setCompletedPathId(null)}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {languageMismatch ? (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-[12.5px]"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-foreground/90">
            This code looks like <b>{getLanguageInfo(languageMismatch.detected).label}</b>, but{" "}
            <b>{getLanguageInfo(languageMismatch.selected).label}</b> is selected — running it as{" "}
            {getLanguageInfo(languageMismatch.selected).label} will fail.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="h-6 bg-amber-500/90 px-2.5 text-[12px] text-black hover:bg-amber-400"
              onClick={() => {
                const detected = languageMismatch.detected;
                bypassMismatchRef.current = true;
                setLanguageMismatch(null);
                setLanguage(detected);
                void runTrace({ language: detected });
              }}
            >
              Run as {getLanguageInfo(languageMismatch.detected).label}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 px-2.5 text-[12px]"
              onClick={() => {
                const selected = languageMismatch.selected;
                bypassMismatchRef.current = true;
                setLanguageMismatch(null);
                void runTrace({ language: selected });
              }}
            >
              Run as {getLanguageInfo(languageMismatch.selected).label} anyway
            </Button>
            <button
              type="button"
              className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss"
              onClick={() => setLanguageMismatch(null)}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {!embed && (
        <div className="px-3 pt-2">
          <WelcomeBanner
            onRun={() => {
              mobileTabApiRef.current?.showViz();
              void runTrace();
            }}
            onStartTour={() => setShowTour(true)}
            templateName={selectedTemplate?.name}
          />
        </div>
      )}

      <PlaybackBar
        canStep={canStep}
        currentIndex={currentIndex}
        maxIndex={Math.max(steps.length - 1, 0)}
        isPlaying={isPlaying}
        onSeek={handleSeek}
        onTogglePlay={handleTogglePlay}
        stepTitle={currentStep?.title}
        onCopyLink={() => void copyLink()}
        onAskTutor={embed ? undefined : () => setTutorOpen(true)}
        canAskTutor={canStep}
      />

      <ResizableWorkspace
        key={layoutResetKey}
        mobileTabApiRef={mobileTabApiRef}
        steps={steps}
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        onSeek={handleSeek}
        onTogglePlay={handleTogglePlay}
        code={code}
        inputText={inputText}
        onStartBlank={startBlank}
        onCodeChange={(value) => {
          pendingLoadRef.current.clear();
          setCode(value);
          setLanguageMismatch(null);
          const detected = detectLanguage(value);
          setLanguage(detected.language);
          setTranslatedFromLabel(null);
        }}
        onEditorViewReady={(view) => {
          viewRef.current = view;
        }}
        isDark={isDark}
        language={language}
        codeLines={codeLines}
        translatedCode={translatedCode}
        hasOriginalLineMapping={hasOriginalLineMapping}
        translatedFromLabel={translatedFromLabel}
        selectedTemplate={selectedTemplate}
        onLoadSaved={handleLoadSaved}
        onRequireSignIn={requireSignInForSave}
        onInputChange={setInputText}
        examples={selectedTemplate?.examples}
        resultText={resultText}
        expectedText={expectedText}
        onExpectedTextChange={setExpectedText}
        consoleLines={consoleLines}
        runDurationMs={runDurationMs}
        error={error}
        studyNotes={studyNotes}
        fullStudyNotes={fullStudyNotes}
        compareMode={compareMode}
        onToggleCompare={handleToggleCompare}
        compareLabel={compareLabel}
        compareSteps={compareSteps}
        reportable={lastTrace !== null && !isRunning}
        onReportTrace={reportTrace}
        runPhase={runPhase}
        needsTranslation={needsTranslation}
        onDownloadPdf={handleDownloadPdf}
        generatingPdf={generatingReport}
        onLanguageChange={(lang) => {
          setLanguageMismatch(null);
          setLanguage(lang);
          switchLanguage(lang);
        }}
        availableLanguages={availableLanguages}
      />

      <FooterBar
        speed={speed[0]}
        onSpeedChange={(ms) => setSpeed([ms])}
        onResetLayout={resetLayout}
        autoPlayAfterRun={autoPlayAfterRun}
        onToggleAutoPlay={() => setAutoPlayAfterRun(!autoPlayAfterRun)}
      />

      {!embed ? (
        <TutorPanel
          key={tutorContext?.runKey ?? "no-run"}
          open={tutorOpen}
          onClose={() => setTutorOpen(false)}
          context={tutorContext}
          onSignIn={signInFromPrompt}
        />
      ) : null}

      <VisualizerTour
        open={!embed && showTour}
        onClose={() => setShowTour(false)}
        autoOpen={!embed}
        steps={steps}
        currentIndex={currentIndex}
        onSeek={handleSeek}
      />

      {isSigningIn ? (
        <AuthLoaderScreen
          title="Signing you in..."
          subtitle="Your free traces will continue once you're signed in"
          statusText="Taking you to Google Sign-In..."
          step={1}
        />
      ) : null}

      {!embed && loginPrompt !== null && user === null ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/60 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-prompt-title"
            className="w-full max-w-md border bg-background p-6 shadow-soft sm:p-8"
          >
            {loginPrompt === "save" ? (
              <BookmarkPlus className="h-6 w-6 text-primary" aria-hidden="true" />
            ) : loginPrompt === "ai" ? (
              <Languages className="h-6 w-6 text-primary" aria-hidden="true" />
            ) : (
              <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            )}
            <h2 id="login-prompt-title" className="mt-4 text-2xl font-medium tracking-normal">
              {loginPrompt === "save"
                ? "Save your work across visits"
                : loginPrompt === "ai"
                  ? "Sign in to use Java & C++"
                  : `You've used your ${ANONYMOUS_TRACE_LIMIT} free traces`}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {loginPrompt === "save"
                ? "Sign in with Google to save this code to your personal workspace and reload it anytime — plus unlimited traces."
                : loginPrompt === "ai"
                  ? "Java and C++ code is translated to JavaScript by an AI model before it can be traced — that's the one feature that needs a free account. Sign in for unlimited traces and translations."
                  : "Sign in to keep visualizing — unlimited traces, plus the ability to save and reload your practice code. The live demos stay free forever."}
            </p>
            <div className="mt-6 space-y-2">
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={() => void signInFromPrompt()}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Continue with Google
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" asChild>
                  <Link href="/guide">Browse the demos</Link>
                </Button>
                <Button type="button" variant="ghost" onClick={() => setLoginPrompt(null)}>
                  Maybe later
                </Button>
              </div>
            </div>
            {authError ? <p className="mt-3 text-sm text-destructive">{authError}</p> : null}
            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              {loginPrompt === "save"
                ? "You can still step through the current trace without an account."
                : "You can still step through the current trace without an account."}
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
