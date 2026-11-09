"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from "react";
import { Check, Code2, Copy, FilePlus, IndentDecrease, ZoomIn, ZoomOut } from "lucide-react";
// Only the tiny @codemirror/state import stays in the initial bundle (the
// trace-line effect the parent dispatches); the editor itself — the react
// wrapper, editor core, and syntax highlighting (~800KB) — is lazy-loaded in
// a split chunk after first paint (see the CodeEditor import below), while a
// static <pre> preview keeps the code visible and LCP fast.
import { StateEffect, type StateEffectType } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedCodeControls } from "@/components/saved-code-controls";
import type { CodeEditorProps } from "@/components/workspace/code-editor";
import { getLanguageInfo, type SupportedLanguage } from "@/lib/detect-language";
import type { AlgorithmTemplate } from "@/types/visualizer";

export type SavedAlgorithm = {
  id: string;
  title: string;
  topic: string;
  code: string;
  input_data: unknown;
};

type CodePanelProps = {
  code: string;
  inputText: string;
  onCodeChange: (value: string) => void;
  onEditorViewReady: (view: EditorView) => void;
  isDark: boolean;
  language: SupportedLanguage;
  codeLines: string[];
  translatedCode: string | null;
  hasOriginalLineMapping: boolean;
  translatedFromLabel: string | null;
  selectedTemplate: AlgorithmTemplate;
  onLoadSaved: (saved: SavedAlgorithm) => void;
  /** Guest pressed "Save code" — surface the sign-in prompt. */
  onRequireSignIn?: () => void;
  /** Clears the editor to a blank file (same action as "New · Blank"). */
  onStartBlank?: () => void;
  /** Switch the code to a different language. */
  onLanguageChange?: (lang: SupportedLanguage) => void;
  /** Languages with pre-written code for the current template. */
  availableLanguages?: SupportedLanguage[];
};

// Highlights the current trace line inside the editor as the user steps.
// Exported so the parent can dispatch it when the active line changes. The
// effect identity is stable, and the (lazy) editor builds its StateField from
// it — see buildTraceLineField in code-editor.tsx.
export const setTraceLineEffect = StateEffect.define<number | null>();

// ---------------------------------------------------------------------------
// Editor zoom (font size) + indentation guides, persisted per user.
// ---------------------------------------------------------------------------

const FONT_SIZE_KEY = "dsa.code.fontSize";
const GUIDES_KEY = "dsa.code.indentGuides";
const DEFAULT_FONT_SIZE = 13;
const MIN_FONT_SIZE = 9;
const MAX_FONT_SIZE = 28;
const PREFS_EVENT = "dsa-code-prefs";

const clampFontSize = (size: number) =>
  Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(size)));

function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the preference just won't persist.
  }
  window.dispatchEvent(new Event(PREFS_EVENT));
}

// getServerSnapshot keeps SSR and the first client render in agreement; the
// real stored value is read right after hydration (same pattern as the media
// query hook in resizable-workspace).
function subscribeToPrefs(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PREFS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PREFS_EVENT, onStoreChange);
  };
}

function useFontSize() {
  const fontSize = useSyncExternalStore(
    subscribeToPrefs,
    () => {
      const raw = readPref(FONT_SIZE_KEY);
      const parsed = raw === null ? NaN : Number(raw);
      return Number.isFinite(parsed) ? clampFontSize(parsed) : DEFAULT_FONT_SIZE;
    },
    () => DEFAULT_FONT_SIZE,
  );
  const setFontSize = useCallback(
    (next: number) => writePref(FONT_SIZE_KEY, String(clampFontSize(next))),
    [],
  );
  return [fontSize, setFontSize] as const;
}

function useIndentGuides() {
  const showGuides = useSyncExternalStore(
    subscribeToPrefs,
    () => readPref(GUIDES_KEY) !== "0",
    () => true,
  );
  const setShowGuides = useCallback(
    (next: boolean) => writePref(GUIDES_KEY, next ? "1" : "0"),
    [],
  );
  return [showGuides, setShowGuides] as const;
}

