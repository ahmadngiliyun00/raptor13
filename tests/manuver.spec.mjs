// Uji E8: manuver Putar Balik U. Panjang jalur, durasi, perubahan arah 180 plus minus 10 derajat, bank maksimum,
// tanpa lonjakan orientasi (metrik E6), tabrakan tetap bekerja, kecepatan keluar wajar, kontrol keyboard (V dengan
// arah dari A atau D) dan sentuh (tombol Balik), Piko menempel, bot terampil memakai Balik U, dan rekaman berurutan.
import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import { metrics } from './penerbangan/diagnosis.mjs';

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
const snap = (page) => page.evaluate(() => window.__game.snapshot());
async function fly(page, { world = 'space', hp = false, w = 1280, h = 720 } = {}) {
  await page.setViewportSize({ width: w, height: h });
  await page.addInitScript((m) => localStorage.setItem('raptor13.v3', JSON.stringify({ version: 3, settings: { tutorialDone: true, flashWarned: true, touchPromptShown: true, a2hsHintShown: true, ...(m ? { controlMode: 'hp' } : {}) }, ships: { unlocked: ['raptor-j', 'starfighter'], selected: { earth: 'raptor-j', space: 'starfighter' }, credits: 0 } })), hp);
  await page.goto('/index.html?debug=1');
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate((wd) => { const g = window.__game, d = g.debug; g.setSeed(99); d.setGod(true); d.setEnemiesEnabled(false); if (wd === 'earth') g.startIn('earth'); else { d.setArea('sabuk'); g.startIn('space', 'free'); d.viewArea('sabuk'); } g.skipTransition(); d.skipCutscene(); d.setAsteroidDensity(0); d.clearAsteroids(); }, world);
  await page.waitForTimeout(1800);   // kebal awal dan penstabil
}
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

for (const [ship, world] of [['starfighter', 'space'], ['raptor-j', 'earth']]) {
  test(`E8 ${ship}: Balik U kanan dan kiri, 180 plus minus 10 derajat, durasi, bank, jalur, kecepatan keluar, tanpa lonjakan`, async ({ page }) => {
    await fly(page, { world });
    const cols = await dbg(page, 'flightColumns');
    const out = {};
    for (const dir of [-1, 1]) {
      const y = world === 'earth' ? 150 : undefined;
      const rows = await dbg(page, 'flightRun', [[0.4, 0, 0], [0.01, 0, 0, 'uturn', dir], [2.6, 0, 0]], { y, noCollide: true });
      const info = await dbg(page, 'uturnInfo');
      const m = metrics(rows, cols);
      out[dir] = { ...info, worst: m.worst, flagged: m.flagged.length };
      expect(info.turnDeg).toBeGreaterThan(170); expect(info.turnDeg).toBeLessThan(190);
      expect(info.dur).toBeGreaterThanOrEqual(1.6); expect(info.dur).toBeLessThanOrEqual(2.4);
      expect(info.maxBankDeg).toBeGreaterThanOrEqual(68); expect(info.maxBankDeg).toBeLessThanOrEqual(82);
      // Jalur: kecepatan kali durasi (pesawat selalu maju), kecepatan keluar wajar (tidak berhenti, tidak melonjak)
      const C = Object.fromEntries(cols.map((c, i) => [c, i])), v0 = rows[20][C.speed];
      expect(info.path).toBeGreaterThan(v0 * info.dur * 0.8); expect(info.path).toBeLessThan(v0 * info.dur * 1.25);
      expect(info.exitSpeed).toBeGreaterThan(v0 * 0.8); expect(info.exitSpeed).toBeLessThan(v0 * 1.25);
      // Arah: dir -1 berbelok ke kanan layar (heading berkurang), dir 1 ke kiri; perubahan heading searah tanda dir
      const yawA = rows[20][C.yaw_deg] * Math.PI / 180, yawMid = rows[20 + 60][C.yaw_deg] * Math.PI / 180;
      expect(Math.sign(wrap(yawMid - yawA))).toBe(dir);
      // Tanpa lonjakan orientasi (metrik dan ambang E6)
      expect(m.flagged, JSON.stringify(m.flagged.slice(0, 3))).toEqual([]);
    }
    test.info().annotations.push({ type: 'balik-u', description: JSON.stringify(out) });
    fs.mkdirSync('docs/penerbangan', { recursive: true });
    const file = 'docs/penerbangan/hasil-balik-u.json', all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    all[ship] = out; fs.writeFileSync(file, JSON.stringify(all, null, 1) + '\n');
  });
}

