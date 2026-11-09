"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkPlus,
  Check,
  Clock,
  FolderOpen,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { useUser } from "@/lib/auth/hooks";
import { API } from "@/lib/api-config";
import { relativeTime } from "@/lib/format";
import { TOPICS, topicMeta } from "@/lib/topic-meta";
import { cn } from "@/lib/utils";

// Selecting this chip reveals a text input to create a brand-new topic.
const NEW_TOPIC = "＋ New…";

type SavedAlgorithm = {
  id: string;
  title: string;
  topic: string;
  code: string;
  input_data: unknown;
  updated_at?: string;
};

type SavedCodeControlsProps = {
  code: string;
  inputText: string;
  defaultTitle: string;
  defaultTopic: string;
  language?: string;
  onLoad: (saved: SavedAlgorithm) => void;
  /** Guest pressed "Save code" — surface the sign-in prompt. */
  onRequireSignIn?: () => void;
};

export function SavedCodeControls({
  code,
  inputText,
  defaultTitle,
  defaultTopic,
  language,
  onLoad,
  onRequireSignIn,
}: SavedCodeControlsProps) {
  const { user } = useUser();
  const [tab, setTab] = useState<"save" | "library">("save");
  const [title, setTitle] = useState(defaultTitle);
  const [topic, setTopic] = useState(TOPICS.includes(defaultTopic) ? defaultTopic : "");
  const [customTopic, setCustomTopic] = useState("");
  const [saved, setSaved] = useState<SavedAlgorithm[]>([]);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Success feedback: the button flips to a green "Saved ✓" state, and the
  // app-wide toaster slides in with a link to the Collections page.
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (savedTimer.current !== undefined) window.clearTimeout(savedTimer.current);
    };
  }, []);

  const loadSaved = useCallback(async () => {
    if (!user) {
      setSaved([]);
      return;
    }

    const response = await fetch(API.me.savedAlgorithms, { cache: "no-store" });
    const json = (await response.json().catch(() => ({}))) as {
      algorithms?: SavedAlgorithm[];
      error?: string;
    };
    if (!response.ok) {
      setStatus(json.error ?? "Couldn't load saved code.");
      return;
    }

    setSaved(json.algorithms ?? []);
  }, [user]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadSaved();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadSaved]);

  const saveCode = async () => {
    setStatus("");
    let parsedInput: unknown;

    try {
      parsedInput = JSON.parse(inputText);
    } catch {
      setStatus("Fix the input JSON before saving.");
      return;
    }

    if (!user) {
      // Surface the sign-in prompt right at the moment the user wants to save
      // (the parent opens the modal). Keep the status line as a fallback.
      onRequireSignIn?.();
      setStatus("Sign in with Google to save this code.");
      return;
    }

    const resolvedTopic =
      topic === NEW_TOPIC ? customTopic.trim() : topic.trim();
    const finalTopic = resolvedTopic || "General";

    setIsSaving(true);
    const response = await fetch(API.me.savedAlgorithms, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || "Untitled algorithm",
        topic: finalTopic,
        language: language ?? "javascript",
        code,
        input_data: parsedInput,
      }),
    });
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    setIsSaving(false);

    if (!response.ok) {
      setStatus(json.error ?? "Couldn't save this code.");
      return;
    }

    // Success: flip the button state and pop the toast (no gray status line).
    setStatus("");
    setJustSaved(true);
    if (savedTimer.current !== undefined) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setJustSaved(false), 2600);
    toast({
      title: "Saved to your workspace",
      description: `${title.trim() || "Untitled algorithm"} · ${finalTopic}`,
      variant: "success",
      action: {
        label: "View in Collections →",
        onClick: () => {
          window.location.href = "/collections";
        },
      },
    });
    await loadSaved();
  };

  const [deleteTarget, setDeleteTarget] = useState<SavedAlgorithm | null>(null);

  const deleteItem = async (item: SavedAlgorithm) => {
    setDeletingId(item.id);
    const response = await fetch(API.me.savedAlgorithm(item.id), { method: "DELETE" });
    setDeletingId(null);
    setDeleteTarget(null);
    if (response.ok) {
      setSaved((prev) => prev.filter((entry) => entry.id !== item.id));
    }
  };

  // Library tab: searchable, most recent first.
  const library = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    const items = saved.filter((item) => {
      if (query.length === 0) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        (item.topic || "").toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query)
      );
    });
    return [...items].sort(
      (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime(),
    );
  }, [saved, libraryQuery]);

  const topicPillClass = (active: boolean) =>
    cn(
      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
      active
        ? "border-primary bg-primary/10 text-foreground"
        : "border-border bg-card text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="space-y-3 border-t pt-3">
      {/* Header + view-all link */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <FolderOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Personal workspace
        </div>
        <Link
          href="/collections"
          className="rounded-md px-1.5 py-0.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          View all →
        </Link>
      </div>

      {/* Save / Library tabs */}
      <div
        role="tablist"
        aria-label="Personal workspace"
        className="flex gap-1 rounded-lg border border-border bg-muted/40 p-0.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "save"}
          onClick={() => setTab("save")}
          className={cn(
            "flex-1 rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
            tab === "save" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Save
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "library"}
          onClick={() => setTab("library")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors",
            tab === "library" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Library
          {saved.length > 0 ? (
            <span className="rounded-full bg-primary/10 px-1.5 text-[10px] tabular-nums text-primary">
              {saved.length}
            </span>
          ) : null}
        </button>
      </div>

      {tab === "save" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="save-title">Title</Label>
            <Input
              id="save-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Name this algorithm"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Topic</Label>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((item) => {
                const meta = topicMeta(item);
                const Icon = meta.icon;
                const active = topic === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTopic(active ? "" : item)}
                    className={topicPillClass(active)}
                  >
                    <Icon
                      className={cn("h-3.5 w-3.5", active ? meta.text : "text-muted-foreground")}
                      aria-hidden="true"
                    />
                    {item}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={topic === NEW_TOPIC}
                onClick={() => setTopic(topic === NEW_TOPIC ? "" : NEW_TOPIC)}
                className={topicPillClass(topic === NEW_TOPIC)}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {NEW_TOPIC}
              </button>
            </div>
            {topic === NEW_TOPIC ? (
              <Input
                id="save-topic-custom"
                value={customTopic}
                onChange={(event) => setCustomTopic(event.target.value)}
                placeholder="Type a new topic, e.g. Prefix Sums"
                aria-label="New topic name"
              />
            ) : null}
          </div>

          <Button
            type="button"
            onClick={saveCode}
            disabled={isSaving}
            className={cn(
              "w-full",
              justSaved ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "",
            )}
          >
            {justSaved ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
            )}
            {isSaving ? "Saving" : justSaved ? "Saved" : "Save code"}
          </Button>

          {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
              placeholder="Search your library…"
              className="h-8 pl-8 text-[13px]"
              aria-label="Search saved algorithms"
            />
          </div>

          {saved.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              Nothing saved yet — switch to Save and add your first algorithm.
            </p>
          ) : library.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">No matches.</p>
          ) : (
            <ul className="max-h-52 space-y-0.5 overflow-auto pr-0.5">
              {library.map((item) => {
                const meta = topicMeta(item.topic);
                const Icon = meta.icon;
                return (
                  <li
                    key={item.id}
                    className="group flex items-center gap-2 rounded-md border border-transparent px-1.5 py-1.5 transition-colors hover:border-border hover:bg-muted/40"
                  >
                    <button
                      type="button"
                      onClick={() => onLoad(item)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted", meta.text)}>
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{item.title}</span>
                        <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {item.topic} · {relativeTime(item.updated_at)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${item.title}`}
                      disabled={deletingId === item.id}
                      onClick={() => setDeleteTarget(item)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void deleteItem(deleteTarget);
        }}
        title="Delete saved algorithm?"
        description={`This will permanently remove "${deleteTarget?.title ?? ""}" from your library. This action cannot be undone.`}
        deleting={deletingId !== null}
      />
    </div>
  );
}
