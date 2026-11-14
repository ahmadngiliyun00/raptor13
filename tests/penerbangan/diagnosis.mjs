// Diagnosis kehalusan penerbangan (E6, dipakai ulang di E9). Menjalankan skenario berskrip langkah tetap 60 FPS lewat
// debug.flightRun, menghitung metrik (kecepatan sudut, percepatan sudut, hentakan, perubahan vektor atas kamera),
// menulis CSV per skenario dan ringkasan JSON, lalu menggambar grafik PNG dengan canvas di browser.
// Pemakaian: node tests/penerbangan/diagnosis.mjs <label> [port]
//   label: nama keluaran, misalnya "sebelum" atau "sesudah"; server statis harus berjalan di port (bawaan 4173).
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const label = process.argv[2] || 'sebelum';
const port = process.argv[3] || process.env.PORT || 4173;
const OUT = path.join('docs', 'penerbangan', 'data', label);
fs.mkdirSync(OUT, { recursive: true });

// Ambang kehalusan (alasan di docs/penerbangan/diagnosis-halus.md)
export const THRESH = {
  uncmdDegPerFrame: 2.0,     // perubahan orientasi tanpa input dan tanpa manuver (pemulihan otomatis), derajat per frame
  cmdDegPerFrame: 2.5,       // perubahan orientasi akibat input tahan (pitch, bank, dan belok bersamaan), derajat per frame
  accel: 20,                 // percepatan sudut, rad per detik kuadrat (di luar manuver)
  jerk: 400,                 // hentakan sudut, rad per detik pangkat tiga (di luar manuver)
  manAccel: 60,              // percepatan sudut selama manuver akrobatik
  manJerk: 1500,             // hentakan sudut selama manuver akrobatik
  camUpMargin: 1.0,          // atas kamera tidak boleh berputar lebih cepat dari kapal ditambah margin ini (derajat per frame)
  camFlipDeg: 20,            // satu frame dengan perubahan di atas ini dianggap flip
};

// Skenario: segmen [durasi detik, pitch, yaw, manuver, arah]. Pitch positif = hidung naik (W), yaw positif = kanan (D).
export const SCENARIOS = {
  'naik-tahan-lepas': { segs: [[0.5, 0, 0], [0.75, 1, 0], [4, 0, 0]], note: 'tahan naik sampai sekitar 80 derajat lalu lepas' },
  'naik-vertikal-lepas': { segs: [[0.5, 0, 0], [0.95, 1, 0], [4, 0, 0]], note: 'tahan naik melewati vertikal lalu lepas' },
  'turun-tahan-lepas': { segs: [[0.5, 0, 0], [0.75, -1, 0], [4, 0, 0]], note: 'tahan turun sampai sekitar 80 derajat menukik lalu lepas' },
  'miring-kanan-lepas': { segs: [[0.5, 0, 0], [2, 0, 1], [3, 0, 0]], note: 'tahan miring kanan lalu lepas' },
  'miring-kiri-lepas': { segs: [[0.5, 0, 0], [2, 0, -1], [3, 0, 0]], note: 'tahan miring kiri lalu lepas' },
  'kanan-kiri-cepat': { segs: [[0.5, 0, 0], [0.6, 0, 1], [0.6, 0, -1], [0.6, 0, 1], [2, 0, 0]], note: 'ganti arah kanan kiri cepat' },
  'loop': { segs: [[0.5, 0, 0], [0.01, 0, 0, 'loop'], [4, 0, 0]], note: 'manuver Looping (C)' },
  'gulung': { segs: [[0.5, 0, 0], [0.01, 0, 0, 'roll'], [2, 0, 0]], note: 'manuver Gulung tong (Z)' },
  'balik': { segs: [[0.5, 0, 0], [0.01, 0, 0, 'immelmann'], [3.5, 0, 0]], note: 'manuver Balik arah (X)' },
  'kombinasi': { segs: [[0.5, 0, 0], [0.6, 1, 1], [0.5, 0, 1], [0.6, -1, -1], [0.4, 1, 0], [3, 0, 0]], note: 'naik sambil belok, lalu turun sambil belok, lalu lepas' },
};

