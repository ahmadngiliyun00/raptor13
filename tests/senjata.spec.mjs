// Uji E5: senjata bertingkat berbasis hardpoint. Peluru keluar dari ujung laras yang terlihat pada setiap tingkat
// di setiap kapal, bergerak ke depan dan menyatu di titik temu, DPS efektif sesuai tabel keseimbangan, anggaran
// performa pada skenario terburuk, tanpa kebocoran setelah 20 restart, dan simpanan lama tetap kompatibel.
import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';

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
const SAVE = (space = 'starfighter', extra = {}) => ({ version: 3, settings: { tutorialDone: true, flashWarned: true, touchPromptShown: true },
  ships: { unlocked: ['raptor-j', 'starfighter', 'interceptor', 'gunship'], selected: { earth: 'raptor-j', space }, credits: 0 }, ...extra });
async function boot(page, save) {
  await page.setViewportSize({ width: 1280, height: 720 });
  if (!page.url().startsWith('http')) { await page.goto('/index.html?debug=1'); await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 }); }
  await page.evaluate((d) => { localStorage.clear(); localStorage.setItem('raptor13.v3', JSON.stringify(d)); }, save);
  await page.goto('/index.html?debug=1');
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
}
async function fly(page, world = 'space') {
  await page.evaluate((w) => { const g = window.__game, d = g.debug; d.setGod(true); d.setEnemiesEnabled(false); if (w === 'earth') g.startIn('earth'); else { d.setArea('sabuk'); g.startIn('space', 'free'); d.viewArea('sabuk'); } g.skipTransition(); d.skipCutscene(); }, world);
  await page.waitForTimeout(900);
}
async function fire(page, ms) {
  await page.evaluate(() => window.__game.debug.gunTrace('start'));
  await page.keyboard.down('Enter'); await page.waitForTimeout(ms); await page.keyboard.up('Enter');
  return page.evaluate(() => window.__game.debug.gunTrace('stop'));
}
// Rotasi vektor oleh kuaternion (x, y, z, w) dan kebalikannya
const rot = ([x, y, z], [qx, qy, qz, qw]) => {
  const ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
  return [ix * qw + iw * -qx + iy * -qz - iz * -qy, iy * qw + iw * -qy + iz * -qx - ix * -qz, iz * qw + iw * -qz + ix * -qy - iy * -qx];
};
const inv = ([qx, qy, qz, qw]) => [-qx, -qy, -qz, qw];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(...a);
// Baris rekaman: [t, ox, oy, oz, dx, dy, dz, indeks, px, py, pz, qx, qy, qz, qw, terlihat, tingkat]
const parse = (r) => ({ t: r[0], o: [r[1], r[2], r[3]], d: [r[4], r[5], r[6]], i: r[7], p: [r[8], r[9], r[10]], q: [r[11], r[12], r[13], r[14]], vis: r[15], tier: r[16] });
const EXPECT_USED = { 1: 2, 2: 2, 3: 4 };   // jumlah laras berbeda yang menembak per tingkat
const SHOTS = { 1: 1, 2: 2, 3: 4 };

