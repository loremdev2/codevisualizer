"use client";

import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Check,
  Eye,
  Maximize,
  Minimize,
  Download,
  Copy,
  Image as ImageIcon,
  FileImage,
  Globe,
  Lock,
  CopyPlus,
  Shapes,
  Network,
  FolderInput,
  Folder,
} from "lucide-react";

import { API, fetchJson } from "@/lib/api-config";
import {
  getDarkThemeSnapshot,
  getDarkThemeServerSnapshot,
  subscribeToDarkTheme,
} from "@/lib/visualizer-utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useUser } from "@/lib/auth/hooks";
import { SignInPrompt } from "@/components/sign-in-prompt";
import { DSA_TEMPLATES } from "@/lib/whiteboard-templates";
import { SYSTEM_DESIGN_INSERTS } from "@/lib/system-design-templates";
import { SiteNav } from "@/components/site-nav";

// Excalidraw must be loaded client-side only (requires browser APIs).
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <span className="text-sm">Loading whiteboard…</span>
        </div>
      </div>
    ),
  },
);

type WhiteboardData = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  thumbnail?: string | null;
  public: boolean;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
};

type FolderSummary = {
  id: string;
  name: string;
};

const AUTO_SAVE_INTERVAL_MS = 60_000;

export default function WhiteboardEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [whiteboard, setWhiteboard] = useState<WhiteboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  // Owner-only folder organization; the public gallery stays flat.
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [folderError, setFolderError] = useState<string | null>(null);
  // Read-only mode: the viewer isn't the owner — the whiteboard is being
  // viewed through the public gallery. All write paths are disabled.
  const [readOnly, setReadOnly] = useState(false);
  // Fork flow in read-only view: signed-in visitors can copy the shared
  // whiteboard into their own list; guests get the sign-in prompt.
  const [forking, setForking] = useState(false);
  const [forkedId, setForkedId] = useState<string | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const { user, loading: authLoading } = useUser();

  const excalidrawAPIRef = useRef<any>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const changeVersionRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = useSyncExternalStore(
    subscribeToDarkTheme,
    getDarkThemeSnapshot,
    getDarkThemeServerSnapshot,
  );

  // Resolve params
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Load whiteboard
  useEffect(() => {
    if (!id) return;
    (async () => {
      const result = await fetchJson<{ whiteboard?: WhiteboardData }>(
        API.me.whiteboard(id),
      );
      if (result.ok && result.data.whiteboard) {
        setWhiteboard(result.data.whiteboard);
        setNameValue(result.data.whiteboard.name);
        setIsPublic(result.data.whiteboard.public ?? false);
        // Folder list is only needed for the owner's move picker; it never
        // gates the canvas, so it loads in the background.
        void fetchJson<{ folders?: FolderSummary[] }>(API.me.whiteboardFolders).then(
          (folderList) => {
            if (folderList.ok) setFolders(folderList.data.folders ?? []);
          },
        );
      } else {
        // Not the owner (or signed out): fall back to the public endpoint so
        // gallery visitors can view shared whiteboards read-only.
        const pub = await fetchJson<{ whiteboard?: WhiteboardData }>(
          API.publicWhiteboard(id),
        );
        if (pub.ok && pub.data.whiteboard) {
          setReadOnly(true);
          setWhiteboard(pub.data.whiteboard);
        } else {
          setError(pub.ok ? "Whiteboard not found." : pub.error);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  // Generate a small thumbnail data URL from the current canvas. Wrapped in
  // useCallback so saveWhiteboard's dependency stays stable across renders.
  const generateThumbnail = useCallback(async (): Promise<string | null> => {
    try {
      const { exportToCanvas } = await import("@excalidraw/excalidraw");
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();

      const canvas = await exportToCanvas({
        elements,
        appState,
        files,
        exportBackground: true,
        quality: 0.5,
      });

      // Scale down to 400px wide
      const maxW = 400;
      const scale = Math.min(maxW / canvas.width, 1);
      const w = Math.round(canvas.width * scale);
      const h = Math.round(canvas.height * scale);

      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(canvas, 0, 0, w, h);
      return offscreen.toDataURL("image/png", 0.6);
    } catch {
      return null;
    }
  }, []);

  // Save to database
  const saveWhiteboard = useCallback(async () => {
    if (!id || readOnly || !excalidrawAPIRef.current) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const savedVersion = changeVersionRef.current;
    setSaving(true);
    try {
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();

      const data = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files,
      };

      // Generate thumbnail in parallel with save
      const thumbnail = await generateThumbnail();

      const result = await fetchJson(
        API.me.whiteboard(id),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data, thumbnail }),
        },
      );

      if (result.ok) {
        if (changeVersionRef.current === savedVersion) {
          isDirtyRef.current = false;
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }
      }
    } finally {
      setSaving(false);
    }
  }, [id, readOnly, generateThumbnail]);

  // Batch canvas edits and save at most once per minute while editing.
  const scheduleAutoSave = useCallback(() => {
    if (readOnly) return;
    isDirtyRef.current = true;
    changeVersionRef.current += 1;
    if (autoSaveTimerRef.current) return;
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      void saveWhiteboard();
    }, AUTO_SAVE_INTERVAL_MS);
  }, [readOnly, saveWhiteboard]);

  // Flush pending edits when the user backgrounds the tab so they don't have
  // to wait for the next interval after switching apps or windows.
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden" && isDirtyRef.current) {
        void saveWhiteboard();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saveWhiteboard]);

  // Save name
  async function saveName() {
    if (!id || readOnly || !nameValue.trim()) return;
    setEditingName(false);
    if (nameValue.trim() === whiteboard?.name) return;

    await fetchJson(API.me.whiteboard(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameValue.trim() }),
    });
    setWhiteboard((prev) => (prev ? { ...prev, name: nameValue.trim() } : prev));
  }

  // F2 keyboard shortcut for rename
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2" && !editingName && !readOnly) {
        e.preventDefault();
        setEditingName(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingName, readOnly]);

  // Fullscreen toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Export as PNG
  async function exportPNG() {
    if (!excalidrawAPIRef.current) return;
    setExporting(true);
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();

      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportWithDarkMode: isDark },
        files,
        mimeType: "image/png",
        quality: 1,
      });

      downloadBlob(blob, `${whiteboard?.name ?? "whiteboard"}.png`);
    } finally {
      setExporting(false);
    }
  }

  // Export as SVG
  async function exportSVG() {
    if (!excalidrawAPIRef.current) return;
    setExporting(true);
    try {
      const { exportToSvg } = await import("@excalidraw/excalidraw");
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();

      const svg = await exportToSvg({
        elements,
        appState: { ...appState, exportWithDarkMode: isDark },
        files,
      });

      const svgBlob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
      downloadBlob(svgBlob, `${whiteboard?.name ?? "whiteboard"}.svg`);
    } finally {
      setExporting(false);
    }
  }

  // Copy to clipboard as PNG
  async function copyToClipboard() {
    if (!excalidrawAPIRef.current) return;
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();

      const blob = await exportToBlob({
        elements,
        appState: { ...appState, exportWithDarkMode: isDark },
        files,
        mimeType: "image/png",
        quality: 1,
      });

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
    } catch {
      // Clipboard API may fail if user hasn't interacted — silent fail
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Toggle public visibility
  async function togglePublic() {
    if (!id || readOnly) return;
    const next = !isPublic;
    setIsPublic(next);
    await fetchJson(API.me.whiteboard(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public: next }),
    });
  }

  // Move this whiteboard between folders (null = Unfiled). Optimistic: the
  // canvas and its saved data are untouched, only the folder pointer changes.
  async function moveToFolder(folderId: string | null) {
    if (!id || readOnly || !whiteboard || whiteboard.folder_id === folderId) return;
    const previous = whiteboard.folder_id;
    setWhiteboard((prev) => (prev ? { ...prev, folder_id: folderId } : prev));
    setFolderError(null);
    const result = await fetchJson(API.me.whiteboard(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: folderId }),
    });
    if (!result.ok) {
      setWhiteboard((prev) => (prev ? { ...prev, folder_id: previous } : prev));
      setFolderError(result.error);
    }
  }

  // Duplicate whiteboard
  async function duplicateWhiteboard() {
    if (!id || readOnly || !excalidrawAPIRef.current) return;
    try {
      const elements = excalidrawAPIRef.current.getSceneElements();
      const appState = excalidrawAPIRef.current.getAppState();
      const files = excalidrawAPIRef.current.getFiles();

      const data = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize,
        },
        files,
      };

      const result = await fetchJson<{ whiteboard?: WhiteboardData }>(
        API.me.whiteboards,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${whiteboard?.name ?? "Untitled"} (copy)`,
            data,
            folder_id: whiteboard?.folder_id ?? null,
          }),
        },
      );

      if (result.ok && result.data.whiteboard) {
        router.push(`/whiteboard/${result.data.whiteboard.id}`);
      }
    } catch {
      // Silent fail
    }
  }

  // Fork a shared whiteboard into the visitor's own list. Uses the canvas
  // data already loaded in read-only mode — no second fetch needed. Guests
  // are sent to sign-in with ?next back to this page.
  async function forkWhiteboard() {
    if (!id || !whiteboard) return;
    if (!user) {
      setShowSignIn(true);
      return;
    }
    setForking(true);
    try {
      const result = await fetchJson<{ whiteboard?: WhiteboardData }>(
        API.me.whiteboards,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${whiteboard.name} (forked)`,
            data: whiteboard.data,
            thumbnail: whiteboard.thumbnail,
          }),
        },
      );
      if (result.ok && result.data.whiteboard) {
        setForkedId(result.data.whiteboard.id);
      }
    } finally {
      setForking(false);
    }
  }

  // Insert a DSA starter template at the center of the current viewport.
  // convertToExcalidrawElements regenerates ids and remaps arrow bindings;
  // the merged array is passed to updateScene so existing elements are kept.
  const insertTemplate = useCallback(
    (templateId: string) => {
      const api = excalidrawAPIRef.current;
      if (!api || readOnly) return;
      const template = [...DSA_TEMPLATES, ...SYSTEM_DESIGN_INSERTS].find(
        (t) => t.id === templateId,
      );
      if (!template) return;

      void (async () => {
        const { convertToExcalidrawElements, getCommonBounds } = await import(
          "@excalidraw/excalidraw"
        );

        // Deep-clone so skeleton ids are fresh for each insert.
        const cloned = JSON.parse(
          JSON.stringify(template.elements),
        ) as typeof template.elements;
        const newElements = convertToExcalidrawElements(cloned);

        // Block skeletons share placeholder group ids; stamp a fresh set per
        // insert so two copies of the same block aren't welded into one group.
        const groupIds = new Map<string, string>();
        const stamp = Date.now().toString(36);
        for (const el of newElements) {
          const ids = el.groupIds;
          if (!ids?.length) continue;
          (el as unknown as { groupIds: string[] }).groupIds = ids.map((groupId) => {
            let next = groupIds.get(groupId);
            if (!next) {
              next = `${groupId}-${stamp}-${groupIds.size}`;
              groupIds.set(groupId, next);
            }
            return next;
          });
        }

        // Read existing elements BEFORE updating — passing elements to
        // updateScene replaces the entire array, so we must merge.
        const existing = api.getSceneElements();

        // Place the new elements at the viewport center in scene coordinates.
        const appState = api.getAppState();
        const viewportW = appState.width ?? 800;
        const viewportH = appState.height ?? 600;
        // scrollX/scrollY are already scene-coordinate offsets; scene-x of
        // viewport center = -scrollX + viewportW/2 (zoom factored in by
        // Excalidraw's own coordinate transform).
        const sceneCenterX = -(appState.scrollX ?? 0) + viewportW / 2;
        const sceneCenterY = -(appState.scrollY ?? 0) + viewportH / 2;
        const [minX, minY, maxX, maxY] = getCommonBounds(newElements);
        const offsetX = sceneCenterX - (minX + (maxX - minX) / 2);
        const offsetY = sceneCenterY - (minY + (maxY - minY) / 2);
        for (const el of newElements) {
          (el as { x: number }).x += offsetX;
          (el as { y: number }).y += offsetY;
        }

        // Append — never overwrite.
        api.updateScene({
          elements: [...existing, ...newElements],
        });

        // Scroll so the newly inserted content is visible.
        api.scrollToContent(newElements, {
          fitToViewport: true,
          viewportZoomFactor: 0.8,
          animate: true,
        });

        scheduleAutoSave();
      })();
    },
    [readOnly, scheduleAutoSave],
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (error || !whiteboard) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error ?? "Whiteboard not found."}</p>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/whiteboard">Back to whiteboards</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/whiteboard/gallery">Browse the gallery</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SiteNav />
      <div ref={containerRef} className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* Top bar — hidden in fullscreen mode */}
      {!isFullscreen && (
        <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
          <Link
            href={readOnly ? "/whiteboard/gallery" : "/whiteboard"}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={readOnly ? "Back to gallery" : "Back to whiteboards"}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {readOnly ? (
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <span className="truncate">{whiteboard.name}</span>
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                <Eye className="h-3 w-3" aria-hidden="true" />
                View only
              </span>
            </span>
          ) : editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setNameValue(whiteboard.name);
                  setEditingName(false);
                }
              }}
              className="rounded border bg-background px-2 py-0.5 text-sm font-medium outline-none focus:ring-1 focus:ring-ring"
              maxLength={200}
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-medium hover:underline"
              title="Press F2 to rename"
            >
              {whiteboard.name}
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}

            {/* Fork: signed-in gallery visitors copy the shared whiteboard
                into their own list; guests get the sign-in prompt. */}
            {readOnly && !authLoading ? (
              forkedId ? (
                <Button asChild size="sm" variant="outline" className="gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <Link href={`/whiteboard/${forkedId}`}>
                    <Check className="h-3.5 w-3.5" />
                    Open your copy
                  </Link>
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" onClick={forkWhiteboard} disabled={forking}>
                      <CopyPlus className="mr-1.5 h-3.5 w-3.5" />
                      {forking ? "Copying…" : "Copy to my whiteboards"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add this shared whiteboard to your own list</TooltipContent>
                </Tooltip>
              )
            ) : null}

            {/* DSA starter templates */}
            {!readOnly ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Shapes className="mr-1.5 h-3.5 w-3.5" />
                    Insert
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  {DSA_TEMPLATES.map((template) => (
                    <DropdownMenuItem key={template.id} onClick={() => insertTemplate(template.id)}>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-xs font-medium">{template.label}</span>
                        <span className="text-[10px] text-muted-foreground">{template.description}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {/* System-design building blocks */}
            {!readOnly ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Network className="mr-1.5 h-3.5 w-3.5" />
                    Diagram
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="max-h-[70vh] min-w-60 overflow-y-auto"
                >
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    System design blocks
                  </DropdownMenuLabel>
                  {SYSTEM_DESIGN_INSERTS.map((block) => (
                    <DropdownMenuItem key={block.id} onClick={() => insertTemplate(block.id)}>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-xs font-medium">{block.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {block.description}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" disabled={exporting}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportPNG}>
                  <ImageIcon className="mr-2 h-3.5 w-3.5" />
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportSVG}>
                  <FileImage className="mr-2 h-3.5 w-3.5" />
                  Export as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyToClipboard}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy to clipboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {!readOnly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={duplicateWhiteboard}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Duplicate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicate this whiteboard</TooltipContent>
              </Tooltip>
            ) : null}

            {!readOnly ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" aria-label="Move to folder">
                    <FolderInput className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Folder
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    disabled={!whiteboard.folder_id}
                    onClick={() => moveToFolder(null)}
                  >
                    Unfiled
                  </DropdownMenuItem>
                  {folders.length > 0 && <DropdownMenuSeparator />}
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      disabled={whiteboard.folder_id === folder.id}
                      onClick={() => moveToFolder(folder.id)}
                    >
                      <Folder className="mr-2 h-3.5 w-3.5" />
                      <span className="truncate">{folder.name}</span>
                    </DropdownMenuItem>
                  ))}
                  {folders.length === 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      Create a folder from the whiteboards list.
                    </p>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {!readOnly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={isPublic ? "default" : "outline"}
                    onClick={togglePublic}
                  >
                    {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPublic ? "Visible in gallery — click to make private" : "Make public — share to gallery"}</TooltipContent>
              </Tooltip>
            ) : null}

            {folderError && (
              <span className="max-w-[10rem] truncate text-xs text-destructive">
                {folderError}
              </span>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle fullscreen</TooltipContent>
            </Tooltip>

            {!readOnly ? (
              <Button
                size="sm"
                variant="outline"
                onClick={saveWhiteboard}
                disabled={saving}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative flex-1">
        <Excalidraw
          theme={isDark ? "dark" : "light"}
          initialData={whiteboard.data.elements ? whiteboard.data : undefined}
          onChange={() => scheduleAutoSave()}
          viewModeEnabled={readOnly}
          excalidrawAPI={(api: any) => {
            excalidrawAPIRef.current = api;
          }}
        />

        {/* Fullscreen exit hint — floating button visible only in fullscreen */}
        {isFullscreen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleFullscreen}
                className="fixed right-4 top-4 z-50 rounded-full border bg-background/90 p-2 shadow-lg backdrop-blur hover:bg-accent"
              >
                <Minimize className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Exit fullscreen (Esc)</TooltipContent>
          </Tooltip>
        )}
      </div>

      <SignInPrompt
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        redirectPath={`/whiteboard/${id}`}
      />
      </div>
    </>
  );
}
