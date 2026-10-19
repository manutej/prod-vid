"""v8 score (I15-I18a): everything synthesized from events.json. Arc: sparse open -> layered build (+>=6 dB) ->
harmonic lift (up a whole step) for the Atlas climax -> near-silence 19.55-20.0 s -> hit on the mark's first frame ->
one sustained chord under the wordmark with air above 8 kHz -> silence on the last sample. 250-350 Hz cut on the bus.
Writes music.wav, sfx.wav (transient-only), mix.wav. usage: synth.py <vdir>"""
import json, os, sys
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, lfilter

V = sys.argv[1]
SR = 48000; DUR = 24.0; N = int(SR * DUR); BEAT = 0.5; BAR = 2.0
EV = json.load(open(os.path.join(V, "events.json")))
rng = np.random.default_rng(20261019)
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))
HIT = [e["t"] for e in EV if e["kind"] == "hit"][0]
DIP0 = HIT - 0.45

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def env_ad(n, a, d):
    t = np.arange(n) / SR; return np.where(t < a, t / max(a, 1e-6), np.exp(-(t - a) / max(d, 1e-6)))
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype="band", output="sos"), x)
def lp(x, fc, o=2): return sosfilt(butter(o, fc / (SR / 2), btype="low", output="sos"), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc / (SR / 2), btype="high", output="sos"), x)
def lay(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def place(buf, x, t, g=1.0, pan=0.0):
    i = int(round(t * SR)); x = np.asarray(x, float) * g
    if i >= N: return
    n = min(len(x), N - i); l = np.cos((pan + 1) * np.pi / 4) * 1.4142; r = np.sin((pan + 1) * np.pi / 4) * 1.4142
    buf[i:i + n, 0] += x[:n] * l; buf[i:i + n, 1] += x[:n] * r
def sine(f, dur, ph=0.0):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(f(t)) / SR + ph) if callable(f) else np.sin(2 * np.pi * f * t + ph)
def click(dur=0.004, lo=1500, hi=6000):
    n = int(dur * SR); return bp(rng.standard_normal(n) * env_ad(n, 0.0002, dur / 4), lo, hi)
def marimba(f, dur=0.3, g=1.0):
    n = int(dur * SR); return g * env_ad(n, 0.0008, dur / 4) * (sine(f, dur) + 0.3 * sine(f * 4, dur) * env_ad(n, 0.0005, dur / 14))
def ks(f, dur, damp=0.996, bright=0.6):
    n = int(dur * SR); p = max(2, int(SR / f)); buf = lp(rng.uniform(-1, 1, p), 2000 + 6000 * bright, 1); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = damp * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    out[:24] *= np.linspace(0, 1, 24) ** 0.5; return out
def whoosh(dur, f0, f1, g=1.0):
    n = int(dur * SR); x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 512):
        fc = f0 * (f1 / f0) ** (i / n); out[i:i + 512] = bp(x[i:i + 512], max(80, fc * 0.7), fc * 1.4, 1)
    return g * out * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
def pad_note(m, dur, g, att=0.35, rel=0.6, cut=1700):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m); x = np.zeros(n)
    for det in (-0.07, 0.0, 0.07):
        for h in range(1, 7): x += (1 / h ** 2) * np.sin(2 * np.pi * f * 2 ** (det / 12) * h * t + h * det * 9)
    x *= np.clip(np.minimum(1, t / att) * np.minimum(1, (dur - t) / rel), 0, 1); return lp(x, cut) * g

# ---------------- music: chords per bar (D major for the build, lift to E major for the climax bars 7-10)
CH = [(38, [50, 57, 62, 66]), (38, [50, 57, 61, 64, 66]), (35, [47, 54, 57, 61, 62]), (31, [43, 50, 54, 57, 62]),
      (40, [52, 55, 59, 62, 66]), (33, [45, 52, 57, 59, 61]),
      (40, [52, 59, 63, 66, 68]), (37, [49, 56, 59, 63, 64]), (33, [45, 52, 56, 59, 64]), (35, [47, 54, 59, 61, 63])]
