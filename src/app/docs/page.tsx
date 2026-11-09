import type { ComponentType, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Braces,
  Bug,
  ChevronDown,
  Code2,
  Cpu,
  Database,
  FileCode2,
  Gauge,
  GitBranch,
  KeyRound,
  Lock,
  MonitorPlay,
  Network,
  Play,
  Rocket,
  Route,
  ShieldCheck,
} from "lucide-react";

import { MermaidDiagram } from "@/components/docs/mermaid-diagram";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Technical documentation",
  alternates: { canonical: "/docs" },
  description:
    "How DSA Lab is built: the acorn AST instrumenter, the sandboxed Web Worker trace runtime, step normalization, the visualization canvas, Pyodide-based Python tracing, and the auth & data layer.",
};

const TOC: Array<{ id: string; label: string; depth?: number }> = [
  { id: "overview", label: "Overview" },
  { id: "stack", label: "Tech stack" },
  { id: "architecture", label: "Architecture at a glance" },
  { id: "trace-engine", label: "The trace engine" },
  { id: "instrumentation", label: "Instrumentation", depth: 1 },
  { id: "worker-runtime", label: "Worker runtime", depth: 1 },
  { id: "normalization", label: "Step normalization", depth: 1 },
  { id: "entry-harness", label: "Entry harness", depth: 1 },
  { id: "canvas", label: "The visualization canvas" },
  { id: "languages", label: "Language support" },
  { id: "auth", label: "Auth & persistence" },
  { id: "security", label: "Security model" },
  { id: "testing", label: "Testing" },
  { id: "history", label: "Development history" },
  { id: "local", label: "Run & contribute" },
];

const STACK = [
  {
    icon: FileCode2,
    name: "Next.js 16 · React 19 · TypeScript",
    copy: "App Router server components for marketing, guide, and learn pages; the visualizer workspace is a client-side React app. Type-checked end to end.",
  },
  {
    icon: Braces,
    name: "acorn",
    copy: "Tiny, fast ECMAScript parser. The tracer rewrites user code by parsing it into an AST and splicing instrumentation calls into the source — no regex brace-counting.",
  },
  {
    icon: MonitorPlay,
    name: "Web Workers (Blob)",
    copy: "User code never runs on the main thread. Instrumented source is executed inside a Blob-constructed Worker with networking disabled — a lightweight browser sandbox.",
  },
  {
    icon: Code2,
    name: "Pyodide",
    copy: "Real CPython compiled to WebAssembly. Python tracing runs natively in the browser via sys.settrace — no AI translation, no server round-trip.",
  },
  {
    icon: Boxes,
    name: "CodeMirror 6",
    copy: "The code editor with line numbers, syntax highlighting, and a decoration that highlights the active trace line as you step.",
  },
  {
    icon: Gauge,
    name: "framer-motion",
    copy: "FLIP-animates array bars when values swap positions, so a bubble-sort exchange visibly slides two bars into each other's places.",
  },
  {
    icon: KeyRound,
    name: "jose + Google OAuth",
    copy: "Server-side PKCE OAuth against Google, minting a stateless HS256 session JWT (httpOnly cookie). No third-party auth provider.",
  },
  {
    icon: Database,
    name: "Supabase (Postgres + Storage)",
    copy: "Plain Postgres for users, saved algorithms, and feedback, plus a storage bucket for feedback screenshots. Supabase Auth is not used.",
  },
  {
    icon: Network,
    name: "NVIDIA NIM",
    copy: "AI provider: translates Java, C++, and TypeScript the annotation stripper can't handle into instrumented JS with //# line mapping, via moonshotai/kimi-k3 on the NVIDIA NIM API (NVIDIA_API_KEY from build.nvidia.com). JS/TS/Python never touch it. Cached client-side (LRU) and server-side in Postgres; identical runs skip the LLM call and the hourly/daily quota.",
  },
  {
    icon: Rocket,
    name: "Vercel",
    copy: "Deployment with Analytics and Speed Insights wired into the root layout.",
  },
];

const PIPELINE_CHART = `flowchart LR
    A["Your code + JSON input<br/>(browser, main thread)"] --> B["acorn instrumenter<br/>(AST rewrite)"]
    B --> C["Instrumented JS<br/>with __auto* hooks"]
    C --> D["Blob Web Worker<br/>sandboxed runtime — no network"]
    D --> E["Step snapshots<br/>deep-cloned, deduplicated, ≤ 3000"]
    E --> F["normalize()<br/>whitelist + matrix phase notes"]
    F --> G["VisualizationCanvas<br/>renderers + playback + op counters"]`;

