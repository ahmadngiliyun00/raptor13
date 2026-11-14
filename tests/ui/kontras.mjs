// Ukur kontras tombol mode HP dari piksel screenshot nyata (C1). Tiap skenario: dunia dan posisi kamera,
// screenshot 844x390, lalu untuk tombol TEMBAK, NITRO, ULTIMATE, manuver Gulung, dan dasar joystick dihitung:
// luminans relatif pelat (cincin dalam di sekitar ikon), ikon (piksel paling kontras di tengah), dan latar
// (cincin tepat di luar tombol). Rasio kontras WCAG: (L1 + 0,05) / (L2 + 0,05).
// Pemakaian: node tests/ui/kontras.mjs <label>   (PERF_SITE=<folder> untuk mengukur salinan lain, misalnya versi lama)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const label = process.argv[2] || 'run';
const PORT = Number(process.env.PERF_PORT || 4195);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/ui/data/', import.meta.url));
const SHOTS = fileURLToPath(new URL(`../../docs/ui/screenshots/${label}/`, import.meta.url));
mkdirSync(OUT, { recursive: true }); mkdirSync(SHOTS, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });

// [nama, dunia atau area, pengaturan posisi]
const SCENES = [
  ['Bumi siang', 'earth', null],
  ['Bumi menunduk ke medan', 'earth', { pitch: -0.5 }],
  ['Bumi di dalam awan', 'earth', { y: 236 }],
  ['Merkurius', 'merkurius', null], ['Venus', 'venus', null], ['Mars', 'mars', null], ['Jupiter', 'jupiter', null],
  ['Saturnus', 'saturnus', null], ['Pluto', 'pluto', null], ['Jelajah Bebas (sabuk)', 'sabuk', null],
  ['Venus dekat (planet memenuhi layar)', 'venus', { body: 'venus', dist: 1.25 }],
  ['Jupiter dekat', 'jupiter', { body: 'jupiter', dist: 1.3 }],
  ['Dekat Matahari', 'merkurius', { body: 'matahari', dist: 1.6 }],
];
const BTNS = { tembak: '#touch .t-fire', nitro: '#touch .t-nitro', ultimate: '#touch .t-ult', gulung: '#touch .t-roll', joystick: '#joy .joy-base' };
const rows = [];
const helper = await browser.newPage();
await helper.setContent('<canvas id="c"></canvas>');
for (const [name, world, pose] of SCENES) {
  const page = await browser.newPage({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  await page.addInitScript(() => {
    const k = 'raptor13.v3', d = JSON.parse(localStorage.getItem(k) || '{}');
    d.version = 3; d.settings = Object.assign(d.settings || {}, { tutorialDone: true, touchPromptShown: true, a2hsHintShown: true, controlMode: 'hp', flashWarned: true });
    localStorage.setItem(k, JSON.stringify(d));
  });
  await page.goto(`http://localhost:${PORT}/index.html?debug=1&kualitas=sedang`);
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate(([w, pose]) => {
    const g = window.__game, d = g.debug;
    g.setSeed(4242); d.setEnemiesEnabled(false); d.setGod(true);
    if (w === 'earth') g.startIn('earth'); else { d.setArea(w); g.startIn('space', 'free'); }
    g.skipTransition(); d.skipCutscene?.();
    if (w !== 'earth') d.viewArea(w);
    if (pose?.body) d.viewBody(pose.body, pose.dist, 0.9, 0.05);
    if (pose?.y) d.setPlayerState({ y: pose.y });
    if (pose?.pitch) { const s = g.snapshot(); d.setPlayerState({ yaw: s.yaw, pitch: pose.pitch }); }
  }, [world, pose]);
  // UIC_FORCE=pbo: kalibrasi dengan pembacaan piksel nyata, untuk dibandingkan dengan heuristik (metode utama)
  if (process.env.UIC_FORCE) await page.evaluate((f) => window.__game.debug.uiContrast?.(f), process.env.UIC_FORCE);
  await page.waitForTimeout(3500);   // penghalusan setelah teleport (sekitar 2,5 detik) dan transisi 400 ms selesai
  const rects = await page.evaluate((B) => { const o = {}; for (const [k, sel] of Object.entries(B)) { const el = document.querySelector(sel); if (!el) continue; const r = el.getBoundingClientRect(); if (r.width > 0) o[k] = { x: r.left, y: r.top, w: r.width, h: r.height, sq: getComputedStyle(el).borderTopLeftRadius !== '50%' }; } return o; }, BTNS);
  const ui = await page.evaluate(() => (window.__game.debug.uiContrast ? window.__game.debug.uiContrast() : null));
  // Dua screenshot berpasangan dengan dunia dibekukan: dengan kontrol sentuh, lalu tanpa kontrol (latar asli di balik tiap piksel)
  await page.evaluate(() => window.__game.debug.freeze?.(true));
  await page.waitForTimeout(150);
  const png = await page.screenshot();
  const jpg = await page.screenshot({ type: 'jpeg', quality: 72 });
  await page.evaluate(() => { document.getElementById('touch').style.visibility = 'hidden'; });
  await page.waitForTimeout(150);
  const bgPng = await page.screenshot();
  const file = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  writeFileSync(SHOTS + file + '.jpg', jpg);
  const m = await helper.evaluate(async ([b64, bg64, rects]) => {
    const load = async (src) => { const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); return { w: img.width, h: img.height, d: x.getImageData(0, 0, img.width, img.height).data }; };
    const A = await load(b64), B = await load(bg64);
    const sx = A.w / 844;
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const L = (D, i) => 0.2126 * lin(D[i]) + 0.7152 * lin(D[i + 1]) + 0.0722 * lin(D[i + 2]);
    const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const med = (a) => { a.sort((p, q) => p - q); return a.length ? a[a.length >> 1] : 0; };
    const pct = (a, q) => { a.sort((p, r) => p - r); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * q))] : 0; };
    // Jarak bertanda kotak bersudut membulat (radius sudut 30 persen sisi = 0,6 R), bernilai R tepat di tepi
    const rbox = (x, y, R) => { const rc = 0.6 * R, qx = Math.abs(x) - (R - rc), qy = Math.abs(y) - (R - rc); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rc + R; };
    const out = {};
    for (const [k, r] of Object.entries(rects)) {
      const cx = (r.x + r.w / 2) * sx, cy = (r.y + r.h / 2) * sx, R = r.w / 2 * sx;
      const plate = [], plateBg = [], center = [], edge = [], edgeOut = [], bgs = [];
      for (let yy = Math.floor(cy - R - 4 * sx); yy <= cy + R + 4 * sx; yy++) for (let xx = Math.floor(cx - R - 4 * sx); xx <= cx + R + 4 * sx; xx++) {
        if (xx < 0 ? true : (yy < 0 ? true : (xx >= A.w ? true : yy >= A.h))) continue;
        const d = (rects[k].sq ? rbox(xx - cx, yy - cy, R) : Math.hypot(xx - cx, yy - cy)) / R, i = (yy * A.w + xx) * 4;
        const la = L(A.d, i), lb = L(B.d, i);
        if (d < 0.5) center.push(la);
        else if (d > 0.62 ? d < 0.8 : false) { plate.push(la); plateBg.push(ratio(la, lb)); bgs.push(lb); }
        // Tepi dalam (garis tepi terang) dan tepi luar (garis bayangan gelap), masing-masing pita 1,3 px tanpa piksel peralihan terhadap latar di piksel yang sama
        else if (d > 1 - 1.6 * sx / R ? d <= 1 - 0.3 * sx / R : false) edge.push(ratio(la, lb));
        else if (d > 1 + 0.3 * sx / R ? d < 1 + 1.7 * sx / R : false) edgeOut.push(ratio(la, lb));
      }
      const lp = med(plate);
      const diffs = center.map((v) => [Math.abs(v - lp), v]).sort((p, q) => p[0] - q[0]);
      const li = diffs.length ? diffs[Math.floor(diffs.length * 0.95)][1] : lp;
      out[k] = { plate: +lp.toFixed(3), bg: +med(bgs).toFixed(3), icon: +li.toFixed(3), iconPlate: +ratio(li, lp).toFixed(2), plateBg: +med(plateBg).toFixed(2), edgeIn: +med(edge.slice()).toFixed(2), edgeOutBg: +med(edgeOut.slice()).toFixed(2), edgeBg: +Math.max(med(edge), med(edgeOut)).toFixed(2) };
    }
    return out;
  }, [png.toString('base64'), bgPng.toString('base64'), rects]);
  rows.push({ scene: name, world, ui, buttons: m });
  const mins = Object.values(m);
  console.log(name.padEnd(36), (ui ? ui.method + ' ' + JSON.stringify(ui.mode) : '-').padEnd(60), 'ikon/pelat min', Math.min(...mins.filter((v, i) => Object.keys(m)[i] !== 'joystick').map((v) => v.iconPlate)).toFixed(2), 'tepi/latar min', Math.min(...mins.map((v) => v.edgeBg)).toFixed(2), 'pelat/latar min', Math.min(...mins.map((v) => v.plateBg)).toFixed(2));
  await page.close();
}
writeFileSync(OUT + `kontras-${label}.json`, JSON.stringify(rows, null, 1));
console.log('tersimpan', rows.length, 'skenario');
await browser.close(); server.kill();
