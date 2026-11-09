"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import type { EditorView } from "@codemirror/view";
import { Activity, Code2, Layers, Terminal } from "lucide-react";
import {
  Group,
  Panel,
  Separator,
  useGroupRef,
  usePanelRef,
  type Layout,
  type LayoutChangedMeta,
} from "react-resizable-panels";

import { CallStackPanel } from "@/components/workspace/call-stack-panel";
import { CodePanel, type SavedAlgorithm } from "@/components/workspace/code-panel";
import { IoStrip, type RunPhase } from "@/components/workspace/io-strip";
import type { InputExample } from "@/components/workspace/input-editor";
import { useCollapsiblePanel } from "@/components/workspace/use-collapsible-panel";
import { VariablesPanel } from "@/components/workspace/variables-panel";
import { VisualizationPanel } from "@/components/workspace/visualization-panel";
import type { AlgorithmTemplate, VisualStep } from "@/types/visualizer";
import type { SupportedLanguage } from "@/lib/detect-language";

const GROUP_IDS = {
  workspace: "dsa-lab-workspace",
  main: "dsa-lab-main",
  rail: "dsa-lab-rail",
  workspaceNarrow: "dsa-lab-workspace-narrow",
  mainNarrow: "dsa-lab-main-narrow",
  railNarrow: "dsa-lab-rail-narrow",
} as const;

const LAYOUT_STORAGE_PREFIX = "react-resizable-panels:";

function storageKey(id: string) {
  return `${LAYOUT_STORAGE_PREFIX}${id}`;
}

function readSavedLayout(id: string): Layout | undefined {
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Layout;
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function subscribeToMediaQuery(query: string) {
  return (onStoreChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onStoreChange);
    return () => media.removeEventListener("change", onStoreChange);
  };
}

