import {
  BrainCircuit,
  FolderOpen,
  Grid3x3,
  Hash,
  Layers,
  Link2,
  MoveHorizontal,
  MoveRight,
  Network,
  Repeat,
  Rows3,
  Search,
  SearchCode,
  Text,
  TreePine,
  Undo2,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for topic identity across the app: the topics a user
 * can save under (Personal workspace) and the icons/accent colors shown on the
 * Collections page. Topics not in the map get a deterministic fallback color so
 * custom topics never look broken.
 */
export const TOPICS = [
  "Arrays",
  "Hashing",
  "Sliding Window",
  "Two Pointers",
  "Binary Search",
  "Linked Lists",
  "Trees",
  "Graphs",
  "Recursion",
  "Dynamic Programming",
  "Backtracking",
  "String",
  "Matrix",
  "Heap",
  "Search",
];

export type TopicVisual = {
  icon: LucideIcon;
  dot: string;
  text: string;
  ring: string;
};

export const TOPIC_META: Record<string, TopicVisual> = {
  Arrays:            { icon: Rows3,          dot: "bg-blue-500",      text: "text-blue-500",      ring: "hover:border-blue-500/50" },
  Hashing:           { icon: Hash,           dot: "bg-orange-500",    text: "text-orange-500",    ring: "hover:border-orange-500/50" },
  "Sliding Window":  { icon: MoveHorizontal, dot: "bg-violet-500",    text: "text-violet-500",    ring: "hover:border-violet-500/50" },
  "Two Pointers":    { icon: MoveRight,      dot: "bg-sky-500",       text: "text-sky-500",       ring: "hover:border-sky-500/50" },
  "Binary Search":   { icon: SearchCode,     dot: "bg-emerald-500",   text: "text-emerald-500",   ring: "hover:border-emerald-500/50" },
  "Linked Lists":    { icon: Link2,          dot: "bg-indigo-500",    text: "text-indigo-500",    ring: "hover:border-indigo-500/50" },
  Trees:             { icon: TreePine,       dot: "bg-lime-500",      text: "text-lime-500",      ring: "hover:border-lime-500/50" },
  Graphs:            { icon: Network,        dot: "bg-red-500",       text: "text-red-500",       ring: "hover:border-red-500/50" },
  Recursion:         { icon: Repeat,         dot: "bg-fuchsia-500",   text: "text-fuchsia-500",   ring: "hover:border-fuchsia-500/50" },
  "Dynamic Programming": { icon: BrainCircuit, dot: "bg-pink-500",    text: "text-pink-500",      ring: "hover:border-pink-500/50" },
  Backtracking:      { icon: Undo2,          dot: "bg-amber-500",     text: "text-amber-500",     ring: "hover:border-amber-500/50" },
  String:            { icon: Text,           dot: "bg-emerald-500",   text: "text-emerald-500",   ring: "hover:border-emerald-500/50" },
  Matrix:            { icon: Grid3x3,        dot: "bg-teal-500",      text: "text-teal-500",      ring: "hover:border-teal-500/50" },
  Heap:              { icon: Layers,         dot: "bg-rose-500",      text: "text-rose-500",      ring: "hover:border-rose-500/50" },
  Search:            { icon: Search,         dot: "bg-cyan-500",      text: "text-cyan-500",      ring: "hover:border-cyan-500/50" },
};

const TOPIC_FALLBACK_COLORS = [
  "bg-teal-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-fuchsia-500",
];

export function topicMeta(topic: string): TopicVisual {
  const known = TOPIC_META[topic];
  if (known) return known;
  let hash = 0;
  for (let i = 0; i < topic.length; i++) hash = (hash * 31 + topic.charCodeAt(i)) >>> 0;
  const dot = TOPIC_FALLBACK_COLORS[hash % TOPIC_FALLBACK_COLORS.length];
  return { icon: FolderOpen, dot, text: "text-foreground/80", ring: "hover:border-primary/50" };
}
