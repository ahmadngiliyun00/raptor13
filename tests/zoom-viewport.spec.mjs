// Uji E1 dan E2: zoom browser tidak boleh merusak ukuran canvas, kamera, kapal, dan UI.
// Bug dari pemilik (iPhone 12, Chrome iOS): setelah halaman ter-zoom, canvas menyusut menjadi kotak kecil di kiri
// atas dan gambar tampak kasar. Di iOS window.innerWidth dan innerHeight serta visualViewport ikut mengecil saat
// pinch zoom, sedangkan layout viewport (documentElement.clientWidth) tetap. Uji ini meniru perilaku iOS itu
// (mock innerWidth, innerHeight, dan VisualViewport) di WebKit dan Chromium, ditambah zoom asli lewat CDP
// Emulation.setPageScaleFactor di Chromium.
import { test as base, expect } from '@playwright/test';

const gameUrl = (q = '') => { const p = new URLSearchParams(String(q).replace(/^\?/, '')); p.set('debug', '1'); return '/index.html?' + p.toString(); };
const isDriverNoise = (text) => /GL Driver Message|GPU stall due to ReadPixels|WebGL: INVALID|texImage|readPixels/.test(text);
const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) ? !isDriverNoise(m.text()) : false) problems.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    await use(page);
    expect(problems, 'console harus bersih').toEqual([]);
  },
});
test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });

// Meniru iOS: innerWidth, innerHeight, dan visualViewport mengecil sebesar skala zoom, lalu event resize
const MOCK = () => {
  const orig = { iw: Object.getOwnPropertyDescriptor(window, 'innerWidth'), ih: Object.getOwnPropertyDescriptor(window, 'innerHeight') };
  const vvProto = window.VisualViewport ? window.VisualViewport.prototype : null;
  const vvOrig = {};
  if (vvProto) for (const k of ['width', 'height', 'scale', 'offsetLeft', 'offsetTop']) vvOrig[k] = Object.getOwnPropertyDescriptor(vvProto, k);
  window.__zoom = (s, ox = 0, oy = 0) => {
    const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight;
    if (s === 1) {
      if (orig.iw) Object.defineProperty(window, 'innerWidth', orig.iw); else delete window.innerWidth;
      if (orig.ih) Object.defineProperty(window, 'innerHeight', orig.ih); else delete window.innerHeight;
      if (vvProto) for (const k of Object.keys(vvOrig)) if (vvOrig[k]) Object.defineProperty(vvProto, k, vvOrig[k]);
    } else {
      Object.defineProperty(window, 'innerWidth', { get: () => Math.round(W / s), configurable: true });
      Object.defineProperty(window, 'innerHeight', { get: () => Math.round(H / s), configurable: true });
      const v = { width: W / s, height: H / s, scale: s, offsetLeft: ox, offsetTop: oy };
      if (vvProto) for (const k of Object.keys(v)) Object.defineProperty(vvProto, k, { get: () => v[k], configurable: true });
    }
    if (window.visualViewport) window.visualViewport.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
  };
};

async function openPlaying(page) {
  await page.addInitScript(() => {
    const k = 'raptor13.v3', s = JSON.parse(localStorage.getItem(k) || '{}');
    s.version = 3; s.settings = Object.assign(s.settings || {}, { controlMode: 'hp', touchPromptShown: true, tutorialDone: true, a2hsHintShown: true });
    localStorage.setItem(k, JSON.stringify(s));
  });
  await page.addInitScript(MOCK);
  await page.goto(gameUrl());
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate(() => { const g = window.__game, d = g.debug; d.setEnemiesEnabled(false); d.setGod(true); g.startIn('space', 'free'); g.skipTransition(); });
  await page.waitForTimeout(400);
}

const measure = (page) => page.evaluate(() => {
  const cv = document.querySelector('#game canvas'), r = cv.getBoundingClientRect(), fire = document.querySelector('#touch .t-fire').getBoundingClientRect();
  const pf = window.__game.debug.planeFrame();
  const lay = window.__game.debug.layout ? window.__game.debug.layout() : null;
  return { cssW: Math.round(r.width), cssH: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top), bufW: cv.width, bufH: cv.height,
    layoutW: document.documentElement.clientWidth, layoutH: document.documentElement.clientHeight, fire: [Math.round(fire.left), Math.round(fire.top), Math.round(fire.width)],
    planeCx: pf.cx, aspect: lay ? lay.aspect : null, pr: lay ? lay.pixelRatio : null, scale: lay ? lay.dynScale : null };
});

