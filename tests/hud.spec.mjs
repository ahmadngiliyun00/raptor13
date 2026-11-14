// Uji C2: tata letak HUD desktop (sudut-sudut: radar kiri atas, status HP kiri bawah, skor dan buff kanan atas,
// data penemuan dan hitungan musuh kanan bawah, manuver bawah tengah) tanpa tumpang tindih dan di dalam layar,
// termasuk kasus terburuk (stressHud) dan ukuran teks Besar. Tata letak mode HP diuji di hp.spec.mjs.
import { test as base, expect } from '@playwright/test';

const gameUrl = (q = '') => { const p = new URLSearchParams(String(q).replace(/^\?/, '')); p.set('debug', '1'); return '/index.html?' + p.toString(); };
const isDriverNoise = (text) => /GL Driver Message|GPU stall due to ReadPixels/.test(text);
const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ } });
    const problems = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) ? !isDriverNoise(m.text()) : false) problems.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    await use(page);
    expect(problems, 'console harus bersih').toEqual([]);
  },
});

async function playDesktop(page, w, h, settings = {}) {
  await page.setViewportSize({ width: w, height: h });
  await page.addInitScript((extra) => {
    const k = 'raptor13.v3', d = JSON.parse(localStorage.getItem(k) || '{}');
    d.version = 3; d.settings = Object.assign(d.settings || {}, { tutorialDone: true, flashWarned: true, controlMode: 'keyboard' }, extra);
    localStorage.setItem(k, JSON.stringify(d));
  }, settings);
  await page.goto(gameUrl());
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate(() => { const g = window.__game, d = g.debug; d.setEnemiesEnabled(false); d.setGod(true); g.startIn('space', 'campaign'); g.skipTransition(); d.skipCutscene(); d.autoContract(); });
  await page.waitForTimeout(600);
}
// Kotak tiap blok HUD utama yang tampil, dan yang keluar layar
const boxes = () => {
  const q = { radar: '#radar', data: '.hud-block.bl', status: '.hud-block.tl', misi: '.hud-block.tc', skor: '.hud-block.tr', musuh: '.hud-block.br', manuver: '#maneuvers' };
  const out = {}, off = [];
  for (const [k, sel] of Object.entries(q)) {
    const el = document.querySelector(sel), r = el.getBoundingClientRect();
    out[k] = { cx: (r.left + r.right) / 2 / innerWidth, cy: (r.top + r.bottom) / 2 / innerHeight };
    if (r.left < -0.5 || r.top < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5) off.push(k);
  }
  return { out, off };
};

for (const [w, h, settings] of [[1280, 720, {}], [1440, 900, {}], [2560, 1440, {}], [1440, 900, { textSize: 'besar' }], [1280, 800, { textSize: 'sangat' }]]) {
  test(`C2 desktop ${w}x${h} ${JSON.stringify(settings)}: radar kiri atas, status HP kiri bawah, tanpa tumpang tindih walau semua HUD tampil`, async ({ page }) => {
    await playDesktop(page, w, h, settings);
    const b = await page.evaluate(boxes);
    expect(b.off).toEqual([]);
    expect(b.out.radar.cx).toBeLessThan(0.2); expect(b.out.radar.cy).toBeLessThan(0.25);
    expect(b.out.status.cx).toBeLessThan(0.25); expect(b.out.status.cy).toBeGreaterThan(0.7);
    expect(b.out.skor.cx).toBeGreaterThan(0.8);
    expect(b.out.manuver.cy).toBeGreaterThan(0.9);
    await page.evaluate(() => window.__game.debug.stressHud());
    await page.waitForTimeout(2800);
    const r = await page.evaluate(() => window.__game.debug.layoutOverlaps());
    expect(r.hits).toEqual([]);
    expect((await page.evaluate(boxes)).off).toEqual([]);
  });
}
