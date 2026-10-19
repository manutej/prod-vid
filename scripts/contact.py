"""Contact sheet: one frame every 0.5 s (48 frames), 8 x 6 grid. usage: contact.py <mp4> <out.png> [thumb_w]"""
import subprocess, sys, numpy as np
from PIL import Image, ImageDraw
mp4, out = sys.argv[1], sys.argv[2]; tw = int(sys.argv[3]) if len(sys.argv) > 3 else 320; th = tw * 9 // 16
p = subprocess.run(["ffmpeg", "-v", "error", "-i", mp4, "-vf", f"fps=2,scale={tw}:{th}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
a = np.frombuffer(p.stdout, np.uint8); n = a.size // (tw * th * 3); fr = a[: n * tw * th * 3].reshape(n, th, tw, 3)
cols = 8; rows = (n + cols - 1) // cols; pad = 16
S = Image.new("RGB", (cols * (tw + 4), rows * (th + pad + 4)), (255, 255, 255)); D = ImageDraw.Draw(S)
for i in range(n):
    x, y = (i % cols) * (tw + 4), (i // cols) * (th + pad + 4)
    S.paste(Image.fromarray(fr[i]), (x, y + pad)); D.text((x + 2, y + 2), f"{i*0.5:.1f}s", fill=(0, 0, 0))
S.save(out); print(out, n, "frames")
