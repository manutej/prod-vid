/* CETI launch film v8: one input carried the whole way.
   The sentence types; its words lift into tiles; the tiles head a composed brief whose lines assemble with checks;
   the passing brief runs through tries; the passing build becomes the real Meta-Prompt Atlas (climax); push into it -> mark.
   Picture is a pure function of time; all timing from events.json / shots.json (inlined by build.py). */
(function () {
  'use strict';
  const SH = window.__SHOTS, EVL = window.__EVENTS, CL = window.__CLAIMS;
  const FPS = SH.fps, LY = SH.layout, T = SH.T;
  const INK = '#1E0E3F', ACC = '#B8401A', GROUND = '#ECEDE6', CARD = '#F7F7F2', FINAL = '#141413', INK_T = '#706781', INK_F = '#645A78';
  const D = 2000;
  const S = (id) => { if (!(id in CL)) throw new Error('no claim ' + id); return CL[id]; };
  const EV = {}; for (const e of EVL) { const k = e.kind + ':' + e.obj; if (!(k in EV)) EV[k] = e.f; }
  const ev = (k, o) => { const v = EV[k + ':' + o]; if (v === undefined) throw new Error('missing event ' + k + ':' + o); return v; };

  // ---------- math
  const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  const seg = (f, a, b) => clamp01((f - a) / (b - a));
  const lerp = (a, b, x) => a + (b - a) * x;
  const eio = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eo = (x) => 1 - Math.pow(1 - x, 3);
  const ei = (x) => x * x * x;
  const spring = (x) => x <= 0 ? 0 : x >= 1.6 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(9.5 * x);
  const back = (x) => { const c = 1.5; x = clamp01(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  function mul(a, b) { const r = new Array(16); for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + rr] * b[c * 4 + k]; r[c * 4 + rr] = s; } return r; }
  const Tm = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z || 0, 1];
  const Sm = (s) => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1];
  const rad = (d) => d * Math.PI / 180;
  const RX = (d) => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; };
  const RY = (d) => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; };
  const RZ = (d) => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; };
  const chain = (...ms) => ms.reduce((a, b) => mul(a, b));
  const ap = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * (p[2] || 0) + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * (p[2] || 0) + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * (p[2] || 0) + m[14]];
  const css = (m) => 'matrix3d(' + m.map((v) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(6))).join(',') + ')';

  // ---------- camera (non-uniform Hermite through keys; zoom in log space)
  const CK = SH.camera.map((k) => ({ f: k[0], v: [k[1], k[2], Math.log(k[3]), k[4], k[5], k[6], k[7]] }));
  function camAt(f) {
    const n = CK.length; let v;
    if (f <= CK[0].f) v = CK[0].v.slice();
    else if (f >= CK[n - 1].f) v = CK[n - 1].v.slice();
    else { let i = 0; while (CK[i + 1].f < f) i++; const u = eio((f - CK[i].f) / (CK[i + 1].f - CK[i].f)); v = CK[i].v.map((x, q) => x + (CK[i + 1].v[q] - x) * u); }
    v[0] += 34 * Math.sin(f / 90); v[1] += 18 * Math.sin(f / 127 + 1.1); v[2] += 0.006 * Math.sin(f / 151);   // ~0.4 px/frame drift
    return v;
  }
  const W = LY.win;
  const PILL = { x: W.x + 560 + 168 + 12, y: W.y + 22, w: 148, h: 46 }; // "2 Reader" pill in world
  const PILL_C = [PILL.x + PILL.w / 2, PILL.y + PILL.h / 2, 0];
  function camera(f) {
    let [cx, cy, lz, rx, ry, rz, fz] = camAt(Math.min(f, T.push));
    if (f > T.push) {
      const p = seg(f, T.push, T.pushEnd), e = p; // constant speed in log-zoom: no SSIM spike, no near-still frames at the end
      // zoom about the pill: its screen position glides to centre while the zoom grows (it never leaves the frame)
      const z0 = Math.exp(lz), s0x = 960 + z0 * (PILL_C[0] - cx), s0y = 540 + z0 * (PILL_C[1] - cy);
      lz = lz + e * (Math.log(80) - lz); const z = Math.exp(lz);
      const sx = lerp(s0x, 960, eio(p)), sy = lerp(s0y, 540, eio(p));
      cx = PILL_C[0] - (sx - 960) / z; cy = PILL_C[1] - (sy - 540) / z; rx *= 1 - p; ry *= 1 - p; rz *= 1 - p;
      if (f > T.pushEnd) lz = Math.log(80) + (f - T.pushEnd) * 0.002;
    }
    return { cx, cy, zoom: Math.exp(lz), rx, ry, rz, fz };
  }
  let CAM = null, M = null;
  function project(p) { const q = ap(M, p); const w = 1 - q[2] / D; return [(q[0] - 960) / w + 960, (q[1] - 540) / w + 540]; }

  // ---------- DOM helpers
  const $ = (id) => document.getElementById(id);
  function el(tag, cls, parent, style, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (style) e.style.cssText = style; if (text !== undefined) e.textContent = text; parent.appendChild(e); return e; }
  function txt(parent, id, cls, style, role, bg) { const e = el('div', 'tx ' + (cls || ''), parent, style, S(id)); e.dataset.claim = id; e.dataset.role = role || 'label'; e.dataset.bg = bg || CARD; return e; }
  const setT = (e, m) => { e.style.transform = css(m); };
  const show = (e, on) => { e.style.visibility = on ? 'visible' : 'hidden'; };
  const showC = (e, on) => { e.style.display = on ? '' : 'none'; }; // containers: children may set visibility themselves
  const world = $('world'), svg = $('thread'), markL = $('mark');
  const ctx = document.createElement('canvas').getContext('2d');
  const measure = (font, s) => { ctx.font = font; return ctx.measureText(s).width; };

  // =========== A/B: the card (input field -> composed brief)
  const C = LY.card;
  const card = el('div', 'card', world, `width:${C.w}px;height:${C.h0}px`);
  const labBox = el('div', 'clipbox', card, `left:40px;top:26px;width:1300px;height:48px`);
  const labA = el('div', 'labrow', labBox); txt(labA, 'b1_name', 'ui', `position:static;display:inline-block;font-size:30px;font-weight:500;color:${INK}`, 'body');
  txt(labA, 'b1_value', 'ui', `position:static;display:inline-block;margin-left:22px;font-size:26px;color:${INK}`, 'body');
  const labB = el('div', 'labrow', labBox); txt(labB, 'b2_name', 'ui', `position:static;display:inline-block;font-size:30px;font-weight:500;color:${INK}`, 'body');
  txt(labB, 'b2_value', 'ui', `position:static;display:inline-block;margin-left:22px;font-size:26px;color:${INK}`, 'body');
  el('div', 'hair', card, `left:40px;top:84px;width:${C.w - 80}px;height:2px;background:${INK};opacity:.10`);
  const SENT = SH.sentence, WORDS = SENT.split(' ');
  const SFONT = "400 60px 'Zen Old Mincho'";
  const sent = el('div', 'tx disp', card, `left:40px;top:104px;width:1340px;font:${SFONT};line-height:86px;color:${INK};white-space:normal`);
  sent.dataset.claim = 'sentence'; sent.dataset.role = 'body'; sent.dataset.bg = CARD; sent.dataset.typing = '1';
  const wspans = WORDS.map((w, k) => { const s = el('span', 'w', sent); if (k < WORDS.length - 1) sent.appendChild(document.createTextNode(' ')); return s; });
  const cursor = el('span', 'cur', sent);
  // word char ranges
  const wStart = []; { let p = 0; WORDS.forEach((w) => { wStart.push(p); p += w.length + 1; }); }
  // tiles
  const TFONT = "500 26px 'Zen Kaku Gothic New'";
  const tiles = WORDS.map((w, k) => { const t = el('div', 'tile', world, ''); const tt = el('div', 'tx ui', t, `position:static;font:${TFONT};color:${INK}`, w); tt.dataset.claim = 'sentence'; tt.dataset.role = 'body'; tt.dataset.word = '1'; tt.dataset.bg = CARD; return t; });
  let tileSlots = null;
  function layoutTiles() {
    const out = []; let x = 40, y = 128; const maxX = 40 + 1340;
    WORDS.forEach((w) => { const tw = measure(TFONT, w) + 32; if (x + tw > maxX) { x = 40; y += 62; } out.push({ x, y, w: tw }); x += tw + 10; });
    return out;
  }
  // brief contents (card-local)
  const briefLab = txt(card, 'brief', 'mono', `left:40px;top:100px;font-size:18px;letter-spacing:.06em;color:${INK}`, 'label');
  const RULES = ['r1', 'r2', 'r3', 'r4', 'r5'];
  const RY0 = 286, RDY = 74;
  const ruleEls = RULES.map((id, k) => {
    const row = el('div', 'rrow', card, `left:84px;top:${RY0 + RDY * k - 22}px`);
    const dot = el('div', 'chk', row, ''); el('i', 'tick', dot);
    txt(row, id, 'ui', `position:static;display:inline-block;margin-left:18px;font-size:30px;color:${INK}`, 'body');
    return row;
  });
  const confRow = el('div', 'rrow', card, `left:84px;top:${RY0 + RDY * 5 - 22}px`);
  const confDot = el('div', 'chk warn', confRow, ''); el('i', 'bang', confDot); el('i', 'bang2', confDot);
  txt(confRow, 'conflict', 'ui', `position:static;display:inline-block;margin-left:18px;font-size:30px;font-weight:500;color:${ACC}`, 'body');
  const PASS_Y = RY0 + RDY * 6 + 10;
  const passChip = el('div', 'pass', card, `left:84px;top:${PASS_Y - 26}px`); el('i', 'tick w', passChip);
  txt(passChip, 'pass', 'ui', `position:static;display:inline-block;margin-left:12px;font-size:28px;font-weight:500;color:${GROUND}`, 'body', INK_F);

  // =========== C: tries
  const L = LY.line; const pLine = el('div', 'plane', world, '');
  const lnName = txt(pLine, 'b3_name', 'ui', `left:${L.label[0]}px;top:${L.label[1]}px;font-size:30px;font-weight:500;color:${INK}`, 'body', GROUND);
  const lnVal = txt(pLine, 'b3_value', 'ui', `left:${L.label[0]}px;top:${L.label[1] + 44}px;font-size:26px;color:${INK}`, 'body', GROUND);
  const SPX = L.label[0] + 20;
  const lnRows = [
    { y: L.rows[0], a: txt(pLine, 't1', 'ui', `left:${SPX + 44}px;top:${L.rows[0] - 24}px;font-size:36px;color:${INK}`, 'body', GROUND), b: txt(pLine, 'rej', 'mono', `left:${SPX + 380}px;top:${L.rows[0] - 14}px;font-size:24px;color:${INK}`, 'label', GROUND), f: ev('reject', 't1'), kind: 'rej' },
    { y: L.rows[1], a: txt(pLine, 't2', 'ui', `left:${SPX + 44}px;top:${L.rows[1] - 24}px;font-size:36px;color:${INK}`, 'body', GROUND), b: txt(pLine, 'rej', 'mono', `left:${SPX + 380}px;top:${L.rows[1] - 14}px;font-size:24px;color:${INK}`, 'label', GROUND), f: ev('reject', 't2'), kind: 'rej' },
    { y: L.rows[2], a: txt(pLine, 'redesign', 'ui', `left:${SPX + 44}px;top:${L.rows[2] - 24}px;font-size:36px;font-weight:500;color:${INK}`, 'body', GROUND), f: ev('redesign', 'approach'), kind: 'red' },
  ];
  const nodes = [0, 1, 2, 3].map((k) => el('div', 'node ' + ['n0', 'n0', 'n2', 'n3'][k], pLine, `left:${SPX - 11}px;top:${L.rows[k] - 11}px`));
  const strikes = [0, 1].map((k) => el('div', 'hair', pLine, `left:${SPX + 44}px;top:${L.rows[k] + 2}px;height:3px;background:${INK};transform-origin:0 50%`));
  const passTxt = el('div', 'tx disp', pLine, `left:${SPX + 44}px;top:${L.rows[3] - 40}px;font-size:58px;font-weight:700;color:${INK}`, '');
  passTxt.dataset.claim = 'checks'; passTxt.dataset.role = 'body'; passTxt.dataset.bg = GROUND; passTxt.dataset.tick = '1';
  const sq = [...Array(9).keys()].map((k) => el('div', 'sq', pLine, `left:${SPX + 48 + k * 36}px;top:${L.rows[3] + 46}px`));

  // =========== D: the Meta-Prompt Atlas (real UI, client-safe rows)
  const win = el('div', 'card win', world, `width:${W.w}px;height:${W.h}px`);
  const wparts = {};
  const part = (name, x, y, w, h) => (wparts[name] = el('div', 'wpart', world, `width:${w}px;height:${h}px`), wparts[name]._p = [x, y], wparts[name]);
  // header
  const hdr = part('hdr', 0, 0, W.w, 100);
  txt(hdr, 'atlas', 'disp', `left:40px;top:24px;font-size:40px;font-weight:700;color:${INK}`, 'body');
  const NAVX = [560, 560 + 168, 560 + 168 + 160, 560 + 168 + 160 + 180];
  const NAVW = [156, 148, 168, 186];
  const pillInd = el('div', 'pillind', hdr, ``);
  const navs = ['nav1', 'nav2', 'nav3', 'nav4'].map((id, k) => {
    const p = el('div', 'navp', hdr, `left:${NAVX[k]}px;top:22px;width:${NAVW[k]}px`);
    const kb = el('div', 'kb', p, ''); const kt = txt(kb, 'k' + (k + 1), 'mono', `position:static;font-size:16px;color:inherit`, 'label');
    const lt = txt(p, id, 'mono', `position:static;margin-left:10px;font-size:20px;color:inherit`, 'label'); p._kb = kb; p._t = [kt, lt]; return p;
  });
  const hidep = el('div', 'navp out', hdr, `left:${W.w - 330}px;top:22px;width:290px`);
  { const kb = el('div', 'kb', hidep, ''); txt(kb, 'kh', 'mono', `position:static;font-size:16px;color:${INK}`, 'label'); txt(hidep, 'hide', 'mono', `position:static;margin-left:10px;font-size:19px;color:${INK}`, 'label'); }
  el('div', 'hair', hdr, `left:40px;top:96px;width:${W.w - 80}px;height:3px;background:${INK}`);
  // stats chain
  const st = part('stats', 0, 100, W.w, 140);
  const statCell = (x, nId, lId, k) => { const g = el('div', 'stat', st, `left:${x}px;top:14px`); const n = txt(g, nId, 'disp', `position:static;font-size:54px;font-weight:700;line-height:64px;color:${INK}`, 'body'); const l = txt(g, lId, 'ui', `position:static;font-size:22px;color:${INK}`, 'body'); return g; };
  const stats = [statCell(40, 'n314', 'l314'), statCell(610, 'n86', 'l86'), statCell(990, 'n11', 'l11'), statCell(1240, 'n26', 'l26')];
  const chainLab = txt(st, 'n228', 'mono', `left:316px;top:84px;font-size:17px;color:${INK}`, 'label'); // sits under the 314 -> 86 arrow
  const arrowHead = el('div', 'ahead', st, `left:572px;top:44px`);
  [950, 1200].forEach((x) => el('div', 'hair', st, `left:${x}px;top:22px;width:1px;height:96px;background:${INK};opacity:.18`));
  el('div', 'hair', st, `left:40px;top:136px;width:${W.w - 80}px;height:1px;background:${INK};opacity:.25`);
  // left column: search, chips, rows
  const lc = part('left', 0, 240, 720, 740);
  const sbox = el('div', 'search', lc, `left:40px;top:18px;width:660px;height:58px`);
  el('i', 'mag', sbox); txt(sbox, 'search', 'ui', `position:absolute;left:52px;top:14px;font-size:22px;color:${INK};opacity:.62`, 'label');
  { const kb = el('div', 'kb', sbox, `position:absolute;right:14px;top:14px`); txt(kb, 'ks', 'mono', `position:static;font-size:16px;color:${INK}`, 'label'); }
  const CH = [['ch1', 'ch1n'], ['ch2', 'ch2n'], ['ch3', 'ch3n'], ['ch4', 'ch4n'], ['ch5', 'ch5n'], ['ch6', 'ch6n']];
  const chipBox = el('div', 'chipbox', lc, `left:40px;top:96px;width:660px`);
  const chips = CH.slice(0, 4).map(([a, b], k) => { const c = el('div', 'chipx', chipBox, ''); el('i', 'sw', c, `opacity:${0.35 + 0.12 * k}`); txt(c, a, 'ui', `position:static;margin-left:8px;font-size:19px;color:${INK}`, 'label'); txt(c, b, 'mono', `position:static;margin-left:8px;font-size:16px;color:${INK}`, 'label'); return c; });
  const ROWY0 = 214, ROWH = 88;
  const rows = [0, 1, 2, 3, 4].map((k) => {
    const r = el('div', 'lrow' + (k === 4 ? ' sel' : ''), lc, `left:40px;top:${ROWY0 + k * ROWH}px;width:660px;height:${ROWH - 8}px`);
    el('i', 'rule', r, k === 4 ? `background:transparent` : `opacity:${0.4 + 0.12 * k}`);
    txt(r, `row${k}t`, 'ui ell', `left:22px;top:10px;width:560px;font-size:24px;font-weight:500;color:${INK}`, 'body');
    txt(r, `row${k}c`, 'mono', `left:600px;top:14px;font-size:18px;color:${INK}`, 'label');
    txt(r, `row${k}k`, 'mono', `left:22px;top:46px;font-size:16px;color:${INK}`, 'label');
    return r;
  });
  // right column: reader
  const rc = part('reader', 760, 240, 840, 740);
  txt(rc, 'rfam', 'mono', `left:0;top:18px;font-size:17px;font-weight:500;letter-spacing:.08em;color:${INK}`, 'label');
  { const t = el('div', 'tagx', rc, `left:250px;top:12px`); txt(t, 'row4k', 'mono', `position:static;font-size:16px;color:${INK}`, 'label'); }
  const rTitle = txt(rc, 'row4t', 'disp', `left:0;top:52px;width:840px;font-size:48px;font-weight:700;line-height:60px;color:${INK};white-space:normal`, 'body');
  const rPath = txt(rc, 'rpath', 'mono ell', `left:0;top:184px;width:840px;font-size:16px;color:${INK};opacity:.8`, 'label');
  const rFacts = txt(rc, 'rfacts', 'mono', `left:0;top:214px;font-size:17px;color:${INK}`, 'label');
  const rCopies = txt(rc, 'rcopies', 'mono', `left:380px;top:214px;font-size:17px;color:${INK}`, 'label');
  el('div', 'hair', rc, `left:0;top:252px;width:840px;height:2px;background:${INK}`);
  const rExc = el('div', 'exc', rc, `left:0;top:290px;width:840px`);
  const rExcT = txt(rExc, 'rexc3', 'mono', `position:static;font-size:24px;line-height:36px;color:${INK};white-space:normal`, 'body', '#EFEFE8');

  // =========== E: mark layer
  const markBg = el('div', 'markbg', markL, '');
  const markIn = el('div', 'markin', markL, '');
  const MARK_FONT = "400 210px 'Zen Old Mincho'";
  const word = el('div', 'tx disp', markIn, `font:${MARK_FONT};color:${GROUND};line-height:240px;white-space:pre`, '');
  word.dataset.claim = 'wordmark'; word.dataset.role = 'body'; word.dataset.bg = FINAL; word.dataset.typing = '1';
  const tag = txt(markIn, 'tagline', 'ui', `font-size:38px;color:${GROUND}`, 'body', FINAL);
  const lab = txt(markIn, 'label', 'mono', `font-size:24px;color:${ACC};letter-spacing:.04em`, 'label', FINAL);
  const glow1 = el('div', 'glow', markIn, `background:${ACC};filter:blur(28px)`);
  const glow2 = el('div', 'glow', markIn, `background:${ACC};filter:blur(90px)`);
  const mcur = el('div', 'glow', markIn, `background:${ACC}`);

  // thread svg
  const NS = 'http://www.w3.org/2000/svg';
  const path = document.createElementNS(NS, 'path'); svg.appendChild(path);
  path.setAttribute('fill', 'none'); path.setAttribute('stroke', ACC); path.setAttribute('stroke-width', '7'); // 7 px keeps a solid accent core through N=4 motion blur (G4 at full res) path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');

  // ---------- geometry
  const cardH = (f) => lerp(C.h0, C.h1, spring(seg(f, T.grow[0], T.grow[1])));
  const cpt = (lx, ly) => [C.x + lx, C.y + ly, 0];
  const winM = (dx, dy, dz) => Tm(W.x + (dx || 0), W.y + (dy || 0), dz || 0);
  const wpt = (lx, ly) => [W.x + lx, W.y + ly, 0];
  const SEAM_X = 64;
  function resample(pts, n) {
    if (pts.length === 1) return Array(n).fill(pts[0]);
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], (pts[i][2] || 0) - (pts[i - 1][2] || 0)));
    const tot = L[L.length - 1] || 1; const out = []; let j = 0;
    for (let i = 0; i < n; i++) { const s = tot * i / (n - 1); while (j < L.length - 2 && L[j + 1] < s) j++; const u = (s - L[j]) / Math.max(1e-6, L[j + 1] - L[j]); out.push([lerp(pts[j][0], pts[j + 1][0], u), lerp(pts[j][1], pts[j + 1][1], u), lerp(pts[j][2] || 0, pts[j + 1][2] || 0, u)]); }
    return out;
  }
  const morph = (a, b, u) => { const A = resample(a, 64), B = resample(b, 64); return A.map((p, i) => [lerp(p[0], B[i][0], u), lerp(p[1], B[i][1], u), lerp(p[2], B[i][2], u)]); };
  const shUnder = () => [cpt(40, 296), cpt(40 + 1340, 296)];
  function shSeam(f) {
    const pts = [cpt(SEAM_X, 250), cpt(SEAM_X, Math.max(262, Math.min(PASS_Y, cardH(f) - 70)))]; // the seam grows with the card
    for (let k = 0; k < 5; k++) { const r = ev('rule', 'r' + k); if (f < r - 6) break; const y = RY0 + RDY * k; const u = eo(seg(f, r - 6, r + 4)); pts.push(cpt(SEAM_X, y), cpt(SEAM_X + 20 * u, y), cpt(SEAM_X, y + 1)); }
    const cf = ev('rule', 'conflict'), sn = ev('snag', 'conflict');
    if (f >= cf - 6) { const y = RY0 + RDY * 5; const v = f >= sn ? 16 * Math.exp(-(f - sn) / 6) * Math.sin((f - sn) * 1.4) : 0; pts.push(cpt(SEAM_X, y - 18), cpt(SEAM_X + 14 + v, y - 6), cpt(SEAM_X - 12 - v, y + 6), cpt(SEAM_X, y + 18)); }
    const pf = ev('pass', 'verdict'); if (f >= pf - 8) { const u = eo(seg(f, pf - 8, pf + 4)); pts.push(cpt(SEAM_X, PASS_Y), cpt(lerp(SEAM_X, 84, u), PASS_Y)); }
    return pts;
  }
  function shRoute(f) {
    const pts = shSeam(f); const g = seg(f, T.lineIn[0], T.lineIn[1]);
    const passR = cpt(84 + 150, PASS_Y);
    const corner1 = [1720, C.y + PASS_Y, 0], corner2 = [1720, L.rows[0] - 60, 0], top = [SPX, L.rows[0] - 60, 0];
    const route = [passR, corner1, corner2, top];
    // grow along the route
    const seglen = []; let tot = 0; for (let i = 1; i < route.length; i++) { const l = Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]); seglen.push(l); tot += l; }
    let need = tot * eio(g); pts.push(passR);
    for (let i = 1; i < route.length && need > 0; i++) { const l = seglen[i - 1]; const u = Math.min(1, need / l); pts.push([lerp(route[i - 1][0], route[i][0], u), lerp(route[i - 1][1], route[i][1], u), 0]); need -= l; }
    if (g >= 1) { // spine to the latest row
      const rowsF = [ev('reject', 't1'), ev('reject', 't2'), ev('redesign', 'approach'), ev('check', 'chk0')];
      let yEnd = L.rows[0] - 60;
      rowsF.forEach((rf, k) => { if (f >= rf - 12) yEnd = lerp(yEnd, L.rows[k], eo(seg(f, rf - 12, rf))); });
      pts.push([SPX, yEnd, 0]);
    }
    return pts;
  }
  function shOutline(f) {
    const p = eio(seg(f, T.winIn[0], T.winIn[1]));
    const per = [wpt(0, 0), wpt(W.w, 0), wpt(W.w, W.h), wpt(0, W.h), wpt(0, 0)];
    const lens = [W.w, W.h, W.w, W.h]; let need = (2 * W.w + 2 * W.h) * p; const pts = [per[0]];
    for (let i = 1; i < per.length && need > 0; i++) { const u = Math.min(1, need / lens[i - 1]); pts.push([lerp(per[i - 1][0], per[i][0], u), lerp(per[i - 1][1], per[i][1], u), 0]); need -= lens[i - 1]; }
    return pts;
  }
  const shArrow = () => [wpt(310, 100 + 54), wpt(574, 100 + 54)];
  const shRowRule = () => [wpt(43, 240 + ROWY0 + 4 * ROWH + 10), wpt(43, 240 + ROWY0 + 4 * ROWH + ROWH - 18)];
  function readerX(f) { return lerp(760, 40, eio(seg(f, T.key2, T.key2 + 36))); }
  const shExcRule = (f) => { const x = readerX(f); return [wpt(x + 2, 240 + 290 + 6), wpt(x + 2, 240 + 290 + 74)]; };
  const shPill = (f) => { const u = eio(seg(f, T.push - 2, T.push + 8)); const y = lerp(PILL_C[1] + 14, PILL_C[1], u), w = lerp(26, 56, u); return [[PILL_C[0] - w, y, 0], [PILL_C[0] + w, y, 0]]; };
  function threadPts(f) {
    const L0 = T.lift, a86 = ev('draw', 'chain'), rr = ev('row', 'row4');
    if (f < L0 - 10) return shUnder();
    if (f < L0 + 30) return morph(shUnder(), shSeam(f), eio(seg(f, L0 - 10, L0 + 30)));
    if (f < T.lineIn[0]) return shSeam(f);
    if (f < T.winIn[0]) return shRoute(f);
    if (f < T.winIn[0] + 24) return morph(shRoute(f), shOutline(f), eio(seg(f, T.winIn[0], T.winIn[0] + 24)));
    if (f < a86 - 22) return shOutline(f);
    if (f < a86) return morph(shOutline(f), shArrow(), eio(seg(f, a86 - 22, a86)));
    if (f < rr - 14) return shArrow();
    if (f < rr + 8) return morph(shArrow(), shRowRule(), eio(seg(f, rr - 14, rr + 8)));
    if (f < T.key2) return shRowRule();
    if (f < T.key2 + 36) return morph(shRowRule(), shExcRule(f), eio(seg(f, T.key2, T.key2 + 36))); // lands as the excerpt appears
    if (f < T.quiet) return shExcRule(f);
    if (f < T.push) return morph(shExcRule(f), shPill(f), eio(seg(f, T.quiet, T.push - 4)));
    return shPill(f);
  }
  function fillet(d, rmax) {
    if (!d || d.indexOf('L') < 0) return d; rmax = rmax || 22;
    const P = d.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number); const pts = [];
    for (let i = 0; i + 1 < P.length; i += 2) { const q = [P[i], P[i + 1]]; if (!pts.length || Math.hypot(q[0] - pts[pts.length - 1][0], q[1] - pts[pts.length - 1][1]) > 0.3) pts.push(q); }
    if (pts.length < 3) return 'M' + pts.map((p) => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' L');
    let o = 'M' + pts[0][0].toFixed(2) + ' ' + pts[0][1].toFixed(2);
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], b = pts[i], c = pts[i + 1]; const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]); const r = Math.min(rmax, l1 / 2, l2 / 2);
      const p1 = [b[0] - (b[0] - a[0]) / l1 * r, b[1] - (b[1] - a[1]) / l1 * r], p2 = [b[0] + (c[0] - b[0]) / l2 * r, b[1] + (c[1] - b[1]) / l2 * r];
      o += ' L' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' Q' + b[0].toFixed(2) + ' ' + b[1].toFixed(2) + ' ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2);
    }
    const z = pts[pts.length - 1]; return o + ' L' + z[0].toFixed(2) + ' ' + z[1].toFixed(2);
  }

  // ---------- render
  function render(t) {
    const f = t * FPS, fd = Math.round(f);
    CAM = camera(f);
    M = chain(Tm(960, 540, 0), RX(CAM.rx), RY(CAM.ry), RZ(CAM.rz), Sm(CAM.zoom), Tm(-CAM.cx, -CAM.cy, 0));
    world.style.transform = css(M);
    const covered = f >= T.push && 23 * CAM.zoom > 1150;

    // ---- card (input -> brief); recedes during the tries and leaves before the Atlas
    const h = cardH(f); card.style.height = h + 'px';
    const away = seg(f, T.lineIn[0] + 10, T.winIn[0] + 30);
    setT(card, Tm(C.x - 260 * eio(away), C.y, -420 * eio(away)));
    card.style.filter = away > 0.05 ? `blur(${(4 * eio(away)).toFixed(2)}px)` : 'none';
    showC(card, f < T.winIn[0] + 34);
    const labU = eio(seg(f, ev('caption', 'Seam') - 2, ev('caption', 'Seam') + 14));
    labA.style.transform = `translateY(${-110 * labU}%)`; labB.style.transform = `translateY(${110 * (1 - labU)}%)`;
    // typing (discrete state per output frame)
    const typed = Math.min(SENT.length, SH.pre + Math.max(0, Math.floor((fd - T.type0 + 0.01) / T.step) + 1));
    const lift = T.lift;
    WORDS.forEach((w, k) => { const a = wStart[k]; const n = Math.max(0, Math.min(w.length, typed - a)); wspans[k].textContent = w.slice(0, n); wspans[k].style.visibility = f >= lift + k * 2 ? 'hidden' : 'visible'; });
    cursor.style.visibility = f < lift ? 'visible' : 'hidden';
    cursor.style.transform = `scaleY(${1 + 0.06 * Math.sin(f / 5)})`;
    show(sent, f < lift + WORDS.length * 2 + 2);
    // tiles: lift from their word in the sentence, land as the brief's header
    tileSlots = layoutTiles(); // re-measured every frame (fonts may finish loading after init)
    tiles.forEach((tl, k) => {
      const t0 = lift + k * 2, land = ev('tile', 'w' + k);
      if (f < t0 || f >= T.winIn[0] + 34) { show(tl, false); return; }
      const sp = wspans[k]; const sx = 40 + sp.offsetLeft, sy = 104 + sp.offsetTop + 8; const sw = Math.max(20, sp.offsetWidth);
      const slot = tileSlots[k]; const u = eio(seg(f, t0, land)); const s0 = sw / slot.w;
      const x = lerp(sx - 10, slot.x, u), y = lerp(sy, slot.y, u); const sc = lerp(Math.max(0.6, s0), 1, u);
      const z = Math.sin(Math.PI * u) * 90;
      show(tl, true); tl.style.width = slot.w + 'px';
      setT(tl, chain(Tm(C.x - 260 * eio(away), C.y, -420 * eio(away)), Tm(x, y, z), Sm(sc)));
      tl.style.filter = away > 0.05 ? `blur(${(4 * eio(away)).toFixed(2)}px)` : 'none';
    });
    show(briefLab, f >= ev('tile', 'w0'));
    ruleEls.forEach((r, k) => { const a = ev('rule', 'r' + k); const p = seg(f, a - 8, a + 8); show(r, f >= a - 8); r.style.transform = `translateX(${(1 - back(p)) * 40}px)`; r.style.clipPath = `inset(0 ${(1 - eo(p)) * 100}% 0 0)`; });
    { const a = ev('rule', 'conflict'), sn = ev('snag', 'conflict'); const p = seg(f, a - 8, a + 8); show(confRow, f >= a - 8); const shake = f >= sn ? 6 * Math.exp(-(f - sn) / 5) * Math.sin((f - sn) * 2.1) : 0; confRow.style.transform = `translateX(${(1 - back(p)) * 40 + shake}px)`; confRow.style.clipPath = `inset(0 ${(1 - eo(p)) * 100}% 0 0)`; }
    { const a = ev('pass', 'verdict'); const p = spring(seg(f, a - 4, a + 20)); show(passChip, f >= a - 4); passChip.style.transform = `scale(${0.7 + 0.3 * p})`; }

    // ---- tries
    const lnShow = f >= T.lineIn[0] + 6 && f < 800;
    const lnAway = seg(f, T.winIn[0], T.winIn[0] + 50);
    pLine.style.transform = `translate3d(${220 * eio(lnAway)}px,0,${-380 * eio(lnAway)}px)`;
    pLine.style.filter = lnAway > 0.05 ? `blur(${(4 * eio(lnAway)).toFixed(2)}px)` : 'none';
    showC(pLine, lnShow);
    { const a = T.lineIn[0] + 6; const p = eo(seg(f, a, a + 14)); lnName.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`; lnVal.style.clipPath = `inset(0 ${(1 - eo(seg(f, a + 4, a + 20))) * 100}% 0 0)`; }
    lnRows.forEach((r, k) => {
      const p = seg(f, r.f - 10, r.f + 6); show(r.a, f >= r.f - 10); r.a.style.clipPath = `inset(0 ${(1 - eo(p)) * 100}% 0 0)`; r.a.style.transform = `translateX(${(1 - back(p)) * 30}px)`;
      if (r.b) { const q = seg(f, r.f + 4, r.f + 16); show(r.b, f >= r.f + 4); r.b.style.clipPath = `inset(0 ${(1 - eo(q)) * 100}% 0 0)`; }
      if (k < 2) { const w = measure("400 36px 'Zen Kaku Gothic New'", r.a.textContent); strikes[k].style.width = w + 'px'; strikes[k].style.transform = `scaleX(${eo(seg(f, r.f + 2, r.f + 14))})`; show(strikes[k], f >= r.f + 2); }
    });
    const nodeF = [ev('reject', 't1'), ev('reject', 't2'), ev('redesign', 'approach'), ev('check', 'chk0')];
    nodes.forEach((n, k) => { const p = spring(seg(f, nodeF[k] - 4, nodeF[k] + 16)); show(n, f >= nodeF[k] - 4); n.style.transform = `scale(${Math.max(0.01, p)})`; });
    let nck = 0; sq.forEach((s, k) => { const a = ev('check', 'chk' + k); const on = fd >= a; if (on) nck++; show(s, f >= nodeF[3] - 4); s.style.background = on ? ACC : 'transparent'; s.style.borderColor = on ? ACC : INK; s.style.transform = on ? `scale(${1 + 0.25 * Math.exp(-(f - a) / 4)})` : 'none'; });
    passTxt.textContent = nck > 0 ? `${nck} of 9 checks passed` : ''; show(passTxt, nck > 0);

    // ---- the Atlas
    const wa = seg(f, T.winIn[0], T.winIn[1]);
    show(win, f >= T.winIn[0] + 10); { const p = spring(seg(f, T.winIn[0] + 10, T.winIn[1] + 6)); setT(win, chain(winM(0, 0, -240 * (1 - p)))); win.style.opacity = '1'; }
    const PARTS = [['hdr', ev('click', 'header'), [0, -140, 260]], ['stats', ev('stat', 'n314') - 6, [0, -80, 200]], ['left', ev('click', 'search'), [-160, 60, 220]], ['reader', ev('click', 'reader'), [180, 40, 240]]];
    PARTS.forEach(([n, a, off]) => { const pE = wparts[n]; const p = spring(seg(f, a - 14, a + 14)); showC(pE, f >= a - 14); setT(pE, chain(winM(pE._p[0] + off[0] * (1 - p), pE._p[1] + off[1] * (1 - p), 3 + off[2] * (1 - p)))); });
    // stats chain
    const statF = [ev('stat', 'n314'), ev('stat', 'n86'), ev('stat', 'n11'), ev('stat', 'n26')];
    stats.forEach((s, k) => { const p = seg(f, statF[k] - 6, statF[k] + 8); show(s, f >= statF[k] - 6); s.style.clipPath = `inset(0 ${(1 - eo(p)) * 100}% 0 0)`; s.style.transform = `translateY(${(1 - back(p)) * 14}px)`; });
    { const a = ev('draw', 'chain'); show(chainLab, f >= a + 6); chainLab.style.clipPath = `inset(0 ${(1 - eo(seg(f, a + 6, a + 20))) * 100}% 0 0)`; show(arrowHead, f >= a && f < ev('row', 'row4') - 14); arrowHead.style.transform = `scale(${spring(seg(f, a, a + 14))})`; }
    chips.forEach((c, k) => { const a = ev('chip', 'ch' + k); const p = spring(seg(f, a - 6, a + 14)); show(c, f >= a - 6); c.style.transform = `translateY(${(1 - p) * 18}px) scale(${0.9 + 0.1 * p})`; });
    rows.forEach((r, k) => { const a = ev('row', 'row' + k); const p = seg(f, a - 8, a + 10); show(r, f >= a - 8); r.style.transform = `translateY(${(1 - back(p)) * 40}px)`; r.style.clipPath = `inset(0 0 ${(1 - eo(p)) * 100}% 0)`; });
    // Reader view on key 2: left column slides out, reader takes the full width
    const rk = eio(seg(f, T.key2, T.key2 + 36));
    lc.style.clipPath = `inset(0 0 0 ${rk * 100}%)`; lc.style.translate = `${-720 * rk}px 0`; showC(lc, rk < 0.999 && f >= ev('click', 'search') - 14);
    showC(rExc, rk > 0.6); // the excerpt belongs to the Reader view
    { const x = readerX(f); const pR = wparts.reader; const a = ev('click', 'reader'); const p = spring(seg(f, a - 14, a + 14)); setT(pR, chain(winM(x + 180 * (1 - p), 240 + 40 * (1 - p), 3 + 240 * (1 - p))));
      // Reader view: text keeps its measure (no reflow); facts move into a right-hand column
      rFacts.style.translate = `${920 * rk}px ${-120 * rk}px`; rCopies.style.translate = `${540 * rk}px ${-80 * rk}px`; }
    // nav: active pill slides from Library to Reader on key 2; it is the dark object the camera later enters
    { const k = rk; const x = lerp(NAVX[0], NAVX[1], k), w = lerp(NAVW[0], NAVW[1], k); pillInd.style.left = x + 'px'; pillInd.style.width = w + 'px';
      const lab2 = seg(f, T.push - 2, T.push + 8); navs[1].style.clipPath = lab2 > 0 ? `inset(${(eio(lab2) * 100).toFixed(1)}% 0 0 0)` : 'none'; navs[1].style.translate = `0 ${(-30 * eio(lab2)).toFixed(2)}px`;
      navs.forEach((p, i) => { const act = i === (k > 0.5 ? 1 : 0); p.style.color = act ? GROUND : INK; p._kb.style.borderColor = act ? GROUND : INK; p._t.forEach((tt) => (tt.dataset.bg = act ? FINAL : CARD)); }); }

    // ---- thread
    let d = '', tw = 7;
    if (!covered) {
      const pts = threadPts(f); const scr = pts.map((p) => project(p));
      d = 'M' + scr.map((q) => q[0].toFixed(2) + ' ' + q[1].toFixed(2)).join(' L');
      // the thread widens with its own screen speed so its core survives N-sample motion blur (G4)
      const Msave = M; const c2 = camera(f + 0.5); M = chain(Tm(960, 540, 0), RX(c2.rx), RY(c2.ry), RZ(c2.rz), Sm(c2.zoom), Tm(-c2.cx, -c2.cy, 0));
      const n2 = resample(threadPts(f + 0.5), 16).map((p) => project(p)); M = Msave;
      const n1 = resample(pts, 16).map((p) => project(p));
      let sp = 0; n1.forEach((q, i) => { sp = Math.max(sp, Math.hypot(n2[i][0] - q[0], n2[i][1] - q[1]) * 2); });
      tw = Math.min(22, 7 + 0.45 * sp);
    }

    // ---- mark layer
    markL.style.visibility = covered ? 'visible' : 'hidden'; world.style.visibility = covered ? 'hidden' : 'visible';
    if (covered) {
      const fe = f - T.pushEnd; const ms = 1 + Math.max(0, fe) * 0.00034;
      markIn.style.transform = `perspective(1600px) translate(960px,540px) rotateY(${(-3 + fe * 0.03).toFixed(4)}deg) rotateX(${(1.2 - fe * 0.006).toFixed(4)}deg) scale(${ms.toFixed(5)}) translate(-960px,-540px) translateX(${(-fe * 0.45).toFixed(3)}px)`;
      const WL = 960 - 290, WY = 330; const st = ev('stand', 'cursor'), k0 = T.markType0;
      const nm = Math.max(0, Math.min(4, Math.floor((fd - k0 + 0.01) / T.markStep) + 1));
      word.textContent = 'CETI'.slice(0, nm); word.style.left = WL + 'px'; word.style.top = WY + 'px'; show(word, nm > 0);
      const cw = nm ? measure(MARK_FONT, 'CETI'.slice(0, nm)) : 0; const cxx = WL + cw + 22, cyy = WY + 128, CHh = 168;
      let gx = cxx, gy = cyy;
      if (f < st) {
        const r = eio(seg(f, T.pushEnd - 8, st - 8)); const a = rad(90 * eo(seg(f, st - 18, st)));
        const len = lerp(1300, CHh, r); const hx = lerp(960, cxx, eio(seg(f, T.pushEnd - 8, st - 4))), hy = lerp(560, cyy, eio(seg(f, T.pushEnd - 8, st - 4))); gx = hx; gy = hy;
        const x0 = hx - Math.cos(a) * len * (a > 0 ? 0.5 : 1), y0 = hy - Math.sin(a) * len * 0.5, x1 = a > 0 ? hx + Math.cos(a) * len * 0.5 : hx, y1 = hy + Math.sin(a) * len * 0.5;
        d = `M${x0.toFixed(2)} ${y0.toFixed(2)} L${x1.toFixed(2)} ${y1.toFixed(2)}`; show(mcur, false);
      } else {
        d = ''; const ph = ((f - st) % 30) / 30; const pulse = 1 + 0.05 * Math.exp(-ph * 6) + 0.025 * Math.sin(f / 6);
        show(mcur, true); mcur.style.left = (cxx - 6) + 'px'; mcur.style.top = (cyy - CHh / 2) + 'px'; mcur.style.width = '12px'; mcur.style.height = CHh + 'px'; mcur.style.transform = `scaleY(${pulse})`;
      }
      const mk = ev('mark', 'CETI'); const g = seg(f, mk - 4, mk + 30);
      [glow1, glow2].forEach((gl, k) => { const u = eio(seg(f, st - 10, st + 6)); const w = lerp(k ? 150 : 70, k ? 60 : 24, u), hh = lerp(k ? 150 : 70, CHh + (k ? 40 : 8), u); const breathe = 0.76 + 0.24 * Math.sin(f / 3.2 + k * 1.3);
        show(gl, true); gl.style.left = (gx - w / 2) + 'px'; gl.style.top = (gy - hh / 2) + 'px'; gl.style.width = w + 'px'; gl.style.height = hh + 'px'; gl.style.borderRadius = lerp(50, 6, u) + (u < 1 ? '%' : 'px');
        gl.style.opacity = String((k ? 0.30 : 0.55) * (f < st ? 0.7 * breathe : (0.35 + 0.65 * eo(g)) * (0.94 + 0.06 * Math.sin(f / 5)))); });
      const tg = ev('tagline', 'tagline'), lb = ev('label', 'preview');
      tag.style.left = (WL + 8) + 'px'; tag.style.top = (WY + 266) + 'px'; show(tag, f >= tg - 2); tag.style.clipPath = `inset(0 ${(1 - eo(seg(f, tg - 2, tg + 16))) * 100}% 0 0)`;
      lab.style.left = (WL + 10) + 'px'; lab.style.top = (WY + 338) + 'px'; show(lab, f >= lb - 2); lab.style.clipPath = `inset(0 ${(1 - eo(seg(f, lb - 2, lb + 12))) * 100}% 0 0)`;
    }
    d = covered ? d : fillet(d, 18);
    path.setAttribute('d', d || 'M0 0'); path.style.visibility = d ? 'visible' : 'hidden'; path.setAttribute('stroke-width', covered ? '9' : tw.toFixed(2));
  }

  function textAudit() {
    const out = []; let idx = 0;
    for (const e of document.querySelectorAll('.tx')) {
      idx++; let vis = true, op = 1, blur = 0; let n = e;
      while (n && n !== document.body) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') vis = false; op *= +cs.opacity; const m = /blur\(([\d.]+)px\)/.exec(cs.filter); if (m) blur += +m[1]; if (cs.clipPath && /inset\(([^)]*)\)/.test(cs.clipPath) && n !== e) { const v = /inset\(([^)]*)\)/.exec(cs.clipPath)[1]; if (/[1-9]\d*(\.\d+)?%/.test(v)) e.dataset.pclip = '1'; else delete e.dataset.pclip; } n = n.parentElement; }
      const text = e.textContent.trim(); if (!vis || !text) continue;
      const r = e.getBoundingClientRect(); if (r.right < 0 || r.left > 1920 || r.bottom < 0 || r.top > 1080 || r.width < 1) continue;
      const cs = getComputedStyle(e); const fs = parseFloat(cs.fontSize); const scale = r.height / Math.max(1, e.offsetHeight);
      const clip = (cs.clipPath && cs.clipPath !== 'none' ? cs.clipPath : '') + (e.dataset.pclip ? ' inset(0 10% 0 0)' : '');
      out.push({ i: idx, text, claim: e.dataset.claim, tick: !!e.dataset.tick, typing: !!e.dataset.typing, word: !!e.dataset.word, role: e.dataset.role, bg: e.dataset.bg, color: cs.color, op, blur, fs, px: fs * scale, clip, x: r.left, y: r.top, w: r.width, h: r.height });
    }
    return out;
  }
  window.__film = { render, textAudit, frames: SH.frames, fps: FPS };
})();
