"""Master to -16 LUFS integrated, true peak <= -1 dBTP (target -1.5). Measures with ffmpeg ebur128 (BS.1770).
usage: master.py <in.wav> <out.wav> <report.txt>"""
import re, subprocess, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly
src, dst, rep = sys.argv[1:4]
def measure(path):
    p = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    s = p.stderr[p.stderr.rfind("Summary:"):]
    I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)); TP = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))
    LRA = float(re.search(r"LRA:\s+(-?[\d.]+) LU", s).group(1)); return I, TP, LRA, s
sr, x = wavfile.read(src); x = x.astype(np.float64)
def limit(x, ceil_db=-1.6):
    c = 10 ** (ceil_db / 20); up = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1)
    pk = up.reshape(-1, 4).max(axis=1)[: len(x)]
    g = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    # lookahead 2 ms min-filter + 40 ms release smoothing
    la = int(0.002 * sr); gm = np.array([g[max(0, i - la):i + la + 1].min() for i in range(0, len(g))]) if len(g) < 0 else None
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    gm = minimum_filter1d(g, size=2 * la + 1)
    gs = np.minimum(gm, uniform_filter1d(gm, size=int(0.01 * sr)))
    return x * gs[:, None]
y = x.copy(); log = []
for it in range(6):
    wavfile.write(dst, sr, y.astype(np.float32)); I, TP, LRA, s = measure(dst); log.append(f"iter {it}: I={I} LUFS TP={TP} dBTP LRA={LRA}")
    if abs(I + 16) <= 0.3 and TP <= -1.0: break
    y = y * 10 ** ((-16 - I) / 20)
    y = limit(y)
I, TP, LRA, s = measure(dst)
clip = int((np.abs(y) >= 0.999).sum())
open(rep, "w").write("\n".join(log) + f"\nFINAL integrated={I} LUFS true_peak={TP} dBTP LRA={LRA} clipped_samples={clip}\n\n" + s)
print(f"I={I} TP={TP} LRA={LRA} clip={clip}")
