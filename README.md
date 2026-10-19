# prod-vid

The engine behind the `/prod-vid` skill: premium 15–30 second launch films for AI products, built with HyperFrames, with code-built UI, synthesized sound, machine gates, blind critic panels and recorded improvement rounds.

## Use

```bash
git clone --depth 1 --branch release/v1.3 https://github.com/manutej/prod-vid
cd prod-vid
npm i hyperframes playwright-core gsap        # in a packages folder; set PROD_VID_PKGS to its node_modules
source scripts/env.sh
```

Then follow `SKILL.md`. Read `references/meta-prompt.md` and `references/lessons.md` before storyboarding.

## Layout

- `SKILL.md`: the skill instructions (mirror of the saved /prod-vid skill)
- `references/`: meta-prompt.md (Launch Film Evolver v1.3), lessons.md (25), lessons-detailed.md, panel.md (blind critics), orchestration.md, sources.md
- `scripts/`: env.sh, build.py, render.sh, redense.sh, splice.py, master.py, gates.py, judge.sh, checkpoint.sh, contact.py, montage.py, stills.js, speedprobe.js, audit11.js, audio_report.py, round_log.py, dna.py
- `templates/`: timeline.py, synth.py, film.js, index.template.html (the v8 CETI film: a working reference to copy)
- `assets/`: gsap, local OFL fonts

## Status

Scripts were extracted from the CETI launch-film runs (v1–v9) and their paths made configurable through `scripts/env.sh`. The packaged copy has been syntax-checked but not yet run end to end from this repo.
