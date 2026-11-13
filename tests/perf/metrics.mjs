// Regresi gameplay (A5): metrik bot B4 (tailRatio, collisionsPerMin, ramsPerMin) dengan simulasi langkah
// tetap dan seed tetap, dibandingkan antara dua versi situs (misalnya worktree sebelum audit dan sekarang).
// Pemakaian: PERF_SITE=<folder> node tests/perf/metrics.mjs <label> [--secs=120] [--seeds=4242,7,99]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const SECS = Number(opt.secs || 120);
const SEEDS = String(opt.seeds || '4242,7,99').split(',').map(Number);
const PORT = Number(process.env.PERF_PORT || 4188);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/audit/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const rows = [];
try {
  for (const world of ['earth', 'space']) for (const seed of SEEDS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ } });
    await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    const m = await page.evaluate(([w, s, secs]) => {
      const g = window.__game, d = g.debug;
      g.setSeed(s); d.setEnemiesEnabled(true); d.setGod(true);
      g.startIn(w, 'free'); g.skipTransition(); d.skipCutscene?.(); d.autoContract?.();
      d.resetMetrics?.();
      for (let i = 0; i < secs / 5; i++) d.simulate(5, 0);
      const r = d.metrics();
      return { time: Math.round(r.time), tailRatio: r.tailRatio, collisionsPerMin: r.collisionsPerMin, ramsPerMin: r.ramsPerMin, kills: g.snapshot().kills, score: g.snapshot().score, wave: g.snapshot().wave };
    }, [world, seed, SECS]);
    rows.push({ world, seed, ...m });
    console.log(world, seed, JSON.stringify(m));
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT}metrics-${label}.json`, JSON.stringify(rows, null, 2) + '\n');
