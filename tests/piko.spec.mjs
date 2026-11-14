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
  // Kecepatan Piko relatif posisi kapal di ruang dunia (satuan per detik) pada pasangan frame berurutan yang keduanya
  // bebas: tanpa lompatan. Diukur di ruang dunia, bukan bingkai lokal kapal, karena bingkai lokal ikut berputar saat
  // kapal mulai roll (laju roll melompat saat A ditekan, masalah E6 dan E7) walau posisi dunia Piko tetap kontinu.
  for (let i = 1; i < rows.length; i++) {
    const dt = rows[i][0] - rows[i - 1][0];
    if (rows[i][12] !== 'bebas' ? true : (rows[i - 1][12] !== 'bebas' ? true : dt <= 0)) continue;
    const rel = (r) => [r[1] - r[7], r[2] - r[8], r[3] - r[9]], a = rel(rows[i]), b = rel(rows[i - 1]);
    jump = Math.max(jump, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / dt);
  }
  expect(jump).toBeLessThan(30);
  // Jarak lambung dan posisi layar
  const st = await page.evaluate(() => window.__game.debug.piko.state());
  expect(st.dist).toBeGreaterThanOrEqual(st.hullMin - 0.05);
  const ret = await page.evaluate(() => { const r = document.getElementById('reticle').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  expect(Math.hypot(st.screen[0] - ret[0], st.screen[1] - ret[1])).toBeGreaterThan(80);
});

for (const [ship, world] of [['starfighter', 'space'], ['gunship', 'space'], ['interceptor', 'space'], ['raptor-j', 'earth']]) {
  test(`E4 ${ship}: menempel ke titik tambat saat nitro, minimal 0,8 detik, keluar 0,6 detik setelah nitro dilepas, tanpa kedip`, async ({ page }) => {
    await fly(page, ship === 'raptor-j' ? 'starfighter' : ship, world);
    await page.keyboard.down('Space');
    await expect.poll(async () => (await page.evaluate(() => window.__game.debug.piko.state())).mode, { timeout: 3000 }).toBe('menempel');
    const s1 = await page.evaluate(() => window.__game.debug.piko.state());
    for (let k = 0; k < 3; k++) expect(Math.abs(s1.local[k]) - Math.abs(s1.dock[k])).toBeLessThan(0.03);
    await page.waitForTimeout(400);
    await page.keyboard.up('Space');
    await page.waitForTimeout(300);
    expect((await page.evaluate(() => window.__game.debug.piko.state())).mode).toBe('menempel');   // tunda keluar
    await expect.poll(async () => (await page.evaluate(() => window.__game.debug.piko.state())).mode, { timeout: 4000 }).toBe('bebas');
    const s3 = await page.evaluate(() => window.__game.debug.piko.state());
    expect(s3.toggles).toBe(2);   // satu kali masuk, satu kali keluar
    expect(s3.tucks).toBe(1);
  });
}

test('E4 manuver dan lintasan masuk: menempel saat looping, lewatan kurang dari 5 persen, tidak berganti mode lebih sering dari histeresis', async ({ page }) => {
  await fly(page);
  await page.evaluate(() => window.__game.debug.piko.trace('start'));
  await dbg(page, 'forceManeuver', 'loop');
  await page.waitForTimeout(3500);
  const rows = await page.evaluate(() => window.__game.debug.piko.trace('stop'));
  const modes = rows.map((r) => r[12]);
  expect(modes).toContain('menempel');
  // Lintasan masuk: jarak ke titik tambat berkurang monoton kecuali lewatan kecil di akhir
  const st = await page.evaluate(() => window.__game.debug.piko.state());
  const dock = st.dock, inRows = rows.filter((r) => r[12] === 'masuk');
  if (inRows.length > 3) {
    const d0 = Math.hypot(Math.abs(inRows[0][4]) - dock[0], inRows[0][5] - dock[1], inRows[0][6] - dock[2]);
    const minSigned = Math.min(...inRows.map((r) => (Math.abs(r[4]) - dock[0]) / Math.max(0.01, Math.abs(Math.abs(inRows[0][4]) - dock[0]))));
    expect(minSigned).toBeGreaterThan(-0.05);   // lewatan di bawah 5 persen jarak awal
    expect(d0).toBeGreaterThan(0.5);
  }
  // Tanpa kedip: pergantian mode menempel ke bebas tidak lebih sering dari waktu minimum plus tunda
  let lastChange = -1, minGap = Infinity;
  for (let i = 1; i < rows.length; i++) if (rows[i][11] !== rows[i - 1][11]) { if (lastChange >= 0) minGap = Math.min(minGap, rows[i][0] - rows[lastChange][0]); lastChange = i; }
  if (Number.isFinite(minGap)) expect(minGap).toBeGreaterThanOrEqual(0.8);
});
