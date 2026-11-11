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
async function start(page, { seed = 1234, enemies = false, god = true, world = 'earth', mode = 'free' } = {}) {
  await open(page);
  await page.evaluate(([s, e, g]) => {
    window.__game.setSeed(s);
    window.__game.debug.setEnemiesEnabled(e);
    window.__game.debug.setGod(g);
  }, [seed, enemies, god]);
  await page.click('#btn-start');                         // MULAI membuka PILIH MEDAN
  await page.click(`.tcard[data-world="${world}"]`);
  if (world === 'space') await page.click(`.mcard[data-mode="${mode}"]`);   // PILIH MODE
  await page.click('#hangar-pick');                     // PILIH KAPAL
  await page.evaluate(() => { window.__game.skipTransition(); window.__game.debug.skipCutscene(); });   // lewati pembuka stage
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
  await page.keyboard.press('Enter');                   // kartu Luar Angkasa sudah tersorot
  await page.keyboard.press('Enter');                   // PILIH MODE: mode tersimpan sudah tersorot
  await page.keyboard.press('Enter');                   // PILIH KAPAL: kapal terpilih sudah tersorot
  // Kampanye pertama kali memutar pembuka stage: pemain melewatinya dengan Enter
  await expect.poll(async () => ['playing', 'cutscene'].includes((await snap(page)).state), { timeout: 4000 }).toBe(true);
  if ((await snap(page)).state === 'cutscene') await page.keyboard.press('Enter');
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

test('S2: medan angkasa jadi default, pilihan medan tersimpan setelah reload, skor per medan', async ({ page }) => {
  await open(page);
  expect((await snap(page)).world).toBe('space');                       // attract mode berlatar angkasa
  await page.click('#btn-start');
  await expect(page.locator('#screen-terrain')).toBeVisible();
  expect(await page.evaluate(() => document.activeElement.dataset.world)).toBe('space');
  await page.click('.tcard[data-world="earth"]');
  await page.click('#hangar-pick');                     // PILIH KAPAL
  await page.evaluate(() => window.__game.skipTransition());
  expect((await snap(page)).world).toBe('earth');
  await page.reload();
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
  const s = await snap(page);
  expect(s.world).toBe('earth');                                        // pilihan diingat
  expect(s.settings.terrain).toBe('earth');
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('raptor13.v3')));
  expect(Object.keys(save.highScores).sort()).toEqual(['earth', 'space']);
});

test('S2: medan Bumi tetap berfungsi dan data save v1 lama termigrasi', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('raptor13.v3')) localStorage.setItem('raptor13.v1', JSON.stringify({ version: 1, settings: { difficulty: 'sulit' }, highScore: 4321 }));
  });
  await open(page);
  const s = await snap(page);
  expect(s.settings.difficulty).toBe('sulit');
  await page.click('#btn-start');
  await expect(page.locator('[data-best="earth"]')).toHaveText('4.321');   // skor v1 dimigrasikan ke medan Bumi
  await page.click('.tcard[data-world="earth"]');
  await page.click('#hangar-pick');                     // PILIH KAPAL
  await page.evaluate(() => window.__game.skipTransition());
  await page.waitForTimeout(500);
  expect((await snap(page)).world).toBe('earth');
  expect((await snap(page)).state).toBe('playing');
});

test('B1: menahan S menghasilkan looping penuh melewati posisi terbalik lalu kembali datar', async ({ page }) => {
  await start(page, { world: 'space' });
  let inverted = false;
  await page.keyboard.down('KeyS');
  for (let i = 0; i < 16; i++) {
    await page.waitForTimeout(250);
    if ((await snap(page)).up.y < -0.5) inverted = true;
  }
  await page.keyboard.up('KeyS');
  expect(inverted).toBe(true);                       // melewati posisi terbalik
  await page.waitForTimeout(4500);
  const s = await snap(page);
  expect(s.up.y).toBeGreaterThan(0.9);               // penstabil otomatis mengembalikan ke datar
  expect(Math.abs(s.forward.y)).toBeLessThan(0.2);
});

test('B1: Shift menahan pandangan ke belakang', async ({ page }) => {
  await start(page, { world: 'space' });
  const camDir = () => page.evaluate(() => window.__game.debug.cameraForwardDot());
  await page.waitForTimeout(400);
  expect(await camDir()).toBeGreaterThan(0.5);       // kamera menghadap arah terbang
  await page.keyboard.down('ShiftLeft');
  await page.waitForTimeout(700);
  expect(await camDir()).toBeLessThan(-0.5);         // kamera menghadap ke belakang
  await page.keyboard.up('ShiftLeft');
});

test('B2: Balik Arah membalik heading 180 derajat dan cooldown mencegah pemakaian beruntun', async ({ page }) => {
  await start(page, { world: 'space' });
  await page.evaluate(() => { window.__game.debug.clearAsteroids(); window.__game.debug.setAsteroidDensity(0); });
  await page.waitForTimeout(1700);   // lewati kebal awal dan biarkan penstabil bekerja
  const y0 = (await snap(page)).yaw;
  await page.keyboard.press('KeyX');
  expect((await snap(page)).maneuver).toBe('immelmann');
  await page.waitForTimeout(2300);
  const s = await snap(page);
  const diff = Math.abs(Math.atan2(Math.sin(s.yaw - y0), Math.cos(s.yaw - y0)));
  expect(diff).toBeGreaterThan(Math.PI - 0.35);     // arah berlawanan
  expect(s.up.y).toBeGreaterThan(0.8);              // datar dan tegak
  expect(s.cooldowns.immelmann).toBeGreaterThan(0);
  await page.keyboard.press('KeyX');
  expect((await snap(page)).maneuver).toBe(null);    // masih cooldown
});

test('B2: gulung tong kebal peluru, looping kembali ke arah semula', async ({ page }) => {
  await start(page, { world: 'space', god: false });
  await page.evaluate(() => { window.__game.debug.clearAsteroids(); window.__game.debug.setAsteroidDensity(0); });
  await page.waitForTimeout(1700);
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(150);
  await dbg(page, 'shootPlayer', 40);
  await page.waitForTimeout(500);
  expect((await snap(page)).health).toBe(100);       // kebal selama gulungan
  await page.waitForTimeout(500);
  await dbg(page, 'shootPlayer', 40);
  await page.waitForTimeout(400);
  expect((await snap(page)).health).toBeLessThan(100);
  const y0 = (await snap(page)).yaw;
  expect(await dbg(page, 'forceManeuver', 'loop')).toBe(true);
  await page.waitForTimeout(2900);
  const s = await snap(page);
  const diff = Math.abs(Math.atan2(Math.sin(s.yaw - y0), Math.cos(s.yaw - y0)));
  expect(diff).toBeLessThan(0.35);
  expect(s.maneuver).toBe(null);
});

