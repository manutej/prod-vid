# Lessons (v1–v9)

Each lesson: what happened, the evidence, and the fix. Read before storyboarding. Full evidence for 1–22 is in `lessons-detailed.md`.

1. **Ink edges fail a hue-cluster gate.** v1 had 5.1% off-band pixels that were 78% ink over ground. Tinting made it worse. Fix: count blends between ink and ground as ink.
2. **Effect stems must be transient-only.** v1 had 20 undetectable events: overlapping tails, landings 3 frames apart, an event at sample 0, a chord firing a false onset. Fix: strike-only effects, ≥4 frames apart, sustained tones in the music stem, no event at frame 0.
3. **Same defect twice means change the approach.** Tuning arcs never fixed "cells scatter like particles"; moving the 86 items as one rigid block fixed it at once. Same for compaction: squeeze failed twice, fold worked.
4. **Every frame needs something large enough to move.** A slow camera on a lone cursor gives a frame difference of about 0.008, under the 0.02 floor. Avoid camera velocity sign flips on near-empty frames.
5. **Evaluate discrete state once per output frame.** Under N=4 accumulation, sub-frames straddling a counter change averaged into ghosts ("212"). Fix: quantise glyph counts, counters and checks to the output frame.
6. **Plan focus pulls against reading time.** A claim only ever shown out of focus fails readability. Give every claim ≥0.2 s per word in focus; hide folded labels rather than leaving them at 0.1 px.
7. **Render budget on 2 cores.** Preview (960x540@30, 720 frames) about 40 s; full spec (1920x1080@60) about 160 s per pass; four-pass accumulation plus encode about 12–14 min; gates about 100 s.
8. **Full-res plus accumulation changes gate outcomes.** G7 rose from 1.7% to 4.5%; G6 passed at 30 fps and failed at 60. Run a full-spec gate pass early.
9. **Near-empty frames need a soft moving area.** A breathing accent glow riding the thread into the dark fixed repeated near-misses on G6.
10. **4:2:0 encoding fails G7 on ink text even when lossless passes.** Lossless 0.04%, encoded 9.5%, unchanged by chroma filters. Judge on lossless frames.
11. **A 24 s film has a reading budget.** A 27-word string needs 5.4 s sharp. List every string with words × 0.2 s and plan holds for the longest one.
12. **Under N=4 a 4 px line vanishes on fast moves.** Use at least 7 px at 1080p, or adaptive sub-frames.
13. **Never push the camera into text.** An 80× push into a label rasterised into giant pixels and tripped SSIM. Lift the label out and push into a clean shape.
14. **Zoom about the target.** Lerping the centre while zoom grows threw the target off frame. Solve the camera centre from the target's screen path: c = P − (s − 960)/z.
15. **Hide containers with display, not visibility.** Children with `visibility: visible` leaked out of hidden cards.
16. **Line width must scale with screen speed under N-sample blur.** 7 + 0.45 × speed (≤ 22 px) passed, but reads heavy mid-move. Better: slow the move or raise N on fast frames.
17. **Every count must be countable.** "9 of 9 checks" after 5 visible rules was read as staged by two blind critics.
18. **A conflict needs its resolution on screen.** "Conflict … Pass" reads as a contradiction; show the ruling first.
19. **Never show an empty container.** A blank outline and an empty dashboard were P1. Size containers by landed content; reveal the UI only behind the thread's sweep.
20. **Adaptive sub-frames beat a global N.** A speed probe flags frames above 6 px/frame (±3); render those at N=16 and splice.
21. **A zoom about an edge point sweeps the whole frame.** SSIM fell from 0.993 to 0.376. Pan the target near centre during a quiet hold first; start log-zoom slowly.
22. **Self-scores run high.** v7: self 7.5 vs blind 4.4. v8: 6.75 vs 5.0. Blind panels catch story-truth problems machine gates cannot see.
23. **Show the product, not the machine.** v7's blind executive: "it shows how the machine works but never what it produced." Files and logs are paperwork; end each beat on a screen a buyer wants.
24. **A gate can pass while missing its intent.** v8's sound gate passed with the hit at the zoom, a second before the logo. Anchor gates to what the viewer sees.
25. **Stakes decide the executive score.** A true but personal use case capped the executive lens at 4. An enterprise problem with a time or money outcome is the fix; use Example mode when no real case may be shown.

## v1.3 (three branches, twelve blind critics)

26. **Failures create rules.** All three product engineers, independently: showing the rules first and then failed tries that break them reads as "ignored its own brief". Order the story Ask → try → visible failure → the rule it produces → next try → pass, and show the rules as visible filters on the final product.
27. **The camera rides the thread.** All three motion designers, independently: a line that links slides is still slides. One continuous shot following the red line, one hero word or number per idea at full scale, never more than about 30% of the frame empty.
28. **Self-correction must happen to the product.** Two executives: struck-through text lists read as a log. Show the product itself going wrong, being caught and rebuilding on screen.
29. **The climax must be audible on phones.** Two sound designers: logo hits with 90%+ energy below 150 Hz land in near-silence on phone and laptop speakers. Give the hit a 120–400 Hz body and a 2–6 kHz transient; at least 10% of climax energy above 2 kHz (gate G13).
30. **The tagline must match the demo.** Executives on B and C: an abstract company line after a single concrete demo reads as "studio or bot?". Match the line to the demo, or show the same machine on two or three briefs.
31. **Buyer-facing rules.** Four lenses flagged "Never ask clarifying questions" as reckless. Use "Assumptions logged for review" or a governance rule a buyer values.
32. **Word-per-chip parsing is decoration.** Chip only the entities that become rules, and draw each link.
33. **Never zoom into an empty element or upscale raster.** Two branches ended on a pixelated pill that read as a render bug. Zoom into a real element at vector scale, or match-cut.
34. **The ceiling was structure, not subject.** Churn, payments and policy all scored 5.0–5.5 blind with the same findings. Changing the scenario alone does not move the score.