const TRACE_FLOW_CHART = `flowchart TB
    S["User code"] --> P["acorn parse<br/>+ scope-aware AST walk"]
    P --> W["Rewritten source:<br/>__autoCapture · __autoBranch<br/>__autoEnter · __autoReturn<br/>__autoAccess · __autoRecord"]
    W --> R["Sandboxed Web Worker<br/>executes + emits snapshots"]
    R --> N["normalizeSteps<br/>whitelist + matrix phases"]
    N --> V["VisualStep[]<br/>one snapshot per state change"]`;

const CANVAS_FLOW_CHART = `flowchart TB
    S["VisualStep + previous step"] --> D{"Which structures<br/>does the step carry?"}
    D -->|"array"| ARR["Array bars + pointer arrows"]
    D -->|"string"| STR["Characters + window band"]
    D -->|"hashMap"| MAP["Hash map panel"]
    D -->|"matrix"| MAT["Grid + active cell"]
    D -->|"graph"| GR["SVG graph + discovery order"]
    D -->|"linkedList / tree"| LL["Node chain + active node"]
    D -->|"callStack"| CS["Recursion frames"]
    S --> DIFF["Diff vs previous step"]
    DIFF --> H["Changed cells / indices<br/>highlighted with tooltips"]
    S --> OPS["Operation counters:<br/>comparisons · swaps · writes"]`;

const AUTH_SEQUENCE_CHART = `sequenceDiagram
    participant B as Browser
    participant A as Next.js API
    participant G as Google
    participant D as Supabase (Postgres)
    B->>A: GET /api/auth/google (PKCE challenge)
    A->>G: redirect to consent screen
    G-->>B: authorization code
    B->>A: GET /api/auth/callback?code=
    A->>G: exchange code for ID token
    A->>D: find or create user
    A-->>B: set httpOnly session cookie
    B->>A: requests with session cookie
    A->>D: scoped queries (service-role key)`;

const PYTHON_FLOW_CHART = `flowchart LR
    PY["Python source"] --> PO["Pyodide<br/>real CPython in WASM"]
    PO --> ST["sys.settrace<br/>line tracer"]
    ST --> EV["Raw events:<br/>line · call · return · print"]
    EV --> PS["python-steps.ts<br/>→ VisualStep[]"]`;

const INSTRUMENTED = `// before — user's code
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

// after — what the tracer actually runs (conceptual)
__autoCapture(1, {}, "Start");
function binarySearch(arr, target) {
  __autoEnter(1, "binarySearch", { arr, target });
  let left = 0, right = arr.length - 1;
  while (__autoBranch(4, "for left <= right", (left <= right), { left, right, arr })) {
    const mid = Math.floor((left + right) / 2);
    if (__autoBranch(6, "if arr[mid] === target", (arr[mid] === target), { left, right, mid, arr }))
      return __autoReturn(6, { left, right, mid, arr }, "return mid", mid);
    if (__autoBranch(7, "if arr[mid] < target", (arr[mid] < target), { left, right, mid, arr }))
      left = mid + 1;
    else right = mid - 1;
    __autoCapture(9, { left, right, mid, arr }, "left = mid + 1");
  }
  return __autoReturn(10, { left, right }, "return -1", -1);
}`;

const HELPER_REF = `__autoCapture(line, values, label)      emit a step snapshot after a statement
__autoBranch(line, label, value, values)  record a condition's truthiness, count comparisons
__autoEnter(line, name, values)           push a recursive call-stack frame
__autoReturn(line, values, label, value)  record the return value, pop the frame
__autoAccess(name, obj, r, c, src, kind)  capture an exact matrix cell read / write
__autoRecord(name, obj, r, c, src)        side-effect-free cell record inside conditions`;

const SAMPLE_STEP = `{
  "title": "Branch",
  "note": "if arr[mid] < target → false",
  "line": 7,
  "array": [1, 3, 5, 7, 9],
  "active": [3],            // every in-bounds integer pointer lands here
  "range": [0, 4],          // left … right search band
  "pointers": { "left": 0, "right": 4, "mid": 2 },
  "ops": { "comparisons": 3, "swaps": 0, "writes": 0 }
}`;