// Terbangkan pemain menukik ke titik permukaan, lalu tunggu game over dan periksa penyebabnya
async function crashInto(page, kind, cause) {
  await start(page, { god: false, seed: 5 });
  await page.waitForTimeout(300);
  const s = await dbg(page, 'findSurface', kind);
  expect(s, `titik ${kind} ditemukan`).not.toBe(null);
  // Menukik hampir tegak tepat di atas titik agar benturan terjadi di titik itu
  await dbg(page, 'setPlayerState', { x: s.x, y: s.h + 6, z: s.z, yaw: 0, pitch: -1.45 });
  await expect.poll(async () => (await snap(page)).state, { timeout: 6000 }).toBe('gameover');
  const r = await snap(page);
  expect(r.deathCause).toBe(cause);
  expect(r.lives).toBe(0);
  await expect(page.locator('#go-cause')).toHaveText(cause);
}

test('B3: menabrak tanah langsung game over tanpa bantuan naik', async ({ page }) => { await crashInto(page, 'land', 'Menabrak tanah'); });
test('B3: menabrak laut langsung game over', async ({ page }) => { await crashInto(page, 'water', 'Menabrak laut'); });
test('B3: menabrak gunung langsung game over', async ({ page }) => { await crashInto(page, 'mountain', 'Menabrak gunung'); });

test('B3: menabrak pohon (pilar) langsung game over', async ({ page }) => {
  await start(page, { god: false, seed: 5 });
  await page.waitForTimeout(300);
  const pillars = await dbg(page, 'pillars');
  const p = pillars.sort((a, b) => b.height - a.height)[0];
  const x = p.x + p.radius + 25, z = p.z, y = p.base + p.height * 0.4;
  const yaw = Math.atan2(-(p.x - x), -(p.z - z));
  await dbg(page, 'setPlayerState', { x, y, z, yaw });
  await expect.poll(async () => (await snap(page)).state, { timeout: 6000 }).toBe('gameover');
  expect((await snap(page)).deathCause).toBe('Menabrak pohon');
});

test('B3: asteroid raksasa fatal, asteroid kecil hanya damage', async ({ page }) => {
  await start(page, { god: false, world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.clearAsteroids(); d.setAsteroidDensity(0); });
  await page.waitForTimeout(1700);
  await dbg(page, 'spawnAsteroid', 'small', 40, 0, 0);
  await page.waitForTimeout(1200);
  const s1 = await snap(page);
  expect(s1.state).toBe('playing');
  expect(s1.health).toBeLessThan(100);               // ringan: hanya damage
  await dbg(page, 'spawnAsteroid', 'giant', 60, 0, 0);
  await expect.poll(async () => (await snap(page)).state, { timeout: 6000 }).toBe('gameover');
  expect((await snap(page)).deathCause).toBe('Menabrak asteroid raksasa');
});

test('B3: opsi Tabrakan fatal mati memberi damage besar dan pantulan', async ({ page }) => {
  await open(page);
  await page.click('#btn-settings');
  await page.click('input[data-key="fatalCrash"]');
  await page.click('#btn-settings-back');
  await page.evaluate(() => { window.__game.setSeed(5); window.__game.debug.setGod(false); window.__game.debug.setEnemiesEnabled(false); });
  await page.click('#btn-start');
  await page.click('.tcard[data-world="earth"]');
  await page.click('#hangar-pick');                     // PILIH KAPAL
  await page.evaluate(() => window.__game.skipTransition());
  await page.waitForTimeout(1700);   // lewati kebal awal agar damage tercatat
  const s = await dbg(page, 'findSurface', 'land');
  await dbg(page, 'setPlayerState', { x: s.x, y: s.h + 12, z: s.z, yaw: 0, pitch: -1.0 });
  await page.waitForTimeout(1200);
  const r = await snap(page);
  expect(r.state).toBe('playing');
  expect(r.health).toBeLessThan(100);
  expect(r.position.y).toBeGreaterThan(s.h);         // memantul, tidak menembus
});

for (const world of ['earth', 'space']) {
  test(`B4: simulasi bot ${world}, musuh tidak menempel di ekor dan jarang menabrak, kecepatan dalam batas`, async ({ page }) => {
    await start(page, { world, enemies: true, seed: 4242 });
    const r = await page.evaluate(() => {
      const d = window.__game.debug;
      let maxSpeed = 0;
      const states = new Set();
      for (let i = 0; i < 24; i++) {
        d.simulate(5, 0);
        const sp = d.enemySpeeds();
        maxSpeed = Math.max(maxSpeed, sp.max);
        sp.states.forEach((x) => states.add(x));
      }
      return { m: d.metrics(), maxSpeed, limit: d.enemySpeeds().limit, states: [...states] };
    });
    test.info().annotations.push({ type: 'metrik', description: JSON.stringify(r.m) });
    const cfg = await page.evaluate(() => window.__game.config().balance);
    expect(r.m.time).toBeGreaterThan(110);
    expect(r.m.tailRatio).toBeLessThan(cfg.maxTailRatio);
    expect(r.m.collisionsPerMin).toBeLessThan(cfg.maxCollisionsPerMin);
    expect(r.m.ramsPerMin).toBeLessThan(cfg.maxRamsPerMin);
    expect(r.maxSpeed).toBeLessThanOrEqual(r.limit + 0.01);
    for (const st of ['approach', 'attack', 'break', 'reposition']) expect(r.m.states).toContain(st);   // siklus serang terlihat
  });
}

test('B4: kebal 1 detik setelah menerima damage', async ({ page }) => {
  await start(page, { god: false });
  await page.waitForTimeout(1700);
  await dbg(page, 'damagePlayer', 10);
  await dbg(page, 'damagePlayer', 10);
  expect((await snap(page)).health).toBe(90);        // damage kedua diabaikan
  await page.waitForTimeout(1100);
  await dbg(page, 'damagePlayer', 10);
  expect((await snap(page)).health).toBe(80);
});

