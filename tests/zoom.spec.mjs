// Uji B7: pencegahan zoom dua kali ketuk dan cubit. Dijalankan di proyek webkit (emulasi iPhone 12 dan
// iPhone 14 landscape, mesin yang sama dengan Safari dan Chrome iOS) dan chromium (emulasi Android, memastikan
// Chrome Android tidak terganggu). Perilaku zoom asli hanya bisa dipastikan di perangkat iOS sungguhan:
// lihat langkah uji manual di docs/zoom-ios.md.
import { test as base, expect, devices } from '@playwright/test';

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

const DEVICES = [
  ['iPhone 12', 'webkit', ''],
  ['iPhone 14', 'webkit', ''],
  ['iPhone 14', 'webkit', '?safearea=47,0,47,21'],
  ['Pixel 7', 'chromium', ''],
];

for (const [name, engine, query] of DEVICES) {
  test.describe(`B7 zoom ${name}${query ? ' berponi' : ''}`, () => {
    const d = devices[name];
    // Landscape 844x390 untuk iPhone 12 dan 14 sesuai laporan pemilik (iPhone 12, Chrome iOS)
    const vp = engine === 'webkit' ? { width: 844, height: 390 } : { width: d.viewport.height, height: d.viewport.width };
    test.use({ userAgent: d.userAgent, deviceScaleFactor: d.deviceScaleFactor, isMobile: true, hasTouch: true, viewport: vp });
    test.skip(({ browserName }) => browserName !== engine, `${name} diuji di ${engine}`);

    test('meta viewport, CSS, dan event dua ketukan, gesture, serta cubit ditangani', async ({ page }) => {
      await page.addInitScript(() => {
        const k = 'raptor13.v3', s = JSON.parse(localStorage.getItem(k) || '{}');
        s.version = 3; s.settings = Object.assign(s.settings || {}, { controlMode: 'hp', touchPromptShown: true, tutorialDone: true, a2hsHintShown: true });
        localStorage.setItem(k, JSON.stringify(s));
      });
      await page.goto(gameUrl(query));
      await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
      const z = await page.evaluate(() => window.__game.debug.zoomGuard());
      for (const part of ['width=device-width', 'initial-scale=1', 'minimum-scale=1', 'maximum-scale=1', 'user-scalable=no', 'viewport-fit=cover']) expect(z.meta).toContain(part);
      expect(z.touchAction.html).toBe('manipulation');
      expect(z.touchAction.body).toBe('manipulation');
      expect(z.touchAction.canvas).toBe('none');
      expect(z.touchAction.touch).toBe('none');
      expect(z.touchAction.title).toBe('manipulation');
      expect(z.smallInputs).toBe(0);
      expect(z.textSizeRule).toBe(true);

      // Event sintetis: dblclick dan gesture dicegah; touchend kedua dalam 350 ms dicegah, yang pertama tidak;
      // touchmove dua jari di luar kontrol dicegah, di dalam kontrol sentuh (multi-touch joystick dan tembak) tidak
      const ev = await page.evaluate(() => {
        const fire = (type, init, target = document.body) => { const e = new Event(type, { bubbles: true, cancelable: true, ...init }); target.dispatchEvent(e); return e.defaultPrevented; };
        const out = { dblclick: fire('dblclick'), gesturestart: fire('gesturestart'), gesturechange: fire('gesturechange'), gestureend: fire('gestureend') };
        const touch = (type, targets) => {
          const e = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperty(e, 'touches', { value: targets.map((t) => ({ target: t })) });
          (targets[0] || document.body).dispatchEvent(e);
          return e.defaultPrevented;
        };
        out.tap1 = touch('touchend', []);
        out.tap2 = touch('touchend', []);
        const ctl = document.querySelector('#touch .t-fire'), joy = document.getElementById('joy-zone');
        out.pinchOutside = touch('touchmove', [document.body, document.body]);
        out.pinchControls = touch('touchmove', [ctl, joy]);
        return out;
      });
      expect(ev.dblclick).toBe(true);
      expect(ev.gesturestart).toBe(true);
      expect(ev.gesturechange).toBe(true);
      expect(ev.gestureend).toBe(true);
      expect(ev.tap1).toBe(false);
      expect(ev.tap2).toBe(true);
      expect(ev.pinchOutside).toBe(true);
      expect(ev.pinchControls).toBe(false);
    });

    test('ketukan ganda nyata di menu, di permainan, di joystick, dan di pojok tidak memperbesar halaman, kontrol tetap jalan', async ({ page }) => {
      await page.addInitScript(() => {
        const k = 'raptor13.v3', s = JSON.parse(localStorage.getItem(k) || '{}');
        s.version = 3; s.settings = Object.assign(s.settings || {}, { controlMode: 'hp', touchPromptShown: true, tutorialDone: true, a2hsHintShown: true });
        localStorage.setItem(k, JSON.stringify(s));
      });
      await page.goto(gameUrl(query));
      await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
      const W = vp.width, H = vp.height;
      // Menu: ketuk dua kali cepat di tengah dan di pojok
      for (const [x, y] of [[W / 2, H / 2], [12, H - 12]]) { await page.touchscreen.tap(x, y); await page.touchscreen.tap(x, y); }
      await page.evaluate(() => { const g = window.__game, d = g.debug; d.setEnemiesEnabled(false); d.setGod(true); g.startIn('earth'); g.skipTransition(); });
      await page.waitForFunction(() => window.__game.snapshot().state === 'playing');
      // Permainan: di langit, di zona joystick, dan di pojok kanan atas
      for (const [x, y] of [[W / 2, H * 0.35], [W * 0.15, H * 0.7], [W - 10, 10]]) { await page.touchscreen.tap(x, y); await page.touchscreen.tap(x, y); }
      const z = await page.evaluate(() => window.__game.debug.zoomGuard());
      expect(z.scale).toBe(1);
      expect(z.tipVisible).toBe(false);
      expect(z.blocked.doubleTap).toBeGreaterThan(0);
      expect((await page.evaluate(() => window.__game.snapshot())).state).toBe('playing');
      // Tombol tembak tetap berfungsi setelah ketukan ganda (peluru keluar)
      // Tombol tembak tetap berfungsi setelah ketukan ganda: ditahan 400 ms bersama joystick (multi-touch)
      const fire = await page.locator('#touch .t-fire').boundingBox();
      await page.touchscreen.tap(fire.x + fire.width / 2, fire.y + fire.height / 2);
      await page.touchscreen.tap(fire.x + fire.width / 2, fire.y + fire.height / 2);
      const before = (await page.evaluate(() => window.__game.snapshot())).shotsFired;
      await page.evaluate(async () => {
        const el = document.querySelector('#touch .t-fire'), r = el.getBoundingClientRect(), zone = document.getElementById('joy-zone'), zr = zone.getBoundingClientRect();
        const o = { bubbles: true, pointerId: 7, pointerType: 'touch', clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
        const j = { bubbles: true, pointerId: 8, pointerType: 'touch', clientX: zr.left + zr.width * 0.4, clientY: zr.top + zr.height * 0.7 };
        zone.dispatchEvent(new PointerEvent('pointerdown', j));
        el.dispatchEvent(new PointerEvent('pointerdown', o));
        await new Promise((res) => setTimeout(res, 400));
        el.dispatchEvent(new PointerEvent('pointerup', o));
        zone.dispatchEvent(new PointerEvent('pointerup', j));
      });
      expect((await page.evaluate(() => window.__game.snapshot())).shotsFired).toBeGreaterThan(before);
    });
  });
}
