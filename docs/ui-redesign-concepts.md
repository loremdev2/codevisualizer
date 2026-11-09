# DSA Lab — UI Revamp Design Concepts

> Branch: `feat/ui-revamp` · Status: **✅ Concept A+C hybrid implemented** (see §7)
> Reference: the TraceCode screenshot (dark IDE, fixed control bars, quadrant layout).

## 7. Implemented — the A+C hybrid

**Chosen layout (A's fixed workspace + C's top playback bar):**

```
┌──────────────────────────────────────────────────────────────┐
│ TOP BAR  brand · preset · language · ✓ steps · [Run] · auth  │
├──────────────────────────────────────────────────────────────┤
│ PLAYBACK  ⏮ ◀ ▶ ⏭  ────── slider ──────  n / N   (fixed)    │
├───────────────┬─────────────────────────┬────────────────────┤
│  CODE EDITOR  │     VISUALIZATION       │  VARIABLES   [−]   │
│  (line focus, │     (largest area)      ├─────────↕──────────┤
│   translated, │                         │  CALL STACK  [−]   │
│   saved code) │                         │  [Stack|Tree]      │
├───────────────┴─────────────────────────┴────────────────────┤
│  INPUT | OUTPUT  (bottom strip, collapsible, resizable)      │
├──────────────────────────────────────────────────────────────┤
│ FOOTER  0.5x | 1x | 2x                      [Reset layout]   │
└──────────────────────────────────────────────────────────────┘
```

**What shipped on `feat/ui-revamp`:**

- **Fixed chrome** — top bar, playback bar under the header (Concept C), footer
  status bar; nothing lives in a scrolling card anymore. Full-viewport shell
  (`h-dvh` flex column).
- **Resizable panels** via `react-resizable-panels` v4 (`Group`/`Panel`/`Separator`):
  code ⇄ viz ⇄ right rail, Variables ⇄ Call Stack, main workspace ⇄ IO strip.
  Keyboard-accessible separators, double-click resets a panel, drag-past-min
  collapses collapsible panels.
- **Collapsible** Variables, Call Stack, and the IO strip — collapse to a thin
  header strip (`[+]`/`[−]`), giving the visualization more room.
- **Persistent layout** — panel sizes saved to `localStorage`
  (`react-resizable-panels:dsa-lab-*`), collapsed states to `dsa-lab-collapsed`;
  restored without layout shift (lazy state init, client-only mount).
  **Reset layout** clears both and remounts defaults.
- **VARIABLES panel** — rows of `name → colored type tag → value`: `list`=blue,
  `dict`=orange, `int`=cyan, `string`=green, `bool`=purple, `set`=yellow,
  `graph`=red, `matrix`=teal, `null`=gray. Changed rows/values highlight and
  flash; hover shows the previous value. The tracer now records the source
  variable names of each structure (`arrayName`, `hashMapName`, …) so names are
  real.
- **CALL STACK panel** — `Stack` view (frames newest-first with active line and
  `→ returned` on return steps) and `Tree` view (a call tree that grows as you
  step, built from the trace's call-stack history, with returned markers and
  active-path highlight).
- **IO strip** — `Input` (JSON) and `Output` (result + console, copy button)
  tabs, meta badge, error banner, collapsible.
- Visualization canvas now owns only the structures; the old duplicated
  Variables/Call-stack badge groups moved into their dedicated panels.

**Verified:** `tsc --noEmit`, `eslint`, 45/45 vitest tests; interactively checked
collapse/expand, persisted + reset layout, stack/tree views, dark + light themes,
soft-gate modal.

**Follow-ups worth doing:**
- Mobile/responsive pass (the IDE grid scrolls horizontally below ~1024px).
- Record actual returned *values* in the tracer so Stack/Tree frames can show
  `→ returned: 5` instead of the return source text.
- Add a `Problem` tab and the `✓ N steps` pill to match the reference more
  closely.

Goal: turn the current scrolling two-card page into a fixed-layout IDE/debugger
experience — a top bar, dedicated panels for **Code**, **Visualization**,
**Input/Output**, **Variables**, **Call Stack**, a **bottom playback bar**, and a
**footer status bar**. All major panels are resizable with drag dividers, collapsible,
and the layout persists.

---

## 1. Shared design language (same in every concept)

### Fixed chrome (never scrolls away)
- **Top bar** — brand, file name, `✓ N steps` badge, `▶ Run`, layout switcher,
  undo/redo, timer, theme, user.
- **Playback bar** — step controls + timeline slider + step counter. Lives either
  at the **bottom** (concepts A, B, D) or **top** (concept C).
- **Footer status bar** — playback speed (0.5x / 1x / 2x), reset-layout button.

### VARIABLES panel (the important one)
Rows of `name → colorful type tag → value`. Type tags are colored pills, one color
per data structure:

