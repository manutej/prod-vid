// Per output frame: max screen speed (px/frame) of any visible text element or the thread. node speedprobe.js <build_dir> <out.json>
const { chromium } = require(process.env.PKGS + '/playwright-core'); const fs = require('fs');
(async () => {
  const [dir, out] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.HEADLESS_SHELL });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + dir + '/index.html'); await p.evaluate(() => document.fonts.ready);
  const res = await p.evaluate(() => {
    const snap = () => { const m = new Map(); for (const e of document.querySelectorAll('.tx, #thread path')) { let n = e, vis = true; while (n && n !== document.body) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') { vis = false; break; } n = n.parentElement; } if (!vis) continue; const r = e.getBoundingClientRect(); if (r.width < 1 || r.right < 0 || r.left > 1920 || r.bottom < 0 || r.top > 1080) continue; m.set(e, [r.left, r.top, r.right, r.bottom]); } return m; };
    const out = []; let prev = null;
    for (let f = 0; f < 1440; f++) { window.__film.render(f / 60); const cur = snap(); let mx = 0;
      if (prev) for (const [e, r] of cur) { const q = prev.get(e); if (q) mx = Math.max(mx, Math.abs(r[0] - q[0]), Math.abs(r[1] - q[1]), Math.abs(r[2] - q[2]), Math.abs(r[3] - q[3])); }
      out.push(+mx.toFixed(2)); prev = cur; }
    return out; });
  fs.writeFileSync(out, JSON.stringify(res)); await b.close();
})();
