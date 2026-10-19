"""Assemble a renderable HyperFrames project from a version folder.
usage: build.py <vdir> <preview|final>  -> <vdir>/build/<mode>/index.html (+ data.js, film.js, fonts, gsap)"""
import json, os, shutil, sys
vdir, mode = sys.argv[1], sys.argv[2]
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(vdir, "build", mode)
if os.path.exists(out): shutil.rmtree(out)
os.makedirs(out)
W, H, S, FPS = (960, 540, 0.5, 30) if mode == "preview" else (1920, 1080, 1, 60)
tpl = open(os.path.join(vdir, "compositions", "index.template.html")).read()
DENSE = None
if mode == "dense":   # a composition that renders only the listed film frames (frame i of this comp = film frame DENSE[i])
    DENSE = json.load(open(os.path.join(vdir, "dense_frames.json"))); n = len(DENSE); d = round(n / 60, 6)
    assert tpl.count('data-duration="24"') == 2 and "tl.to(P, { t: 24, duration: 24," in tpl and "P.t + OFF" in tpl
    tpl = tpl.replace('data-duration="24"', f'data-duration="{d}"').replace("tl.to(P, { t: 24, duration: 24,", f"tl.to(P, {{ t: {d}, duration: {d},")
    tpl = tpl.replace("P.t + OFF", "window.__DENSE[Math.min(window.__DENSE.length - 1, Math.round(P.t * 60))] / 60 + OFF")
for k, v in {"__W__": W, "__H__": H, "__SCALE__": S, "__FPS__": FPS}.items(): tpl = tpl.replace(k, str(v))
open(os.path.join(out, "index.html"), "w").write(tpl)
shots = json.load(open(os.path.join(vdir, "shots.json")))
events = json.load(open(os.path.join(vdir, "events.json")))
claims = {c["id"]: c["text"] for c in json.load(open(os.path.join(vdir, "claims.json")))["claims"]}
open(os.path.join(out, "data.js"), "w").write(
    "window.__SHOTS=" + json.dumps(shots) + ";\nwindow.__EVENTS=" + json.dumps(events) + ";\nwindow.__CLAIMS=" + json.dumps(claims) + ";\n" + ("window.__DENSE=" + json.dumps(DENSE) + ";\n" if DENSE else ""))
shutil.copy(os.path.join(vdir, "compositions", "film.js"), out)
shutil.copy(os.path.join(FILM, "assets", "gsap.min.js"), out)
shutil.copy(os.path.join(FILM, "assets", "fonts.css"), out)
shutil.copytree(os.path.join(FILM, "assets", "fonts"), os.path.join(out, "fonts"))
print(out)
