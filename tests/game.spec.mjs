// Uji otomatis RAPTOR13 dengan Playwright (Chromium headless).
// Jalankan: npm test
import { test as base, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHOT_DIR = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
mkdirSync(SHOT_DIR, { recursive: true });

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.187.0/';

// Pesan performa dari driver GL perangkat lunak (SwiftShader) saat screenshot, bukan dari game
const isDriverNoise = (text) => /GL Driver Message|GPU stall due to ReadPixels/.test(text);

// Fixture: setiap uji otomatis gagal bila ada console error atau warning, error halaman,
// atau request ke aset di luar localhost dan Three.js di CDN.
const test = base.extend({
  page: async ({ page }, use) => {
    const problems = [];
    const external = [];
    page.on('console', (m) => {
      if (!['error', 'warning'].includes(m.type())) return;
      if (isDriverNoise(m.text())) return;
      problems.push(`${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('request', (r) => {
      const url = r.url();
      if (url.startsWith('data:')) return;
      const host = new URL(url).hostname;
      if (host === 'localhost' || host === '127.0.0.1') return;
      if (url.startsWith(THREE_CDN)) return;
      external.push(url);
    });
    await use(page);
    expect(problems, 'console harus bersih').toEqual([]);
    expect(external, 'tidak boleh ada aset eksternal selain Three.js').toEqual([]);
  },
});

// ---------- pembantu ----------
const snap = (page) => page.evaluate(() => window.__game.snapshot());
const dbg = (page, fn, ...args) => page.evaluate(([f, a]) => window.__game.debug[f](...a), [fn, args]);

async function open(page, query = '') {
  await page.goto(`/index.html${query}`);
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
}

// Mulai sesi lewat klik tombol MULAI (sekaligus membuka AudioContext)
async function start(page, { seed = 1234, enemies = false, god = true } = {}) {
  await open(page);
  await page.evaluate(([s, e, g]) => {
    window.__game.setSeed(s);
    window.__game.debug.setEnemiesEnabled(e);
    window.__game.debug.setGod(g);
  }, [seed, enemies, god]);
  await page.click('#btn-start');
  await page.evaluate(() => window.__game.skipTransition());
  await expect.poll(async () => (await snap(page)).state).toBe('playing');
}

async function hold(page, keys, ms) {
  for (const k of keys) await page.keyboard.down(k);
  await page.waitForTimeout(ms);
  for (const k of keys) await page.keyboard.up(k);
}

// ---------- uji ----------
test('halaman termuat tanpa console error dan menampilkan layar judul', async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle('RAPTOR13');
  await expect(page.locator('#screen-title')).toBeVisible();
  await expect(page.locator('.logo')).toHaveText('RAPTOR13');
  await expect(page.locator('.tagline')).toHaveText('Superioritas udara dimulai dari sini.');
  await expect(page.locator('#btn-start')).toHaveText('MULAI');
  await expect(page.locator('#btn-continue')).toBeHidden();   // belum ada sesi yang dijeda
  await expect(page.locator('#hud')).toBeHidden();
  const s = await snap(page);
  expect(s.state).toBe('menu');
  expect(s.audio).toBe('belum dibuat');   // AudioContext belum dibuat sebelum interaksi
});

test('klik MULAI memulai game dan membuka audio', async ({ page }) => {
  await start(page);
  await expect(page.locator('#screen-title')).toBeHidden();
  await expect(page.locator('#hud')).toBeVisible();
  const a = await snap(page);
  await page.waitForTimeout(600);
  const b = await snap(page);
  expect(b.time).toBeGreaterThan(a.time);
  expect(b.position.z).toBeLessThan(a.position.z);   // pesawat selalu maju otomatis
  expect(b.health).toBe(100);
  expect(b.audio).toBe('running');
});

test('S1: Enter menembak lewat alur nyata, peluru bertambah, bergerak dan terlihat', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { window.__game.setSeed(77); window.__game.debug.setGod(true); window.__game.debug.setEnemiesEnabled(false); });
  await page.click('#btn-start');                       // klik mouse seperti pemain sungguhan
  await expect.poll(async () => (await snap(page)).state, { timeout: 4000 }).toBe('playing');
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);   // tombol tidak lagi fokus
  const before = await snap(page);
  await page.keyboard.down('Enter');
  await page.waitForTimeout(300);
  const b1 = await dbg(page, 'bullets');
  const contrast = await dbg(page, 'bulletPixelContrast');
  await page.waitForTimeout(120);
  const b2 = await dbg(page, 'bullets');
  await page.keyboard.up('Enter');
  const after = await snap(page);
  expect(after.shotsFired).toBeGreaterThan(before.shotsFired);
  expect(b1.list.length).toBeGreaterThan(0);
  expect(b1.instances).toBe(b1.list.length);
  expect(b1.visible).toBe(true);
  // Bergerak: peluru yang sama berpindah lebih dari 5 unit dalam 120 ms
  const moved = b1.list.some((a) => {
    const b = b2.list.find((x) => x.id === a.id);
    return b ? Math.hypot(b.world.x - a.world.x, b.world.y - a.world.y, b.world.z - a.world.z) > 5 : false;
  });
  expect(moved).toBe(true);
  // Terlihat: ada di layar dan piksel di posisinya berubah nyata saat peluru dirender
  expect(b1.list.some((b) => b.onScreen)).toBe(true);
  expect(contrast).toBeGreaterThan(40);
});

test('S1: Enter dengan e.code kosong tetap terbaca dan di-preventDefault', async ({ page }) => {
  await start(page);
  const r = await page.evaluate(() => {
    const ev = new KeyboardEvent('keydown', { key: 'Enter', code: '', cancelable: true });
    window.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  expect(r).toBe(true);
  await page.waitForTimeout(300);
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: '' })));
  expect((await snap(page)).shotsFired).toBeGreaterThan(0);
});

test('W dan S mengubah pitch dan ketinggian', async ({ page }) => {
  await start(page);
  const s0 = await snap(page);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1200);
  const s1 = await snap(page);
  await page.keyboard.up('KeyW');
  expect(s1.pitch).toBeGreaterThan(0.3);
  expect(s1.position.y).toBeGreaterThan(s0.position.y + 5);

  await page.waitForTimeout(800);
  const s2 = await snap(page);
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(1200);
  const s3 = await snap(page);
  await page.keyboard.up('KeyS');
  expect(s3.pitch).toBeLessThan(-0.3);
  expect(s3.position.y).toBeLessThan(s2.position.y);
});

test('A dan D membuat pesawat belok sambil miring', async ({ page }) => {
  await start(page);
  const s0 = await snap(page);
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(1000);
  const s1 = await snap(page);
  await page.keyboard.up('KeyA');
  expect(s1.roll).toBeGreaterThan(0.5);          // miring kiri
  expect(s1.yaw).toBeGreaterThan(s0.yaw + 0.2);  // belok kiri
  expect(s1.position.x).toBeLessThan(s0.position.x);

  await page.waitForTimeout(1200);
  const s2 = await snap(page);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1000);
  const s3 = await snap(page);
  await page.keyboard.up('KeyD');
  expect(s3.roll).toBeLessThan(-0.5);            // miring kanan
  expect(s3.yaw).toBeLessThan(s2.yaw - 0.2);     // belok kanan
});

test('Spasi mengaktifkan nitro: kecepatan naik dan meter berkurang lalu pulih', async ({ page }) => {
  await start(page);
  const s0 = await snap(page);
  await page.keyboard.down('Space');
  await page.waitForTimeout(1200);
  const s1 = await snap(page);
  await page.keyboard.up('Space');
  expect(s1.nitroActive).toBe(true);
  expect(s1.nitro).toBeLessThan(s0.nitro - 0.2);
  expect(s1.speed).toBeGreaterThan(s0.speed + 20);
  await page.waitForTimeout(2500);
  const s2 = await snap(page);
  expect(s2.nitroActive).toBe(false);
  expect(s2.nitro).toBeGreaterThan(s1.nitro);    // pulih pelan setelah dilepas
});

test('nitro habis memicu jeda kunci sebelum bisa dipakai lagi', async ({ page }) => {
  await start(page);
  await page.keyboard.down('Space');
  await expect.poll(async () => (await snap(page)).nitroLocked, { timeout: 8000 }).toBe(true);
  const s = await snap(page);
  await page.keyboard.up('Space');
  expect(s.nitro).toBe(0);
  expect(s.nitroActive).toBe(false);
  await expect(page.locator('#nitro-bar')).toHaveClass(/locked/);
});

test('Enter menembak dengan cooldown: jumlah peluru bertambah', async ({ page }) => {
  await start(page);
  const s0 = await snap(page);
  await page.keyboard.down('Enter');
  await page.waitForTimeout(1000);
  const s1 = await snap(page);
  await page.keyboard.up('Enter');
  expect(s0.shotsFired).toBe(0);
  expect(s1.playerBullets).toBeGreaterThan(0);
  // Cooldown 0,09 detik: sekitar 11 tembakan per detik, tidak lebih dari 13
  expect(s1.shotsFired).toBeGreaterThanOrEqual(5);
  expect(s1.shotsFired).toBeLessThanOrEqual(13);
});

test('kombinasi W, D, Spasi dan Enter bersamaan semuanya bekerja', async ({ page }) => {
  await start(page);
  const s0 = await snap(page);
  await hold(page, ['KeyW', 'KeyD', 'Space', 'Enter'], 1200);
  const s1 = await snap(page);
  expect(s1.pitch).toBeGreaterThan(0.2);          // W
  expect(s1.roll).toBeLessThan(-0.4);             // D
  expect(s1.yaw).toBeLessThan(s0.yaw - 0.1);      // D
  expect(s1.nitro).toBeLessThan(s0.nitro - 0.2);  // Spasi
  expect(s1.speed).toBeGreaterThan(s0.speed + 15);
  expect(s1.shotsFired).toBeGreaterThan(4);       // Enter
});

test('Spasi dan Enter memanggil preventDefault', async ({ page }) => {
  await start(page);
  const prevented = await page.evaluate(() => ['Space', 'Enter'].map((code) => {
    const ev = new KeyboardEvent('keydown', { code, key: code === 'Space' ? ' ' : 'Enter', cancelable: true, bubbles: true });
    window.dispatchEvent(ev);
    window.dispatchEvent(new KeyboardEvent('keyup', { code, cancelable: true, bubbles: true }));
    return ev.defaultPrevented;
  }));
  expect(prevented).toEqual([true, true]);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('blur mereset tombol yang tertahan dan menjeda game', async ({ page }) => {
  await start(page);
  await page.keyboard.down('KeyW');   // sengaja tidak dilepas sebelum blur
  await page.waitForTimeout(500);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect((await snap(page)).state).toBe('paused');
  await page.evaluate(() => window.__game.resume());
  expect((await snap(page)).state).toBe('countdown');
  await page.waitForTimeout(3600);
  const s = await snap(page);
  expect(s.state).toBe('playing');
  expect(Math.abs(s.pitch)).toBeLessThan(0.1);   // W tidak "nyangkut"
  await page.keyboard.up('KeyW');
});

test('P dan Esc menjeda serta melanjutkan, R mengulang', async ({ page }) => {
  await start(page);
  await page.waitForTimeout(800);
  await page.keyboard.press('KeyP');
  const p0 = await snap(page);
  expect(p0.state).toBe('paused');
  await expect(page.locator('#screen-pause')).toBeVisible();
  await page.waitForTimeout(600);
  const p1 = await snap(page);
  expect(p1.position).toEqual(p0.position);     // dunia berhenti saat jeda
  expect(p1.time).toBe(p0.time);
  await page.keyboard.press('Escape');
  expect((await snap(page)).state).toBe('countdown');   // lanjut lewat hitung mundur 3-2-1
  await expect(page.locator('#screen-pause')).toBeHidden();
  await expect.poll(async () => (await snap(page)).state, { timeout: 5000 }).toBe('playing');

  await page.keyboard.press('Escape');
  expect((await snap(page)).state).toBe('paused');
  await page.click('#btn-resume');
  await expect.poll(async () => (await snap(page)).state, { timeout: 5000 }).toBe('playing');

  await hold(page, ['Space', 'Enter'], 600);
  const before = await snap(page);
  await page.keyboard.press('KeyR');
  const after = await snap(page);
  expect(after.state).toBe('playing');
  expect(after.time).toBeLessThan(before.time);
  expect(after.time).toBeLessThan(0.3);
  expect(after.shotsFired).toBe(0);
  expect(after.nitro).toBe(1);
  expect(after.health).toBe(100);
});

test('M mematikan dan menyalakan suara', async ({ page }) => {
  await start(page);
  await page.keyboard.press('KeyM');
  expect((await snap(page)).muted).toBe(true);
  await expect(page.locator('#btn-mute')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('KeyM');
  expect((await snap(page)).muted).toBe(false);
  await expect(page.locator('#btn-mute')).toHaveAttribute('aria-pressed', 'false');
});

test('health 0 memicu ledakan dan layar game over, lalu bisa main lagi', async ({ page }) => {
  await start(page, { god: false });
  await page.waitForTimeout(800);   // skor bertambah dulu agar ada skor tertinggi untuk disimpan
  await dbg(page, 'setLives', 1);
  await dbg(page, 'forceDamagePlayer', 40);
  expect((await snap(page)).health).toBe(60);
  await dbg(page, 'forceDamagePlayer', 1000);
  const dying = await snap(page);
  expect(dying.health).toBe(0);
  expect(dying.alive).toBe(false);
  expect(dying.lives).toBe(0);
  await expect.poll(async () => (await snap(page)).state, { timeout: 5000 }).toBe('gameover');
  await expect(page.locator('#screen-over')).toBeVisible();
  await expect(page.locator('#hud')).toBeHidden();
  await expect(page.locator('#go-score')).not.toHaveText('');
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('raptor13.v1')).highScore);
  expect(Number(stored)).toBe((await snap(page)).highScore);
  expect(Number(stored)).toBeGreaterThan(0);
  await page.click('#btn-restart');
  const s = await snap(page);
  expect(s.state).toBe('playing');
  expect(s.health).toBe(100);
});

test('high score tetap aman bila localStorage melempar error', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('diblokir'); };
    Storage.prototype.setItem = () => { throw new Error('diblokir'); };
  });
  await start(page, { god: false });
  await dbg(page, 'setLives', 1);
  await dbg(page, 'forceDamagePlayer', 1000);
  await expect.poll(async () => (await snap(page)).state, { timeout: 5000 }).toBe('gameover');
  await expect(page.locator('#screen-over')).toBeVisible();
});

test('cincin memberi skor dan nitro, pickup memulihkan health dan nitro', async ({ page }) => {
  await start(page);
  await hold(page, ['Space'], 1500);
  const s0 = await snap(page);
  expect(await dbg(page, 'placeRingAhead', 90)).toBe(true);
  await expect.poll(async () => (await snap(page)).ringsPassed, { timeout: 4000 }).toBe(1);
  const s1 = await snap(page);
  expect(s1.score).toBeGreaterThan(s0.score + 200);
  expect(s1.nitro).toBeGreaterThan(s0.nitro + 0.15);

  await dbg(page, 'setGod', false);
  await dbg(page, 'forceDamagePlayer', 50);
  await dbg(page, 'setGod', true);
  expect((await snap(page)).health).toBe(50);
  expect(await dbg(page, 'placePickupAhead', 'repair', 90)).toBe(true);
  await expect.poll(async () => (await snap(page)).pickupsCollected, { timeout: 4000 }).toBe(1);
  expect((await snap(page)).health).toBe(80);

  await hold(page, ['Space'], 1500);
  const n0 = (await snap(page)).nitro;
  expect(await dbg(page, 'placePickupAhead', 'nitro', 90)).toBe(true);
  await expect.poll(async () => (await snap(page)).pickupsCollected, { timeout: 4000 }).toBe(2);
  expect((await snap(page)).nitro).toBeGreaterThan(n0 + 0.4);
});

test('musuh muncul bergelombang, tembakan pemain menghancurkan musuh, combo menaikkan multiplier', async ({ page }) => {
  await start(page, { enemies: true });
  await expect.poll(async () => (await snap(page)).wave, { timeout: 6000 }).toBe(1);
  await expect.poll(async () => (await snap(page)).enemies, { timeout: 6000 }).toBeGreaterThan(0);

  // Drone tepat di jalur tembak
  await dbg(page, 'killAllEnemies');
  const k0 = (await snap(page)).kills;
  await dbg(page, 'spawnEnemy', 'drone', 220, 0, 0);
  await page.keyboard.down('Enter');
  await expect.poll(async () => (await snap(page)).kills, { timeout: 5000 }).toBeGreaterThan(k0);
  await page.keyboard.up('Enter');

  // Tiga kill beruntun dalam jendela combo
  for (let i = 0; i < 3; i++) await dbg(page, 'spawnEnemy', 'drone', 300, i * 0.2 - 0.2);
  await dbg(page, 'killAllEnemies');
  const s = await snap(page);
  expect(s.combo).toBeGreaterThanOrEqual(3);
  expect(s.multiplier).toBeGreaterThanOrEqual(2);
});

test('pesawat penembak menembak dan melukai pemain', async ({ page }) => {
  await start(page, { enemies: true, god: false });
  await dbg(page, 'setEnemiesEnabled', false);
  await dbg(page, 'setEnemiesEnabled', true);
  await dbg(page, 'spawnEnemy', 'gunship', 260, 0, 0);
  await expect.poll(async () => (await snap(page)).health, { timeout: 8000 }).toBeLessThan(100);
});

test('tidak ada kebocoran objek setelah 10 kali restart', async ({ page }) => {
  await start(page, { enemies: true });
  // Pemanasan: semua jenis objek sempat tampil sehingga geometri sudah terunggah ke GPU
  await dbg(page, 'simulate', 60);
  await page.waitForTimeout(300);
  const base0 = await dbg(page, 'resources');
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('KeyR');
    await dbg(page, 'simulate', 8);
    await page.waitForTimeout(150);
  }
  const after = await dbg(page, 'resources');
  expect(after.sceneObjects).toBe(base0.sceneObjects);
  expect(after.sceneChildren).toBe(base0.sceneChildren);
  expect(after.listeners).toBe(base0.listeners);
  expect(after.programs).toBe(base0.programs);
  expect(after.textures).toBe(base0.textures);
  expect(after.geometries).toBeLessThanOrEqual(base0.geometries + 2);
});

test('simulasi 5 menit bermain: sumber daya dan biaya per langkah stabil', async ({ page }) => {
  await start(page, { enemies: true });
  // Pemanasan: program shader dikompilasi saat jenis material pertama kali dirender
  await dbg(page, 'simulate', 60);
  const r0 = await dbg(page, 'resources');
  const early = await dbg(page, 'simulate', 30);
  await dbg(page, 'simulate', 240);
  const late = await dbg(page, 'simulate', 30);
  const r1 = await dbg(page, 'resources');
  const s = await snap(page);
  expect(s.state).toBe('playing');
  expect(s.time).toBeGreaterThanOrEqual(359);
  expect(s.wave).toBeGreaterThanOrEqual(4);
  expect(r1.sceneObjects).toBe(r0.sceneObjects);
  expect(r1.listeners).toBe(r0.listeners);
  expect(r1.programs).toBe(r0.programs);
  // Biaya per langkah di akhir tidak boleh jauh lebih mahal daripada di awal
  expect(late.msPerStep).toBeLessThanOrEqual(early.msPerStep * 2 + 0.1);
  test.info().annotations.push({ type: 'perf', description: `ms per langkah awal ${early.msPerStep}, akhir ${late.msPerStep}` });
});

test('frame rate render nyata wajar', async ({ page }) => {
  test.skip(process.platform !== 'darwin', 'Hanya diukur saat GPU asli tersedia (macOS Metal)');
  await start(page, { enemies: true });
  await page.waitForTimeout(4000);
  const s = await snap(page);
  test.info().annotations.push({ type: 'fps', description: `${s.fps} FPS, kerja ${s.workMs} ms per frame` });
  expect(s.fps).toBeGreaterThanOrEqual(45);
});

for (const q of ['rendah', 'tinggi']) {
  test(`preset kualitas ${q} termuat dan bisa dimainkan`, async ({ page }) => {
    await open(page, `?kualitas=${q}`);
    expect((await page.evaluate(() => window.__game.quality())).preset).toBe(q);
    await page.click('#btn-start');
    await page.waitForTimeout(1500);
    expect((await snap(page)).state).toBe('playing');
  });
}

test('screenshot menu, gameplay dan game over', async ({ page }) => {
  // Menu
  await open(page);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOT_DIR}menu.png` });

  // Gameplay: nitro, tembakan, musuh di depan, dan cincin
  await page.evaluate(() => { window.__game.setSeed(2024); window.__game.debug.setEnemiesEnabled(true); window.__game.debug.setGod(true); });
  await page.click('#btn-start');
  await expect.poll(async () => (await snap(page)).wave, { timeout: 6000 }).toBe(1);
  await page.waitForTimeout(600);
  await page.keyboard.down('Space');
  await page.keyboard.down('Enter');
  await dbg(page, 'killAllEnemies');
  await dbg(page, 'spawnEnemy', 'gunship', 170, 0.16, 10);
  await dbg(page, 'spawnEnemy', 'drone', 140, -0.2, 6);
  await dbg(page, 'spawnEnemy', 'drone', 120, 0.02, 1);
  await dbg(page, 'spawnEnemy', 'drone', 320, 1.6, 0);
  await page.waitForTimeout(420);
  await page.screenshot({ path: `${SHOT_DIR}gameplay.png` });
  await page.keyboard.up('Space');
  await page.keyboard.up('Enter');

  // Game over
  await dbg(page, 'setGod', false);
  await dbg(page, 'setLives', 1);
  await dbg(page, 'forceDamagePlayer', 1000);
  await expect.poll(async () => (await snap(page)).state, { timeout: 5000 }).toBe('gameover');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOT_DIR}gameover.png` });
});

test('pratinjau jet: 6 sudut, gameplay bank penuh, dan jumlah segitiga di bawah 8000', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto('/index.html?jetpreview=1');
  await page.waitForFunction(() => window.__jetPreview);
  const tris = await page.evaluate(() => window.__jetPreview.triangles);
  expect(tris).toBeLessThan(8000);
  test.info().annotations.push({ type: 'segitiga', description: String(tris) });
  for (const view of ['side', 'top', 'front', 'three_quarter_front', 'three_quarter_rear', 'chase']) {
    await page.evaluate((v) => window.__jetPreview.setView(v), view);
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${SHOT_DIR}jet-${view.replace(/_/g, '-')}.png` });
  }

  // Gameplay nyata dari kamera chase saat bank penuh dengan nitro
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page, { seed: 2024 });
  await page.waitForTimeout(1500);
  await page.keyboard.down('KeyD');
  await page.keyboard.down('Space');
  await page.waitForTimeout(1300);
  const s = await snap(page);
  expect(s.roll).toBeLessThan(-0.9);
  await page.screenshot({ path: `${SHOT_DIR}jet-gameplay-bank.png` });
  await page.keyboard.up('KeyD');
  await page.keyboard.up('Space');
});
