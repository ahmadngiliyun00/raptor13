// Uji blok BT: keterlihatan dan pelacakan bos (B2 sampai B4), perilaku bos per kesulitan (B5), dan tabrakan
// berbasis ukuran dan energi (B6). Rincian di docs/bos/ dan docs/fisika/tabrakan.md.
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

async function play(page, world, { query = '', settings = {}, hp = false } = {}) {
  await page.addInitScript(([extra, hpMode]) => {
    const k = 'raptor13.v3', d = JSON.parse(localStorage.getItem(k) || '{}');
    d.version = 3;
    d.settings = Object.assign(d.settings || {}, { tutorialDone: true, touchPromptShown: true, a2hsHintShown: true }, hpMode ? { controlMode: 'hp' } : {}, extra);
    localStorage.setItem(k, JSON.stringify(d));
  }, [settings, hp]);
  await page.goto(gameUrl(query));
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  await page.evaluate((w) => {
    const g = window.__game, d = g.debug;
    g.setSeed(4242); d.setEnemiesEnabled(false); d.setGod(true);
    if (w === 'earth') g.startIn('earth'); else { d.setArea(w); g.startIn('space', 'free'); }
    g.skipTransition(); d.skipCutscene();
    if (w !== 'earth') d.viewArea(w);
  }, world);
  await page.waitForTimeout(300);
}

// ---------- B2: keterlihatan di semua dunia dan jarak ----------
const WORLDS = ['earth', 'merkurius', 'venus', 'bumi', 'mars', 'sabuk', 'jupiter', 'saturnus', 'uranus', 'neptunus', 'pluto', 'kuiper'];
test('B2: tiap bos terlihat di tiap dunia pada jarak 50 sampai 1200 (piksel kontur atau penanda), satu draw call kontur', async ({ page }) => {
  test.setTimeout(240_000);
  const failures = [];
  for (const world of WORLDS) {
    if (world === 'earth' ? true : world === 'merkurius') await play(page, world);
    else await page.evaluate((w) => { const d = window.__game.debug; d.setArea(w); d.viewArea(w); }, world);
    await page.waitForTimeout(200);
    for (const kind of ['raksasa', 'miner', 'hunter', 'naga']) {
      for (const dist of [50, 150, 400, 1200]) {
        const r = await page.evaluate(([kind, dist]) => { const d = window.__game.debug; const p = d.bossProbe({ kind, dist, bloom: false }); const h = d.bossHud(); return { px: p.pixels, contrast: p.meanContrast, onScreen: p.onScreen, state: h.state, dot: !!h.dot, mark: !!h.markInfo || h.state === 'mark' }; }, [kind, dist]);
        // Terlihat: minimal 20 piksel bos di kanvas, atau penanda di atas bos (braket atau titik piksel minimum) tampil
        const ok = r.px >= 20 ? true : (r.state === 'mark' ? true : r.dot);
        if (!ok) failures.push(`${world} ${kind} ${dist}: ${JSON.stringify(r)}`);
      }
      const fx = await dbg(page, 'bossFx');
      expect(fx.extra, `${world} ${kind} kontur satu draw call`).toBe(1);
    }
  }
  expect(failures).toEqual([]);
});

// ---------- D5: titik piksel minimum untuk semua bos ----------
test('D5: titik piksel minimum 16 piksel bercincin gelap tampil untuk keempat bos saat jauh, tersembunyi saat dekat', async ({ page }) => {
  test.setTimeout(120_000);
  for (const world of ['earth', 'saturnus']) {
    await play(page, world);
    // Jarak tempat tiap bos sekitar 11 piksel di layar 720 piksel (ukuran bos berbeda)
    for (const [kind, dist] of [['raksasa', 1340], ['miner', 1900], ['hunter', 960], ['naga', 3800]]) {
      const far = await page.evaluate(([kind, dist]) => { const d = window.__game.debug; const p = d.bossProbe({ kind, dist, bloom: false }); const h = d.bossHud(); const el = document.getElementById('boss-dot'); return { on: p.onScreen, px: p.expectPx, state: h.state, dot: h.dot, ring: getComputedStyle(el).boxShadow }; }, [kind, dist]);
      expect(far.px, `${world} ${kind} ukuran`).toBeLessThan(14);
      expect(far.on, `${world} ${kind}`).toBe(true);
      expect(far.state, `${world} ${kind} braket`).toBe('mark');
      expect(far.dot?.w, `${world} ${kind} titik`).toBeGreaterThanOrEqual(16);
      expect(far.ring, `${world} ${kind} cincin gelap`).toContain('rgba(12, 4, 12');
      const near = await page.evaluate((kind) => { const d = window.__game.debug; d.bossProbe({ kind, dist: 150, bloom: false }); return d.bossHud().dot; }, kind);
      expect(near, `${world} ${kind} dekat`).toBeNull();
    }
  }
});

