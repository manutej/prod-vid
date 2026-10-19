---
name: prod-vid
description: Make premium 15–30 s product launch films for AI products with HyperFrames: code-built UI, synthesized sound, machine gates, blind critic panels and recorded RSI rounds.
---

# /prod-vid

Turns a product brief into a finished launch film (MP4 with sound) that makes product engineering visible and evokes wonder, then improves it through recorded rounds until a blind panel finds nothing left to fix. Built from the CETI launch film runs (v1–v9).

Never ask clarifying questions. Decide, record the decision with a reason in the journal, and keep going. The one exception: the film's subject or truth mode, when the brief does not settle it, is the user's call. Ask once, plainly, and keep working on the recommended option while waiting. Never treat a default or auto-filled answer as the user's choice.

## Source of truth: the prod-vid repo

Everything this skill runs on lives in **github.com/manutej/prod-vid**, pinned to branch **release/v1.3** (the saved skill also pins the exact commit):

```bash
git clone --depth 1 --branch release/v1.3 https://github.com/manutej/prod-vid "$PROD_VID_HOME"   # default: ./prod-vid
```

In a cloud session, attach the repo first (it is private), then clone. If the clone fails, say so and stop; do not rebuild the engine from memory.

Read these before starting, in this order:

| File | What it is |
|---|---|
| `references/meta-prompt.md` | Launch Film Evolver v1.3: typed brief, invariants I1–I19, wonder devices, pipeline S0–S11, evolution E1–E9, gates G1–G12, stopping rule, output contract |
| `references/lessons.md` | 34 lessons with evidence (full detail in `lessons-detailed.md`) |
| `references/panel.md` | The four blind critic prompts and branch selection |
| `references/orchestration.md` | Producer launch, findings handoff, milestone pages, subject decisions |
| `references/sources.md` | Lineage and licenses |

Code: `scripts/` (source `scripts/env.sh` first), `templates/` (a working film to copy), `assets/` (local fonts, gsap).

## Setup

1. `npm i hyperframes playwright-core gsap` plus any @fontsource packages the look needs, in a packages folder; set `PROD_VID_PKGS` to its node_modules.
2. Chromium headless shell under `PLAYWRIGHT_BROWSERS_PATH` (default /opt/pw-browsers), or set `HEADLESS_SHELL`. Do not run `playwright install` where browsers are preinstalled.
3. ffmpeg/ffprobe and Python with numpy and scipy.

## Truth modes

- **Real:** every on-screen string and number comes from proof assets (gate G9).
- **Example:** illustrative content only under a small, always-visible "Example scenario" label from the first scenario frame to the mark. Numbers internally consistent. Never presented as a client result. No real company names.
- Both: nothing the user has marked sensitive (client names, domains, paths, titles). Check their sensitivity notes first.

## Procedure

1. Intake and claims (S0–S1), including the jargon list.
2. Three concepts judged blind (S2–S3); when the subject itself is uncertain, fork 2–3 scenario branches instead.
3. Storyboard on the bar grid with a reading budget and countable counts; copy `templates/timeline.py` as the single timing source (S4–S6).
4. Score from `templates/synth.py`, following I18a; master with `scripts/master.py` (S7).
5. Compose from `templates/film.js` and `index.template.html`; deterministic; the through-line builds every panel (S8).
6. Render previews with `scripts/render.sh <vdir> preview`; final with `render.sh <vdir> final` then `redense.sh`; full renders inside `flock $PROD_VID_LOCK` when films share a machine (S10).
7. Gates with `scripts/judge.sh`, frozen at round 1 (S9).
8. Checkpoint with `scripts/checkpoint.sh <vdir>`; blind panel per `references/panel.md` (S11).
9. Log every round with `scripts/dna.py`; ratchet; redesign on a repeated defect; record lessons.
10. Stop only on the blind-score stopping rule, or deliver the best kept round and say what is open.

The orchestrating thread publishes every milestone as its own locked page and never counts the producer's self-score toward stopping (`references/orchestration.md`).

## Deliverables

final.mp4; ffprobe JSON proving the audio stream and exact duration; loudness report; final contact sheet; critique files with self and blind scores; journal and dna ledger; lessons.md; meta-prompt-diff.md. Confirm audio explicitly (codec, channels, duration, LUFS, true peak).

## Evolving the skill

New lessons and meta-prompt changes go to the repo as a new release branch (release/v1.3, …) with evidence; then update the branch and commit in the saved skill. Never push to an existing release branch.
