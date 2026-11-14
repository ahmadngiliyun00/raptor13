// Uji peralatan (C5 sampai C7): UI hangar dan HUD, masukan sentuh dan keyboard, skenario tiap peralatan,
// keseimbangan bot, anggaran performa, kebocoran, tabrakan fatal, dan validasi data tersimpan.
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
const dbg = (page, fn, ...args) => page.evaluate(([f, a]) => window.__game.debug[f](...a), [fn, args]);
const SAVE = (extra = {}) => ({ version: 3, settings: { tutorialDone: true, touchPromptShown: true, flashWarned: true, ...(extra.settings || {}) },
  ships: { unlocked: ['raptor-j', 'starfighter', 'interceptor', 'gunship'], selected: { earth: 'raptor-j', space: 'gunship' }, credits: 0 }, ...(extra.equip ? { equip: extra.equip } : {}) });
// Tulis simpanan lalu muat ulang (bisa dipanggil berkali-kali dalam satu uji dengan simpanan berbeda)
async function boot(page, save, { w = 1280, h = 720 } = {}) {
  await page.setViewportSize({ width: w, height: h });
  if (!page.url().startsWith('http')) { await page.goto(gameUrl()); await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 }); }
  await page.evaluate((d) => { localStorage.clear(); localStorage.setItem('raptor13.v3', JSON.stringify(d)); }, save);
  await page.reload();
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
}
async function play(page, world = 'space') {
  await page.evaluate((w) => { const g = window.__game, d = g.debug; d.setGod(true); d.setEnemiesEnabled(false); g.startIn(w, 'free'); g.skipTransition(); d.skipCutscene(); }, world);
  await page.waitForTimeout(400);
}

test('C5 hangar: panel Peralatan memasang, menukar, melepas, Pasang otomatis; peralatan terkunci tidak bisa dipasang; kapal tanpa slot menampilkan sifat pasif', async ({ page }) => {
  await boot(page, SAVE({ equip: { unlocked: ['kunang', 'sisik', 'kubah'], loadout: { gunship: ['kunang', null, null] } } }), { w: 844, h: 390 });
  await page.click('#btn-hangar');
  for (let i = 0; i < 4; i++) { if ((await page.textContent('#hangar-name')) === 'Gunship') break; await page.click('#hangar-next'); }
  await page.click('#hangar-equip');
  await expect(page.locator('#eqp')).toBeVisible();
  expect(await page.locator('#eqp-slots .eqp-slot').count()).toBe(3);
  expect(await page.locator('#eqp-list .eqp-item').count()).toBe(9);
  expect(await page.locator('#eqp-list .eqp-item.locked').count()).toBe(6);
  // Slot 2: pasang Kubah
  await page.click('#eqp-slots [data-slot="1"]');
  await page.click('#eqp-list [data-eq="kubah"]');
  expect((await dbg(page, 'equip')).loadout.gunship).toEqual(['kunang', 'kubah', null]);
  // Tukar: Kunang ke slot 3 menukar slot 1 dan 3
  await page.click('#eqp-slots [data-slot="2"]');
  await page.click('#eqp-list [data-eq="kunang"]');
  expect((await dbg(page, 'equip')).loadout.gunship).toEqual([null, 'kubah', 'kunang']);
  // Terkunci: tidak terpasang, deskripsi menyebut cara membuka
  await page.click('#eqp-slots [data-slot="0"]');
  await page.click('#eqp-list [data-eq="tombak"]');
  expect((await dbg(page, 'equip')).loadout.gunship[0]).toBe(null);
  await expect(page.locator('#eqp-desc')).toContainText('Terkunci');
  // Lepas dan Pasang otomatis
  await page.click('#eqp-slots [data-slot="1"]');
  await page.click('#eqp-clear');
  expect((await dbg(page, 'equip')).loadout.gunship).toEqual([null, null, 'kunang']);
  await page.click('#eqp-auto');
  expect((await dbg(page, 'equip')).loadout.gunship).toEqual(['kunang', 'sisik', 'kubah']);
  // Tersimpan
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('raptor13.v3')).equip.loadout.gunship);
  expect(stored).toEqual(['kunang', 'sisik', 'kubah']);
  // Starfighter: tanpa slot, sifat pasif tampil
  for (let i = 0; i < 4; i++) { if ((await page.textContent('#hangar-name')) === 'Starfighter') break; await page.click('#hangar-next'); }
  expect(await page.locator('#eqp-slots .eqp-slot').count()).toBe(0);
  await expect(page.locator('#eqp-slots')).toContainText('Inti Serba Guna');
});