test('B5: laju tembak sesuai CONFIG, OVERDRIVE dan PENGHANCUR menaikkan laju dan damage', async ({ page }) => {
  await start(page);
  const cfg = await page.evaluate(() => window.__game.config());
  expect(await dbg(page, 'fireRate')).toBeCloseTo(1 / cfg.weapons.fireInterval, 1);
  expect(cfg.weapons.fireInterval).toBeGreaterThanOrEqual(0.1);
  expect(cfg.weapons.fireInterval).toBeLessThanOrEqual(0.12);
  const s0 = await snap(page);
  await hold(page, ['Enter'], 1000);
  const base = (await snap(page)).shotsFired - s0.shotsFired;
  expect(base).toBeGreaterThanOrEqual(9);
  expect(base).toBeLessThanOrEqual(12);
  await dbg(page, 'activateBuff', 'overdrive');
  const s1 = await snap(page);
  await hold(page, ['Enter'], 1000);
  const over = (await snap(page)).shotsFired - s1.shotsFired;
  expect(over).toBeGreaterThanOrEqual(Math.floor(base * 1.4));      // sekitar 1,6 kali
  expect((await snap(page)).buffs.overdrive).toBeGreaterThan(0);
  const d0 = await dbg(page, 'bulletDamage');
  await dbg(page, 'activateBuff', 'destroyer');
  expect(await dbg(page, 'bulletDamage')).toBeCloseTo(d0 * 1.5, 1);
  await expect(page.locator('.buff[data-buff="destroyer"]')).toBeVisible();
});

test('B7: sanity audio mesin dan nitro (tanpa NaN, master di bawah 1, frekuensi mesin rendah)', async ({ page }) => {
  await start(page);
  await page.waitForTimeout(600);
  const a = await dbg(page, 'audioCheck');
  expect(a.ready).toBe(true);
  expect(a.finite).toBe(true);
  expect(a.master).toBeLessThan(1);
  expect(a.values[4]).toBeGreaterThanOrEqual(50); expect(a.values[4]).toBeLessThanOrEqual(90);
  expect(a.values[5]).toBeGreaterThanOrEqual(50); expect(a.values[5]).toBeLessThanOrEqual(92);
  await page.keyboard.down('Space');
  await page.waitForTimeout(700);
  const n = await dbg(page, 'audioCheck');
  await page.keyboard.up('Space');
  expect(n.finite).toBe(true);
  expect(n.values[7]).toBeGreaterThan(0.02);         // desis nitro terdengar
  await page.waitForTimeout(1200);
  expect((await dbg(page, 'audioCheck')).values[7]).toBeLessThan(0.01);   // memudar setelah dilepas
});

test('A2: hangar hanya menampilkan kapal yang cocok medan, kapal terkunci butuh kredit, pilihan tersimpan', async ({ page }) => {
  await open(page);
  await page.click('#btn-start');
  await page.click('.tcard[data-world="space"]');
  await page.click('.mcard[data-mode="free"]');
  await expect(page.locator('#screen-hangar')).toBeVisible();
  const spaceList = await page.evaluate(() => window.__game.debug.hangarList());
  expect(spaceList).toEqual(['starfighter', 'interceptor', 'gunship']);
  await page.click('#hangar-next');
  await expect(page.locator('#hangar-name')).toHaveText('Interceptor');
  await expect(page.locator('#hangar-pick')).toBeDisabled();          // terkunci
  await expect(page.locator('#hangar-buy')).toBeDisabled();           // kredit kurang
  await dbg(page, 'addCredits', 700);
  await page.click('#hangar-prev');
  await page.click('#hangar-next');
  await page.click('#hangar-buy');
  expect((await snap(page)).bank).toBe(200);                          // 700 dikurangi 500
  await page.click('#hangar-pick');
  await page.evaluate(() => window.__game.skipTransition());
  expect((await snap(page)).ship).toBe('interceptor');
  await page.reload();
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
  const s = await snap(page);
  expect(s.unlocked).toContain('interceptor');
  expect(s.bank).toBe(200);
  await page.click('#btn-start');
  await page.click('.tcard[data-world="earth"]');
  expect(await page.evaluate(() => window.__game.debug.hangarList())).toEqual(['raptor-j']);   // kapal angkasa tidak tampil
  await expect(page.locator('#hangar-name')).toHaveText('Raptor-J');
});

test('A2: save v2 lama tetap terbaca dan kapal bawaan dipakai', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('raptor13.v3')) localStorage.setItem('raptor13.v2', JSON.stringify({ version: 2, settings: { terrain: 'earth' }, highScores: { space: 50, earth: 70 } }));
  });
  await open(page);
  const s = await snap(page);
  expect(s.world).toBe('earth');
  expect(s.ship).toBe('raptor-j');
  expect(s.bank).toBe(0);
  expect(s.unlocked).toEqual(['raptor-j', 'starfighter']);
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
  // 0,6 detik: cukup untuk semua efek tanpa melewati vertikal (W yang ditahan lama menghasilkan looping)
  await hold(page, ['KeyW', 'KeyD', 'Space', 'Enter'], 600);
  const s1 = await snap(page);
  expect(s1.pitch).toBeGreaterThan(0.2);          // W
  expect(s1.roll).toBeLessThan(-0.4);             // D
  expect(s1.yaw).toBeLessThan(s0.yaw - 0.05);     // D
  expect(s1.nitro).toBeLessThan(s0.nitro - 0.1);  // Spasi
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
  await page.waitForTimeout(1200);
  const s2 = await snap(page);
  // W tidak "nyangkut": penstabil otomatis terus mengembalikan hidung ke horizon
  expect(Math.abs(s2.pitch)).toBeLessThan(Math.abs(s.pitch));
  expect(Math.abs(s2.pitch)).toBeLessThan(0.35);
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
  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('raptor13.v3')).highScores.earth);
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
  await page.waitForTimeout(1700);   // lewati kebal awal agar tembakan pertama tercatat
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
    await page.click('.tcard[data-world="earth"]');
    await page.click('#hangar-pick');                     // PILIH KAPAL
    await page.waitForTimeout(2000);
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
  await page.click('.tcard[data-world="earth"]');
  await page.click('#hangar-pick');                     // PILIH KAPAL
  await page.evaluate(() => window.__game.skipTransition());
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

