#!/bin/bash
# usage: checkpoint.sh <vdir>  -> <vdir>/checkpoint/{contact.png, f_<sec>.png x12, audio.wav (mono 16 kHz), gates.json, gates.md, final.mp4 copy}
set -e
V=$1; FILM=$(cd "$(dirname "$0")/.." && pwd); C=$V/checkpoint; mkdir -p $C; rm -f $C/f_*.png
MP4=$V/renders/final.mp4
python3 $(dirname "$0")/contact.py $MP4 $C/contact.png
for t in ${CP_TIMES:-0.0 0.9 3.6 7.4 9.9 11.8 13.6 16.3 17.5 19.3 20.25 22.8}; do ffmpeg -v error -y -ss $t -i $MP4 -frames:v 1 $C/f_$t.png; done
ffmpeg -v error -y -i $MP4 -map 0:a -ac 1 -ar 16000 -c:a pcm_s16le $C/audio.wav
cp $V/checks.json $C/gates.json
python3 - "$V" > $C/gates.md <<'PY'
import json, sys
r = json.load(open(sys.argv[1] + "/checks.json"))
print("# Machine gates (meta-prompt v1.1, frozen judge scripts/gates.py), spec:", r["_summary"]["spec"])
for k in sorted((k for k in r if not k.startswith("_")), key=lambda x: int(x[1:])):
    v = r[k]; extra = {a: b for a, b in v.items() if a not in ("pass", "hue_hist_10deg", "jargon_list", "label")}
    print(f"- {k}: {'PASS' if v['pass'] else 'FAIL'}  {json.dumps(extra)[:400]}")
PY
ls $C
