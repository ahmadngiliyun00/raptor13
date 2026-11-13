// Simulasi bot melawan bos (B1, B5): tiap bos di dunia stage-nya, Mudah, Normal, Sulit, 180 detik langkah tetap.
// Bot memburu bagian bos yang bisa ditembak dan memakai ultimate saat penuh (hook debug.bossSim).
// Pemakaian: node tests/bos/metrics.mjs <label> [--secs=180] [--seeds=4242,7] [--boss=hunter]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const SECS = Number(opt.secs || 180);
const SEEDS = String(opt.seeds || '4242').split(',').map(Number);
const BOTS = String(opt.bots || 'buru,jelajah').split(',');
const DIFFS = String(opt.diffs || 'mudah,normal,sulit').split(',');
const PORT = Number(process.env.PERF_PORT || 4192);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/bos/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const HOME = { raksasa: 'earth', miner: 'sabuk', hunter: 'uranus', naga: 'pluto' };
const BOSSES = opt.boss ? String(opt.boss).split(',') : Object.keys(HOME);
const rows = [];
try {
  for (const bot of BOTS) for (const kind of BOSSES) for (const difficulty of DIFFS) for (const seed of SEEDS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ } });
    await page.goto(`http://localhost:${PORT}/index.html?debug=1&kualitas=rendah`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    const r = await page.evaluate(([kind, world, difficulty, seed, secs, bot]) => {
      const g = window.__game, d = g.debug;
      g.setSeed(seed); d.setEnemiesEnabled(false); d.setSetting('tutorialDone', true); d.setSetting('difficulty', difficulty);
      if (world === 'earth') g.startIn('earth'); else { d.setArea(world); g.startIn('space', 'free'); }
      g.skipTransition(); d.skipCutscene?.();
      if (world !== 'earth') { d.setArea(world); d.viewArea(world); }
      return d.bossSim(kind, secs, { difficulty, bot });
    }, [kind, HOME[kind], difficulty, seed, SECS, bot]);
    rows.push({ seed, world: HOME[kind], ...r });
    console.log(bot, kind, difficulty, seed, JSON.stringify(r));
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
// Rata-rata per bos dan kesulitan
const avg = {};
for (const r of rows) {
  const k = r.bot + '/' + r.kind + '/' + r.difficulty;
  (avg[k] = avg[k] || []).push(r);
}
const summary = Object.entries(avg).map(([k, list]) => {
  const m = (f) => Math.round(list.reduce((s, x) => s + (x[f] ?? 0), 0) / list.length * 10) / 10;
  const killed = list.filter((x) => x.defeatAt !== null);
  return { key: k, frontPct: m('frontPct'), rearPct: m('rearPct'), maxRearStreak: Math.max(...list.map((x) => x.maxRearStreak)), overshootsPerMin: m('overshootsPerMin'), contactsPerMin: m('contactsPerMin'),
    vulnWindows: m('vulnWindows'), insideBodyPct: m('insideBodyPct'), occludedPct: m('occludedPct'), offscreenPct: m('offscreenPct'), meanDist: m('meanDist'), meanPx: m('meanPx'),
    killed: killed.length + '/' + list.length, meanDefeat: killed.length ? Math.round(killed.reduce((s, x) => s + x.defeatAt, 0) / killed.length) : null };
});
console.table(summary);
writeFileSync(`${OUT}perilaku-${label}.json`, JSON.stringify({ secs: SECS, seeds: SEEDS, rows, summary }, null, 1) + '\n');