for (const id of ['starfighter', 'interceptor', 'gunship']) {
  test(`A3: pratinjau ${id} di bawah 9000 segitiga dengan sayap dinamis`, async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 600 });
    await page.goto(`/index.html?shippreview=${id}`);
    await page.waitForFunction(() => window.__shipPreview);
    expect(await page.evaluate(() => window.__shipPreview.triangles)).toBeLessThan(9000);
    const normal = await page.evaluate(() => window.__shipPreview.setState({ nitro: 0, brake: 0, turn: 0 }));
    const nitro = await page.evaluate(() => window.__shipPreview.setState({ nitro: 1, brake: 0, turn: 0 }));
    const brake = await page.evaluate(() => window.__shipPreview.setState({ nitro: 0, brake: 1, turn: 0 }));
    const turn = await page.evaluate(() => window.__shipPreview.setState({ nitro: 0, brake: 0, turn: 1 }));
    expect(nitro.spread).toBeLessThan(normal.spread);    // merapat saat nitro
    expect(brake.spread).toBeGreaterThan(normal.spread); // melebar sebagai rem udara
    expect(turn.twist).toBeGreaterThan(0.1);             // puntir saat belok
    expect(turn.thrR).toBeGreaterThan(0.5);              // thruster sisi luar menyala
    if (id === 'starfighter') {
      await page.evaluate(() => window.__shipPreview.setState({ nitro: 0, brake: 0, turn: 0 }));
      for (const view of ['side', 'top', 'front', 'three_quarter_front', 'three_quarter_rear', 'chase']) {
        await page.evaluate((v) => window.__shipPreview.setView(v), view);
        await page.waitForTimeout(120);
        await page.screenshot({ path: `${SHOT_DIR}ship-starfighter-${view.replace(/_/g, '-')}.png` });
      }
      for (const [name, st] of [['nitro', { nitro: 1, brake: 0, turn: 0 }], ['rem', { nitro: 0, brake: 1, turn: 0 }], ['belok', { nitro: 0, brake: 0, turn: 1 }]]) {
        await page.evaluate(([s]) => { window.__shipPreview.setView('three_quarter_rear'); window.__shipPreview.setState(s); }, [st]);
        await page.waitForTimeout(120);
        await page.screenshot({ path: `${SHOT_DIR}ship-starfighter-${name}.png` });
      }
    }
  });
}

test('A4: Piko berbicara dengan batas frekuensi, opsi Bantuan robot dihormati', async ({ page }) => {
  await start(page, { world: 'space' });
  await page.waitForTimeout(400);
  await dbg(page, 'pikoReset');                                     // abaikan sapaan Penemuan saat tiba
  expect(await dbg(page, 'pikoSay', 'combo')).toBe(true);
  expect(await dbg(page, 'pikoSay', 'rarePickup')).toBe(true);      // prioritas lebih tinggi boleh menyela
  expect(await dbg(page, 'pikoSay', 'waveStart')).toBe(false);      // prioritas rendah dalam jeda minimum ditolak
  expect(await dbg(page, 'pikoSay', 'combo')).toBe(false);          // cooldown per pesan
  const p = await dbg(page, 'piko');
  expect(p.panel).toBe(true);
  expect(p.text).toContain('PIKO');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('raptor13.v3')); s.settings.robotHelp = 'mati'; localStorage.setItem('raptor13.v3', JSON.stringify(s)); });
  await page.reload();
  await start(page, { world: 'space' });
  expect(await dbg(page, 'pikoSay', 'hpLow')).toBe(false);          // bantuan robot dimatikan
});

test('A4: kartu Piko Perbaikan Otomatis dan Peredam bekerja', async ({ page }) => {
  await start(page, { god: false, world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.clearAsteroids(); d.setAsteroidDensity(0); });
  await page.waitForTimeout(1700);
  await dbg(page, 'grantUpgrade', 'autoRepair');
  await dbg(page, 'forceDamagePlayer', 30);
  expect((await snap(page)).health).toBe(70);
  await page.waitForTimeout(6000);
  expect((await snap(page)).health).toBeGreaterThan(73);            // pulih pelan setelah 4 detik
  await dbg(page, 'grantUpgrade', 'damper');
  const h0 = (await snap(page)).health;
  await page.evaluate(() => { window.__game.debug.forceDamagePlayer(0); });
  await page.evaluate(() => window.__game.debug.damageAs(20, 'asteroid'));
  expect((await snap(page)).health).toBeCloseTo(h0 - 12, 0);        // 20 dikali 0,6
});