for (const s of [1.5, 2, 2.8, 4]) {
  test(`E2: zoom ${s} meniru iOS tidak mengubah canvas, buffer, kamera, kapal, dan tombol`, async ({ page }) => {
    await openPlaying(page);
    const base0 = await measure(page);
    expect(base0.cssW).toBe(base0.layoutW);
    expect(base0.cssH).toBe(base0.layoutH);
    await page.evaluate((s) => window.__zoom(s, 40, 20), s);
    await page.waitForTimeout(350);
    const z = await measure(page);
    expect(z.cssW, 'lebar CSS canvas tetap layout viewport').toBe(base0.layoutW);
    expect(z.cssH, 'tinggi CSS canvas tetap layout viewport').toBe(base0.layoutH);
    expect(z.left).toBe(0);
    expect(z.top).toBe(0);
    expect(z.bufW, 'buffer tidak menyusut').toBeGreaterThanOrEqual(base0.bufW * 0.99);
    expect(z.bufH).toBeGreaterThanOrEqual(base0.bufH * 0.99);
    expect(Math.abs(z.planeCx - 0.5)).toBeLessThan(0.08);
    expect(z.fire).toEqual(base0.fire);
    if (z.aspect !== null) expect(Math.abs(z.aspect - base0.layoutW / base0.layoutH)).toBeLessThan(0.01);
    if (z.scale !== null) expect(z.scale).toBeGreaterThanOrEqual(base0.scale);
    // Kembali normal
    await page.evaluate(() => window.__zoom(1));
    await page.waitForTimeout(350);
    const back = await measure(page);
    expect(back.cssW).toBe(base0.cssW);
    expect(back.bufW).toBe(base0.bufW);
    expect(back.fire).toEqual(base0.fire);
  });
}

test('E2: zoom asli Chromium (CDP setPageScaleFactor) tidak mengubah canvas dan kembali normal', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP hanya di Chromium');
  await openPlaying(page);
  const base0 = await measure(page);
  const cdp = await page.context().newCDPSession(page);
  for (const s of [1.5, 2, 2.8, 4]) {
    await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: s });
    await page.waitForTimeout(250);
    const z = await measure(page);
    expect(z.cssW, 'skala ' + s).toBe(base0.cssW);
    expect(z.bufW).toBeGreaterThanOrEqual(base0.bufW * 0.99);
    expect(z.fire).toEqual(base0.fire);
  }
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
  await page.waitForTimeout(250);
  expect((await measure(page)).cssW).toBe(base0.cssW);
});

test('D7: overlay ?diag=1 menampilkan angka zoom tanpa membuka hook debug; hook D2 dan D4 hanya dengan ?debug=1', async ({ page }) => {
  // Tanpa parameter: tidak ada overlay dan tidak ada hook
  await page.goto('/index.html');
  await expect(page.locator('#screen-title')).toBeVisible();
  expect(await page.locator('#diag').count()).toBe(0);
  expect(await page.evaluate(() => typeof window.__game)).toBe('undefined');
  // ?diag=1: overlay berisi layout, visualViewport, skala, canvas, buffer, dan event zoom yang dicegah, hook tetap tertutup
  await page.goto('/index.html?diag=1');
  await expect(page.locator('#diag')).toBeVisible();
  await expect(page.locator('#diag pre')).toContainText('layout 844x390', { timeout: 10000 });
  const txt = await page.locator('#diag pre').textContent();
  for (const k of ['visualViewport', 'skala', 'canvas CSS', 'buffer', 'resolusi', 'zoom dicegah', 'cubit']) expect(txt).toContain(k);
  expect(await page.evaluate(() => typeof window.__game)).toBe('undefined');
  // ?debug=1: hook bot terampil (D2), hitbox (D4), dan penanda bos (D3) tersedia
  await page.goto(gameUrl());
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
  const hooks = await page.evaluate(() => ['skilledBot', 'botAccuracy', 'bossLog', 'showHitboxes', 'fatalWatch', 'hitboxAudit', 'bossHud', 'layout'].map((k) => k + ':' + typeof window.__game.debug[k]));
  for (const h of hooks) expect(h).toMatch(/:function$/);
});
