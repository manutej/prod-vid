// Deterministic seek-stills straight from the composition (for quick looks and gates G8/G9).
// node stills.js <build_dir> <outdir> <t1,t2,...> [audit.json]
const { chromium } = require(process.env.PKGS + '/playwright-core');
const fs = require('fs');
(async () => {
  const [dir, out, ts, auditPath] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.HEADLESS_SHELL, args: ['--allow-file-access-from-files'] });
  const html = fs.readFileSync(dir + '/index.html', 'utf8'); const m = /width=(\d+), height=(\d+)/.exec(html);
  const p = await b.newPage({ viewport: { width: +m[1], height: +m[2] } });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (c) => { if (c.type() === 'error') errs.push(c.text()); });
  await p.goto('file://' + dir + '/index.html'); await p.evaluate(() => document.fonts.ready);
  const audit = [];
  const times = ts === 'grid' ? [...Array(96).keys()].map((i) => i * 0.25) : ts.split(',').map(Number);
  for (const t of times) {
    await p.evaluate((t) => window.__film.render(t), t);
    if (auditPath) audit.push({ t, items: await p.evaluate(() => window.__film.textAudit()), stray: await p.evaluate(() => {
      const out = []; const w = document.createTreeWalker(document.getElementById('stage'), NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; if (!n.parentElement.closest('.tx')) out.push(n.textContent.trim()); } return out; }) });
    if (!auditPath || ts !== 'grid') await p.screenshot({ path: `${out}/t${t.toFixed(2).padStart(5, '0')}.png` });
  }
  if (auditPath) fs.writeFileSync(auditPath, JSON.stringify({ frames: audit }));
  if (errs.length) console.log('ERRORS', errs.slice(0, 5));
  await b.close();
})();