const HISTORY = [
  {
    label: "Original visualizer",
    copy: "A JS-only prototype with a brace-counting regex instrumenter embedded inside the visualizer component. Traces were fragile — ternaries, multi-line statements, and branch decisions were silently missed.",
  },
  {
    label: "AST instrumentation + golden tests",
    copy: "The tracer was extracted into a dedicated module and rewritten with acorn. A custom walker with lexical scoping replaced the regex, and golden trace tests became the behavioral contract for every change.",
  },
  {
    label: "Matrix tracing",
    copy: "Double-indexed accesses (grid[r][c]) are rewritten so the exact cell, access source, and read/write kind are captured — enabling active-cell highlighting and plain-language phase narration.",
  },
  {
    label: "Resizable IDE revamp",
    copy: "The workspace became a CodeMirror-based, resizable IDE with a first-run tour, zoomable panels, and student learning tools.",
  },
  {
    label: "Native Python tracing",
    copy: "Pyodide + sys.settrace landed: real CPython in the browser traces Python with true line numbers and zero AI calls. Python is the one non-JS language with a genuinely native path.",
  },
  {
    label: "Rich structure rendering",
    copy: "Linked lists and binary trees get stable node ids with active-node highlighting; a platform entry harness converts pasted solutions into runnable traces and back into judge-encoded answers.",
  },
  {
    label: "Recursion call tree & comparisons",
    copy: "Call/Return steps feed an interactive call tree, and cumulative comparisons / swaps / writes counters turn traces into complexity lessons.",
  },
  {
    label: "Practice curriculum",
    copy: "The Top Interview 150 bank, topic-grouped learning paths, verified expected answers with pass/fail verdicts, and a side-by-side compare mode.",
  },
  {
    label: "Direct Google OAuth",
    copy: "Supabase Auth was removed entirely: server-side PKCE OAuth + an httpOnly session cookie, with the users table migrated and hardened with RLS.",
  },
  {
    label: "Sharing",
    copy: "Shareable run links and a chrome-free embed mode — the distribution loop.",
  },
  {
    label: "AI spend protection & blank-file start",
    copy: "Java/C++ (AI-translated) moved behind sign-in with server-enforced rate limits (10/hr, 60/day, env-configurable), a Postgres translation cache that skips the LLM call and the quota on identical runs, a signed-in quota badge, and an admin spend dashboard. The workspace gained a \"New · Blank\" entry point that clears the editor and explains the input contract.",
  },
];

const COMMANDS = `npm install      # install dependencies
npm run dev      # development server → http://localhost:3000
npm run build    # production build
npm run test     # vitest unit tests (incl. golden trace tests)
npm run lint     # eslint`;

function Section({
  id,
  kicker,
  title,
  intro,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-12">
      <p className="text-sm font-medium text-primary">{kicker}</p>
      <h2 className="mt-2 text-2xl font-medium tracking-normal sm:text-3xl">{title}</h2>
      {intro ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{intro}</p> : null}
      <div className="mt-6 space-y-6">{children}</div>
    </section>
  );
}

function SubHeading({ icon: Icon, children }: { icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-medium">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      {children}
    </h3>
  );
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-md border bg-muted/30">
      {title ? (
        <div className="border-b bg-muted/40 px-4 py-2 font-mono text-xs text-muted-foreground">{title}</div>
      ) : null}
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-foreground/90">{code}</pre>
    </div>
  );
}

function Note({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-md border p-4 text-sm leading-6",
        tone === "warn"
          ? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"
          : "border-border bg-muted/30 text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
      <span className="text-sm leading-6 text-muted-foreground">{children}</span>
    </li>
  );
}