LVL = [0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.15, 1.30, 1.45, 1.60]       # the build (section gain per bar)
for b, (root, voic) in enumerate(CH):
    t0 = b * BAR; g = LVL[b]
    for k, m in enumerate(voic): place(music, pad_note(m, BAR + 0.5, 0.030 * g), t0, pan=(k - len(voic) / 2) * 0.18)
    if b >= 2:   # sub on the bar line
        n = int(1.8 * SR); place(music, 0.16 * g * sine(hz(root), 1.8) * env_ad(n, 0.004, 0.7), t0)
    if b >= 1:   # felt pluck arpeggio: 8ths, 16ths from the lift
        steps = 16 if b >= 6 else 8; pat = [0, 2, 1, 3, 2, 4, 1, 3]
        for i in range(steps):
            m = voic[pat[i % 8] % len(voic)] + 12 + (12 if (b >= 6 and i % 4 == 3) else 0)
            place(music, marimba(hz(m), 0.45, (0.040 if i % 2 == 0 else 0.026) * g), t0 + i * BAR / steps, pan=0.25 * np.sin(i))
    if b >= 4:   # soft kick 1 & 3, shaker 8ths (percussion stops before the dip)
        for q in (0, 2):
            n = int(0.3 * SR); place(music, 0.20 * g * sine(lambda t: 45 + 60 * np.exp(-t * 30), 0.3) * env_ad(n, 0.001, 0.09), t0 + q * BEAT)
        for i in range(8):
            n = int(0.05 * SR); place(music, (0.012 if i % 2 else 0.007) * g * hp(rng.standard_normal(n), 6500) * env_ad(n, 0.002, 0.012), t0 + i * BEAT / 2, pan=0.3)
    if b >= 6:   # air above 8 kHz through the climax
        n = int(BAR * SR); place(music, 0.010 * g * hp(rng.standard_normal(n), 9000, 4) * (0.6 + 0.4 * np.sin(np.linspace(0, 2 * np.pi, n))), t0, pan=-0.2)
# near-silence before the hit: duck everything from DIP0 (50 ms ramp), nothing returns until the hit
i0 = int(DIP0 * SR); i1 = int(HIT * SR); ramp = int(0.05 * SR)
music[i0:i0 + ramp] *= np.linspace(1, 0.004, ramp)[:, None]; music[i0 + ramp:i1] *= 0.004
music[i1:] = 0.0
# the resolution: one sustained chord (E maj9 over E) from the hit, tail under the wordmark, with air
for k, m in enumerate([40, 52, 59, 63, 66, 68, 71]):
    n = int((DUR - HIT) * SR); t = np.arange(n) / SR
    x = pad_note(m, DUR - HIT, 0.055 if m > 45 else 0.09, att=0.02, rel=1.2, cut=3200) * np.exp(-t / 3.2)
    place(music, x, HIT, pan=(k - 3) * 0.15)
n = int((DUR - HIT) * SR); place(music, 0.012 * hp(rng.standard_normal(n), 8500, 4) * np.exp(-np.arange(n) / SR / 2.2), HIT, pan=0.2)

