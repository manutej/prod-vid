# Lessons: CETI launch film run

Format per lesson: trigger, evidence, expected effect, observed effect. Placed in the smallest scope that fixes it (noted as "home").

## L-1 Ink edges fail a hue-cluster gate (fact)
- Trigger: G7 (one accent) fails when only ink and accent are on screen.
- Evidence: v1 had 5.1% off-band. The pixels have median (75,62,100), which is 78% ink over the ground; their saturation of 0.37 is above the 0.35 cut and their distance to ink of 70+ is outside the exclusion. A lossless PNG still showed 22% off-band in library frames, so chroma subsampling isn't the cause (hypothesis tested and refuted in R2).
- Expected: tinting small repeated ink elements reduces fringe pixels.
- Observed: a 72% tint made it worse (7.4%), because the tint sat near the cut and encoding pushed it over. A 60% tint (#706781, S 0.21) gave 2.9%, and also tinting the laced atoms gave 1.85%. Ink text still contributes a floor.
- Home: meta-prompt gate G7 (exclude the ink–ground blend line, see meta-prompt-diff). Locally: small repeated elements use an ink tint with saturation well below the cut.

## L-2 Effect stems must be transient-only (procedure)
- Trigger: G3 misses events or reports early onsets.
- Evidence: v1 had 20 undetectable events and 5 off-sync. Causes: overlapping long tails (caption marimba over keys, done bell over checks), dense landings 3 frames apart, an event at sample 0 (undetectable by any pre/post onset test), and the sustained 5-note mark chord's crest factor firing a false onset 30 ms before the label.
- Expected: strike-only effects, ≥4 frames between dense events, sustains moved to the music stem, no event at frame 0.
- Observed: 144/144 detected, max error 0.67 ms, from v2 onward.
- Home: sound-designer role in the meta-prompt (I17 note) and score code.

## L-3 Same defect twice means change the approach (rule, E5 confirmed)
- Trigger: "cells scatter like particles" in R1 and again in R2 after tuning arcs.
- Evidence: in R1→R2, lowering the arc height and ordering the streams did not fix it. In R3 the approach changed so the 86 indexed prompts move as one rigid block that becomes the first library rows, and it read as engineering at once.
- Same pattern: compaction-as-squeeze glitched in R2 and R3, and compaction-as-fold (the line never moves) was clean in R4. The counter overrun in R2 and R3 was fixed by the counter appearing only after the block lands.
- Home: already in the meta-prompt (E5). It worked as written.

## L-4 Every frame needs something large enough to move (fact)
- Trigger: G6 "frozen" on near-empty frames (a cursor alone on the ground, a cursor alone on the dark end card).
- Evidence: a slow camera on a 4×86 px cursor gives mean frame diff ~0.008, under ε=0.02. A camera turning point (a key where velocity flips sign) produces a near-zero-velocity frame.
- Fix: keep the thread long during the hook (it becomes the writing line under the sentence), avoid velocity sign flips on near-empty frames, and add slow 3D drift to the end card.
- Home: motion-engineer role; candidate invariant (see diff).

## L-5 Discrete state must be evaluated once per output frame (rule)
- Trigger: a glyph missing at 21.033 s (v2), and in the first full-res round (v4) double-exposed counters ("212" at 7.0 s) and a ghost "T" at 21.0 s.
- Evidence: t·fps = 1261.998 floors to the previous glyph count, so the first fix was an epsilon. Under N=4 accumulation the four sub-frames straddle a state change and get averaged. v5 quantises all discrete states (glyph counts, counters, checks) to fd = round(f), and the ghosts were gone.
- Home: composition code (determinism) and meta-prompt I13/I19 (see diff).

## L-6 Readability gates catch focus pulls and transient folds (procedure)
- Trigger: G8 failing on '172' (only ever shown out of focus) and on folded labels (0.1 px).
- Fix: time focus pulls so every claim gets ≥0.2 s per word in focus, and hide fully folded labels instead of leaving them at 0.1 px.
- Home: storyboard (S4 should list each claim's in-focus window).

## L-7 Render budget on 2 cores (fact)
- HyperFrames 0.8.174 with chrome-headless-shell 1194 engaged BeginFrame capture. Preview (960x540@30, 720 frames) took 39–43 s. Full spec (1920x1080@60, 1440 frames) took 154–163 s per pass; four 180°-shutter passes (offsets ±0.375/±0.125 of a half-frame) plus ffmpeg `mix` averaging and x264 encode came to 713–734 s per round. Gates on a full render took ~100 s.
- So full-res rounds are affordable (≈14 min each). Four full-res rounds (r4–r7) were run, more than the "last two" the strategy requires, because full-res exposed new defects (L-5 ghosts, G6 on 1-frame cadence, G7 rising with motion blur).

## L-8 Full-res + accumulation changes gate outcomes (fact)
- G7 went from 1.7% (preview) to 4.49% (full res, N=4). G6 passed on 30 fps preview but failed on the 60 fps one-frame cadence. Preview gates are not predictive for blur- or cadence-sensitive gates.
- Fixed N=4 also strobes on very fast, large edges (the DONE disc at 20.5 s shows four stepped rings for about 3 frames). This is an open P3.
- Home: render strategy (run at least one full-res gate pass early) and an adaptive-N proposal in the diff.

## L-9 Near-empty frames need a soft moving area (procedure)
- Trigger: G6 kept failing by small margins on the dark end card (v4 f1259, v5 f1253–55, v6 f1255 at 0.0198).
- Approach changes that worked: overlapping action (the first glyph types while the cursor stands) and a breathing accent glow riding the thread head into the dark (v6/v7). v7 minimum diff was 0.0243.


# Phase 2 (v8, meta-prompt v1.1) lessons

## L-10 Encoded G7 fails on ink text under 4:2:0 even when lossless passes (fact)
- Evidence: v8 lossless frames 0.04–0.05% off-band (passes); the same frames encoded H.264 High yuv420p CRF 14 at 1080p reach 9.5% (8.1% on the N=4 final). Encoder-side lanczos/full_chroma_int chroma downsampling changed nothing (9.4%). 4:2:0 shares one chroma sample per 2×2 block, so ink-glyph edges decode as light saturated violets far (ΔE > 8) from the ink–ground line.
- Home: the gate (G7 encoded must allow chroma-subsampling error, or be judged on lossless), see the meta-prompt diff.

## L-11 A 24 s film has a reading budget (procedure)
- Evidence: v8 R1 G8 failed until the long strings went (row purposes of ~27 words need 5.4 s sharp; the excerpt of 50 words needs 10 s). Verbatim fragments (7 words) and longer still holds fixed it.
- Rule: list every on-screen string with words × 0.2 s in the storyboard, and plan a still hold long enough for the longest string visible in it.

## L-12 Under N=4 accumulation a 4 px through-line disappears on fast moves (fact)
- Evidence: v8 R2 full-res G4 found no accent at 15.5–20.75 s; the 4 px thread smeared below the accent colour distance during the hero push (~12 px/frame). It passed on the preview, which has no accumulation.
- Fix: a 7 px stroke at 1080p.

## L-13 Never push the camera into text (fact)
- Evidence: v8 R1 pushing 80× into the "2 Reader" pill rasterized the label into giant pixelated glyphs and tripped G5 (SSIM).
- Fix: on the hit, the label lifts out of the pill and the camera pushes into a clean capsule.

## L-14 Zoom about the target, don't lerp the centre (procedure)
- Evidence: lerping the camera centre while zoom grows exponentially threw the pill off the top of frame (G4 miss at 20.25 s).
- Fix: keep the target's screen position on a path to centre and solve the camera centre from it: c = P − (s − 960)/z.

## L-15 Hide containers with display, not visibility (fact)
- Evidence: children that set `visibility: visible` stayed on screen inside a hidden card (brief text leaked into the Atlas scene at 16.5 s).

## L-16 Thread width must scale with its screen speed under N-sample blur (procedure)
- Evidence: v8 R2 G4 failed at 15.5/17.0/18.25/19.5 s even with a 7 px stroke. The thread moved 12–35 px/frame, its four sub-samples stopped overlapping, and no pixel kept the full accent. A stroke of 7 + 0.45 × speed (≤ 22 px) passed G4 (min 378 px).
- Cost: in frames sampled mid-move the line reads heavy (13.0 s outline). Better next time: slow those moves or raise N on fast frames instead of widening.

# Phase 2b (v9, after the v8 blind panel 5.0 vs self 6.75)

## L-17 Every count on screen must be countable on screen (rule)
- Evidence: the v8 blind panel flagged "9 of 9 checks passed" after only 5 visible rules as staged (P1, two lenses).
- Fix in v9: "5 of 5 rules hold" right after the 5 rules; "86 of 86 quotes verified against source" ties to the Atlas's 86 unique prompts.
- Home: storyboard (S4 lists every number with the on-screen items it counts).

## L-18 A conflict needs its resolution on screen (rule)
- Evidence: the v8 panel read "Conflict … Pass" as a contradiction. v9 shows the ruling line before Pass.

## L-19 Never show an empty container (rule)
- Evidence: v8's blank red outline at 13.0 s and empty dashboard at 13.6 s (P1); v9 R3's empty brief card at 4–5 s (self P2).
- Fix: containers are sized by their landed content (card height follows rows); the Atlas is revealed only above the thread's sweep line, so content and container appear together.

## L-20 Adaptive sub-frames beat a global N (procedure)
- Evidence: N=4 strobed (double-exposed text) on fast moves. A speed probe (max per-frame motion of any text box or the thread) flags the frames above 6 px/frame (±3 frames). A dense composition maps its frame i to film frame list[i]; those frames render at N=16 and are spliced in. Mapping verified: dense-vs-seek diffs 1.4–2.3 against 16–18 for wrong frames.
- Home: render strategy (meta-prompt I13).

## L-21 A zoom about an edge point sweeps the whole frame (fact)
- Evidence: v9 SSIM fell from 0.993 to 0.376 on the first push frame when zooming about the pill near the top edge.
- Fix: bring the pill near centre first (camera pan during the quiet hold, then a pan with ease-in-out), and let log-zoom start slowly (∝ p²) so most of the zoom happens about frame centre.

## L-22 Self-scores run high; the gap is a defect to track (E9)
- Evidence: v7 self 7.5 vs blind 4.4 (gap 3.1); v8 self 6.75 vs blind 5.0 (gap 1.75). Blind panels name storyline truth problems (counts, unresolved conflict, empty containers) that machine gates cannot see.
