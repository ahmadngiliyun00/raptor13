// Rekaman berurutan Piko (E3, E4): melayang, belok, menempel saat nitro, keluar. Screenshot dipotong di sekitar
// kapal ke docs/screenshots/piko/. Pemakaian: node tests/piko/shots.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DIR = ROOT + 'docs/screenshots/piko/';
mkdirSync(DIR, { recursive: true });
const PORT = Number(process.env.PERF_PORT || 4202);
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : [] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(() => localStorage.setItem('raptor13.v3', JSON.stringify({ version: 3, settings: { tutorialDone: true, flashWarned: true } })));
await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
await page.evaluate(() => { const g = window.__game, d = g.debug; d.setGod(true); d.setEnemiesEnabled(false); d.setArea('saturnus'); g.startIn('space', 'free'); d.viewArea('saturnus'); g.skipTransition(); d.skipCutscene(); });
await page.waitForTimeout(2500);
const clip = { x: 340, y: 280, width: 600, height: 400 };
const shot = async (name) => page.screenshot({ path: DIR + name + '.jpg', type: 'jpeg', quality: 78, clip });
await shot('1-melayang');
await page.keyboard.down('KeyD'); await page.waitForTimeout(500); await shot('2-belok-tertinggal'); await page.keyboard.up('KeyD');
await page.waitForTimeout(1500);
await page.keyboard.down('Space'); await page.waitForTimeout(160); await shot('3-terbang-masuk'); await page.waitForTimeout(700); await shot('4-menempel-nitro');
await page.keyboard.up('Space'); await page.waitForTimeout(1500); await shot('5-keluar');
await page.waitForTimeout(1200); await shot('6-kembali-melayang');
await browser.close(); server.kill();
console.log('screenshot Piko tersimpan di docs/screenshots/piko/');
