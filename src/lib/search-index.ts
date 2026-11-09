import Fuse from "fuse.js";

// ---------------------------------------------------------------------------
// Search index: every navigable surface in DSA Lab.
//
// Each entry has:
//   - id       unique key
//   - title    what the user sees
//   - subtitle supporting context (category, description, etc.)
//   - category grouping label in the results dropdown
//   - url      where clicking it navigates
//   - icon     optional lucide icon name (for visual hint)
// ---------------------------------------------------------------------------

export type SearchEntrySource = "general" | "top150" | "neetcode" | "sorting" | "template";

export type SearchEntry = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  url: string;
  icon?: string;
  /** Which problem bank or surface this entry belongs to. Used for colored badges. */
  source?: SearchEntrySource;
};

// ---------------------------------------------------------------------------
// Static entries — pages, guide sections, learning paths, question-bank
// categories, and doc sections. Templates are added at build time below.
// ---------------------------------------------------------------------------

const PAGES: SearchEntry[] = [
  {
    id: "page-home",
    title: "Home",
    subtitle: "DSA Lab — algorithm visualizer and practice platform",
    category: "Pages",
    url: "/",
    icon: "Home",
  },
  {
    id: "page-visualizer",
    title: "Open Visualizer",
    subtitle: "Paste code, add input, step through algorithm state",
    category: "Pages",
    url: "/visualizer",
    icon: "Play",
  },
  {
    id: "page-learn",
    title: "Learn",
    subtitle: "Top Interview 150, NeetCode Roadmap, Sorting Algorithms",
    category: "Pages",
    url: "/learn",
    icon: "BookOpen",
  },
  {
    id: "page-guide",
    title: "Guide",
    subtitle: "How DSA Lab works — getting started walkthrough",
    category: "Pages",
    url: "/guide",
    icon: "Route",
  },
  {
    id: "page-docs",
    title: "Technical Docs",
    subtitle: "Under the hood — AST instrumenter, worker runtime, canvas",
    category: "Pages",
    url: "/docs",
    icon: "FileText",
  },
  {
    id: "page-collections",
    title: "Saved Collections",
    subtitle: "Your saved algorithms and code snippets",
    category: "Pages",
    url: "/collections",
    icon: "Folder",
  },
];

const LEARNING_PATHS: SearchEntry[] = [
  {
    id: "path-arrays",
    title: "Arrays",
    subtitle: "Sorting and the foundation of algorithm state",
    category: "Learning Paths",
    url: "/learn",
    icon: "BarChart",
  },
  {
    id: "path-two-pointers",
    title: "Two Pointers",
    subtitle: "Binary search and narrowing the search space",
    category: "Learning Paths",
    url: "/learn",
    icon: "MoveHorizontal",
  },
  {
    id: "path-sliding-window",
    title: "Sliding Window",
    subtitle: "Subarray and substring problems in one pass",
    category: "Learning Paths",
    url: "/learn",
    icon: "PanelLeft",
  },
  {
    id: "path-recursion",
    title: "Recursion",
    subtitle: "Decompose a problem into smaller versions of itself",
    category: "Learning Paths",
    url: "/learn",
    icon: "GitBranch",
  },
  {
    id: "path-trees",
    title: "Trees",
    subtitle: "Recursive structure, level by level",
    category: "Learning Paths",
    url: "/learn",
    icon: "TreePine",
  },
  {
    id: "path-graphs",
    title: "Graphs",
    subtitle: "Traversal order and visited sets",
    category: "Learning Paths",
    url: "/learn",
    icon: "Network",
  },
  {
    id: "path-dp",
    title: "Dynamic Programming",
    subtitle: "Memoize the past to answer the future",
    category: "Learning Paths",
    url: "/learn",
    icon: "Layers",
  },
  {
    id: "path-linked-lists",
    title: "Linked Lists",
    subtitle: "Rewiring pointers instead of moving values",
    category: "Learning Paths",
    url: "/learn",
    icon: "Link",
  },
  {
    id: "path-stacks-hashing",
    title: "Stacks & Hashing",
    subtitle: "Ordering with a stack, lookup with a map",
    category: "Learning Paths",
    url: "/learn",
    icon: "Box",
  },
  {
    id: "path-matrices",
    title: "Matrices",
    subtitle: "Row, column, and cell coordinates",
    category: "Learning Paths",
    url: "/learn",
    icon: "Grid3x3",
  },
];

