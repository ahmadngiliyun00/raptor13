// Uji blok H: tata letak dan kontrol mode HP landscape di seluruh matriks ukuran layar.
// Jalankan: npm test (screenshot docs/screenshots/hp/ hanya ditulis bila SHOTS=1)
import { test as base, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Hook uji (window.__game) hanya aktif dengan ?debug=1 (A3); parameter lain digabung lewat URLSearchParams
const gameUrl = (q = '') => { const p = new URLSearchParams(String(q).replace(/^\?/, '')); p.set('debug', '1'); return '/index.html?' + p.toString(); };


const SHOT_DIR = fileURLToPath(new URL('../docs/screenshots/hp/', import.meta.url));
const SHOTS = process.env.SHOTS === '1';
if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });
const isDriverNoise = (text) => /GL Driver Message|GPU stall due to ReadPixels/.test(text);

// Fixture yang sama dengan game.spec.mjs: gagal bila ada console error atau warning, atau aset luar
const test = base.extend({
  page: async ({ page }, use) => {
    // Baterai laptop penguji tidak boleh memicu mode hemat otomatis di tengah uji
    await page.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'getBattery', { value: undefined, configurable: true }); } catch (err) { /* abaikan */ } });
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
      external.push(url);
    });
    await use(page);
    expect(problems, 'console harus bersih').toEqual([]);
    expect(external, 'tidak boleh ada permintaan ke luar (Three.js ditanam lokal)').toEqual([]);
  },
});
test.use({ hasTouch: true, isMobile: true });

// Matriks ukuran tampak (lebar x tinggi), ditambah HP berponi lewat ?safearea
const MATRIX = [[568, 320], [667, 375], [740, 360], [812, 375], [844, 390], [915, 412], [932, 430]];
const NOTCH = '?safearea=47,0,47,21';

const snap = (page) => page.evaluate(() => window.__game.snapshot());
const dbg = (page, fn, ...args) => page.evaluate(([f, a]) => window.__game.debug[f](...a), [fn, args]);

async function openHp(page, w, h, query = '', settings = {}) {
  await page.setViewportSize({ width: w, height: h });
  await page.addInitScript((extra) => {
    const k = 'raptor13.v3';
    const d = JSON.parse(localStorage.getItem(k) || '{}');
    d.version = 3;
    d.settings = Object.assign(d.settings || {}, { controlMode: 'hp', touchPromptShown: true }, extra);
    localStorage.setItem(k, JSON.stringify(d));
  }, settings);
  await page.goto(gameUrl(query));
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
}
async function playHp(page, w, h, query = '', settings = {}, mode = 'campaign', world = 'space') {
  await openHp(page, w, h, query, settings);
  await page.evaluate(([m, wd]) => { const g = window.__game; g.debug.setGod(true); g.debug.setEnemiesEnabled(false); g.startIn(wd, m); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); }, [mode, world]);
  await expect.poll(async () => (await snap(page)).state).toBe('playing');
  await page.waitForTimeout(500);
}

