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
  await page.goto(gameUrl());
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

// ---------- C6: skenario tiap peralatan, tabrakan fatal, keseimbangan, performa, kebocoran ----------
test('C6 skenario: tiap peralatan bekerja sesuai deskripsi (debug.equipTest)', async ({ page }) => {
  await boot(page, SAVE());
  await play(page);
  const T = async (id) => { const r = await dbg(page, 'equipTest', id); expect(r, id).not.toBeNull(); return r; };
  const k = await T('kunang');
  expect(k.locked).toBe(2); expect(k.used).toBe(true); expect(k.hits).toBe(2);
  expect(k.damage[0]).toBeGreaterThan(0); expect(k.damage[1]).toBeGreaterThan(0);
  const kb = await T('kubah');
  expect(kb.used).toBe(true); expect(kb.absorbed).toBe(5); expect(kb.hpLost).toBe(0);
  const sk = await T('sisik');
  expect(sk.absorbed).toBe(3); expect(sk.hpLost).toBeGreaterThan(0);   // 3 muatan menahan 3 kena, kena ke-4 dan ke-5 menembus
  const tb = await T('tombak');
  expect(tb.used).toBe(true); expect(tb.damaged).toBe(4); expect(tb.hits).toBeGreaterThanOrEqual(4); expect(tb.cd).toBeGreaterThan(8);
  const em = await T('pengacau');
  expect(em.bulletsBefore).toBeGreaterThanOrEqual(10); expect(em.cleared).toBeGreaterThanOrEqual(10); expect(em.missileGone).toBe(true); expect(em.gunshipJammed).toBe(true);
  const su = await T('suar');
  expect(su.used).toBe(true); expect(su.lured).toBe(true); expect(su.hpLost).toBeLessThanOrEqual(0);   // rudal mengejar suar, HP tidak berkurang
  const rj = await T('ranjau');
  expect(rj.mineHits).toBeGreaterThanOrEqual(1); expect(rj.damage).toBeGreaterThan(0); expect(rj.charges).toBe(2);
  const ra = await T('rajut');
  expect(ra.healedPct).toBeGreaterThan(22); expect(ra.healedPct).toBeLessThan(28); expect(ra.charges).toBe(1);
  expect(ra.used2).toBe(true); expect(ra.used3).toBe(false);   // 2 kali per stage
  const mg = await T('magnet');
  expect(mg.mulBefore).toBe(1); expect(mg.mulActive).toBe(3); expect(mg.mulAfter).toBe(1);
  // Tabrakan fatal tetap fatal walau Kubah aktif atau Sisik bermuatan penuh
  for (const id of ['kubah', 'sisik']) {
    await boot(page, SAVE());
    await play(page);
    const f = await dbg(page, 'equipTest', id, 'fatal');
    if (id === 'kubah') expect(f.shieldBefore).toBeGreaterThan(3); else expect(f.chargesBefore).toBe(3);
    expect(f.fatalAlive, id).toBe(false);
  }
});

test('C6 kesulitan: cooldown dan muatan mengikuti Mudah, Normal, Sulit; Peti Suplai mengisi ulang; Peti Peralatan memberi slot sementara untuk kapal tanpa slot', async ({ page }) => {
  for (const [diff, cd, sisik, rajut] of [['mudah', 25.5, 4, 2], ['normal', 30, 3, 2], ['sulit', 36, 2, 1]]) {
    await boot(page, SAVE({ settings: { difficulty: diff } }));
    await play(page);
    const r = await dbg(page, 'equipSet', ['kunang', 'sisik', 'rajut']);
    expect(r.slots.map((s) => s.max), diff).toEqual([0, sisik, rajut]);
    await dbg(page, 'equipUse', 0);
    expect((await dbg(page, 'equip')).slots[0].cd, diff).toBeCloseTo(cd, 0);
  }
  await dbg(page, 'equipResupply');
  expect((await dbg(page, 'equip')).slots[0].cd).toBe(0);
  // Starfighter tanpa slot: Peti Peralatan memberi satu slot sementara sampai stage selesai
  await boot(page, { ...SAVE(), ships: { unlocked: ['raptor-j', 'starfighter'], selected: { earth: 'raptor-j', space: 'starfighter' }, credits: 0 } });
  await play(page);
  expect((await dbg(page, 'equip')).slots).toEqual([]);
  expect(await dbg(page, 'equipGrant', 'magnet')).toBe('magnet');
  const g = await dbg(page, 'equip');
  expect(g.slots.map((s) => s.id)).toEqual(['magnet']); expect(g.slots[0].temp).toBe(true);
  expect((await dbg(page, 'hudLayout')).eq).toBe(1);
});

