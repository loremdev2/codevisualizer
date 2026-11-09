"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useUser } from "@/lib/auth/hooks";
import { detectLanguage } from "@/lib/detect-language";
import { topicMeta } from "@/lib/topic-meta";

import type { SavedAlgorithm } from "./collections-types";
import {
  collectAllTags,
  readOrder,
  readTags,
  toggleTagInMap,
  writeOrder,
  writeTags,
} from "./collections-types";
import { deleteAlgorithmApi, deleteMultipleApi, fetchCollectionsApi, updateAlgorithmApi, updateTagsApi } from "./collections-api";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type UseCollectionsReturn = {
  // Data
  user: ReturnType<typeof useUser>["user"];
  loading: boolean;
  algorithms: SavedAlgorithm[];
  filtered: SavedAlgorithm[];
  sections: [string, SavedAlgorithm[]][];
  topics: [string, number][];
  stats: { total: number; topics: number; lastSaved: string | undefined };
  allTags: string[];

  // Filter/sort state
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTopic: string;
  setSelectedTopic: (t: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (l: string) => void;
  sortBy: "recent" | "title" | "topic";
  setSortBy: (s: "recent" | "title" | "topic") => void;
  viewMode: "card" | "list";
  setViewMode: (v: "card" | "list") => void;
  selectedTag: string | null;
  setSelectedTag: (t: string | null) => void;

  // Tag management
  tags: Record<string, string[]>;
  toggleTag: (algorithmId: string, tag: string) => void;
  editingTagId: string | null;
  setEditingTagId: (id: string | null) => void;

  // Selection
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;

  // Drag-and-drop
  draggedId: string | null;
  handleDragStart: (id: string, topic: string) => void;
  handleDragOver: (event: React.DragEvent) => void;
  handleDrop: (targetId: string, topic: string) => void;

  // Deletion
  deletingId: string | null;
  deleteTarget: SavedAlgorithm | null;
  setDeleteTarget: (algo: SavedAlgorithm | null) => void;
  deleteAlgorithm: (id: string) => Promise<void>;
  bulkDeleteTarget: boolean;
  setBulkDeleteTarget: (v: boolean) => void;
  deleteSelected: () => Promise<void>;
  clearFilters: () => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCollections(): UseCollectionsReturn {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [algorithms, setAlgorithms] = useState<SavedAlgorithm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "topic">("recent");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedAlgorithm | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [order, setOrder] = useState<Record<string, string[]>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [draggedFromTopic, setDraggedFromTopic] = useState<string | null>(null);

  // ---- Data fetching ----

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    const result = await fetchCollectionsApi();
    setAlgorithms(result);
    // Build tags from DB as the source of truth, merging with localStorage.
    setTags((prev) => {
      const dbTags: Record<string, string[]> = {};
      for (const algo of result) {
        if (algo.tags && algo.tags.length > 0) {
          dbTags[algo.id] = algo.tags;
        }
      }
      // Merge: DB takes precedence, but keep any localStorage-only tags
      // for algorithms not yet in DB (e.g., recently saved offline).
      const merged: Record<string, string[]> = { ...prev, ...dbTags };
      writeTags(merged);
      return merged;
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount, not a cascading render
    void fetchCollections();
  }, [fetchCollections]);

  // Load tags and order from localStorage on mount. Sync-from-localStorage
  // on mount — same client-only pattern as fetchCollections above.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data load on mount, not a cascading render
    setTags(readTags());
    setOrder(readOrder());
  }, []);

  // ---- Tag management ----

  const toggleTag = useCallback((algorithmId: string, tag: string) => {
    let nextTags: Record<string, string[]> | null = null;
    setTags((prev) => {
      const updated = toggleTagInMap(prev, algorithmId, tag);
      writeTags(updated);
      nextTags = updated;
      return updated;
    });
    // Persist to DB in the background (fire-and-forget).
    if (nextTags) {
      void updateTagsApi(algorithmId, nextTags[algorithmId] ?? []);
    }
  }, []);

  const allTags = useMemo(() => collectAllTags(tags), [tags]);

  // ---- Selection ----

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ---- Drag-and-drop ----

  const handleDragStart = useCallback((id: string, topic: string) => {
    setDraggedId(id);
    setDraggedFromTopic(topic);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (targetId: string, targetTopic: string) => {
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        setDraggedFromTopic(null);
        return;
      }
      const sourceTopic = draggedFromTopic ?? (algorithms.find((a) => a.id === draggedId)?.topic || "Custom");

      if (sourceTopic !== targetTopic) {
        // Cross-topic move: update the algorithm's topic in the API and local state.
        setAlgorithms((prev) =>
          prev.map((a) => (a.id === draggedId ? { ...a, topic: targetTopic } : a)),
        );
        void updateAlgorithmApi(draggedId, { topic: targetTopic });
        // Also reorder: remove from source, insert at target position in destination.
        setOrder((prev) => {
          const sourceItems = algorithms.filter((a) => (a.topic || "Custom") === sourceTopic);
          const sourceOrder = prev[sourceTopic] ?? sourceItems.map((a) => a.id);
          const destItems = algorithms.filter((a) => (a.topic || "Custom") === targetTopic);
          const destOrder = prev[targetTopic] ?? destItems.map((a) => a.id);
          const nextSource = sourceOrder.filter((id) => id !== draggedId);
          const toIdx = destOrder.indexOf(targetId);
          const nextDest = [...destOrder];
          nextDest.splice(toIdx === -1 ? nextDest.length : toIdx + 1, 0, draggedId);
          const updated = { ...prev, [sourceTopic]: nextSource, [targetTopic]: nextDest };
          writeOrder(updated);
          return updated;
        });
      } else {
        // Same-topic reorder (existing behavior).
        setOrder((prev) => {
          const topicItems = algorithms.filter((a) => (a.topic || "Custom") === targetTopic);
          const currentOrder = prev[targetTopic] ?? topicItems.map((a) => a.id);
          const fromIdx = currentOrder.indexOf(draggedId);
          const toIdx = currentOrder.indexOf(targetId);
          if (fromIdx === -1 || toIdx === -1) return prev;
          const next = [...currentOrder];
          next.splice(fromIdx, 1);
          next.splice(toIdx, 0, draggedId);
          const updated = { ...prev, [targetTopic]: next };
          writeOrder(updated);
          return updated;
        });
      }
      setDraggedId(null);
      setDraggedFromTopic(null);
    },
    [draggedId, draggedFromTopic, algorithms],
  );

  // ---- Topics (with counts, most recent first) ----

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of algorithms) {
      const topic = item.topic || "Custom";
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [algorithms]);

  // ---- Filtered + sorted algorithms ----

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const items = algorithms.filter((item) => {
      const matchesTopic = selectedTopic === "All" || item.topic === selectedTopic;
      const itemLanguage = item.language ?? detectLanguage(item.code).language;
      const matchesLanguage = selectedLanguage === "all" || itemLanguage === selectedLanguage;
      const matchesSearch =
        query.length === 0 ||
        item.title.toLowerCase().includes(query) ||
        (item.topic || "").toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query);
      const matchesTag = !selectedTag || (tags[item.id] ?? []).includes(selectedTag);
      return matchesTopic && matchesLanguage && matchesSearch && matchesTag;
    });
    return [...items].sort((a, b) =>
      sortBy === "title"
        ? a.title.localeCompare(b.title)
        : sortBy === "topic"
          ? (a.topic || "").localeCompare(b.topic || "") || a.title.localeCompare(b.title)
          : new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime(),
    );
  }, [algorithms, searchQuery, selectedTopic, selectedLanguage, sortBy, selectedTag, tags]);

  // ---- Sectioned layout (grouped by topic, custom order) ----

  const sections = useMemo(() => {
    const groups = new Map<string, SavedAlgorithm[]>();
    for (const item of filtered) {
      const topic = item.topic || "Custom";
      const list = groups.get(topic) ?? [];
      list.push(item);
      groups.set(topic, list);
    }
    for (const [topic, items] of groups) {
      const topicOrder = order[topic];
      if (topicOrder && topicOrder.length > 0) {
        const idToItem = new Map(items.map((item) => [item.id, item]));
        const ordered: SavedAlgorithm[] = [];
        for (const id of topicOrder) {
          const item = idToItem.get(id);
          if (item) ordered.push(item);
        }
        for (const item of items) {
          if (!topicOrder.includes(item.id)) ordered.push(item);
        }
        groups.set(topic, ordered);
      }
    }
    return Array.from(groups.entries()).sort(
      (a, b) => (topics.find(([t]) => t === b[0])?.[1] ?? 0) - (topics.find(([t]) => t === a[0])?.[1] ?? 0),
    );
  }, [filtered, topics, order]);

  // ---- Stats ----

  const stats = useMemo(() => {
    const lastSaved = algorithms.reduce<string | undefined>(
      (latest, item) => (!latest || (item.updated_at ?? "") > latest ? item.updated_at : latest),
      undefined,
    );
    return {
      total: algorithms.length,
      topics: topics.length,
      lastSaved,
    };
  }, [algorithms, topics]);

  // ---- Select all ----

  const toggleSelectAll = useCallback(() => {
    const filteredIds = new Set(filtered.map((item) => item.id));
    setSelectedIds((prev) => {
      const allSelected = filteredIds.size > 0 && [...filteredIds].every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(filteredIds);
    });
  }, [filtered]);

  // ---- Deletion ----

  const deleteAlgorithm = useCallback(
    async (id: string) => {
      setDeletingId(id);
      const ok = await deleteAlgorithmApi(id);
      setDeletingId(null);
      setDeleteTarget(null);
      if (ok) {
        setAlgorithms((prev) => prev.filter((item) => item.id !== id));
      }
    },
    [],
  );

  const deleteSelected = useCallback(async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setDeletingId("bulk");
    const deleted = await deleteMultipleApi(ids);
    setDeletingId(null);
    setBulkDeleteTarget(false);
    setSelectedIds(new Set());
    setAlgorithms((prev) => prev.filter((item) => !deleted.has(item.id)));
  }, [selectedIds]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTopic("All");
    setSelectedLanguage("all");
  }, []);

  return {
    user,
    loading,
    algorithms,
    filtered,
    sections,
    topics,
    stats,
    allTags,

    searchQuery,
    setSearchQuery,
    selectedTopic,
    setSelectedTopic,
    selectedLanguage,
    setSelectedLanguage,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    selectedTag,
    setSelectedTag,

    tags,
    toggleTag,
    editingTagId,
    setEditingTagId,

    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,

    draggedId,
    handleDragStart,
    handleDragOver,
    handleDrop,

    deletingId,
    deleteTarget,
    setDeleteTarget,
    deleteAlgorithm,
    bulkDeleteTarget,
    setBulkDeleteTarget,
    deleteSelected,
    clearFilters,
  };
}