test('A4: pratinjau Piko dari 3 sudut', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto('/index.html?shippreview=piko');
  await page.waitForFunction(() => window.__shipPreview);
  for (const view of ['front', 'three_quarter_front', 'side']) {
    await page.evaluate((v) => window.__shipPreview.setView(v), view);
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${SHOT_DIR}piko-${view.replace(/_/g, '-')}.png` });
  }
});

test('S6: asteroid angkasa ukuran kontinu dan empat jenis, HP mengikuti ukuran dan jenis', async ({ page }) => {
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.clearAsteroids(); d.setAsteroidDensity(2); });
  await page.evaluate(() => { const d = window.__game.debug; for (let i = 0; i < 30; i++) d.simulate(0.5, 0); });
  const list = await dbg(page, 'asteroids');
  const kinds = new Set(list.map((a) => a.kind));
  const radii = new Set(list.map((a) => a.radius));
  expect(list.length).toBeGreaterThan(8);
  expect(radii.size).toBeGreaterThan(6);                 // ukuran kontinu, bukan tiga nilai
  expect(kinds.size).toBeGreaterThanOrEqual(2);
  for (const a of list) expect(a.radius).toBeGreaterThanOrEqual(2);
  // Logam lebih tebal dari es pada ukuran yang sama
  await page.evaluate(() => window.__game.debug.clearAsteroids());
  await dbg(page, 'spawnAsteroid', 'medium', 300, -0.3, 0, 'metal');
  await dbg(page, 'spawnAsteroid', 'medium', 300, 0.3, 0, 'ice');
  const two = await dbg(page, 'asteroids');
  const metal = two.find((a) => a.kind === 'metal'), ice = two.find((a) => a.kind === 'ice');
  expect(metal.maxHp / metal.radius ** 1.5).toBeGreaterThan(ice.maxHp / ice.radius ** 1.5);
});

test('S6: komet berekor memicu peringatan, bisa dihancurkan', async ({ page }) => {
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.clearAsteroids(); d.setAsteroidDensity(0); });
  await page.waitForTimeout(300);
  expect(await dbg(page, 'placeComet', 320, 0, 0, 5)).toBe(true);   // diam tepat di jalur pemain
  await expect.poll(async () => (await dbg(page, 'comets')).threat, { timeout: 4000 }).toBe(true);
  await expect(page.locator('#comet-warn')).toBeVisible();
  await page.keyboard.down('Enter');
  await expect.poll(async () => (await dbg(page, 'comets')).destroyed, { timeout: 6000 }).toBeGreaterThan(0);
  await page.keyboard.up('Enter');
});

test('S8: lima warna bintang memberi efek yang benar dan tertarik magnet', async ({ page }) => {
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.setEnemiesEnabled(false); d.clearAsteroids(); d.setAsteroidDensity(0); d.setGod(false); });
  await dbg(page, 'setLives', 2);
  await dbg(page, 'damageAs', 40, 'test');
  await page.evaluate(() => { window.__game.debug.simulate(0.1, 0); });
  const before = await page.evaluate(() => ({ s: window.__game.snapshot(), u: window.__game.debug.ultimate() }));
  for (const k of ['red', 'green', 'blue', 'gold', 'purple']) expect(await dbg(page, 'spawnStar', k, 30)).toBe(true);
  // Magnet menarik bintang ke kapal tanpa perlu dibidik
  await expect.poll(async () => (await dbg(page, 'stars')).alive, { timeout: 6000 }).toBe(0);
  const after = await page.evaluate(() => ({ s: window.__game.snapshot(), u: window.__game.debug.ultimate(), st: window.__game.debug.stars() }));
  expect(after.st.collected).toEqual({ red: 1, green: 1, blue: 1, gold: 1, purple: 1 });
  expect(after.u.meter).toBeGreaterThan(before.u.meter);          // merah: ultimate
  expect(after.s.health).toBeGreaterThan(before.s.health);        // hijau: HP
  expect(after.s.lives).toBe(before.s.lives + 1);                 // ungu: nyawa
  expect(after.st.xp).toBeGreaterThan(0);                          // emas: XP
  expect(after.s.score).toBeGreaterThan(before.s.score);          // emas: skor
});

test('S8: ultimate E mengosongkan meter dan menghancurkan sasaran di jalur laser', async ({ page }) => {
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.setEnemiesEnabled(false); d.clearAsteroids(); d.setAsteroidDensity(0); d.setGod(true); });
  // Meter kosong: tidak bisa ditembakkan
  expect(await dbg(page, 'fireUltimate')).toBe(false);
  await dbg(page, 'spawnAsteroid', 'large', 200, 0, 0, 'rock');
  await dbg(page, 'fillUltimate');
  await page.keyboard.press('KeyE');
  await expect.poll(async () => (await dbg(page, 'ultimate')).active, { timeout: 2000 }).toBeGreaterThan(0);
  await expect.poll(async () => (await dbg(page, 'ultimate')).hits, { timeout: 4000 }).toBeGreaterThan(0);
  const u = await dbg(page, 'ultimate');
  expect(u.meter).toBeLessThan(0.5);
  await expect.poll(async () => (await dbg(page, 'ultimate')).active, { timeout: 5000 }).toBe(0);
});

test('B8: Tata Surya lengkap, ukuran dan urutan masuk akal, cahaya dari Matahari, semua tergambar', async ({ page }) => {
  await start(page, { world: 'space' });
  const s = await dbg(page, 'solar');
  expect(s.built).toBe(true);
  const by = Object.fromEntries(s.bodies.map((b) => [b.id, b]));
  const planets = ['merkurius', 'venus', 'bumi', 'mars', 'jupiter', 'saturnus', 'uranus', 'neptunus', 'pluto'];
  for (const id of ['matahari', ...planets, 'bulan', 'phobos', 'deimos', 'io', 'europa', 'ganymede', 'callisto', 'titan', 'charon']) expect(by[id], id).toBeTruthy();
  expect(by.bulan.parent).toBe('bumi');
  expect(by.charon.parent).toBe('pluto');
  expect(by.saturnus.ring).toBe(true);
  // Urutan orbit dari Matahari dan ukuran relatif
  for (let i = 1; i < planets.length; i++) expect(by[planets[i]].orbit).toBeGreaterThan(by[planets[i - 1]].orbit);
  const r = (id) => by[id].radius;
  expect(r('matahari')).toBeGreaterThan(r('jupiter'));
  expect(r('jupiter')).toBeGreaterThan(r('saturnus'));
  expect(r('saturnus')).toBeGreaterThan(r('uranus'));
  expect(r('bumi')).toBeGreaterThan(r('mars'));
  expect(r('mars')).toBeGreaterThan(r('merkurius'));
  expect(r('merkurius')).toBeGreaterThan(r('pluto'));
  // Sisi terang setiap benda menghadap Matahari (di titik asal)
  for (const b of s.bodies) {
    if (!b.light) continue;
    const len = Math.hypot(b.x, b.y, b.z);
    const dot = -(b.x * b.light[0] + b.y * b.light[1] + b.z * b.light[2]) / len;
    expect(dot, b.id).toBeGreaterThan(0.999);
  }
  // Benda jauh digambar sebagai proksi dan tetap di dalam camera.far
  expect(by.neptunus.proxy).toBeLessThan(1);
  for (const b of s.bodies) if (b.draw) expect(b.draw, b.id).toBeLessThan(s.far);
});

for (const [id, cause] of [['mars', 'Menabrak planet Mars'], ['bulan', 'Menabrak Bulan'], ['matahari', 'Terbakar Matahari']]) {
  test(`B8: menabrak ${id} langsung game over dengan penyebab benar`, async ({ page }) => {
    await start(page, { world: 'space' });
    await page.evaluate(() => { const d = window.__game.debug; d.setEnemiesEnabled(false); d.setGod(false); });
    await dbg(page, 'viewBody', id, 1.05, 0.4, 0);
    await expect.poll(async () => (await page.evaluate(() => window.__game.snapshot())).deathCause, { timeout: 6000 }).toBe(cause);
    await expect(page.locator('#go-cause')).toHaveText(cause, { timeout: 6000 });
  });
}

test('B8: screenshot tiap area Tata Surya', async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 960, height: 540 });
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.setGod(true); d.setEnemiesEnabled(false); d.clearAsteroids(); d.setAsteroidDensity(0); });
  for (const id of ['matahari', 'merkurius', 'venus', 'bumi', 'mars', 'jupiter', 'saturnus', 'uranus', 'neptunus', 'pluto']) {
    expect(await dbg(page, 'viewBody', id, id === 'saturnus' ? 3.2 : 2.6, 1.0, 0.18)).toBe(true);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `docs/screenshots/tata-surya-${id}.jpg`, type: 'jpeg', quality: 82 });
  }
});

test('B9: cincin Saturnus berisi ribuan batu, LOD ke asteroid ber-HP, batu yang hancur tetap hilang', async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 960, height: 540 });
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.setEnemiesEnabled(false); d.clearAsteroids(); d.setAsteroidDensity(0); });
  const f0 = await dbg(page, 'fields');
  expect(f0.rings.saturnus).toBeGreaterThanOrEqual(2000);
  expect(f0.rings.jupiter).toBeGreaterThan(0);
  expect(f0.rings.uranus).toBeGreaterThan(0);
  expect(await dbg(page, 'enterRing', 'saturnus', 0.45)).toBe(true);
  await expect.poll(async () => (await dbg(page, 'fields')).linkedList.filter((a) => a.src === 'ring').length, { timeout: 4000 }).toBeGreaterThan(3);
  await page.screenshot({ path: 'docs/screenshots/cincin-saturnus.jpg', type: 'jpeg', quality: 82 });
  // Batu tertaut adalah asteroid sungguhan: bisa dihancurkan dengan ultimate
  await dbg(page, 'fillUltimate');
  await dbg(page, 'fireUltimate');
  await expect.poll(async () => (await dbg(page, 'fields')).destroyed, { timeout: 5000 }).toBeGreaterThan(1);
  const destroyed = (await dbg(page, 'fields')).destroyed;
  // Pergi jauh: tautan dilepas; kembali: yang hancur tidak muncul lagi
  await dbg(page, 'viewBody', 'bumi', 3);
  await expect.poll(async () => (await dbg(page, 'fields')).linkedList.filter((a) => a.src === 'ring').length, { timeout: 4000 }).toBe(0);
  await dbg(page, 'enterRing', 'saturnus', 0.45);
  await page.waitForTimeout(800);
  expect((await dbg(page, 'fields')).destroyed).toBeGreaterThanOrEqual(destroyed);
});

test('B9: Sabuk Asteroid dan Sabuk Kuiper padat dengan LOD dan awal yang aman', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.setEnemiesEnabled(false); d.clearAsteroids(); d.setAsteroidDensity(0); });
  await dbg(page, 'viewArea', 'sabuk');
  await expect.poll(async () => (await dbg(page, 'fields')).linked, { timeout: 4000 }).toBeGreaterThan(3);
  const s = await dbg(page, 'fields');
  expect(s.beltHere).toBe('sabuk');
  expect(s.belt).toBeGreaterThan(300);
  for (const a of s.linkedList) expect(a.src).toBe('belt');
  await page.screenshot({ path: 'docs/screenshots/sabuk-asteroid.jpg', type: 'jpeg', quality: 82 });
  await dbg(page, 'viewArea', 'kuiper');
  await expect.poll(async () => (await dbg(page, 'fields')).beltHere, { timeout: 3000 }).toBe('kuiper');
  expect((await dbg(page, 'fields')).belt).toBeGreaterThan(100);
  // Mulai di area sabuk tanpa langsung menabrak (gelembung aman di titik mulai)
  await dbg(page, 'setArea', 'sabuk');
  await page.evaluate(() => { window.__game.debug.setGod(false); window.__game.restart(); window.__game.skipTransition(); });
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({ s: window.__game.snapshot(), f: window.__game.debug.fields() }));
  expect(after.f.beltHere).toBe('sabuk');
  expect(after.s.deathCause).toBe('');
});

test('B10: latar Bima Sakti, galaksi, dan black hole yang hanya terlihat dari Tata Surya luar', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.setEnemiesEnabled(false); d.clearAsteroids(); d.setAsteroidDensity(0); });
  await dbg(page, 'viewBody', 'bumi', 3);
  await page.waitForTimeout(300);
  const inner = await dbg(page, 'sky');
  expect(inner.milky).toBe(true);
  expect(inner.galaxies).toBeGreaterThanOrEqual(3);
  expect(inner.blackHole).toBe(0);
  await dbg(page, 'viewBody', 'neptunus', 3);
  await dbg(page, 'lookBlackHole');
  await page.waitForTimeout(400);
  expect((await dbg(page, 'sky')).blackHole).toBeGreaterThan(0.9);
  await page.screenshot({ path: 'docs/screenshots/black-hole.jpg', type: 'jpeg', quality: 82 });
});

test('B10: dinding batas jelajah memberi peringatan dan mendorong balik tanpa game over', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 540 });
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.setEnemiesEnabled(false); d.setGod(false); });
  const limit = (await dbg(page, 'boundary')).limit;
  await dbg(page, 'setPlayerState', { x: limit + 300, y: 0, z: 0, yaw: -Math.PI / 2 });   // menghadap keluar
  await expect.poll(async () => (await dbg(page, 'boundary')).warning, { timeout: 3000 }).toBe('KELUAR BATAS MISI');
  await expect(page.locator('#warning')).toHaveText('KELUAR BATAS MISI');
  await page.screenshot({ path: 'docs/screenshots/batas-jelajah.jpg', type: 'jpeg', quality: 82 });
  const b = await dbg(page, 'boundary');
  expect(b.r).toBeLessThanOrEqual(limit);
  expect(b.wall).toBeGreaterThan(0.9);
  // Kapal diputar ke dalam dan permainan tetap berjalan
  await expect.poll(async () => (await dbg(page, 'boundary')).fwdIn, { timeout: 8000 }).toBeGreaterThan(0.2);
  const s = await snap(page);
  expect(s.state).toBe('playing');
  expect(s.deathCause).toBe('');
});

test('B10: panel data fakta muncul saat mendekat dan Penemuan tersimpan setelah reload', async ({ page }) => {
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.setEnemiesEnabled(false); d.clearAsteroids(); d.setAsteroidDensity(0); });
  expect(await dbg(page, 'discoveries')).not.toContain('mars');
  await dbg(page, 'viewBody', 'mars', 2.2);
  await expect.poll(async () => (await dbg(page, 'dataPanel')).title, { timeout: 3000 }).toBe('Mars');
  const p = await dbg(page, 'dataPanel');
  expect(p.visible).toBe(true);
  expect(p.facts).toBeGreaterThanOrEqual(2);
  expect(p.isNew).toBe(true);
  await expect(page.locator('#data-panel')).toContainText('Olympus Mons');
  expect(await dbg(page, 'discoveries')).toContain('mars');
  // Muat ulang: atlas Penemuan di menu masih mencatat Mars
  await open(page);
  expect(await dbg(page, 'discoveries')).toContain('mars');
  await page.click('#btn-atlas');
  await expect(page.locator('#screen-atlas')).toBeVisible();
  await expect(page.locator('.acard[data-id="mars"]')).toContainText('Mars');
  await expect(page.locator('.acard[data-id="mars"]')).not.toHaveClass(/locked/);
  await expect(page.locator('.acard[data-id="neptunus"]')).toHaveClass(/locked/);
  await page.click('#btn-atlas-back');
  await expect(page.locator('#screen-atlas')).toBeHidden();
});

test('B11: Kampanye 10 stage, gerbang loncat setelah gelombang bersih, warp ke stage berikutnya, progres tersimpan', async ({ page }) => {
  test.setTimeout(60000);
  await start(page, { world: 'space', mode: 'campaign' });
  let c = await dbg(page, 'campaign');
  expect(c.active).toBe(true);
  expect(c.stage).toBe(1);
  expect(c.area).toBe('merkurius');
  await expect(page.locator('#stage-label')).toHaveText('STAGE 1/10 MERKURIUS');
  // Gelombang stage selesai: gerbang loncat muncul, peta tidak bisa dipakai untuk warp bebas
  await dbg(page, 'finishStage');
  await expect.poll(async () => (await dbg(page, 'campaign')).gate, { timeout: 3000 }).toBe(true);
  c = await dbg(page, 'campaign');
  expect(c.cleared).toBe(true);
  expect(c.saved.stage).toBe(2);
  await page.keyboard.press('Tab');
  await expect(page.locator('#screen-map')).toBeVisible();
  for (const b of (await dbg(page, 'mapState')).buttons) expect(b.disabled).toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.locator('#screen-map')).toBeHidden();
  // Kapal terbang lurus melewati gerbang di depannya: warp ke Venus
  await page.screenshot({ path: 'docs/screenshots/gerbang-loncat.jpg', type: 'jpeg', quality: 82 });
  await expect.poll(async () => (await dbg(page, 'campaign')).area, { timeout: 15000 }).toBe('venus');
  await expect.poll(async () => (await dbg(page, 'campaign')).warp, { timeout: 5000 }).toBe(false);
  c = await dbg(page, 'campaign');
  expect(c.stage).toBe(2);
  await expect(page.locator('#stage-label')).toHaveText('STAGE 2/10 VENUS');
  // Hook setStage langsung ke stage 10 (area Pluto)
  await dbg(page, 'setStage', 10);
  await expect.poll(async () => (await dbg(page, 'campaign')).area, { timeout: 5000 }).toBe('pluto');
  // Progres tersimpan: setelah reload, kartu mode menawarkan lanjut stage 2
  await open(page);
  await page.click('#btn-start');
  await page.click('.tcard[data-world="space"]');
  await expect(page.locator('#mode-progress')).toHaveText('Lanjut stage 2 dari 10');
});

test('B11: Jelajah Bebas, peta Tab menampilkan orbit dan warp sinematik ke area pilihan', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page, { world: 'space', mode: 'free' });
  const c = await dbg(page, 'campaign');
  expect(c.active).toBe(false);
  expect(c.label).toBe('JELAJAH BEBAS');
  await page.keyboard.press('Tab');
  await expect(page.locator('#screen-map')).toBeVisible();
  expect((await snap(page)).state).toBe('map');
  const m = await dbg(page, 'mapState');
  expect(m.buttons.length).toBe(11);
  for (const b of m.buttons) expect(b.disabled).toBe(false);
  await page.screenshot({ path: 'docs/screenshots/peta-tata-surya.jpg', type: 'jpeg', quality: 82 });
  await page.click('.map-btn[data-area="saturnus"]');
  await expect(page.locator('#screen-map')).toBeHidden();
  await expect.poll(async () => (await dbg(page, 'campaign')).warp, { timeout: 2000 }).toBe(true);
  await expect.poll(async () => (await dbg(page, 'campaign')).area, { timeout: 3000 }).toBe('saturnus');
  await expect.poll(async () => (await dbg(page, 'campaign')).warp, { timeout: 4000 }).toBe(false);
  // Tiba di dekat Saturnus: panel data muncul dan area tersimpan untuk sesi berikutnya
  await expect.poll(async () => (await dbg(page, 'dataPanel')).title, { timeout: 4000 }).toBe('Saturnus');
  expect((await dbg(page, 'campaign')).saved.freeArea).toBe('saturnus');
  // Esc juga menutup peta
  await page.keyboard.press('Tab');
  await expect(page.locator('#screen-map')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#screen-map')).toBeHidden();
  expect((await snap(page)).state).toBe('playing');
});

test('S9 dan A5: galeri ?gallery=1 menampilkan semua jenis musuh dengan anggaran segitiga wajar', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/index.html?gallery=1');
  await page.waitForFunction(() => window.__gallery);
  const g = await page.evaluate(() => ({ types: window.__gallery.types, tris: window.__gallery.triangles }));
  // 8 jenis ancaman ditambah 6 kapal Sindikat Vanta (beberapa berbagi peran), plus ranjau dan rudal
  for (const t of ['drone', 'gunship', 'scout', 'hunter', 'guardian', 'stalker', 'commander', 'sniper', 'minelayer', 'shieldship', 'creature', 'carrier', 'station', 'mine', 'missile']) expect(g.types).toContain(t);
  for (const [t, n] of Object.entries(g.tris)) expect(n, t).toBeLessThan(2500);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOT_DIR}galeri-musuh.png` });
});

