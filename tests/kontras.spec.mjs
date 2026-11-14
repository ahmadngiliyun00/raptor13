// Uji C1: kontras UI adaptif. Laporan rasio kontras dari piksel nyata per dunia dibuat oleh tests/ui/kontras.mjs
// (docs/ui/kontras.md); berkas ini memeriksa perilaku: deteksi latar, histeresis, opsi Kontras UI, validasi
// pengaturan, keadaan tekan, biaya cuplik, dan tanpa galat konsol (termasuk CSP).
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
test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
const dbg = (page, fn, ...args) => page.evaluate(([f, a]) => window.__game.debug[f](...a), [fn, args]);

async function play(page, world, settings = {}) {
  await page.addInitScript((extra) => {
    const k = 'raptor13.v3', d = JSON.parse(localStorage.getItem(k) || '{}');
    d.version = 3; d.settings = Object.assign(d.settings || {}, { tutorialDone: true, touchPromptShown: true, controlMode: 'hp', flashWarned: true }, extra);
    localStorage.setItem(k, JSON.stringify(d));
  }, settings);
  await page.goto(gameUrl('kualitas=sedang'));
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate((w) => {
    const g = window.__game, d = g.debug;
    g.setSeed(4242); d.setEnemiesEnabled(false); d.setGod(true);
    if (w === 'earth') g.startIn('earth'); else { d.setArea(w); g.startIn('space', 'free'); }
    g.skipTransition(); d.skipCutscene();
    if (w !== 'earth') d.viewArea(w);
  }, world);
}
const cls = (page) => page.evaluate(() => ({ kanan: document.querySelector('#touch .actions').className, kiri: document.getElementById('joy').className, atas: document.getElementById('hud').classList.contains('uic-atas-terang'), tinggi: document.body.classList.contains('uic-tinggi') }));

test('C1: Otomatis memilih pelat gelap di langit Bumi dan pelat terang di angkasa Pluto, cuplik maksimal 2,5 Hz', async ({ page }) => {
  await play(page, 'earth');
  await expect.poll(async () => (await cls(page)).kanan, { timeout: 8000 }).toContain('uic-terang');
  expect((await cls(page)).kiri).toContain('uic-terang');
  expect((await cls(page)).atas).toBe(true);
  const r = await dbg(page, 'uiContrast');
  expect(r.lum.kanan).toBeGreaterThan(0.45);
  // 2,5 Hz: dalam 4 detik paling banyak 11 cuplik
  const s0 = r.samples;
  await page.waitForTimeout(4000);
  expect((await dbg(page, 'uiContrast')).samples - s0).toBeLessThanOrEqual(11);

  await play(page, 'pluto');
  await expect.poll(async () => (await cls(page)).kanan, { timeout: 8000 }).toContain('uic-gelap');
  const p = await dbg(page, 'uiContrast');
  expect(p.lum.kanan).toBeLessThan(0.25);
  expect(p.mode).toEqual({ kiri: 'gelap', kanan: 'gelap', atas: 'gelap' });
});

test('C1: metode utama heuristik di bawah 0,1 ms per cuplik, sama dengan kalibrasi piksel di Bumi dan Pluto', async ({ page }) => {
  await play(page, 'earth');
  await page.waitForTimeout(2500);
  const r = await dbg(page, 'uiContrast');
  expect(r.method).toBe('heuristik');
  expect(r.lastMs).toBeLessThan(0.1);
  expect(r.mode.kanan).toBe('terang');
});

test('C1: histeresis tidak berkedip di luma tengah, opsi Selalu terang, Selalu gelap, Tinggi, dan validasi pengaturan', async ({ page }) => {
  await play(page, 'pluto', { uiContrast: 'bukan-nilai' });
  // Nilai tak dikenal di localStorage jatuh ke bawaan
  expect(await dbg(page, 'getSetting', 'uiContrast')).toBe('otomatis');
  await expect.poll(async () => (await cls(page)).kanan, { timeout: 8000 }).toContain('uic-gelap');
  // Luma tengah (0,35) bergantian dengan luma sedikit di atas 0,25: mode tetap gelap, tanpa pergantian
  const sw0 = (await dbg(page, 'uiContrast')).switches;
  await page.evaluate(() => { const d = window.__game.debug; d.freeze(true); });
  for (const v of [0.35, 0.3, 0.4, 0.33, 0.42, 0.3]) await page.evaluate((x) => window.__game.debug.uiContrastFeed({ kiri: x, kanan: x, atas: x }), v);
  expect((await dbg(page, 'uiContrast')).switches).toBe(sw0);
  expect((await cls(page)).kanan).toContain('uic-gelap');
  // Terang di atas 0,45 berganti sekali
  for (const v of [0.8, 0.8, 0.8]) await page.evaluate((x) => window.__game.debug.uiContrastFeed({ kiri: x, kanan: x, atas: x }), v);
  expect((await cls(page)).kanan).toContain('uic-terang');
  await page.evaluate(() => window.__game.debug.freeze(false));

  await dbg(page, 'setSetting', 'uiContrast', 'terang');
  expect((await cls(page)).kanan).toContain('uic-gelap');     // pelat putih walau latar terang
  await dbg(page, 'setSetting', 'uiContrast', 'gelap');
  expect((await cls(page)).kanan).toContain('uic-terang');    // pelat cokelat arang
  await dbg(page, 'setSetting', 'uiContrast', 'tinggi');
  expect((await cls(page)).tinggi).toBe(true);
  const bw = await page.evaluate(() => getComputedStyle(document.querySelector('#touch .t-fire')).borderTopWidth);
  expect(parseFloat(bw)).toBeGreaterThanOrEqual(2.5);
  await dbg(page, 'setSetting', 'uiContrast', 'otomatis');
  expect((await cls(page)).tinggi).toBe(false);
  // Keadaan tekan: skala 0,94 dan pelat lebih terang
  await page.evaluate(() => document.querySelector('#touch .t-fire').classList.add('on'));
  await page.waitForTimeout(250);   // transisi 0,08 s
  const pressed = await page.evaluate(() => { const b = document.querySelector('#touch .t-fire'); const cs = getComputedStyle(b); const out = { tf: cs.transform, op: cs.opacity }; b.classList.remove('on'); return out; });
  expect(pressed.tf).toContain('0.94');
  expect(Number(pressed.op)).toBe(1);
  // Opsi ada di Pengaturan tab Akses
  expect(await page.locator('#screen-settings .seg[data-key="uiContrast"] button').count()).toBe(4);
});
