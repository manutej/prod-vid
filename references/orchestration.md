# Orchestration

The main thread orchestrates; a background producer agent builds; fresh blind critics judge.

## Loop

1. Launch the producer (template below) with `references/meta-prompt.md` and the brief.
2. The producer runs 2 rounds and stops at a checkpoint.
3. Spawn the four critics from `references/panel.md` in parallel on the checkpoint folder only.
4. Publish the milestone as its own locked page (never overwrite an earlier one).
5. Send the merged findings back (template below). Repeat until the stopping rule holds on blind scores.
6. Branches: own folder each, shared render lock, own blind panel; pick a winner with two blind side-by-side agents in different orders.

## Producer launch

"Execute references/meta-prompt.md with this instance. Work only in films/{slug}/{vN}/. Read references/lessons.md first. Copy templates/; source scripts/env.sh. Log every round with scripts/dna.py. Previews first; full spec only inside `flock $PROD_VID_LOCK`. Run 2 rounds, then stop and write checkpoint/ with scripts/checkpoint.sh (contact.png, 12 frames, audio.wav, gates.json, renders/final.mp4). Report per-lens self-scores, gate results, known weaknesses and render times. Your critique is a self-score only."

## Findings back to the producer

- First line: blind scores per lens and mean, previous mean, and the self-score gap.
- P1 fixes agreed by two or more lenses: timestamp, concrete fix, the lesson number it maps to.
- Then P2 and P3.
- Say whether this is a polish round or a redesign (E5: new version folder).
- Restate the truth mode and the sensitivity rule.
- End: "Run 2 rounds, then checkpoint again."

## Milestone page

Embedded video; specs line (duration, resolution, LUFS, peak, rounds); what improved; what the blind panel still found; lens table (previous blind, self, blind, highest-leverage change); gate chips; contact sheet. Publish as a new page per milestone.

## Subject decisions

The film's subject and truth mode belong to the user. Ask once, plainly, with a recommendation; keep working on the recommended option while waiting. Never treat a default or auto-filled answer as the user's choice.