const deg = (r) => r * 180 / Math.PI;
// Metrik dari deret: rows sesuai debug.flightColumns()
export function metrics(rows, cols) {
  const C = Object.fromEntries(cols.map((c, i) => [c, i]));
  const n = rows.length, out = { frames: n, worst: {}, flagged: [] };
  const w = rows.map((r) => [r[C.wx_pitch], r[C.wy_yaw], r[C.wz_roll]]);
  const acc = [], jerk = [], stepDeg = [];
  for (let i = 0; i < n; i++) {
    const dt = rows[i][C.dt] || 1 / 60;
    stepDeg.push(deg(Math.hypot(...w[i]) * dt));
    acc.push(i > 1 ? Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1], w[i][2] - w[i - 1][2]) / dt : 0);
    jerk.push(i > 2 ? Math.abs(acc[i] - acc[i - 1]) / dt : 0);
  }
  const W = { uncmd: 0, cmd: 0, accel: 0, jerk: 0, manAccel: 0, manJerk: 0, camUp: 0, camExcess: 0 };
  for (let i = 2; i < n; i++) {
    // Frame peralihan manuver (hentakan memakai tiga frame) dihitung sebagai manuver
    // Input dianggap masih berlaku 15 frame (0,25 detik) setelah dilepas: perlambatan dari putaran yang diperintahkan
    // bukan putaran tak diperintah
    const r = rows[i], man = r[C.maneuver] !== '' ? true : (rows[i - 1][C.maneuver] !== '' ? true : rows[i - 2][C.maneuver] !== '');
    let input = false;
    for (let k = i; k >= Math.max(0, i - 15); k--) if (rows[k][C.in_pitch] !== 0 ? true : rows[k][C.in_yaw] !== 0) { input = true; break; }
    const flags = [];
    if (!man) {
      if (!input) { W.uncmd = Math.max(W.uncmd, stepDeg[i]); if (stepDeg[i] > THRESH.uncmdDegPerFrame) flags.push('putar tanpa input ' + stepDeg[i].toFixed(2) + ' derajat'); }
      else { W.cmd = Math.max(W.cmd, stepDeg[i]); if (stepDeg[i] > THRESH.cmdDegPerFrame) flags.push('putar dengan input ' + stepDeg[i].toFixed(2) + ' derajat'); }
      W.accel = Math.max(W.accel, acc[i]); W.jerk = Math.max(W.jerk, jerk[i]);
      if (acc[i] > THRESH.accel) flags.push('percepatan ' + acc[i].toFixed(1));
      if (jerk[i] > THRESH.jerk) flags.push('hentakan ' + jerk[i].toFixed(0));
    } else {
      W.manAccel = Math.max(W.manAccel, acc[i]); W.manJerk = Math.max(W.manJerk, jerk[i]);
      if (acc[i] > THRESH.manAccel) flags.push('percepatan manuver ' + acc[i].toFixed(1));
      if (jerk[i] > THRESH.manJerk) flags.push('hentakan manuver ' + jerk[i].toFixed(0));
    }
    // Kamera boleh ikut rotasi yang diperintahkan (misalnya looping), tetapi tidak boleh lebih cepat dari kapal
    const cu = r[C.cam_up_delta_deg], ex = cu - stepDeg[i];
    W.camUp = Math.max(W.camUp, cu); W.camExcess = Math.max(W.camExcess, ex);
    if (cu > THRESH.camFlipDeg ? true : ex > THRESH.camUpMargin) flags.push((cu > THRESH.camFlipDeg ? 'FLIP kamera ' : 'atas kamera ') + cu.toFixed(2) + ' derajat, kapal ' + stepDeg[i].toFixed(2));
    if (flags.length) out.flagged.push({ frame: i, t: r[C.t], pitch: r[C.pitch_deg], bank: r[C.bank_deg], flags });
  }
  for (const k of Object.keys(W)) out.worst[k] = +W[k].toFixed(3);
  out.pass = out.flagged.length === 0;
  out.series = { acc, jerk, stepDeg };
  return out;
}

