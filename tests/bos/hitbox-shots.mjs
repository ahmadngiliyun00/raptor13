// Screenshot bukti hitbox (D4): wireframe bentuk tabrakan lewat debug.showHitboxes. Hasil di docs/fisika/hitbox/.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const PORT = Number(process.env.PERF_PORT || 4211);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/fisika/hitbox/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const shot = (n) => page.screenshot({ path: OUT + n + '.jpg', type: 'jpeg', quality: 70 });
try {
  await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate(() => { const g = window.__game, d = g.debug; d.setSetting('tutorialDone', true); d.setEnemiesEnabled(false); d.setGod(true); d.setArea('mars'); g.startIn('space', 'free'); g.skipTransition(); d.skipCutscene(); d.showHitboxes(true); d.viewBody('phobos', 3.2); });
  await page.waitForTimeout(700); await shot('bulan-phobos');
  await page.evaluate(() => window.__game.debug.viewBody('mars', 2.2)); await page.waitForTimeout(700); await shot('planet-mars');
  await page.evaluate(() => { const d = window.__game.debug; d.viewArea('mars'); d.spawnAsteroid('small', 45, -0.25, 0, 'rock'); d.spawnAsteroid('medium', 70, 0.2, 0, 'rock'); d.spawnAsteroid('large', 110, -0.05, 15, 'rock'); });
  await page.waitForTimeout(500); await shot('asteroid');
  for (const kind of ['raksasa', 'miner', 'hunter', 'naga']) {
    await page.evaluate((k) => { const d = window.__game.debug; d.bossProbe({ kind: k, dist: k === 'naga' ? 150 : 90, side: 0.3, elev: 0.1 }); }, kind);
    await page.waitForTimeout(150);
    await page.evaluate((k) => window.__game.debug.bossProbe({ kind: k, dist: k === 'naga' ? 150 : 90, side: 0.3, elev: 0.1 }), kind);
    await shot('bos-' + kind);
  }
} finally { await browser.close(); server.kill(); }