// Audit tata letak di halaman: semua asersi spesifikasi blok H dihitung dari kotak elemen yang tampil
function audit() {
  const W = window.innerWidth, H = window.innerHeight, ed = window.__game.debug.viewport().ed;
  const shown = (el) => {
    for (let e = el; e ? e !== document.body : false; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' ? true : cs.visibility === 'hidden') return false;
    }
    if (Number(getComputedStyle(el).opacity) < 0.01) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 ? r.height > 1 : false;
  };
  const SEL = ['#hpx-status', '#hpx-top', '#toolbar .tool', '#radar', '#btn-radar-map', '#touch .tbtn', '#joy', '#dpad', '#notify', '#alerts .alert', '#boss-bar', '#buffs .buff', '#fs-tip', '#touch-prompt'];
  const TRANSIENT = ['#notify', '#alerts .alert', '#boss-bar', '#buffs .buff', '#fs-tip', '#touch-prompt'];
  const items = [];
  for (const q of SEL) for (const el of document.querySelectorAll(q)) if (shown(el)) items.push({ q, name: q + ':' + (el.dataset.act || el.dataset.man || el.dataset.alert || el.id || el.className.split(' ')[0]), r: el.getBoundingClientRect() });
  const tol = 0.5;
  const out = items.filter(({ r }) => (r.left < ed.l - tol ? true : r.top < ed.t - tol) ? true : (r.right > W - ed.r + tol ? true : r.bottom > H - ed.b + tol)).map((x) => x.name);
  const zx0 = W * 0.3, zx1 = W * 0.7, zy0 = H * 0.2, zy1 = H * 0.8;
  const zone = items.filter(({ r }) => (r.left < zx1 ? r.right > zx0 : false) ? (r.top < zy1 ? r.bottom > zy0 : false) : false).map((x) => x.name);
  const idle = items.filter((x) => !TRANSIENT.includes(x.q));
  const area = idle.reduce((a, { r }) => a + r.width * r.height, 0) / (W * H);
  const box = (list) => {
    if (!list.length) return { w: 0, h: 0 };
    const x0 = Math.min(...list.map((x) => x.r.left)), x1 = Math.max(...list.map((x) => x.r.right));
    const y0 = Math.min(...list.map((x) => x.r.top)), y1 = Math.max(...list.map((x) => x.r.bottom));
    return { w: (x1 - x0) / W, h: (y1 - y0) / H, x0, x1 };
  };
  const act = box(items.filter((x) => x.q === '#touch .tbtn')), left = box(items.filter((x) => x.q === '#joy' ? true : x.q === '#dpad'));
  // Ukuran teks: label HUD minimal 11 px, toast minimal 12 px
  const small = [];
  for (const root of document.querySelectorAll('#hud, #toolbar, #fs-tip')) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!n.textContent.trim() ? true : !shown(el)) continue;
      if (el.closest('.dmgnum, .ind, .hpfloat, #indicators, #dmgnums, #hpbars, #fps')) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize), min = el.closest('#notify') ? 12 : 11;
      if (fs < min - 0.01) small.push((el.id || el.className) + ' ' + fs);
    }
  }
  const lo = window.__game.debug.layoutOverlaps();
  const notifyShown = ['#notify', '#piko-panel', '#data-panel', '#banner', '#toasts .toast'].reduce((a, q) => a + [...document.querySelectorAll(q)].filter(shown).length, 0);
  const n = document.getElementById('notify');
  const nr = shown(n) ? n.getBoundingClientRect() : null;
  return { W, H, out, zone, area: Math.round(area * 1000) / 1000, act, left, small, hits: lo.hits, smallTouch: lo.small, hints: window.__game.debug.keyboardHints(), notifyShown, notifyBottom: nr ? nr.bottom / H : 0, items: items.map((x) => x.name) };
}

function expectAudit(a, label) {
  expect(a.hits, label + ' tumpang tindih').toEqual([]);
  expect(a.out, label + ' keluar layar atau safe area').toEqual([]);
  expect(a.zone, label + ' zona tengah').toEqual([]);
  expect(a.smallTouch, label + ' area sentuh < 44 px').toEqual([]);
  expect(a.small, label + ' teks terlalu kecil').toEqual([]);
  expect(a.hints, label + ' petunjuk keyboard').toEqual([]);
  expect(a.act.h, label + ' tinggi cluster aksi').toBeLessThanOrEqual(0.3 + 1e-3);
  expect(a.act.w, label + ' lebar cluster aksi').toBeLessThanOrEqual(0.26 + 1e-3);
  expect(a.left.h, label + ' tinggi kontrol kiri').toBeLessThanOrEqual(0.3 + 1e-3);
  expect(a.left.w, label + ' lebar kontrol kiri').toBeLessThanOrEqual(0.26 + 1e-3);
  expect(a.notifyShown, label + ' jumlah notifikasi tampil').toBeLessThanOrEqual(1);
  expect(a.notifyBottom, label + ' toast di atas zona tengah').toBeLessThanOrEqual(0.2 + 1e-3);
}

