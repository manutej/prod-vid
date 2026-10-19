"""S9 machine gates G1-G12 for meta-prompt v1.1 (FROZEN for the v8 run; G7 as fixed in v1.1; G8 stricter per I7; G10-G12 new).
usage: gates.py <vdir> <mp4> <spec: preview|final>  -> writes <vdir>/checks.json, exit 0 iff all pass.
G1 compares against the Format (1920x1080@60, 1440 frames) when spec=final; preview renders are checked against the
preview spec (960x540@30, 720 frames) and G1 is then reported as 'PASS(preview-spec)', which is NOT a Format pass."""
import json, os, re, subprocess, sys
import numpy as np
from scipy.io import wavfile

VDIR, MP4, SPEC = sys.argv[1], sys.argv[2], sys.argv[3]
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, FPS, NF = (1920, 1080, 60, 1440) if SPEC == "final" else (960, 540, 30, 720)
ACC = np.array([0xB8, 0x40, 0x1A], float); INK = np.array([0x1E, 0x0E, 0x3F], float)
TH = dict(lufs=(-17.0, -15.0), tp=-1.0, sync_s=1 / 60, accent_px_frac=0.00004, cut_ssim=0.45, fade_cov=0.5, fade_run=3,
          frozen_eps=0.02, accent_out_frac=0.01, body_px=22, label_px=16, contrast=4.5, sec_per_word=0.2)
res = {}

def ff(args): return subprocess.run(["ffmpeg", "-v", "error", *args], capture_output=True)
def frames(vf, w, h, ch):
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24" if ch == 3 else "gray", "-"], capture_output=True)
    a = np.frombuffer(p.stdout, np.uint8); n = a.size // (w * h * ch); return a[: n * w * h * ch].reshape(n, h, w, ch) if ch == 3 else a[: n * w * h].reshape(n, h, w)

# ---- G1
pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-count_frames", "-of", "json", MP4], capture_output=True, text=True).stdout)
vs = [s for s in pr["streams"] if s["codec_type"] == "video"][0]; aus = [s for s in pr["streams"] if s["codec_type"] == "audio"]
nb = int(vs.get("nb_read_frames", vs.get("nb_frames", 0))); fr = vs["r_frame_rate"]
g1 = vs["width"] == W and vs["height"] == H and fr == f"{FPS}/1" and nb == NF
res["G1"] = {"pass": g1, "label": ("PASS" if g1 else "FAIL") + ("(preview-spec)" if SPEC != "final" else ""), "width": vs["width"], "height": vs["height"], "fps": fr, "frames": nb, "expected_frames": NF,
             "duration": float(pr["format"]["duration"]), "profile": vs.get("profile"), "pix_fmt": vs.get("pix_fmt")}

# ---- G2
if aus:
    a = aus[0]; p = subprocess.run(["ffmpeg", "-nostats", "-i", MP4, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    s = p.stderr[p.stderr.rfind("Summary:"):]
    I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)); TP = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))
    vd = ff(["-i", MP4, "-map", "0:a", "-af", "volumedetect", "-f", "null", "-"]); mx = re.search(rb"max_volume: (-?[\d.]+) dB", vd.stderr)
    maxv = float(mx.group(1)) if mx else None
    g2 = TH["lufs"][0] <= I <= TH["lufs"][1] and TP <= TH["tp"] and int(a["channels"]) == 2 and (maxv is None or maxv < 0)
    res["G2"] = {"pass": g2, "codec": a["codec_name"], "channels": a["channels"], "sample_rate": a["sample_rate"], "bit_rate": a.get("bit_rate"), "duration": float(a.get("duration", 0)), "integrated_lufs": I, "true_peak_dbtp": TP, "max_volume_db": maxv}
else:
    res["G2"] = {"pass": False, "error": "no audio stream"}