const QUESTION_BANKS: SearchEntry[] = [
  {
    id: "bank-top150",
    title: "Top Interview 150",
    subtitle: "150 classic problems across 23 topics",
    category: "Question Banks",
    url: "/learn",
    icon: "Award",
  },
  {
    id: "bank-neetcode",
    title: "NeetCode Roadmap",
    subtitle: "362 problems across 17 categories",
    category: "Question Banks",
    url: "/learn",
    icon: "Map",
  },
  {
    id: "bank-sorting",
    title: "Sorting Algorithms",
    subtitle: "Seven classic array-sorting algorithms, 5 languages each",
    category: "Question Banks",
    url: "/learn",
    icon: "ArrowUpDown",
  },
];

const DOC_SECTIONS: SearchEntry[] = [
  {
    id: "doc-overview",
    title: "Overview",
    subtitle: "A client-side trace pipeline — the big picture",
    category: "Documentation",
    url: "/docs#overview",
    icon: "Eye",
  },
  {
    id: "doc-stack",
    title: "Tech Stack",
    subtitle: "Next.js, acorn, Web Workers, Pyodide, CodeMirror, framer-motion",
    category: "Documentation",
    url: "/docs#stack",
    icon: "Layers",
  },
  {
    id: "doc-architecture",
    title: "Architecture",
    subtitle: "Instrumentation → sandboxed execution → normalization → rendering",
    category: "Documentation",
    url: "/docs#architecture",
    icon: "Cpu",
  },
  {
    id: "doc-trace-engine",
    title: "Trace Engine",
    subtitle: "How the acorn instrumenter and worker runtime work",
    category: "Documentation",
    url: "/docs#trace-engine",
    icon: "Zap",
  },
  {
    id: "doc-instrumentation",
    title: "Instrumentation",
    subtitle: "AST rewriting with __auto* hooks — scope-aware code transform",
    category: "Documentation",
    url: "/docs#instrumentation",
    icon: "Braces",
  },
  {
    id: "doc-worker",
    title: "Worker Runtime",
    subtitle: "Sandboxed Web Worker that executes instrumented code",
    category: "Documentation",
    url: "/docs#worker-runtime",
    icon: "Shield",
  },
  {
    id: "doc-normalization",
    title: "Step Normalization",
    subtitle: "Whitelist + matrix phase notes for safe rendering",
    category: "Documentation",
    url: "/docs#normalization",
    icon: "Filter",
  },
  {
    id: "doc-canvas",
    title: "Visualization Canvas",
    subtitle: "Structure renderers, diff highlighting, FLIP animation",
    category: "Documentation",
    url: "/docs#canvas",
    icon: "Monitor",
  },
  {
    id: "doc-languages",
    title: "Language Support",
    subtitle: "JavaScript, TypeScript, Python — native trace paths",
    category: "Documentation",
    url: "/docs#languages",
    icon: "Code2",
  },
  {
    id: "doc-auth",
    title: "Auth & Persistence",
    subtitle: "Google OAuth, session cookies, Supabase Postgres",
    category: "Documentation",
    url: "/docs#auth",
    icon: "Key",
  },
  {
    id: "doc-security",
    title: "Security Model",
    subtitle: "Code isolation, data trust, secrets management",
    category: "Documentation",
    url: "/docs#security",
    icon: "Lock",
  },
  {
    id: "doc-testing",
    title: "Testing Strategy",
    subtitle: "Golden trace tests, vitest unit tests, regression contract",
    category: "Documentation",
    url: "/docs#testing",
    icon: "FlaskConical",
  },
  {
    id: "doc-history",
    title: "Development History",
    subtitle: "From regex hack to AST rewriting — the evolution timeline",
    category: "Documentation",
    url: "/docs#history",
    icon: "Clock",
  },
];

