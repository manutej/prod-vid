#!/bin/bash
# Frozen judge: run all machine gates on the render named in CURRENT (line1: vdir, line2: mp4, line3: spec).
# Passes only when every gate passes; a preview spec can never satisfy G1 against the Format, so the judge requires spec=final.
cd "$(dirname "$0")/.."; read -r V < <(sed -n 1p CURRENT); MP4=$(sed -n 2p CURRENT); SPEC=$(sed -n 3p CURRENT)
python3 scripts/gates.py "$V" "$MP4" "$SPEC" || exit 1
[ "$SPEC" = final ] || { echo "judge: spec is $SPEC, final render required"; exit 1; }