# ---- G3 onset sync on the effects stem
events = json.load(open(os.path.join(VDIR, "events.json")))
sr, sfx = wavfile.read(os.path.join(VDIR, "score", "sfx.wav")); mono = np.abs(sfx).mean(axis=1) if sfx.ndim == 2 else np.abs(sfx)
hop = int(sr * 0.0005); nh = len(mono) // hop; env = mono[: nh * hop].reshape(nh, hop).max(axis=1)
errs = []; miss = []
for e in events:
    c = int(round(e["t"] * sr / hop)); lo, hi = max(1, c - int(0.03 * sr / hop)), min(nh - 1, c + int(0.03 * sr / hop))
    on = None
    for k in range(lo, hi):
        pre = env[max(0, k - 8):k].mean() if k > 0 else 0.0
        if env[k] > 0.004 and env[k] > 2.5 * pre + 1e-4: on = k; break
    if on is None: miss.append(e); continue
    errs.append((on * hop / sr - e["t"], e))
bad = [x for x in errs if abs(x[0]) > TH["sync_s"]]
res["G3"] = {"pass": not miss and not bad, "events": len(events), "detected": len(errs), "missed": [f'{m["kind"]}:{m["obj"]}@{m["f"]}' for m in miss][:20],
             "out_of_tolerance": [f'{e["kind"]}:{e["obj"]}@{e["f"]} err={d*1000:.1f}ms' for d, e in bad][:20],
             "max_abs_err_ms": round(max([abs(d) for d, _ in errs] or [0]) * 1000, 2), "tolerance_ms": round(TH["sync_s"] * 1000, 2)}

# ---- streamed frames (memory-safe)
def stream(vf, ch):
    pix = "rgb24" if ch == 3 else "gray"; sz = W * H * ch
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", MP4, "-vf", vf, "-f", "rawvideo", "-pix_fmt", pix, "-"], stdout=subprocess.PIPE, bufsize=sz * 2)
    while True:
        buf = p.stdout.read(sz)
        if len(buf) < sz: break
        a = np.frombuffer(buf, np.uint8); yield a.reshape(H, W, ch) if ch == 3 else a.reshape(H, W)
    p.wait()
thr = TH["accent_px_frac"] * W * H; cnts = []; ah = 14.0
def lab(rgb):
    c = rgb / 255.0; c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    X = c[..., 0] * 0.4124 + c[..., 1] * 0.3576 + c[..., 2] * 0.1805; Y = c[..., 0] * 0.2126 + c[..., 1] * 0.7152 + c[..., 2] * 0.0722; Z = c[..., 0] * 0.0193 + c[..., 1] * 0.1192 + c[..., 2] * 0.9505
    X /= 0.95047; Z /= 1.08883; f = lambda u: np.where(u > 0.008856, np.cbrt(u), 7.787 * u + 16 / 116)
    return np.stack([116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))], -1)
LINES = [(np.array([0x1E, 0x0E, 0x3F], float), np.array(g, float)) for g in ([0xEC, 0xED, 0xE6], [0xF7, 0xF7, 0xF2], [0x14, 0x14, 0x13], [0xEF, 0xEF, 0xE8], [0xF3, 0xF3, 0xEE])]
def seg_de(L, a, b):
    A, B = lab(a[None, None, :])[0, 0], lab(b[None, None, :])[0, 0]
    # dense sampling of the blend line in sRGB (that is how anti-aliasing mixes), distance to nearest sample in Lab
    samples = lab(np.array([a + (b - a) * u for u in np.linspace(0, 1, 48)])[None])[0]
    d = np.full(L.shape[:-1], 1e9)
    for smp in samples: d = np.minimum(d, np.sqrt(((L - smp) ** 2).sum(-1)))
    return d
