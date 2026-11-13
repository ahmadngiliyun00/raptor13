// Waktu sampai bos kalah (TTK, D2): bot terampil dan rata-rata (debug.skilledBot) melawan tiap bos di area stage-nya,
// Mudah, Normal, Sulit, beberapa seed, batas 300 detik. Bot menerima kerusakan sungguhan (tanpa mode kebal;
// tabrakan keras dicatat dalam mode latihan agar pertarungan tetap berlanjut).
// Pemakaian: node tests/bos/ttk.mjs <label> [--seeds=1,2,3,4,5] [--boss=raksasa] [--profiles=terampil,rata] [--diffs=normal] [--secs=300]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const SEEDS = String(opt.seeds || '1,2,3,4,5').split(',').map(Number);
const SECS = Number(opt.secs || 300);
const PROFILES = String(opt.profiles || 'terampil,rata').split(',');
const DIFFS = String(opt.diffs || 'mudah,normal,sulit').split(',');
const HOME = { raksasa: 'earth', miner: 'sabuk', hunter: 'uranus', naga: 'pluto' };
const BOSSES = opt.boss ? String(opt.boss).split(',') : Object.keys(HOME);
const PORT = Number(process.env.PERF_PORT || 4208);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/bos/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const rows = [];
try {
  for (const profile of PROFILES) for (const kind of BOSSES) for (const difficulty of DIFFS) for (const seed of SEEDS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`http://localhost:${PORT}/index.html?` + new URLSearchParams({ debug: '1', kualitas: 'rendah' }));
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    const r = await page.evaluate(([kind, world, difficulty, seed, secs, profile]) => {
      const g = window.__game, d = g.debug;
      g.setSeed(seed); d.setEnemiesEnabled(false); d.setSetting('tutorialDone', true); d.setSetting('difficulty', difficulty);
      if (world === 'earth') g.startIn('earth'); else { d.setArea(world); g.startIn('space', 'free'); }
      g.skipTransition(); d.skipCutscene();
      if (world !== 'earth') d.viewArea(world);
      return d.skilledBot(kind, secs, { difficulty, seed, profile });
    }, [kind, HOME[kind], difficulty, seed, SECS, profile]);
    rows.push({ profile, seed, ...r });
    console.log(profile, kind, difficulty, seed, 'ttk', r.defeatAt, 'dmg', r.damageTaken, 'mati', r.deaths, 'tabrak', r.crashes, 'depan', r.frontPct, 'rentan', r.vulnUsed + '/' + r.vulnWindows, 'ekor', r.maxRearStreak, 'fase', r.phase);
    await page.close();
  }
} finally { await browser.close(); server.kill(); }
const med = (a) => { const v = [...a].sort((p, q) => p - q); return v.length ? v[Math.floor((v.length - 1) / 2)] : null; };
const summary = [];
for (const profile of PROFILES) for (const kind of BOSSES) for (const difficulty of DIFFS) {
  const list = rows.filter((x) => x.profile === profile ? (x.kind === kind ? x.difficulty === difficulty : false) : false);
  if (!list.length) continue;
  const won = list.filter((x) => x.defeatAt !== null).map((x) => x.defeatAt);
  summary.push({ profile, kind, difficulty, n: list.length, median: won.length ? Math.round(med(won)) : null, min: won.length ? Math.round(Math.min(...won)) : null, max: won.length ? Math.round(Math.max(...won)) : null,
    notDefeatedPct: Math.round((list.length - won.length) / list.length * 100), damage: Math.round(list.reduce((s, x) => s + x.damageTaken, 0) / list.length), deaths: Math.round(list.reduce((s, x) => s + x.deaths, 0) / list.length * 10) / 10,
    vulnUsed: Math.round(list.reduce((s, x) => s + x.vulnUsed, 0) / list.length * 10) / 10, frontPct: Math.round(list.reduce((s, x) => s + x.frontPct, 0) / list.length), maxRear: Math.max(...list.map((x) => x.maxRearStreak)) });
}
console.table(summary);
writeFileSync(`${OUT}ttk-${label}.json`, JSON.stringify({ secs: SECS, seeds: SEEDS, rows, summary }, null, 1) + '\n');
