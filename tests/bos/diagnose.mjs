// Diagnosis keterlihatan bos (B1, B2): tiap bos di tiap dunia pada jarak 50, 150, 400, 1200 dari kamera
// pemain, dengan dan tanpa bloom (kualitas Tinggi) dan kualitas Rendah. Memakai hook debug.bossProbe
// (render dua kali, dengan dan tanpa bos, lalu hitung piksel yang berbeda). Hasil ke docs/bos/data/.
// Pemakaian: node tests/bos/diagnose.mjs <label> [--shots] [--quick]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const SHOTS = argv.includes('--shots'), QUICK = argv.includes('--quick');
const PORT = Number(process.env.PERF_PORT || 4191);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/bos/data/', import.meta.url));
const SHOT_DIR = fileURLToPath(new URL(`../../docs/bos/screenshots/${label}/`, import.meta.url));
mkdirSync(OUT, { recursive: true });
if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });

const WORLDS = QUICK ? ['earth', 'saturnus', 'pluto'] : ['earth', 'merkurius', 'venus', 'bumi', 'mars', 'sabuk', 'jupiter', 'saturnus', 'uranus', 'neptunus', 'pluto', 'kuiper'];
const BOSSES = ['raksasa', 'miner', 'hunter', 'naga'];
const DISTS = [50, 150, 400, 1200];
const SHOT_WORLDS = ['earth', 'saturnus', 'pluto'];
const rows = [];

async function open(quality, world) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ } });
  await page.goto(`http://localhost:${PORT}/index.html?debug=1&kualitas=${quality}`);
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate((w) => {
    const g = window.__game, d = g.debug;
    g.setSeed(4242); d.setEnemiesEnabled(false); d.setGod(true);
    d.setSetting('tutorialDone', true);
    if (w === 'earth') g.startIn('earth'); else { d.setArea(w); g.startIn('space', 'free'); }
    g.skipTransition(); d.skipCutscene?.();
    // Jelajah Bebas selalu mulai di area bumi: pindahkan pemain ke pose awal area yang diuji
    if (w !== 'earth') { d.setArea(w); d.viewArea(w); }
  }, world);
  await page.waitForTimeout(900);
  return page;
}

try {
  for (const quality of QUICK ? ['tinggi'] : ['tinggi', 'rendah']) for (const world of WORLDS) {
    const page = await open(quality, world);
    for (const kind of BOSSES) {
      for (const dist of DISTS) {
        for (const bloom of quality === 'tinggi' ? [true, false] : [false]) {
          const r = await page.evaluate(([kind, dist, bloom]) => window.__game.debug.bossProbe({ kind, dist, bloom }), [kind, dist, bloom]);
          if (!r) { console.log('gagal', quality, world, kind, dist); continue; }
          rows.push({ quality, world, ...r });
          if (SHOTS ? (quality === 'tinggi' ? (bloom ? (SHOT_WORLDS.includes(world) ? (dist === 400 || dist === 1200) : false) : false) : false) : false) {
            await page.waitForTimeout(60);
            await page.evaluate(([kind, dist]) => window.__game.debug.bossProbe({ kind, dist, bloom: true }), [kind, dist]);
            await page.screenshot({ path: `${SHOT_DIR}${kind}-${world}-${dist}.jpg`, type: 'jpeg', quality: 70 });
          }
        }
      }
      console.log(quality, world, kind, rows.slice(-DISTS.length * (quality === 'tinggi' ? 2 : 1)).map((x) => `${x.dist}${x.bloom ? 'b' : ''}:${x.pixels}px/${x.meanContrast}`).join(' '));
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT}probe-${label}.json`, JSON.stringify(rows, null, 1) + '\n');
console.log('tersimpan', rows.length, 'baris');
