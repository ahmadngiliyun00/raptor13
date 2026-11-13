// Screenshot audit UI/UX (A4): menu, pengaturan, gameplay, jeda, tentang di ukuran HP landscape dan desktop.
// Pemakaian: node tests/perf/shots.mjs <label> [--sizes=568x320,667x375,844x390,932x430,1440x900] [--zoom]
// PERF_SITE=<folder situs> untuk memotret versi lain (misalnya worktree sebelum audit).
// Hasil: docs/screenshots/audit/<label>/<lebar>x<tinggi>-<layar>.jpg
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const SIZES = String(opt.sizes || '568x320,667x375,844x390,932x430,1440x900').split(',').map((s) => s.split('x').map(Number));
const PORT = Number(process.env.PERF_PORT || 4187);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL(`../../docs/screenshots/audit/${label}/`, import.meta.url));
mkdirSync(OUT, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const errors = [];
try {
  for (const [w, h] of SIZES) {
    const phone = w < 1000;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 3 : (opt.dpr ? Number(opt.dpr) : 1), hasTouch: phone, isMobile: phone });
    await ctx.addInitScript((hp) => {
      try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ }
      if (sessionStorage.getItem('siap')) return;
      sessionStorage.setItem('siap', '1');
      const d = { version: 3, settings: { touchPromptShown: true, a2hsHintShown: true, tutorialDone: true, flashWarned: true, controlMode: hp ? 'hp' : 'keyboard', quality: 'sedang', bloom: true } };
      localStorage.setItem('raptor13.v3', JSON.stringify(d));
    }, phone);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${w}x${h} ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${w}x${h} ${m.text()}`); });
    await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate(() => { window.__game.setSeed(4321); window.__game.debug.ignoreBattery?.(true); });
    await page.waitForTimeout(2200);
    const shot = (name) => page.screenshot({ path: `${OUT}${w}x${h}-${name}.jpg`, type: 'jpeg', quality: 72 });
    await shot('menu');
    await page.click('#btn-settings');
    await page.waitForTimeout(500);
    await shot('pengaturan');
    if (await page.locator('.set-tab[data-tab="akses"]').isVisible().catch(() => false)) { await page.click('.set-tab[data-tab="akses"]'); await page.waitForTimeout(300); await shot('pengaturan-akses'); }
    await page.keyboard.press('Escape');
    await page.click('#btn-about').catch(() => {});
    await page.waitForTimeout(400);
    await shot('tentang');
    await page.keyboard.press('Escape');
    await page.click('#btn-about-back').catch(() => {});
    await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.debug.setEnemiesEnabled(true); g.startIn('space', 'free'); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); });
    await page.waitForTimeout(600);
    await page.evaluate(() => { const d = window.__game.debug; d.startWave?.(3); d.simulate?.(4, 0); });
    await page.waitForTimeout(1500);
    await shot('main');
    await page.evaluate(() => window.__game.pause());
    await page.waitForTimeout(600);
    await shot('jeda');
    await ctx.close();
    process.stderr.write(`${w}x${h} selesai\n`);
  }
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) console.log('galat:', errors.slice(0, 10).join('\n'));
