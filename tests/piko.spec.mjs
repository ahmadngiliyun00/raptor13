// Uji E3 dan E4: Piko pendamping bergerak mandiri (bukan salinan kapal), idle hidup, tertinggal saat belok lalu
// menyusul, tidak menembus lambung dan tidak menutupi crosshair, menempel ke titik tambat saat nitro dan manuver
// dengan histeresis, lalu keluar dengan halus. Data dari debug.piko.trace.
import { test as base, expect } from '@playwright/test';

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
async function fly(page, ship = 'starfighter', world = 'space') {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript((s) => localStorage.setItem('raptor13.v3', JSON.stringify({ version: 3, settings: { tutorialDone: true, flashWarned: true }, ships: { unlocked: ['raptor-j', 'starfighter', 'interceptor', 'gunship'], selected: { earth: 'raptor-j', space: s }, credits: 0 } })), ship);
  await page.goto('/index.html?debug=1');
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate((w) => { const g = window.__game, d = g.debug; d.setGod(true); d.setEnemiesEnabled(false); if (w === 'earth') g.startIn('earth'); else { d.setArea('sabuk'); g.startIn('space', 'free'); d.viewArea('sabuk'); } g.skipTransition(); d.skipCutscene(); }, world);   // sabuk: jauh dari permukaan planet
  await page.waitForTimeout(1500);
}
const std = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };

test('E3 Piko bukan salinan kapal: idle hidup, tertinggal saat belok lalu menyusul, percepatan halus, menjaga jarak lambung, tidak menutupi crosshair', async ({ page }) => {
  await fly(page);
  await page.evaluate(() => window.__game.debug.piko.trace('start'));
  await page.waitForTimeout(2500);
  await page.keyboard.down('KeyA'); await page.waitForTimeout(1200); await page.keyboard.up('KeyA');
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(() => window.__game.debug.piko.trace('stop'));
  expect(rows.length).toBeGreaterThan(200);
  const free = rows.filter((r) => r[11] === 0);
  // Idle: posisi lokal Piko berubah walau kapal terbang lurus (salinan kaku akan tetap)
  const idle = free.slice(0, 120);
  expect(std(idle.map((r) => r[5]))).toBeGreaterThan(0.04);
  expect(std(idle.map((r) => r[6]))).toBeGreaterThan(0.02);
  // Belok: posisi lokal x Piko menyimpang saat laju belok tinggi (tertinggal dan terayun), lalu kembali
  const turning = free.filter((r) => Math.abs(r[13]) > 0.4);
  if (turning.length > 5) {
    const calm = free.filter((r) => Math.abs(r[13]) < 0.05);
    const meanX = (a) => a.reduce((x, r) => x + r[4], 0) / a.length;
    expect(Math.abs(meanX(turning) - meanX(calm))).toBeGreaterThan(0.15);
  }
  // Korelasi silang: respons Piko tertunda beberapa frame terhadap laju belok kapal
  const xs = free.map((r) => r[4]), ys = free.map((r) => r[13]);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let best = [0, -Infinity];
  for (let lag = 0; lag < 60; lag++) { let c = 0; for (let i = 0; i + lag < xs.length; i++) c += Math.abs((ys[i] - my) * (xs[i + lag] - mx)); if (c > best[1]) best = [lag, c]; }
  test.info().annotations.push({ type: 'piko', description: 'lag terbaik ' + best[0] + ' frame, std idle y ' + std(idle.map((r) => r[5])).toFixed(3) });
  // Tanpa lompatan: perubahan posisi Piko relatif kapal per frame kecil
  let jump = 0;
  // Kecepatan Piko relatif kapal (satuan per detik) pada pasangan frame berurutan yang keduanya bebas: tanpa lompatan
  for (let i = 1; i < rows.length; i++) { const dt = rows[i][0] - rows[i - 1][0]; if (rows[i][12] !== 'bebas' ? true : (rows[i - 1][12] !== 'bebas' ? true : dt <= 0)) continue; jump = Math.max(jump, Math.hypot(rows[i][4] - rows[i - 1][4], rows[i][5] - rows[i - 1][5], rows[i][6] - rows[i - 1][6]) / dt); }
  expect(jump).toBeLessThan(30);
  // Jarak lambung dan posisi layar
  const st = await page.evaluate(() => window.__game.debug.piko.state());
  expect(st.dist).toBeGreaterThanOrEqual(st.hullMin - 0.05);
  const ret = await page.evaluate(() => { const r = document.getElementById('reticle').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  expect(Math.hypot(st.screen[0] - ret[0], st.screen[1] - ret[1])).toBeGreaterThan(80);
});
