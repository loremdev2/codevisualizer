"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  Check,
  Clock,
  Code2,
  FolderOpen,
  GripVertical,
  HelpCircle,
  Home,
  LayoutGrid,
  List,
  Play,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { AuthControls } from "@/components/auth-controls";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { detectLanguage, getLanguageInfo } from "@/lib/detect-language";
import { relativeTime } from "@/lib/format";
import { topicMeta } from "@/lib/topic-meta";
import { cn } from "@/lib/utils";
import { TAG_PALETTE, type SavedAlgorithm } from "@/lib/collections-types";
import { useCollections } from "@/lib/use-collections";

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function TopicPill({ topic }: { topic: string }) {
  const meta = topicMeta(topic);
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {topic}
    </span>
  );
}

function TopicSectionHeader({
  topic,
  items,
  totalInTopic,
  selectedIds,
  onSelectAll,
}: {
  topic: string;
  items: SavedAlgorithm[];
  totalInTopic: number;
  selectedIds: Set<string>;
  onSelectAll: () => void;
}) {
  const meta = topicMeta(topic);
  const Icon = meta.icon;
  const allSelected = items.every((item) => selectedIds.has(item.id)) && items.length > 0;
  const someSelected = items.some((item) => selectedIds.has(item.id));

  return (
    <div className="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={allSelected}
        aria-label={`Select all ${topic} algorithms`}
        onClick={onSelectAll}
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
          allSelected
            ? "border-primary bg-primary text-primary-foreground"
            : someSelected
              ? "border-primary/60 bg-primary/20 text-primary"
              : "border-border bg-muted/40 hover:border-primary/60",
        )}
      >
        {allSelected ? (
          <Check className="h-3 w-3" />
        ) : someSelected ? (
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        ) : null}
      </button>
      <span className={`grid h-6 w-6 place-items-center rounded-lg bg-muted sm:h-7 sm:w-7 ${meta.text}`}>
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </span>
      <h2 className="text-sm font-semibold sm:text-base">{topic}</h2>
      <span className="rounded-full bg-muted px-1.5 py-px text-[10px] text-muted-foreground sm:px-2 sm:text-[11px]">
        {items.length}
        {items.length < totalInTopic ? ` of ${totalInTopic}` : ""}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function AlgorithmCard({
  algo,
  topic,
  isSelected,
  algoTags,
  isEditingTags,
  deletingId,
  draggedId,
  onSelect,
  onDelete,
  onRun,
  onToggleTag,
  onEditTag,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  algo: SavedAlgorithm;
  topic: string;
  isSelected: boolean;
  algoTags: string[];
  isEditingTags: boolean;
  deletingId: string | null;
  draggedId: string | null;
  onSelect: () => void;
  onDelete: () => void;
  onRun: () => void;
  onToggleTag: (tag: string) => void;
  onEditTag: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const meta = topicMeta(topic);
  const langInfo = getLanguageInfo(
    (algo.language as Parameters<typeof getLanguageInfo>[0]) || detectLanguage(algo.code).language,
  );

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex flex-col justify-between transition-all",
        draggedId === algo.id && "opacity-50",
        isSelected
          ? "border-primary/60 ring-1 ring-primary/30"
          : `${meta.ring} ${meta.ring.includes("border-primary") ? "hover:border-primary/50" : ""}`,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1">
            <span className="mt-1 cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
              <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <button
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Select ${algo.title}`}
              onClick={onSelect}
              className={cn(
                "mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md border transition-colors sm:h-5 sm:w-5",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/40 hover:border-primary/60",
              )}
            >
              {isSelected ? <Check className="h-3 w-3" /> : null}
            </button>
          </div>
          <CardTitle className="truncate text-base font-semibold sm:text-lg">{algo.title}</CardTitle>
          <Badge variant="secondary" className={`shrink-0 ${langInfo.color} border-0`}>
            {langInfo.label}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {relativeTime(algo.updated_at)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2.5 p-3 pb-3 sm:space-y-3 sm:p-4 sm:pb-4">
        <div className="rounded-md bg-muted p-2 text-[11px] font-mono sm:p-3 sm:text-xs">
          <div className="line-clamp-3 whitespace-pre-wrap text-muted-foreground sm:line-clamp-4">
            {algo.code}
          </div>
        </div>
        {algo.input_data ? (
          <div className="truncate text-[11px] text-muted-foreground">
            Input:{" "}
            <code className="font-mono">{JSON.stringify(algo.input_data)}</code>
          </div>
        ) : null}
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1">
          {algoTags.map((tag) => {
            const palette = TAG_PALETTE.find((p) => p.label === tag);
            return (
              <span
                key={tag}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  palette?.color ?? "border-border bg-muted text-muted-foreground",
                )}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className="ml-0.5 rounded-full hover:bg-foreground/10"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={onEditTag}
            className="grid h-5 w-5 place-items-center rounded-full border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            aria-label="Add tag"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
        {/* Tag picker dropdown */}
        {isEditingTags ? (
          <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-2 shadow-sm">
            {TAG_PALETTE.map((palette) => {
              const active = algoTags.includes(palette.label);
              return (
                <button
                  key={palette.label}
                  type="button"
                  onClick={() => onToggleTag(palette.label)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                    active ? palette.color : "border-border bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active ? <Check className="h-2.5 w-2.5" /> : <Tag className="h-2.5 w-2.5" />}
                  {palette.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </CardContent>

      <div className="flex items-center justify-between rounded-b-xl border-t bg-muted/20 px-3 py-2 sm:px-3 sm:py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-9 sm:w-9"
          disabled={deletingId === algo.id}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-8 gap-1 px-2.5 text-[11px] sm:h-9 sm:px-3 sm:text-sm"
          onClick={onRun}
        >
          <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          <span className="hidden sm:inline">Run Visualizer</span>
          <span className="sm:hidden">Run</span>
        </Button>
      </div>
    </Card>
  );
}

function AlgorithmListItem({
  algo,
  topic,
  isSelected,
  algoTags,
  deletingId,
  draggedId,
  onSelect,
  onDelete,
  onRun,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  algo: SavedAlgorithm;
  topic: string;
  isSelected: boolean;
  algoTags: string[];
  deletingId: string | null;
  draggedId: string | null;
  onSelect: () => void;
  onDelete: () => void;
  onRun: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}) {
  const langInfo = getLanguageInfo(
    (algo.language as Parameters<typeof getLanguageInfo>[0]) || detectLanguage(algo.code).language,
  );

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 transition-colors sm:gap-3 sm:px-4 sm:py-3",
        draggedId === algo.id && "opacity-50",
        isSelected ? "bg-primary/5" : "hover:bg-muted/40",
      )}
    >
      <span className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground">
        <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </span>
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        aria-label={`Select ${algo.title}`}
        onClick={onSelect}
        className={cn(
          "grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md border transition-colors sm:h-5 sm:w-5",
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-muted/40 hover:border-primary/60",
        )}
      >
        {isSelected ? <Check className="h-3 w-3" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="truncate text-[13px] font-medium sm:text-sm">{algo.title}</span>
          <Badge variant="secondary" className={`hidden shrink-0 sm:inline-flex text-[10px] ${langInfo.color} border-0`}>
            {langInfo.label}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground sm:gap-2 sm:text-[11px]">
          <Clock className="h-3 w-3" />
          {relativeTime(algo.updated_at)}
          <Badge variant="secondary" className={`inline-flex sm:hidden text-[9px] ${langInfo.color} border-0`}>
            {langInfo.label}
          </Badge>
          {algoTags.length > 0 ? (
            <span className="hidden items-center gap-1 sm:flex">
              {algoTags.map((tag) => {
                const palette = TAG_PALETTE.find((p) => p.label === tag);
                return (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-medium",
                      palette?.color ?? "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {tag}
                  </span>
                );
              })}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={deletingId === algo.id}
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px]"
          onClick={onRun}
        >
          <Play className="h-3 w-3" />
          Run
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function CollectionsScreen() {
  const router = useRouter();
  const c = useCollections();

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation header */}
        <header className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="inline-flex items-center gap-2 hover:opacity-85">
                <Badge variant="secondary" className="hidden sm:inline-flex">DSA Lab</Badge>
                <h1 className="text-xl font-medium tracking-normal sm:text-2xl lg:text-3xl">My Collections</h1>
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Your saved algorithms, organized by topic — ready to revisit anytime.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/guide">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Guide</span>
              </Link>
            </Button>
            <Button asChild variant="default" size="sm" className="gap-1.5">
              <Link href="/visualizer">
                <Code2 className="h-4 w-4" />
                <span className="hidden md:inline">Open Visualizer</span>
                <span className="md:hidden">Visualizer</span>
              </Link>
            </Button>
            <AuthControls />
            <ThemeToggle />
          </div>
        </header>

        {/* Not logged in */}
        {!c.user && !c.loading ? (
          <section className="relative overflow-hidden rounded-xl border bg-card p-6 text-center sm:p-8 lg:p-12">
            <div className="mx-auto max-w-md space-y-3 sm:space-y-4">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary sm:h-14 sm:w-14">
                <FolderOpen className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h2 className="text-xl font-medium sm:text-2xl">Sign in to view your collections</h2>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Keep your practice algorithms organized by topic and access them from any device.
              </p>
              <div className="pt-1 sm:pt-2">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/login">
                    Sign in with Google
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* Logged in */}
        {c.user ? (
          <>
            {/* Stats strip */}
            <section className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border bg-card px-2.5 py-2 sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  Saved
                </p>
                <p className="mt-0.5 text-lg font-semibold sm:text-xl">{c.stats.total}</p>
              </div>
              <div className="rounded-xl border bg-card px-2.5 py-2 sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">Topics</p>
                <p className="mt-0.5 text-lg font-semibold sm:text-xl">{c.stats.topics}</p>
              </div>
              <div className="rounded-xl border bg-card px-2.5 py-2 sm:px-4 sm:py-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  Last saved
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted-foreground sm:text-sm">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {c.stats.lastSaved ? relativeTime(c.stats.lastSaved) : "—"}
                </p>
              </div>
            </section>

            {/* Search + topic chips + sort + new */}
            <section className="space-y-2.5 sm:space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search algorithms…"
                    value={c.searchQuery}
                    onChange={(e) => c.setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-sm sm:h-10"
                  />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto sm:gap-2">
                  <Select value={c.selectedLanguage} onValueChange={c.setSelectedLanguage}>
                    <SelectTrigger className="h-9 w-[130px] shrink-0 text-xs sm:h-10 sm:w-[160px] sm:text-sm">
                      <Code2 className="mr-1 h-3.5 w-3.5" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All languages</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={c.sortBy} onValueChange={(v) => c.setSortBy(v as "recent" | "title" | "topic")}>
                    <SelectTrigger className="h-9 w-[140px] shrink-0 text-xs sm:h-10 sm:w-[170px] sm:text-sm">
                      <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently updated</SelectItem>
                      <SelectItem value="title">Title A–Z</SelectItem>
                      <SelectItem value="topic">Topic A–Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex shrink-0 items-center rounded-md border bg-muted/40 p-0.5">
                    <button
                      type="button"
                      aria-label="Card view"
                      onClick={() => c.setViewMode("card")}
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-md transition-colors",
                        c.viewMode === "card" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="List view"
                      onClick={() => c.setViewMode("list")}
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-md transition-colors",
                        c.viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Button asChild size="sm" className="h-9 shrink-0 gap-1.5 sm:h-10">
                    <Link href="/visualizer">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">New Visualization</span>
                      <span className="sm:hidden">New</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Topic chips */}
              {c.topics.length > 0 ? (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2 sm:pb-0">
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60 sm:text-[11px]">Topics:</span>
                  <button
                    type="button"
                    onClick={() => c.setSelectedTopic("All")}
                    className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                      c.selectedTopic === "All"
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All · {c.algorithms.length}
                  </button>
                  {c.topics.map(([topic, count]) => {
                    const meta = topicMeta(topic);
                    const Icon = meta.icon;
                    const active = c.selectedTopic === topic;
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => c.setSelectedTopic(active ? "All" : topic)}
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-[12px]",
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Icon className={`h-3.5 w-3.5 ${active ? meta.text : "text-muted-foreground"}`} />
                        {topic}
                        <span className="text-[10px] text-muted-foreground/70 sm:text-[10.5px]">{count}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {/* Tag filter chips */}
              {c.allTags.length > 0 ? (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2 sm:pb-0">
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground/60 sm:text-[11px]">Tags:</span>
                  {c.allTags.map((tag) => {
                    const palette = TAG_PALETTE.find((p) => p.label === tag);
                    const active = c.selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => c.setSelectedTag(active ? null : tag)}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : palette?.color ?? "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>

            {/* Loading skeleton */}
            {c.loading ? (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-lg border bg-card/50 p-4 sm:h-48 sm:p-5" />
                ))}
              </div>
            ) : null}

            {/* Empty collections */}
            {!c.loading && c.algorithms.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card/30 p-8 text-center sm:p-12">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
                <h3 className="mt-3 text-base font-medium sm:mt-4 sm:text-lg">No saved algorithms yet</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Open the visualizer, write or paste your code, and click &quot;Save code&quot; — it will
                  appear here grouped by topic.
                </p>
                <Button asChild className="mt-4 sm:mt-6">
                  <Link href="/visualizer">Start Visualizing Code</Link>
                </Button>
              </div>
            ) : null}

            {/* No match */}
            {!c.loading && c.algorithms.length > 0 && c.filtered.length === 0 ? (
              <div className="rounded-xl border bg-card/30 p-6 text-center sm:p-8">
                <Search className="mx-auto h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                  Nothing matches your current search or topic filter.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={c.clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : null}

            {/* Topic-grouped sections */}
            {!c.loading && c.filtered.length > 0 ? (
              <div className="space-y-8">
                {c.sections.map(([topic, items]) => {
                  const totalInTopic = c.topics.find(([t]) => t === topic)?.[1] ?? items.length;
                  return (
                    <section key={topic} aria-label={`${topic} collection`}>
                      <TopicSectionHeader
                        topic={topic}
                        items={items}
                        totalInTopic={totalInTopic}
                        selectedIds={c.selectedIds}
                        onSelectAll={() => {
                          const topicIds = items.map((item) => item.id);
                          const allSelected = topicIds.every((id) => c.selectedIds.has(id));
                          c.setSelectedIds((prev) => {
                            const next = new Set(prev);
                            for (const id of topicIds) {
                              if (allSelected) next.delete(id);
                              else next.add(id);
                            }
                            return next;
                          });
                        }}
                      />

                      {/* Card view */}
                      {c.viewMode === "card" ? (
                        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {items.map((algo) => (
                            <AlgorithmCard
                              key={algo.id}
                              algo={algo}
                              topic={topic}
                              isSelected={c.selectedIds.has(algo.id)}
                              algoTags={c.tags[algo.id] ?? []}
                              isEditingTags={c.editingTagId === algo.id}
                              deletingId={c.deletingId}
                              draggedId={c.draggedId}
                              onSelect={() => c.toggleSelect(algo.id)}
                              onDelete={() => c.setDeleteTarget(algo)}
                              onRun={() => router.push(`/visualizer?savedId=${algo.id}`)}
                              onToggleTag={(tag) => c.toggleTag(algo.id, tag)}
                              onEditTag={() => c.setEditingTagId(c.editingTagId === algo.id ? null : algo.id)}
                              onDragStart={() => c.handleDragStart(algo.id, topic)}
                              onDragOver={c.handleDragOver}
                              onDrop={() => c.handleDrop(algo.id, topic)}
                            />
                          ))}
                        </div>
                      ) : (
                        /* List view */
                        <div className="divide-y divide-border/60 rounded-xl border bg-card">
                          {items.map((algo) => (
                            <AlgorithmListItem
                              key={algo.id}
                              algo={algo}
                              topic={topic}
                              isSelected={c.selectedIds.has(algo.id)}
                              algoTags={c.tags[algo.id] ?? []}
                              deletingId={c.deletingId}
                              draggedId={c.draggedId}
                              onSelect={() => c.toggleSelect(algo.id)}
                              onDelete={() => c.setDeleteTarget(algo)}
                              onRun={() => router.push(`/visualizer?savedId=${algo.id}`)}
                              onDragStart={() => c.handleDragStart(algo.id, topic)}
                              onDragOver={c.handleDragOver}
                              onDrop={() => c.handleDrop(algo.id, topic)}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : null}

            {/* Tip footer */}
            {!c.loading && c.algorithms.length > 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed bg-card/30 px-3 py-2.5 text-[11px] text-muted-foreground sm:px-4 sm:py-3 sm:text-[12px]">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  Tip: hit <b>Save code</b> in the visualizer to add a new algorithm — it lands here under
                  the topic you choose.
                </span>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <DeleteConfirmDialog
        open={c.deleteTarget !== null}
        onClose={() => c.setDeleteTarget(null)}
        onConfirm={() => {
          if (c.deleteTarget) void c.deleteAlgorithm(c.deleteTarget.id);
        }}
        title="Delete saved algorithm?"
        description={`This will permanently remove "${c.deleteTarget?.title ?? ""}" from your collection. This action cannot be undone.`}
        deleting={c.deletingId !== null}
      />

      <DeleteConfirmDialog
        open={c.bulkDeleteTarget}
        onClose={() => c.setBulkDeleteTarget(false)}
        onConfirm={() => void c.deleteSelected()}
        title={`Delete ${c.selectedIds.size} algorithm${c.selectedIds.size !== 1 ? "s" : ""}?`}
        description={`This will permanently remove ${c.selectedIds.size} algorithm${c.selectedIds.size !== 1 ? "s" : ""} from your collection. This action cannot be undone.`}
        deleting={c.deletingId === "bulk"}
      />

      {/* Sticky action bar for bulk selection */}
      {c.selectedIds.size > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4 sm:py-3 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={c.filtered.length > 0 && c.filtered.every((item) => c.selectedIds.has(item.id))}
                aria-label="Select all visible algorithms"
                onClick={c.toggleSelectAll}
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                  c.filtered.length > 0 && c.filtered.every((item) => c.selectedIds.has(item.id))
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/40 hover:border-primary/60",
                )}
              >
                {c.filtered.length > 0 && c.filtered.every((item) => c.selectedIds.has(item.id)) ? (
                  <Check className="h-3 w-3" />
                ) : null}
              </button>
              <span className="text-xs font-medium sm:text-sm">
                {c.selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={c.clearSelection}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
              >
                Clear
              </button>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 gap-1 px-2.5 text-[11px] sm:h-9 sm:gap-1.5 sm:px-3 sm:text-sm"
              onClick={() => c.setBulkDeleteTarget(true)}
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Delete {c.selectedIds.size > 1 ? `Selected (${c.selectedIds.size})` : "Selected"}</span>
              <span className="sm:hidden">Delete ({c.selectedIds.size})</span>
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
