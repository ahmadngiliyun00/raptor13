// Screenshot bukti pelacakan bos (B3, B4) dan kontur (B2): desktop 1440x900 dan HP 844x390.
// Pemakaian: node tests/bos/shots.mjs  (hasil di docs/bos/screenshots/pelacakan/)
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const PORT = Number(process.env.PERF_PORT || 4207);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/bos/screenshots/pelacakan/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const shot = (page, name) => page.screenshot({ path: OUT + name + '.jpg', type: 'jpeg', quality: 72 });
try {
  for (const [tag, ctxOpt] of [['pc', { viewport: { width: 1440, height: 900 } }], ['hp', { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
    const ctx = await browser.newContext(ctxOpt);
    const page = await ctx.newPage();
    await page.addInitScript((hp) => { const k = 'raptor13.v3', d = JSON.parse(localStorage.getItem(k) || '{}'); d.version = 3; d.settings = Object.assign(d.settings || {}, { tutorialDone: true, touchPromptShown: true, a2hsHintShown: true }, hp ? { controlMode: 'hp' } : { controlMode: 'keyboard' }); localStorage.setItem(k, JSON.stringify(d)); }, tag === 'hp');
    await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate(() => { const g = window.__game, d = g.debug; g.setSeed(4242); d.setEnemiesEnabled(false); d.setGod(true); d.setArea('uranus'); g.startIn('space', 'free'); g.skipTransition(); d.viewArea('uranus'); d.startBoss('hunter'); });
    await page.waitForTimeout(450);
    await shot(page, `${tag}-1-pengenalan`);
    await page.waitForTimeout(2600);
    await page.evaluate(() => window.__game.debug.placeBoss(30, 10, 330));
    await page.waitForTimeout(250);
    await shot(page, `${tag}-2-penanda-di-depan`);
    await page.evaluate(() => window.__game.debug.placeBoss(40, 5, -320));
    await page.waitForTimeout(250);
    await shot(page, `${tag}-3-di-belakang`);
    await page.evaluate(() => window.__game.debug.placeBoss(-520, 60, 120));
    await page.waitForTimeout(250);
    await shot(page, `${tag}-4-panah-tepi`);
    await page.evaluate(() => window.__game.debug.setAutoplay(true));
    await page.waitForTimeout(3500);
    await shot(page, `${tag}-5-bergerak`);
    if (tag === 'pc') {
      await page.evaluate(() => window.__game.debug.openMap());
      await page.waitForTimeout(400);
      await shot(page, `${tag}-6-peta`);
    }
    await ctx.close();
  }
  // Kontur tiap bos dari dekat (Sorotan bos Kuat) di Pluto
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate(() => { const g = window.__game, d = g.debug; d.setSetting('tutorialDone', true); d.setSetting('bossHighlight', 'kuat'); d.setEnemiesEnabled(false); d.setGod(true); d.setArea('pluto'); g.startIn('space', 'free'); g.skipTransition(); d.viewArea('pluto'); });
  for (const kind of ['raksasa', 'miner', 'hunter', 'naga']) {
    await page.evaluate((k) => window.__game.debug.bossProbe({ kind: k, dist: k === 'naga' ? 140 : 90, side: 0.35, elev: 0.12 }), kind);
    await page.waitForTimeout(80);
    await page.evaluate((k) => window.__game.debug.bossProbe({ kind: k, dist: k === 'naga' ? 140 : 90, side: 0.35, elev: 0.12 }), kind);
    await shot(page, `kontur-${kind}`);
  }
} finally { await browser.close(); server.kill(); }