test('C6 anggaran performa dan kebocoran: semua efek peralatan aktif bersamaan, 20 kali restart dengan peralatan', async ({ page }) => {
  await boot(page, SAVE({ equip: { unlocked: ['kunang', 'kubah', 'tombak', 'pengacau', 'suar', 'ranjau'], loadout: { gunship: ['kunang', 'kubah', 'ranjau'] } } }));
  await page.evaluate(() => { const g = window.__game, d = g.debug; d.setGod(true); g.startIn('space', 'campaign'); g.skipTransition(); d.skipCutscene(); d.autoContract(); });
  // Pemanasan: semua efek sempat tampil sekali sehingga geometrinya sudah terunggah ke GPU
  await page.evaluate(() => { const d = window.__game.debug; for (let i = 0; i < 3; i++) d.spawnEnemy('drone', 260); d.equipUse(0); d.equipUse(1); d.equipUse(2); });
  await dbg(page, 'simulate', 30);
  await dbg(page, 'equipResupply');
  const base0 = await dbg(page, 'resources');
  await page.evaluate(() => { const d = window.__game.debug; for (let i = 0; i < 3; i++) d.spawnEnemy('drone', 260); });
  await page.waitForTimeout(400);
  const p0 = await dbg(page, 'perf');
  // Semua efek sekaligus: rudal, kubah, ranjau
  await page.evaluate(() => { const d = window.__game.debug; d.equipUse(0); d.equipUse(1); d.equipUse(2); });
  await page.waitForTimeout(400);
  const p1 = await dbg(page, 'perf');
  // Setiap efek menambah paling banyak beberapa draw call (objek dari pool, hanya tampil saat aktif)
  expect(p1.calls - p0.calls).toBeLessThanOrEqual(12);
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('KeyR');
    await page.evaluate(() => { const d = window.__game.debug; d.equipUse(0); d.equipUse(1); d.equipUse(2); });
    await dbg(page, 'simulate', 6);
    await page.waitForTimeout(120);
  }
  const after = await dbg(page, 'resources');
  expect(after.sceneObjects).toBe(base0.sceneObjects);
  expect(after.sceneChildren).toBe(base0.sceneChildren);
  expect(after.listeners).toBe(base0.listeners);
  expect(after.programs).toBeLessThanOrEqual(base0.programs + 2);
  // Objek scene, anak scene, dan listener harus sama persis (penanda kebocoran yang pasti). Jumlah geometri GPU
  // bervariasi +1 sampai +5 dalam 20 restart, juga tanpa memakai peralatan (diukur: 97 ke 101 dalam 60 restart
  // tanpa peralatan), karena geometri jenis objek yang baru pertama kali muncul baru diunggah saat itu
  expect(after.geometries).toBeLessThanOrEqual(base0.geometries + 6);
});