// ---------- tata letak bermain di seluruh matriks ----------
for (const [w, h] of MATRIX) {
  for (const q of w === 844 || w === 568 ? ['', NOTCH] : ['']) {
    test(`H9 tata letak ${w}x${h}${q ? ' berponi' : ''}: idle maksimal 22 persen, zona tengah bebas, kasus terburuk tanpa tumpang tindih`, async ({ page }) => {
      await playHp(page, w, h, q);
      const idle = await page.evaluate(audit);
      expectAudit(idle, 'idle');
      expect(idle.area, 'luas HUD dan kontrol idle').toBeLessThanOrEqual(0.22);
      for (const must of ['#hpx-status:hpx-status', '#hpx-top:hpx-top', '#joy:joy', '#touch .tbtn:fire', '#touch .tbtn:nitro']) expect(idle.items).toContain(must);
      if (q) {
        const v = await dbg(page, 'viewport');
        expect(v.ed).toEqual({ l: 47, t: 8, r: 47, b: 21 });   // max(safe area, 8 px), tidak dijumlahkan dengan 16 px
      }
      // Pesawat: maksimal sekitar 18 persen tinggi, di sepertiga bawah tengah, tidak tertutup UI
      const pf = await dbg(page, 'planeFrame');
      expect(pf.h).toBeLessThanOrEqual(0.185);
      expect(pf.cy).toBeGreaterThan(0.55);
      expect(pf.cy).toBeLessThan(0.8);
      expect(Math.abs(pf.cx - 0.5)).toBeLessThan(0.08);
      if (SHOTS) await page.screenshot({ path: `${SHOT_DIR}${w}x${h}${q ? '-poni' : ''}-main.jpg`, type: 'jpeg', quality: 70 });
      // Kasus terburuk: semua elemen HUD sekaligus
      await dbg(page, 'stressHud');
      await page.waitForTimeout(900);
      const worst = await page.evaluate(audit);
      expectAudit(worst, 'stressHud');
      expect((await dbg(page, 'notify')).visible).toBe(true);
      // Kasus terburuk menyertakan chip BOS DI BELAKANG (B3) karena stressHud memunculkan bos
      expect((await dbg(page, 'alerts'))).toEqual({ boss: true, terrain: true, hp: true, rear: true, comet: true });
      if (SHOTS) await page.screenshot({ path: `${SHOT_DIR}${w}x${h}${q ? '-poni' : ''}-main-stress.jpg`, type: 'jpeg', quality: 70 });
    });
  }
}

// ---------- ukuran kontrol, mode kidal, tombol arah ----------
for (const [w, h] of [[568, 320], [932, 430]]) {
  for (const settings of [{ controlSize: 70 }, { controlSize: 130 }, { leftHanded: true }, { leftStyle: 'dpad' }, { leftStyle: 'dpad', leftHanded: true, controlSize: 130 }]) {
    test(`H9 opsi kontrol ${JSON.stringify(settings)} di ${w}x${h} tetap lolos asersi`, async ({ page }) => {
      await playHp(page, w, h, '', settings);
      const a = await page.evaluate(audit);
      expectAudit(a, JSON.stringify(settings));
      expect(a.area).toBeLessThanOrEqual(0.22);
      const ts = await dbg(page, 'touchState');
      if (settings.controlSize === 130) expect(ts.scale).toBeGreaterThan(1);
      if (settings.controlSize === 70) expect(ts.scale).toBeCloseTo(0.7, 2);
      // Kidal: cluster aksi di kiri, kontrol kiri di kanan
      if (settings.leftHanded) { expect(a.act.x1).toBeLessThan(w * 0.5); expect(a.left.x0).toBeGreaterThan(w * 0.5); }
      else { expect(a.act.x0).toBeGreaterThan(w * 0.5); expect(a.left.x1).toBeLessThan(w * 0.5); }
    });
  }
}

// ---------- fungsi sentuh ----------
const touchJs = async (page, steps) => page.evaluate(async (list) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = [];
  for (const s of list) {
    if (s.wait) { await wait(s.wait); continue; }
    if (s.read) { out.push(window.__game.debug.touchState()); continue; }
    let x = s.x, y = s.y, el;
    if (s.sel) { const r = document.querySelector(s.sel).getBoundingClientRect(); x = r.left + r.width / 2 + (s.dx || 0); y = r.top + r.height / 2 + (s.dy || 0); }
    el = s.target ? document.querySelector(s.target) : document.elementFromPoint(x, y);
    el.dispatchEvent(new PointerEvent(s.type, { bubbles: true, pointerId: s.id, pointerType: 'touch', clientX: x, clientY: y }));
  }
  return out;
}, steps);