async function main() {
  const browser = await chromium.launch({ args: process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const summary = { label, date: new Date().toISOString().slice(0, 10), thresholds: THRESH, ships: {} };
  for (const [ship, world] of [['starfighter', 'space'], ['raptor-j', 'earth']]) {
    await page.goto(`http://localhost:${port}/index.html?debug=1`);
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('raptor13.v3', JSON.stringify({ version: 3, settings: { tutorialDone: true, flashWarned: true, touchPromptShown: true }, ships: { unlocked: ['raptor-j', 'starfighter'], selected: { earth: 'raptor-j', space: 'starfighter' }, credits: 0 } })); });
    await page.goto(`http://localhost:${port}/index.html?debug=1`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    await page.evaluate((w) => { const g = window.__game, d = g.debug; d.setGod(true); d.setEnemiesEnabled(false); if (w === 'earth') g.startIn('earth'); else { d.setArea('sabuk'); g.startIn('space', 'free'); d.viewArea('sabuk'); } g.skipTransition(); d.skipCutscene(); }, world);
    await page.waitForTimeout(800);
    // Angkasa tanpa asteroid: tabrakan (mode kebal) memutar kapal dan mengacaukan metrik terbang
    if (world === 'space') await page.evaluate(() => { const d = window.__game.debug; d.setAsteroidDensity(0); d.clearAsteroids(); });
    const cols = await page.evaluate(() => window.__game.debug.flightColumns());
    summary.ships[ship] = {};
    for (const [name, sc] of Object.entries(SCENARIOS)) {
      // Bumi: mulai di ketinggian 230 (batas atas medan 260, gunung sampai 115); angkasa tanpa batas ketinggian
      const rows = await page.evaluate(([segs, y]) => window.__game.debug.flightRun(segs, { y }), [sc.segs, world === 'earth' ? 230 : undefined]);
      const m = metrics(rows, cols);
      const csv = [cols.concat(['ang_step_deg', 'ang_accel', 'ang_jerk']).join(',')].concat(rows.map((r, i) => r.concat([m.series.stepDeg[i].toFixed(4), m.series.acc[i].toFixed(3), m.series.jerk[i].toFixed(1)]).join(','))).join('\n');
      fs.writeFileSync(path.join(OUT, `${ship}-${name}.csv`), csv + '\n');
      summary.ships[ship][name] = { note: sc.note, frames: m.frames, worst: m.worst, flaggedFrames: m.flagged.length, firstFlags: m.flagged.slice(0, 6), pass: m.pass };
      // Grafik: pitch, bank, kecepatan sudut, percepatan sudut, perubahan atas kamera; penanda frame bermasalah
      await page.evaluate(([rows, cols, m, title, th]) => {
        const C = Object.fromEntries(cols.map((c, i) => [c, i]));
        let cv = document.getElementById('diag-cv');
        if (!cv) { cv = document.createElement('canvas'); cv.id = 'diag-cv'; cv.width = 1200; cv.height = 760; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#fff'; document.body.appendChild(cv); }
        const g = cv.getContext('2d'), W = cv.width, H = cv.height, n = rows.length;
        g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#111'; g.font = 'bold 16px sans-serif'; g.fillText(title, 16, 22);
        const panels = [
          { name: 'pitch dan bank (derajat)', series: [[rows.map((r) => r[C.pitch_deg]), '#c0392b', 'pitch'], [rows.map((r) => r[C.bank_deg]), '#2471a3', 'bank']] },
          { name: 'kecepatan sudut badan (rad/s)', series: [[rows.map((r) => r[C.wx_pitch]), '#c0392b', 'pitch'], [rows.map((r) => r[C.wy_yaw]), '#239b56', 'yaw'], [rows.map((r) => r[C.wz_roll]), '#2471a3', 'roll']] },
          { name: 'percepatan sudut (rad/s2), garis ambang ' + th.accel, series: [[m.series.acc, '#7d3c98', 'percepatan']], limit: th.accel },
          { name: 'atas kamera dan putaran kapal (derajat per frame)', series: [[rows.map((r) => r[C.cam_up_delta_deg]), '#d35400', 'atas kamera'], [m.series.stepDeg, '#555', 'kapal']] },
        ];
        const ph = (H - 40) / panels.length;
        panels.forEach((P, k) => {
          const y0 = 34 + k * ph, x0 = 60, pw = W - 80, hh = ph - 30;
          let lo = Infinity, hi = -Infinity;
          for (const [s] of P.series) for (const v of s) { if (v < lo) lo = v; if (v > hi) hi = v; }
          if (P.limit !== undefined) hi = Math.max(hi, P.limit * 1.2);
          if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
          const X = (i) => x0 + (i / Math.max(1, n - 1)) * pw, Y = (v) => y0 + 18 + hh - ((v - lo) / (hi - lo)) * hh;
          g.strokeStyle = '#bbb'; g.strokeRect(x0, y0 + 18, pw, hh);
          g.fillStyle = '#333'; g.font = '12px sans-serif'; g.fillText(P.name, x0, y0 + 12);
          g.fillText(hi.toFixed(1), 8, y0 + 26); g.fillText(lo.toFixed(1), 8, y0 + 18 + hh);
          // frame bermasalah: pita merah muda
          g.fillStyle = 'rgba(255,0,0,0.12)';
          for (const f of m.flagged) g.fillRect(X(f.frame) - 1, y0 + 18, 2, hh);
          // manuver dan input: pita abu
          if (P.limit !== undefined) { g.strokeStyle = '#e74c3c'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(x0, Y(P.limit)); g.lineTo(x0 + pw, Y(P.limit)); g.stroke(); g.setLineDash([]); }
          P.series.forEach(([s, col, nm], j) => {
            g.strokeStyle = col; g.lineWidth = 1.5; g.beginPath();
            s.forEach((v, i) => { if (i === 0) g.moveTo(X(i), Y(v)); else g.lineTo(X(i), Y(v)); });
            g.stroke(); g.fillStyle = col; g.fillText(nm, x0 + pw - 220 + j * 70, y0 + 12);
          });
        });
        g.fillStyle = '#333'; g.fillText('waktu: ' + rows[0][C.t].toFixed(2) + ' s sampai ' + rows[n - 1][C.t].toFixed(2) + ' s, ' + n + ' frame, pita merah = frame melewati ambang', 60, H - 6);
      }, [rows, cols, { flagged: m.flagged, series: m.series }, `${label}: ${ship} ${name} (${sc.note})`, THRESH]);
      await page.locator('#diag-cv').screenshot({ path: path.join(OUT, `${ship}-${name}.png`) });
    }
  }
  fs.writeFileSync(path.join(OUT, 'ringkasan.json'), JSON.stringify(summary, null, 1) + '\n');
  for (const [ship, sc] of Object.entries(summary.ships)) for (const [name, r] of Object.entries(sc)) console.log(ship.padEnd(12), name.padEnd(20), r.pass ? 'LOLOS' : 'GAGAL', JSON.stringify(r.worst), 'frame bermasalah', r.flaggedFrames);
  await browser.close();
}
if (import.meta.url === `file://${process.argv[1]}`) main();
