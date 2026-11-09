# DSA Lab — Prioritized Improvement Plan

Status: draft · Last updated: 2026-08-14

## Guiding principles

1. **Reliability before features.** The tracer is the whole product. A trace that fails or produces empty steps on real user code kills the first-run experience faster than any missing feature. Fix trust first.
2. **Measure before optimizing.** Vercel Analytics is already installed but the app logs nothing about trace outcomes. Add failure telemetry (error rate, timeout rate, zero-step runs) in Phase 0 so every later phase can be verified against a number.
3. **Ship in vertical slices.** Each item below is independently shippable and verifiable; none requires a big-bang rewrite.

---

## Phase 0 — Quick wins (Days 1–2, ~2 person-days total)

| # | Item | Effort | How to verify |
|---|------|--------|---------------|
| 0.1 | **Render the trace result (bug fix)** | 30 min | Run binary search; final index appears on screen |
| 0.2 | **Fix language-detection false positives** | 30 min | Paste `new Map()` JS; stays JavaScript, no Gemini call |
| 0.3 | **Plain-language error messages** | 2–4 h | Error states read like a human wrote them |
| 0.4 | **README + brand consistency** | 1 h | `code-vuzializer` → real name; one brand everywhere |
| 0.5 | **Generous trace limits** | 0.5–1 d | 10k-step loops no longer error spuriously |
| 0.6 | **Cache AI translations** | 0.5 d | Second run of same code is instant and free |

### 0.1 Render the trace result
- **Why:** `setResultText` is called in 11 places but `resultText` is never rendered in `src/components/dsa-visualizer.tsx`. The algorithm's answer — the entire point of the session — is computed and thrown away. This is the highest-impact bug in the app.
- **What:** Add a result/output panel (return value + `console.log` output) in the Visualizer card, below the canvas. Show it for the duration of the session, not per-step.
- **Effort:** 30 min. **Verify:** run binary search template; index `5` is visible.

### 0.2 Fix language detection
- **Why:** The Java rule `/new\s+\w+\s*\(/` in `src/lib/detect-language.ts` matches ordinary JS (`new Map()`, `new Set()`, `new Date()`), which silently routes users into the slow, cost-incurring Gemini path and then breaks line mapping.
- **What:** Remove the `new X()` rule; require 2+ Java-specific signals (`System.out`, `public static void main`, `import java.`). Add a unit test: JS with `new Map()` → `javascript`.
- **Verify:** `detectLanguage("const m = new Map();")` returns JavaScript.

### 0.3 Plain-language errors
- **Why:** Strings like "Emit an array or graph snapshot to activate the visual canvas" and "The code ran, but no state changes could be inferred" speak engineer, not user. Beginners (the target market) will bounce.
- **What:** Rewrite user-facing strings in `visualization-canvas.tsx` and `dsa-visualizer.tsx`: "Run the code to see your first step", "This code didn't change any visible state — try a loop that modifies an array", "The code ran for too long — it may loop forever, or the input may be too large. Try a smaller input."
- **Verify:** Walk every error/empty state in the UI; none contains "snapshot", "emit", or "trace".

### 0.4 README + branding
- **Why:** README is a single line; `package.json` name is `code-vuzializer`; header says "Code Visualizer" while the site is branded "DSA Lab". Confusing for users and contributors.
- **What:** Write a real README (what it is, how to run, env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `supabase/config.toml` note). Rename package to `dsa-lab`. Standardize "DSA Lab" as the only visible brand.

### 0.5 Generous trace limits
- **Why:** 500-step cap + 2.5 s timeout make correct code fail on any real input. Bubble-sort template only works because n=6.
- **What:**
  - Raise cap to ~2000 steps and **coalesce**: skip emitting a step when the visible snapshot (array, map, pointers, line) is unchanged since the last step — most loop iterations mutate nothing visible.
  - Replace the fixed 2.5 s `setTimeout` with an adaptive budget (e.g., 10 s or proportional to code size) and surface progress: "Captured 1,204 steps…".
  - Distinguish "timed out / step limit" (a limits message) from a genuine runtime error in the UI.
