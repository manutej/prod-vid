#!/bin/bash
# usage: render.sh <vdir> <preview|final>   (times every stage into <vdir>/renders/render_times.log)
set -e
V=$1; MODE=$2; FILM=$(cd "$(dirname "$0")/.." && pwd)
source "$(dirname "$0")/env.sh"
export HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_SKIP_SKILLS=1 HYPERFRAMES_NO_UPDATE_CHECK=1
HF="$PKGS/.bin/hyperframes"; mkdir -p $V/renders; LOG=$V/renders/render_times.log
python3 $(dirname "$0")/build.py $V $MODE >/dev/null; python3 $(dirname "$0")/build.py $V final >/dev/null
T0=$(date +%s)
if [ "$MODE" = preview ]; then
  $HF render $V/build/preview -o $V/renders/preview_raw.mp4 --workers ${WORKERS:-2} --no-low-memory-mode --quiet > $V/renders/hf_preview.log 2>&1
  T1=$(date +%s)
  ffmpeg -v error -y -i $V/renders/preview_raw.mp4 -i $V/score/master.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart $V/renders/preview.mp4
  OUT=$V/renders/preview.mp4; echo "preview render (hyperframes, 960x540@30, 720 frames): $((T1-T0)) s; mux $(( $(date +%s)-T1 )) s" >> $LOG
else
  for k in 0 1 2 3; do
    OFF=$(python3 -c "print(($k/4-0.375)/120)")
    TS=$(date +%s)
    $HF render $V/build/final -o $V/renders/pass$k.mp4 --crf 8 --workers ${WORKERS:-2} --no-low-memory-mode --quiet --variables "{\"off\":$OFF}" > $V/renders/hf_final_$k.log 2>&1
    echo "final pass $k (offset ${OFF}s, 1920x1080@60, 1440 frames): $(( $(date +%s)-TS )) s" >> $LOG
  done
  T1=$(date +%s)
  ffmpeg -v error -y -i $V/renders/pass0.mp4 -i $V/renders/pass1.mp4 -i $V/renders/pass2.mp4 -i $V/renders/pass3.mp4 \
    -filter_complex "[0:v][1:v][2:v][3:v]mix=inputs=4:weights=1 1 1 1,format=yuv444p[v]" -map "[v]" -c:v libx264 -crf 6 -preset fast -pix_fmt yuv444p $V/renders/main_avg.mp4
  echo "accumulate N=4: $(( $(date +%s)-T1 )) s" >> $LOG
  # adaptive sub-frames: frames where text or the thread moves > 6 px/frame get N=16
  node $(dirname "$0")/speedprobe.js $V/build/final $V/speed.json
  python3 -c "
import json; s=json.load(open('$V/speed.json')); fr=set()
for f,v in enumerate(s):
    if v>6:
        for g in range(f-3,f+4):
            if 0<=g<1440: fr.add(g)
json.dump(sorted(fr),open('$V/dense_frames.json','w')); print(len(fr),'dense frames')" >> $LOG
  python3 $(dirname "$0")/build.py $V dense >/dev/null
  TD=$(date +%s); ARGS=""; FIL=""
  for k in $(seq 0 15); do
    OFF=$(python3 -c "print(($k/16-15/32)/120)")
    $HF render $V/build/dense -o $V/renders/dense$k.mp4 --crf 6 --workers ${WORKERS:-2} --no-low-memory-mode --quiet --variables "{\"off\":$OFF}" > $V/renders/hf_dense_$k.log 2>&1
    ARGS="$ARGS -i $V/renders/dense$k.mp4"; FIL="$FIL[$k:v]"
  done
  ffmpeg -v error -y $ARGS -filter_complex "${FIL}mix=inputs=16,format=yuv444p[v]" -map "[v]" -c:v libx264 -crf 6 -preset fast -pix_fmt yuv444p $V/renders/dense_avg.mp4
  echo "dense N=16 passes + mix: $(( $(date +%s)-TD )) s" >> $LOG
  TS=$(date +%s); python3 $(dirname "$0")/splice.py $V/renders/main_avg.mp4 $V/renders/dense_avg.mp4 $V/dense_frames.json $V/score/master.wav $V/renders/final.mp4 >> $LOG
  echo "splice + encode: $(( $(date +%s)-TS )) s" >> $LOG
  OUT=$V/renders/final.mp4; echo "final total (N=4 + adaptive N=16): $(( $(date +%s)-T0 )) s" >> $LOG
fi
rm -rf $V/lossless; node $(dirname "$0")/audit11.js $V/build/final $V/text_audit.json $V/lossless
python3 $(dirname "$0")/contact.py $OUT $V/renders/contact.png
ffprobe -v error -show_streams -show_format -of json $OUT > $V/renders/ffprobe.json
echo "$OUT"
