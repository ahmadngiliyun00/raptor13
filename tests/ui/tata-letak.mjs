// Ukur tata letak HUD mode HP (C2) di matriks layar: luas UI saat idle (persen layar), posisi TEMBAK, jarak
// TEMBAK dari tepi bawah, lebar dan tinggi busur, skala kontrol efektif, dan tumpang tindih area sentuh, dengan
// 0 dan 3 slot peralatan; screenshot ke docs/screenshots/c-update/.
// Pemakaian: node tests/ui/tata-letak.mjs [--shots]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHOTS = process.argv.includes('--shots');
const PORT = Number(process.env.PERF_PORT || 4198);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DIR = fileURLToPath(new URL('../../docs/screenshots/c-update/', import.meta.url));
if (SHOTS) mkdirSync(DIR, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const MATRIX = [[568, 320, ''], [568, 320, 'safearea=47,0,47,21'], [667, 375, ''], [740, 360, ''], [812, 375, ''], [844, 390, ''], [915, 412, ''], [932, 430, '']];
console.log('| Layar | Slot | Skala | Luas UI idle | TEMBAK (x, y) | Jarak bawah TEMBAK | Lebar busur | Tinggi busur | Tumpang tindih |');
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const [w, h, q] of MATRIX) {
  for (const eq of [0, 3]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    await page.addInitScript(() => { localStorage.setItem('raptor13.v3', JSON.stringify({ version: 3, settings: { tutorialDone: true, touchPromptShown: true, controlMode: 'hp', flashWarned: true } })); });
    await page.goto(`http://localhost:${PORT}/index.html?debug=1&${q}`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate((eq) => { const g = window.__game, d = g.debug; d.setEnemiesEnabled(false); d.setGod(true); g.startIn('space', 'campaign'); g.skipTransition(); d.skipCutscene(); d.autoContract(); d.setEquipSlots(eq); }, eq);
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => {
      const W = innerWidth, H = innerHeight;
      const shown = (el) => { for (let e = el; e ? e !== document.body : false; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' ? true : cs.visibility === 'hidden') return false; } const b = el.getBoundingClientRect(); return b.width > 1 ? b.height > 1 : false; };
      let a = 0;
      for (const q of ['#hpx-status', '#hpx-top', '#toolbar .tool', '#radar', '#btn-radar-map', '#touch .tbtn', '#joy', '#dpad']) for (const el of document.querySelectorAll(q)) if (shown(el)) { const b = el.getBoundingClientRect(); a += b.width * b.height; }
      return { area: a / (W * H), L: window.__game.debug.hudLayout(), hits: window.__game.debug.layoutOverlaps().hits.length };
    });
    const pc = (v) => (v * 100).toFixed(1).replace('.', ',') + ' persen';
    console.log(`| ${w}x${h}${q ? ' berponi' : ''} | ${eq} | ${String(r.L.scale).replace('.', ',')} | ${pc(r.area)} | ${pc(r.L.fire.x)}, ${pc(r.L.fire.y)} | ${pc(r.L.fireBottomGap)} | ${pc(r.L.width)} | ${pc(r.L.height)} | ${r.hits} |`);
    if (SHOTS ? (eq === 3 ? true : (w === 844 ? !q : false)) : false) await page.screenshot({ path: `${DIR}hp-${w}x${h}${q ? '-poni' : ''}-slot${eq}.jpg`, type: 'jpeg', quality: 72 });
    await page.close();
  }
}
await browser.close(); server.kill();