- **Verify:** Quicksort on 20 elements and a 3-nested-loop warmup complete with steps.

### 0.6 Cache AI translations
- **Why:** Every "Visualize" click for Python/Java/C++ re-hits the Gemini API: slow, rate-limited, per-call cost, flaky.
- **What:** Client-side cache keyed by `(language, sha1(code), inputText)` in `localStorage` with an LRU cap (~50 entries). Add a "✓ translated from X" indicator showing it came from cache vs. live.
- **Verify:** Run a Python template twice; second run shows no network request to `/api/translate`.

---

## Phase 1 — Tracer reliability (Weeks 1–2, ~1 week) — ✅ done 2026-08-09

**The moat. Everything else is polish until traces are trustworthy.**

### 1.1 Extract the trace runner + golden tests (2–3 d) — ✅ done
- **Why:** `createWorkerSource()` is a ~400-line regex instrumenter embedded as a template string inside `dsa-visualizer.tsx`. It is untested, untestable in place, and any refactor risks silent regressions.
- **What:**
  - Extract to `src/lib/trace-runner.ts` exporting `createWorkerSource()` (pure string) plus a `runTraceInNode(code, inputText)` harness that polyfills `self` so the same source runs under Node for tests.
  - Add **golden trace tests** for every template in `src/lib/templates.ts`: bubble sort, binary search, sliding window, character replacement, DFS (iterative), recursive DFS, plus Python/Java presets (after translation by a fixture, or by direct JS).
  - Assert invariants per algorithm, e.g.:
    - bubble sort: last step's `array` equals the sorted input; `active` indices always in range.
    - binary search: a step exists with `active` containing the final `mid`; result is the target index.
    - DFS: final `visited` equals all reachable nodes; every emitted `frontier` is a subset of nodes.
    - recursion: `callStack` grows on `__autoEnter` and shrinks on return; never empties while frames exist.
  - Wire into `npm test` (vitest) — none exists today.
- **Verify:** `npm test` green; the trace of every template produces ≥1 step and holds its invariants.

### 1.2 Multi-language line mapping (1–2 d) — ✅ done (Stage A + B)

- **Done:** translate route now asks Gemini for `//# line: N` directives; the instrumenter parses them and emits original-line numbers. When a run used translation without directives, Line focus falls back to highlighting the translated JS (with a label) and a collapsible "Translated JavaScript" panel is shown.
- **Why:** For non-JS code the worker traces *translated* JS, but "Line focus" highlights line numbers against the *original* code in the editor. Every Python/Java/C++ run highlights the wrong line. The trace is misleading — worse than no trace.
- **What (two stages):**
  - **Stage A (cheap, truthful):** when a run used translation, show a collapsible "Translated JS" panel with its own active-line highlight. Line focus stays honest; the user sees exactly what was traced. Ship this first.
  - **Stage B (best):** ask Gemini to prefix each translated statement with `//# line: <original>` comments (the prompt in `src/app/api/translate/route.ts` already controls output). The instrumenter parses these directives and emits the *original* line number in steps, so Line focus works against the user's code. Fall back to Stage A when directives are missing.
- **Verify:** Python binary-search template: Line focus highlights the correct line of the *Python* source at each step.

### 1.3 AST-based instrumentation (3–4 d) — the biggest single win — ✅ done

- **Done:** `src/lib/trace-runner.ts` instruments with acorn (custom enter/leave walker for lexical scoping, replacing the brace-counting regex). Branch steps carry truthiness notes (`if arr[mid] < target → false`); call-stack frames push/pop on real function calls; line numbers come from the AST. Golden tests from 1.1 pass unchanged on the acorn output. Also fixed a pre-existing aliasing bug where array steps all showed the final state (snapshots are now deep-cloned at emit time).
- **Why:** The brace-counting regex instrumenter (`instrument()` inside `createWorkerSource`) silently misses: multi-line statements, ternaries, single-line arrow bodies, destructuring, `switch`, `if`/`else` branches (it never emits a step for a branch decision — the most instructive moment in a trace). TS annotations crash it outright.
- **What:** Replace the transformer with **acorn** (`acorn` is small; `acorn-walk` for traversal) running inside the worker:
  - Insert a capture call before every statement that can change state, and **after each branch condition** with its evaluated truthiness ("if `arr[mid] < target` → false") — this is what makes traces readable, Python Tutor style.
  - Record original line numbers natively; no brace guessing.
  - Emit `callStack` frames on real function enter/exit (walk `FunctionDeclaration`/`ArrowFunctionExpression`), and support TS by stripping type annotations (or routing TS through the translator).