const GUIDE_STEPS: SearchEntry[] = [
  {
    id: "guide-paste",
    title: "Paste Code",
    subtitle: "JavaScript, TypeScript, or Python — the tracer observes everything",
    category: "Guide",
    url: "/guide",
    icon: "Code2",
  },
  {
    id: "guide-input",
    title: "Add JSON Input",
    subtitle: "Use the Input tab for the data your code expects",
    category: "Guide",
    url: "/guide",
    icon: "Database",
  },
  {
    id: "guide-trace",
    title: "Control the Trace",
    subtitle: "Play, pause, step, drag timeline — Space plays, arrows step",
    category: "Guide",
    url: "/guide",
    icon: "Play",
  },
  {
    id: "guide-tour",
    title: "Take the Guided Tour",
    subtitle: "30-second walkthrough of the visualizer panels and features",
    category: "Guide",
    url: "/visualizer?tour=1",
    icon: "Sparkles",
  },
];

// ---------------------------------------------------------------------------
// Top Interview 150 problems — each navigates to /visualizer?t=top150-<no>
// ---------------------------------------------------------------------------

type Top150Entry = {
  no: number;
  title: string;
  slug: string;
  difficulty: string;
  topicTitle: string;
};

function buildTop150Entries(questions: Top150Entry[]): SearchEntry[] {
  return questions.map((q) => ({
    id: `top150-${q.no}`,
    title: `${q.title}`,
    subtitle: `#${q.no} · ${q.difficulty} · ${q.topicTitle}`,
    category: "Top Interview 150",
    url: `/visualizer?t=top150-${q.no}`,
    icon: "Hash",
    source: "top150" as const,
  }));
}

// ---------------------------------------------------------------------------
// NeetCode Roadmap problems — each navigates to /visualizer?t=top150-<no>
// (both banks share the top150-<no> id scheme; Top 150 wins on overlap).
// ---------------------------------------------------------------------------

type NeetCodeEntry = {
  no: number;
  title: string;
  slug: string;
  difficulty: string;
  topicTitle: string;
};

function buildNeetCodeEntries(questions: NeetCodeEntry[]): SearchEntry[] {
  // A question can appear in multiple topics — deduplicate by number so
  // every search entry has a unique id (avoids React key collisions).
  const seen = new Set<number>();
  return questions.filter((q) => {
    if (seen.has(q.no)) return false;
    seen.add(q.no);
    return true;
  }).map((q) => ({
    id: `neetcode-${q.no}`,
    title: `${q.title}`,
    subtitle: `#${q.no} · ${q.difficulty} · ${q.topicTitle}`,
    category: "NeetCode Roadmap",
    url: `/visualizer?t=top150-${q.no}`,
    icon: "Hash",
    source: "neetcode" as const,
  }));
}

// ---------------------------------------------------------------------------
// Sorting algorithms — each navigates to /visualizer?t=<id>
// ---------------------------------------------------------------------------

type SortingEntry = {
  id: string;
  name: string;
};

function buildSortingEntries(algos: SortingEntry[]): SearchEntry[] {
  return algos.map((a) => ({
    id: `sorting-${a.id}`,
    title: a.name,
    subtitle: "Sorting algorithm — 5 language variants",
    category: "Sorting Algorithms",
    url: `/visualizer?t=${a.id}`,
    icon: "ArrowUpDown",
    source: "sorting" as const,
  }));
}

// ---------------------------------------------------------------------------
// Algorithm templates — dynamically built from the template list.
// These are imported lazily so the index module stays lightweight for SSR.
// ---------------------------------------------------------------------------

type TemplateEntry = {
  id: string;
  name: string;
  category: string;
};

