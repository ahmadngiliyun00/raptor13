// Keseimbangan peralatan (C6): bot 3 menit per kesulitan, tanpa peralatan (Starfighter 0 slot dan Gunship
// kosong) dan dengan 3 peralatan (Gunship). Mencatat pembunuhan per menit, HP rata-rata, kematian, damage
// diterima, dan pemakaian peralatan. Hasil ke docs/equipment/data/bot-<label>.json.
// Pemakaian: node tests/equipment/bot.mjs <label> [--secs 180]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const secs = Number(argv[argv.indexOf('--secs') + 1]) || 180;
const PORT = Number(process.env.PERF_PORT || 4199);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/equipment/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const RUNS = [['starfighter', []], ['gunship', []], ['gunship', ['kunang', 'sisik', 'kubah']], ['gunship', ['tombak', 'pengacau', 'rajut']]];
const rows = [];
for (const difficulty of ['mudah', 'normal', 'sulit']) {
  for (const [ship, ids] of RUNS) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.addInitScript(([ship, difficulty]) => { try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ }
      localStorage.setItem('raptor13.v3', JSON.stringify({ version: 3, settings: { tutorialDone: true, flashWarned: true, difficulty }, ships: { unlocked: ['raptor-j', 'starfighter', 'interceptor', 'gunship'], selected: { earth: 'raptor-j', space: ship }, credits: 0 } })); }, [ship, difficulty]);
    await page.goto(`http://localhost:${PORT}/index.html?debug=1&kualitas=rendah`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate(() => { const g = window.__game; g.setSeed(777); g.startIn('space', 'campaign'); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); });
    const r = await page.evaluate(([s, ids]) => window.__game.debug.equipBot(s, ids), [secs, ids]);
    rows.push({ difficulty, ship, ids, ...r });
    console.log(difficulty.padEnd(7), ship.padEnd(12), (ids.join(',') || '-').padEnd(26), JSON.stringify(r));
    await page.close();
  }
}
writeFileSync(OUT + `bot-${label}.json`, JSON.stringify(rows, null, 1));
await browser.close(); server.kill();