// ---------- B3 dan B4: penanda tidak menimpa HUD, tidak masuk zona tengah HP ----------
const HUD_SEL = ['#touch .tbtn', '#joy', '#dpad', '.hud-block', '.hpx-block', '#radar', '#btn-radar-map', '#notify.show', '#alerts .alert:not([data-alert="boss"])', '#piko-panel', '#data-panel', '#boss-bar', '#toolbar .tool', '#maneuvers', '#buffs .buff', '#warning', '#rear-warn', '#comet-warn', '#critical'];
const SIZES = [[568, 320, true], [667, 375, true], [844, 390, true], [932, 430, true], [1440, 900, false]];
for (const [w, h, hp] of SIZES) {
  test(`B3: panah tepi, indikator di belakang, dan penanda bos aman di ${w}x${h}${hp ? ' (HP)' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await play(page, 'saturnus', { hp });
    await dbg(page, 'startBoss', 'hunter');
    await page.waitForTimeout(2600);   // pengenalan selesai dan mengecil
    const out = [];
    for (const [name, l] of [['depan', [10, 6, 260]], ['kanan', [500, 0, 40]], ['kiri', [-500, 0, 40]], ['atas', [0, 400, 30]], ['bawah', [0, -400, 30]], ['belakang', [40, 5, -300]], ['belakang kiri', [-200, 0, -250]]]) {
      await dbg(page, 'placeBoss', ...l);
      await page.waitForTimeout(220);
      const r = await page.evaluate(([sel, hpMode]) => {
        const st = window.__game.debug.bossHud();
        const rects = [];
        for (const s of sel) for (const el of document.querySelectorAll(s)) { const b = el.getBoundingClientRect(); if (b.width > 0 ? b.height > 0 : false) rects.push({ s, x: b.left, y: b.top, w: b.width, h: b.height }); }
        const W = innerWidth, H = innerHeight;
        const hit = (a, b) => (a.x < b.x + b.w - 1 ? (a.x + a.w > b.x + 1 ? (a.y < b.y + b.h - 1 ? a.y + a.h > b.y + 1 : false) : false) : false);
        const center = { x: W * 0.3, y: H * 0.2, w: W * 0.4, h: H * 0.6 };
        const probs = [];
        for (const [k, box] of [['edge', st.edge], ['rearEl', st.rearEl], ['rearChip', st.rearChip]]) {
          if (!box) continue;
          for (const r of rects) if (hit(box, r)) probs.push(k + ' menimpa ' + r.s);
          if (hpMode ? hit(box, center) : false) probs.push(k + ' masuk zona tengah');
          if (box.x < 0 ? true : (box.y < 0 ? true : (box.x + box.w > W ? true : box.y + box.h > H))) probs.push(k + ' keluar layar');
        }
        return { st: st.state, rear: st.rear, edge: !!st.edge, turn: st.edgeTurn, rearShown: !!(st.rearEl || st.rearChip), probs };
      }, [HUD_SEL, hp]);
      out.push({ name, ...r });
    }
    for (const o of out) expect(o.probs, `${o.name}`).toEqual([]);
    const byName = Object.fromEntries(out.map((o) => [o.name, o]));
    expect(byName['depan'].st).toBe('mark');
    expect(byName['kanan'].edge || byName['kanan'].st === 'mark').toBe(true);
    expect(byName['belakang'].edge).toBe(true);
    expect(byName['belakang'].turn).toBe(true);
    expect(byName['belakang'].rearShown).toBe(true);
    expect(byName['depan'].rearShown).toBe(false);
  });
}

test('B3 dan B4: ikon di baris misi, pengenalan di tepi atas, radar menandai bos, peta menampilkan ikon, titik bidik ikut Bantuan bidik', async ({ page }) => {
  await play(page, 'saturnus');
  await dbg(page, 'startBoss', 'hunter');
  await page.waitForTimeout(300);
  let h = await dbg(page, 'bossHud');
  expect(h.barName).toBe('BOS: Pemburu Agung');
  expect(h.intro).not.toBeNull();
  expect(h.intro.y).toBeLessThan(140);
  await page.waitForTimeout(3200);
  h = await dbg(page, 'bossHud');
  expect(h.introStage).toBe(0);
  expect((await dbg(page, 'radar')).counts.boss).toBe(1);
  await dbg(page, 'placeBoss', 10, 5, 220);
  await page.waitForTimeout(250);
  expect((await dbg(page, 'bossHud')).lead).not.toBeNull();
  await dbg(page, 'setSetting', 'aimAssist', 'mati');
  await dbg(page, 'placeBoss', 10, 5, 220);
  await page.waitForTimeout(250);
  expect((await dbg(page, 'bossHud')).lead).toBeNull();
  expect(await dbg(page, 'openMap')).toBe(true);
});

// ---------- B5: perilaku per kesulitan ----------
test('B5: bos lebih sering di depan pada Mudah daripada Sulit, batas ekor dipatuhi, ada jendela rentan, nyaris tanpa tabrakan', async ({ page }) => {
  test.setTimeout(180_000);
  await play(page, 'sabuk', { query: 'kualitas=rendah' });
  const res = {};
  for (const difficulty of ['mudah', 'normal', 'sulit']) res[difficulty] = await page.evaluate((difficulty) => window.__game.debug.bossSim('miner', 90, { difficulty, bot: 'jelajah' }), difficulty);
  expect(res.mudah.frontPct).toBeGreaterThan(res.sulit.frontPct + 15);
  expect(res.mudah.frontPct).toBeGreaterThan(50);
  expect(res.sulit.frontPct).toBeGreaterThan(12);
  expect(res.mudah.maxRearStreak).toBeLessThan(4);
  expect(res.normal.maxRearStreak).toBeLessThan(6);
  expect(res.sulit.maxRearStreak).toBeLessThan(9);
  for (const d of Object.keys(res)) { expect(res[d].vulnWindows).toBeGreaterThan(0); expect(res[d].contactsPerMin).toBeLessThan(2); }
});

// ---------- B6: tabrakan ----------
test('B6: tabel tabrakan, kerikil tanpa damage, puing 1 sampai 3 persen, asteroid sedang mengurangi persen HP, benda besar dan kelas besar fatal', async ({ page }) => {
  await play(page, 'bumi');
  const rows = await dbg(page, 'collisionTest', 'tabel');
  const row = (benda, kecepatan) => rows.find((r) => r.benda.startsWith(benda) ? r.kecepatan === kecepatan : false);
  for (const sp of ['rendah', 'dasar', 'nitro', 'ekstrem']) expect(row('kerikil', sp).persen).toBe(0);
  for (const sp of ['rendah', 'dasar', 'nitro', 'ekstrem']) { expect(row('puing', sp).tier).toBe('pantul'); expect(row('puing', sp).persen).toBeLessThanOrEqual(3); expect(row('puing', sp).persen).toBeGreaterThanOrEqual(1); }
  expect(row('asteroid sedang', 'dasar').tier).toBe('sedang');
  expect(row('asteroid sedang', 'dasar').persen).toBeGreaterThan(5);
  expect(row('asteroid sedang', 'dasar').persen).toBeLessThan(40);
  expect(row('asteroid kecil', 'nitro').persen).toBeGreaterThan(row('asteroid kecil', 'rendah').persen);
  expect(row('asteroid sedang', 'dasar').mudah).toBeLessThan(row('asteroid sedang', 'dasar').sulit);
  for (const b of ['asteroid raksasa', 'bulan', 'planet', 'daratan', 'bos']) for (const sp of ['rendah', 'dasar', 'nitro', 'ekstrem']) expect(row(b, sp).tier, b + ' ' + sp).toBe('fatal');
});

test('B6: benturan nyata lewat jalur permainan tercatat sekali, tidak tembus pada kecepatan ekstrem', async ({ page }) => {
  await play(page, 'bumi');
  const t = (o, v) => dbg(page, 'collisionTest', o, v);
  const pebble = await t({ radius: 0.6, kind: 'ice' }, 70);
  expect(pebble.hits).toBe(1); expect(pebble.lostPct).toBe(0); expect(pebble.fatal).toBe(false);
  const debris = await t({ radius: 1.5, kind: 'rock' }, 70);
  expect(debris.hits).toBe(1); expect(debris.lostPct).toBeLessThanOrEqual(3); expect(debris.fatal).toBe(false);
  const medium = await t({ radius: 6, kind: 'rock' }, 70);
  expect(medium.hits).toBe(1); expect(medium.tier).toBe('sedang'); expect(medium.lostPct).toBeGreaterThan(5); expect(medium.alive).toBe(true);
  const giant = await t({ radius: 18, kind: 'rock' }, 70);
  expect(giant.hits).toBe(1); expect(giant.fatal).toBe(true);
  for (const v of [2000, 6000]) {
    const fast = await t({ radius: 0.6, kind: 'ice' }, v);
    expect(fast.stepPerFrame).toBeGreaterThan(20);
    expect(fast.hits, 'tanpa tembus pada ' + v).toBe(1);
  }
  const fastRock = await t({ radius: 3, kind: 'rock' }, 2000);
  expect(fastRock.hits).toBe(1);
});

// ---------- D3: penanda bos ringkas, jarak aman dari crosshair, tidak menutupi siluet ----------
const ptRectDist = (px, py, r) => { const dx = Math.max(r.x - px, 0, px - (r.x + r.w)), dy = Math.max(r.y - py, 0, py - (r.y + r.h)); return Math.hypot(dx, dy); };
for (const [w, h, hp] of [[568, 320, true], [844, 390, true], [932, 430, true], [1440, 900, false]]) {
  test(`D3: penanda bos ringkas di tengah, bar tipis saat besar, lengkap saat jauh di ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await play(page, 'saturnus', { hp });
    await dbg(page, 'startBoss', 'hunter');
    await page.waitForTimeout(2600);
    const at = async (l) => { await dbg(page, 'placeBoss', ...l); await page.waitForTimeout(650); await dbg(page, 'placeBoss', ...l); await page.waitForTimeout(120); return dbg(page, 'bossHud'); };
    // Di dekat crosshair (sedang dibidik)
    const c = await at([0, 3, 320]);
    expect(c.state).toBe('mark');
    expect(c.form).toBe('ringkas');
    expect(c.markInfo, 'tanpa nama dan jarak').toBeNull();
    for (const k of c.corners) expect(ptRectDist(c.ret[0], c.ret[1], k), 'sudut braket jauh dari crosshair').toBeGreaterThanOrEqual(28);
    expect(ptRectDist(c.ret[0], c.ret[1], c.hpBar)).toBeGreaterThanOrEqual(28);
    for (const k of c.corners) expect(ptRectDist(c.bossBox.x, c.bossBox.y, k), 'braket di luar siluet').toBeGreaterThanOrEqual(c.bossBox.r * 0.9);
    // Dekat sekali: bos besar di layar, hanya bar HP tipis di atas siluet
    const b = await at([0, 2, 30]);
    expect(b.form).toBe('besar');
    expect(b.corners.length).toBe(0);
    expect(b.hpBar.y + b.hpBar.h).toBeLessThanOrEqual(b.bossBox.y);
    // Jauh dari tengah: bentuk lengkap dengan nama dan jarak
    const f = await at([-380, 150, 520]);
    if (f.state === 'mark') { expect(f.form).toBe('lengkap'); expect(f.markInfo).not.toBeNull(); }
  });
}