- **Risk control:** keep the golden tests from 1.1 as the behavioral contract; the acorn output must pass them before it ships. Roll out behind a flag if desired.
- **Verify:** `npm test` passes on all templates; a ternary-based algorithm and an `if`-heavy algorithm both produce per-branch steps.

### 1.4 TypeScript support (1 d) — ✅ done

- **Done:** `instrument(code, { typescript: true })` strips LeetCode-style annotations (variable/param/return types, `interface`/`type`/`enum`/`namespace` blocks, `as` casts, non-null `!`) before parsing; unsupported type syntax falls back to the Gemini translation path automatically. Golden test: typed TS binary search traces correctly. Also fixed a detection gap found in e2e: TS code scoring equally with JS (`let x: number` + `return`) was mis-detected as JavaScript, hard-erroring on `interface`; the tie-break in `detect-language.ts` now prefers TypeScript (safe because the stripper is a no-op on plain JS and TS stays on the local path).
- **Why:** `typescript` is marked `isJavaScript` and runs through the instrumenter directly, which throws on `const x: number = 5`. The dropdown promises a language that fails.
- **What:** Either strip type annotations in the worker (cheap regex pass + acorn from 1.3), or route TS through Gemini like other languages. Add a golden test with a typed LeetCode-style solution.
- **Verify:** A typed TS binary search traces correctly.

---

## Phase 2 — UX fundamentals (Weeks 2–3, ~4–5 days) — ✅ done 2026-08-09

### 2.1 Real code editor (1–2 d) — ✅ done
- **Why:** The product is about lines of code, but the editor is a `<textarea>` with no line numbers and no highlighting, so "Line 12" means nothing.
- **What:** CodeMirror 6 (`@uiw/react-codemirror` or hand-rolled with `codemirror` + `@codemirror/lang-javascript`/`lang-python`). Add a line-number gutter and sync the active trace line via a decoration. Keep the plain textarea as a fallback on mobile if needed.
- **Verify:** Active trace line is highlighted in the editor itself; line numbers match the Line focus panel.

### 2.2 Multi-structure canvas (1–2 d) — ✅ done
- **Why:** The canvas renders one structure by priority (array > string > hashMap > …). Classic "two sum with a map" shows the array and hides the map — half of the state is invisible.
- **What:** When a step has multiple structures, render them in a responsive grid (array + hash map side by side; array + stack; string + hash map — the character-replacement template already needs the map visible). Extend `ArrayVisualizer` to render `step.hashMap` when present, mirroring `StringVisualizer`.
- **Verify:** Two-sum-style template shows both array and map simultaneously.

### 2.3 Diff highlighting (1 d) — ✅ done
- **Why:** Animation shows *what* changed; diff highlighting teaches *what changed*. Python Tutor's red-highlight of changed values is a proven, cheap win.
- **What:** Compare consecutive steps in `VisualizationCanvas` (or precompute in normalization): highlight cells whose value changed since the previous step in a "changed" color, with a small "changed from X" tooltip.
- **Verify:** Bubble sort's swap step visibly highlights the two swapped cells.

### 2.4 Graph layout (1 d) — ✅ done
- **Why:** The circular layout in `visualization-canvas.tsx` gets unreadable past ~8 nodes and hides traversal order.
- **What:** Position nodes by BFS/DFS discovery level (or a simple force-directed pass on first render). Add a small step counter on nodes ("visited at step k") so traversal order is readable.
- **Verify:** A 12-node graph renders with no edge crossings in the worst case and shows discovery order.

### 2.5 Result/console panel polish (0.5 d) — ✅ done
- **Why:** Completes 0.1.
- **What:** Full output panel: return value, console output list, run duration, steps captured. Copy-to-clipboard for the result.
- **Verify:** Every template shows a readable output block.

