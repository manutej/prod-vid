"""Append one round to journal.jsonl and rewrite PROGRESS.md. usage: round_log.py <round.json>"""
import json, os, sys, datetime
FILM = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
r = json.load(open(sys.argv[1])); r["at"] = datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z"
ck = json.load(open(os.path.join(r["vdir"], "checks.json"))); r["gates"] = {k: v.get("label", "PASS" if v["pass"] else "FAIL") for k, v in ck.items() if not k.startswith("_")}
open(os.path.join(FILM, "journal.jsonl"), "a").write(json.dumps(r) + "\n")
rows = [json.loads(l) for l in open(os.path.join(FILM, "journal.jsonl"))]
L = [f"# PROGRESS (updated {r['at']})", "", f"**Latest round: {r['round']}** ({r['version']}, {r['decision']})", "",
     "| round | version | L1 | L2 | L3 | L4 | total | P1 | P2 | gates failing | decision |", "|---|---|---|---|---|---|---|---|---|---|---|"]
for x in rows:
    s = x["panel"]; fails = [k for k, v in x["gates"].items() if not v.startswith("PASS")]
    L.append(f"| {x['round']} | {x['version']} | {s['L1']} | {s['L2']} | {s['L3']} | {s['L4']} | {s['total']} | {x['p1']} | {x['p2']} | {', '.join(fails) or 'none'} | {x['decision']} |")
L += ["", "## Gates this round", ", ".join(f"{k} {v}" for k, v in r["gates"].items()), "", "## What was weak", *[f"- {w}" for w in r["weak"]],
      "", "## What changed (this round's hypothesis set)", *[f"- {c}" for c in r["changes"]], "", "## Latest artifacts",
      f"- preview/final MP4: {r['mp4']}", f"- contact sheet: {r['contact']}", f"- critique: {r['critique']}", "", "## Next", *[f"- {n}" for n in r.get("next", [])]]
open(os.path.join(FILM, "PROGRESS.md"), "w").write("\n".join(L) + "\n"); print("logged round", r["round"])
