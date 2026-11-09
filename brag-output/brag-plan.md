# Brag Plan: DSA Lab

## What is this app?
DSA Lab is a code visualizer: paste an algorithm, run it in a sandboxed trace runner, and step
through every comparison, swap, and recursive call rendered as live visuals — no visualization
code required.

## The angle
Code is readable but invisible — you can trace bubble sort in your head, but you can't *watch*
the swap happen. DSA Lab is the lab where arrays become bars, pointers become arrows, and every
state of the run is a step you can scrub. The video's joke structure: open on the reading/seeing
gap, then let the product's actual motion (bar swaps, pointer arrows, the comparison bracket)
do all the bragging. Everything shown is real product material: real template input
(`[8, 3, 5, 1, 9, 2]`), real pointer colors (`i` cyan, `j` orange), real panel layout.

## Hook (first 2-3 seconds)
Two display-type lines on near-black:
"You can read code." → snap → "But you can't see it."
The second line's "see" hits, then wipe into the product reveal. Fast-in, held long enough to read.

## Key moments (the middle)
- **The flow:** a code panel types bubble sort, a cursor clicks "Run trace", a shimmer sweep
  builds the trace, then Code / Variables / Visualization panels pop in one by one.
- **The trace:** real bar visualization — 6 bars `[8, 3, 5, 1, 9, 2]`, `i`/`j` pointer arrows,
  a curved comparison bracket connecting two bars, then a spring FLIP swap with the two bars
  flashing orange. A playback timeline scrubs underneath.
- **The scale:** chips for every structure it renders — Array bars, String window, HashMap,
  Graph, Call stack — appearing one by one (all stay on screen after appearing).

## Outro / punchline
Callback to the hook: "You can read code. Now watch it think." → DSA Lab wordmark lands on a
strong beat with the "Practice algorithms visually" eyebrow and an "Open visualizer" chip.

## User flow worth showing
Entry → key action → result, straight from the product:
1. Paste/select an algorithm (code panel with bubble sort).
2. Run the trace (Run button → shimmer → panels populated).
3. Step through states (bars swap, pointers move, timeline advances).

## Tone
- Preset: `default`
- Creative direction: "clean, postable dev-tool launch — let the product's motion do the bragging"
- Interpretation: comfortable pace with room for each moment to breathe; playful copy pulled
  from the project's own words; clean crossfade/wipe transitions; no chaos, no corporate polish.

## Format: landscape — 1920x1080
## Duration: 21.0s (scene boundaries snapped to the music beat grid)

## Visual identity (from the project)
- Background: `hsl(0 0% 6%)` ≈ `#0f0f0f` (dark theme default; system-dark is the product default)
- Card surface: `hsl(0 0% 10%)` ≈ `#1a1a1a`, borders `hsl(0 0% 22%)` ≈ `#383838`
- Text: `hsl(0 0% 96%)` ≈ `#f5f5f5`; muted `hsl(0 0% 65%)` ≈ `#a3a3a3`
- Accent cyan (pointer `i`, comparisons, changed cells): `hsl(190 95% 62%)` ≈ `#42dcfa`
- Accent orange (pointer `j`, swap flash — product uses orange-500 for swaps): `hsl(30 95% 62%)`
  ≈ `#fa9e42`; swap flash `#f97316`
- Amber (pivot marker): `hsl(38 92% 50%)` ≈ `#f59e0b`
- Green (sorted/done): `hsl(152 52% 50%)` ≈ `#3ddd8b`
- Display font: Inter (fallback `-apple-system, system-ui, sans-serif`)
- Body font: Inter; code font: SFMono-Regular/Consolas/Menlo monospace
- Strongest visual element: the bar-chart array with pointer arrows + comparison bracket,
  FLIP-animated swaps (framer-motion springs in the real product)

## Share copy (draft)
Paste any algorithm and watch it think — DSA Lab traces every comparison, swap, and call, one
state at a time. No visualization code. Just step through it.

## Audio direction
- Role: warm upbeat bed + sparse motion-matched accents
- Music: `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` (bundled, 120.19 BPM)
- Music treatment: start at 0.0s, medium bed volume (~0.6), low-pass-free; fade out across the
  final logo hold (~19.5s → 21.0s)
- Music cue guidance: bundled preset
  `assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`
  — beat grid ≈ every 0.50s from 3.02s; strong cues at 16.02, 17.02, 18.02, 18.52, 20.02s.
  Strong-cue locks: scene 2→3 wipe (3.02), scene 5→6 transition (16.02), final logo/CTA (20.02).
  Beat-grid snaps: scene boundaries 6.03, 9.52, 13.01; panel pops and structure chips on
  consecutive beats; swaps on 10.02 / 11.02 / 12.02.
- Audio-reactive treatment: subtle; music RMS/bass may make the hero wordmark ring/glow breathe
  and bar presence swell slightly. No waveform/equalizer visuals.
- SFX posture: sparse-moderate; motion-matched
- Audio-coupled moments: typing in the code panel (key ticks), cursor click on Run (ui click),
  panel pops (pop/whoosh), each swap (short tick/whoosh), logo landing (impact), CTA (soft tick)
- Restraint rule: no SFX during the hook lines — let the type land clean; never let SFX stack
  on top of each other within 0.2s

## Storyboard

