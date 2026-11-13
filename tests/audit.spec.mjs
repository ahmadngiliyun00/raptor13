// Uji audit (A3, A2, A5, A7): keamanan, ketahanan, performa, dan regresi blok A.
// Jalankan: npx playwright test tests/audit.spec.mjs
import { test as base, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const gameUrl = (q = '') => { const p = new URLSearchParams(String(q).replace(/^\?/, '')); p.set('debug', '1'); return '/index.html?' + p.toString(); };
const isDriverNoise = (text) => /GL Driver Message|GPU stall due to ReadPixels/.test(text);
// Setelah konteks WebGL pulih, Three.js menghapus objek GL milik konteks lama (bukan galat game)
const isRestoreNoise = (text) => /object does not belong to this context/.test(text);

// Fixture: console bersih (termasuk pelanggaran CSP), tanpa permintaan keluar, baterai penguji diabaikan
const test = base.extend({
  allowRestoreNoise: [false, { option: true }],
  page: async ({ page, allowRestoreNoise }, use) => {
    await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ } });
    const problems = [], external = [];
    page.on('console', (m) => {
      if (!['error', 'warning'].includes(m.type())) return;
      if (isDriverNoise(m.text())) return;
      if (allowRestoreNoise ? isRestoreNoise(m.text()) : false) return;
      problems.push(`${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('request', (r) => {
      const url = r.url();
      if (url.startsWith('data:') ? true : url.startsWith('blob:')) return;
      const host = new URL(url).hostname;
      if (host === 'localhost' ? false : host !== '127.0.0.1') external.push(url);
    });
    await use(page);
    expect(problems, 'console harus bersih').toEqual([]);
    expect(external, 'tidak boleh ada permintaan ke luar').toEqual([]);
  },
});

const dbg = (page, fn, ...args) => page.evaluate(([f, a]) => window.__game.debug[f](...a), [fn, args]);
const snap = (page) => page.evaluate(() => window.__game.snapshot());
async function open(page, query = '') {
  await page.goto(gameUrl(query));
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
}
async function play(page, world = 'space') {
  await open(page);
  await page.keyboard.press('Shift');   // aktivasi pengguna: AudioContext dibuat
  await page.evaluate((w) => { const g = window.__game; g.setSeed(77); g.debug.setGod(true); g.debug.setEnemiesEnabled(false); g.startIn(w, 'free'); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); }, world);
  await expect.poll(async () => (await snap(page)).state).toBe('playing');
}

// ---------- keamanan ----------
test('A3: hook debug, pratinjau, dan galeri terkunci tanpa ?debug=1', async ({ page }) => {
  await page.goto('/index.html?jetpreview=1');
  await expect(page.locator('#screen-title')).toBeVisible();
  expect(await page.evaluate(() => typeof window.__game)).toBe('undefined');
  expect(await page.evaluate(() => typeof window.__jetPreview)).toBe('undefined');
  await page.goto('/index.html?debug=0');
  await expect(page.locator('#screen-title')).toBeVisible();
  expect(await page.evaluate(() => typeof window.__game)).toBe('undefined');
});

test('A3: parameter query berbahaya diabaikan tanpa galat', async ({ page }) => {
  const bad = [
    '?safearea=<img src=x onerror=alert(1)>', '?safearea=1e309,0,0,0', '?safearea=9999,0,0,0', '?kualitas=__proto__',
    '?kualitas=constructor', '?shippreview=../../etc', '?shippreview=<script>', '?diag=<b>', '?debug=true',
  ];
  for (const q of bad) {
    await page.goto('/index.html' + q);
    await expect(page.locator('#screen-title'), q).toBeVisible();
    const r = await page.evaluate(() => ({ game: typeof window.__game, sa: getComputedStyle(document.documentElement).getPropertyValue('--sa-l') }));
    expect(r.game, q).toBe('undefined');
    expect(r.sa, q).not.toContain('img');
  }
  await page.goto(gameUrl('?kualitas=__proto__'));
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
  expect(['rendah', 'sedang', 'tinggi']).toContain((await page.evaluate(() => window.__game.quality())).preset);
});

test('A3: localStorage rusak atau dimanipulasi tidak membuat crash dan tidak menyuntik nilai ekstrem', async ({ page }) => {
  // JSON rusak
  await page.addInitScript(() => {
    if (sessionStorage.getItem('fase')) return;
    localStorage.setItem('raptor13.v3', '{"version":3, rusak');
    localStorage.setItem('raptor13.session.v1', 'bukan json');
    localStorage.setItem('raptor13.highscore', '9'.repeat(400));
  });
  await open(page);
  let s = await snap(page);
  expect(s.settings.quality).toMatch(/rendah|sedang|tinggi/);
  expect(s.highScore).toBeLessThanOrEqual(1e12);
  // Nilai ekstrem dan kunci prototipe
  await page.evaluate(() => {
    sessionStorage.setItem('fase', '2');
    localStorage.setItem('raptor13.v3', JSON.stringify({
      version: 3, settings: { volMaster: 1e9, quality: 'ultra', controlSize: -50, perfMode: 'turbo', __proto__: { x: 1 } },
      highScores: { space: 1e300, earth: -5 }, ships: { credits: 1e300, unlocked: ['raptor-j', 'constructor', '<img>'], selected: { space: 'constructor' } },
      stats: { playTime: Infinity }, campaign: { stage: 999, ratings: { 1: 99 }, intros: ['x'] }, discoveries: ['__proto__', 'bumi'],
    }));
    localStorage.setItem('raptor13.session.v1', JSON.stringify({
      v: 1, savedAt: 'kemarin', world: 'space', seed: 1, spaceMode: 'campaign', stageIdx: 1e9, area: 'constructor', score: 1e300, time: 5, kills: 1e300, credits: 1e300,
      player: { pos: [1e30, 0, 0], quat: [0, 0, 0, 1], hp: 1e9, lives: 1e9, nitro: 5, ult: 9, shield: 1e9 },
      upgrades: { fireRate: 1e9, damage: -3, companions: 99, autoRepair: true, hpBonus: 1e12 },
      level: { level: 1e9, xp: 1e300, pending: 77, picks: { damage: 1e9, __proto__: 5, nope: 3 } },
      wave: 1e12, contract: { type: 'constructor', reward: { credits: 1e300 } }, stats: { score: 'x' },
    }));
  });
  await open(page);
  s = await snap(page);
  expect(s.settings.volMaster).toBeLessThanOrEqual(100);
  expect(s.settings.controlSize).toBeGreaterThanOrEqual(70);
  expect(s.settings.quality).not.toBe('ultra');
  expect(s.settings.perfMode).toBe('otomatis');
  expect(s.bank).toBeLessThanOrEqual(1e9);
  expect(s.unlocked).not.toContain('constructor');
  expect(s.highScore).toBeLessThanOrEqual(1e12);
  // Ringkasan LANJUTKAN tampil tanpa NaN, lalu sesi dimuat dengan nilai dibatasi
  await expect(page.locator('#continue-info')).not.toContainText('NaN');
  await page.click('#btn-continue');
  await page.evaluate(() => { const d = window.__game.debug; d.skipCutscene(); d.autoContract(); });
  await page.waitForTimeout(500);
  s = await snap(page);
  expect(s.score).toBeLessThanOrEqual(1e12);
  expect(s.lives).toBeLessThanOrEqual(5);
  expect(Math.hypot(s.position.x, s.position.y, s.position.z)).toBeLessThan(45000);
  const lv = await dbg(page, 'levelState');
  expect(lv.level).toBeLessThanOrEqual(500);
  expect(lv.pending).toBeLessThanOrEqual(5);
  expect(lv.upgrades.fireRate).toBeLessThanOrEqual(50);
  expect(lv.upgrades.damage).toBeGreaterThanOrEqual(1);
  expect(lv.upgrades.companions).toBeLessThanOrEqual(2);
  expect(s.wave).toBeLessThanOrEqual(1000);
});

test('A3: CSP ketat aktif, hash dan integrity mutakhir, tanpa cookie', async ({ page }) => {
  execFileSync(process.execPath, ['tests/csp.mjs'], { cwd: ROOT });   // gagal bila hash usang
  await open(page);
  const r = await page.evaluate(() => ({
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || '',
    cookie: document.cookie,
    importmap: JSON.parse(document.querySelector('script[type="importmap"]').textContent),
  }));
  expect(r.csp).toContain("default-src 'none'");
  expect(r.csp).toContain("object-src 'none'");
  expect(r.csp).toContain("base-uri 'none'");
  expect(r.csp).not.toContain('unsafe-inline');
  expect(r.csp).not.toContain('unsafe-eval');
  expect(r.cookie).toBe('');
  expect(r.importmap.imports.three).toMatch(/^\.\/vendor\/three-0\.187\.0\//);
  expect(Object.values(r.importmap.integrity).every((v) => v.startsWith('sha384-'))).toBe(true);
  await expect(page.locator('#screen-about .privacy')).toHaveCount(1);
});

test.describe('konteks WebGL', () => {
  test.use({ allowRestoreNoise: true });
  test('A3 dan A7: konteks hilang menjeda, pulih, langit dipanggang ulang, lanjut bermain', async ({ page }) => {
    await play(page);
    expect(await dbg(page, 'loseContext')).toBe(true);
    await expect.poll(async () => (await dbg(page, 'glState')).lost).toBe(true);
    expect((await snap(page)).state).toBe('paused');
    await expect(page.locator('#gl-lost')).toBeVisible();
    await dbg(page, 'restoreContext');
    await expect.poll(async () => (await dbg(page, 'glState')).restoredCount).toBe(1);
    await expect(page.locator('#gl-lost')).toBeHidden();
    await page.evaluate(() => window.__game.resume());
    await expect.poll(async () => (await snap(page)).state, { timeout: 6000 }).toBe('playing');
    await page.waitForTimeout(1000);
    expect((await dbg(page, 'perf')).fps).toBeGreaterThan(20);
  });
});

// ---------- performa ----------
test('A2: batas FPS, menu 20 FPS, layar statis tidak merender ulang', async ({ page }) => {
  await open(page);
  await page.waitForTimeout(500);
  await dbg(page, 'perfReset');
  await page.waitForTimeout(2000);
  let p = await dbg(page, 'perf');
  expect(p.targetFps).toBe(20);
  expect(p.renders).toBeLessThanOrEqual(46);
  expect(p.renders).toBeGreaterThanOrEqual(30);
  // Pengaturan menutupi menu: dunia statis
  await page.click('#btn-settings');
  await page.waitForTimeout(600);
  await dbg(page, 'perfReset');
  await page.waitForTimeout(1500);
  p = await dbg(page, 'perf');
  expect(p.isStatic).toBe(true);
  expect(p.renders).toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  // Bermain: 60 FPS; jeda: statis
  await play(page);
  await dbg(page, 'perfReset');
  await page.waitForTimeout(2000);
  p = await dbg(page, 'perf');
  expect(p.targetFps).toBe(60);
  expect(p.renders).toBeLessThanOrEqual(130);
  await page.evaluate(() => window.__game.pause());
  await page.waitForTimeout(600);
  await dbg(page, 'perfReset');
  await page.waitForTimeout(1500);
  p = await dbg(page, 'perf');
  expect(p.renders).toBeLessThanOrEqual(1);
  expect(p.audioState).toBe('suspended');
});

test('A2: mode performa Hemat baterai, Kualitas tinggi, resolusi dinamis, dan turun otomatis sekali dengan toast', async ({ page }) => {
  await play(page);
  expect(await dbg(page, 'setPerfMode', 'hemat')).toBe('hemat');
  let p = await dbg(page, 'perf');
  expect(p.targetFps).toBe(30);
  expect(p.bloom).toBe(false);
  expect(p.shadows).toBe(false);
  await dbg(page, 'setPerfMode', 'kualitas');
  p = await dbg(page, 'perf');
  expect(p.targetFps).toBe(60);
  expect(p.scale).toBe(1);
  // Batas megapiksel di kualitas Sedang: buffer tidak melewati 2 juta piksel
  expect(p.bufferW * p.bufferH).toBeLessThanOrEqual(2.01e6);
  // Otomatis: frame lambat terus menurunkan skala resolusi, lalu satu tingkat kualitas dengan toast sekali
  await dbg(page, 'setPerfMode', 'otomatis');
  await page.waitForTimeout(2100);   // lewati masa pemanasan setelah perubahan
  const r = await page.evaluate(() => { const d = window.__game.debug; let last; for (let i = 0; i < 400; i++) last = d.simulateSlow(40); return last; });
  expect(r.scale).toBeLessThan(1);
  expect(r.level).toBeGreaterThanOrEqual(1);
  expect((await dbg(page, 'perf')).bloom).toBe(false);
  await expect(page.getByText('Kualitas diturunkan otomatis').first()).toBeAttached();
  expect(await dbg(page, 'perfStep')).toBeGreaterThanOrEqual(2);   // langkah berikutnya tanpa toast baru
  expect(await page.getByText('Kualitas diturunkan otomatis').count()).toBe(1);
});

test('A2: tab tersembunyi menjeda permainan dan menghentikan audio, overlay F3 bisa ditampilkan', async ({ page }) => {
  await play(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(async () => (await snap(page)).state).toBe('paused');
  await expect.poll(async () => (await dbg(page, 'perf')).audioState).toBe('suspended');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.keyboard.press('F3');
  await expect(page.locator('#perf-overlay')).toBeVisible();
  await expect(page.locator('#perf-overlay')).toContainText('FPS');
  await page.keyboard.press('F3');
  await expect(page.locator('#perf-overlay')).toBeHidden();
});

test('A2: jendela kehilangan fokus di menu menghentikan render dan audio', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Shift');
  expect(await dbg(page, 'setFocus', false)).toBe(true);
  await page.waitForTimeout(400);
  await dbg(page, 'perfReset');
  await page.waitForTimeout(1200);
  const p = await dbg(page, 'perf');
  expect(p.renders).toBeLessThanOrEqual(1);
  expect(p.audioState).toBe('suspended');
  await dbg(page, 'setFocus', true);
});