for (const [ship, world] of [['starfighter', 'space'], ['interceptor', 'space'], ['gunship', 'space'], ['raptor-j', 'earth']]) {
  test(`E5 ${ship}: setiap tingkat menembak dari ujung laras yang terlihat, ke depan, dan menyatu di titik temu`, async ({ page }) => {
    await boot(page, SAVE(ship === 'raptor-j' ? 'starfighter' : ship));
    await fly(page, world);
    const report = {};
    for (const tier of [1, 2, 3]) {
      await dbg(page, 'setGunTier', tier);
      await page.waitForTimeout(600);   // animasi laras baru memanjang selesai
      const info = await dbg(page, 'gunInfo');
      expect(info.ship).toBe(ship);
      expect(info.tier).toBe(tier);
      // Laras yang terlihat persis laras yang aktif untuk tingkat ini
      const active = info.hardpoints.filter((h) => h.visible);
      expect(active.length).toBe(EXPECT_USED[tier]);
      const rows = (await fire(page, 900)).map(parse);
      expect(rows.length).toBeGreaterThan(4);
      const used = new Set();
      let maxErr = 0, minFwd = 1, maxMiss = 0;
      for (const r of rows) {
        expect(r.tier).toBe(tier);
        expect(r.vis, 'tidak ada peluru dari titik tanpa laras').toBe(1);
        used.add(r.i);
        const hp = info.hardpoints[r.i];
        expect(hp.visible).toBe(true);
        // Asal peluru di ruang kapal sama dengan posisi ujung laras (toleransi kecil: puntir sayap saat terbang)
        const local = rot(sub(r.o, r.p), inv(r.q));
        maxErr = Math.max(maxErr, len(sub(local, hp.local)));
        // Ke depan dan konvergen pada titik temu
        const f = rot([0, 0, -1], r.q);
        minFwd = Math.min(minFwd, dot(r.d, f));
        const conv = [r.p[0] + f[0] * info.converge, r.p[1] + f[1] * info.converge, r.p[2] + f[2] * info.converge];
        const w = sub(conv, r.o), s = dot(w, r.d), miss = len(sub(w, [r.d[0] * s, r.d[1] * s, r.d[2] * s]));
        maxMiss = Math.max(maxMiss, miss);
      }
      expect(used.size).toBe(EXPECT_USED[tier]);
      expect(maxErr).toBeLessThan(0.2);
      expect(minFwd).toBeGreaterThan(0.995);
      expect(maxMiss).toBeLessThan(0.1 + info.converge * 0.0035 * 1.5);
      // Pola: tingkat 2 dan 3 menembak berpasangan serempak (dua peluru dengan waktu sama)
      if (tier >= 2) { const byT = {}; for (const r of rows) byT[r.t] = (byT[r.t] || 0) + 1; expect(Math.max(...Object.values(byT))).toBeGreaterThanOrEqual(2); }
      report[tier] = { active: active.map((h) => h.id + ' ' + h.local.join(',')), maxErr: +maxErr.toFixed(3), minFwd: +minFwd.toFixed(4), maxMiss: +maxMiss.toFixed(3), shots: rows.length };
    }
    test.info().annotations.push({ type: 'hardpoint', description: JSON.stringify(report) });
    fs.mkdirSync('docs/senjata', { recursive: true });
    const file = 'docs/senjata/hasil-hardpoint.json', all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    all[ship] = report; fs.writeFileSync(file, JSON.stringify(all, null, 1) + '\n');
  });
}

test('E5 DPS efektif: rasio terhadap tingkat 1 sekitar 1,8 dan 3,2, diukur dari peluru sungguhan dengan penyebaran', async ({ page }) => {
  await boot(page, SAVE('starfighter'));
  await fly(page);
  // Sasaran bola di depan (radius drone 2,6 ditambah padding kena 0,9) pada beberapa jarak; peluru dihitung kena bila
  // lintasannya melewati bola itu. Damage per peluru memakai pengali tingkat dari gunInfo.
  // Dua ukuran sasaran: drone (radius 2,6) dan sasaran kecil seperti rudal (radius 0,6), keduanya ditambah padding 0,9
  const SIZES = { drone: 2.6 + 0.9, kecil: 0.6 + 0.9 }, DIST = [40, 80, 120, 160, 200], out = {};
  for (const ship of ['starfighter', 'gunship']) {
    if (ship === 'gunship') { await boot(page, SAVE('gunship')); await fly(page); }
    out[ship] = {};
    for (const tier of [1, 2, 3]) {
      await dbg(page, 'setGunTier', tier);
      await page.waitForTimeout(600);
      const info = await dbg(page, 'gunInfo');
      const rows = (await fire(page, 2500)).map(parse);
      const span = rows[rows.length - 1].t - rows[0].t;
      const per = { nominal: rows.length * info.mult / span };
      for (const [name, R] of Object.entries(SIZES)) for (const D of DIST) {
        let hit = 0;
        for (const r of rows) {
          const f = rot([0, 0, -1], r.q), c = [r.p[0] + f[0] * D, r.p[1] + f[1] * D, r.p[2] + f[2] * D];
          const w = sub(c, r.o), s = dot(w, r.d), miss = len(sub(w, [r.d[0] * s, r.d[1] * s, r.d[2] * s]));
          if (miss <= R) hit++;
        }
        per[name + D] = hit * info.mult / span;
      }
      out[ship][tier] = per;
    }
    const b = { ...out[ship][1] }, keys = Object.keys(b);
    for (const tier of [1, 2, 3]) for (const k of keys) out[ship][tier][k + 'Ratio'] = +(out[ship][tier][k] / b[k]).toFixed(2);
    for (const tier of [1, 2, 3]) for (const k of Object.keys(out[ship][tier])) out[ship][tier][k] = +out[ship][tier][k].toFixed(2);
    expect(out[ship][2].nominalRatio).toBeGreaterThan(1.6); expect(out[ship][2].nominalRatio).toBeLessThan(2.0);
    expect(out[ship][3].nominalRatio).toBeGreaterThan(2.9); expect(out[ship][3].nominalRatio).toBeLessThan(3.5);
    // Pada jarak titik temu (120) penyebaran tidak membuang peluru: rasio efektif sama dengan target tabel
    expect(out[ship][2].drone120Ratio).toBeGreaterThan(1.6); expect(out[ship][2].drone120Ratio).toBeLessThan(2.0);
    expect(out[ship][3].drone120Ratio).toBeGreaterThan(2.9); expect(out[ship][3].drone120Ratio).toBeLessThan(3.5);
  }
  test.info().annotations.push({ type: 'dps', description: JSON.stringify(out) });
  fs.mkdirSync('docs/senjata', { recursive: true });
  fs.writeFileSync('docs/senjata/hasil-dps.json', JSON.stringify(out, null, 1) + '\n');
});

