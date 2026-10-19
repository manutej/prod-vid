import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4; tw = int(sys.argv[4]) if len(sys.argv) > 4 else 480
fs = sorted(glob.glob(d + '/*.png')); th = tw * 9 // 16
rows = (len(fs) + cols - 1) // cols; S = Image.new('RGB', (cols * tw, rows * (th + 18)), 'white'); D = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((tw, th)); x, y = (i % cols) * tw, (i // cols) * (th + 18)
    S.paste(im, (x, y + 18)); D.text((x + 4, y + 3), os.path.basename(f)[:-4], fill='black')
S.save(out)