---

## Phase 3 — Growth (Weeks 3–6, ~2 weeks)

### 3.1 Shareable deep links (1–2 d)
- **Why:** This is the viral loop of the category. Python Tutor's entire distribution is encoded-code URLs — no auth, no server. DSA Lab's `savedId` requires sign-in and always lands at step 0.
- **What:** Encode `code + inputText + language (+ step index)` with `lz-string` (or base64 + `gzip`) into the URL hash: `/visualizer#<payload>`. Add a "Copy share link" button (no auth). On load, hydrate the workspace and jump to the requested step. Deep links to the *interesting* state, not the start.
- **Verify:** Share a link in a private tab; workspace loads with code, input, and the requested step selected.

### 3.2 Curated problem library (2–3 d)
- **Why:** Ten presets is a demo, not a library. Retention in interview prep comes from a browsable set of problems ("easy/medium/hard", by topic) that users can work through and save progress on.
- **What:** A `problems` table in Supabase (or static JSON, simpler): title, topic, difficulty, starter code, JSON input, hints. Problem cards link into `/visualizer` preloaded. Seed with 20–30 classic problems (two sum, valid anagram, course schedule, merge intervals, LRU cache, …).
- **Verify:** A user can find a problem by topic, open it preloaded, solve it, and save it to a collection.

### 3.3 AI "explain this step" (2–3 d)
- **Why:** The Gemini hook already exists; a one-line "why did `left` move to `mid+1` here?" turns a visualization into a tutor. The biggest wow factor available.
- **What:** Button on a step → POST current step snapshot + code + input to a new `/api/explain` route (reuse Gemini). Show a short explanation under the canvas. Rate-limit (e.g., 10/day anonymous, generous for signed-in). Cache explanations by step signature.
- **Verify:** Clicking explain on the binary-search `mid` step produces a correct, code-specific sentence.

### 3.4 Embed mode (1 d)
- **Why:** Distribution channel: blogs, courses, and lecture slides embed live traces. Costs nothing on the free plan.
- **What:** `/embed?<same payload as 3.1>` — a chrome-free iframe variant (no nav, no auth controls) of the visualizer. Add a "Share / Embed" menu with a copy-paste iframe snippet.
- **Verify:** iframe with a shared payload renders and plays in a static HTML page.

### 3.5 Onboarding tour (1 d)
- **Why:** New users land on a dense two-pane UI. The auto-run of bubble sort helps, but nothing explains *what to do next*.
- **What:** 4-step tour (radix popover, already in the deps): "pick a preset → paste your code → input JSON → step through". Richer empty states in plain language (ties into 0.3).
- **Verify:** A first-time user completes the tour and runs their own code within 60 seconds.

### 3.6 Collections retention polish (1–2 d)
- **Why:** Collections are the retention hook but are bare: list + filter + delete.
- **What:** Show last-practiced date, "practice again" deep link (via 3.1), per-topic counts, and a simple "add current workspace to collection" shortcut in the visualizer.
- **Verify:** Returning users can resume a saved algorithm in two clicks.

---

## Phase 4 — Hardening & scale (Later)

- **Server-side translation cache** (Vercel KV or Postgres) when the client cache isn't enough; batch/queue to dodge rate limits.
- **Streaming traces:** emit steps incrementally from the worker instead of one giant postMessage, with virtualized timeline rendering for >2k steps.
- **Mobile & PWA:** stacked layout already works; add installability (manifest) and touch-friendly controls.
- **Accessibility:** keyboard traversal of the canvas, aria labels for the diff/active states, focus management for the timeline.
- **Analytics loops:** funnel (land → run own code → step through → save/share), and the reliability metrics from Phase 0 as the top dashboard.

### Auth trust — hide the supabase.co domain from the Google consent screen

