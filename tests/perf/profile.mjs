// Profil performa RAPTOR13 lewat Playwright dan Chrome DevTools Protocol (A1).
// Mengukur per skenario: frame time (rata-rata, p95), waktu kerja JS per frame, rAF per detik,
// renderer.info satu frame penuh, ukuran buffer, isi scene, audio, heap, GC, layout, listener, dan timer.
//
// Pemakaian:
//   node tests/perf/profile.mjs <label> [--dur=60] [--short=15] [--only=menu,earth,space] [--matrix]
// Hasil: docs/audit/data/<label>.json dan tabel ringkas di stdout.
//
// Catatan: di macOS Chromium headless memakai GPU asli lewat ANGLE Metal (lihat playwright.config.mjs),
// jadi skenario "tanpa batas" (--disable-frame-rate-limit) memberi gambaran kerja GPU per frame:
// bila FPS tanpa batas rendah, frame dibatasi GPU. Di platform lain hasil GPU tidak dapat dipercaya.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.slice(2).split('=');
  return [k, v === undefined ? true : v];
}));
const label = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'run';
const DUR = Number(args.dur || 60);
const SHORT = Number(args.short || 15);
const ONLY = args.only ? String(args.only).split(',') : ['menu', 'earth', 'space'];
const PORT = Number(process.env.PERF_PORT || 4181);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT_DIR = fileURLToPath(new URL('../../docs/audit/data/', import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });
const QUERY = process.env.PERF_QUERY || '?debug=1';

const isMac = process.platform === 'darwin';
const gpuArgs = isMac
  ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

// Penghitung timer aktif dan listener (dipasang sebelum skrip halaman berjalan)
const INIT = () => {
  const live = new Map();
  const st = window.setTimeout, ct = window.clearTimeout, si = window.setInterval, ci = window.clearInterval;
  window.__timers = { timeouts: 0, intervals: 0, created: 0 };
  window.setTimeout = function (fn, ms, ...a) {
    const id = st.call(window, (...b) => { if (live.get(id) === 't') { live.delete(id); window.__timers.timeouts--; } if (typeof fn === 'function') fn(...b); }, ms, ...a);
    live.set(id, 't'); window.__timers.timeouts++; window.__timers.created++;
    return id;
  };
  window.clearTimeout = function (id) { if (live.get(id) === 't') { live.delete(id); window.__timers.timeouts--; } return ct.call(window, id); };
  window.setInterval = function (fn, ms, ...a) {
    const id = si.call(window, fn, ms, ...a);
    live.set(id, 'i'); window.__timers.intervals++; window.__timers.created++;
    return id;
  };
  window.clearInterval = function (id) { if (live.get(id) === 'i') { live.delete(id); window.__timers.intervals--; } return ci.call(window, id); };
};

function startServer() {
  const child = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((res) => child.stdout.once('data', () => res(child)));
}

async function waitMenu(page) {
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
}

// Persiapan skenario: menu (attract), Bumi (bot, musuh aktif), angkasa ramai (gelombang 8, asteroid tambahan)
const SCENES = {
  async menu(page) {
    await page.keyboard.press('Shift');   // aktivasi pengguna: AudioContext dibuat seperti pemain sungguhan
  },
  async earth(page) {
    await page.keyboard.press('Shift');
    await page.evaluate(() => {
      const g = window.__game;
      g.setSeed(1234); g.debug.setEnemiesEnabled(true); g.debug.setGod(true);
      g.startIn('earth');
      g.skipTransition();
      g.debug.setAutoplay(true);
    });
  },
  async space(page) {
    await page.keyboard.press('Shift');
    await page.evaluate(() => {
      const g = window.__game;
      g.setSeed(1234); g.debug.setEnemiesEnabled(true); g.debug.setGod(true);
      g.startIn('space', 'free');
      g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract();
    });
    await page.waitForFunction(() => window.__game.snapshot().state === 'playing');
    await page.evaluate(() => {
      const d = window.__game.debug;
      d.viewArea('sabuk');
      d.startWave(8);
      d.simulate(8, 0);   // majukan dunia agar musuh, peluru, dan partikel sudah ramai
      for (let i = 0; i < 10; i++) d.spawnAsteroid(i % 3 === 0 ? 'large' : 'medium', 180 + i * 40, (i % 5 - 2) * 60, (i % 3 - 1) * 30);
      d.setAutoplay(true);
    });
  },
};

