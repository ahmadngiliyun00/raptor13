// Profil alokasi memori per frame (A1 butir f) dengan sampling heap profiler CDP.
// Pemakaian: node tests/perf/alloc.mjs <label> [--dur=20] [--only=menu,earth,space]
// Hasil: docs/audit/data/alloc-<label>.json berisi situs alokasi teratas (fungsi dan baris di index.html).
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const DUR = Number(opt.dur || 20);
const ONLY = opt.only ? String(opt.only).split(',') : ['menu', 'earth', 'space'];
const PORT = Number(process.env.PERF_PORT || 4182);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT_DIR = fileURLToPath(new URL('../../docs/audit/data/', import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const out = {};
try {
  for (const scene of ONLY) {
    const ctx = await browser.newContext({ viewport: { width: 1512, height: 860 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
    await page.keyboard.press('Shift');
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
    await page.waitForTimeout(3000);
    await cdp.send('HeapProfiler.enable');
    await cdp.send('HeapProfiler.collectGarbage');
    const f0 = await page.evaluate(() => window.__game.debug.perf().renders);
    // Interval sampling 4 KB: cukup halus untuk alokasi kecil berulang tanpa memperlambat banyak
    await cdp.send('HeapProfiler.startSampling', { samplingInterval: 4096, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
    await page.waitForTimeout(DUR * 1000);
    const { profile } = await cdp.send('HeapProfiler.stopSampling');
    const frames = (await page.evaluate(() => window.__game.debug.perf().renders)) - f0;
    // Jumlahkan ukuran per situs (fungsi, baris)
    const sites = new Map();
    let total = 0;
    const walk = (n) => {
      const self = n.selfSize || 0;
      if (self > 0) {
        const cf = n.callFrame;
        const key = `${cf.functionName || '(anonim)'} @${(cf.url || '').split('/').pop()}:${cf.lineNumber + 1}`;
        sites.set(key, (sites.get(key) || 0) + self);
        total += self;
      }
      for (const c of n.children || []) walk(c);
    };
    walk(profile.head);
    const top = [...sites.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => ({ site: k, kbPerFrame: Math.round(v / 1024 / Math.max(1, frames) * 100) / 100, kbTotal: Math.round(v / 1024) }));
    out[scene] = { frames, seconds: DUR, totalKB: Math.round(total / 1024), kbPerFrame: Math.round(total / 1024 / Math.max(1, frames) * 100) / 100, top };
    process.stderr.write(`${scene}: ${out[scene].kbPerFrame} KB per frame (${frames} frame)\n`);
    for (const t of top.slice(0, 15)) process.stderr.write(`   ${t.kbPerFrame}\t${t.site}\n`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT_DIR}alloc-${label}.json`, JSON.stringify(out, null, 2) + '\n');