- **Why:** Google's sign-in screen reads "Sign in to continue to `egcqvkcirxkynjaakrsr.supabase.co`". It's safe (that URL is the genuine Supabase auth redirect, TLS-encrypted end to end) but it looks like a phishing page to students, and the "Google hasn't verified this app" banner scares first-time users away from an otherwise free, no-account-required product.
- **What (Option B — free, no paid Supabase plan):** bring Google OAuth onto the app's own domain instead of relying on Supabase's hosted provider. Register a Google OAuth client whose authorized redirect URI is on our own domain (e.g. `https://dsa-lab.vercel.app/auth/google/callback`), run the OAuth dance against that URI, then exchange the resulting Google ID token for a Supabase session via `supabase.auth.signInWithIdToken({ provider: "google", token })`. Scope: one new route (`/auth/google/callback`) + rewritten sign-in in the three components that call `signInWithOAuth` (`auth-controls.tsx`, `login-screen.tsx`, `dsa-visualizer.tsx`); keep `signInWithOAuth` as a fallback. Google Console config (new OAuth client, brand the consent screen as "DSA Lab" with logo/support email, move from Testing to Production) is a prerequisite and takes ~10 min.
  - **Option A (paid, ~$25/mo Pro plan) alternative:** add a custom domain (e.g. `auth.dsalab.app`) in Supabase → Project Settings → Authentication → Domains, CNAME it at the DNS provider, set `NEXT_PUBLIC_SUPABASE_URL` to the custom domain, and register `https://auth.dsalab.app/auth/v1/callback` in the Google OAuth client. Zero code changes; the consent screen then shows our own domain.
- **Verify:** the Google consent screen shows the app's own domain and "DSA Lab" branding; sign-in still completes end-to-end via `/auth/callback`; guest (no-account) usage is unaffected.

---

## Phase A–D — Student-market roadmap (accuracy → learning → distribution → monetization)

Status: planned · Last updated: 2026-08-09

Goal: make traces accurate for the code students actually write, then turn that accuracy into
daily practice, distribution, and — only once there is real traction — a ₹100–150/month
subscription (or ₹999–1,499/year).

Sequencing rule: **A before B, B before C, C before D.** Nothing is monetized until share links
(C.1) and classroom embeds (C.2) produce thousands of weekly active users (see measurement
targets below). Billing is pointless without distribution, and distribution is pointless if
traces fail on real code.

### Phase A — Accuracy for all code (~3–5 weeks)

**The moat. Every A item is a "trace fails on real student code" fix.**

| # | Item | Effort | How to verify |
|---|------|--------|---------------|
| A.1 | Linked-list, tree, matrix, set, heap, object visualization | 3–4 d | LeetCode-style `reverseList` and `invertTree` produce node-level steps with active-node highlighting |
| A.2 | Trace the "no visible state" patterns | 2–3 d | `console.log`-only code, primitive returns, string ops, and memoized recursion each produce ≥1 meaningful step or an honest message |
| A.3 | Bigger, coalesced traces + adaptive timeout | 1–2 d | Quicksort on 20 elements and a 3-nested-loop warmup complete with steps; the step cap never trips spuriously |
| A.4 | Re-enable Python, Java, C++ via translation | 3–5 d | Python/Java/C++ templates trace with correct original-line mapping (the coming-soon picker UI is already in place) |
| A.5 | "Report a bad trace" + failure telemetry | 1 d — ✅ done 2026-08-14 | A flagged trace is logged with a code hash; Vercel Analytics shows success rate, timeout rate, zero-step runs |
| A.6 | Native Python tracing (Pyodide + `sys.settrace`, no AI) | 1–2 w | Python bubble sort / binary search produce steps with correct line numbers and zero Gemini calls |

#### A.1 Linked-list / tree / matrix / set / heap / object rendering
- **Why:** LeetCode-style DSA is mostly linked lists, trees, and 2D structures; the canvas today renders arrays, strings, hash maps, graphs, queues, stacks, and visited sets. A student's `reverseList` trace ends as a graph blob or nothing — the #1 accuracy gap for the target market.
- **What:** Recognize linked-list/tree-like object graphs in the worker snapshot (cyclic-safe), render nodes as boxes with `next`/`left`/`right` edges, and highlight the active node per step. Add 2D-array (matrix), `Set`, and `Map` views. Detect heap ops (`push`/`pop` on an array used as a priority queue) as a labeled stack.
- **Verify:** Golden traces: `reverseList([1,2,3])` shows nodes `3→2→1` with active-node highlighting; `invertTree` shows both children swapped per step; a 3×3 matrix renders as a grid.