test('H9 sentuh: joystick mengatur pitch dan belok, deadzone, tembak dan nitro dan joystick bersamaan', async ({ page }) => {
  await playHp(page, 844, 390);
  const s0 = (await snap(page)).shotsFired;
  const r = await touchJs(page, [
    { type: 'pointerdown', id: 3, x: 200, y: 250 }, { wait: 60 }, { read: 1 },
    { type: 'pointermove', id: 3, x: 200, y: 200, target: '#joy-zone' }, { wait: 80 }, { read: 1 },
    { type: 'pointermove', id: 3, x: 160, y: 250, target: '#joy-zone' }, { wait: 80 }, { read: 1 },
    { type: 'pointermove', id: 3, x: 202, y: 251, target: '#joy-zone' }, { wait: 80 }, { read: 1 },
    { type: 'pointermove', id: 3, x: 230, y: 285, target: '#joy-zone' },
    { type: 'pointerdown', id: 4, sel: '#touch .t-fire', dx: 18 },   // di tepi hit slop sisi kanan tetap kena
    { type: 'pointerdown', id: 5, sel: '#touch .t-nitro' }, { wait: 250 }, { read: 1 },
    { type: 'pointerup', id: 3, target: '#joy-zone', x: 0, y: 0 }, { type: 'pointerup', id: 4, target: '#touch .t-fire', x: 0, y: 0 }, { type: 'pointerup', id: 5, target: '#touch .t-nitro', x: 0, y: 0 },
    { wait: 80 }, { read: 1 },
  ]);
  expect(r[0].joyActive).toBe(true);
  expect(r[1].pitch).toBeGreaterThan(0.9);                    // geser ke atas = naik
  expect(r[2].yaw).toBeGreaterThan(0.9);                      // geser ke kiri = belok kiri
  expect(r[3].pitch).toBe(0); expect(r[3].yaw).toBe(0);       // deadzone
  expect(r[4].pitch).toBeLessThan(-0.3); expect(r[4].yaw).toBeLessThan(-0.3);
  expect(r[4].fire).toBe(true); expect(r[4].nitro).toBe(true); // multi-touch
  expect(r[5].joyActive).toBe(false); expect(r[5].fire).toBe(false); expect(r[5].pitch).toBe(0);
  expect((await snap(page)).shotsFired).toBeGreaterThan(s0);
  // Manuver dan ultimate lewat tombol ikon
  await touchJs(page, [{ type: 'pointerdown', id: 6, sel: '#touch .t-roll' }, { type: 'pointerup', id: 6, sel: '#touch .t-roll' }]);
  await expect.poll(async () => (await snap(page)).maneuver, { timeout: 2000 }).toBe('roll');
  await dbg(page, 'fillUltimate');
  await touchJs(page, [{ type: 'pointerdown', id: 7, sel: '#touch .t-ult' }, { type: 'pointerup', id: 7, sel: '#touch .t-ult' }]);
  await expect.poll(async () => (await dbg(page, 'ultimate')).active, { timeout: 2000 }).toBeGreaterThan(0);
});

test('H9 sentuh: mode kidal menukar sisi, tombol arah menghasilkan arah digital termasuk diagonal', async ({ page }) => {
  await playHp(page, 844, 390, '', { leftHanded: true });
  let r = await touchJs(page, [
    { type: 'pointerdown', id: 3, x: 300, y: 250 }, { wait: 60 }, { read: 1 },      // separuh kiri: bukan joystick di mode kidal
    { type: 'pointerdown', id: 4, x: 650, y: 250 }, { wait: 60 },
    { type: 'pointermove', id: 4, x: 650, y: 200, target: '#joy-zone' }, { wait: 80 }, { read: 1 },
    { type: 'pointerup', id: 4, target: '#joy-zone', x: 0, y: 0 },
  ]);
  expect(r[0].joyActive).toBe(false);
  expect(r[1].joyActive).toBe(true);
  expect(r[1].pitch).toBeGreaterThan(0.9);
  await dbg(page, 'setSetting', 'leftHanded', false);
  await dbg(page, 'setSetting', 'leftStyle', 'dpad');
  r = await touchJs(page, [
    { type: 'pointerdown', id: 5, sel: '#dpad', dx: 0, dy: -30 }, { wait: 60 }, { read: 1 },
    { type: 'pointermove', id: 5, sel: '#dpad', dx: 30, dy: 30, target: '#dpad' }, { wait: 60 }, { read: 1 },
    { type: 'pointerup', id: 5, target: '#dpad', x: 0, y: 0 }, { wait: 60 }, { read: 1 },
  ]);
  expect(r[0].dpad).toEqual({ up: true, down: false, left: false, right: false });
  expect(r[0].pitch).toBe(1);
  expect(r[1].dpad).toEqual({ up: false, down: true, left: false, right: true });
  expect(r[2].dpad).toEqual({ up: false, down: false, left: false, right: false });
});

