// v1.1 text audit: every 0.25 s, each visible text item with size, colour, clip, and screen velocity (px per 1/60 s).
// Also writes lossless PNG frames at whole seconds for the G7 lossless check.
// node audit11.js <build_dir> <audit.json> <png_dir>
const { chromium } = require(process.env.PKGS + '/playwright-core');
const fs = require('fs');
(async () => {
  const [dir, outPath, pngDir] = process.argv.slice(2); fs.mkdirSync(pngDir, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.HEADLESS_SHELL, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + dir + '/index.html'); await p.evaluate(() => document.fonts.ready);
  const stray = () => { const out = []; const w = document.createTreeWalker(document.getElementById('stage'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; if (!n.parentElement.closest('.tx')) out.push(n.textContent.trim()); } return out; };
  const frames = [];
  for (let i = 0; i < 96; i++) {
    const t = i * 0.25;
    await p.evaluate((t) => window.__film.render(t), t + 1 / 60);
    const nxt = await p.evaluate(() => window.__film.textAudit());
    await p.evaluate((t) => window.__film.render(t), t);
    const items = await p.evaluate(() => window.__film.textAudit());
    const m = {}; nxt.forEach((it) => (m[it.i] = it));
    items.forEach((it) => { const q = m[it.i]; it.v = q ? Math.hypot(q.x - it.x, q.y - it.y, q.w - it.w) : 99; });
    frames.push({ t, items, stray: await p.evaluate(stray) });
    if (i % 4 === 0) await p.screenshot({ path: `${pngDir}/s${String(i / 4).padStart(2, '0')}.png` });
  }
  fs.writeFileSync(outPath, JSON.stringify({ frames }));
  await b.close();
})();