test('C5 HUD HP: slot di busur berikon, tekan memakai peralatan, Tombak diisi selama ditahan, muatan dan cooldown tampil', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.addInitScript(() => { Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true }); });
  await boot(page, SAVE({ settings: { controlMode: 'hp' }, equip: { unlocked: ['kunang', 'sisik', 'tombak'], loadout: { gunship: ['kunang', 'tombak', 'sisik'] } } }), { w: 844, h: 390 });
  await play(page);
  const r = await page.evaluate(() => [...document.querySelectorAll('#touch [data-eq]')].map((b) => ({ hidden: b.classList.contains('hidden'), id: b.dataset.id, svg: !!b.querySelector('svg path'), n: b.querySelector('.eq-n').textContent })));
  expect(r.map((x) => x.hidden)).toEqual([false, false, false]);
  expect(r.map((x) => x.id)).toEqual(['kunang', 'tombak', 'sisik']);
  await page.waitForTimeout(300);
  expect(await page.locator('#touch [data-eq="2"] .eq-n').textContent()).toBe('3');
  // Tekan Kunang: cooldown berjalan, tombol berganti ke keadaan cooldown
  const tap = (sel, type, id) => page.evaluate(([sel, type, id]) => { const el = document.querySelector(sel), b = el.getBoundingClientRect(); el.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, pointerType: 'touch', clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 })); }, [sel, type, id]);
  await tap('#touch [data-eq="0"]', 'pointerdown', 41); await tap('#touch [data-eq="0"]', 'pointerup', 41);
  let e = await dbg(page, 'equip');
  expect(e.slots[0].cd).toBeGreaterThan(20);
  await expect(page.locator('#touch [data-eq="0"]')).toHaveClass(/cool/);
  // Tombak: lepas sebelum 1 detik membatalkan, tahan 1 detik menembak
  await tap('#touch [data-eq="1"]', 'pointerdown', 42); await page.waitForTimeout(300); await tap('#touch [data-eq="1"]', 'pointerup', 42);
  e = await dbg(page, 'equip');
  expect(e.slots[1].cd).toBe(0);
  await tap('#touch [data-eq="1"]', 'pointerdown', 43); await page.waitForTimeout(1300); await tap('#touch [data-eq="1"]', 'pointerup', 43);
  e = await dbg(page, 'equip');
  expect(e.slots[1].cd).toBeGreaterThan(7);
  expect(e.stats.used.tombak).toBe(1);
  // Mode HP tanpa label keyboard
  expect(await dbg(page, 'keyboardHints')).toEqual([]);
});

test('C5 desktop: slot Q, F, G sebaris dengan manuver, tombol keyboard memakai slot, keymap menyebut Q F G', async ({ page }) => {
  await boot(page, SAVE({ equip: { unlocked: ['kunang', 'sisik', 'magnet'], loadout: { gunship: ['magnet', 'kunang', 'sisik'] } } }));
  await play(page);
  const chips = await page.evaluate(() => [...document.querySelectorAll('#maneuvers .eqm')].map((c) => c.querySelector('b').textContent + ' ' + c.querySelector('span').textContent));
  expect(chips).toEqual(['Q MAGNET', 'F KUNANG', 'G SISIK']);
  await page.keyboard.press('KeyQ');
  let e = await dbg(page, 'equip');
  expect(e.magnet).toBeGreaterThan(7);
  await page.keyboard.press('KeyF');
  e = await dbg(page, 'equip');
  expect(e.slots[1].cd).toBeGreaterThan(20);
  await expect(page.locator('[data-keymap]').first()).toContainText('peralatan slot 1 sampai 3');
  const hits = await dbg(page, 'layoutOverlaps');
  expect(hits.hits).toEqual([]);
});
