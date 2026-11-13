// Reproduksi kotak hitam berkedip (A7): menjalankan menu (dan transisi lain) dengan debug.glitchProbe
// yang membaca kembali tiap frame, lalu mencatat frame bermasalah per 1000 frame, piksel NaN di gambar
// scene, dan objek bermatriks non-finite.
// Pemakaian: node tests/perf/glitch.mjs <label> [--frames=300] [--sizes=1440x900,844x390] [--dprs=1,2,3]
//            [--scenes=menu,start,hangar,terrain,quality] [--off=bloom,blackhole,...]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const FRAMES = Number(opt.frames || 300);
const SIZES = String(opt.sizes || '1440x900,844x390').split(',').map((s) => s.split('x').map(Number));
const DPRS = String(opt.dprs || '1,2,3').split(',').map(Number);
const SCENES = String(opt.scenes || 'menu').split(',');
const OFF = opt.off ? String(opt.off).split(',') : [];
const PORT = Number(process.env.PERF_PORT || 4183);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT_DIR = fileURLToPath(new URL('../../docs/audit/data/', import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const results = [];

// Tunggu sampai probe mengumpulkan n frame
const collect = async (page, n) => {
  await page.waitForFunction((k) => window.__game.debug.glitchProbe('report').frames >= k, n, { timeout: 180000, polling: 250 });
};

try {
  for (const [w, h] of SIZES) for (const dpr of DPRS) for (const scene of SCENES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));
    const q = new URLSearchParams({ debug: '1' });
    await page.goto(`http://localhost:${PORT}/index.html?${q}`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate(() => window.__game.debug.ignoreBattery?.(true));
    const lost = await page.evaluate(() => { window.__lost = 0; document.querySelector('canvas').addEventListener('webglcontextlost', () => { window.__lost++; }); return 0; });
    if (OFF.length) await page.evaluate((list) => { for (const f of list) window.__game.debug.feature?.(f, false); }, OFF);
    await page.keyboard.press('Shift');
    await page.evaluate(() => window.__game.debug.glitchProbe('start', { nanEvery: 10, shots: 6 }));
    if (scene === 'menu') {
      await collect(page, FRAMES);
    } else if (scene === 'start') {
      // Menu ke gameplay lewat alur nyata (transisi kamera dan pudar menu)
      await collect(page, 30);
      await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.startIn('space', 'free'); });
      await collect(page, FRAMES);
    } else if (scene === 'hangar') {
      await page.click('#btn-hangar').catch(() => {});
      for (let i = 0; i < 6; i++) { await page.click('#hangar-next').catch(() => {}); await page.waitForTimeout(250); }
      await page.keyboard.press('Escape');
      await collect(page, FRAMES);
    } else if (scene === 'terrain') {
      await page.evaluate(() => window.__game.debug.setTerrain?.('earth'));
      await collect(page, Math.floor(FRAMES / 2));
      await page.evaluate(() => window.__game.debug.setTerrain?.('space'));
      await collect(page, FRAMES);
    } else if (scene === 'quality') {
      for (const m of ['hemat', 'seimbang', 'kualitas', 'otomatis']) { await page.evaluate((v) => window.__game.debug.setPerfMode?.(v), m); await page.waitForTimeout(600); }
      await collect(page, FRAMES);
    }
    const rep = await page.evaluate(() => window.__game.debug.glitchProbe('stop'));
    const perf = await page.evaluate(() => window.__game.debug.perf());
    const lostN = await page.evaluate(() => window.__lost);
    if (rep.shots?.length) { const dir = `${OUT_DIR}glitch-shots/`; mkdirSync(dir, { recursive: true }); rep.shots.forEach((d, i) => writeFileSync(`${dir}${label}-${scene}-${w}x${h}-dpr${dpr}-${i}.png`, Buffer.from(d.split(',')[1], 'base64'))); }
    results.push({ size: `${w}x${h}`, dpr, scene, off: OFF, frames: rep.frames, flaggedFrames: rep.flaggedFrames, per1000: rep.per1000,
      nanScans: rep.nanScans, nanScansWithNaN: rep.nanScansWithNaN, nonFiniteObjects: rep.nonFiniteObjects, contextLost: lostN,
      bloom: perf.bloom, pixelRatio: perf.pixelRatio, world: perf.world, errors: errors.slice(0, 5), sample: rep.log.slice(0, 8).map((e) => ({ ...e, shot: undefined, shotIndex: e.shot })) });
    const r = results[results.length - 1];
    process.stderr.write(`${scene} ${w}x${h} dpr${dpr}: ${r.flaggedFrames}/${r.frames} frame bermasalah (${r.per1000} per 1000), NaN di ${r.nanScansWithNaN}/${r.nanScans} pindaian, objek non-finite ${r.nonFiniteObjects}, konteks hilang ${lostN}, bloom ${r.bloom}\n`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT_DIR}glitch-${label}.json`, JSON.stringify(results, null, 2) + '\n');
