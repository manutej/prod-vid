"""Replace the fast frames of the N=4 film with their N=16 versions, then encode the delivery file with audio.
usage: splice.py <main_avg.mp4> <dense_avg.mp4> <dense_frames.json> <master.wav> <out.mp4>"""
import json, subprocess, sys
main, dense, lst, wav, out = sys.argv[1:6]
frames = json.load(open(lst)); W, H = 1920, 1080; SZ = W * H * 3
rd = lambda p: subprocess.Popen(["ffmpeg", "-v", "error", "-i", p, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE, bufsize=SZ * 2)
A, B = rd(main), rd(dense)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "60", "-i", "-", "-i", wav,
                        "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "slow",
                        "-c:a", "aac", "-b:a", "320k", "-movflags", "+faststart", "-shortest", out], stdin=subprocess.PIPE)
want = set(frames); order = {f: i for i, f in enumerate(frames)}; di = 0; dbuf = None; n = 0
for f in range(1440):
    a = A.stdout.read(SZ)
    if len(a) < SZ: raise SystemExit(f"main ended at {f}")
    if f in want:
        while di <= order[f]: dbuf = B.stdout.read(SZ); di += 1
        if len(dbuf) < SZ: raise SystemExit(f"dense ended at {f}")
        a = dbuf; n += 1
    enc.stdin.write(a)
enc.stdin.close(); enc.wait(); print(f"spliced {n} dense frames (N=16) into 1440")
