# AGENTS.md

Agent learnings for this project. Kept terse; only non-obvious facts that reading the code won't reveal.

## Performance / SSR & hydration

- The visualizer workspace is fully SSR-rendered (no `useHydrated` gate). All workspace hooks are SSR-safe: they use `useSyncExternalStore` with a `getServerSnapshot` that returns the default so the server render, hydration render, and first client render agree; real values (media queries, localStorage prefs) are read after mount.
- Do NOT pass a persisted layout to react-resizable-panels via `defaultLayout` — the library applies layouts in an effect, so client values differ from the SSR `flex-basis` and Next flags a hydration mismatch (CLS 0.8+). Restore saved layouts imperatively after mount: `useGroupRef()` + `groupRef.current.setLayout(saved)` in a rAF (see `PersistedGroup` in `resizable-workspace.tsx`).
- The CodeMirror editor is lazy-loaded in a split chunk after first paint; SSR/hydration render a static `<pre>` with the same box so LCP fires on initial HTML with no swap shift. When adding to the code panel, keep the `<pre>` fallback and the lazy import pattern.
- `setTraceLineEffect` (in `code-panel.tsx`, only import from `@codemirror/state`) must stay in the initial bundle because `dsa-visualizer.tsx` dispatches it; the lazy `code-editor.tsx` receives it as a prop and builds its StateField from it. Type it `StateEffectType<number | null>` — `StateEffect<...>` breaks `is()` narrowing.
- Python/Java/C++ CodeMirror language extensions are `import()`-ed per language on demand (JS/TS are eager via `lang-javascript`).
- `/visualizer` is statically prerendered (○): its SSR HTML can be inspected at `.next/server/app/visualizer.html` after a build; initial JS chunk set is listed in that HTML.
- Don't trust dev-mode bundle numbers or layout-shift measurements; verify against a production build.

## AI translation & spend protection

- The only active AI provider in `src/app/api/translate/route.ts` is **NVIDIA NIM** (`NVIDIA_API_KEY`, fixed model `moonshotai/kimi-k3`). The old OpenRouter rotation + Gemini stay commented out at the bottom of that file under "RESTORE: OpenRouter + Gemini".
- Java/C++ only run through AI translation, so guests get a server-enforced 403 (the language picker also disables them with "— sign in to use"). TypeScript is deliberately NOT gated — its AI path is a rare fallback, not a chooseable language.
- Signed-in caps (default 10/hr + 60/day) live in `src/lib/ai-usage.ts`, read from `AI_TRANSLATION_HOURLY_LIMIT`/`AI_TRANSLATION_DAILY_LIMIT` per request (0 = unlimited: no counting, no badge). Enforcement is an atomic Postgres RPC (`bump_ai_usage`, upsert-and-increment) so concurrent requests can't race past a cap.
- The server-side cache (`ai_translation_cache`, keyed by sha256(language+code+input)) is looked up BEFORE the rate-limit bump, so cache hits never consume quota. All DB-backed gating (cache read/write, usage bump, denial insert) fails open — log and proceed — so spend protection never breaks translations.
- Every 429 writes a row to `ai_translation_denials` (fire-and-forget) for the admin spend dashboard. The admin page aggregates in SQL (`ai_translation_summary`, `ai_translation_usage_by_user`) rather than pulling rows — server components can't call `Date.now()` (purity lint rule), so window math lives in the SQL functions. Per-user aggregation uses day buckets only (hour buckets sub-aggregate into them and would double-count).
- `getSessionUserId(request)` lives in `src/lib/auth/session.ts` — the canonical way for any route to get the user id from the httpOnly cookie.
- Guests' only LLM path is the exotic-TypeScript fallback (Java/C++ are 403'd, Python is native). It's counted in `ai_translation_usage` under the `__guest__` sentinel user id (table's user_id is free text, no FK) so admin spend numbers are exact; `ai_translation_usage_by_user` filters non-uuid ids with a regex before the users join, and the summary exposes `guest_llm_calls` (migration `20260815130000`).
- The boot preview and deep-link auto-runs in `dsa-visualizer.tsx` are deferred until `!authLoading` — the Java/C++ gate only fires once auth is known, so a guest deep link must not race ahead and get a server 403 in the strip instead of the login modal.
- NVIDIA NIM is the only provider, and **the model id is the usual failure point**: an id that isn't enabled for the account answers `404 "Function '<uuid>': Not found for account"` (which reads like a route bug), a retired one answers `410`, and a slow one answers nothing until our own abort fires. `npm run ai:check` (`scripts/check-ai-provider.mjs`) probes the candidates and reports status + latency; `src/lib/ai-provider.ts` resolves `AI_TUTOR_MODEL`/`AI_TUTOR_TIMEOUT_MS` (clamped) so a working model can be swapped without a redeploy. The candidate list appears in both files — keep them in sync.
- The **step tutor** (`/api/tutor`) reuses the same NVIDIA model, the same `ai_translation_usage` counters, and the same denials table as translation, through `enforceAiUsageLimit`/`recordAiDenial` in `src/lib/ai-usage.ts`. It is sign-in-only (401 for guests) and deliberately has no cache — an answer depends on the whole conversation, so a cached reply would be stale. The two features therefore share one hourly/daily budget with the tighter `AI_TUTOR_*`/`AI_TRANSLATION_*` limit binding; splitting them needs a `kind` column in `ai_translation_usage` plus a new `bump_ai_usage` signature.
- Tutor grounding lives in `src/lib/tutor-context.ts` (pure, unit tested): a bounded fact sheet built from the `VisualStep` stream — current step, `explainStep`'s deterministic "what changed", a ±2-step window, the structure snapshot, and the ops counters. Keep the model fed from that sheet rather than from user prose, and keep the route re-clamping whatever the client sends. The panel is keyed by `runKey`, so a new run starts a fresh thread while stepping keeps the conversation.