def g7_frame(rgb):
    mx_ = rgb.max(axis=2); mn_ = rgb.min(axis=2); V_ = mx_ / 255; S_ = np.where(mx_ > 0, (mx_ - mn_) / np.maximum(mx_, 1), 0)
    cand = (S_ > 0.35) & (V_ > 0.25)
    if not cand.any(): return 0, 0, np.zeros(36, int)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hue = (np.degrees(np.arctan2(np.sqrt(3) * (g - b), 2 * r - g - b)) + 360) % 360
    dh = np.minimum(np.abs(hue - ah), 360 - np.abs(hue - ah))
    idx = np.nonzero(cand); L = lab(rgb[idx])[:, None, :]
    ink = np.zeros(len(idx[0]), bool)
    for a_, b_ in LINES: ink |= seg_de(L, a_, b_)[:, 0] <= 8
    sat = np.zeros_like(cand); sat[idx] = ~ink
    return int(sat.sum()), int((sat & (dh > 22)).sum()), np.histogram(hue[sat], bins=36, range=(0, 360))[0]
nsat = out = 0; hist = np.zeros(36, int)
for fr3 in stream("fps=4", 3):
    rgb = fr3.astype(np.float32)
    cnts.append(int((np.sqrt(((rgb - ACC) ** 2).sum(axis=2)) < 70).sum()))
    a1, o1, h1 = g7_frame(rgb); nsat += a1; out += o1; hist += h1
missing = [round(i * 0.25, 2) for i, c in enumerate(cnts) if c < thr]
res["G4"] = {"pass": not missing and len(cnts) > 0, "sampled": len(cnts), "threshold_px": round(thr, 1), "min_px": int(min(cnts)), "frames_without_thread_s": missing[:30]}
from PIL import Image
import glob as _g
ln_s = ln_o = 0
for pth in sorted(_g.glob(os.path.join(VDIR, "lossless", "*.png"))):
    a1, o1, _ = g7_frame(np.asarray(Image.open(pth).convert("RGB")).astype(np.float32)); ln_s += a1; ln_o += o1
fe = out / max(1, nsat); fl = ln_o / max(1, ln_s)
res["G7"] = {"pass": fe < TH["accent_out_frac"] and fl < TH["accent_out_frac"], "encoded": {"saturated_px": nsat, "outside": out, "frac": round(fe, 5)},
             "lossless": {"saturated_px": ln_s, "outside": ln_o, "frac": round(fl, 5)}, "hue_hist_10deg": hist.tolist()}

def ssim(a, b):
    import cv2
    a = cv2.resize(a, (240, 135), interpolation=cv2.INTER_AREA).astype(float); b = cv2.resize(b, (240, 135), interpolation=cv2.INTER_AREA).astype(float)
    C1, C2 = 6.5, 58.5
    mu_a = cv2.GaussianBlur(a, (7, 7), 1.5); mu_b = cv2.GaussianBlur(b, (7, 7), 1.5)
    sa = cv2.GaussianBlur(a * a, (7, 7), 1.5) - mu_a ** 2; sb = cv2.GaussianBlur(b * b, (7, 7), 1.5) - mu_b ** 2; sab = cv2.GaussianBlur(a * b, (7, 7), 1.5) - mu_a * mu_b
    return float((((2 * mu_a * mu_b + C1) * (2 * sab + C2)) / ((mu_a ** 2 + mu_b ** 2 + C1) * (sa + sb + C2))).mean())
mads, cuts, fadef, lumas = [], [], [], []
prev = None
for i, g in enumerate(stream("format=gray", 1)):
    lumas.append(float(g.mean()))
    if prev is not None:
        d = g.astype(np.int16) - prev.astype(np.int16)
        mad = float(np.abs(d).mean()); mads.append(mad)
        ch = np.abs(d) > 1.5; cov = ch.mean()
        if cov > 0.2:
            m = d[ch].mean(); same = (np.sign(d[ch]) == np.sign(m)).mean(); spread = d[ch].std() / max(abs(m), 1e-6)
            if cov * same > TH["fade_cov"] and spread < 0.6: fadef.append(i)
        if mad > 2.0:
            sv = ssim(prev, g)
            if sv < TH["cut_ssim"]: cuts.append((i, round(sv, 3)))
    prev = g
runs = []; run = []
for i in fadef:
    if run and i == run[-1] + 1: run.append(i)
    else:
        if len(run) >= TH["fade_run"]: runs.append((run[0], run[-1]))
        run = [i]