#### A.2 "No visible state" patterns
- **Why:** The top complaint class: "the code ran but showed nothing." `console.log`, primitive returns, and memoized recursion either produce zero steps or a confusing message.
- **What:** Capture `console.log` as Console steps (already partially done); emit a final "result" step for primitive returns; visualize string mutation (`slice`/`replace`) as a string diff; treat a `Map`-backed memo as a hash map. When nothing is capturable, say exactly why in plain language.
- **Verify:** Each of the four patterns produces a readable step or a precise explanation; no pattern ends in "The code ran, but no state changes could be inferred."

#### A.3 Generous, coalesced traces
- **Why:** Hard step caps and fixed timeouts make correct code fail on real inputs; the existing 5–15 s budget is too tight for translation-heavy runs.
- **What:** Raise the step cap and skip emitting a step when the visible snapshot is unchanged since the previous step (most loop iterations mutate nothing visible). Replace the fixed timeout with an adaptive budget proportional to code size, and surface progress ("Captured 1,204 steps…").
- **Verify:** Quicksort on 20 elements and a nested-loop warmup complete with steps; a long loop still shows a representative step each time state actually changes.

#### A.4 Python / Java / C++ languages
- **Why:** Indian DSA students overwhelmingly write C++, Java, and Python — the app currently traces only JS/TS. This is the market unlock and the precondition for Phase D pricing.
- **What:** Wire the Gemini translation path (already built and cached, currently gated to "coming soon") back on per language; keep the grouped picker; rely on the `//# line` directives for correct line mapping. Ship one language at a time, Python first, with golden tests.
- **Verify:** Python binary-search template traces with the correct line highlighted; detection still keeps JS/TS on the local path with zero Gemini calls.

#### A.5 Trace telemetry + bad-trace reporting
- **Why:** "Accurate for all code" is unmeasurable without numbers. Vercel Analytics is installed but logs nothing about trace outcomes.
- **What:** Custom events: trace success rate, timeout/step-limit rate, zero-step runs, time-to-first-step, language mix. Add a "This trace was wrong" button that stores the code hash (and optionally the code) so fixes target real failures.
- **Verify:** The dashboard shows the ≥90% success-rate target; flagged traces are queryable by code hash; the funnel (land → run own code → step ≥5 times → save/share) is visible.

#### A.6 Native Python tracing (Pyodide + `sys.settrace`)
- **Why:** AI translation is a correctness risk (translated code can subtly change behavior), a per-call cost, and needs a Gemini key — yet Python is the #1 language of the target market. Python is the one non-JS language with a genuinely cheap native path: real CPython runs in the browser via Pyodide (WASM), and Python's built-in `sys.settrace` fires on every line with the real frame's locals — the same technique Python Tutor uses. It also yields real line numbers, removing the `//# line` mapping hack entirely.
- **What:** Load Pyodide in the existing trace worker (stays client-side, so the sandbox and its security posture are unchanged; ~10–25 MB WASM loaded lazily only when Python is selected). Wrap the student's code with a `sys.settrace` hook that emits line + visible locals (lists, dicts, sets, strings, primitives) per step into the existing `VisualStep` schema — the canvas is untouched. Coalesce unchanged steps (see A.3), map JSON input into Python objects, and capture `print()` output as Console steps.
- **Verify:** `npm test` includes a Python golden trace that passes with zero Gemini calls; the Python bubble-sort template steps with the correct line highlighted and no `//# line` fallback; second runs are instant (no translation cache needed). **A.6 supersedes the Python half of A.4** — A.4 narrows to Java/C++ via translation, keeping AI as a Python fallback only for syntax `sys.settrace` can't handle.

### Phase B — Learning value (~1.5 weeks)

**Retention: why a student comes back daily. This is what the subscription ultimately sells.**