# ---------------- effects (transient-only strikes; sustains live in the music stem)
SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86]
def fx(e):
    k, t, v = e["kind"], e["t"], e.get("v", 0)
    if k == "key": place(sfx, lay(click(0.006, 1400 + (v % 7) * 120, 6000) * 0.5, 0.22 * sine(2000 + (v % 5) * 60, 0.012) * env_ad(int(0.012 * SR), 0.0003, 0.003)), t, 0.45 if t < 20 else 0.3, pan=((v % 9) - 4) * 0.04)
    elif k == "enter": n = int(0.12 * SR); place(sfx, lay(click(0.005, 900, 4000), 0.4 * sine(lambda tt: 160 + 200 * np.exp(-tt * 50), 0.12) * env_ad(n, 0.0005, 0.03)), t, 0.8)
    elif k == "lift": place(sfx, click(0.004, 1500, 8000), t, 0.8); place(sfx, whoosh(0.5, 500, 3000, 0.2), t)
    elif k == "tile": place(sfx, lay(click(0.003, 1500, 7000) * 0.5, marimba(hz(SCALE[v % 11]), 0.12, 0.20)), t, pan=0.2)
    elif k == "caption": place(sfx, lay(click(0.003, 2000, 9000) * 0.4, marimba(hz(93), 0.08, 0.10)), t, pan=-0.3)
    elif k == "rule": place(sfx, lay(click(0.003, 1200, 5000) * 0.8, marimba(hz(SCALE[(v * 2) % 11]), 0.2, 0.25)), t, pan=0.15)
    elif k == "snag":
        n = int(0.12 * SR); place(sfx, bp(rng.standard_normal(n), 300, 2500) * env_ad(n, 0.0005, 0.04), t, 0.5)
        place(sfx, lay(ks(hz(49), 0.5, 0.994, 0.4), ks(hz(50), 0.5, 0.994, 0.4)), t, 0.32)
    elif k == "pass": place(sfx, lay(click(0.003, 2000, 8000) * 0.6, marimba(hz(78), 0.3, 0.3), marimba(hz(83), 0.3, 0.22)), t)
    elif k == "reject": n = int(0.25 * SR); place(sfx, lay(click(0.004, 600, 3000) * 0.6, 0.35 * sine(lambda tt: 220 * np.exp(-tt * 5), 0.25) * env_ad(n, 0.0008, 0.07)), t, pan=-0.2)
    elif k == "redesign": n = int(0.4 * SR); place(sfx, lay(click(0.004, 800, 4000) * 0.6, 0.4 * sine(lambda tt: 90 + 80 * np.exp(-tt * 16), 0.4) * env_ad(n, 0.001, 0.12)), t); place(sfx, whoosh(0.4, 400, 2500, 0.15), t)
    elif k == "check": place(sfx, lay(click(0.003, 1200, 5000) * 0.9, marimba(hz(SCALE[min(v, 10)]), 0.14, 0.30)), t, pan=0.3)
    elif k == "draw": place(sfx, click(0.004, 2500, 9000), t, 0.5); place(sfx, whoosh(0.45, 900, 5000, 0.18), t, pan=0.2)
    elif k in ("click", "stat", "chip", "row"):
        n = int(0.08 * SR); th = 0.5 * sine(lambda tt: 120 + 300 * np.exp(-tt * 60), 0.08) * env_ad(n, 0.0005, 0.02)
        place(sfx, lay(click(0.005, 1200, 5000) * 0.6, th, marimba(hz(SCALE[(v + (3 if k == 'row' else 0)) % 11] - (12 if k == 'click' else 0)), 0.16, 0.22)), t, 0.6 if k != "chip" else 0.45)
    elif k == "key2": place(sfx, lay(click(0.006, 1200, 5000) * 1.0, marimba(hz(74), 0.15, 0.2)), t)
    elif k == "hit":
        n = int(0.9 * SR); place(sfx, lay(click(0.004, 500, 3000) * 0.6, 0.55 * sine(lambda tt: 41 + 40 * np.exp(-tt * 9), 0.9) * env_ad(n, 0.002, 0.28)), t)
    elif k == "stand": place(sfx, lay(click(0.003, 1500, 6000) * 0.5, marimba(hz(81), 0.06, 0.15)), t)
    elif k == "mark": place(sfx, lay(click(0.003, 2000, 9000) * 0.5, marimba(hz(76), 0.12, 0.25), marimba(hz(83), 0.12, 0.18)), t)
    elif k in ("tagline", "label"): place(sfx, lay(click(0.004, 700, 3500), marimba(hz(71 if k == "tagline" else 76), 0.2, 0.18)), t, pan=-0.2)
    else: raise SystemExit("no sound for " + k)
for e in EV: fx(e)

# bus: cut boxiness around 300 Hz (RBJ peaking EQ, -5 dB, Q 0.9) on music and effects
def peq(x, f0, gain_db, q):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w), 1 - al * A]); a = np.array([1 + al / A, -2 * np.cos(w), 1 - al / A])
    return lfilter(b / a[0], a / a[0], x, axis=0)
music = peq(music, 300, -5, 0.9); sfx = peq(sfx, 300, -3, 0.9)
mix = music + sfx
fade = int(0.35 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2; mix[-int(0.06 * SR):] = 0.0   # silence on the last samples
music[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
for name, x in (("music", music), ("sfx", sfx), ("mix", mix)):
    wavfile.write(os.path.join(V, "score", name + ".wav"), SR, (x / max(1.0, np.abs(x).max() * 1.01) if name == "mix" else x).astype(np.float32))
print("peak", float(np.abs(mix).max()))