if len(run) >= TH["fade_run"]: runs.append((run[0], run[-1]))
res["G5"] = {"pass": not cuts and not runs, "cuts(frame,ssim)": cuts[:20], "fade_runs(frames)": runs[:20], "fade_like_frames": len(fadef)}
frozen = [i for i, m in enumerate(mads, 1) if m <= TH["frozen_eps"]]
res["G6"] = {"pass": not frozen and len(mads) > 0, "eps": TH["frozen_eps"], "min_mad": round(min(mads), 4), "frozen_frames": frozen[:30], "n_pairs": len(mads)}

# ---- G8/G9/G11/G12 from the composition's own text audit (final build, 1080p, every 0.25 s, with screen velocity)
aud = json.load(open(os.path.join(VDIR, "text_audit.json")))
CJ = json.load(open(os.path.join(VDIR, "claims.json"))); claims = {c["id"]: c["text"] for c in CJ["claims"]}; jargon = CJ.get("jargon", [])
def rgbp(s): return np.array([float(x) for x in re.findall(r"[\d.]+", s)[:3]])
def hexp(s): s = s.lstrip("#"); return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], float)
def lum(c):
    c = c / 255; c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def contrast(a, b): la, lb = lum(a), lum(b); return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)
SENTW = set(claims.get("sentence", "").split(" "))
size_fail, contrast_fail, truth_fail, stray, jar_fail = [], [], [], [], []
samples = {}   # claim text -> list of (t, readable, box)
for fr_ in aud["frames"]:
    t = fr_["t"]; stray += [f"{t}:{x}" for x in fr_.get("stray", [])]
    for it in fr_["items"]:
        txt = it["text"]; cid = it["claim"]; full = claims.get(cid); ok = False
        if full is not None:
            if txt == full: ok = True
            elif it.get("typing") and full.startswith(txt): ok = True
            elif it.get("word") and txt in SENTW: ok = True
            elif it["tick"] and cid == "checks": ok = re.fullmatch(r"[1-9] of 9 checks passed", txt) is not None
            elif it["tick"] and txt.isdigit(): ok = int(txt) <= int(re.sub(r"\D", "", full) or 0)
        if not ok: truth_fail.append(f"{t}s '{txt[:40]}' (claim {cid})")
        for j in jargon:
            if re.search(r"(?<![A-Za-z0-9])" + re.escape(j) + r"(?![A-Za-z0-9])", txt): jar_fail.append(f"{t}s '{j}' in '{txt[:40]}'")
        transient = bool(it["clip"] and re.search(r"[1-9][\d.]*%", it["clip"])) or it["op"] < 0.6 or it["blur"] >= 1.0
        readable = (not transient) and it.get("v", 99) <= 3.0
        key = (cid, txt) if not it.get("word") else (cid + ":w", txt)
        samples.setdefault(key, []).append((t, readable, (it["x"], it["y"], it["x"] + it["w"], it["y"] + it["h"]), it))
        if not readable: continue
        need = TH["body_px"] if it["role"] == "body" else TH["label_px"]
        if it["px"] + 0.05 < need: size_fail.append(f"{t}s '{txt[:28]}' {it['px']:.1f}px<{need} ({it['role']})")
        if it["role"] == "body":
            col = rgbp(it["color"]); bg = hexp(it["bg"]); col = bg + (col - bg) * it["op"]; cr = contrast(col, bg)
            if cr < TH["contrast"]: contrast_fail.append(f"{t}s '{txt[:28]}' {cr:.2f}")
dur_fail, edge_fail = [], []
EDGE = 20
for (cid, txt), lst in samples.items():
    full = claims.get(cid.split(":")[0])
    if full is None or (txt != full and not cid.endswith(":w")): continue
    words = len(txt.split()); need = max(0.25, TH["sec_per_word"] * words)
    rd = [s_ for s_ in lst if s_[1]]
    if cid.endswith(":w"): continue
    if sum(0.25 for _ in rd) + 1e-9 < need: dur_fail.append(f"'{txt[:50]}' sharp {sum(0.25 for _ in rd):.2f}s<{need:.2f}s")
    if rd:   # read window: from first sharp sample, for 'need' seconds
        t0 = rd[0][0]
        for (t, r_, (x0, y0, x1, y1), it) in lst:
            if t0 <= t <= t0 + need and (x0 < EDGE or y0 < EDGE or x1 > 1920 - EDGE or y1 > 1080 - EDGE): edge_fail.append(f"{t}s '{txt[:40]}' box ({x0:.0f},{y0:.0f},{x1:.0f},{y1:.0f})")