| # | Item | Effort | How to verify |
|---|------|--------|---------------|
| B.1 | AI "explain this step" | 2–3 d | Clicking explain on the binary-search `mid` step produces a correct, code-specific sentence |
| B.2 | Curated problem library (20–30 problems) | 2–3 d | Find by topic/difficulty → open preloaded → solve → save to collection |
| B.3 | "Predict the next state" quiz mode | 2–3 d | Quiz step hides the next state; answering reveals the diff; per-session accuracy is tracked |
| B.4 | Session summaries | 1–2 d | After a trace, a plain-English walkthrough references the student's actual variables |

#### B.1 Explain this step
- **Why:** The Gemini hook exists and a one-line "why did `left` move to `mid+1`?" turns a visualization into a tutor; the biggest wow factor and the clearest paid feature.
- **What:** A button per step POSTs the step snapshot + code + input to a new `/api/explain` route (reuse Gemini); short explanation under the canvas; cache by step signature; rate-limit (10/day anonymous, generous for signed-in).
- **Verify:** Explanation is code-specific (mentions actual variable names/values), not a canned sentence.

#### B.2 Curated problem library
- **Why:** Ten presets is a demo; retention needs a browsable set students work through daily.
- **What:** A `problems` table (or static JSON) — title, topic, difficulty, starter code, JSON input, hints; cards link into `/visualizer` preloaded; seed 20–30 classics (two sum, valid anagram, merge intervals, LRU cache, …).
- **Verify:** A student finds a problem by topic, opens it preloaded, solves it, and saves it.

#### B.3 Predict-the-next-state
- **Why:** Retrieval practice is proven pedagogy; almost no visualizer quizzes the student.
- **What:** A toggle hides the next step's diff; the student predicts what changes; reveal shows the actual change and marks correct/incorrect; session score in the result panel.
- **Verify:** Quiz mode on bubble sort shows per-swap prompts and a correct/incorrect tally.

#### B.4 Session summaries
- **Why:** Stepping produces states; students still need the "so what" — complexity, invariants, a plain-language narrative.
- **What:** On trace completion, generate a short walkthrough ("each pass bubbles the largest remaining value to the end; that's why bubble sort is O(n²)") referencing real variable names.
- **Verify:** Summary for every golden template reads correctly and names actual variables.

### Phase C — Distribution (~1 week + ongoing partnerships)

**Growth before money. Nothing in Phase D happens until this produces real weekly active users.**

| # | Item | Effort | How to verify |
|---|------|--------|---------------|
| C.1 | Shareable deep links (no auth) | 1–2 d | Shared link in a private tab hydrates code + input + requested step |
| C.2 | Embed mode for teachers | 1 d | iframe with a shared payload renders and plays in a static HTML page |
| C.3 | Short-form demo kit | 0.5 d | Copy-paste scenes + captions produce a Reel/Short in minutes |
| C.4 | College / placement-group partnerships | ongoing | Referral links and a free classroom tier; signups tracked |

#### C.1 Deep links
- **Why:** The viral loop of the category; Python Tutor's entire distribution is encoded-code URLs, no auth.
- **What:** Encode `code + inputText + language (+ step index)` (lz-string or base64+gzip) into `/visualizer#<payload>`; "Copy share link" button; hydrate and jump to the requested step.
- **Verify:** A private-tab open lands on the interesting state, not step 0.

#### C.2 Embed
- **Why:** Professors and courses embed live traces in notes and slides → free classroom distribution.
- **What:** `/embed?<same payload>` chrome-free variant; "Share / Embed" menu with an iframe snippet.
- **Verify:** iframe plays in a plain HTML file.

#### C.3 Demo kit
- **Why:** Reels/Shorts of traces are the cheapest reach in India.
- **What:** 5–6 ready-to-record scenes (bubble sort swap, DFS frontier, binary search bounds) with captions and hooks.
- **Verify:** A non-editor can record and publish a demo in minutes.

#### C.4 Partnerships
- **Why:** Placement-prep groups and college coding clubs are where DSA students congregate.
- **What:** Referral links with a free classroom tier, a one-page pitch, and a Discord/Telegram presence.
- **Verify:** ≥3 groups running weekly sessions with the tool; referral signups tracked.

### Phase D — Monetization (~1 week, only after C shows traction)