export default function DocsPage() {
  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-start">
          {/* Sticky table of contents */}
          <aside className="hidden lg:sticky lg:top-20 lg:block">
            <nav aria-label="Table of contents">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
              <ul className="space-y-1 border-l border-border">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={cn(
                        "block border-l-2 border-transparent py-1 text-sm transition-colors hover:text-foreground",
                        item.depth ? "pl-6 text-muted-foreground/70" : "-ml-px border-border/60 pl-3 font-medium text-foreground/80",
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0">
            {/* Hero */}
            <section className="max-w-3xl pb-12">
              <p className="text-sm font-medium text-primary">Technical documentation</p>
              <h1 className="mt-3 text-4xl font-medium leading-tight tracking-normal sm:text-5xl">
                Under the hood of DSA Lab.
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                DSA Lab&apos;s core bet is that you should never write visualization code. Paste an algorithm, add JSON
                input, and the tracer infers every state change — arrays, strings, maps, matrices, graphs, linked lists,
                trees, and recursion frames — with no custom annotations. This page documents how that works: the trace
                engine, the sandbox, and the canvas that turns steps into pictures.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <Link href="/guide">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    User guide instead
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/visualizer">
                    Open the visualizer
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </section>

            {/* Mobile table of contents — collapsible on small screens (the
                sticky sidebar is hidden below lg, so this is how mobile
                readers jump between sections). */}
            <details className="group mb-12 rounded-md border bg-muted/30 lg:hidden">
              <summary className="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium">
                On this page
                <ChevronDown
                  className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <nav aria-label="Table of contents" className="border-t px-4 py-3">
                <ul className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                  {TOC.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={cn(
                          "block py-1.5 text-sm transition-colors hover:text-foreground",
                          item.depth
                            ? "pl-4 text-muted-foreground/70"
                            : "font-medium text-foreground/80",
                        )}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </details>

            {/* Overview */}
            <Section id="overview" kicker="01 · Overview" title="A client-side trace pipeline">
              <p className="text-sm leading-7 text-muted-foreground">
                Everything that matters happens in the browser. Instrumentation, execution, step capture, and rendering
                are all client-side; the server only handles sign-in, saved collections, and feedback. There is no
                backend that runs your code — the sandbox is a Web Worker, not a server.
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                The pipeline has three stages. First, <strong className="text-foreground">acorn</strong> parses the user&apos;s
                code and the instrumenter rewrites it so that every state change calls a capture hook. Second, the
                rewritten code runs inside a <strong className="text-foreground">sandboxed Web Worker</strong> that executes it and
                emits one self-contained snapshot per meaningful change. Third, the <strong className="text-foreground">canvas</strong> is a
                pure function of those snapshots: it renders whatever structures a step carries and highlights what
                changed since the previous step.
              </p>
              <Note>
                This page is the public, engineering-level write-up — deliberately detailed, deliberately free of
                secrets. Day-to-day ops (env vars, database migrations, Vercel) live in the repo&apos;s SETUP.md.
              </Note>
            </Section>

            {/* Tech stack */}
            <Section
              id="stack"
              kicker="02 · Tech stack"
              title="Chosen deliberately, not by default"
              intro="Each dependency earns its place — most exist to make the trace pipeline fast, safe, or self-contained."
            >
              <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
                {STACK.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.name} className="bg-card p-5">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 className="mt-3 text-sm font-medium">{item.name}</h3>
                      <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{item.copy}</p>
                    </article>
                  );
                })}
              </div>
            </Section>

            {/* Architecture */}
            <Section
              id="architecture"
              kicker="03 · Architecture"
              title="Architecture at a glance"
              intro="The full trace pipeline, from pasted code to rendered state."
            >
              <MermaidDiagram
                id="pipeline"
                chart={PIPELINE_CHART}
                caption="The full trace pipeline: instrumentation → sandboxed execution → normalized steps → rendering."
                flow={[
                  "Your code + JSON input (browser, main thread)",
                  "acorn instrumenter — rewrites the source (AST)",
                  "Instrumented JS with __auto* hooks",
                  "Blob Web Worker — sandboxed runtime, no network",
                  "Step snapshots — deep-cloned, deduplicated, ≤ 3000",
                  "normalize() — whitelist + matrix phase notes",
                  "VisualizationCanvas — renderers + playback + op counters",
                ]}
              />
              <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
                <article className="bg-card p-5">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h3 className="text-sm font-medium">Client (browser)</h3>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    Instrumentation, worker execution, step normalization, rendering, playback, and code editing. No
                    app secrets ever reach the client.
                  </p>
                </article>
                <article className="bg-card p-5">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h3 className="text-sm font-medium">Server (Next.js routes)</h3>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    Google OAuth dance, session cookie minting, saved algorithms, feedback (with image upload), and the
                    AI translation route (NVIDIA NIM) with per-user rate limits and a Postgres cache.
                  </p>
                </article>
              </div>
              <ul className="space-y-2">
                <Bullet>
                  <strong className="text-foreground">Offline-first by design:</strong> a trace needs no network. Only
                  sign-in, saving, and feedback require the server — the visualizer works with zero keys configured.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">One shared schema:</strong> JS, TS, and Python all converge on the
                  same VisualStep type, so the canvas, playback bar, and explainer never care which language produced a
                  step.
                </Bullet>
              </ul>
            </Section>

            {/* Trace engine */}
            <Section
              id="trace-engine"
              kicker="04 · The trace engine"
              title="How the tracer works"
              intro="The tracer lives in src/lib/trace/. It has four responsibilities: rewrite code, run it safely, normalize what came back, and bridge pasted online-judge solutions."
            >
              <MermaidDiagram
                id="trace-flow"
                chart={TRACE_FLOW_CHART}
                caption="From source to a step array: the instrumenter rewrites code, the worker executes it, normalization makes it safe to render."
                flow={[
                  "User code",
                  "acorn parse + scope-aware AST walk",
                  "Rewritten source: __autoCapture · __autoBranch · __autoEnter · __autoReturn · __autoAccess · __autoRecord",
                  "Sandboxed Web Worker executes and emits snapshots",
                  "normalizeSteps — whitelist + matrix phases",
                  "VisualStep[] — one snapshot per state change",
                ]}
              />
              <div className="space-y-8">
                <div className="space-y-4">
                  <SubHeading icon={Braces}>Instrumentation — rewriting code so state changes are observable</SubHeading>
                  <p className="text-sm leading-7 text-muted-foreground">
                    The instrumenter parses user code with acorn (locations enabled) and walks the AST with a custom
                    scope-aware walker. Instead of evaluating code and guessing at state, it <em>rewrites</em> the source
                    so every interesting moment explicitly reports itself. Statements get a capture call appended; branch
                    conditions are wrapped so their truthiness becomes a step; functions get enter/return hooks; and
                    double-indexed matrix accesses become instrumented calls so the exact cell is traced.
                  </p>
                  <CodeBlock title="Before → after (simplified)" code={INSTRUMENTED} />
                  <p className="text-sm leading-7 text-muted-foreground">
                    Six hooks cover every kind of step the UI understands:
                  </p>
                  <CodeBlock title="The __auto* protocol" code={HELPER_REF} />
                  <p className="text-sm leading-7 text-muted-foreground">
                    The walker also handles the language&apos;s sharp edges, all of which would corrupt a naive
                    rewrite:
                  </p>
                  <ul className="space-y-2">
                    <Bullet>
                      <strong className="text-foreground">Bare control bodies</strong> — <code className="font-mono text-xs">if (c) stmt; else</code>{" "}
                      gets wrapped in a block so the inserted capture doesn&apos;t detach the <code className="font-mono text-xs">else</code>.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Temporal dead zones</strong> — a ternary inside{" "}
                      <code className="font-mono text-xs">const x = cond ? a : b</code> evaluates while <code className="font-mono text-xs">x</code> is
                      still uninitialized, so names declared by the enclosing declarator are excluded from its capture.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">var hoisting</strong> — <code className="font-mono text-xs">var</code> names declared inside
                      a loop body are collected so loop-condition branches can read them on later iterations.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Overlapping rewrites</strong> — wrapper edits (matrix writes,
                      returns) claim their source span so nested edits don&apos;t double-apply against stale coordinates.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Line mapping</strong> — line numbers come from the AST, and{" "}
                      <code className="font-mono text-xs">{"//# line: N"}</code> directives (emitted by AI translation) remap steps back to the
                      user&apos;s original source.
                    </Bullet>
                  </ul>
                </div>

                <div className="space-y-4">
                  <SubHeading icon={Bug}>Worker runtime — a sandboxed executor that emits steps</SubHeading>
                  <p className="text-sm leading-7 text-muted-foreground">
                    The rewritten code never touches the main thread. A Blob-constructed Worker (built from a template
                    string via <code className="font-mono text-xs">URL.createObjectURL</code>) receives the instrumented source and the parsed
                    input JSON, executes it with an async function wrapper, and posts the step list back. The worker is
                    deliberately boring — it has no UI, no DOM, no network.
                  </p>
                  <ul className="space-y-2">
                    <Bullet>
                      <strong className="text-foreground">Sandboxing:</strong> fetch, XMLHttpRequest, WebSocket, and
                      importScripts are all disabled, so user code cannot exfiltrate data or load anything.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Snapshot integrity:</strong> every step is deep-cloned at emit
                      time via a cycle-aware clone — later mutations can never rewrite history, and cyclic structures
                      (Floyd&apos;s linked list!) serialize as the marker <code className="font-mono text-xs">[cycle]</code>.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Coalescing:</strong> a step identical to the previous one is
                      dropped — most loop iterations change nothing visible, and skipping them keeps traces short.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Limits:</strong> a 3,000-step cap (partial steps are kept so
                      the UI can explain the truncation) and a 5–15 s adaptive timeout on the main thread.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Structure detection:</strong> heuristics classify every
                      in-scope value into array / string / hash map / matrix / graph / set / linked list / tree, and
                      name-based routing decides stack vs queue vs visited.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Node registries:</strong> each ListNode / TreeNode object gets
                      a stable id across the whole run; steps carry only ids + primitives, so even cyclic lists stay
                      JSON-safe and node boxes never shuffle between steps.
                    </Bullet>
                    <Bullet>
                      <strong className="text-foreground">Operation counters:</strong> comparisons (branch conditions
                      containing comparison operators), swaps (exactly-two-position exchanges), and writes (changed
                      cells, positions, or characters) accumulate across the run.
                    </Bullet>
                  </ul>
                </div>

                <div className="space-y-4">
                  <SubHeading icon={ShieldCheck}>Step normalization — a whitelist, not a trust boundary</SubHeading>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Raw worker steps are untrusted data. <code className="font-mono text-xs">normalizeSteps</code> whitelists every field a
                    step may carry, coerces types (numbers stay numbers, garbage drops out), and then derives a
                    human-readable <em>phase</em> note for matrix steps — BFS vs DFS context, cell changes, traversal
                    movement, and the exact instrumented access. The canvas only ever sees normalized steps.
                  </p>
                  <CodeBlock title="A normalized step (the shape the canvas renders)" code={SAMPLE_STEP} />
                </div>

                <div className="space-y-4">
                  <SubHeading icon={Route}>Entry harness — pasted online-judge solutions just work</SubHeading>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Students paste solutions in platform format — <code className="font-mono text-xs">class Solution &#123; twoSum(nums, target) &#125;</code>{" "}
                    or a bare function — which never references the app&apos;s <code className="font-mono text-xs">input</code> JSON. The harness
                    detects the entry point, maps the input JSON onto its parameters (by name, else positionally),
                    converts judge-style arrays into real ListNode / TreeNode chains, invokes the entry, and returns
                    the result. The harness is appended <em>after</em> instrumentation, so helper functions build
                    lists and trees without polluting the trace. On the way out, ListNode / TreeNode / GraphNode results
                    are converted back to the judge&apos;s array encoding so the output strip shows{" "}
                    <code className="font-mono text-xs">[1, 2, 3, 4]</code>, not nested JSON.
                  </p>
                </div>
              </div>
            </Section>

            {/* Canvas */}
            <Section
              id="canvas"
              kicker="05 · Rendering"
              title="The visualization canvas"
              intro="The canvas is a pure function of (current step, previous step). Render what the step carries, diff against the last one, animate the difference."
            >
              <MermaidDiagram
                id="canvas-flow"
                chart={CANVAS_FLOW_CHART}
                caption="One step fans out to every structure it carries; the diff and the operation counters explain what actually changed."
                flow={[
                  "VisualStep + previous step",
                  "Structure detection: array · string · hashMap · matrix · graph · linkedList/tree · callStack",
                  "Each structure renders in its own panel",
                  "Diff vs previous step — changed cells highlighted with tooltips",
                  "Operation counters: comparisons · swaps · writes",
                ]}
              />
              <ul className="space-y-2">
                <Bullet>
                  <strong className="text-foreground">Structure renderers</strong> — arrays as bars, strings with
                  sliding-window bands, hash maps, matrices with an active cell, graphs as SVG with a layered BFS
                  layout and discovery-order badges, linked lists and trees with stable node ids, plus call-stack
                  frames and stack/queue/visited rows. A step renders every structure it carries at once, in a grid.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Pointer arrows &amp; range bands</strong> — every integer-valued
                  in-bounds variable (i, left, right, k, slow …) becomes a labeled arrow above the array or string;
                  left/right-style pairs draw a dashed range band between them.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Diff highlighting</strong> — changed array positions, string
                  characters, matrix cells, hash-map entries, and linked-list values/links are colored against the
                  previous step, with <em>changed from X</em> tooltips.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">FLIP animation</strong> — array bars are keyed by value occurrence
                  and animated with framer-motion&apos;s layout mode, so a swap visibly slides two bars into each
                  other&apos;s spots instead of popping.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Operation counters</strong> — comparisons, swaps, and writes are
                  shown per step and update as you play, turning a trace into a complexity lesson.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Explanation layer</strong> — explainStep derives a plain-English
                  sentence for each step from the data alone (no AI), and matrix phase notes narrate BFS/DFS/recursion
                  context.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Playback</strong> — play/pause, step back/forward, jump to
                  first/last, a draggable timeline, speed control, and keyboard shortcuts (space, ←/→, Home/End), with
                  the active line highlighted in the editor.
                </Bullet>
              </ul>
            </Section>

            {/* Languages */}
            <Section
              id="languages"
              kicker="06 · Languages"
              title="Language support"
              intro="Three languages run today. Each uses the cheapest path that produces a trustworthy trace."
            >
              <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-3">
                <article className="bg-card p-5">
                  <h3 className="text-sm font-medium">JavaScript</h3>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    Native. Parsed and instrumented locally with acorn; runs in the worker. No network, no AI, no
                    translation — this is the reference path.
                  </p>
                </article>
                <article className="bg-card p-5">
                  <h3 className="text-sm font-medium">TypeScript</h3>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    Type annotations are stripped locally (judge-style signatures, interfaces, casts) so it stays on
                    the fast path. Exotic type syntax falls back to AI translation, and emitted{" "}
                    <code className="font-mono text-xs">{"//# line:"}</code> directives keep line mapping honest.
                  </p>
                </article>
                <article className="bg-card p-5">
                  <h3 className="text-sm font-medium">Python</h3>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    Real CPython via Pyodide (WASM) with a sys.settrace harness — the same technique Python Tutor uses.
                    Raw events are converted to VisualSteps with true line numbers; zero AI calls.
                  </p>
                </article>
              </div>
              <MermaidDiagram
                id="python-flow"
                chart={PYTHON_FLOW_CHART}
                caption="Python never goes through the JS instrumenter — CPython's own tracer feeds the same VisualStep schema."
                flow={[
                  "Python source",
                  "Pyodide — real CPython in WASM",
                  "sys.settrace line tracer",
                  "Raw events: line · call · return · print",
                  "python-steps.ts → VisualStep[]",
                ]}
              />
              <Note>
                Java and C++ are available via the AI translation path (NVIDIA NIM → instrumented JS with //# line
                mapping back to the original source); Go, Rust, and friends still appear as coming-soon. Because every
                Java/C++ run is a paid LLM call, those languages are gated behind sign-in (server-enforced, not just
                hidden in the picker), signed-in users get an hourly/daily translation budget (default 10/hour, 60/day,
                env-configurable), and identical runs are served from a Postgres cache before the quota is touched.
                Language detection is a weighted regex scorer with careful tie-breaking: ambiguous code prefers
                JavaScript (a wrong local parse fails fast with a clear error), except JS↔TS ties, which prefer
                TypeScript since the stripper is a no-op on plain JS.
              </Note>
            </Section>

            {/* Auth */}
            <Section
              id="auth"
              kicker="07 · Accounts"
              title="Auth & persistence"
              intro="Sign-in is first-party and minimal: Google OAuth straight to an httpOnly cookie, with Supabase used as plain Postgres."
            >
              <MermaidDiagram
                id="auth-flow"
                chart={AUTH_SEQUENCE_CHART}
                caption="The OAuth dance: the app talks to Google itself, then mints a session cookie — no hosted auth provider in the middle."
                flow={[
                  "Browser → GET /api/auth/google (PKCE challenge)",
                  "Redirect to Google consent screen → authorization code",
                  "Callback exchanges the code for an ID token",
                  "Find or create the user in Postgres",
                  "Set the httpOnly session cookie",
                  "Requests with the cookie → scoped server-side queries",
                ]}
              />
              <ul className="space-y-2">
                <Bullet>
                  <strong className="text-foreground">Direct Google OAuth</strong> — the app runs the PKCE dance itself
                  against accounts.google.com (no Supabase Auth, no hosted provider), verifies the ID-token signature
                  server-side, finds or creates the user in the <code className="font-mono text-xs">users</code> table, and mints the session.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Sessions</strong> — a stateless HS256 JWT (signed with{" "}
                  <code className="font-mono text-xs">SESSION_SECRET</code> via jose) in an httpOnly, SameSite=Lax,
                  Secure-in-prod cookie named dsa_session, valid 30 days. Nothing in the browser can read it.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Data</strong> — users, saved algorithms, and feedback live in
                  Postgres; feedback screenshots in a storage bucket. Every DB access goes through the service-role key
                  server-side; the browser never talks to Supabase directly.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Admins</strong> — a <code className="font-mono text-xs">users.is_admin</code> flag,
                  re-read from the database on every admin request. The cookie is never trusted for privileges.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Hardened by migration</strong> — RLS was enabled and anon/authenticated
                  grants revoked on the users table (a Supabase default had left emails readable and is_admin writable).
                </Bullet>
              </ul>
            </Section>

            {/* Security */}
            <Section
              id="security"
              kicker="08 · Trust"
              title="Security model"
              intro="The product runs arbitrary user code, so the threat model is taken seriously — and mostly solved by never letting that code near anything."
            >
              <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2">
                <article className="bg-card p-5">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h3 className="text-sm font-medium">Code isolation</h3>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    User code runs only inside a dedicated Web Worker with network APIs and importScripts disabled. A
                    timeout and step cap bound runaway loops.
                  </p>
                </article>
                <article className="bg-card p-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h3 className="text-sm font-medium">Data trust</h3>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                    Steps are normalized through a strict whitelist — arbitrary code cannot inject fields into the UI.
                    All DB access is server-side with the service-role key.
                  </p>
                </article>
              </div>
              <ul className="space-y-2">
                <Bullet>
                  <strong className="text-foreground">Secrets stay server-side</strong> — the service-role key, Google
                  secret, and session secret are server-only env vars, never <code className="font-mono text-xs">NEXT_PUBLIC_</code>, never
                  committed. .env.local is gitignored.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Python&apos;s exception</strong> — the Pyodide worker may reach only
                  the pinned Pyodide CDN (it needs the WASM runtime); everything else is blocked.
                </Bullet>
              </ul>
            </Section>

            {/* Testing */}
            <Section
              id="testing"
              kicker="09 · Quality"
              title="Testing strategy"
              intro="The tracer is the whole product, so its behavior is pinned down by golden trace tests."
            >
              <ul className="space-y-2">
                <Bullet>
                  <strong className="text-foreground">Golden trace tests</strong> — for every built-in template, the
                  exact worker source runs under Node via <code className="font-mono text-xs">runTraceInNode</code>, which polyfills{" "}
                  <code className="font-mono text-xs">self</code> so the Blob worker code runs unchanged in a test
                  process. Tests assert algorithm invariants: bubble sort&apos;s final array equals the sorted input,
                  binary search lands on the target index, DFS visits every reachable node, recursion frames grow and
                  shrink correctly.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">Unit tests</strong> — language detection, structure diffing,
                  pointer inference, the call tree, the entry harness, Python step building, share-link round-trips,
                  and the learning-path state machine are all covered with vitest.
                </Bullet>
                <Bullet>
                  <strong className="text-foreground">One command</strong> — <code className="font-mono text-xs">npm test</code> runs the whole
                  suite; it doubles as the regression contract for any tracer refactor.
                </Bullet>
              </ul>
            </Section>

            {/* History */}
            <Section
              id="history"
              kicker="10 · How it was developed"
              title="Development history"
              intro="A short timeline of how the tracer evolved from a regex hack to the current pipeline."
            >
              <ol className="relative space-y-6 border-l border-border pl-6">
                {HISTORY.map((item, index) => (
                  <li key={item.label} className="relative">
                    <span
                      className="absolute -left-[31px] grid h-3 w-3 place-items-center rounded-full border border-border bg-background"
                      aria-hidden="true"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", index === 0 ? "bg-primary" : "bg-muted-foreground/50")} />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                      <h3 className="text-sm font-medium">{item.label}</h3>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{item.copy}</p>
                  </li>
                ))}
              </ol>
              <Note tone="warn">
                Worth saying plainly: the single most important decision in the project&apos;s history was replacing the
                regex instrumenter with acorn AST rewriting and locking it down with golden tests. Everything else —
                Python, matrices, linked lists, the curriculum — is built on that foundation.
              </Note>
            </Section>

            {/* Local */}
            <Section
              id="local"
              kicker="11 · Run &amp; contribute"
              title="Run & contribute"
              intro="The visualizer runs without any keys. Only sign-in, saving, and feedback need the optional env vars."
            >
              <CodeBlock title="Commands" code={COMMANDS} />
              <ul className="space-y-2">
                <Bullet>
                  Copy <code className="font-mono text-xs">.env.example</code> to <code className="font-mono text-xs">.env.local</code> for
                  sign-in; see SETUP.md for the full environment, Google OAuth, Supabase migration, and Vercel guide.
                </Bullet>
                <Bullet>
                  The trace engine is pure TypeScript (no DOM, no workers) — new tracer features should ship with a
                  golden test proving the trace of a real algorithm.
                </Bullet>
              </ul>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href="/visualizer">
                    Try it now
                    <Play className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/guide">
                    How it works for users
                    <GitBranch className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </Section>
          </div>
        </div>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
