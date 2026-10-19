"""v8 S5/S6: one timing source -> shots.json + events.json. One input carried the whole way:
sentence -> word tiles -> composed brief (Seam) -> tries (Lineage) -> the finished Meta-Prompt Atlas (climax) -> mark."""
import json, os, sys
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 60
SENT = "Find every meta-prompt on my Mac and give me a dashboard to explore them."
PRE = len("Find every meta-prompt ")          # already typed on frame 0 (the hook is the promise, readable at once)
ev = []
def E(f, kind, obj="", v=None):
    ev.append({"f": int(f), "t": round(f / FPS, 5), "kind": kind, "obj": obj, **({"v": v} if v is not None else {})})

TYPE0, STEP = 2, 1                       # remaining 50 characters type at one per frame: full sentence by 0.87 s
for i in range(PRE, len(SENT)):
    if SENT[i] != " " and (i - PRE) % 2 == 0: E(TYPE0 + STEP * (i - PRE), "key", f"c{i}", ord(SENT[i]))
E(120, "enter", "sentence")
E(210, "lift", "tiles")
WORDS = SENT.split(" ")
TT = []; t_ = 224
for k in range(len(WORDS)):
    if abs(t_ - 240) < 5: t_ = 245          # keep tiles clear of the caption sound at the bar line
    TT.append(t_); E(t_, "tile", f"w{k}", k); t_ += 5
E(240, "caption", "Seam")
for k in range(5): E(300 + 18 * k, "rule", f"r{k}", k)
E(396, "rule", "conflict", 5)
E(408, "snag", "conflict")
E(432, "pass", "verdict")
E(540, "caption", "Lineage")
E(590, "reject", "t1")
E(620, "reject", "t2")
E(645, "redesign", "approach")
for k in range(9): E(652 + 5 * k, "check", f"chk{k}", k)
E(760, "draw", "window")
E(776, "click", "header", 0)
E(800, "stat", "n314", 0)
E(820, "draw", "chain")
E(832, "stat", "n86", 1)
E(844, "stat", "n11", 2)
E(856, "stat", "n26", 3)
E(866, "click", "search", 1)
for k in range(4): E(874 + 6 * k, "chip", f"ch{k}", k)
for k in range(5): E(902 + 10 * k, "row", f"row{k}", k)
E(926, "click", "reader", 2)
E(1080, "key2", "Reader")
E(1200, "hit", "mark")
E(1260, "stand", "cursor")
for k, ch in enumerate("CETI"): E(1254 + 6 * k, "key", f"m{k}", ord(ch))
E(1290, "mark", "CETI")
E(1320, "tagline", "tagline")
E(1350, "label", "preview")
ev.sort(key=lambda e: (e["f"], e["kind"]))

shots = {
 "fps": FPS, "frames": 1440, "sentence": SENT, "pre": PRE,
 "T": {"type0": TYPE0, "step": STEP, "lift": 210, "grow": [240, 292], "lineIn": [540, 586], "winIn": [760, 816],
       "key2": 1080, "quiet": 1170, "push": 1200, "pushEnd": 1250, "markType0": 1254, "markStep": 6},
 "scenes": [
  {"id": "A", "name": "input (Oneline)", "f": [0, 240], "shared_out": ["thread", "the sentence (as tiles)"]},
  {"id": "B", "name": "composed brief (Seam)", "f": [240, 480], "shared_in": ["thread", "tiles"], "shared_out": ["thread", "Pass chip"]},
  {"id": "C", "name": "tries (Lineage)", "f": [480, 720], "shared_in": ["thread", "Pass chip"], "shared_out": ["thread", "9 of 9 row"]},
  {"id": "D", "name": "the finished Atlas (climax)", "f": [720, 1200], "shared_in": ["thread", "9 of 9 row"], "shared_out": ["thread", "Reader pill"]},
  {"id": "E", "name": "mark", "f": [1200, 1440], "shared_in": ["thread", "Reader pill (becomes the ground)"]}],
 "layout": {
   "card": {"x": 250, "y": 330, "w": 1420, "h0": 340, "h1": 830},
   "line": {"x": 1840, "label": [1820, 430], "rows": [590, 690, 790, 900]},
   "win": {"x": 1180, "y": 300, "w": 1640, "h": 980}},
 "camera": [
  # f, cx, cy, zoom, rx, ry, rz, focusZ: closer holds with slow push-ins (<=3 px/frame on read text) + eased moves
  [0, 960, 502, 1.180, 1.2, -2.0, -0.2, 0],
  [205, 962, 500, 1.260, 0.8, -1.2, 0, 0],
  [292, 960, 745, 1.100, 1.3, 0.6, 0.1, 0],
  [536, 966, 748, 1.150, 1.0, 1.0, 0, 0],
  [592, 2140, 700, 1.260, 1.4, 1.6, 0, 0],
  [752, 2150, 708, 1.320, 1.0, 1.0, 0, 0],
  [820, 2000, 790, 1.040, 1.0, -1.0, 0, 0],
  [1004, 2006, 793, 1.065, 0.8, -0.8, 0, 0],
  [1046, 1580, 930, 1.300, 1.4, 1.2, 0, 0],
  [1078, 1586, 932, 1.320, 1.2, 1.0, 0, 0],
  [1112, 2000, 760, 1.100, 0.8, -0.5, 0, 0],
  [1200, 2004, 744, 1.130, 0.5, -0.3, 0, 0]],
}
json.dump(ev, open(os.path.join(OUT, "events.json"), "w"), indent=0)
json.dump(shots, open(os.path.join(OUT, "shots.json"), "w"), indent=1)
print(len(ev), "events")
