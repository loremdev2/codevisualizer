"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Binary,
  BookOpen,
  Check,
  Code2,
  FolderOpen,
  GraduationCap,
  HelpCircle,
  Home,
  Link2,
  PenTool,
  Loader2,
  Map,
  MessageSquare,
  MoreHorizontal,
  Play,
  Plus,
  Share2,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthControls } from "@/components/auth-controls";
import { AdminLink } from "@/components/admin-link";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AiTranslationQuota } from "@/lib/ai-usage";
import { algorithmTemplates, BLANK_TEMPLATE_ID } from "@/lib/templates";
import { orderedPaths } from "@/lib/paths";
import { SHOW_WHITEBOARD_UI } from "@/lib/feature-flags";
import {
  AVAILABLE_LANGUAGE_OPTIONS,
  COMING_SOON_LANGUAGE_OPTIONS,
  getLanguageInfo,
  type SupportedLanguage,
} from "@/lib/detect-language";

type TopBarProps = {
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
  onLoadTemplate: () => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isRunning: boolean;
  isTranslating: boolean;
  onRun: () => void;
  stepsCount: number;
  tracesLeft: number | null;
  translationLabel: string | null;
  onStartTour?: () => void;
  /** Current editor code, offered as context in the feedback form. */
  code?: string;
  /** Current input JSON text, offered as context in the feedback form. */
  inputText?: string;
  /** 1-based step the user is viewing, offered as context in the feedback form. */
  stepIndex?: number;
  /** Total steps in the current run, offered as context in the feedback form. */
  stepCount?: number;
  /** Actual result of the last run, offered as context in the feedback form. */
  resultText?: string;
  /** Known expected answer, offered as context in the feedback form. */
  expectedText?: string;
  /** Overrides the preset-select label (e.g. a Top Interview 150 question title). */
  presetLabel?: string;
  /** Active variant for a Top Interview 150 question (drives the toggle). */
  externalVariant?: "brute" | "optimal";
  /** Called when the user flips the Brute/Optimal toggle. */
  onExternalVariantChange?: (variant: "brute" | "optimal") => void;
  /** Whether the current question has a distinct brute-force variant. */
  hasBruteVariant?: boolean;
  /**
   * Languages with an actual solution for the loaded question. When set,
   * other "available" languages are shown disabled so a question can never
   * be switched into a language that would silently break the run.
   */
  availableLanguages?: SupportedLanguage[];
  /**
   * Languages locked behind sign-in (guests see them disabled with a
   * "— sign in to use" suffix). The translate route enforces the same rule.
   */
  guestLockedLanguages?: SupportedLanguage[];
  /**
   * Signed-in user's AI translation budget (limits + usage), rendered as a
   * "N translations left" badge. Null for guests (no quota to show).
   */
  translationQuota?: AiTranslationQuota | null;
  /** Chrome-free mode for /embed iframes: no auth, no site nav, no feedback. */
  embed?: boolean;
  /** Copies a self-contained /visualizer#<payload> link for the live state. */
  onCopyShareLink?: () => void;
  /** Copies an iframe snippet pointing at /embed#<payload>. */
  onCopyEmbedCode?: () => void;
};

