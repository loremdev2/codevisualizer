# Hyperframes Composition Brief: DSA Lab

## Objective
Create a short launch-style brag video for DSA Lab — a code visualizer that traces algorithms step by step.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21.0 seconds

## Source Material
- Project root: `/Users/amansinganamala/Documents/CodeVuzializer`
- Primary files read: `README.md`, `src/app/page.tsx`, `src/app/globals.css`, `src/lib/site.ts`, `src/lib/templates.ts`, `src/components/visualization-canvas.tsx`, `src/components/workspace/renderers/array-renderer.tsx`, `src/lib/pointers.ts`
- Product name: DSA Lab
- Tagline / strongest claim: "A code visualizer for understanding what an algorithm is doing, one state at a time."
- Key UI or visual moment to recreate: the array bar visualizer with pointer arrows (`i` cyan, `j` orange), the curved comparison bracket between two bars, and the spring FLIP swap with orange swap flash
- Copy that must appear verbatim:
  - "Practice algorithms visually"
  - "Visualize algorithms step by step"
  - "Open visualizer"
  - "You can read code." / "But you can't see it." / "Now watch it think."

## Creative Direction
- Tone preset: `default`
- Creative direction: "clean, postable dev-tool launch — let the product's motion do the bragging"
- Interpretation: comfortable pace with room to breathe; playful copy from the project's own words; clean wipes; no chaos, no corporate polish
- Angle: open on the reading/seeing gap, then let the real trace flow (paste → run → step) brag for itself; close on the callback "You can read code. Now watch it think."
- Hook (first 2-3s): two display lines — "You can read code." then "But you can't see it." — with "see" in cyan
- Outro / punchline: callback line → DSA Lab wordmark + cyan underline + "Practice algorithms visually" + "Open visualizer" chip
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: `#0f0f0f` (dark default); card surface `#1a1a1a`; borders `#383838`
- Text: `#f5f5f5`; muted `#a3a3a3`
- Accent cyan: `#42dcfa` (pointer `i`, comparisons); orange: `#fa9e42` (pointer `j`), swap flash `#f97316`; amber `#f59e0b` (pivot/active line); green `#3ddd8b` (sorted)
- Display font: Inter (system fallback ok); code font: SFMono-Regular/Consolas/Menlo monospace
- Visual references from the project: bar chart array (6 bars, values `[8, 3, 5, 1, 9, 2]`), pointer arrow row under indices, SVG comparison bracket, playback timeline, three workspace panels (Code / Variables / Visualization), shimmer skeleton (`.dsa-shimmer`), `.dsa-shimmer`-style sweep when building the trace

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract. Scene summary:
1. Hook — 3.02s (0.00–3.02) — two type lines, "see" cyan
2. Reveal — 3.01s (3.02–6.03) — product card, wordmark, tagline, flow sub-line
3. The flow: paste → run — 3.49s (6.03–9.52) — code panel typing, Run click, shimmer, 3 panels pop in
4. The trace: watch the swap — 3.49s (9.52–13.01) — bars, pointers, bracket, two spring swaps, swaps counter, timeline scrub
5. The scale: every structure — 3.01s (13.01–16.02) — 5 structure chips pop in one by one, all hold
6. Punchline + logo — 4.99s (16.02–21.01) — callback line, wordmark + CTA, music fades

## Audio
- Audio role: warm upbeat bed + sparse motion-matched accents
- Audio arc: clean fade-in under the hook → groove carries flow/trace scenes with sparse SFX → pop sequence for chips → single impact on final logo as bed fades to silence by 21.0s
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` (already copied into the composition assets)
- Music treatment: `data-volume` 0.55; volume automation lane — fade in 0→1.2s, hold, fade out 19.6→21.0s (clip-local times)
- Music cue guidance: bundled preset `.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json` (120.19 BPM; grid ≈ 0.50s apart from 3.02s). Strong-cue locks: 3.02s card reveal (grid beat), 16.02s scene 5→6 transition + punchline, 20.02s final logo/CTA. Beat-grid snaps: scene boundaries 6.03s and 9.52s and 13.01s; panels 7.02/7.52/8.02; swaps 10.02/11.02; chips 13.51–15.52 every other beat.
- Audio-reactive treatment: subtle; extract per-frame bands from the music (helper: `~/.claude/skills/hyperframes-creative/scripts/extract-audio-data.py`, ffmpeg on PATH via `node_modules/ffmpeg-static/ffmpeg`, numpy installed) and use RMS/bass to make the final wordmark glow breathe. No waveform/equalizer visuals.
- Audio-coupled moments:
  - Scene 3 typing — keypress ticks (rotate 2–3 `assets/sfx/keyboard/keypress-*.wav`)
  - Scene 3 Run click — `interface/click_003.ogg` (low HF risk)
  - Scene 3 panel pops — `interface/switch_007.ogg` or `ui/click2.ogg`
  - Scene 4 swaps — `interface/drop_001.ogg` / `ui/click1.ogg` (tight, motion-locked)
  - Scene 5 chips — `ui/rollover2.ogg` or `interface/bong_001.ogg` per chip
  - Scene 6 logo — `impact/impactSoft_medium_001.ogg` (low HF risk, warm)
- SFX selection guidance: keep levels modest (~0.5), motion-locked timestamps; avoid stacking SFX within 0.2s
- SFX analysis guidance: `.agents/skills/brag/assets/sfx/sfx-analysis.md` — prefer low high-frequency-risk files for repeated moments
- Exact SFX choice: Hyperframes chooses filenames, timestamps, density, and volume based on the implemented animation
- Audio files: music already in `brag-output/composition/assets/music/`; copy any chosen SFX into `brag-output/composition/assets/sfx/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project (the bar visualizer + panels recreation is the centerpiece).
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds (21.0s).
- Include the planned music/SFX layer.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction; restraint when the edit is already busy.
- Consider the Hyperframes audio-reactive workflow for a subtle wordmark glow on the final scene; if extraction fails, note it and skip — do not block the render.
- Use local assets for audio and any required runtime/media dependencies when possible (GSAP from CDN is acceptable per the minimal composition skeleton).
- Run `hyperframes check` before render — it is brag's single gate.
