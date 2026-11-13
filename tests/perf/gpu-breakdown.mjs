// Pemecahan biaya frame per fitur (A1 butir 4): Chromium tanpa batas frame (frame dibatasi GPU bila GPU
// sibuk), matikan satu fitur dalam satu waktu lewat debug.feature, catat selisih frame time.
// Pemakaian: node tests/perf/gpu-breakdown.mjs <label> [--scenes=menu,space,earth] [--dpr=2] [--secs=6]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const SCENES = String(opt.scenes || 'menu,space,earth').split(',');
const DPR = Number(opt.dpr || 2);
const SECS = Number(opt.secs || 6);
const PORT = Number(process.env.PERF_PORT || 4184);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT_DIR = fileURLToPath(new URL('../../docs/audit/data/', import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const FEATURES = {
  menu: ['bloom', 'nebula', 'milky', 'galaxies', 'blackhole', 'stars', 'planets', 'shadows', 'particles', 'css'],
  space: ['bloom', 'nebula', 'milky', 'galaxies', 'blackhole', 'stars', 'planets', 'shadows', 'particles', 'css'],
  earth: ['shadows', 'clouds', 'particles', 'skyEarth', 'css'],
};

const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: [...gpuArgs, '--disable-frame-rate-limit', '--disable-gpu-vsync'] });
const out = {};
const window_ = async (page) => {
  await page.waitForTimeout(800);
  await page.evaluate(() => window.__game.debug.perfReset());
  await page.waitForTimeout(SECS * 1000);
  return page.evaluate(() => window.__game.debug.perf());
};
try {
  for (const scene of SCENES) {
    const ctx = await browser.newContext({ viewport: { width: 1512, height: 860 }, deviceScaleFactor: DPR });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate(() => window.__game.debug.ignoreBattery?.(true));
    if (scene !== 'menu') {
      await page.evaluate((s) => {
        const g = window.__game;
        g.setSeed(1234); g.debug.setEnemiesEnabled(true); g.debug.setGod(true);
        if (s === 'earth') g.startIn('earth'); else g.startIn('space', 'free');
        g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract();
        if (s === 'space') { g.debug.viewArea('sabuk'); g.debug.startWave(8); g.debug.simulate(8, 0); }
        g.debug.setAutoplay(true);
      }, scene);
    }
    await page.evaluate(() => window.__game.debug.fpsOverride?.(0));   // ukur kerja per frame tanpa batas FPS game
    await page.waitForTimeout(2500);
    const base = await window_(page);
    const rows = [{ feature: 'semua aktif', frameMs: base.frameAvgMs, workMs: base.workAvgMs, calls: base.calls, deltaMs: 0 }];
    for (const f of FEATURES[scene]) {
      await page.evaluate((n) => window.__game.debug.feature(n, false), f);
      const p = await window_(page);
      await page.evaluate((n) => window.__game.debug.feature(n, true), f);
      rows.push({ feature: f, frameMs: p.frameAvgMs, workMs: p.workAvgMs, calls: p.calls, deltaMs: Math.round((base.frameAvgMs - p.frameAvgMs) * 100) / 100 });
    }
    const all = FEATURES[scene].filter((f) => f !== 'css');
    await page.evaluate((list) => { for (const n of list) window.__game.debug.feature(n, false); }, all);
    const none = await window_(page);
    rows.push({ feature: 'semua fitur di atas mati', frameMs: none.frameAvgMs, workMs: none.workAvgMs, calls: none.calls, deltaMs: Math.round((base.frameAvgMs - none.frameAvgMs) * 100) / 100 });
    out[scene] = { dpr: DPR, buffer: `${base.bufferW}x${base.bufferH}`, rows };
    process.stderr.write(`\n${scene} (DPR ${DPR}, buffer ${base.bufferW}x${base.bufferH})\n`);
    for (const r of rows) process.stderr.write(`  ${r.feature.padEnd(26)} frame ${String(r.frameMs).padStart(6)} ms  kerja JS ${String(r.workMs).padStart(6)} ms  hemat ${r.deltaMs} ms  draw ${r.calls}\n`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT_DIR}gpu-${label}.json`, JSON.stringify(out, null, 2) + '\n');
