# Brag Plan: DSA Lab — Cinematic re-cut

## What is this app?
DSA Lab is a code visualizer: paste an algorithm, run it in a sandboxed trace runner, and step
through every comparison, swap, and recursive call rendered as live visuals.

## The angle
Trailer-scale reveal: treat "seeing code" as the dramatic payload. Cold open on the gap
(reading vs seeing), a title slam, then a slow camera push into the working machine. Same real
product material as the default cut (bars, pointers, comparison bracket, panels, swap flash) —
staged wide, hit hard, held long. Wide shots, big type, dramatic wipes; the swap moment gets
the trailer beat.

## Hook (first 2-3 seconds)
Black frame. One word types onto the darkness: "**read.**" — then a hard cut: "**see.**" slams
in at 3.18s scale, the word enormous. Then the full line lands: "You've read code your whole
life." — hold — "Now *see* it." Title card slams on the 6.34s strong cue: **DSA LAB**.

## Key moments (the middle)
- **Title slam** — giant "DSA LAB" with cyan underline sweep on the 6.34s strong cue,
  eyebrow "Practice algorithms visually".
- **The machine, wide** — full-bleed workspace recreation; camera pushes slowly in (scale 1.00
  → 1.06) as code appears and the Run button pulses.
- **The trailer beat** — at the 10.54s strong cue: comparison bracket draws, the frame
  TIGHTENS toward the bars (punch-in to 1.12), then the swap hits — orange flash, bars fly,
  impact SFX, brief slow-motion feel (longer eased tween). Counter slams 0→1.

## Outro / punchline
"We read code. / We never see it." resolves to: "**Now you can.**" — then **DSA LAB** wordmark
lands on the 20.02s strong cue with "Open visualizer" CTA. Music swells then fades.

## User flow worth showing
Same centerpiece flow as the original cut: code appears → Run trace clicked → trace builds →
bars swap with pointers and bracket → timeline advances.

## Tone
- Preset: `cinematic`
- Creative direction: "trailer for a product that makes code visible — big type, wide frames,
  one dramatic punch-in, restrained everywhere else"
- Interpretation: fewer scenes (4), longer holds, dramatic wipes and crossfades, one
  tight punch-in as the peak moment, warm-then-cold color discipline, big display type with
  generous letter-spacing on the title.

## Format: landscape — 1920x1080
## Duration: 22.1s (boundaries snapped to the vol. 9 beat grid, 114.84 BPM)

## Visual identity (from the project)
- Background: `#0f0f0f` (deep near-black; cinematic cut pushes vignette edges darker)
- Card surface: `#141414`, borders `#383838`
- Text: `#f5f5f5`; muted `#a3a3a3`
- Accent cyan: `#42dcfa`; orange swap flash: `#f97316`; pointer orange `#fa9e42`; amber `#f59e0b`
- Display font: Inter (system fallback); code font: ui-monospace/Menlo
- Strongest visual element: the bar chart with pointers + bracket, punch-in toward the swap

## Share copy (draft)
You've read code your whole life. Now see it — DSA Lab traces every swap, every call, one
state at a time.

## Audio direction
- Role: cinematic support — warm bed, restrained accents, one swell into the trailer beat
- Music: `happy-beats-business-moves-vol-9-by-ende-dot-app.mp3` (bundled, 114.84 BPM — denser,
  moodier than vol. 1)
- Music treatment: start 0.0s low (0.35), rise to 0.5 by 3.2s, hold, brief swell to 0.62 at
  10.4–11.6s around the punch-in, fade out 20.6→22.0s
- Music cue guidance: preset
  `assets/music/cues/happy-beats-business-moves-vol-9-by-ende-dot-app.music-cues.json` —
  grid ≈ 0.53s apart; strong cues at 3.70, 4.23, 5.28, 6.34, 8.44, 10.54, 12.65s.
  Strong-cue locks: "see." slam at 3.70, title card at 6.34, punch-in+swap at 10.54, outro
  wordmark at 20.02 (grid beat). Beat-grid snaps: machine reveal 7.92; code lines 8.44–9.50;
  run click 9.50.
