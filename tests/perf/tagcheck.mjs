// Verifikasi commit kandidat tag rilis (A6): tiap commit di-checkout ke git worktree terpisah (working tree
// utama tidak diubah), dilayani server statis, dimuat di Chromium, permainan dimulai, galat console dicatat.
// Pemakaian: node tests/perf/tagcheck.mjs <hash> [<hash> ...]
// Commit lama memuat Three.js dari CDN, jadi butuh jaringan.
import { chromium } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/rilis/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const hashes = process.argv.slice(2);
const base = process.env.TAGCHECK_DIR || `${tmpdir()}/raptor13-tagcheck`;
mkdirSync(base, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const results = [];
let port = 4300;
for (const h of hashes) {
  const dir = `${base}/${h}`;
  if (!existsSync(dir)) execFileSync('git', ['worktree', 'add', '-f', '--detach', dir, h], { cwd: ROOT, stdio: 'ignore' });
  const srv = spawn(process.execPath, ['tests/static-server.mjs', String(++port)], { cwd: dir, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => srv.stdout.once('data', r));
  const browser = await chromium.launch({ args: gpuArgs });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) ? !/GL Driver Message|GPU stall/.test(m.text()) : false) errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  const r = { hash: h, subject: execFileSync('git', ['log', '-1', '--format=%s', h], { cwd: ROOT }).toString().trim(), date: execFileSync('git', ['log', '-1', '--format=%ad', '--date=iso', h], { cwd: ROOT }).toString().trim() };
  try {
    await page.goto(`http://localhost:${port}/index.html?debug=1`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    r.menu = true;
    r.version = await page.evaluate(() => document.getElementById('about-version')?.textContent || null);
    await page.keyboard.press('Shift');
    await page.evaluate(() => { const g = window.__game; if (g.startIn) g.startIn('earth'); else g.start(); });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.__game.skipTransition?.());
    await page.keyboard.down('KeyW'); await page.keyboard.down('Enter'); await page.waitForTimeout(1500); await page.keyboard.up('KeyW'); await page.keyboard.up('Enter');
    const s = await page.evaluate(() => window.__game.snapshot());
    r.state = s.state; r.shots = s.shotsFired; r.world = s.world || 'earth'; r.lives = s.lives; r.fps = s.fps;
    await page.screenshot({ path: `${OUT}${h}.jpg`, type: 'jpeg', quality: 60 });
  } catch (err) { r.error = String(err).slice(0, 200); }
  r.consoleErrors = errors.slice(0, 10);
  results.push(r);
  console.log(JSON.stringify(r));
  await browser.close();
  srv.kill();
  execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: ROOT, stdio: 'ignore' });
}
writeFileSync(`${OUT}tagcheck.json`, JSON.stringify(results, null, 2) + '\n');