// ---------- notifikasi tunggal dan Bantuan robot ----------
test('H9 notifikasi: satu toast, antrean prioritas, kedaluwarsa, prioritas tinggi menyela, Bantuan robot Hanya ikon', async ({ page }) => {
  await playHp(page, 667, 375, '', {}, 'free', 'earth');              // medan Bumi tanpa musuh: tidak ada komet, kontrak, atau penemuan
  await page.waitForTimeout(3800);                                     // biarkan sapaan awal selesai
  // Piko dimatikan selama uji antrean: pickup langka yang muncul acak memicu sapaan Piko prioritas 2 dan mengacaukan urutan
  await dbg(page, 'setSetting', 'robotHelp', 'mati');
  await page.evaluate(() => { const d = window.__game.debug; d.notifyPush('pesan biasa', 'info', 1); d.notifyPush('pesan antre', 'info', 1); d.notifyPush('pesan penting', 'info', 3); });
  let n = await dbg(page, 'notify');
  expect(n.text).toBe('pesan penting');                               // prioritas tinggi menyela pesan yang sedang tampil
  expect(n.queue).toBe(1);
  expect(await page.locator('.notify.show').count()).toBe(1);
  await expect.poll(async () => (await dbg(page, 'notify')).text, { timeout: 5000 }).toBe('pesan antre');
  await expect.poll(async () => (await dbg(page, 'notify')).visible, { timeout: 6000 }).toBe(false);
  // Antrean menumpuk: maksimal 4 menunggu, pesan yang menunggu lebih dari 4 detik dibuang
  await page.evaluate(() => { for (let i = 1; i <= 6; i++) window.__game.debug.notifyPush('antre ' + i, 'info', 1); });
  expect((await dbg(page, 'notify')).queue).toBe(4);
  await expect.poll(async () => { const x = await dbg(page, 'notify'); return x.visible ? true : x.queue > 0; }, { timeout: 20000 }).toBe(false);
  const hist = (await dbg(page, 'notify')).history.filter((x) => x.startsWith('antre '));
  expect(hist[0]).toBe('antre 1');
  expect(hist.length).toBeLessThan(6);
  // Hanya ikon: Piko tampil sebagai mata tanpa teks
  await dbg(page, 'setSetting', 'robotHelp', 'ikon');
  await dbg(page, 'pikoReset');
  expect(await dbg(page, 'pikoSay', 'hpLow')).toBe(true);
  n = await dbg(page, 'notify');
  expect(n.kind).toBe('piko');
  expect(n.text).toBe('');
  // Ringkas: teks pendek tanpa petunjuk tombol keyboard
  await dbg(page, 'setSetting', 'robotHelp', 'ringkas');
  // Kapal tanpa kendali bisa melayang dekat permukaan dan memicu peringatan prioritas lebih tinggi:
  // pindahkan ke titik aman jauh dari benda mana pun agar yang diuji hanya antrean notifikasi
  await dbg(page, 'setPlayerState', { x: 0, y: 8000, z: 0 });
  await dbg(page, 'pikoReset');
  await dbg(page, 'pikoSay', 'enemyBehind');                          // prioritas lebih rendah dari HP kritis: tampil setelahnya
  await expect.poll(async () => (await dbg(page, 'notify')).text, { timeout: 6000 }).toBe('Musuh di belakang! Balik Arah!');
});