test('S9 dan A5: perilaku khusus roster (perisai, pengawal, penyamaran, garis bidik, ranjau, kapal induk)', async ({ page }) => {
  test.setTimeout(60000);
  await start(page, { world: 'space' });
  await page.evaluate(() => { const d = window.__game.debug; d.clearAsteroids(); d.setAsteroidDensity(0); });
  // Komandan datang dengan perisai dan dua pengawal; perisai menyerap damage lebih dulu
  expect(await dbg(page, 'spawnGroup', 'commander', 1)).toBe(1);
  let info = await dbg(page, 'enemyInfo');
  expect(info.filter((e) => e.leader === 'commander').length).toBe(2);
  const before = info.find((e) => e.type === 'commander');
  const hit = await dbg(page, 'damageEnemy', 'commander', 50);
  expect(hit.dealt).toBe(0);
  expect(hit.hp).toBe(before.hp);
  expect(hit.shield).toBeLessThan(before.shield);
  // Penyergap muncul tersamar
  await dbg(page, 'spawnEnemy', 'stalker');
  info = await dbg(page, 'enemyInfo');
  expect(info.find((e) => e.type === 'stalker').cloak).toBeLessThan(0.3);
  // Penembak Jitu: garis bidik tampil sebelum peluru pertama
  await dbg(page, 'startWave', 1);                                   // bersihkan musuh lain
  await dbg(page, 'spawnEnemy', 'sniper', 320, 0, 20);
  await expect.poll(async () => (await dbg(page, 'enemyInfo')).some((e) => e.aim), { timeout: 8000 }).toBe(true);
  // Penabur Ranjau menjatuhkan ranjau; Kapal Induk meluncurkan drone
  await dbg(page, 'spawnEnemy', 'minelayer', 250, 0.3);
  await dbg(page, 'spawnEnemy', 'carrier', 420, -0.5);
  await expect.poll(async () => (await dbg(page, 'enemyInfo')).some((e) => e.type === 'mine'), { timeout: 8000 }).toBe(true);
  await expect.poll(async () => (await dbg(page, 'enemyInfo')).some((e) => e.owner === 'carrier'), { timeout: 12000 }).toBe(true);
});