export function CodePanel({
  code,
  inputText,
  onCodeChange,
  onEditorViewReady,
  isDark,
  language,
  codeLines,
  translatedCode,
  hasOriginalLineMapping,
  translatedFromLabel,
  selectedTemplate,
  onLoadSaved,
  onRequireSignIn,
  onStartBlank,
  onLanguageChange,
  availableLanguages,
}: CodePanelProps) {
  const languageInfo = getLanguageInfo(language);
  const [fontSize, setFontSize] = useFontSize();
  const [showGuides, setShowGuides] = useIndentGuides();
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  // The heavy editor module is fetched after first paint. Until it arrives the
  // panel shows a static <pre> (which is what SSR paints too, so there is no
  // server/client mismatch), then CodeMirror swaps in and takes over.
  const [EditorComponent, setEditorComponent] = useState<ComponentType<CodeEditorProps> | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("@/components/workspace/code-editor").then(({ CodeEditor }) => {
      if (!cancelled) setEditorComponent(() => CodeEditor);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current);
    };
  }, []);

  return (
    <section
      className="flex h-full min-h-0 flex-col bg-card"
      aria-label="Code editor"
      data-tour="code"
    >
      <header className="flex h-8 shrink-0 items-center gap-1.5 border-b border-border/80 px-2">
        <Code2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
          Code
        </span>
        {onStartBlank ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            aria-label="Start from a blank file"
            title="New · Blank — clear the editor and start from scratch"
            onClick={onStartBlank}
          >
            <FilePlus className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        ) : null}
        <div className="flex-1" />

        <div className="flex items-center rounded-md border border-border/70">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-none text-muted-foreground"
            aria-label="Decrease editor font size"
            title="Decrease font size (Ctrl+-)"
            onClick={() => setFontSize(fontSize - 1)}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            className="min-w-8 px-0.5 text-center text-[10px] font-medium tabular-nums text-muted-foreground transition-colors hover:text-foreground"
            title="Reset font size (Ctrl+0)"
            onClick={() => setFontSize(DEFAULT_FONT_SIZE)}
          >
            {Math.round((fontSize / DEFAULT_FONT_SIZE) * 100)}%
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-none text-muted-foreground"
            aria-label="Increase editor font size"
            title="Increase font size (Ctrl+=)"
            onClick={() => setFontSize(fontSize + 1)}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground data-[pressed=true]:bg-accent"
          aria-pressed={showGuides}
          aria-label={showGuides ? "Hide indentation guides" : "Show indentation guides"}
          title="Toggle indentation guides"
          onClick={() => setShowGuides(!showGuides)}
        >
          <IndentDecrease className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground"
          aria-label="Copy code"
          title="Copy code"
          onClick={() => {
            void navigator.clipboard
              .writeText(code)
              .then(() => {
                setCopied(true);
                if (copyTimer.current) window.clearTimeout(copyTimer.current);
                copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
              })
              .catch(() => {
                // Clipboard unavailable (permissions/iframe) — ignore.
              });
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>

        {onLanguageChange && availableLanguages && availableLanguages.length > 1 ? (
          <Select value={language} onValueChange={(val) => onLanguageChange(val as SupportedLanguage)}>
            <SelectTrigger
              className="h-6 w-auto min-w-[70px] px-1.5 text-[10px]"
              aria-label="Switch language"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => {
                const info = getLanguageInfo(lang);
                return (
                  <SelectItem key={lang} value={lang} className="text-xs">
                    {info.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          <span
            className={`inline-flex items-center rounded-md border px-1.5 py-px text-[10px] font-medium ${languageInfo.color}`}
          >
            {languageInfo.label}
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        {EditorComponent ? (
          <EditorComponent
            code={code}
            isDark={isDark}
            fontSize={fontSize}
            showGuides={showGuides}
            language={language}
            traceLineEffect={setTraceLineEffect}
            onCodeChange={onCodeChange}
            onEditorViewReady={onEditorViewReady}
            onKeyDownCapture={(event: React.KeyboardEvent) => {
              if (!(event.ctrlKey || event.metaKey)) return;
              const key = event.key;
              if (key === "=" || key === "+") {
                event.preventDefault();
                setFontSize(fontSize + 1);
              } else if (key === "-" || key === "_") {
                event.preventDefault();
                setFontSize(fontSize - 1);
              } else if (key === "0") {
                event.preventDefault();
                setFontSize(DEFAULT_FONT_SIZE);
              }
            }}
            onWheelCapture={(event: React.WheelEvent) => {
              if (!(event.ctrlKey || event.metaKey)) return;
              event.preventDefault();
              setFontSize(fontSize + (event.deltaY < 0 ? 1 : -1));
            }}
          />
        ) : (
          /* Plain-text preview while the editor chunk loads (and what SSR
             paints) — same box, same monospace code, so LCP fires on the
             initial HTML and the editor swap doesn't move anything. When the
             file is blank, mirror the editor's onboarding hint. */
          <pre className="h-full overflow-auto whitespace-pre p-1 font-mono text-[13px] leading-[1.5] text-foreground">
            {code ||
              "Write your code here…\n\nCode reads the Input as a plain object — reference its fields like input.array, input.target, or input.matrix."}
          </pre>
        )}
      </div>

      <div className="max-h-[42%] shrink-0 space-y-3 overflow-auto border-t border-border/80 p-3">
        {translatedCode && hasOriginalLineMapping ? (           <TranslatedCodePanel translatedCode={translatedCode} translatedFromLabel={translatedFromLabel} />
        ) : null}

        <SavedCodeControls
          key={selectedTemplate.id}
          code={code}
          inputText={inputText}
          defaultTitle={selectedTemplate.name}
          defaultTopic={selectedTemplate.category}
          language={language}
          onLoad={onLoadSaved}
          onRequireSignIn={onRequireSignIn}
        />
      </div>
    </section>
  );
}

function TranslatedCodePanel({
  translatedCode,
  translatedFromLabel,
}: {
  translatedCode: string;
  translatedFromLabel: string | null;
}) {
  // Parse directives to build line mapping: translated line → original line
  const { codeLines, lineMap } = parseTranslatedCode(translatedCode);

  return (
    <details open className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
      <summary className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium">
        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          AI Translated
        </span>
        <span className="text-muted-foreground">
          {translatedFromLabel ?? "source"} → JavaScript
        </span>
      </summary>
      <div className="mt-3 space-y-2">
        <p className="text-xs text-muted-foreground">
          The trace ran this JavaScript translation. Step lines in the trace
          point back to your original source lines on the left.
        </p>
        <pre className="max-h-80 overflow-auto rounded-md bg-muted/40 p-3 font-mono text-[12px] leading-5">
          {codeLines.map((content, index) => (
            <div
              key={index}
              className="flex px-2 py-0.5 text-muted-foreground hover:bg-muted/60"
            >
              <span className="mr-2 inline-block w-6 select-none text-right text-[10px] text-muted-foreground/50">
                {index + 1}
              </span>
              {lineMap[index] != null && (
                <span
                  className="mr-2 inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                  title={`Maps to line ${lineMap[index]} in original code`}
                >
                  L{lineMap[index]}
                </span>
              )}
              <code className="flex-1 whitespace-pre">{content || " "}</code>
            </div>
          ))}
        </pre>
      </div>
    </details>
  );
}

/**
 * Parse translated code to extract executable lines and line-directive mapping.
 * Returns clean code lines (directives stripped) and a map from translated
 * line index to original source line number.
 */
function parseTranslatedCode(translatedCode: string): {
  codeLines: string[];
  lineMap: (number | undefined)[];
} {
  const raw = translatedCode.split("\n");
  const codeLines: string[] = [];
  const lineMap: (number | undefined)[] = [];

  let pendingOrigLine: number | undefined;

  for (const line of raw) {
    const directiveMatch = line.match(/^\/\/# line: (\d+)/);
    if (directiveMatch) {
      // Store the directive; it applies to the NEXT code line
      pendingOrigLine = parseInt(directiveMatch[1], 10);
    } else {
      codeLines.push(line);
      lineMap.push(pendingOrigLine);
      pendingOrigLine = undefined;
    }
  }

  return { codeLines, lineMap };
}