test('E8 keyboard: V dengan D berbelok searah D, V dengan A searah A, tanpa input ke kanan layar; cooldown; Piko menempel', async ({ page }) => {
  await fly(page);
  // Arah belok D: tahan D sebentar dan lihat tanda perubahan heading
  const y0 = (await snap(page)).yaw;
  await page.keyboard.down('KeyD'); await page.waitForTimeout(500);
  const yD = (await snap(page)).yaw;
  const signD = Math.sign(wrap(yD - y0));
  await page.keyboard.press('KeyV');
  await page.keyboard.up('KeyD');
  let s = await snap(page);
  expect(s.maneuver).toBe('uturn');
  await page.waitForTimeout(400);
  const pk = await page.evaluate(() => window.__game.debug.piko.state());
  expect(['masuk', 'menempel']).toContain(pk.mode);   // Piko menempel selama manuver
  await page.waitForTimeout(2000);
  const u1 = await dbg(page, 'uturnInfo');
  expect(u1.dir).toBe(signD);
  expect(u1.turnDeg).toBeGreaterThan(170);
  s = await snap(page);
  expect(s.cooldowns.uturn).toBeGreaterThan(0);
  await page.keyboard.press('KeyV');
  expect((await snap(page)).maneuver).toBe(null);   // masih cooldown
  // Tanpa input dan tanpa ancaman: ke kanan layar (dir -1)
  expect(await dbg(page, 'uturnDir', 0)).toBe(-1);
  // A: searah A
  await page.waitForTimeout(3200);
  await page.keyboard.down('KeyA'); await page.waitForTimeout(150);
  await page.keyboard.press('KeyV');
  await page.keyboard.up('KeyA');
  await page.waitForTimeout(2300);
  expect((await dbg(page, 'uturnInfo')).dir).toBe(-signD);
});

test('E8 arah otomatis: bos di belakang kanan membuat Balik U ke kanan, di kiri ke kiri', async ({ page }) => {
  await fly(page);
  await page.evaluate(() => { const d = window.__game.debug; d.startBoss('hunter'); d.skipCutscene(); });
  await page.waitForTimeout(400);
  // Bos diletakkan di belakang kanan lalu belakang kiri (placeBoss: lateral, dy, jarak; jarak negatif = belakang)
  await dbg(page, 'placeBoss', 120, 0, -300);
  const right = await dbg(page, 'uturnDir', 0);
  await dbg(page, 'placeBoss', -120, 0, -300);
  const left = await dbg(page, 'uturnDir', 0);
  expect(right).toBe(-1);
  expect(left).toBe(1);
});

test('E8 tabrakan tetap bekerja: batu diam di puncak lengkung Balik U tertabrak', async ({ page }) => {
  await fly(page);
  const r = await dbg(page, 'uturnObstacleTest', -1, 4);
  test.info().annotations.push({ type: 'tabrakan', description: JSON.stringify(r) });
  expect(r.hits).toBeGreaterThanOrEqual(1);
  expect(r.apexDist).toBeGreaterThan(40);
});

test('E8 sentuh: tombol Balik memberi Balik U, joystick didorong ke atas memberi Balik vertikal; tata letak tetap', async ({ page }) => {
  await fly(page, { hp: true, w: 844, h: 390 });
  const btn = page.locator('#touch .t-imm');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute('data-man', 'uturn');
  await btn.dispatchEvent('pointerdown', { pointerId: 7, isPrimary: true, button: 0, pointerType: 'touch' });
  expect((await snap(page)).maneuver).toBe('uturn');
  await btn.dispatchEvent('pointerup', { pointerId: 7, isPrimary: true, button: 0, pointerType: 'touch' });
  await page.waitForTimeout(2300);
  // Joystick didorong ke atas: Balik vertikal (Immelmann) lama
  await dbg(page, 'touchJoy', 0, -0.9);
  await page.waitForTimeout(100);
  await btn.dispatchEvent('pointerdown', { pointerId: 8, isPrimary: true, button: 0, pointerType: 'touch' });
  expect((await snap(page)).maneuver).toBe('immelmann');
  await btn.dispatchEvent('pointerup', { pointerId: 8, isPrimary: true, button: 0, pointerType: 'touch' });
  await page.waitForTimeout(2200);
  // Joystick ke samping: Balik U searah belok joystick
  await dbg(page, 'touchJoy', 0.9, 0);
  await page.waitForTimeout(3200);   // cooldown Balik U habis
  await btn.dispatchEvent('pointerdown', { pointerId: 9, isPrimary: true, button: 0, pointerType: 'touch' });
  expect((await snap(page)).maneuver).toBe('uturn');
  await dbg(page, 'touchJoy', null);
  // Tanpa tombol baru di busur: jumlah tombol manuver tetap tiga
  expect(await page.locator('#touch .t-man').count()).toBe(3);
});

test('E8 bot terampil memakai Balik U setelah melewati bos', async ({ page }) => {
  test.setTimeout(240_000);
  await fly(page);
  const r = await page.evaluate(() => window.__game.debug.bossSim('hunter', 90, { bot: 'terampil', seed: 3, difficulty: 'normal' }));
  test.info().annotations.push({ type: 'bot', description: JSON.stringify({ uturns: r.uturns, overshoots: r.overshoots, time: r.time }) });
  expect(r.uturns).toBeGreaterThan(0);
});

test('E8 desktop: strip manuver menampilkan V BALIK U, indikator BOS DI BELAKANG memberi saran V; rekaman berurutan', async ({ page }) => {
  await fly(page);
  await expect(page.locator('#maneuvers .man[data-man="uturn"]')).toContainText('BALIK U');
  await expect(page.locator('#boss-rear .br-key')).toHaveText('V');
  fs.mkdirSync('docs/screenshots/manuver', { recursive: true });
  await page.keyboard.press('KeyV');
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(380);
    await page.screenshot({ path: `docs/screenshots/manuver/balik-u-${i + 1}.jpg`, quality: 70 });
  }
});