test('S9 dan A5: rudal Pemburu bisa ditembak jatuh, ranjau meledak bila didekati', async ({ page }) => {
  await start(page, { world: 'space', god: false });
  await page.evaluate(() => { const d = window.__game.debug; d.clearAsteroids(); d.setAsteroidDensity(0); });
  await page.waitForTimeout(2600);   // lewati kebal awal
  // Rudal di depan: tahan Enter, rudal hancur sebelum mengenai
  await dbg(page, 'spawnEnemy', 'missile', 160, 0, 0);
  await page.keyboard.down('Enter');
  await expect.poll(async () => (await dbg(page, 'enemyInfo')).some((e) => e.type === 'missile'), { timeout: 4000 }).toBe(false);
  await page.keyboard.up('Enter');
  expect((await snap(page)).health).toBe(100);
  // Ranjau tepat di jalur: menyala lalu meledak dan memberi damage
  await dbg(page, 'spawnEnemy', 'mine', 50, 0, 0);
  await expect.poll(async () => (await snap(page)).health, { timeout: 5000 }).toBeLessThan(100);
});

test('S9 dan A5: gelombang Angkasa lanjutan berisi roster lengkap dan tetap adil', async ({ page }) => {
  await start(page, { world: 'space', enemies: true, seed: 4242 });
  const r = await page.evaluate(() => {
    const d = window.__game.debug;
    d.resetMetrics();
    const q = d.startWave(7);
    const types = new Set();
    for (let i = 0; i < 24; i++) { d.simulate(5, 0); d.enemyInfo().forEach((e) => types.add(e.type)); }
    return { q, types: [...types], m: d.metrics(), limit: d.enemySpeeds().limit };
  });
  test.info().annotations.push({ type: 'metrik-roster', description: JSON.stringify(r.m) });
  expect(r.types.length).toBeGreaterThanOrEqual(10);
  const cfg = await page.evaluate(() => window.__game.config().balance);
  expect(r.m.tailRatio).toBeLessThan(cfg.maxTailRatio);
  expect(r.m.collisionsPerMin).toBeLessThan(cfg.maxCollisionsPerMin);
  expect(r.m.ramsPerMin).toBeLessThan(cfg.maxRamsPerMin);
});

