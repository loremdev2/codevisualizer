# Brag Plan: DSA Lab — `--voice` run

## What is this app?
DSA Lab is a code visualizer: paste an algorithm, run it in a sandboxed trace runner, and step
through every comparison, swap, and recursive call rendered as live visuals.

## Run parameters
- Invocation: `/brag --voice`
- Tone: default (inferred)
- Format: landscape 1920×1080
- Narration: **enabled**, Kokoro `af_heart` via Hyperframes
- Output dir: `brag-output-2026-09-19-232409/` (timestamped — `brag-output/` already exists)

## Storyboard (durations flex to generated audio)
| # | Scene | Start | Dur | Beat | Visual |
|---|-------|-------|-----|------|--------|
| 1 | Hook | 0.00 | 4.20 | — | "You can read code." / "But you can't **see** it." |
| 2 | Reveal card | 4.20 | 4.40 | grid | DSA Lab card, real tagline |
| 3 | The flow | 8.60 | 4.70 | grid | code types in → cursor clicks ▶ Run trace → panels populate |
| 4 | The trace | 13.30 | 3.60 | swap-locked | bars [8,3,5,1,9,2], i/j pointers, 2 swaps, counter ticks |
| 5 | Structures | 16.90 | 3.50 | grid | caption + 5 chips pop on beat grid |
| 6 | Punchline + logo | 20.40 | 3.00 | strong cue | "Now **watch** it think." → wordmark (bass-reactive glow) |

Total: 23.40s. VO waveforms: vo1 4.12s, vo3 3.46s, vo4 5.65s, vo5 3.56s, vo6 3.61s.

## Voiceover script
Written to complement the visuals (not read the on-screen text), one line per scene. Generated
with `npx hyperframes tts --voice af_heart`, one WAV per scene, wired on track 3; music ducks
to 0.14 via a volume automation lane for the full VO span.

| File | Line | Dur | Placed at |
|------|------|-----|-----------|
| vo1.wav | "You've read code a thousand times. But you've never actually seen it run." | 4.12s | 0.30 |
| vo3.wav | "Paste any algorithm, hit run, and step through every state." | 3.46s | 9.10 |
| vo4.wav | "A sandboxed engine records every state and renders it live. Pointers, swaps, counters." | 5.65s | 13.10 |
| vo5.wav | "Arrays, graphs, recursion. Same engine, every structure." | 3.56s | 19.55 |
| vo6.wav | "Stop reading code. Start watching it think. DSA Lab." | 3.61s | 19.30* |

*vo6 is the reveal-scene line, placed under the DSA Lab card reveal (4.40s) — file kept from the
first take. It ends before scene 3 begins. Scene 5's spoken caption is vo5.

## Audio
- Music: `happy-beats-business-moves-vol-1-by-ende-dot-app.mp3`, cue preset `happy-beat.json`
  (grid 0.51s, strong cues 16.02/20.02s → re-anchored to timeline as 21.90/25.90 — logo hit
  placed at the timeline's own strong-cue-equivalent 21.90s).
- Music duck: `data-automation` volume lane — 0.55 baseline, down to 0.14 over 0.3s at each VO
  start, hold, back up 0.4s after each VO end.
- SFX: typing keys under scene 3 code reveal, click on ▶ Run, panel/rollover pops, swap drops on
  both swaps, chip bongs on the beat grid, logo impact at 21.90s.
- Audio-reactive: bass band drives the end-card wordmark glow (extracted at 30fps, 4 bands).

## Deliverables
- `brag-output-2026-09-19-232409/brag.mp4` (1920×1080, H.264 + AAC)
- `brag.jpg` poster baked as frame 0 (trace moment ~15.9s)
- `share-copy.txt`
