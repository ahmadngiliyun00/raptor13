// Anggaran performa dengan bos aktif (B9): frame time, kerja JS per frame, draw call, segitiga, dan program
// shader, tanpa bos dan dengan tiap bos, di medan Bumi dan Saturnus, kualitas Tinggi dan Rendah, batas 60 FPS.
// Pemakaian: [PERF_SITE=<folder>] node tests/bos/perf.mjs <label>
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const label = process.argv[2] || 'run';
const PORT = Number(process.env.PERF_PORT || 4206);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/bos/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const rows = [];
try {
  for (const quality of ['tinggi', 'rendah']) for (const world of ['earth', 'saturnus']) for (const kind of ['none', 'raksasa', 'miner', 'hunter', 'naga']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ } });
    await page.goto(`http://localhost:${PORT}/index.html?` + new URLSearchParams({ debug: '1', kualitas: quality }));
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate(([w, k]) => { const g = window.__game, d = g.debug; g.setSeed(4242); d.setEnemiesEnabled(false); d.setGod(true); d.setSetting('tutorialDone', true); d.setSetting('fpsCap', '60');
      if (w === 'earth') g.startIn('earth'); else { d.setArea(w); g.startIn('space', 'free'); } g.skipTransition(); if (w !== 'earth') d.viewArea(w); d.setAutoplay(true);
      if (k !== 'none') { d.startBoss(k); d.skipCutscene(); } }, [world, kind]);
    await page.waitForTimeout(6500);
    const p = await page.evaluate(() => window.__game.debug.perf());
    const r = { quality, world, kind, frameAvgMs: p.frameAvgMs, frameP95Ms: p.frameP95Ms, workAvgMs: p.workAvgMs, workP95Ms: p.workP95Ms, calls: p.calls, triangles: p.triangles, programs: p.programs };
    rows.push(r); console.log(JSON.stringify(r));
    await page.close();
  }
} finally { await browser.close(); server.kill(); }
writeFileSync(`${OUT}perf-${label}.json`, JSON.stringify(rows, null, 1) + '\n');