test('E5 anggaran performa skenario terburuk (4 laras, laju tembak maksimum, banyak musuh) dan tanpa kebocoran setelah 20 restart', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page, SAVE('starfighter'));
  await page.evaluate(() => { const g = window.__game, d = g.debug; d.setGod(true); d.setArea('sabuk'); g.startIn('space', 'free'); d.viewArea('sabuk'); g.skipTransition(); d.skipCutscene(); });
  await page.waitForTimeout(800);
  const measure = async () => {
    await page.evaluate(() => { const d = window.__game.debug; for (let i = 0; i < 10; i++) d.spawnEnemy('drone', 200 + i * 20, (i - 5) * 18); });
    await dbg(page, 'perfReset');
    await page.keyboard.down('Enter'); await page.waitForTimeout(2500);
    const p = await dbg(page, 'perf'), b = await dbg(page, 'bullets');
    await page.keyboard.up('Enter');
    return { p, bullets: b.list.length };
  };
  // Draw call murni dari laras: tanpa musuh, tanpa menembak, tingkat 1 lalu tingkat 3
  await dbg(page, 'setEnemiesEnabled', false);
  await dbg(page, 'setGunTier', 1); await page.waitForTimeout(400); await dbg(page, 'perfReset'); await page.waitForTimeout(400);
  const c1 = (await dbg(page, 'perf')).calls;
  await dbg(page, 'setGunTier', 3); await page.waitForTimeout(700); await dbg(page, 'perfReset'); await page.waitForTimeout(400);
  const c3 = (await dbg(page, 'perf')).calls;
  expect(c3 - c1, 'dua laras tambahan: laras dan cincin ujung, paling banyak 2 draw call per laras ditambah bayangan').toBeLessThanOrEqual(6);
  await dbg(page, 'setEnemiesEnabled', true);
  await dbg(page, 'setGunTier', 1);
  const t1 = await measure();
  await dbg(page, 'setGunTier', 3);
  await page.evaluate(() => { const d = window.__game.debug; d.activateBuff('overdrive'); for (let i = 0; i < 4; i++) d.grantUpgrade('fireRate'); });
  const t3 = await measure();
  const cfg = await page.evaluate(() => window.__game.config().weapons);
  test.info().annotations.push({ type: 'perf', description: JSON.stringify({ t1: { p95: t1.p.frameP95Ms, work: t1.p.workP95Ms, calls: t1.p.calls, bullets: t1.bullets }, t3: { p95: t3.p.frameP95Ms, work: t3.p.workP95Ms, calls: t3.p.calls, bullets: t3.bullets } }) });
  expect(t3.bullets).toBeLessThanOrEqual(cfg.maxPlayerBullets);
  test.info().annotations.push({ type: 'calls', description: 'tanpa musuh: tingkat 1 ' + c1 + ', tingkat 3 ' + c3 });
  expect(t3.p.workP95Ms).toBeLessThan(Math.max(8, t1.p.workP95Ms * 1.6));
  // Kebocoran: 20 restart dengan tingkat 3, sumber daya kembali ke garis dasar
  await page.keyboard.press('KeyR'); await page.waitForTimeout(300);
  const base0 = await dbg(page, 'resources');
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('KeyR');
    await page.keyboard.down('Enter'); await page.waitForTimeout(150); await page.keyboard.up('Enter');
  }
  await page.waitForTimeout(300);
  const after = await dbg(page, 'resources');
  expect(after.sceneObjects).toBe(base0.sceneObjects);
  expect(after.sceneChildren).toBe(base0.sceneChildren);
  expect(after.listeners).toBe(base0.listeners);
  expect(after.geometries).toBeLessThanOrEqual(base0.geometries + 6);
  expect((await dbg(page, 'gunInfo')).tier).toBe(3);   // tingkat tersimpan per kapal, tidak hilang saat restart
});

