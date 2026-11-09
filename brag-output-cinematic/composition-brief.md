# Hyperframes Composition Brief: DSA Lab — Cinematic re-cut

## Objective
Cinematic-tone re-roll of the DSA Lab brag video: trailer-scale reveal, one dramatic punch-in,
same real product material as the default cut.

## Output
- Composition directory: `brag-output-cinematic/composition/`
- Rendered video: `brag-output-cinematic/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 22.12 seconds

## Source Material
- Inherits `../brag-output/composition-brief.md` source material: DSA Lab bar visualizer
  (`[8, 3, 5, 1, 9, 2]`), `i` cyan / `j` orange pointers, curved comparison bracket, workspace
  panels, shimmer, timeline fill.
- Product name: DSA Lab
- Copy that must appear verbatim:
  - "Practice algorithms visually"
  - "Open visualizer"
  - "read." / "see." / "You've read code your whole life." / "Now you can." / "DSA LAB"

## Creative Direction
- Tone preset: `cinematic`
- Creative direction: "trailer for a product that makes code visible — big type, wide frames,
  one dramatic punch-in, restrained everywhere else"
- Interpretation: 4 scenes, long holds, dramatic wipes/crossfades, single punch-in peak at the
  swap, warm-then-cold discipline, giant letter-spaced title.
- Hook: typed "read." → "see." slam on the 3.70s strong cue
- Outro: "Now you can." → DSA LAB wordmark at 20.02 + CTA
- Avoid: generic SaaS language, abstract filler, strobing, chaos

## Visual Identity
- Background: `#0f0f0f` with darker vignette edges; card `#141414`; borders `#383838`
- Text: `#f5f5f5`; muted `#a3a3a3`; cyan `#42dcfa`; swap flash `#f97316`; pointers `#42dcfa`/`#fa9e42`
- Display font: system sans (Inter first); code font: ui-monospace/Menlo
- Visual references: wide full-bleed workspace, Ken Burns drift on the title, punch-in 1.00→1.12
  toward the bars at the swap, RMS-driven wordmark glow

## Storyboard
Use the storyboard in `brag-output-cinematic/brag-plan.md` as the creative contract. Summary:
1. Cold open read/see — 4.23s — typed word, slam word on strong cue 3.70
2. Title card — 3.69s — DSA LAB slam at 6.34 + underline sweep + slow push
3. The machine + trailer beat — 7.11s — code lines 8.44–9.50, run 9.50, punch-in + swap at 10.54,
   swap 2 at 11.60, counter ticks
4. Outro — 7.09s — "We read code." → "Now you can." → wordmark 20.02 + CTA, fade

## Audio
- Audio role: cinematic support
- Audio arc: quiet dark open → controlled slams → swell into the punch-in swap → gentle fade
- Music: `assets/music/happy-beats-business-moves-vol-9-by-ende-dot-app.mp3` (114.84 BPM)
- Music treatment: automation lane — 0.35 at 0s → 0.5 by 3.2s → swell 0.62 at 10.4–11.6 →
  fade 20.6→22.1
- Music cue guidance: preset
  `../../../../.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json`
  (already staged next to the track); strong cues 3.70 / 6.34 / 10.54; wordmark at grid 20.02
- Audio-reactive treatment: subtle; bass drives wordmark glow + faint vignette breathing
- Audio-coupled moments: typing ticks (3 total, not per-letter), slam at 3.70, title accent
  6.34, run click 9.50, swap impact 10.54 + 11.60, wordmark impact 20.02
- SFX selection guidance: `../../../../.agents/skills/brag/assets/sfx/sfx-analysis.md`;
  low-HF-risk files; assets already staged in `composition/assets/sfx/`
- Exact SFX choice: Hyperframes chooses filenames/timestamps/density/volume after animation
- Audio files: staged in `composition/assets/`

## Hyperframes Instructions
Load the Hyperframes domain skills (`hyperframes-core`, `hyperframes-animation`,
`hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`). /brag is its own workflow:
do not enter the `hyperframes` entry-point intent interview and do not route into its generic
promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI/copy/visual element from the project (the bar trace is the centerpiece).
- All text readable; 15–25s total (22.12s).
- Include the music/SFX layer; honor the automation-lane treatment.
- 1–3 strong-cue locks max (3.70 / 6.34 / 10.54), marked `// beat-locked`; grid snaps marked
  `// beat-grid`; natural timing allowed when it aids readability.
- GSAP vendored at `vendor/gsap.min.js`; audio data at `assets/audio-data.js` if needed
  (generate from the staged mp3 via the hyperframes-creative extractor).
- Run `hyperframes check` before render — brag's single gate.