function useMediaQuery(query: string) {
  // getServerSnapshot always returns false so SSR and the first client render
  // agree during hydration; the real value is read after mounting.
  return useSyncExternalStore(
    subscribeToMediaQuery(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

type ResizableWorkspaceProps = {
  // Trace state + playback
  steps: VisualStep[];
  currentIndex: number;
  isPlaying: boolean;
  onSeek: (index: number) => void;
  onTogglePlay: () => void;
  // Code panel
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
  // IO strip
  onInputChange: (value: string) => void;
  examples?: InputExample[];
  resultText: string;
  expectedText: string;
  onExpectedTextChange: (value: string) => void;
  consoleLines: string[];
  runDurationMs: number | null;
  error: string;
  /** Current stage of the run pipeline, shown as a stepper in the result tab. */
  runPhase: RunPhase;
  /** True for languages traced via AI translation (Java/C++). */
  needsTranslation: boolean;
  studyNotes: string | null;
  /** Unabridged notes for the Download button (null before a run). */
  fullStudyNotes: string | null;
  // Trace reporting
  /** Whether the "Wrong trace?" button should be shown (a run has completed). */
  reportable: boolean;
  /** Stores the last run as a bad-trace report; resolves true when saved. */
  onReportTrace: () => Promise<boolean>;
  // Visualization comparison
  compareMode: boolean;
  onToggleCompare: () => void;
  compareLabel: string;
  compareSteps: VisualStep[];
  /**
   * Imperative handle for the mobile tab bar — lets the visualizer switch to
   * the Visualization tab when the user presses Run on a phone.
   */
  mobileTabApiRef?: React.MutableRefObject<{ showViz: () => void } | null>;
  /** Generate and download a PDF report with visualization screenshot. */
  onDownloadPdf: () => void;
  /** Whether a PDF is currently being generated. */
  generatingPdf: boolean;
  /** Switch the code to a different language. */
  onLanguageChange?: (lang: SupportedLanguage) => void;
  /** Languages with pre-written code for the current template. */
  availableLanguages?: SupportedLanguage[];
};

export function ResizableWorkspace({
  steps,
  currentIndex,
  isPlaying,
  onSeek,
  onTogglePlay,
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
  onInputChange,
  examples,
  resultText,
  expectedText,
  onExpectedTextChange,
  consoleLines,
  runDurationMs,
  error,
  runPhase,
  needsTranslation,
  studyNotes,
  fullStudyNotes,
  compareMode,
  onToggleCompare,
  compareLabel,
  compareSteps,
  reportable,
  onReportTrace,
  mobileTabApiRef,
  onDownloadPdf,
  generatingPdf,
  onLanguageChange,
  availableLanguages,
}: ResizableWorkspaceProps) {
  const variablesRef = usePanelRef();
  const callStackRef = usePanelRef();
  const ioRef = usePanelRef();

  const variables = useCollapsiblePanel("variables", variablesRef);
  const callStack = useCollapsiblePanel("callstack", callStackRef);
  const io = useCollapsiblePanel("io", ioRef);

  // Saved layouts are restored imperatively after mount (see PersistedGroup)
  // instead of via `defaultLayout`, so the server render, the hydration render,
  // and the first client render all use the same default sizes — no hydration
  // mismatch and no panel-size jump on first paint.

  // Mobile-only collapse state: on phones the tabs render panels as plain
  // sections (no resizable-panels context), so each keeps its own local
  // collapse flag instead of the shared hook.
  const [mobileVariablesCollapsed, setMobileVariablesCollapsed] = useState(false);
  const [mobileCallStackCollapsed, setMobileCallStackCollapsed] = useState(false);
  const [mobileIoCollapsed, setMobileIoCollapsed] = useState(false);

  const persistLayout = useCallback(
    (id: string) => (_layout: Layout, _meta: LayoutChangedMeta) => {
      try {
        window.localStorage.setItem(storageKey(id), JSON.stringify(_layout));
      } catch {
        // Storage unavailable — the layout just won't persist.
      }
    },
    [],
  );

  const isWide = useMediaQuery("(min-width: 1024px)");
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Mobile tab bar lives here so it can be driven from outside (e.g. switch
  // to the Visualization tab when Run is pressed) while MobileWorkspace stays
  // a controlled component.
  const [mobileTab, setMobileTab] = useState<MobileTab>("code");
  useEffect(() => {
    if (!mobileTabApiRef) return undefined;
    mobileTabApiRef.current = isMobile ? { showViz: () => setMobileTab("viz") } : null;
    return () => {
      mobileTabApiRef.current = null;
    };
  }, [mobileTabApiRef, isMobile]);

  const currentStep = steps[currentIndex];
  const isLastStep = currentIndex === steps.length - 1;
  const mainLabel = selectedTemplate.name;

  // Shared panel contents, rendered inside either a resizable Panel (desktop /
  // tablet) or a full-size section (mobile tabs). Each panel fills its
  // container and scrolls internally, so both wrappers just supply height.
  const codePanelContent = (
    <CodePanel
      code={code}
      inputText={inputText}
      onCodeChange={onCodeChange}
      onEditorViewReady={onEditorViewReady}
      isDark={isDark}
      language={language}
      codeLines={codeLines}
      translatedCode={translatedCode}
      hasOriginalLineMapping={hasOriginalLineMapping}
      translatedFromLabel={translatedFromLabel}
      selectedTemplate={selectedTemplate}
      onLoadSaved={onLoadSaved}
      onRequireSignIn={onRequireSignIn}
      onStartBlank={onStartBlank}
      onLanguageChange={onLanguageChange}
      availableLanguages={availableLanguages}
    />
  );

  const visualizationPanelContent = (
    <VisualizationPanel
      step={currentStep}
      previousStep={steps[currentIndex - 1]}
      stepIndex={currentIndex}
      totalSteps={steps.length}
      isPlaying={isPlaying}
      mainLabel={mainLabel}
      steps={steps}
      currentIndex={currentIndex}
      runPhase={runPhase}
      needsTranslation={needsTranslation}
      language={language}
      compareMode={compareMode}
      onToggleCompare={onToggleCompare}
      compareLabel={compareLabel}
      compareSteps={compareSteps}
    />
  );

  const variablesPanel = (
    <Panel
      id="variables"
      panelRef={variablesRef}
      collapsible
      collapsedSize={34}
      minSize="18%"
      defaultSize="56%"
      onResize={variables.onResize}
    >
      <VariablesPanel
        step={currentStep}
        previousStep={steps[currentIndex - 1]}
        result={steps[steps.length - 1]?.result}
        isLastStep={isLastStep}
        collapsed={variables.collapsed}
        onToggleCollapsed={variables.toggle}
      />
    </Panel>
  );

  const callStackPanel = (
    <Panel
      id="callstack"
      panelRef={callStackRef}
      collapsible
      collapsedSize={34}
      minSize="18%"
      defaultSize="44%"
      onResize={callStack.onResize}
    >
      <CallStackPanel
        steps={steps}
        currentIndex={currentIndex}
        collapsed={callStack.collapsed}
        onToggleCollapsed={callStack.toggle}
      />
    </Panel>
  );

  const ioPanelContent = (
    <IoStrip
      inputText={inputText}
      onInputChange={onInputChange}
      examples={examples}
      resultText={resultText}
      consoleLines={consoleLines}
      stepCount={steps.length}
      durationMs={runDurationMs}
      error={error}
      runPhase={runPhase}
      needsTranslation={needsTranslation}
      collapsed={io.collapsed}
      onToggleCollapsed={io.toggle}
      studyNotes={studyNotes}
      fullStudyNotes={fullStudyNotes}
      expectedText={expectedText}
      onExpectedTextChange={onExpectedTextChange}
      reportable={reportable}
      onReportTrace={onReportTrace}
      onDownloadPdf={onDownloadPdf}
      generatingPdf={generatingPdf}
    />
  );

  const ioPanel = (
    <Panel
      id="io"
      panelRef={ioRef}
      collapsible
      collapsedSize={34}
      minSize="8%"
      defaultSize="22%"
      onResize={io.onResize}
    >
      {ioPanelContent}
    </Panel>
  );

  return (
    <div className="min-h-0 flex-1">
      {isWide ? (
        <PersistedGroup
          persistId={GROUP_IDS.workspace}
          id={GROUP_IDS.workspace}
          orientation="vertical"
          onLayoutChanged={persistLayout(GROUP_IDS.workspace)}
        >
          <Panel id="main" defaultSize="78%" minSize="45%">
            <PersistedGroup
              persistId={GROUP_IDS.main}
              id={GROUP_IDS.main}
              orientation="horizontal"
              onLayoutChanged={persistLayout(GROUP_IDS.main)}
            >
              <Panel id="code" defaultSize="26%" minSize="15%">
                {codePanelContent}
              </Panel>
              <Separator className="w-[3px]" />
              <Panel id="viz" defaultSize="50%" minSize="32%">
                {visualizationPanelContent}
              </Panel>
              <Separator className="w-[3px]" />
              <Panel id="rail" defaultSize="24%" minSize="18%">
                <PersistedGroup
                  persistId={GROUP_IDS.rail}
                  id={GROUP_IDS.rail}
                  orientation="vertical"
                  onLayoutChanged={persistLayout(GROUP_IDS.rail)}
                >
                  {variablesPanel}
                  <Separator className="h-[3px]" />
                  {callStackPanel}
                </PersistedGroup>
              </Panel>
            </PersistedGroup>
          </Panel>
          <Separator className="h-[3px]" />
          {ioPanel}
        </PersistedGroup>
      ) : isMobile ? (
        <MobileWorkspace
          tab={mobileTab}
          onTabChange={setMobileTab}
          codePanel={codePanelContent}
          visualizationPanel={visualizationPanelContent}
          variablesPanel={
            <VariablesPanel
              step={currentStep}
              previousStep={steps[currentIndex - 1]}
              result={steps[steps.length - 1]?.result}
              isLastStep={isLastStep}
              collapsed={mobileVariablesCollapsed}
              onToggleCollapsed={() => setMobileVariablesCollapsed((value) => !value)}
            />
          }
          callStackPanel={
            <CallStackPanel
              steps={steps}
              currentIndex={currentIndex}
              collapsed={mobileCallStackCollapsed}
              onToggleCollapsed={() => setMobileCallStackCollapsed((value) => !value)}
            />
          }
          ioPanel={
            <IoStrip
              inputText={inputText}
              onInputChange={onInputChange}
              examples={examples}
              resultText={resultText}
              consoleLines={consoleLines}
              stepCount={steps.length}
              durationMs={runDurationMs}
              error={error}
              runPhase={runPhase}
              needsTranslation={needsTranslation}
              collapsed={mobileIoCollapsed}
              onToggleCollapsed={() => setMobileIoCollapsed((value) => !value)}
              studyNotes={studyNotes}
              fullStudyNotes={fullStudyNotes}
              expectedText={expectedText}
              onExpectedTextChange={onExpectedTextChange}
              reportable={reportable}
              onReportTrace={onReportTrace}
              onDownloadPdf={onDownloadPdf}
              generatingPdf={generatingPdf}
            />
          }
        />
      ) : (
        <PersistedGroup
          persistId={GROUP_IDS.workspaceNarrow}
          id={GROUP_IDS.workspaceNarrow}
          orientation="vertical"
          onLayoutChanged={persistLayout(GROUP_IDS.workspaceNarrow)}
        >
          <Panel id="main" defaultSize="58%" minSize="40%">
            <PersistedGroup
              persistId={GROUP_IDS.mainNarrow}
              id={GROUP_IDS.mainNarrow}
              orientation="horizontal"
              onLayoutChanged={persistLayout(GROUP_IDS.mainNarrow)}
            >
              <Panel id="code" defaultSize="40%" minSize="18%">
                {codePanelContent}
              </Panel>
              <Separator className="w-[3px]" />
              <Panel id="viz" defaultSize="60%" minSize="30%">
                {visualizationPanelContent}
              </Panel>
            </PersistedGroup>
          </Panel>
          <Separator className="h-[3px]" />
          <Panel id="rail" defaultSize="26%" minSize="16%">
            <PersistedGroup
              persistId={GROUP_IDS.railNarrow}
              id={GROUP_IDS.railNarrow}
              orientation="horizontal"
              onLayoutChanged={persistLayout(GROUP_IDS.railNarrow)}
            >
              {variablesPanel}
              <Separator className="w-[3px]" />
              {callStackPanel}
            </PersistedGroup>
          </Panel>
          <Separator className="h-[3px]" />
          {ioPanel}
        </PersistedGroup>
      )}
    </div>
  );
}

/**
 * A Group that restores its persisted layout (localStorage) after mount via
 * the imperative API instead of the `defaultLayout` prop. Keeps the server
 * render and the first client render identical (no hydration mismatch / CLS)
 * while still restoring the user's saved panel sizes one frame later.
 */
function PersistedGroup({ persistId, ...props }: ComponentProps<typeof Group> & { persistId: string }) {
  const ref = useGroupRef();
  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      const saved = readSavedLayout(persistId);
      if (saved && ref.current) ref.current.setLayout(saved);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [persistId, ref]);
  return <Group {...props} groupRef={ref} />;
}

// ---------------------------------------------------------------------------
// Mobile (<768px) layout: one section at a time behind a tab bar, so the
// code editor and visualization each get the full width instead of a cramped
// side-by-side split. The State tab stacks Variables and Call Stack.
// ---------------------------------------------------------------------------

const MOBILE_TABS = [
  { id: "code", label: "Code", icon: Code2 },
  { id: "viz", label: "Visual", icon: Activity },
  { id: "state", label: "State", icon: Layers },
  { id: "io", label: "I/O", icon: Terminal },
] as const;

export type MobileTab = (typeof MOBILE_TABS)[number]["id"];

type MobileWorkspaceProps = {
  tab: MobileTab;
  onTabChange: React.Dispatch<React.SetStateAction<MobileTab>>;
  codePanel: ReactNode;
  visualizationPanel: ReactNode;
  variablesPanel: ReactNode;
  callStackPanel: ReactNode;
  ioPanel: ReactNode;
};

/** Swipe threshold (px) and how much the horizontal travel must dominate the vertical. */
const SWIPE_MIN_DISTANCE = 48;
const SWIPE_MAX_VERTICAL_RATIO = 1.2;

/** True when the touch began on something that handles its own gestures
 * (CodeMirror editor, text fields) so a swipe there shouldn't switch tabs. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return target.closest(".cm-editor") !== null;
}

function MobileWorkspace({
  tab,
  onTabChange,
  codePanel,
  visualizationPanel,
  variablesPanel,
  callStackPanel,
  ioPanel,
}: MobileWorkspaceProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const switchTab = useCallback(
    (direction: 1 | -1) => {
      onTabChange((current) => {
        const index = MOBILE_TABS.findIndex(({ id }) => id === current);
        const next = (index + direction + MOBILE_TABS.length) % MOBILE_TABS.length;
        return MOBILE_TABS[next].id;
      });
    },
    [onTabChange],
  );

  const handleTouchStart = useCallback((event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1 || isEditableTarget(event.target)) {
      touchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      // A swipe is horizontal, fast enough (>= 48px), and not a diagonal scroll.
      if (Math.abs(deltaX) < SWIPE_MIN_DISTANCE || Math.abs(deltaX) <= Math.abs(deltaY) * SWIPE_MAX_VERTICAL_RATIO) {
        return;
      }
      // Left swipe → next tab, right swipe → previous, wrapping around.
      switchTab(deltaX < 0 ? 1 : -1);
    },
    [switchTab],
  );

  const handleTouchCancel = useCallback(() => {
    touchStart.current = null;
  }, []);

  const tabClass = (active: boolean) =>
    `inline-flex h-full items-center gap-1.5 border-b-2 px-3 text-xs font-medium transition-colors ${
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        role="tablist"
        aria-label="Workspace sections"
        className="flex h-9 shrink-0 items-stretch gap-0.5 overflow-x-auto border-b border-border/80 bg-card px-1.5"
      >
        {MOBILE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => onTabChange(id)}
            className={tabClass(tab === id)}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div
        className="min-h-0 flex-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {tab === "code" ? (
          codePanel
        ) : tab === "viz" ? (
          visualizationPanel
        ) : tab === "state" ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1">{variablesPanel}</div>
            <div className="h-px shrink-0 bg-border/80" aria-hidden="true" />
            <div className="min-h-0 flex-1">{callStackPanel}</div>
          </div>
        ) : (
          ioPanel
        )}
      </div>
    </div>
  );
}