## Layout & UX conventions (user preferences)

- Keep the **Run** button in the top bar with its spinner states — do NOT merge it with the playback transport bar. Playback controls (⏮ ◀ ▶ ⏭ + scrubber + copy-link) live under the workspace; speed/auto-play/reset-layout live in the footer. (A prior consolidation into a single bottom `run-bar.tsx` was reverted.)
- The Input tab shows just the JSON editor — no "Examples:" dropdown and no "Try:" variant buttons (removed; helpers `buildInputVariants`/`generateBigInput` are gone).
- Blank-file state uses a `BLANK_TEMPLATE_ID` sentinel (no template entry). It clears code + input, keeps the language, and leaves `?t=` pointing at the previous template, so a page reload acts as undo. Blank runs are not recorded as learning-path progress, and Run with empty code shows a friendly "write some code first" message (checked before input parsing), never a parse error.
- The blank editor's onboarding hint is a CodeMirror `placeholder` extension (renders only on an empty doc) plus a mirrored hint in the `<pre>` fallback — keep both in sync when editing.
- The step-header card in `visualization-canvas.tsx` must keep a constant height across steps: the statement note reserves a fixed two-line block and the explanation line is always rendered (empty when absent). Variable-height headers shift the visualization ~50px per step (note wrapping + 💡 appearing only on some steps). Header is `sticky`, and scroll position persists across steps, resetting only on tab switch.

## Timeouts / runtime knobs

- The AI translation call is the bottleneck: `AbortSignal.timeout(60_000)` in `src/app/api/translate/route.ts` (was 30s). The browser fetch has no timeout. Trace runner default: 15s per trace (`src/lib/trace-runner.ts`); Python runner: 60s (`src/lib/trace/python-runner.ts`); full pipeline: 120s (`dsa-visualizer.tsx`).

## Security