function buildTemplateEntries(templates: TemplateEntry[]): SearchEntry[] {
  // Deduplicate by name — e.g. "Bubble sort" appears in JS, Python, and Java
  // variants. Keep the first (JS) occurrence so the search results stay clean.
  const seen = new Set<string>();
  const deduped: TemplateEntry[] = [];
  for (const t of templates) {
    if (!seen.has(t.name)) {
      seen.add(t.name);
      deduped.push(t);
    }
  }
  return deduped.map((t) => ({
    id: `template-${t.id}`,
    title: t.name,
    subtitle: `Trace ${t.name} step by step — ${t.category}`,
    category: "Algorithms",
    url: `/visualizer?t=${t.id}`,
    icon: "Play",
  }));
}

// ---------------------------------------------------------------------------
// Fuse.js instance — fuzzy-search over every entry.
// ---------------------------------------------------------------------------

let _fuse: Fuse<SearchEntry> | null = null;

// Dynamic import helper — resolves templates lazily so the module can be
// imported in SSR or tests without immediately bundling the template list.
// In vitest the path alias resolves; in the browser, Next.js handles it.
let _templatePromise: Promise<TemplateEntry[]> | null = null;
let _top150Promise: Promise<Top150Entry[]> | null = null;
let _neetcodePromise: Promise<NeetCodeEntry[]> | null = null;
let _sortingPromise: Promise<SortingEntry[]> | null = null;

async function loadTemplates(): Promise<TemplateEntry[]> {
  if (!_templatePromise) {
    _templatePromise = import("@/lib/templates").then(
      (mod) => mod.algorithmTemplates as unknown as TemplateEntry[],
    );
  }
  return _templatePromise;
}

async function loadTop150(): Promise<Top150Entry[]> {
  if (!_top150Promise) {
    _top150Promise = import("@/lib/top150").then((mod) => {
      const topics = mod.top150Topics;
      return topics.flatMap((topic) =>
        topic.questions.map((q) => ({
          no: q.no,
          title: q.title,
          slug: q.slug,
          difficulty: q.difficulty,
          topicTitle: topic.title,
        })),
      );
    });
  }
  return _top150Promise;
}

async function loadNeetCode(): Promise<NeetCodeEntry[]> {
  if (!_neetcodePromise) {
    _neetcodePromise = import("@/lib/neetcode").then((mod) => {
      const topics = mod.neetcodeTopics;
      return topics.flatMap((topic) =>
        topic.questions.map((q) => ({
          no: q.no,
          title: q.title,
          slug: q.slug,
          difficulty: q.difficulty,
          topicTitle: topic.title,
        })),
      );
    });
  }
  return _neetcodePromise;
}

async function loadSorting(): Promise<SortingEntry[]> {
  if (!_sortingPromise) {
    _sortingPromise = import("@/lib/sorting-answers").then((mod) =>
      Object.values(mod.sortingAlgoAnswers).map((a) => ({
        id: a.id,
        name: a.id
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      })),
    );
  }
  return _sortingPromise;
}

