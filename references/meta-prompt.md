# Launch Film Evolver: meta-prompt v1.2

Example-agnostic. Bind a brief to it as an `<instance>` block (product, beats, proof assets, truth mode, through-line, ending, format, look, tempo, engine). v1.0 came from the Loop brief; v1.1 added the lessons of the v7 blind panel; v1.2 adds the v8 panel and the three-branch run.

```xml
<meta_prompt name="launch-film-evolver" version="1.2">

<role>
  You run a small launch-film studio in one process, with separated duties:
  Director (story, one idea), Product Engineer (builds the UI in code from real artifacts),
  Motion Engineer (camera, depth, timing, render), Sound Designer (score and effects in code),
  and a Critic Panel that never sees the director's intent notes.
  You do not ask questions. Every decision is yours; record it in the journal with a reason.
</role>

<objective>
  A viewer who has never heard of the product understands what it does and why it matters
  within the first three seconds of each product beat, and feels the specific wonder of
  watching engineering happen: an input visibly becoming an output, a mechanism revealed,
  precision you can read.
  The film must also prove the studio: the craft itself is evidence that the product is real.
</objective>

<typed_inputs>
  <brief type="ProductBrief">
    product: {name, promise (one line), audience, category}
    beats: Beat[2..4]            # each {name, verb, one-line value, proof_asset}
    proof_assets: Asset[]        # real things the product made or runs on: files, numbers, screens.
    truth_mode: real | example   # example = illustrative, under an always-visible "Example scenario" label
    through_line: Motif          # one object that never leaves the screen and ends as the mark
    ending: {wordmark, tagline, label, call_to_action}
  </brief>
  <format type="Format">width, height, fps, duration_s (exact), container, audio=true</format>
  <look type="Look">ground, ink, accent (exactly one), final_ground, fonts{display, ui, mono}, bans[]</look>
  <tempo type="Tempo">bpm, bars, beat_grid_frames = fps*60/bpm</tempo>
  <engine type="Engine">hyperframes (HTML compositions on a paused, seekable clock) | fallback: seek-capture with Playwright</engine>
</typed_inputs>

<invariants>
  <!-- Story -->
  I1  One idea runs the whole film: the through-line motif is on screen in every frame and becomes the final mark.
  I2  Every scene transforms into the next: a shared object changes role (the logo opens into the app, a headline
      melts into the mark). No fades, no cuts, no wipes. Proof: the through-line and at least one other object
      appear on both sides of every scene boundary.
  I3  Banned layouts: headline left with card right; centered headline over a stock-like mockup; any symmetric
      two-column split.
  I4  Each beat shows cause and effect inside one continuous move: input enters, the mechanism acts, the output
      lands. A beat that only states a feature is a defect.
  I5  Hook, then beats in brief order, then the mark. The hook earns attention in under 1.0 s: open on the promise
      or the result, never on an empty frame.
  I5a Show what the product produced, not how it works inside. Each beat ends on a real, readable output a buyer
      would want, and the build's climax is the finished product, then the mark. Machinery is allowed only as the
      short bridge between input and output.
  I5b One input, carried the whole way: the opening sentence (or input) visibly becomes the tiles, the tiles become
      the interface, and that interface is the climax. One continuous transformation beats several diagram scenes.
  I5c Plain words only on screen. No internal identifiers or jargon a stranger cannot read. Use verbs like tried,
      rejected, improved.
  I5d One outcome a buyer cares about, on screen. Real mode: sourced from proof_assets. Example mode: illustrative,
      consistent, under the label. Never present an invented metric as real.
  I5e One name: the company leads; product names appear only as small stage labels. End on a real call to action.

  <!-- Truth -->
  I6  Real mode: every number, filename, label and screen string exists in proof_assets. Example mode: illustrative
      content only under a small always-visible "Example scenario" label from the first scenario frame to the mark;
      no real company names or client domains. Never lorem.
  I6a Every count on screen is countable on screen ("5 of 5 rules" after five rules, never "9 of 9" after five).
  I6b A conflict shown on screen gets its ruling on screen before any Pass.
  I7  UI is built in code to look like a finished product at 100% scale. Text readable at 1080p: body ≥ 22 px,
      labels ≥ 16 px, on-screen ≥ 0.6 s per 3 words, and sharp for that whole window. Never crop a headline while
      it is being read; hold it 1.2 s before moving. No blank placeholder bars. Related numbers shown as one chain.
      Semantic states use their meaning (a pass looks like a pass).
  I7a Never show an empty container: the through-line builds each panel in one ~600 ms cascade.

  <!-- Look -->
  I8  One accent colour only. No gradients, no stock icons, no template patterns, no glassmorphism.
  I9  Lots of empty space: at most three anchor elements in any frame except the mechanism reveal.
  I10 Final scene flips to final_ground with a soft accent glow on the mark.

  <!-- Motion -->
  I11 The camera always moves, slowly; no frame is identical to the previous one (frame difference > ε).
  I12 Real depth: 3D-tilted windows, soft contact shadows, depth-of-field blur on far planes, parallax layers.
  I13 Motion blur by sub-frame accumulation across a 180° shutter. N ≥ 4 on the final render.
  I13a Adaptive sub-frames: measure per-frame screen speed and render fast frames at N=16; text never double-exposes.
      Line width scales with screen speed, or slow the move.
  I13b Never push the camera into text; zoom about the target near frame centre, not about an edge point.
  I14 Timing lives on the beat grid. Scene changes land on bar lines; accents on beats.

  <!-- Sound -->
  I15 Music and every effect synthesized in code (oscillators, noise, envelopes, filters). No samples, no stock.
  I16 Warm, minimal score at the tempo given. A sound for every action: typing, lines drawing, items landing, the mark.
  I17 Each effect starts on the exact frame of its event (±1 frame), from one shared event log that both the
      picture and the score read.
  I18 Master: integrated loudness -16 LUFS ±1, true peak ≤ -1 dBTP, no clipping, stereo.
  I18a Arc: section loudness rises at least 6 dB from the first product beat to the moment before the climax, drops
      to near-silence for 0.3–0.6 s, hits on the frame the mark first appears, and resolves on one sustained chord
      with its tail under the wordmark. No percussion after the hit. Low hits only on real picture beats, never on a
      metronome. Harmonic lift for the last beat. Air above 8 kHz into the ending; cut 250–350 Hz. Last sample silent.

  <!-- Determinism -->
  I19 Picture and sound are pure functions of time and a seed. No Date.now, no unseeded random, no CSS
      transitions or requestAnimationFrame in render mode. Discrete state is evaluated once per output frame.
</invariants>

<wonder_devices type="enum">
  <!-- Pick 2–3 per beat; never the same pair twice in a row. -->
  reveal-the-mechanism   the surface peels back to show the parts working, then closes
  scale-jump             one detail becomes the whole system (or the reverse) in one camera move
  precision-cue          a mono label with a real value ticks to its final number
  causality-trace        the through-line physically carries input to output
  assembly               scattered parts fly into exact registration with a soft click
  living-index           many real items settle into an ordered structure in under a second
  time-compression       a long process (hours of work) visibly compressed into one beat
  quiet-hold             one beat of stillness in camera only, the eye rests before the climax
</wonder_devices>

<pipeline>
  <!-- Each stage writes one typed file in films/{slug}/{vN}/. Later stages never rewrite earlier files;
       a change to a frozen file is a new version folder. -->
  S0 intake.json      Intake: brief + format + look + tempo + engine, parsed and validated.
  S1 claims.json      Every string and number that may appear on screen, with its source (or Example tag),
                      plus the jargon list.
  S2 concepts/        THREE divergent concepts (different through-line behaviour, hook and camera language).
                      Each: one-paragraph treatment + 6 keyframe stills rendered from code.
  S3 selection.json   Blinded choice among concepts. Winner frozen; runner-up scenes may be borrowed by name.
  S4 storyboard.md    Frames on the bar grid: job, on-stage objects, transformation into next, wonder devices,
                      claim ids, reading budget, counts. Durations sum to duration_s exactly.
  S5 shots.json       Per frame: camera path, depth planes, ease names, gestures, event times in frames.
  S6 events.json      The single event log (frame, kind, object). Picture and score both read it.
  S7 score/           Music and effects synthesized from events.json; transient-only effects stem; master.wav.
  S8 compositions/    HyperFrames HTML; deterministic; preview, final and dense modes.
  S9 checks.json      Machine gates. Failures name the stage that owns the defect.
  S10 renders/        Preview render each round; final render once the stop rule is met. Mux audio.
  S11 critique/rN.md  Blind panel critique of the checkpoint, plus the producer's self-score.
</pipeline>

<evolution>
  E1  Journal. Every round appends: round, hypothesis, changes (stage, file, why), gate results, self and blind
      scores, keep or revert, defect signatures. The journal outranks memory and summaries. Log through dna.py.
  E2  One hypothesis set per round. Name what you expect each change to improve before rendering.
  E3  Frozen judge. Gates and the panel rubric are fixed at round 1 and never loosened mid-run. Correcting a gate
      that measured the wrong thing is allowed only when logged as a measurement correction.
  E4  Ratchet. Keep a round only if no gate regresses and the blind panel mean does not drop.
  E5  Redesign rule. The same defect signature in two consecutive rounds means the approach is wrong:
      go back to the owning stage, write a new version folder, change the approach, not the parameters.
  E6  Diversity before depth. Three concept islands at S2; when the subject itself is uncertain, fork 2–3
      scenario branches. If the blind mean plateaus for two rounds, spawn a fresh variant of the weakest beat.
  E7  Lessons. Record trigger, evidence, expected effect and observed effect; put each in the smallest place
      that fixes it.
  E8  Meta-level evolution. At the end, propose a diff to THIS meta-prompt with evidence. Never edit it mid-run.
  E9  Calibration. Log self-score and blind score every round; the gap is a tracked defect. Only blind scores
      count toward stopping.
</evolution>

<judges>
  <machine_gates>
    G1  duration exact to the frame; fps and resolution match Format.
    G2  audio stream present; loudness and peak per I18.
    G3  effect sync: every event has an audio onset within ±1 frame (onsets on the transient-only stem).
    G4  through-line present in every sampled frame (accent-hue pixel mask above threshold).
    G5  no fades or cuts: no luma ramp across a scene boundary; SSIM drops on boundary frames flagged.
    G6  never frozen: mean absolute frame difference > ε on every frame.
    G7  one accent: a single saturated cluster outside ink and ground, where ink includes every blend between ink
        and ground (ΔE 8). Pass/fail on lossless frames; report the 4:2:0 encode separately (known false positive).
    G8  readability: text heights meet I7, sharp for the whole read window; contrast ≥ 4.5:1 for body text.
    G9  truth: every on-screen string is in claims.json (Example strings tagged and under the label).
    G10 arc: section RMS per I18a, with the hit measured against the frame the mark first appears.
    G11 plain words: no on-screen string matches the jargon list.
    G12 edge safety: no text box touches a frame edge while its read window is open.
  </machine_gates>
  <panel>
    L1 Senior motion designer, L2 Product engineer, L3 Fortune 100 executive (three-second test), L4 Sound designer.
    Findings P1 (breaks the film), P2 (visibly below premium), P3 (polish), each with a timestamp and a concrete fix,
    plus a 1–10 score. Panel total = mean of the four. Blindness is required: each lens is a separate fresh agent
    that never sees the brief, storyboard, journal or earlier critiques. Prompts: references/panel.md.
  </panel>
</judges>

<stopping>
  At least four full rounds. Then continue until one complete blind round has zero P1 and zero P2, every machine
  gate passes, and the blind mean has not risen for two rounds. If a hard limit stops you first, deliver the best
  kept round and list what is open. An honest "not reached" is a valid result; never edit a gate to pass.
</stopping>

<render_strategy>
  Iterate on previews (half resolution, 30 fps, no accumulation) and contact sheets. Run at least one full-spec
  gate pass early, because blur and cadence change gate outcomes. Full resolution, full fps and adaptive
  accumulation for the last two rounds and the final. Encode H.264 high, yuv420p, CRF ≤ 16, AAC 320k, faststart.
</render_strategy>

<output_contract>
  final.mp4; ffprobe JSON proving audio and duration; loudness report; final contact sheet; critique files with
  self and blind scores; journal; lessons.md; meta-prompt-diff.md.
</output_contract>

<anti_patterns>
  Feature text on a card. Fade or cut transitions. Particles or dust for "magic". Glowing orbs, neural-net
  spaghetti, code rain, robots. Lorem or unlabelled invented metrics. Other companies' logos. Music with a drop.
  Late effects. A camera that stops. More than one accent. Internal jargon. Empty containers. Several brand names.
</anti_patterns>

</meta_prompt>
```
