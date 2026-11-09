"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type DragEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  FileText,
  ArrowLeft,
  Search,
  Copy,
  Globe,
  Folder,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  ChevronRight,
  Check,
  X,
} from "lucide-react";

import { API, fetchJson } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UsernameBadge } from "@/components/ui/username-badge";
import { SiteNav } from "@/components/site-nav";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WhiteboardAuthor = {
  name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type Whiteboard = {
  id: string;
  name: string;
  data?: Record<string, unknown>;
  thumbnail: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string;
  author: WhiteboardAuthor | null;
};

type Folder = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

// Sidebar selections that aren't a folder id.
const ALL = "all";
const UNFILED = "unfiled";
const WHITEBOARD_VIEW_KEY = "dsa.whiteboards.view.v1";
const WHITEBOARD_VIEW_EVENT = "whiteboard-view-change";

type WhiteboardSort = "recent" | "name" | "oldest";
type WhiteboardView = {
  activeFolder: string;
  expandedFolders: string[];
  sortBy: WhiteboardSort;
};

const DEFAULT_WHITEBOARD_VIEW: WhiteboardView = {
  activeFolder: ALL,
  expandedFolders: [],
  sortBy: "recent",
};
const DEFAULT_WHITEBOARD_VIEW_SNAPSHOT = JSON.stringify(DEFAULT_WHITEBOARD_VIEW);
let whiteboardViewMemorySnapshot = DEFAULT_WHITEBOARD_VIEW_SNAPSHOT;

function parseWhiteboardView(raw: string): WhiteboardView {
  try {
    const parsed = JSON.parse(raw) as Partial<WhiteboardView>;
    return {
      activeFolder:
        typeof parsed.activeFolder === "string" ? parsed.activeFolder : ALL,
      expandedFolders: Array.isArray(parsed.expandedFolders)
        ? parsed.expandedFolders.filter((id): id is string => typeof id === "string")
        : [],
      sortBy:
        parsed.sortBy === "name" || parsed.sortBy === "oldest" ? parsed.sortBy : "recent",
    };
  } catch {
    return DEFAULT_WHITEBOARD_VIEW;
  }
}

function getWhiteboardViewSnapshot() {
  if (typeof window === "undefined") return DEFAULT_WHITEBOARD_VIEW_SNAPSHOT;
  try {
    whiteboardViewMemorySnapshot =
      window.localStorage.getItem(WHITEBOARD_VIEW_KEY) ?? DEFAULT_WHITEBOARD_VIEW_SNAPSHOT;
    return whiteboardViewMemorySnapshot;
  } catch {
    return whiteboardViewMemorySnapshot;
  }
}

function subscribeWhiteboardView(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(WHITEBOARD_VIEW_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(WHITEBOARD_VIEW_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function saveWhiteboardView(patch: Partial<WhiteboardView>) {
  if (typeof window === "undefined") return;
  const next = { ...parseWhiteboardView(getWhiteboardViewSnapshot()), ...patch };
  whiteboardViewMemorySnapshot = JSON.stringify(next);
  try {
    window.localStorage.setItem(WHITEBOARD_VIEW_KEY, whiteboardViewMemorySnapshot);
  } catch {
    // The view remains usable when storage is unavailable.
  }
  window.dispatchEvent(new Event(WHITEBOARD_VIEW_EVENT));
}

function rowClass(active: boolean) {
  return [
    "flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1.5 text-sm transition-colors sm:border-0",
    active
      ? "border-border bg-accent font-medium text-foreground"
      : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
  ].join(" ");
}

export default function WhiteboardListPage() {
  const router = useRouter();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWhiteboardName, setNewWhiteboardName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Whiteboard | null>(null);
  const [deletingWhiteboardId, setDeletingWhiteboardId] = useState<string | null>(null);
  const [whiteboardDeleteError, setWhiteboardDeleteError] = useState<string | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<Folder | null>(null);
  const [search, setSearch] = useState("");
  const viewSnapshot = useSyncExternalStore(
    subscribeWhiteboardView,
    getWhiteboardViewSnapshot,
    () => DEFAULT_WHITEBOARD_VIEW_SNAPSHOT,
  );
  const viewPrefs = useMemo(() => parseWhiteboardView(viewSnapshot), [viewSnapshot]);
  const activeFolder =
    viewPrefs.activeFolder === ALL ||
    viewPrefs.activeFolder === UNFILED ||
    folders.some((folder) => folder.id === viewPrefs.activeFolder)
      ? viewPrefs.activeFolder
      : ALL;
  const expandedFolders = useMemo(
    () => new Set(viewPrefs.expandedFolders),
    [viewPrefs.expandedFolders],
  );
  const sortBy = viewPrefs.sortBy;
  const [renamingBoard, setRenamingBoard] = useState<{ id: string; name: string } | null>(null);
  const [draggedBoardId, setDraggedBoardId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);
  // New-folder input: null = closed.
  const [newFolderName, setNewFolderName] = useState<string | null>(null);
  // Inline rename: null = closed.
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [boards, folderList] = await Promise.all([
        fetchJson<{ whiteboards?: Whiteboard[] }>(API.me.whiteboards),
        fetchJson<{ folders?: Folder[] }>(API.me.whiteboardFolders),
      ]);
      if (cancelled) return;
      if (boards.ok) {
        setWhiteboards(boards.data.whiteboards ?? []);
      } else {
        setError(boards.error);
      }
      if (folderList.ok) {
        setFolders(folderList.data.folders ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const searched = useMemo(() => {
    if (!search.trim()) return whiteboards;
    const q = search.toLowerCase();
    return whiteboards.filter((wb) => wb.name.toLowerCase().includes(q));
  }, [whiteboards, search]);

  const sortedWhiteboards = useMemo(() => {
    return [...searched].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const updatedOrder = b.updated_at.localeCompare(a.updated_at);
      return sortBy === "oldest" ? -updatedOrder : updatedOrder;
    });
  }, [searched, sortBy]);

  const visibleBoards = useMemo(() => {
    if (activeFolder === ALL) return sortedWhiteboards;
    if (activeFolder === UNFILED) return sortedWhiteboards.filter((wb) => !wb.folder_id);
    return sortedWhiteboards.filter((wb) => wb.folder_id === activeFolder);
  }, [sortedWhiteboards, activeFolder]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    let unfiled = 0;
    for (const wb of whiteboards) {
      if (wb.folder_id) map.set(wb.folder_id, (map.get(wb.folder_id) ?? 0) + 1);
      else unfiled += 1;
    }
    return { byFolder: map, unfiled, total: whiteboards.length };
  }, [whiteboards]);

  const boardsByFolder = useMemo(() => {
    const map = new Map<string, Whiteboard[]>();
    for (const whiteboard of sortedWhiteboards) {
      if (!whiteboard.folder_id) continue;
      const folderBoards = map.get(whiteboard.folder_id);
      if (folderBoards) folderBoards.push(whiteboard);
      else map.set(whiteboard.folder_id, [whiteboard]);
    }
    return map;
  }, [sortedWhiteboards]);

  // In the "All" view, group boards by folder so the list reads like a filing
  // cabinet. A folder with no boards is still shown in the sidebar.
  const sections = useMemo(() => {
    if (activeFolder !== ALL) return null;
    const known = new Set(folders.map((f) => f.id));
    const bucket = new Map<string, Whiteboard[]>();
    for (const wb of visibleBoards) {
      const key = wb.folder_id && known.has(wb.folder_id) ? wb.folder_id : "";
      const list = bucket.get(key);
      if (list) list.push(wb);
      else bucket.set(key, [wb]);
    }
    const out: { id: string; name: string; boards: Whiteboard[] }[] = [];
    for (const folder of folders) {
      const boards = bucket.get(folder.id);
      if (boards?.length) out.push({ id: folder.id, name: folder.name, boards });
    }
    const unfiled = bucket.get("");
    if (unfiled?.length) out.push({ id: "", name: "Unfiled", boards: unfiled });
    return out;
  }, [activeFolder, visibleBoards, folders]);

  const activeFolderName =
    activeFolder === ALL
      ? null
      : activeFolder === UNFILED
        ? "Unfiled"
        : (folders.find((f) => f.id === activeFolder)?.name ?? null);
  const createDestinationName =
    activeFolder !== ALL && activeFolder !== UNFILED
      ? activeFolderName ?? "folder"
      : "Unfiled";

  function openCreateDialog() {
    setNewWhiteboardName("");
    setCreateError(null);
    setCreateDialogOpen(true);
  }

  async function createWhiteboard() {
    const name = newWhiteboardName.trim();
    if (!name || name.length > 200) {
      setCreateError("Enter a whiteboard name between 1 and 200 characters.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const folderId =
        activeFolder !== ALL && activeFolder !== UNFILED ? activeFolder : null;
      const result = await fetchJson<{ whiteboard?: Whiteboard }>(API.me.whiteboards, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          data: {},
          folder_id: folderId,
        }),
      });
      if (result.ok && result.data.whiteboard) {
        setCreateDialogOpen(false);
        router.push(`/whiteboard/${result.data.whiteboard.id}`);
      } else if (!result.ok) {
        setCreateError(result.error);
      }
    } finally {
      setCreating(false);
    }
  }

  async function duplicateWhiteboard(wb: Whiteboard) {
    // Fetch the full whiteboard data so the copy includes canvas contents
    const full = await fetchJson<{ whiteboard?: Whiteboard }>(API.me.whiteboard(wb.id));
    const data = full.ok ? (full.data.whiteboard?.data ?? {}) : {};
    const result = await fetchJson<{ whiteboard?: Whiteboard }>(API.me.whiteboards, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${wb.name} (copy)`,
        data,
        // A copy lands in the same folder as its source.
        folder_id: wb.folder_id,
      }),
    });
    if (result.ok && result.data.whiteboard) {
      setWhiteboards((prev) => [result.data.whiteboard!, ...prev]);
    }
  }

  async function deleteWhiteboard(wb: Whiteboard) {
    setDeletingWhiteboardId(wb.id);
    setWhiteboardDeleteError(null);
    const result = await fetchJson(API.me.whiteboard(wb.id), { method: "DELETE" });
    if (result.ok) {
      setWhiteboards((prev) => prev.filter((w) => w.id !== wb.id));
      setDeleteTarget(null);
      setWhiteboardDeleteError(null);
      setError(null);
    } else {
      setWhiteboardDeleteError(result.error);
    }
    setDeletingWhiteboardId(null);
  }

  async function moveWhiteboard(wb: Whiteboard, folderId: string | null) {
    if (wb.folder_id === folderId) return;
    const previous = wb.folder_id;
    setWhiteboards((prev) =>
      prev.map((w) => (w.id === wb.id ? { ...w, folder_id: folderId } : w)),
    );
    const result = await fetchJson(API.me.whiteboard(wb.id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_id: folderId }),
    });
    if (!result.ok) {
      setWhiteboards((prev) =>
        prev.map((w) => (w.id === wb.id ? { ...w, folder_id: previous } : w)),
      );
      setError(result.error);
    }
  }

  function toggleFolder(folderId: string) {
    const next = new Set(expandedFolders);
    if (next.has(folderId)) next.delete(folderId);
    else next.add(folderId);
    saveWhiteboardView({ expandedFolders: [...next] });
  }

  async function saveWhiteboardName() {
    if (!renamingBoard) return;
    const name = renamingBoard.name.trim();
    if (!name || name.length > 200) {
      setError("Whiteboard name must be between 1 and 200 characters.");
      return;
    }
    const result = await fetchJson<{ whiteboard?: Whiteboard }>(
      API.me.whiteboard(renamingBoard.id),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );
    if (result.ok) {
      setWhiteboards((previous) =>
        previous.map((whiteboard) =>
          whiteboard.id === renamingBoard.id
            ? { ...whiteboard, ...(result.data.whiteboard ?? {}), name }
            : whiteboard,
        ),
      );
      setRenamingBoard(null);
      setError(null);
    } else {
      setError(result.error);
    }
  }

  function handleFolderDragOver(event: DragEvent<HTMLElement>, folderId: string | null) {
    if (!draggedBoardId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTargetFolderId(folderId ?? UNFILED);
  }

  function handleFolderDrop(event: DragEvent<HTMLElement>, folderId: string | null) {
    event.preventDefault();
    const boardId = event.dataTransfer.getData("text/plain") || draggedBoardId;
    setDraggedBoardId(null);
    setDropTargetFolderId(null);
    const whiteboard = whiteboards.find((board) => board.id === boardId);
    if (whiteboard) void moveWhiteboard(whiteboard, folderId);
  }

  async function createFolder() {
    const name = (newFolderName ?? "").trim();
    setNewFolderName(null);
    if (!name) return;
    const result = await fetchJson<{ folder?: Folder }>(API.me.whiteboardFolders, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (result.ok && result.data.folder) {
      const folder = result.data.folder;
      setFolders((prev) =>
        [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)),
      );
      saveWhiteboardView({
        activeFolder: folder.id,
        expandedFolders: [...new Set([...viewPrefs.expandedFolders, folder.id])],
      });
    } else if (!result.ok) {
      setError(result.error);
    }
  }

  async function renameFolder(folder: Folder) {
    const name = (renaming?.name ?? "").trim();
    setRenaming(null);
    if (!name || name === folder.name) return;
    const result = await fetchJson<{ folder?: Folder }>(API.me.whiteboardFolder(folder.id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (result.ok && result.data.folder) {
      const updated = result.data.folder;
      setFolders((prev) =>
        prev
          .map((f) => (f.id === updated.id ? updated : f))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } else if (!result.ok) {
      setError(result.error);
    }
  }

  async function deleteFolder(folder: Folder) {
    const result = await fetchJson(API.me.whiteboardFolder(folder.id), { method: "DELETE" });
    if (result.ok) {
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
      // ON DELETE SET NULL server-side: those boards become unfiled.
      setWhiteboards((prev) =>
        prev.map((w) => (w.folder_id === folder.id ? { ...w, folder_id: null } : w)),
      );
      saveWhiteboardView({
        activeFolder: activeFolder === folder.id ? ALL : activeFolder,
        expandedFolders: viewPrefs.expandedFolders.filter((id) => id !== folder.id),
      });
    } else {
      setError(result.error);
    }
    setDeleteFolderTarget(null);
  }

  function renderCard(wb: Whiteboard) {
    return (
      <div
        key={wb.id}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", wb.id);
          setDraggedBoardId(wb.id);
        }}
        onDragEnd={() => {
          setDraggedBoardId(null);
          setDropTargetFolderId(null);
        }}
        className={`group overflow-hidden rounded-lg border transition-colors hover:bg-accent ${
          draggedBoardId === wb.id ? "opacity-50" : ""
        }`}
      >
        <Link href={`/whiteboard/${wb.id}`} className="block">
          {/* Thumbnail preview */}
          {wb.thumbnail ? (
            <div className="relative h-36 w-full overflow-hidden bg-muted/30">
              <img
                src={wb.thumbnail}
                alt=""
                className="h-full w-full object-cover object-top"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          ) : (
            <div className="flex h-36 w-full items-center justify-center bg-muted/20">
              <FileText className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
          <div className="p-3">
            <div className="flex items-start justify-between">
              <h3 className="truncate font-medium">{wb.name}</h3>
              <div className="ml-2 flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={`Move ${wb.name} to a folder`}
                    >
                      <FolderInput className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Move to folder
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      disabled={!wb.folder_id}
                      onClick={() => moveWhiteboard(wb, null)}
                    >
                      Unfiled
                    </DropdownMenuItem>
                    {folders.length > 0 && <DropdownMenuSeparator />}
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        disabled={wb.folder_id === folder.id}
                        onClick={() => moveWhiteboard(wb, folder.id)}
                      >
                        <Folder className="mr-2 h-3.5 w-3.5" />
                        <span className="truncate">{folder.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        duplicateWhiteboard(wb);
                      }}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={`Duplicate ${wb.name}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate whiteboard</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(wb);
                      }}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${wb.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete whiteboard</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Updated {new Date(wb.updated_at).toLocaleDateString()}
            </p>
            {wb.author && (
              <div className="mt-1.5 flex items-center gap-1.5">
                {wb.author.avatar_url ? (
                  <img
                    src={wb.author.avatar_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                    {(wb.author.name ?? "U").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-muted-foreground/70">
                    {wb.author.name ?? "Anonymous"}
                  </span>
                  {wb.author.username && (
                    <UsernameBadge username={wb.author.username} size="sm" />
                  )}
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <SiteNav />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <h1 className="text-2xl font-bold">Whiteboards</h1>
            <p className="mt-1 text-muted-foreground">
              Your saved drawings, organized in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/whiteboard/gallery">
                <Globe className="mr-1.5 h-3.5 w-3.5" />
                Gallery
              </Link>
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-1.5 h-4 w-4" />
              {`New in ${createDestinationName}`}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Folder sidebar */}
          <aside className="sm:w-52 sm:shrink-0">
            <div className="sm:sticky sm:top-4">
              <nav aria-label="Whiteboard folders" className="flex gap-1 overflow-x-auto pb-1 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:pb-0">
                <button
                  onClick={() => saveWhiteboardView({ activeFolder: ALL })}
                  className={`${rowClass(activeFolder === ALL)} sm:w-full`}
                  aria-current={activeFolder === ALL ? "page" : undefined}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">All whiteboards</span>
                  <span className="ml-auto pl-1 text-xs tabular-nums opacity-70">
                    {counts.total}
                  </span>
                </button>
                <button
                  onClick={() => saveWhiteboardView({ activeFolder: UNFILED })}
                  onDragOver={(event) => handleFolderDragOver(event, null)}
                  onDragLeave={() => setDropTargetFolderId(null)}
                  onDrop={(event) => handleFolderDrop(event, null)}
                  className={`${rowClass(activeFolder === UNFILED)} sm:w-full ${
                    dropTargetFolderId === UNFILED ? "ring-2 ring-primary" : ""
                  }`}
                  aria-current={activeFolder === UNFILED ? "page" : undefined}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Unfiled</span>
                  <span className="ml-auto pl-1 text-xs tabular-nums opacity-70">
                    {counts.unfiled}
                  </span>
                </button>
              </nav>

              <div className="mt-4 flex items-center justify-between px-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Folders
                </span>
                <button
                  onClick={() => setNewFolderName("")}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label="New folder"
                  title="New folder"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-1 flex gap-1 overflow-x-auto pb-1 sm:flex-col sm:gap-0.5 sm:overflow-visible sm:pb-0">
                {folders.map((folder) => {
                  const isActive = activeFolder === folder.id;
                  const folderBoards = boardsByFolder.get(folder.id) ?? [];
                  const isExpanded = expandedFolders.has(folder.id);
                  if (renaming?.id === folder.id) {
                    return (
                      <input
                        key={folder.id}
                        autoFocus
                        value={renaming.name}
                        onChange={(e) => setRenaming({ id: folder.id, name: e.target.value })}
                        onBlur={() => renameFolder(folder)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameFolder(folder);
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        maxLength={100}
                        aria-label="Folder name"
                        className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring sm:w-full"
                      />
                    );
                  }
                  return (
                    <div
                      key={folder.id}
                      onDragOver={(event) => handleFolderDragOver(event, folder.id)}
                      onDragLeave={() => setDropTargetFolderId(null)}
                      onDrop={(event) => handleFolderDrop(event, folder.id)}
                      className={`group/folder min-w-[9rem] rounded-md sm:w-full ${
                        dropTargetFolderId === folder.id ? "bg-primary/10 ring-2 ring-primary" : ""
                      }`}
                    >
                      <div
                        className={`flex items-center gap-0.5 rounded-md ${
                          isActive ? "bg-accent" : "hover:bg-accent/60"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFolder(folder.id)}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${folder.name}`}
                          aria-expanded={isExpanded}
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight
                            className={`h-3.5 w-3.5 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => saveWhiteboardView({ activeFolder: folder.id })}
                          className={`flex min-w-0 flex-1 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <Folder className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{folder.name}</span>
                          {counts.byFolder.get(folder.id) ? (
                            <span className="ml-auto pl-1 text-xs tabular-nums opacity-70">
                              {counts.byFolder.get(folder.id)}
                            </span>
                          ) : null}
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="rounded p-1 text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover/folder:opacity-100"
                              aria-label={`Actions for folder ${folder.name}`}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                setRenaming({ id: folder.id, name: folder.name })
                              }
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteFolderTarget(folder)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {isExpanded && folderBoards.length > 0 && (
                        <div className="ml-3 max-h-40 overflow-y-auto border-l border-border/70 py-1">
                          {folderBoards.map((whiteboard) =>
                            renamingBoard?.id === whiteboard.id ? (
                              <form
                                key={whiteboard.id}
                                className="flex items-center gap-1 py-0.5 pl-2 pr-1"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  void saveWhiteboardName();
                                }}
                              >
                                <input
                                  autoFocus
                                  value={renamingBoard.name}
                                  onChange={(event) =>
                                    setRenamingBoard({
                                      id: whiteboard.id,
                                      name: event.target.value,
                                    })
                                  }
                                  maxLength={200}
                                  aria-label="Whiteboard name"
                                  className="min-w-0 flex-1 rounded border bg-background px-1.5 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                                />
                                <button
                                  type="submit"
                                  aria-label="Save whiteboard name"
                                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRenamingBoard(null)}
                                  aria-label="Cancel rename"
                                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </form>
                            ) : (
                              <div key={whiteboard.id} className="group/board flex items-center">
                                <Link
                                  href={`/whiteboard/${whiteboard.id}`}
                                  title={whiteboard.name}
                                  className="block min-w-0 flex-1 truncate py-1 pl-3 pr-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                >
                                  {whiteboard.name}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRenamingBoard({ id: whiteboard.id, name: whiteboard.name })
                                  }
                                  aria-label={`Rename ${whiteboard.name}`}
                                  title={`Rename ${whiteboard.name}`}
                                  className="rounded p-1 text-muted-foreground opacity-100 hover:text-foreground sm:opacity-0 focus-visible:opacity-100 group-hover/board:opacity-100"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWhiteboardDeleteError(null);
                                    setDeleteTarget(whiteboard);
                                  }}
                                  aria-label={`Delete ${whiteboard.name}`}
                                  title={`Delete ${whiteboard.name}`}
                                  className="rounded p-1 text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 focus-visible:opacity-100 group-hover/board:opacity-100"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {newFolderName !== null && (
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onBlur={createFolder}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createFolder();
                      if (e.key === "Escape") setNewFolderName(null);
                    }}
                    maxLength={100}
                    placeholder="Folder name"
                    aria-label="New folder name"
                    className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring sm:w-full"
                  />
                )}

                {folders.length === 0 && newFolderName === null && (
                  <p className="px-2 py-1 text-xs text-muted-foreground/70">
                    Group whiteboards by topic.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* Boards */}
          <div className="min-w-0 flex-1">
            {whiteboards.length > 0 && (
              <div className="mb-6 flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={
                      activeFolderName
                        ? `Search in ${activeFolderName}…`
                        : "Search whiteboards…"
                    }
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    saveWhiteboardView({ sortBy: event.target.value as WhiteboardSort })
                  }
                  aria-label="Sort whiteboards"
                  className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="recent">Recently updated</option>
                  <option value="name">Name A–Z</option>
                  <option value="oldest">Oldest updated</option>
                </select>
              </div>
            )}

            {whiteboards.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                <h2 className="text-lg font-medium">No whiteboards yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first whiteboard to start drawing diagrams, sketching ideas, or planning algorithms.
                </p>
                <Button onClick={openCreateDialog} className="mt-4">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create whiteboard
                </Button>
              </div>
            ) : visibleBoards.length === 0 ? (
              <div className="rounded-lg border border-dashed p-12 text-center">
                {search.trim() ? (
                  <>
                    <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <h2 className="text-lg font-medium">No matches</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No whiteboards match &ldquo;{search}&rdquo;
                      {activeFolderName ? ` in ${activeFolderName}` : ""}. Try a different search.
                    </p>
                  </>
                ) : (
                  <>
                    <Folder className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <h2 className="text-lg font-medium">
                      {activeFolder === UNFILED ? "Nothing unfiled" : "This folder is empty"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeFolder === UNFILED
                        ? "Every whiteboard is filed away in a folder."
                        : "Move a whiteboard here with the folder button on its card, or create a new one inside it."}
                    </p>
                    <Button onClick={openCreateDialog} className="mt-4">
                      <Plus className="mr-1.5 h-4 w-4" />
                      New whiteboard here
                    </Button>
                  </>
                )}
              </div>
            ) : sections ? (
              <div className="space-y-8">
                {sections.map((section) => (
                  <section key={section.id || "unfiled"}>
                    <div className="mb-2 flex items-baseline gap-2">
                      <h2 className="text-sm font-semibold">
                        {section.id ? section.name : "Unfiled"}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {section.boards.length}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {section.boards.map(renderCard)}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visibleBoards.map(renderCard)}
              </div>
            )}
          </div>
        </div>

        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setCreateError(null);
          }}
        >
          <DialogContent>
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void createWhiteboard();
              }}
            >
              <DialogHeader>
                <DialogTitle>New whiteboard</DialogTitle>
                <DialogDescription>
                  This whiteboard will be saved in {createDestinationName}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label htmlFor="new-whiteboard-name" className="text-sm font-medium">
                  Name
                </label>
                <input
                  id="new-whiteboard-name"
                  autoFocus
                  required
                  maxLength={200}
                  value={newWhiteboardName}
                  onChange={(event) => setNewWhiteboardName(event.target.value)}
                  placeholder="e.g. System design notes"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                {createError && (
                  <p role="alert" className="text-sm text-destructive">
                    {createError}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating…" : "Create whiteboard"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={deleteTarget !== null}
          onClose={() => {
            setDeleteTarget(null);
            setWhiteboardDeleteError(null);
          }}
          onConfirm={() => {
            if (deleteTarget) void deleteWhiteboard(deleteTarget);
          }}
          title="Delete whiteboard?"
          description={
            deleteTarget
              ? `“${deleteTarget.name}” will be permanently deleted. This cannot be undone.${
                  whiteboardDeleteError ? ` Delete failed: ${whiteboardDeleteError}` : ""
                }`
              : undefined
          }
          deleting={deleteTarget !== null && deletingWhiteboardId === deleteTarget.id}
        />

        {/* Delete folder confirmation dialog */}
        {deleteFolderTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg">
              <h3 className="text-lg font-semibold">Delete folder?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                &ldquo;{deleteFolderTarget.name}&rdquo; will be deleted.
                {counts.byFolder.get(deleteFolderTarget.id)
                  ? ` Its ${counts.byFolder.get(deleteFolderTarget.id)} whiteboard${
                      counts.byFolder.get(deleteFolderTarget.id) === 1 ? "" : "s"
                    } will move to Unfiled — no drawings are lost.`
                  : " It is empty."}
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteFolderTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteFolder(deleteFolderTarget)}
                >
                  Delete folder
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