dedup = lambda xs: sorted(set(xs), key=xs.index)
res["G8"] = {"pass": not size_fail and not contrast_fail and not dur_fail, "size_fail": dedup(size_fail)[:25], "n_size_fail": len(size_fail), "contrast_fail": dedup(contrast_fail)[:15], "duration_fail": dur_fail[:20], "sharp_rule": "readable = fully revealed, opacity>=0.6, blur<1px, screen speed <=3 px/frame"}
res["G9"] = {"pass": not truth_fail and not stray, "untrue_strings": dedup(truth_fail)[:25], "stray_text_nodes": dedup(stray)[:10], "claims": len(claims)}
res["G11"] = {"pass": not jar_fail, "jargon_hits": dedup(jar_fail)[:20], "jargon_list": jargon}
res["G12"] = {"pass": not edge_fail, "edge_px": EDGE, "violations": dedup(edge_fail)[:20]}

# ---- G10 arc on the master in the delivered file (I18a)
p = subprocess.run(["ffmpeg", "-v", "error", "-i", MP4, "-map", "0:a", "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True)
au = np.frombuffer(p.stdout, np.float32); SRa = 48000
def rms_db(a, b): x = au[int(a * SRa):int(b * SRa)]; return 20 * np.log10(np.sqrt((x.astype(float) ** 2).mean()) + 1e-12)
evs = json.load(open(os.path.join(VDIR, "events.json")))
hit = [e["t"] for e in evs if e["kind"] == "hit"][0]; first_beat = [e["t"] for e in evs if e["kind"] == "caption"][0] - 2.0
first = rms_db(max(0, first_beat), first_beat + 2.0); build = rms_db(hit - 2.0, hit - 0.5); dip = rms_db(hit - 0.4, hit - 0.02)
hop = int(0.001 * SRa); envm = np.abs(au[: len(au) // hop * hop]).reshape(-1, hop).max(axis=1)
k0 = int((hit - 0.05) / 0.001); k1 = int((hit + 0.1) / 0.001); onset = None
for k in range(k0, k1):
    if envm[k] > 4 * (envm[max(0, k - 10):k].mean() + 1e-6) and envm[k] > 0.01: onset = k * 0.001; break
tail = float(20 * np.log10(np.abs(au[-int(0.05 * SRa):]).max() + 1e-12))
g10 = (build - first >= 6) and (dip <= build - 12) and onset is not None and abs(onset - hit) <= 2 / 60 and tail < -60
res["G10"] = {"pass": bool(g10), "first_beat_rms_db": round(first, 2), "pre_climax_rms_db": round(build, 2), "rise_db": round(build - first, 2), "dip_rms_db": round(dip, 2), "dip_below_build_db": round(build - dip, 2),
              "hit_t": hit, "onset_t": onset, "hit_err_frames": None if onset is None else round((onset - hit) * 60, 2), "last_50ms_peak_dbfs": round(tail, 1)}

allpass = all(v["pass"] for v in res.values())
res["_summary"] = {"spec": SPEC, "mp4": MP4, "all_pass": allpass, "fails": [k for k, v in res.items() if not k.startswith("_") and not v["pass"]]}
json.dump(res, open(os.path.join(VDIR, "checks.json"), "w"), indent=1)
for k in sorted(k for k in res if not k.startswith("_")):
    v = res[k]; print(k, v.get("label", "PASS" if v["pass"] else "FAIL"))
print("ALL PASS" if allpass else "FAILS: " + ",".join(res["_summary"]["fails"]))
sys.exit(0 if allpass else 1)