- Audio-reactive treatment: subtle; music bass drives the final wordmark glow and a faint
  vignette breathing in scene 2. No waveform/equalizer visuals.
- SFX posture: sparse; every hit earns its place
- Audio-coupled moments: typed "read." (key ticks), "see." slam (impactSoft_medium), title
  slam (impactSoft_heavy-style via impactSoft_medium_001 at higher volume), run click, swap
  impact (drop_001 + brief low tick), wordmark landing (impactSoft_medium_001)
- Restraint rule: no SFX inside the cold open beyond the typing ticks; never stack hits
  within 0.25s

## Storyboard

### Scene 1 — Cold open: read / see — 4.23s (0.00–4.23)
Near-black. "read." types letter by letter, small, centered, mono, muted — key ticks. Hard cut
on the 3.70s strong cue: "see." slams to 150px, cyan, screen-shake 6px decaying. Hold to the
wipe. (The "You've read code your whole life." line moved to the outro where it can hold long
enough to read.)
Sequential/interaction: yes — typed word then slam.
Audio intent: dark and quiet, then one loud controlled hit.
Audio-coupled idea: typing ticks; slam impact on the strong cue.
Music: low bed rising.
Transition mood: dramatic wipe → Scene 2.

### Scene 2 — Title card — 3.69s (4.23–7.92)
Giant "DSA LAB" (letter-spaced, 150px) slams on the 6.34s strong cue with a cyan underline
sweeping left→right and a slow 1.00→1.04 scale drift (Ken Burns push). Eyebrow "Practice
algorithms visually" fades in after. Vignette breathes faintly with the music.
Sequential/interaction: none (pure title).
Audio intent: the bed opens up; single soft accent on the slam.
Audio-coupled idea: underline sweep synced to the slam decay.
Music: cinematic support.
Transition mood: dramatic wipe → Scene 3.

### Scene 3 — The machine + the trailer beat — 7.11s (7.92–15.03)
Wide full-bleed workspace (Code / Variables / Visualization). Code appears line by line
(8.44–9.50), Run click at 9.50, shimmer builds, panels populate on the grid (10.01, 10.54).
At 10.54 (strong cue): punch-in — the whole workspace scales 1.00→1.12 toward the bars over
0.8s while the bracket draws and the first swap hits with impact SFX and orange flash.
Second swap at 11.60. Counter 0→1→2. Timeline fill advances 0.22→0.55. Camera holds tight
through 15.03.
Sequential/interaction: yes — code lines, run click, two swaps, counter ticks.
Audio intent: rising tension → single biggest hit of the video at the swap.
Audio-coupled idea: punch-in + swap land together on the strong cue.
Music: swell through the beat, then settle.
Transition mood: slow crossfade → Scene 4.

### Scene 4 — Outro: now you can — 7.09s (15.03–22.12)
"We read code." (muted, wide hold) → crossfade → "Now you can." (big, white, cyan period).
DSA LAB wordmark lands on the 20.02 grid beat with "Open visualizer" chip; wordmark glow
breathes with music bass (pre-extracted bands); music fades to silence by 22.0s.
Sequential/interaction: yes — line, line, wordmark, CTA each held.
Audio intent: final swell then quiet.
Audio-coupled idea: wordmark glow RMS-coupled; one impact at the wordmark.
Music: fade out.
Transition mood: none (end card).

**Music mood for this video:** cinematic (moody bundled track, vol. 9)
**Audio summary:** quiet dark open → controlled slams → one swelling peak at the punch-in
swap → gentle final fade under the wordmark.

## Reading-time check
- "read." / "see." are single words — 0.8s floor each; both hold ≥1.0s settled. ✓
- Title card 3.69s for two short lines. ✓
- Scene 4 lines hold 2s+ each before the wordmark. ✓

## Beat lock plan (summary)
- `// beat-locked: 3.70s` — "see." slam (strong cue)
- `// beat-locked: 6.34s` — title card slam (strong cue)
- `// beat-locked: 10.54s` — punch-in + first swap (strong cue)
- `// beat-grid` — code lines 8.44–9.50, run 9.50, panels 10.01/10.54, swap 2 11.60,
  wordmark 20.02