### Scene 1 — Hook: the reading/seeing gap — 3.02s (0.00–3.02)
Near-black background. Display type, Inter, two lines in sequence:
"You can read code." (settles ~0.3s, holds ~1.2s) then "But you can't see it." snaps in
(~1.6s), the word "see" in cyan. Both lines hold together to 3.02s, then wipe.
Sequential/interaction: yes — two lines appear one by one, fast-in then held.
Audio intent: music enters under the lines; no SFX — let the type land clean.
Audio-coupled idea: none (deliberate silence before the beat).
Music: upbeat bed fades in.
Transition mood: clean wipe → Scene 2.

### Scene 2 — Reveal: DSA Lab — 3.01s (3.02–6.03)
Product card (rounded, border `#383838`, surface `#1a1a1a`) scales in with the DSA Lab wordmark,
eyebrow "Practice algorithms visually" in cyan, tagline "Visualize algorithms step by step"
verbatim, and a sub-line "Paste code → run the trace → step through it."
Sequential/interaction: card + 3 text rows arrive in quick succession, all hold.
Audio intent: bed settles into its groove; one soft announcement accent on the card landing.
Audio-coupled idea: card reveal on the 3.02s strong beat.
Music: upbeat bed.
Transition mood: clean wipe → Scene 3.

### Scene 3 — The flow: paste → run — 3.49s (6.03–9.52)
Recreate the working app: a Code panel (monospace) where bubble sort types in with the active
line highlighted amber; cursor moves to a "Run trace" button and clicks; the product's shimmer
skeleton sweeps (`.dsa-shimmer`); then three workspace panels pop in one by one — Code,
Variables, Visualization — each with a pop. Panels stay.
Sequential/interaction: yes — typing, a simulated cursor click, 3 panels arriving one by one
(on consecutive beats ~7.02/7.52/8.02).
Audio intent: rhythm of typing and clicks builds anticipation into the payoff.
Audio-coupled idea: key ticks during typing; ui click on Run; pops on panel arrivals.
Music: upbeat bed.
Transition mood: hard cut on the beat → Scene 4.

### Scene 4 — The trace: watch the swap — 3.49s (9.52–13.01)
The payoff, full width: 6 bars `[8, 3, 5, 1, 9, 2]` (heights scaled like the product), `i` arrow
cyan and `j` arrow orange beneath indices, curved comparison bracket connecting bars j and j+1,
then SPRING swap — two bars slide past each other and flash orange, `swaps` counter ticks 0→1
in a variables rail. Second swap at ~11.02 (bars end closer to `[3, 5, 8, ...]` order feel).
A playback timeline at the bottom advances as steps pass; step counter "Step 3 / 27" style.
Sequential/interaction: yes — two swap events on beats 10.02 and 11.02 (sound + motion land
together), timeline scrubbing throughout.
Audio intent: the bed's energy carries the motion; each swap gets a tight tick/whoosh.
Audio-coupled idea: swaps beat-aligned; counter tick with each swap.
Music: upbeat bed.
Transition mood: clean wipe on 13.01 → Scene 5.

### Scene 5 — The scale: every structure — 3.01s (13.01–16.02)
Five compact structure chips pop in one by one across the frame, each a miniature of the real
renderers: "Array bars" (tiny bars), "String window" (bracketed substring), "Hash map" (key→value
rows), "Graph" (nodes + edges), "Call stack" (stacked recursion frames). All stay on screen;
caption beneath: "One trace. Every structure." Chips land on consecutive beats 13.51–15.52.
Sequential/interaction: yes — 5 chips arriving one by one, held as a full set afterward.
Audio intent: playful pops stringing into the pre-chorus before the final beat.
Audio-coupled idea: chip pop per beat (non-text accents may hit every beat).
Music: upbeat bed building.
Transition mood: dramatic wipe onto the strong 16.02 cue → Scene 6.

### Scene 6 — Punchline + logo — 4.99s (16.02–21.01)
Callback line lands on the 16.02 strong cue: "You can read code. Now watch it think." Then the
DSA Lab wordmark + cyan underline land on the 20.02 strong cue with the eyebrow "Practice
algorithms visually" and an "Open visualizer" chip; subtle audio-reactive glow breathes on the
mark as the music fades out.
Sequential/interaction: punchline → logo → CTA, each held.
Audio intent: one impact on the logo landing; music fades under the final hold.
Audio-coupled idea: final logo on strong cue 20.02; RMS glow on the wordmark.
Music: upbeat bed, fading out to silence by 21.0s.
Transition mood: none (end card).

**Music mood for this video:** upbeat (bundled "Happy Beats / Business Moves" vol. 1)
**Audio summary:** clean fade-in under the hook, groove carries the flow and trace scenes with
sparse motion-matched SFX, a pop sequence for the structure chips, and one impact on the final
logo as the bed fades to silence.

## Reading-time check
- Hook lines: 4 words (~1.2s) and 5 words (~1.5s) floors — both hold ≥1.2s settled. ✓
- Scene 2 rows are short labels (~0.8s floor each), arriving within 3s and holding. ✓
- Scene 5 chips are 1–2 word labels on 0.5s-apart beats — revealed quickly and the full set
  holds through the end of the scene, per the sequential-text rule. ✓
- Scene 6 punchline (8 words, ~2.4s floor) holds from 16.02 to ~19.0s. ✓

## Beat lock plan (summary)
- `// beat-locked: 3.02s` — Scene 2 card reveal (grid beat)
- `// beat-locked: 16.02s` — Scene 5→6 transition + punchline (strong cue)
- `// beat-locked: 20.02s` — final logo + CTA (strong cue)
- `// beat-grid` — Scene 3 panels (7.02/7.52/8.02), Scene 4 swaps (10.02/11.02), Scene 5 chips
  (13.51/14.02/14.52/15.02/15.52)