async function measure(browser, scene, { dpr = 2, w = 1512, h = 860, dur = DUR, uncapped = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  await page.goto(`http://localhost:${PORT}/index.html${QUERY}`);
  await waitMenu(page);
  await SCENES[scene](page);
  await page.waitForTimeout(3000);   // pemanasan: kompilasi shader dan pembangunan dunia selesai
  await page.evaluate(() => window.__game.debug.perfReset());
  await cdp.send('HeapProfiler.collectGarbage');
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const dom0 = await cdp.send('Memory.getDOMCounters');
  const p0 = await page.evaluate(() => window.__game.debug.perf());
  await browser.startTracing(page, { categories: ['devtools.timeline', 'v8', 'disabled-by-default-v8.gc'] });
  const t0 = Date.now();
  // Sampel debug.perf tiap 5 detik agar p95 mencakup seluruh durasi
  const samples = [];
  while (Date.now() - t0 < dur * 1000) {
    await page.waitForTimeout(Math.min(5000, dur * 1000 - (Date.now() - t0)));
    samples.push(await page.evaluate(() => window.__game.debug.perf()));
  }
  const trace = JSON.parse((await browser.stopTracing()).toString());
  const wall = (Date.now() - t0) / 1000;
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const dom1 = await cdp.send('Memory.getDOMCounters');
  const p1 = await page.evaluate(() => window.__game.debug.perf());
  const timers = await page.evaluate(() => window.__timers);
  const snap = await page.evaluate(() => window.__game.snapshot());
  // GC dari trace: jumlah minor dan major, byte yang dibebaskan (perkiraan laju alokasi)
  let minor = 0, major = 0, freed = 0;
  for (const e of trace.traceEvents || []) {
    if (e.ph !== 'X' ? e.ph !== 'B' : false) continue;
    if (e.name === 'MinorGC' || e.name === 'Scavenge' || e.name === 'MinorMS') {
      minor++;
      const a = e.args?.usedHeapSizeBefore, b = e.args?.usedHeapSizeAfter;
      if (a !== undefined) freed += a - b;
    } else if (e.name === 'MajorGC' || e.name === 'V8.GCFinalizeMC') major++;
  }
  const avg = (k) => samples.reduce((s, x) => s + x[k], 0) / samples.length;
  const max = (k) => Math.max(...samples.map((x) => x[k]));
  const frames = p1.renders;
  const r2 = (v) => Math.round(v * 100) / 100;
  const res = {
    scene, dpr, viewport: `${w}x${h}`, uncapped, seconds: r2(wall),
    rafPerSec: r2(p1.rafCalls / wall), rendersPerSec: r2(frames / wall),
    frameAvgMs: r2(avg('frameAvgMs')), frameP95Ms: r2(max('frameP95Ms')),
    jsWorkAvgMs: r2(avg('workAvgMs')), jsWorkP95Ms: r2(max('workP95Ms')),
    scriptMsPerSec: r2((m1.ScriptDuration - m0.ScriptDuration) * 1000 / wall),
    taskMsPerSec: r2((m1.TaskDuration - m0.TaskDuration) * 1000 / wall),
    layoutsPerSec: r2((m1.LayoutCount - m0.LayoutCount) / wall), layoutMsPerSec: r2((m1.LayoutDuration - m0.LayoutDuration) * 1000 / wall),
    styleRecalcsPerSec: r2((m1.RecalcStyleCount - m0.RecalcStyleCount) / wall), styleMsPerSec: r2((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000 / wall),
    calls: Math.round(avg('calls')), callsMax: max('calls'), triangles: Math.round(avg('triangles')), points: Math.round(avg('points')),
    geometries: p1.geometries, textures: p1.textures, programs: p1.programs,
    buffer: `${p1.bufferW}x${p1.bufferH}`, megapixels: p1.megapixels, pixelRatio: p1.pixelRatio,
    meshes: p1.meshes, meshesVisible: p1.meshesVisible, instances: p1.instances, lights: p1.lights, shadowCasters: p1.shadowCasters,
    shadows: p1.shadows, shadowMapSize: p1.shadowMapSize, bloom: p1.bloom, quality: p1.quality,
    particles: Math.round(avg('particles')), particleMax: p1.particleMax,
    audioState: p1.audioState, audioSourcesLive: p1.audioSources, audioSourcesCreatedPerSec: r2((p1.audioSourcesCreated - p0.audioSourcesCreated) / wall),
    heapStartMB: r2(m0.JSHeapUsedSize / 1048576), heapEndMB: r2(m1.JSHeapUsedSize / 1048576),
    minorGC: minor, majorGC: major, minorGCPerMin: r2(minor * 60 / wall),
    allocKBPerFrame: frames > 0 ? r2(freed / 1024 / frames) : null,
    domNodes: dom1.nodes, jsEventListeners: dom1.jsEventListeners, listenersDelta: dom1.jsEventListeners - dom0.jsEventListeners,
    timeoutsLive: timers.timeouts, intervalsLive: timers.intervals, timersCreatedPerSec: r2(timers.created / (wall + 6)),
    state: snap.state, enemies: snap.enemies, asteroids: snap.asteroids, errors: errors.slice(0, 5),
  };
  await ctx.close();
  return res;
}

const server = await startServer();
const results = [];
const run = async (launchArgs, list) => {
  const browser = await chromium.launch({ args: [...gpuArgs, '--js-flags=--expose-gc', ...launchArgs] });
  try {
    const gpu = await (async () => {
      const ctx = await browser.newContext(); const p = await ctx.newPage();
      await p.goto(`http://localhost:${PORT}/tests/static-server.mjs`).catch(() => {});
      const s = await p.evaluate(() => {
        const c = document.createElement('canvas').getContext('webgl2');
        const e = c ? c.getExtension('WEBGL_debug_renderer_info') : null;
        return { renderer: e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : (c ? c.getParameter(c.RENDERER) : 'tanpa WebGL2'), timerQuery: c ? !!c.getExtension('EXT_disjoint_timer_query_webgl2') : false };
      });
      await ctx.close();
      return s;
    })();
    for (const [scene, opt] of list) {
      process.stderr.write(`mengukur ${scene} ${JSON.stringify(opt)} ...\n`);
      const r = await measure(browser, scene, opt);
      r.gpu = gpu.renderer; r.timerQuery = gpu.timerQuery;
      results.push(r);
    }
  } finally { await browser.close(); }
};

try {
  await run([], ONLY.map((s) => [s, { dpr: 2, dur: DUR }]));
  if (args.matrix) {
    await run([], ONLY.flatMap((s) => [[s, { dpr: 1, dur: SHORT }], [s, { dpr: 3, dur: SHORT }]]));
    // Tanpa batas frame: meniru layar 120 Hz atau lebih, sekaligus menunjukkan kerja GPU per frame
    await run(['--disable-frame-rate-limit', '--disable-gpu-vsync'], ONLY.flatMap((s) => [[s, { dpr: 2, dur: SHORT, uncapped: true }], [s, { dpr: 1, dur: SHORT, uncapped: true }]]));
  }
} finally {
  server.kill();
}

writeFileSync(`${OUT_DIR}${label}.json`, JSON.stringify(results, null, 2) + '\n');
const cols = ['scene', 'dpr', 'uncapped', 'rendersPerSec', 'frameAvgMs', 'frameP95Ms', 'jsWorkAvgMs', 'scriptMsPerSec', 'calls', 'triangles', 'megapixels', 'bloom', 'minorGCPerMin', 'allocKBPerFrame', 'heapStartMB', 'heapEndMB', 'audioSourcesLive', 'layoutsPerSec'];
console.log(cols.join('\t'));
for (const r of results) console.log(cols.map((c) => r[c]).join('\t'));
