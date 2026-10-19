// node shoot.js <html> <outprefix> <w> <h> <k0,k1,...>  -> screenshots page?k=ki
const { chromium } = require(process.env.PKGS + '/playwright-core');
(async () => {
  const [html, out, w, h, ks] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: process.env.HEADLESS_SHELL, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  for (const k of ks.split(',')) {
    await p.goto('file://' + html + '?k=' + k);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${out}${k}.png` });
  }
  await b.close();
})();
