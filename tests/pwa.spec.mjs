// Uji C9: PWA. Manifest valid dengan ikon maskable, service worker terpasang dan mengendalikan halaman, game
// termuat saat luring, versi baru menunggu sampai pemain menekan Muat ulang (toast hanya di luar permainan),
// tanpa pelanggaran CSP.
import { test as base, expect } from '@playwright/test';

const isDriverNoise = (text) => /GL Driver Message|GPU stall due to ReadPixels/.test(text);
const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) ? !isDriverNoise(m.text()) : false) problems.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    await use(page);
    expect(problems, 'console harus bersih (termasuk CSP dan service worker)').toEqual([]);
  },
});
const URL_SW = '/index.html?debug=1&sw=1';
const ready = async (page) => { await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 }); };

test('C9 manifest: id, nama, layar penuh dengan cadangan standalone, landscape, ikon 192, 512, dan maskable tersedia', async ({ page, request }) => {
  const m = await (await request.get('/manifest.webmanifest')).json();
  expect(m.id).toBe('./'); expect(m.short_name).toBe('RAPTOR13'); expect(m.display).toBe('fullscreen');
  expect(m.display_override).toEqual(['fullscreen', 'standalone']); expect(m.orientation).toBe('landscape');
  expect(m.start_url).toBe('./'); expect(m.scope).toBe('./');
  const sizes = m.icons.map((i) => i.sizes + ' ' + i.purpose);
  for (const want of ['192x192 any', '512x512 any', '192x192 maskable', '512x512 maskable']) expect(sizes).toContain(want);
  for (const i of m.icons) expect((await request.get('/' + i.src)).ok(), i.src).toBe(true);
  await page.goto('/index.html');
  expect(await page.evaluate(() => document.querySelector('link[rel="manifest"]')?.getAttribute('href'))).toBeTruthy();
  const csp = await page.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]').content);
  expect(csp).toContain("worker-src 'self'"); expect(csp).toContain("manifest-src 'self'"); expect(csp).toContain("connect-src 'none'");
});

test('C9 service worker: terpasang, mengendalikan halaman, game termuat saat luring', async ({ page, context }) => {
  await page.goto(URL_SW);
  await ready(page);
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true), null, { timeout: 30000 });
  await page.reload();
  await ready(page);
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const keys = await page.evaluate(() => caches.keys());
  expect(keys.some((k) => k.startsWith('raptor13-'))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await ready(page);
  await expect(page.locator('#screen-title')).toBeVisible();
  // Bisa mulai bermain saat luring (Three.js dan modul postprocessing dari cache)
  await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.startIn('space', 'free'); g.skipTransition(); g.debug.skipCutscene(); });
  await expect.poll(() => page.evaluate(() => window.__game.snapshot().state)).toBe('playing');
  await context.setOffline(false);
});

test('C9 versi baru: menunggu tanpa memuat ulang paksa, toast hanya di menu, Muat ulang mengaktifkan versi baru', async ({ page }) => {
  await page.goto(URL_SW);
  await ready(page);
  await page.waitForFunction(() => navigator.serviceWorker.ready.then(() => true), null, { timeout: 30000 });
  await page.reload();
  await ready(page);
  // Sedang bermain: versi baru terpasang tetapi toast tidak muncul
  await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.startIn('space', 'free'); g.skipTransition(); g.debug.skipCutscene(); });
  await page.evaluate(() => navigator.serviceWorker.register('./sw.js?v=uji-versi-baru'));
  await expect.poll(() => page.evaluate(() => window.__game.debug.pwa().waiting), { timeout: 20000 }).toBe(true);
  await page.waitForTimeout(1300);
  await expect(page.locator('#pwa-update')).toBeHidden();
  // Kembali ke menu (jeda): toast muncul
  await page.evaluate(() => window.__game.pause());
  await expect(page.locator('#pwa-update')).toBeVisible({ timeout: 3000 });
  const nav = page.waitForEvent('framenavigated');
  await page.click('#pwa-reload');
  await nav;
  await ready(page);
  const ctrl = await page.evaluate(() => navigator.serviceWorker.controller.scriptURL);
  expect(ctrl).toContain('v=uji-versi-baru');
});

test('C9 tanpa ?sw=1 di mode debug service worker tidak didaftarkan; tombol Pasang aplikasi tersembunyi tanpa beforeinstallprompt', async ({ page }) => {
  await page.goto('/index.html?debug=1');
  await ready(page);
  expect((await page.evaluate(() => window.__game.debug.pwa())).state).toBe('mati');
  await expect(page.locator('#btn-install')).toBeHidden();
  // Simulasi beforeinstallprompt (Android Chrome): tombol muncul, ketuk memanggil prompt
  await page.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted = true; return Promise.resolve(); }; window.dispatchEvent(e); });
  await expect(page.locator('#btn-install')).toBeVisible();
  await page.click('#btn-install');
  expect(await page.evaluate(() => window.__prompted)).toBe(true);
  await expect(page.locator('#btn-install')).toBeHidden();
});