// ---------- D4: hitbox sesuai bentuk dan indikator bahaya fatal ----------
test('D4: semua hitbox dalam toleransi 15 persen (kecuali hitbox pemain yang sengaja pemaaf), bos tercakup bola padat', async ({ page }) => {
  await play(page, 'mars');
  const rows = await dbg(page, 'hitboxAudit');
  const bad = rows.filter((r) => r.status !== 'lolos' ? !r.objek.startsWith('pesawat pemain') : false);
  expect(bad, JSON.stringify(bad)).toEqual([]);
  expect(rows.length).toBeGreaterThan(30);
  expect(await dbg(page, 'showHitboxes', true)).toBe(true);
  expect(await dbg(page, 'showHitboxes', false)).toBe(false);
});

test('D4: indikator BELOK SEKARANG muncul sebelum benda fatal di jalur, tidak muncul untuk benda yang tidak fatal', async ({ page }) => {
  await play(page, 'bumi', { query: 'kualitas=rendah' });
  await page.evaluate(() => { const d = window.__game.debug; d.clearAsteroids(); d.setAsteroidDensity(0); });
  // Asteroid sedang (R 6) tepat di jalur: tidak fatal, tanpa indikator
  await dbg(page, 'spawnAsteroid', 'medium', 120, 0, 0, 'rock');
  await page.waitForTimeout(200);
  let f = await dbg(page, 'fatalWatch');
  expect(f.hit).toBe(false);
  expect(f.warning === 'BELOK SEKARANG').toBe(false);
  await page.evaluate(() => window.__game.debug.clearAsteroids());
  // Asteroid besar (R 11) di jalur: fatal, indikator muncul dengan sisa waktu kurang dari 2,5 detik
  await dbg(page, 'spawnAsteroid', 'large', 140, 0, 0, 'rock');
  await page.waitForTimeout(200);
  f = await dbg(page, 'fatalWatch');
  expect(f.hit).toBe(true);
  expect(f.ttc).toBeLessThan(2.5);
  expect(f.warning).toBe('BELOK SEKARANG');
  expect(f.edge).toBe(true);
  expect(f.visualR).toBeGreaterThan(3);
});