- Next.js 16 uses `proxy.ts` (not `middleware.ts`) for request-time headers. The exported function must be named `proxy` (or default export). The old middleware convention is deprecated and causes a fatal error if both files exist.
- Google OAuth profile pictures are served from `lh3.googleusercontent.com`, not `www.googleapis.com`. The CSP `img-src` must include both.
- The `neetcode` question data in `search-index.ts` can contain duplicate question numbers across topics (e.g., #219 in Two Pointers and Sliding Window). `buildNeetCodeEntries` deduplicates by `q.no` to avoid React key collisions in the command palette.

## Tooling quirks

- Backgrounded processes (even `nohup ... & disown`) are killed when a terminal command returns — a production `next start` can't be kept alive between commands; use the dev server on port 3000 (started by the user) for browser verification instead.
- `react-hooks/set-state-in-effect` is enabled: the pre-existing `setTracesUsed(getAnonymousTraceCount())` in `dsa-visualizer.tsx` flags it on HEAD (unrelated to any feature work). Async `setState` inside a `.then()`/after `await` in an effect does NOT trigger the rule.
- `gh pr create --body` fails when the body contains backticks or special shell characters — always use `--body-file /dev/stdin` with a heredoc, or write the body to a temp file first.
- `useSyncExternalStore` compares snapshots by reference. Returning a new object from the snapshot function (e.g. `readTimestamps()`) on every call causes an infinite render loop (React error #185). Always cache the snapshot and return the same reference until the data changes.
- The `subscribeToSolved` callback in `top150-status.ts` is shared by both `useSolvedTop150` and `useSolvedTimestamps`. Adding more subscribers to the same Set is correct but calling per-row hooks (e.g. `useSolvedTimestamps()` inside `QuestionRow`) creates N subscriptions for N rows. Hoist to the parent and pass as a prop for better performance.

## Feature architecture

- Spaced repetition intervals are stored in a separate `dsa.reviewLevels` localStorage key (not mixed with solved timestamps). The `isDueForReview()` function in `spaced-repetition.ts` takes timestamps + levels and returns a boolean — pure computation, no React. The question bank computes a `dueSet` via `useMemo` and passes it down through `TopicAccordion` → `QuestionRow` as a boolean prop.
- The progress chart (`progress-chart.tsx`) is pure SVG with no external charting library. It buckets timestamps into weekly counts over 12 weeks. The `ProfilePage` already has `combinedTimestamps` that merges solved + traced data, so the chart just receives that.
- The `TopicAccordion` component is a separate function (not inline in `QuestionBank`) so new props must be added to both its destructured params AND its type annotation. Missing either causes TS errors.
- The `QuestionRow` component uses `dueForReview` as a prop name (not `dueSet`), so the parent must call `dueSet.has(question.no)` when passing it.

## Trace harness constraints

- The JS trace harness (`runTraceInNode`) only supports `class Solution { methodName(args) }` patterns. Design problems (MinStack, MyStack) that require sequential multi-method calls (via `ops`/`vals` arrays) are incompatible — the harness calls `new Solution().methodName(firstArg)` once. External APIs like `GuessAPI` are also unavailable; code must be self-contained.
- The Python trace harness auto-converts array inputs to tree/list objects based on parameter name: `root`, `tree`, `p`, `q`, `subRoot`, `root1`, `root2`, or any name starting with `root`. Linked-list cycle setup via `pos` is guarded — it only runs when the method signature doesn't already accept `pos`.
- `queue.shift()` inside `for (let i = 0; i < queue.length; i++)` is a bug: `.length` is re-evaluated each iteration, changing loop bounds. Must capture `const sz = queue.length` before the loop.
- Removing a neetcode template from `neetcode-templates.ts` requires also removing it from `neetcode-multilang.ts` and updating `NEETCODE_TRACED_NUMBERS` in `top150-coverage.ts` — all three must stay in sync.
- TypeScript template literals with regex escapes like `\s` must be double-escaped (`\\s`) or the backslash is consumed by the template literal parser before the regex sees it.
