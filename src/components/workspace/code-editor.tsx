"use client";

// This module owns every heavy CodeMirror import (the react wrapper, the
// editor core, and syntax highlighting) so the code panel can lazy-load it in
// a split chunk. Only a tiny @codemirror/state export stays in the initial
// bundle (see setTraceLineEffect in code-panel.tsx).

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, WheelEvent as ReactWheelEvent } from "react";
import CodeMirror from "@uiw/react-codemirror";
// Only JavaScript ships with the initial bundle; Python/Java/C++ extensions
// are loaded on demand (see useLanguageExtension) because the full language
// definitions are the largest chunk of the editor's code.
import { javascript } from "@codemirror/lang-javascript";
import {
  Decoration,
  DecorationSet,
  EditorView,
  placeholder,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";
import {
  RangeSetBuilder,
  StateField,
  type Extension,
  type StateEffectType,
  type Text,
} from "@codemirror/state";

import type { SupportedLanguage } from "@/lib/detect-language";

export type CodeEditorProps = {
  code: string;
  isDark: boolean;
  fontSize: number;
  showGuides: boolean;
  language: SupportedLanguage;
  /**
   * Effect used to highlight the active trace line. Defined by the caller so
   * the parent (dsa-visualizer) can dispatch it without importing this chunk.
   */
  traceLineEffect: StateEffectType<number | null>;
  onCodeChange: (value: string) => void;
  onEditorViewReady: (view: EditorView) => void;
  onKeyDownCapture: (event: ReactKeyboardEvent) => void;
  onWheelCapture: (event: ReactWheelEvent) => void;
};

// Highlights the current trace line inside the editor as the user steps.
function buildTraceLineField(effect: StateEffectType<number | null>) {
  return StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(decorations, transaction) {
      let next = decorations.map(transaction.changes);
      for (const change of transaction.effects) {
        if (change.is(effect)) {
          const lineNumber = change.value;
          if (lineNumber == null || lineNumber < 1 || lineNumber > transaction.state.doc.lines) {
            next = Decoration.none;
          } else {
            const line = transaction.state.doc.line(lineNumber);
            next = Decoration.set([
              Decoration.line({ class: "cm-trace-active-line" }).range(line.from),
            ]);
          }
        }
      }
      return next;
    },
    provide: (field) => EditorView.decorations.from(field),
  });
}

// Blend the editor into the panel; syntax token colors come from the theme prop.
const editorBlendTheme = EditorView.theme({
  "&": { backgroundColor: "transparent", color: "hsl(var(--foreground))" },
  "&.cm-focused": { outline: "none" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "hsl(var(--muted-foreground))",
    borderRight: "1px solid hsl(var(--border))",
  },
  // The blank-file hint (see blankFilePlaceholder): pre-wrap so the \n line
  // breaks render, muted so it clearly reads as a hint, not real code.
  ".cm-placeholder": {
    color: "hsl(var(--muted-foreground))",
    whiteSpace: "pre-wrap",
    lineHeight: "1.6",
    maxWidth: "100%",
  },
});

/**
 * Onboarding hint shown inside the editor while it's empty (the "New · Blank"
 * state). Only renders when the document has no content, so it disappears the
 * moment the user types. Explains the input contract: code reads the Input
 * JSON as a plain object referenced as input.<field>.
 */
const blankFilePlaceholder = placeholder(
  "Write your code here…\n\nCode reads the Input as a plain object — reference its fields like input.array, input.target, or input.matrix.",
);

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// The dominant indentation step across the document (gcd of all leading
// whitespace widths) — handles 2- and 4-space code, tabs, and mixed files.
function detectIndentUnit(doc: Text): number {
  let unit = 0;
  for (let lineNumber = 1; lineNumber <= Math.min(doc.lines, 400); lineNumber++) {
    const leading = /^[ \t]+/.exec(doc.line(lineNumber).text);
    if (!leading) continue;
    unit = gcd(unit, leading[0].length);
    if (unit === 1) break;
  }
  return unit > 0 ? unit : 2;
}

// Vertical guide at every indentation level of each visible line — a mark on
// the character at the guide column whose background draws a 1px line at its
// left edge, so it spans the full line height like VS Code's indent guides.
const indentGuideMark = Decoration.mark({ class: "cm-indent-guide" });

const indentGuidePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.build(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.geometryChanged) {
        this.decorations = this.build(update.view);
      }
    }

    build(view: EditorView) {
      const builder = new RangeSetBuilder<Decoration>();
      const unit = detectIndentUnit(view.state.doc);
      for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to; ) {
          const line = view.state.doc.lineAt(pos);
          const indent = /^[ \t]*/.exec(line.text)?.[0].length ?? 0;
          for (let col = unit; col <= indent && col < line.text.length; col += unit) {
            builder.add(line.from + col, line.from + col + 1, indentGuideMark);
          }
          pos = line.to + 1;
        }
      }
      return builder.finish();
    }
  },
  { decorations: (view) => view.decorations },
);

function getLanguageExtension(language: SupportedLanguage) {
  return language === "typescript" ? javascript({ typescript: true }) : javascript();
}

/**
 * Loads the syntax extension for a language on demand. JavaScript and
 * TypeScript are eager (they share the lang-javascript package); Python, Java,
 * and C++ are fetched in a split chunk only when first needed, then cached.
 */
function useLanguageExtension(language: SupportedLanguage): Extension | null {
  const [loaded, setLoaded] = useState<Partial<Record<SupportedLanguage, Extension | null>>>({});
  useEffect(() => {
    if (loaded[language] !== undefined) return;
    let cancelled = false;
    void (async () => {
      let next: Extension | null = null;
      switch (language) {
        case "python":
          next = (await import("@codemirror/lang-python")).python();
          break;
        case "java":
          next = (await import("@codemirror/lang-java")).java();
          break;
        case "cpp":
          next = (await import("@codemirror/lang-cpp")).cpp();
          break;
        default:
          break;
      }
      if (!cancelled) setLoaded((current) => ({ ...current, [language]: next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [language, loaded]);
  return loaded[language] ?? null;
}

export function CodeEditor({
  code,
  isDark,
  fontSize,
  showGuides,
  language,
  traceLineEffect,
  onCodeChange,
  onEditorViewReady,
  onKeyDownCapture,
  onWheelCapture,
}: CodeEditorProps) {
  // Stable extension instances so CodeMirror doesn't reconfigure every render.
  const extensions = useMemo(
    () => ({
      language,
      built: [buildTraceLineField(traceLineEffect), editorBlendTheme],
    }),
    [traceLineEffect, language],
  );
  // On-demand syntax highlighting for non-JavaScript languages.
  const languageExtension = useLanguageExtension(language);
  // Non-JS languages get their (lazily loaded) extension; JS/TS are eager.
  const activeExtension =
    language === "python" || language === "java" || language === "cpp"
      ? languageExtension
      : getLanguageExtension(language);

  return (
    <CodeMirror
      value={code}
      height="100%"
      style={{ fontSize: `${fontSize}px` }}
      theme={isDark ? "dark" : "light"}
      extensions={[
        ...extensions.built,
        blankFilePlaceholder,
        ...(activeExtension ? [activeExtension] : []),
        ...(showGuides ? [indentGuidePlugin] : []),
      ]}
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false,
      }}
      onKeyDownCapture={onKeyDownCapture}
      onWheelCapture={onWheelCapture}
      onCreateEditor={onEditorViewReady}
      onChange={onCodeChange}
    />
  );
}
