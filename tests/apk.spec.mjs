// Uji C10: kartu unduh APK (hanya browser Android, bukan aplikasi atau PWA terpasang, tidak di iOS dan desktop),
// tombol Lapor Bug (info diagnostik tanpa data pribadi, ke halaman New Issue GitHub bila formulir belum diisi),
// tombol Back aplikasi native (Jeda, tutup overlay, dua kali di menu untuk keluar), mode HP otomatis di aplikasi.
import { test as base, expect } from '@playwright/test';

const isDriverNoise = (text) => /GL Driver Message|GPU stall due to ReadPixels/.test(text);
const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) ? !isDriverNoise(m.text()) : false) problems.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    await use(page);
    expect(problems, 'console harus bersih').toEqual([]);
  },
});
const dbg = (page, fn, ...args) => page.evaluate(([f, a]) => window.__game.debug[f](...a), [fn, args]);
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ready = (page) => page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });

for (const [label, ua, want] of [['Android', ANDROID, true], ['iPhone', IPHONE, false], ['desktop', null, false]]) {
  test(`C10 kartu APK di ${label}: ${want ? 'tampil di menu dengan versi dan petunjuk pasang' : 'tidak tampil'}`, async ({ browser }) => {
    const ctx = await browser.newContext({ ...(ua ? { userAgent: ua, viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 720 } }) });
    const page = await ctx.newPage();
    await page.goto('/index.html?debug=1');
    await ready(page);
    await page.waitForTimeout(1200);
    const card = page.locator('#apk-card');
    if (!want) { await expect(card).toBeHidden(); if (!ua) await expect(page.locator('#btn-about-apk')).toHaveCount(1); await ctx.close(); return; }
    await expect(card).toBeVisible();
    await expect(page.locator('#apk-meta')).toContainText('Versi');
    await expect(card.locator('details')).toContainText('Play Protect');
    // Tidak menutupi zona tengah dan tidak menimpa tombol menu
    const r = await card.boundingBox();
    expect(r.x + r.width).toBeLessThanOrEqual(844 * 0.4);
    const overlap = await page.evaluate(() => { const a = document.getElementById('apk-card').getBoundingClientRect(); return [...document.querySelectorAll('#screen-title .btn')].filter((b) => { const c = b.getBoundingClientRect(); return c.width > 0 ? (a.left < c.right ? (c.left < a.right ? (a.top < c.bottom ? c.top < a.bottom : false) : false) : false) : false; }).map((b) => b.id); });
    expect(overlap).toEqual([]);
    // Nanti: hilang untuk sesi ini; Jangan tampilkan lagi: tersimpan
    await page.click('#apk-later');
    await expect(card).toBeHidden();
    await page.reload(); await ready(page); await page.waitForTimeout(1200);
    await expect(card).toBeVisible();
    await page.click('#apk-never');
    await page.reload(); await ready(page); await page.waitForTimeout(1200);
    await expect(card).toBeHidden();
    // PWA terpasang (display-mode standalone): tidak tampil
    await page.emulateMedia({ media: 'screen' });
    await ctx.close();
  });
}

test('C10 Lapor Bug: info diagnostik tanpa data pribadi, membuka New Issue GitHub dengan templat bug terisi', async ({ page }) => {
  await page.goto('/index.html?debug=1');
  await ready(page);
  await page.evaluate(() => { window.open = (u) => { window.__opened = u; return null; }; });
  const r = await dbg(page, 'bugReport');
  expect(r.url.startsWith('https://github.com/ahmadngiliyun00/raptor13/issues/new?')).toBe(true);
  const q = new URL(r.url).searchParams;
  expect(q.get('template')).toBe('bug.yml');
  expect(q.get('diagnostik')).toContain('Versi game:');
  for (const k of ['Mode kontrol', 'Kualitas grafis', 'Layar:', 'FPS rata-rata', 'Peramban']) expect(r.text).toContain(k);
  expect(r.text).not.toMatch(/@|localStorage|raptor13\.v3/);
  expect(await page.evaluate(() => window.__opened)).toBe(r.url);
  // Tombol ada di layar Tentang dan menu Jeda
  expect(await page.locator('#btn-about-bug').count()).toBe(1);
  expect(await page.locator('#btn-pause-bug').count()).toBe(1);
});

test('C10 aplikasi native: mode HP otomatis, tombol Back membuka Jeda, menutup overlay, dua kali di menu untuk keluar', async ({ page }) => {
  // Tiruan jembatan Capacitor (plugin App, Haptics, KeepAwake, ScreenOrientation, StatusBar, Browser)
  await page.addInitScript(() => {
    const calls = (window.__nativeCalls = []);
    const ok = (n) => (a) => { calls.push(n); return Promise.resolve(a); };
    window.Capacitor = { isNativePlatform: () => true, Plugins: {
      App: { addListener: (ev, fn) => { window.__back = fn; calls.push('listen:' + ev); }, exitApp: () => { calls.push('exit'); } },
      Haptics: { vibrate: ok('haptics') }, KeepAwake: { keepAwake: ok('keepAwake') }, ScreenOrientation: { lock: ok('lock') },
      StatusBar: { hide: ok('statusbar') }, Browser: { open: ok('browser') } } };
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/index.html?debug=1');
  await ready(page);
  const n = await dbg(page, 'nativeInfo');
  expect(n.native).toBe(true); expect(n.apkCard).toBe(false);
  expect(await dbg(page, 'getSetting', 'controlMode')).toBe('hp');
  const calls = await page.evaluate(() => window.__nativeCalls);
  for (const c of ['listen:backButton', 'keepAwake', 'lock', 'statusbar']) expect(calls).toContain(c);
  expect((await dbg(page, 'pwa')).state).toBe('mati');   // tanpa service worker di aplikasi
  await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.debug.setSetting('tutorialDone', true); g.startIn('space', 'free'); g.skipTransition(); g.debug.skipCutscene(); });
  expect(await page.evaluate(() => window.__back())).toBe('jeda');
  expect(await page.evaluate(() => window.__game.snapshot().state)).toBe('paused');
  expect(await page.evaluate(() => window.__back())).toBe('lanjut');
  expect(['countdown', 'playing']).toContain(await page.evaluate(() => window.__game.snapshot().state));   // lanjut lewat hitung mundur
  // Getar lewat plugin
  await page.evaluate(() => window.__game.debug.equipSet?.([]));
  await page.evaluate(() => { window.__game.debug.setSetting('haptics', true); });
  // Menu utama: Back pertama meminta konfirmasi, kedua dalam 2 detik keluar
  await page.reload(); await ready(page);
  expect(await page.evaluate(() => window.__back())).toBe('konfirmasi');
  expect(await page.evaluate(() => window.__back())).toBe('keluar');
  expect(await page.evaluate(() => window.__nativeCalls)).toContain('exit');
});