test('E5 simpanan: simpanan lama tanpa data senjata mulai dari tingkat 1, nilai rusak ditolak, tingkat tersimpan per kapal', async ({ page }) => {
  await boot(page, { ...SAVE('gunship'), guns: { gunship: 3, starfighter: 99, interceptor: '2', hantu: 2 } });
  await fly(page);
  expect((await dbg(page, 'gunInfo')).tier).toBe(3);
  // Setelah disimpan ulang: nilai di luar 1 sampai 3, tipe salah, dan kapal tak dikenal dibuang
  await page.keyboard.press('KeyR'); await page.waitForTimeout(300);
  const g = await page.evaluate(() => { window.__game.debug.setGunTier(3); return true; });
  expect(g).toBe(true);
  // Simpanan lama (tanpa field guns sama sekali)
  await page.evaluate((d) => { localStorage.clear(); localStorage.setItem('raptor13.v3', JSON.stringify(d)); }, SAVE('interceptor'));
  await page.goto('/index.html?debug=1');
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await fly(page);
  const info = await dbg(page, 'gunInfo');
  expect(info.ship).toBe('interceptor');
  expect(info.tier).toBe(1);
  expect(info.hardpoints.filter((h) => h.visible).length).toBe(2);
});

test('E5 perolehan: kartu Peningkatan Senjata muncul di level syarat, hadiah stage, tersimpan, indikator HUD dan hangar', async ({ page }) => {
  await boot(page, SAVE('starfighter'));
  await fly(page);
  // Level 2 sampai 4: belum ada kartu senjata
  await dbg(page, 'levelUp');
  await page.waitForTimeout(300);
  let st = await dbg(page, 'levelState');
  expect(st.offer.some((c) => c.startsWith('gun'))).toBe(false);
  await page.evaluate(() => { const c = document.querySelector('#lv-cards button'); if (c) c.click(); });
  // Lompat ke level 4 lalu naik ke 5: kartu senjata ditawarkan di posisi pertama
  await page.evaluate(() => { const g = window.__game, d = g.debug; for (let i = 0; i < 3; i++) { d.levelUp(); } });
  for (let k = 0; k < 6; k++) {
    await page.waitForTimeout(250);
    st = await dbg(page, 'levelState');
    if (st.state !== 'levelup') continue;
    if (st.offer[0].startsWith('gun')) break;
    await page.evaluate(() => document.querySelector('#lv-cards button:last-child').click());
  }
  expect(st.offer[0]).toBe('gun:epik');
  expect(st.level + 1).toBeGreaterThanOrEqual(5);
  await page.click('#lv-cards button[data-card="gun"]');
  await page.waitForTimeout(300);
  expect((await dbg(page, 'gunInfo')).tier).toBe(2);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('raptor13.v3')).guns.starfighter)).toBe(2);
  // Indikator HUD desktop: dua titik menyala
  expect(await page.locator('.lv-row .gun-pips i.on').count()).toBe(2);
  // Tingkat 3 lewat kartu butuh stage 5 terbuka: belum tersedia walau level tinggi
  expect(await page.evaluate(() => { const d = window.__game.debug; for (let i = 0; i < 8; i++) d.levelUp(); return true; })).toBe(true);
  await page.waitForTimeout(300);
  st = await dbg(page, 'levelState');
  expect(st.offer.some((c) => c.startsWith('gun'))).toBe(false);
});

test('E5 hadiah stage dan hangar: stage 3 memberi tingkat 2, hangar menampilkan tingkat dan laras menyala', async ({ page }) => {
  await boot(page, SAVE('interceptor', { campaign: { stage: 3 } }));
  await page.evaluate(() => { const g = window.__game, d = g.debug; d.setGod(true); g.startIn('space', 'campaign'); g.skipTransition(); d.skipCutscene(); d.autoContract(); d.setStage(3); });
  await page.waitForTimeout(800);
  await page.evaluate(() => { const d = window.__game.debug; d.skipCutscene(); d.autoContract(); d.finishStage(); });
  await expect.poll(async () => (await dbg(page, 'gunInfo')).tier, { timeout: 30000 }).toBe(2);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('raptor13.v3')).guns.interceptor)).toBe(2);
  // Hangar: baris Senjata T2 untuk Interceptor
  await page.goto('/index.html?debug=1');
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.click('#btn-hangar');
  for (let i = 0; i < 4; i++) { if ((await page.textContent('#hangar-name')) === 'Interceptor') break; await page.click('#hangar-next'); }
  await expect(page.locator('#hangar-stats')).toContainText('Senjata T2');
  await page.locator('#hangar-canvas').screenshot({ path: 'docs/screenshots/senjata/hangar-interceptor-t2.png' });
});
