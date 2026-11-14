// Uji E9: kehalusan penerbangan. Semua skenario diagnosis E6 (termasuk Putar Balik U E8) dijalankan dengan langkah
// tetap 60 FPS di Starfighter dan Raptor-J; setiap metrik harus di bawah ambang yang ditetapkan di
// docs/penerbangan/diagnosis-halus.md (lonjakan orientasi, percepatan dan hentakan sudut, flip kamera).
import { test as base, expect } from '@playwright/test';
import { metrics, SCENARIOS, THRESH } from './penerbangan/diagnosis.mjs';

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

for (const [ship, world] of [['starfighter', 'space'], ['raptor-j', 'earth']]) {
  test(`E9 kehalusan ${ship}: semua skenario E6 dan Balik U di bawah ambang`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(() => localStorage.setItem('raptor13.v3', JSON.stringify({ version: 3, settings: { tutorialDone: true, flashWarned: true, touchPromptShown: true }, ships: { unlocked: ['raptor-j', 'starfighter'], selected: { earth: 'raptor-j', space: 'starfighter' }, credits: 0 } })));
    await page.goto('/index.html?debug=1');
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate((w) => { const g = window.__game, d = g.debug; d.setGod(true); d.setEnemiesEnabled(false); if (w === 'earth') g.startIn('earth'); else { d.setArea('sabuk'); g.startIn('space', 'free'); d.viewArea('sabuk'); } g.skipTransition(); d.skipCutscene(); if (w !== 'earth') { d.setAsteroidDensity(0); d.clearAsteroids(); } }, world);
    await page.waitForTimeout(800);
    const cols = await page.evaluate(() => window.__game.debug.flightColumns());
    const table = {};
    for (const [name, sc] of Object.entries(SCENARIOS)) {
      const rows = await page.evaluate(([segs, y]) => window.__game.debug.flightRun(segs, { y, noCollide: true }), [sc.segs, world === 'earth' ? 230 : undefined]);
      const m = metrics(rows, cols);
      table[name] = m.worst;
      expect(m.flagged, `${name}: ${JSON.stringify(m.flagged.slice(0, 3))}`).toEqual([]);
      // Tidak ada flip kamera dan percepatan di luar manuver di bawah batas
      expect(m.worst.camUp).toBeLessThan(THRESH.camFlipDeg);
      expect(m.worst.accel).toBeLessThanOrEqual(THRESH.accel);
    }
    test.info().annotations.push({ type: 'metrik', description: JSON.stringify(table) });
  });
}