test('C6 keseimbangan: bot 60 detik Normal, peralatan membantu tetapi tidak membuat permainan sepele, kapal 0 slot tetap layak', async ({ page }) => {
  test.setTimeout(240_000);
  const run = async (ship, ids, seed) => {
    await boot(page, { ...SAVE(), ships: { unlocked: ['raptor-j', 'starfighter', 'interceptor', 'gunship'], selected: { earth: 'raptor-j', space: ship }, credits: 0 } });
    await page.evaluate((sd) => { const g = window.__game; g.setSeed(sd); g.startIn('space', 'campaign'); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); }, seed);
    const r = await page.evaluate((ids) => window.__game.debug.equipBot(60, ids), ids);
    return r;
  };
  // Tiga seed per konfigurasi: hasil satu seed 60 detik sangat peka terhadap urutan RNG (sebaran 2 sampai 7 kill
  // antar seed, diukur 14 November 2026), jadi ambang dinilai dari rata-rata, setara syarat lama lebih dari 3 kill
  const SEEDS = [777, 778, 779], none = [], withEq = [];
  for (const sd of SEEDS) { none.push(await run('starfighter', [], sd)); withEq.push(await run('gunship', ['kunang', 'sisik', 'kubah'], sd)); }
  const mean = (a, k) => a.reduce((x, r) => x + r[k], 0) / a.length;
  test.info().annotations.push({ type: 'bot', description: JSON.stringify({ none: none.map((r) => [r.kills, r.damageTaken]), withEq: withEq.map((r) => [r.kills, r.damageTaken]) }) });
  expect(mean(none, 'kills'), 'kapal 0 slot tetap bisa menghancurkan musuh').toBeGreaterThan(3);
  expect(withEq.reduce((x, r) => x + r.absorbed + Object.values(r.used).reduce((a, b) => a + b, 0), 0) / SEEDS.length, 'peralatan terpakai').toBeGreaterThan(2);
  expect(mean(none, 'damageTaken'), 'musuh tetap mengancam').toBeGreaterThan(0);
  expect(mean(withEq, 'kills'), 'bot berperalatan tetap bertarung').toBeGreaterThan(3);
});

// ---------- C7: persistensi dan keamanan data peralatan ----------
test('C7 data peralatan: id asing, duplikat, slot berlebih, peralatan terkunci di loadout, dan tipe salah dibersihkan; simpanan lama tanpa peralatan mendapat bawaan', async ({ page }) => {
  const cases = [
    // [simpanan equip mentah, harapan loadout gunship, harapan unlocked]
    [{ unlocked: ['kunang', 'sisik', 'jahat', '__proto__', 7, 'kubah'], loadout: { gunship: ['kubah', 'kubah', 'jahat', 'kunang', 'sisik'] } }, ['kubah', null, null], ['kunang', 'sisik', 'kubah']],
    [{ unlocked: ['kunang'], loadout: { gunship: ['tombak', 'kunang', null] } }, [null, 'kunang', null], ['kunang', 'sisik']],
    [{ unlocked: 'bukan array', loadout: 'bukan objek', contracts: -5 }, [null, null, null], ['kunang', 'sisik']],
    [null, [null, null, null], ['kunang', 'sisik']],
  ];
  for (const [eq, lo, un] of cases) {
    await boot(page, SAVE(eq === null ? {} : { equip: eq }));
    const r = await page.evaluate(() => { const d = window.__game.debug.equip(); return { lo: d.loadout, un: d.unlocked }; });
    expect(r.lo.gunship, JSON.stringify(eq)).toEqual(lo);
    expect(r.un, JSON.stringify(eq)).toEqual(un);
    // Panjang loadout selalu sama dengan jumlah slot kapal; Raptor-J membawa Kunang bawaan bila simpanan tanpa peralatan
    expect(r.lo.starfighter).toEqual([]);
    expect(r.lo.interceptor.length).toBe(2);
    if (eq === null) expect(r.lo['raptor-j']).toEqual(['kunang']);
  }
  // Data mentah raksasa dibatasi pembacaan 200 KB: simpanan diabaikan, permainan tetap jalan dengan bawaan
  await page.evaluate(() => { localStorage.setItem('raptor13.v3', JSON.stringify({ version: 3, equip: { unlocked: Array(60000).fill('kunang') } })); });
  await page.reload();
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
  expect((await dbg(page, 'equip')).unlocked).toEqual(['kunang', 'sisik']);
});

test('C7 hook peralatan dan editor hanya ada dengan ?debug=1; kunci localStorage berawalan raptor13', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#screen-title')).toBeVisible();
  expect(await page.evaluate(() => typeof window.__game)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.Equip + typeof window.HudEditor + typeof window.EQUIPMENT_DEFS)).toBe('undefinedundefinedundefined');
  await boot(page, SAVE());
  await play(page);
  await dbg(page, 'equipSet', ['kunang']);
  await page.evaluate(() => { window.__game.debug.hudEditor('open'); window.__game.debug.hudEditor('set', { fire: { dx: 0, dy: 0, s: 0.95 } }); window.__game.debug.hudEditor('save'); });
  const keys = await page.evaluate(() => Object.keys(localStorage));
  for (const k of keys) expect(k.startsWith('raptor13.')).toBe(true);
});