// ---------- layar menu dan layar sela muat di semua ukuran ----------
// Kartu atau isi layar yang tampil harus berada di dalam layar tanpa scroll, tombol tidak menimpa toolbar
function screenFit() {
  const W = window.innerWidth, H = window.innerHeight;
  const scr = [...document.querySelectorAll('.screen, #screen-map')].filter((e) => !e.classList.contains('hidden') ? getComputedStyle(e).display !== 'none' : false);
  const bad = [];
  for (const s of scr) {
    const parts = s.querySelectorAll(':scope > *');
    for (const p of parts) {
      const cs = getComputedStyle(p);
      if (cs.display === 'none') continue;
      const r = p.getBoundingClientRect();
      if (r.width < 2 ? true : r.height < 2) continue;
      if (r.top < -0.5 ? true : (r.bottom > H + 0.5 ? true : (r.left < -0.5 ? true : r.right > W + 0.5))) bad.push(s.id + ' keluar layar ' + Math.round(r.top) + '..' + Math.round(r.bottom));
      if (p.scrollHeight > p.clientHeight + 2 ? cs.overflowY !== 'visible' : false) bad.push(s.id + ' perlu scroll ' + p.scrollHeight + '>' + p.clientHeight);
    }
    if (s.scrollHeight > s.clientHeight + 2) bad.push(s.id + ' layar perlu scroll');
  }
  const floating = [...document.querySelectorAll('#toolbar .tool, #fs-tip, #touch-prompt')].filter((t) => {
    for (let e = t; e ? e !== document.body : false; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' ? true : cs.visibility === 'hidden') return false; }
    return t.getClientRects().length > 0;
  });
  const tools = floating.map((t) => t.getBoundingClientRect());
  for (const b of document.querySelectorAll('.screen:not(.hidden) button, .screen:not(.hidden) .tcard, .screen:not(.hidden) h2')) {
    const r = b.getBoundingClientRect();
    if (r.width < 2) continue;
    for (const t of tools) if (r.left < t.right ? (t.left < r.right ? (r.top < t.bottom ? t.top < r.bottom : false) : false) : false) bad.push('toolbar atau tip menimpa ' + (b.id || b.className || b.textContent));
  }
  return { screens: scr.map((s) => s.id), bad, hints: window.__game.debug.keyboardHints() };
}

for (const [w, h] of MATRIX) {
  test(`H9 layar ${w}x${h}: menu, medan, mode, kapal, pengaturan tiap tab, tentang, penemuan, kontrak, jeda, level, peta, stage clear, game over, layar akhir`, async ({ page }) => {
    test.setTimeout(120_000);
    await openHp(page, w, h);
    const check = async (name, expectScreen) => {
      await page.waitForTimeout(350);
      const f = await page.evaluate(screenFit);
      if (expectScreen) expect(f.screens, name).toContain(expectScreen);
      expect(f.bad, name).toEqual([]);
      expect(f.hints, name + ' petunjuk keyboard').toEqual([]);
      if (SHOTS) await page.screenshot({ path: `${SHOT_DIR}${w}x${h}-${name}.jpg`, type: 'jpeg', quality: 70 });
    };
    const reopen = async () => { await page.goto(gameUrl()); await page.waitForFunction(() => window.__game?.snapshot().state === 'menu'); };
    await page.waitForTimeout(900);                                    // tip layar penuh tampil di menu
    await check('menu', 'screen-title');
    await page.click('#btn-start');
    await check('medan', 'screen-terrain');
    await page.click('.tcard[data-world="space"]');
    await check('mode', 'screen-mode');
    await page.click('.mcard[data-mode="campaign"]');
    await check('kapal', 'screen-hangar');
    await reopen(); await page.click('#btn-settings');
    for (const t of ['umum', 'suara', 'kontrol', 'grafis', 'lainnya']) {
      if (h <= 520) await page.click(`.set-tab[data-tab="${t}"]`);
      await check('pengaturan-' + t, 'screen-settings');
    }
    await reopen(); await page.click('#btn-about'); await check('tentang', 'screen-about');
    await reopen(); await page.click('#btn-atlas'); await check('penemuan', 'screen-atlas');
    await reopen();
    await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.debug.setEnemiesEnabled(false); g.startIn('space', 'campaign'); g.skipTransition(); g.debug.skipCutscene(); });
    await expect.poll(async () => (await snap(page)).state).toBe('contract');
    await check('kontrak', 'screen-contract');
    await page.click('.ctcard[data-contract="bersihkan"]');
    await expect.poll(async () => (await snap(page)).state, { timeout: 6000 }).toBe('playing');
    await page.click('#btn-pause');
    await check('jeda', 'screen-pause');
    await page.click('#btn-pause-map');
    await check('peta', 'screen-map');
    await page.click('#btn-map-close');
    await expect.poll(async () => (await snap(page)).state).toBe('paused');
    await page.click('#btn-resume');
    await expect.poll(async () => (await snap(page)).state, { timeout: 8000 }).toBe('playing');
    await dbg(page, 'levelUp');
    await expect.poll(async () => (await snap(page)).state).toBe('levelup');
    await check('level', 'screen-levelup');
    await page.click('#lv-cards .lvcard');
    await expect.poll(async () => (await snap(page)).state, { timeout: 8000 }).toBe('playing');
    await dbg(page, 'finishStage');
    await expect.poll(async () => (await snap(page)).state, { timeout: 8000 }).toBe('stageclear');
    await check('stageclear', 'screen-stageclear');
    await reopen();
    await page.evaluate(() => { const g = window.__game; g.debug.setGod(false); g.debug.setEnemiesEnabled(false); g.startIn('space', 'free'); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); });
    await expect.poll(async () => (await snap(page)).state).toBe('playing');
    await page.waitForTimeout(1600);                                   // kebal awal selesai
    await page.evaluate(() => { const d = window.__game.debug; d.setLives(1); d.damagePlayer(99999); });
    await expect.poll(async () => (await snap(page)).state, { timeout: 8000 }).toBe('gameover');
    await page.waitForTimeout(600);
    await check('gameover', 'screen-over');
    await reopen(); await dbg(page, 'showFinal'); await check('akhir', 'screen-final');
  });
}

