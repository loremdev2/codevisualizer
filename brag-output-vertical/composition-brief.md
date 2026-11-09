# Hyperframes Composition Brief: DSA Lab — Vertical cut (9:16)

## Objective
Mobile-native 9:16 re-cut of the DSA Lab brag video for Shorts/TikTok/Reels: stacked big type,
one idea per screen, the bar trace as the portrait centerpiece.

## Output
- Composition directory: `brag-output-vertical/composition/`
- Rendered video: `brag-output-vertical/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 21.0 seconds

## Source Material
- Inherits `../brag-output/composition-brief.md` source material: DSA Lab bar visualizer
  (`[8, 3, 5, 1, 9, 2]`), `i` cyan / `j` orange pointers, curved comparison bracket, swap
  flash, slim code strip, timeline fill.
- Product name: DSA Lab
- Copy that must appear verbatim:
  - "Visualize algorithms step by step"
  - "Open visualizer"
  - "You read code." / "You've never SEEN it." / "Now watch it think."

## Creative Direction
- Tone preset: `default`
- Creative direction: "punchy mobile-native cut of the same demo — big stacked type, one idea
  per screen, thumb-stopping swap"
- Interpretation: default pacing, fewer words, bigger relative type, clean wipes, tap-style CTA.
- Hook: stacked "You read code." → "You've never SEEN it." (SEEN cyan)
- Outro: "Now watch it think." → wordmark + CTA tap pulse at 20.02
- Avoid: generic SaaS language, cramped layouts, tiny text, abstract filler

## Visual Identity
- Background: `#0f0f0f`; card `#141414`; borders `#383838`
- Text: `#f5f5f5`; muted `#a3a3a3`; cyan `#42dcfa`; swap flash `#f97316`; pointers `#42dcfa`/`#fa9e42`
- Display font: system sans (Inter first); code font: ui-monospace/Menlo
- Visual references: 6 bars full-width in portrait (values 8/3/5/1/9/2), pointer arrow row,
  bracket arc, swaps counter rail (compact), 2+3 chip grid

## Storyboard
Use the storyboard in `brag-output-vertical/brag-plan.md` as the creative contract. Summary:
1. Hook — 3.02s — stacked lines, "SEEN" cyan
2. Reveal card — 3.01s — wordmark + tagline + mono sub-line at beat 3.02
3. The trace, portrait — 6.98s — code strip 6.53, Run tap 7.30, shimmer, bars 9.52–10.02,
   swap 1 at 10.02, swap 2 at 11.02, counter + timeline
4. Structures + punchline + logo — 7.99s — 5 chips 13.51–15.52, punchline 16.02, wordmark +
   CTA tap pulse 20.02, fade

## Audio
- Audio role: warm upbeat bed + sparse accents (same as the original cut)
- Audio arc: clean fade-in → groove with tap/swap accents → chip pops → single impact, fade
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` (120.19 BPM)
- Music treatment: automation lane — 0→0.55 by 1.2s, hold, fade 19.6→21.0
- Music cue guidance: preset
  `../../../../.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`;
  strong cues 3.02 (grid), 16.02, 20.02; grid 0.50s apart
- Audio-reactive treatment: subtle; bass drives final wordmark glow (generate
  `assets/audio-data.js` from the staged mp3 via the hyperframes-creative extractor, 19.8–21.1s)
- Audio-coupled moments: run tap 7.30 (click_003), swaps 10.02/11.02 (drop_001), chip pops,
  CTA tap pulse + wordmark impact 20.02
- SFX selection guidance: `../../../../.agents/skills/brag/assets/sfx/sfx-analysis.md`;
  assets staged in `composition/assets/sfx/`
- Exact SFX choice: Hyperframes chooses filenames/timestamps/density/volume after animation
- Audio files: staged in `composition/assets/`

## Hyperframes Instructions
Load the Hyperframes domain skills (`hyperframes-core`, `hyperframes-animation`,
`hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`). /brag is its own workflow:
do not enter the `hyperframes` entry-point intent interview and do not route into its generic
promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Composition is 1080x1920 (`data-width="1080" data-height="1920"`); design for portrait from
  scratch — stacked type, full-width bars, generous margins.
- Show at least one real UI/copy/visual element from the project.
- All text readable at mobile size; 15–25s total (21.0s).
- Include the music/SFX layer with the automation-lane treatment.
- 1–3 strong-cue locks max, marked `// beat-locked`; grid snaps marked `// beat-grid`.
- GSAP vendored at `vendor/gsap.min.js`.
- Run `hyperframes check` before render — brag's single gate.