**Do not build billing until C.1/C.2 are producing thousands of weekly active users (see measurement below).**

| # | Item | Effort | How to verify |
|---|------|--------|---------------|
| D.1 | Free vs paid tier split | 2–3 d | Free: 5–10 traces/day, JS/TS only, no AI explain. Paid: unlimited, all languages, AI explain, full library + hints |
| D.2 | UPI billing (Razorpay/Cashfree) | 2–4 d | Purchase flow completes with UPI; entitlement enforced server-side |

- **Pricing:** ₹100–150/month or, better for students, ₹999–1,499/year (annual feels like a course, not a subscription drain).
- **Why UPI:** Indian students don't have credit cards; Stripe alone will silently kill conversion. Razorpay/Cashfree handle UPI, cards, and netbanking.
- **Entitlement:** gate in `dsa-visualizer.tsx` by subscription status from Supabase; anonymous → the current 5-trace soft gate; paid → unlimited + languages + AI. Keep the free tier genuinely useful — the tool is the marketing.

---

## Measurement (north-star metrics)

Instrument these in Phase 0 (Vercel Analytics custom events), track after every phase:

1. **Trace success rate** — % of "Visualize" clicks that produce ≥1 step. Target: >90%.
2. **Trace error/timeout rate** — % ending in error or a limits message. Target: <10%.
3. **Time to first step** — median ms from click to first rendered state. Target: <800 ms (JS), <2.5 s (translated).
4. **Session depth** — % of sessions that step ≥5 times. Target: >50%.
5. **Conversion** — % of sessions that save or share. Share links (3.1) are also the growth KPI.
6. **Free→paid conversion** — % of weekly active users who subscribe. Target: 2–5% once D ships.
7. **Share/embed rate** — % of sessions that copy a share link or embed. Target: >5% (also the growth KPI).
8. **Bad-trace report rate** — % of traces flagged "wrong". Target: <5% and falling after A.1–A.3.
9. **Language mix** — share of traces by language. Expect C++/Java/Python to dominate in the target market; JS/TS >90% of traces today is a signal the wrong audience is using it.

## Sequencing summary

```
Week 1-2:   Phase 0 (quick wins)  →  Phase 1 (tracer reliability + tests)
Week 3:     Phase 2 (editor, multi-structure canvas, diffs)
Week 4-6:   Phase 3 (sharing → problem library → explain → embed)
Later:      Phase 4 (scale, mobile, a11y)

2026 roadmap (Phase A–D):
Week 1-4:   Phase A — accuracy: linked lists/trees, no-visible-state patterns, generous
            traces, Python/Java/C++ languages, telemetry
Week 4-8:   Phase B — learning: explain-this-step, problem library, predict-next-state,
            session summaries
Week 6-10:  Phase C — distribution: deep links, teacher embed, demo kit, partnerships
After C:    Phase D — monetization: tier split, UPI billing (only with real traction)
```

## Key risks

- **Acorn refactor (1.3) changes trace output.** Mitigate with golden tests as the contract; ship behind a flag.
- **AI translation cost/latency.** Cache (0.6), translate only when language ≠ JS, and never translate TS until 1.4 lands.
- **Scope creep on the canvas (2.2).** Ship array+map first (covers two sum and character replacement); add stack/graph pairing after.
- **Share links without auth** can carry large payloads; cap code at ~50 KB and compress before encoding.
- **Students don't pay individually.** Mitigate with annual pricing (₹999–1,499), a course/coach bundling channel, and a genuinely useful free tier.
- **Language gap.** The target market writes C++/Java/Python; a JS/TS-only app cannot monetize in India. A.4 must ship before D.
- **Free alternatives (Python Tutor, visualgo, LeetCode).** The wedge is accurate traces of the student's *own* code + AI explain + predict-next-state — not prettier bubble sort.
- **Payment friction.** UPI via Razorpay/Cashfree is table stakes; Stripe-only billing will quietly kill conversion.
- **AI cost at scale.** Explain-this-step and translation are per-call costs; cache aggressively (by step signature and language+code hash) and cap anonymous usage before it grows unbounded.