// ---------- layar penuh, orientasi, deteksi perangkat ----------
test('H9 layar penuh dari menu jeda, tip layar penuh di menu, overlay putar layar di bawah toolbar', async ({ page }) => {
  await openHp(page, 844, 390);
  await expect(page.locator('#fs-tip')).toBeVisible();
  await page.click('#fs-tip-close');
  await expect(page.locator('#fs-tip')).toBeHidden();
  await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.debug.setEnemiesEnabled(false); g.startIn('space', 'free'); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); });
  await expect.poll(async () => (await snap(page)).state).toBe('playing');
  await page.click('#btn-pause');
  await expect(page.locator('#btn-pause-fs')).toHaveText('LAYAR PENUH');
  await page.click('#btn-pause-fs');
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(true);
  await expect(page.locator('#btn-pause-fs')).toHaveText('KELUAR LAYAR PENUH');
  await page.click('#btn-pause-fs');
  await expect.poll(() => page.evaluate(() => !!document.fullscreenElement)).toBe(false);
  // Tegak: permainan dijeda, overlay rapi, tombol Suara di toolbar tetap bisa ditekan
  await page.click('#btn-resume');
  await expect.poll(async () => (await snap(page)).state, { timeout: 8000 }).toBe('playing');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await snap(page)).state).toBe('paused');
  await expect(page.locator('#rotate-hint')).toBeVisible();
  await expect(page.locator('#rotate-hint')).toContainText('Putar ke landscape');
  const muteBefore = (await snap(page)).muted;
  await page.click('#btn-mute');
  expect((await snap(page)).muted).toBe(!muteBefore);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#rotate-hint')).toBeHidden();
});

test('H9 deteksi perangkat: HP murni langsung mode HP tanpa pop-up, kualitas Rendah dan bloom mati', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto(gameUrl());
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
  const s = await snap(page);
  expect(s.settings.controlMode).toBe('hp');
  expect(s.settings.quality).toBe('rendah');
  expect(s.settings.bloom).toBe(false);
  expect(s.settings.robotHelp).toBe('ringkas');
  await expect(page.locator('#touch-prompt')).toBeHidden();
});