export function TopBar({
  selectedTemplateId,
  onTemplateChange,
  onLoadTemplate,
  language,
  onLanguageChange,
  isRunning,
  isTranslating,
  onRun,
  stepsCount,
  tracesLeft,
  translationLabel,
  onStartTour,
  code,
  inputText,
  stepIndex,
  stepCount,
  resultText,
  expectedText,
  presetLabel,
  externalVariant,
  onExternalVariantChange,
  hasBruteVariant,
  availableLanguages,
  guestLockedLanguages,
  translationQuota,
  embed = false,
  onCopyShareLink,
  onCopyEmbedCode,
}: TopBarProps) {
  const languageInfo = getLanguageInfo(language);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const moreItemClass =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  // Shared option lists so the desktop selects and the mobile panel stay in
  // sync. "New · Blank" sits above every preset group — it's not a real
  // template, just the entry point for typing your own code from scratch.
  // When an external question (Top 150 / NeetCode) is loaded, the
  // selectedTemplateId (e.g. "top150-1") doesn't exist as a SelectItem
  // in the built-in preset list. Prepend it so the dropdown shows it.
  const hasExternalPreset = presetLabel && !algorithmTemplates.some((t) => t.id === selectedTemplateId);

  const presetOptions = (
    <>
      {hasExternalPreset ? (
        <SelectGroup>
          <SelectItem value={selectedTemplateId} className="text-xs">
            {presetLabel}
          </SelectItem>
        </SelectGroup>
      ) : null}
      {hasExternalPreset ? <SelectSeparator /> : null}
      <SelectGroup>
        <SelectItem value={BLANK_TEMPLATE_ID} className="text-xs">
          <Plus className="mr-1.5 inline h-3 w-3" aria-hidden="true" />
          New · Blank
        </SelectItem>
      </SelectGroup>
      <SelectSeparator />
      {orderedPaths.map((path) => {
        if (path.comingSoon || path.templateIds.length === 0) return null;
        return (
          <SelectGroup key={path.id}>
            <SelectLabel className="text-[11px] font-medium text-muted-foreground">
              {path.title}
            </SelectLabel>
            {path.templateIds.map((templateId) => {
              const template = algorithmTemplates.find((candidate) => candidate.id === templateId);
              if (!template) return null;
              return (
                <SelectItem key={template.id} value={template.id} className="text-xs">
                  {template.language && template.language !== "javascript"
                    ? `[${template.language.toUpperCase()}] `
                    : ""}
                  {template.name} · {template.category}
                </SelectItem>
              );
            })}
          </SelectGroup>
        );
      })}
    </>
  );

  const languageOptions = (
    <>
      <SelectGroup>
        <SelectLabel className="text-[11px] font-medium text-muted-foreground">
          Available now
        </SelectLabel>
        {AVAILABLE_LANGUAGE_OPTIONS.map((option) => {
          const unavailable =
            availableLanguages !== undefined && !availableLanguages.includes(option.value);
          const signInRequired = guestLockedLanguages?.includes(option.value) ?? false;
          return (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={unavailable || signInRequired}
              className="text-xs"
            >
              {option.label}
              {unavailable
                ? " — not available for this question"
                : signInRequired
                  ? " — sign in to use"
                  : ""}
            </SelectItem>
          );
        })}
      </SelectGroup>
      <SelectSeparator />
      <SelectGroup>
        <SelectLabel className="text-[11px] font-medium text-muted-foreground">
          Coming soon
        </SelectLabel>
        {COMING_SOON_LANGUAGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectGroup>
    </>
  );

  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-1.5 border-b border-border/80 bg-card px-2 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:no-scrollbar sm:gap-2 sm:px-3">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-85"
        aria-label="DSA Lab home"
      >
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 text-white">
          <Binary className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <span className="hidden text-sm font-semibold tracking-tight md:inline">DSA Lab</span>
      </Link>

      <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />

      <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
        <SelectTrigger
          className="hidden h-7 w-44 text-xs sm:flex"
          aria-label="Algorithm preset"
          data-tour="presets"
        >
          <SelectValue placeholder="Preset" />
        </SelectTrigger>
        <SelectContent>{presetOptions}</SelectContent>
      </Select>
      {presetLabel && onExternalVariantChange ? (
        <div
          role="group"
          aria-label="Solution variant"
          className="flex h-7 shrink-0 items-center overflow-hidden rounded-md border border-border bg-muted/40 text-xs"
        >
          <button
            type="button"
            disabled={!hasBruteVariant}
            onClick={() => onExternalVariantChange("brute")}
            aria-pressed={externalVariant === "brute"}
            className={`h-full px-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              externalVariant === "brute"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={hasBruteVariant ? "Show the naive brute-force solution" : "No brute-force variant for this question"}
          >
            Brute
          </button>
          <span className="h-4 w-px bg-border" aria-hidden="true" />
          <button
            type="button"
            onClick={() => onExternalVariantChange("optimal")}
            aria-pressed={externalVariant === "optimal"}
            className={`h-full px-2 font-medium transition-colors ${
              externalVariant === "optimal"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Show the optimal solution"
          >
            Optimal
          </button>
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden h-7 px-2 text-xs sm:inline-flex"
        onClick={onLoadTemplate}
        data-tour="load"
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        Load
      </Button>

      <Select value={language} onValueChange={(val) => onLanguageChange(val as SupportedLanguage)}>
        <SelectTrigger
          className="hidden h-7 w-24 text-xs sm:flex sm:w-28"
          aria-label="Language"
          data-tour="language"
        >
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>{languageOptions}</SelectContent>
      </Select>

      <Badge
        variant="secondary"
        className="hidden gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 lg:inline-flex"
      >
        <Check className="h-3 w-3" aria-hidden="true" />
        {stepsCount} steps
      </Badge>

      {translationLabel ? (
        <span className="hidden truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400 lg:inline">
          {translationLabel}
        </span>
      ) : null}

      <div className="flex-1" />

      <Button
        type="button"
        onClick={onRun}
        disabled={isRunning || isTranslating}
        className="h-7 shrink-0 gap-1.5 px-3 text-xs"
        data-tour="run"
      >
        {isTranslating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {isTranslating ? "Translating" : isRunning ? "Tracing" : "Run"}
      </Button>

      {tracesLeft !== null ? (
        <Badge variant="outline" className="hidden h-6 text-[10px] md:inline-flex">
          {tracesLeft} free trace{tracesLeft === 1 ? "" : "s"}
        </Badge>
      ) : null}

      {translationQuota && translationQuota.hourlyLimit > 0 ? (
        <Badge
          variant="outline"
          className="hidden h-6 text-[10px] md:inline-flex"
          title={`AI translations: ${translationQuota.hourUsed}/${translationQuota.hourlyLimit} used this hour · ${translationQuota.dayUsed}/${translationQuota.dailyLimit} used today`}
        >
          {Math.max(
            0,
            Math.min(
              translationQuota.hourlyLimit - translationQuota.hourUsed,
              translationQuota.dailyLimit - translationQuota.dayUsed,
            ),
          )}{" "}
          translation{Math.max(0, Math.min(translationQuota.hourlyLimit - translationQuota.hourUsed, translationQuota.dailyLimit - translationQuota.dayUsed)) === 1 ? "" : "s"}{" "}
          left
        </Badge>
      ) : null}

      {onCopyShareLink && onCopyEmbedCode ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="hidden h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground lg:inline-flex"
              aria-label="Share this run"
              title="Share this run as a link or an embed"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel>Share this run</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onCopyShareLink()}>
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCopyEmbedCode()}>
              <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
              Copy embed code
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <p className="px-2.5 pb-1.5 text-[11px] leading-4 text-muted-foreground">
              Works without an account — anyone with the link opens this exact run.
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {!embed && onStartTour ? (
        <Button
          type="button"
          variant="ghost"
          className="hidden h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground lg:inline-flex"
          onClick={onStartTour}
          aria-label="Take the guided tour"
          title="Take the guided tour"
        >
          <Map className="h-4 w-4" aria-hidden="true" />
          Tour
        </Button>
      ) : null}

      {/* Mobile overflow menu: the secondary nav (Tour / Home / Guide /
          Collections / Feedback) lives behind this button below lg. */}
      <div className="relative lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          aria-label="More menu"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((value) => !value)}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
        {moreOpen ? (
          <>
            <div
              className="fixed inset-0 z-40"
              aria-hidden="true"
              onClick={() => setMoreOpen(false)}
            />
            <div className="fixed inset-x-0 top-12 z-50 border-b border-border/80 bg-card shadow-xl">
              <nav className="mx-auto max-w-2xl space-y-1 overflow-y-auto px-4 py-3">
                {/* Template picker + language live here on phones (the desktop
                    selects are hidden below sm to keep the bar a single row). */}
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Template
                  </span>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(id) => {
                      onTemplateChange(id);
                      setMoreOpen(false);
                    }}
                  >
                    <SelectTrigger className="h-7 w-44 text-xs" aria-label="Algorithm preset">
                      <SelectValue placeholder="Preset" />
                    </SelectTrigger>
                    <SelectContent>{presetOptions}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 pt-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Language
                  </span>
                  <Select
                    value={language}
                    onValueChange={(val) => {
                      onLanguageChange(val as SupportedLanguage);
                      setMoreOpen(false);
                    }}
                  >
                    <SelectTrigger className="h-7 w-28 text-xs" aria-label="Language">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>{languageOptions}</SelectContent>
                  </Select>
                </div>
                <div className="pt-1">
                  {onCopyShareLink && onCopyEmbedCode ? (
                    <>
                      <button
                        type="button"
                        className={moreItemClass}
                        onClick={() => {
                          setMoreOpen(false);
                          onCopyShareLink();
                        }}
                      >
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Copy link
                      </button>
                      <button
                        type="button"
                        className={moreItemClass}
                        onClick={() => {
                          setMoreOpen(false);
                          onCopyEmbedCode();
                        }}
                      >
                        <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Copy embed code
                      </button>
                    </>
                  ) : null}
                  {!embed && onStartTour ? (
                    <button
                      type="button"
                      className={moreItemClass}
                      onClick={() => {
                        setMoreOpen(false);
                        onStartTour();
                      }}
                    >
                      <Map className="h-3.5 w-3.5" aria-hidden="true" />
                      Tour
                    </button>
                  ) : null}
                  {!embed ? (
                    <>
                      <Link href="/" className={moreItemClass} onClick={() => setMoreOpen(false)}>
                        <Home className="h-3.5 w-3.5" aria-hidden="true" />
                        Home
                      </Link>
                      <Link href="/learn" className={moreItemClass} onClick={() => setMoreOpen(false)}>
                        <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                        Learn
                      </Link>
                      <Link href="/guide" className={moreItemClass} onClick={() => setMoreOpen(false)}>
                        <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Guide
                      </Link>
                      <Link
                        href="/collections"
                        className={moreItemClass}
                        onClick={() => setMoreOpen(false)}
                      >
                        <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        Collections
                      </Link>
                      {SHOW_WHITEBOARD_UI ? (
                        <Link
                          href="/whiteboard"
                          className={moreItemClass}
                          onClick={() => setMoreOpen(false)}
                        >
                          <PenTool className="h-3.5 w-3.5" aria-hidden="true" />
                          Whiteboard
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className={moreItemClass}
                        onClick={() => {
                          setMoreOpen(false);
                          setFeedbackOpen(true);
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        Feedback
                      </button>
                      <AdminLink
                        label="Admin"
                        onNavigate={() => setMoreOpen(false)}
                        className={moreItemClass}
                      />
                    </>
                  ) : null}
                </div>
              </nav>
            </div>
          </>
        ) : null}
      </div>
      {!embed ? (
        <>
          <Button asChild variant="ghost" className="hidden h-7 w-7 text-muted-foreground lg:inline-flex">
            <Link href="/" aria-label="Home">
              <Home className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="hidden h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground lg:inline-flex"
          >
            <Link href="/learn" aria-label="Learning paths">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Learn
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="hidden h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground lg:inline-flex"
          >
            <Link href="/guide" aria-label="Guide">
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Guide
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="hidden h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground lg:inline-flex"
          >
            <Link href="/collections" aria-label="Collections">
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Collections
            </Link>
          </Button>
          {SHOW_WHITEBOARD_UI ? (
            <Button
              asChild
              variant="ghost"
              className="hidden h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground lg:inline-flex"
            >
              <Link href="/whiteboard" aria-label="Whiteboard">
                <PenTool className="h-4 w-4" aria-hidden="true" />
                Whiteboard
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="hidden h-7 gap-1.5 px-2 text-xs font-medium text-muted-foreground lg:inline-flex"
            onClick={() => setFeedbackOpen(true)}
            aria-label="Send feedback"
            title="Send feedback"
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Feedback
          </Button>
          <AdminLink
            label="Admin"
            className="hidden h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:inline-flex"
          />

          <span className="h-5 w-px bg-border" aria-hidden="true" />
          <AuthControls />
          <ThemeToggle />
        </>
      ) : null}
      <span className="sr-only">{languageInfo.label}</span>

      {!embed ? (
        <FeedbackDialog
          open={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          algorithm={presetLabel ?? algorithmTemplates.find((template) => template.id === selectedTemplateId)?.name}
          language={languageInfo.label}
          code={code}
          inputText={inputText}
          stepIndex={stepIndex}
          stepCount={stepCount}
          resultText={resultText}
          expectedText={expectedText}
        />
      ) : null}
    </header>
  );
}