| Type | Tag color |
|---|---|
| `list` / array | 🔵 blue |
| `dict` / map | 🟠 orange |
| `int` / number | 🩵 cyan |
| `string` | 🟢 green |
| `bool` | 🟣 purple |
| `set` | 🟡 yellow |
| `graph` | 🔴 red |
| `matrix` | 🟦 teal |
| `null` / `undefined` | ⚪ gray |

```
VARIABLES                              [pin]
┌───────────────────────────────────────────┐
│ ↩ return     [list]    [0, 1]         ◀ highlight │
│ nums         [list]    [2, 7, 11, 15]          │
│ target       [int]     9                       │
│ seen         [dict]    {2: 0}                  │
│ i            [int]     1                       │
│ num          [int]     7                       │
│ complement   [int]     2                       │
└───────────────────────────────────────────┘
```
- The row that changed in the current step is highlighted (teal/cyan, like the
  reference image).
- Values that changed since the last step flash; hover shows the previous value.
- Data source: the trace steps already carry `pointers` (name → value); we derive
  the type from the value (array → `list`, object → `dict`, etc.) plus
  `hashMap`/`graph`/`matrix`/`callStack` from the step.

### CALL STACK panel
- **Stack** view (default): frames top-to-bottom, each showing the function call
  (`two_sum(nums=[2, 7, 11, 15], target=9)`, the source line on the right, and the
  `→ returned:` value in teal once the frame completes).
- **Tree** view: renders recursion as an expandable tree (parents → child calls).
- Toggle `Stack | Tree` in the panel header.

### Resize model (shared rules)
- **Major dividers only** — never every sub-component. Dividers:
  - vertical column divider → `col-resize` cursor
  - horizontal row divider → `row-resize` cursor
- Hover highlights the divider (1px → 3px accent).
- Sensible min/max per panel (e.g. editor ≥ 280px, variables ≥ 220px).
- Collapse / expand: every panel header has a `[−]`/`[+]` toggle; collapsed panels
  become a thin header strip so nothing scrolls away.
- **Persistence**: layout saved to `localStorage` (`dsa-lab-layout`) — editor width,
  panel sizes, timeline height, collapsed states. **Reset Layout** button restores
  defaults.
- Resizing never steals pointer events from CodeMirror (text selection), the
  canvas, or the timeline slider.

---

## 2. Concept A — “TraceCode Grid” (reference-faithful)

The 4-quadrant IDE from the screenshot: editor top-left, visualization top-right,
Input/Output bottom-left, Variables + Call Stack stacked bottom-right, playback
full-width at the bottom.

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOP BAR  brand · </> file · ✓ 11 steps · [▶ Run] · undo/redo · timer │
├───────────────────────┬──────────────────────────────────────────────┤
│                       │                                              │
│   CODE EDITOR         │           VISUALIZATION                      │
│   (18 lines, active   │           (array / hashmap / graph /         │
│    line highlighted)  │            matrix / string)                  │
│                       │                                              │
├──────────↕────────────┤ ┌──────────────────┬───────────────────────┐ │
│  PROBLEM | INPUT |    │ │   VARIABLES      │  CALL STACK           │ │
│  OUTPUT  (tabs)       │ │   name + tags    │  [Stack|Tree]         │ │
│                       │ ├────────↕─────────┤                       │ │
│                       │ │  CALL STACK      │                       │ │
│                       │ └──────────────────┴───────────────────────┘ │
├───────────────────────┴──────────────────────────────────────────────┤
│ PLAYBACK  ⏮ ◀ ▶ ⏭  ────────── slider ──────────  11 / 11     [↕]  │
├──────────────────────────────────────────────────────────────────────┤
│ FOOTER  0.5x | 1x | 2x                        [Reset layout]        │
└──────────────────────────────────────────────────────────────────────┘
```

**Resizable:** ① vertical divider (editor ⇄ viz/right side), ② horizontal divider
(top row ⇄ bottom row), ③ horizontal divider (Variables ⇄ Call Stack),
④ timeline height (drag up from the footer).

**Collapsible:** editor, IO tabs, Variables, Call Stack, timeline.

**When viz needs more space:** drag ② down (bottom row shrinks), collapse IO tabs
or the Call Stack, or widen via ①.

---

## 3. Concept B — “Focus Stage” (center-stage viz)

The visualization owns the center. The code editor becomes a **left drawer** you
can collapse to a thin rail (or fully), and Variables + Call Stack form a right
rail.

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOP BAR  brand · </> file · ✓ 11 steps · [▶ Run] · undo/redo · timer │
├──────────┬─────────────────────────────────────────┬────────────────┤
│          │                                         │  VARIABLES     │
│ CODE     │           VISUALIZATION                 │  name + tags   │
│ EDITOR   │           (large center stage)          ├──────↕─────────┤
│          │                                         │  CALL STACK    │
│ ⇔ drawer │                                         │  [Stack|Tree]  │
├──────────┴─────────────────────────────────────────┴────────────────┤
│ PLAYBACK  ⏮ ◀ ▶ ⏭  ────────── slider ──────────  11 / 11    [↕]   │
├──────────────────────────────────────────────────────────────────────┤
│ FOOTER  0.5x | 1x | 2x                        [Reset layout]        │
└──────────────────────────────────────────────────────────────────────┘
```