async function getFuse(): Promise<Fuse<SearchEntry>> {
  if (_fuse) return _fuse;

  const [templates, top150, neetcode, sorting] = await Promise.all([
    loadTemplates(),
    loadTop150(),
    loadNeetCode(),
    loadSorting(),
  ]);

  // Deduplicate across banks: if a problem number appears in both Top 150 and
  // NeetCode, keep both entries (they navigate to the same URL but have
  // different source badges and subtitles showing which bank they come from).
  const allEntries = [
    ...PAGES,
    ...LEARNING_PATHS,
    ...QUESTION_BANKS,
    ...DOC_SECTIONS,
    ...GUIDE_STEPS,
    ...buildTemplateEntries(templates),
    ...buildTop150Entries(top150),
    ...buildNeetCodeEntries(neetcode),
    ...buildSortingEntries(sorting),
  ];

  _fuse = new Fuse(allEntries, {
    keys: [
      { name: "title", weight: 3 },
      { name: "subtitle", weight: 1.5 },
      { name: "category", weight: 0.5 },
      { name: "source", weight: 0.3 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
  });

  return _fuse;
}

// ---------------------------------------------------------------------------
// Default suggestions — shown when the palette first opens (empty query).
// A curated mix of the most popular algorithms and key pages.
// ---------------------------------------------------------------------------

const DEFAULT_SUGGESTIONS: SearchEntry[] = [
  {
    id: "default-visualizer",
    title: "Open Visualizer",
    subtitle: "Paste code, add input, step through algorithm state",
    category: "Quick links",
    url: "/visualizer",
    icon: "Play",
    source: "general",
  },
  {
    id: "default-learn",
    title: "Learn",
    subtitle: "Top Interview 150, NeetCode Roadmap, Sorting Algorithms",
    category: "Quick links",
    url: "/learn",
    icon: "BookOpen",
    source: "general",
  },
  {
    id: "default-two-sum-t150",
    title: "Two Sum",
    subtitle: "#1 · Easy · Array / Hashing \u2014 the interview classic",
    category: "Top Interview 150",
    url: "/visualizer?t=top150-1",
    icon: "Hash",
    source: "top150",
  },
  {
    id: "default-valid-paren-t150",
    title: "Valid Parentheses",
    subtitle: "#20 · Easy · Stack \u2014 classic stack matching",
    category: "Top Interview 150",
    url: "/visualizer?t=top150-20",
    icon: "Hash",
    source: "top150",
  },
  {
    id: "default-lru-cache-t150",
    title: "LRU Cache",
    subtitle: "#146 · Medium · Hash Map \u2014 design + data structure",
    category: "Top Interview 150",
    url: "/visualizer?t=top150-146",
    icon: "Hash",
    source: "top150",
  },
  {
    id: "default-bubble-sort",
    title: "Bubble sort",
    subtitle: "The classic O(n\u00b2) swap-based sorting algorithm",
    category: "Sorting Algorithms",
    url: "/visualizer?t=bubble-sort",
    icon: "ArrowUpDown",
    source: "sorting",
  },
  {
    id: "default-merge-sort",
    title: "Merge sort",
    subtitle: "Divide-and-conquer O(n log n) sorting",
    category: "Sorting Algorithms",
    url: "/visualizer?t=merge-sort",
    icon: "ArrowUpDown",
    source: "sorting",
  },
  {
    id: "default-binary-search",
    title: "Binary search",
    subtitle: "O(log n) search on a sorted array",
    category: "Algorithms",
    url: "/visualizer?t=binary-search",
    icon: "Play",
    source: "template",
  },
  {
    id: "default-fibonacci",
    title: "Fibonacci (memoized)",
    subtitle: "Top-down DP with memoization \u2014 watch the recursion tree",
    category: "Algorithms",
    url: "/visualizer?t=fibonacci",
    icon: "Play",
    source: "template",
  },
  {
    id: "default-invert-tree",
    title: "Invert binary tree",
    subtitle: "Recursive tree traversal \u2014 swap left and right children",
    category: "Algorithms",
    url: "/visualizer?t=invert-binary-tree",
    icon: "Play",
    source: "template",
  },
];

export function getDefaultSuggestions(): SearchEntry[] {
  return DEFAULT_SUGGESTIONS;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchAll(query: string): Promise<SearchEntry[]> {
  if (!query.trim()) return getDefaultSuggestions();
  const fuse = await getFuse();
  return fuse.search(query).map((result) => result.item);
}

/** Group results by category, preserving category insertion order. */
export function groupByCategory(results: SearchEntry[]): Map<string, SearchEntry[]> {
  const map = new Map<string, SearchEntry[]>();
  for (const entry of results) {
    const list = map.get(entry.category) ?? [];
    list.push(entry);
    map.set(entry.category, list);
  }
  return map;
}
