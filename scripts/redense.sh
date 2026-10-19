#!/bin/bash
# Re-render only the adaptive N=16 frames (reuse main_avg.mp4) after edits confined to dense frames, then splice.
set -e
V=$1; FILM=$(cd "$(dirname "$0")/.." && pwd)
source "$(dirname "$0")/env.sh"
HF="$PKGS/.bin/hyperframes"; LOG=$V/renders/render_times.log; T0=$(date +%s)
python3 $(dirname "$0")/build.py $V final >/dev/null
node $(dirname "$0")/speedprobe.js $V/build/final $V/speed.json
python3 -c "
import json; s=json.load(open('$V/speed.json')); old=set(json.load(open('$V/dense_frames.json'))); fr=set()
for f,v in enumerate(s):
    if v>6:
        for g in range(f-3,f+4):
            if 0<=g<1440: fr.add(g)
assert fr <= old | fr
json.dump(sorted(fr | old),open('$V/dense_frames.json','w')); print(len(fr|old),'dense frames (union with previous)')" >> $LOG
python3 $(dirname "$0")/build.py $V dense >/dev/null
ARGS=""; FIL=""
for k in $(seq 0 15); do
  OFF=$(python3 -c "print(($k/16-15/32)/120)")
  $HF render $V/build/dense -o $V/renders/dense$k.mp4 --crf 6 --workers 2 --no-low-memory-mode --quiet --variables "{\"off\":$OFF}" > $V/renders/hf_dense_$k.log 2>&1
  ARGS="$ARGS -i $V/renders/dense$k.mp4"; FIL="$FIL[$k:v]"
done
ffmpeg -v error -y $ARGS -filter_complex "${FIL}mix=inputs=16,format=yuv444p[v]" -map "[v]" -c:v libx264 -crf 6 -preset fast -pix_fmt yuv444p $V/renders/dense_avg.mp4
python3 $(dirname "$0")/splice.py $V/renders/main_avg.mp4 $V/renders/dense_avg.mp4 $V/dense_frames.json $V/score/master.wav $V/renders/final.mp4 >> $LOG
rm -rf $V/lossless; node $(dirname "$0")/audit11.js $V/build/final $V/text_audit.json $V/lossless
python3 $(dirname "$0")/contact.py $V/renders/final.mp4 $V/renders/contact.png
ffprobe -v error -show_streams -show_format -of json $V/renders/final.mp4 > $V/renders/ffprobe.json
echo "re-dense (N=16 frames only) + splice: $(( $(date +%s)-T0 )) s" >> $LOG