**Resizable:** ① left drawer width (drag ⇔; collapses to a thin rail, then fully
hidden), ② right-rail width, ③ Variables ⇄ Call Stack, ④ timeline height.

**Collapsible:** editor drawer (rail → hidden), Variables, Call Stack, timeline.

**IO tabs** live under the editor drawer; in collapsed mode they become a small
`INPUT/OUTPUT` chip in the top bar.

**When viz needs more space:** collapse the editor drawer and/or the right rail —
the visualization takes the full width.

---

## 4. Concept C — “Top Controls” (playback on top)

Same panel set, but the **playback bar is pinned under the top bar** — you asked
about “steps on bottom vs on top”. The timeline scrubber stays visible while the
panels below change height. Good for watching the animation *and* scrubbing
without looking down.

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOP BAR  brand · </> file · ✓ 11 steps · [▶ Run] · undo/redo · timer │
├──────────────────────────────────────────────────────────────────────┤
│ PLAYBACK  ⏮ ◀ ▶ ⏭  ────────── slider ──────────  11 / 11   (fixed) │
├───────────┬──────────────────────────────────────┬───────────────────┤
│           │                                      │  VARIABLES        │
│  CODE     │          VISUALIZATION               ├───────↕───────────┤
│  EDITOR   │                                      │  CALL STACK       │
├───────────┴──────────────────────────────────────┴───────────────────┤
│  INPUT | OUTPUT  (thin bottom strip, collapsible to 24px)            │
└──────────────────────────────────────────────────────────────────────┘
```

**Resizable:** ① vertical editor/viz divider, ② right-rail width,
③ Variables ⇄ Call Stack, ④ bottom IO strip height.

**Collapsible:** editor, IO strip, Variables, Call Stack.

**Trade-off:** playback + timeline eat vertical space at the top; the bottom is
just a slim IO strip. If you want the timeline *and* max viz height, pick A or B.

---

## 5. Concept D — “Overlay HUD” (zen visualization)

A bolder model: the visualization is the whole main area. Code, Variables, and
Call Stack float as **dockable overlays** (like a debugger HUD) that you can
drag, resize from their edges, or collapse to tab chips.

```
┌──────────────────────────────────────────────────────────────────────┐
│ TOP BAR  brand · </> file · ✓ 11 steps · [▶ Run] · undo/redo · timer │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                        ┌──────────────────────┐    │
│  │ CODE  [−]    │      VISUALIZATION     │ VARIABLES      [−]  │    │
│  │              │      (maximized)       │ name + tags         │    │
│  │              │                        │ CALL STACK  [−]     │    │
│  │              │                        │ [Stack|Tree]        │    │
│  └──────────────┘                        └──────────────────────┘    │
│                                                                      │
│  [CODE] [INPUT] [VARS] [STACK]   ← collapsed panels become chips     │
├──────────────────────────────────────────────────────────────────────┤
│ PLAYBACK  ⏮ ◀ ▶ ⏭  ────────── slider ──────────  11 / 11           │
└──────────────────────────────────────────────────────────────────────┘
```

**Resizable:** overlays by edge-drag; playback bar height; the panel gutters.

**Collapsible:** everything — collapse all overlays for a clean, distraction-free
canvas (great for demos).

**When viz needs more space:** collapse overlays → true full-screen viz.

**Trade-off:** the most flexible, but overlays can cover part of the canvas;
slightly more complex to build and to keep out of the way while stepping.

---

## 6. Choosing

Quick decision guide:

| | A. TraceCode Grid | B. Focus Stage | C. Top Controls | D. Overlay HUD |
|---|---|---|---|---|
| Feels like | the reference screenshot | a big-canvas demo tool | a video-editor scrubber | a debugger HUD / zen |
| Playback bar | bottom | bottom | **top** | bottom |
| Viz space | good | best | good | best (when overlays hidden) |
| Code editor | fixed panel | collapsible drawer | fixed panel | floating overlay |
| IO location | bottom-left tabs | under drawer | bottom strip | overlay chip |
| Build effort | medium | medium | medium | higher |

**My recommendation:** start with **A (TraceCode Grid)** — it matches the
reference, gives Variables + Call Stack their own fixed areas (your main asks),
and the resize model is simple to get right. If the viz feels small, move to B.
We can also mix: A's layout with C's top playback bar.

Pick a concept (or a mix) and I'll implement it on `feat/ui-revamp` with the full
resize/collapse/persist behavior.