test('B12: cutscene berskrip dengan letterbox dan subtitle, dunia dijeda, bisa dilewati Enter, Esc, dan tap', async ({ page }) => {
  await start(page, { world: 'space' });
  const t0 = (await snap(page)).time;
  expect(await dbg(page, 'playCutscene', 'demo')).toBe(true);
  await page.waitForTimeout(700);
  let c = await dbg(page, 'cutscene');
  expect(c.state).toBe('cutscene');
  expect(c.bars).toBe(true);
  expect(c.text.length).toBeGreaterThan(3);
  await expect(page.locator('#cutscene .cs-sub')).toBeVisible();
  await expect(page.locator('#hud')).toBeHidden();
  expect((await snap(page)).time).toBe(t0);                     // simulasi dijeda
  await page.screenshot({ path: 'docs/screenshots/cutscene.jpg', type: 'jpeg', quality: 82 });
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await snap(page)).state).toBe('playing');
  await dbg(page, 'playCutscene', 'demo');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await snap(page)).state).toBe('playing');
  await dbg(page, 'playCutscene', 'demo');
  await page.mouse.click(400, 300);                              // tap atau klik di layar
  await expect.poll(async () => (await snap(page)).state).toBe('playing');
  // Tanpa dilewati, cutscene selesai sendiri dan kembali bermain
  await dbg(page, 'playCutscene', 'demo');
  await expect.poll(async () => (await snap(page)).state, { timeout: 7000 }).toBe('playing');
});

test('B12: pembuka stage kampanye diputar sekali per stage', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.debug.setEnemiesEnabled(false); g.startIn('space', 'campaign'); g.skipTransition(); });
  let c = await dbg(page, 'cutscene');
  expect(c.active).toBe('stage-1');
  expect(c.who).toBe('PIKO');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await snap(page)).state).toBe('playing');
  // Sesi berikutnya: stage 1 sudah pernah dilihat
  await open(page);
  await page.evaluate(() => { const g = window.__game; g.debug.setEnemiesEnabled(false); g.startIn('space', 'campaign'); g.skipTransition(); });
  c = await dbg(page, 'cutscene');
  expect(c.active).toBe(null);
  expect((await snap(page)).state).toBe('playing');
});
