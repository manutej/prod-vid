"""Short, intent-free audio analysis for the L4 lens. usage: audio_report.py <vdir> <out.md>"""
import json, os, sys, numpy as np
from scipy.io import wavfile
V, out = sys.argv[1], sys.argv[2]
ck = json.load(open(os.path.join(V, "checks.json"))); ev = json.load(open(os.path.join(V, "events.json")))
sr, mu = wavfile.read(os.path.join(V, "score", "music.wav")); _, fx = wavfile.read(os.path.join(V, "score", "sfx.wav")); _, ma = wavfile.read(os.path.join(V, "score", "master.wav"))
def db(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
lines = ["# Audio analysis (measured, no intent notes)", ""]
g2 = ck["G2"]; g3 = ck["G3"]
lines.append(f"- Master: {g2.get('codec')} {g2.get('channels')}ch {g2.get('sample_rate')} Hz, integrated {g2.get('integrated_lufs')} LUFS, true peak {g2.get('true_peak_dbtp')} dBTP.")
lines.append(f"- Effects stem vs music stem RMS: {db(fx) - db(mu):+.1f} dB.")
lines.append(f"- {len(ev)} sound events; onsets detected for {g3['detected']}; max onset error {g3['max_abs_err_ms']} ms; undetectable: {len(g3['missed'])} ({', '.join(g3['missed'][:8])}).")
kinds = {}
for e in ev: kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
lines.append("- Event kinds: " + ", ".join(f"{k}x{v}" for k, v in kinds.items()))
lines.append("- Per 2 s bar, master RMS dB / spectral centroid Hz:")
row = []
for b in range(12):
    s = ma[int(b * 2 * sr):int((b + 1) * 2 * sr)].mean(axis=1); sp = np.abs(np.fft.rfft(s)); fq = np.fft.rfftfreq(len(s), 1 / sr)
    row.append(f"bar{b+1}: {db(s):.1f} dB / {int((sp * fq).sum() / sp.sum())} Hz")
lines.append("  " + "; ".join(row))
lines.append("- Music: synthesized pad chords, plucked arpeggio, sub on bar lines, soft kick/shaker; tempo 120 bpm. No vocals, no samples.")
open(out, "w").write("\n".join(lines) + "\n"); print("\n".join(lines))
