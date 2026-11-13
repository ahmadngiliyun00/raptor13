// Uji kebocoran (A1 butir m, A2 butir 8): 20 kali restart dan 20 kali ganti stage atau medan, lalu
// bandingkan objek scene, geometri, tekstur, program, listener (Events dan DOM), timer, sumber audio, heap.
// Pemakaian: node tests/perf/leak.mjs <label> [--n=20]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const N = Number(opt.n || 20);
const PORT = Number(process.env.PERF_PORT || 4186);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/audit/data/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

const INIT = () => {
  const st = window.setTimeout, ct = window.clearTimeout, si = window.setInterval, ci = window.clearInterval, live = new Map();
  window.__timers = { timeouts: 0, intervals: 0 };
  window.setTimeout = function (fn, ms, ...a) { const id = st.call(window, (...b) => { if (live.get(id) === 't') { live.delete(id); window.__timers.timeouts--; } if (typeof fn === 'function') fn(...b); }, ms, ...a); live.set(id, 't'); window.__timers.timeouts++; return id; };
  window.clearTimeout = function (id) { if (live.get(id) === 't') { live.delete(id); window.__timers.timeouts--; } return ct.call(window, id); };
  window.setInterval = function (fn, ms, ...a) { const id = si.call(window, fn, ms, ...a); live.set(id, 'i'); window.__timers.intervals++; return id; };
  window.clearInterval = function (id) { if (live.get(id) === 'i') { live.delete(id); window.__timers.intervals--; } return ci.call(window, id); };
};

const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: [...gpuArgs, '--js-flags=--expose-gc'] });
const res = {};
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu');
    await page.evaluate(() => window.__game.debug.ignoreBattery?.(true));
  await page.keyboard.press('Shift');
  const sample = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    await page.waitForTimeout(300);
    const dom = await cdp.send('Memory.getDOMCounters');
    const r = await page.evaluate(() => {
      const d = window.__game.debug, r = d.resources(), p = d.perf();
      return { ...r, listenerMap: undefined, audioSources: p.audioSources, timers: { ...window.__timers } };
    });
    return { ...r, domNodes: dom.nodes, jsEventListeners: dom.jsEventListeners, heapMB: Math.round((await cdp.send('Runtime.getHeapUsage')).usedSize / 10485.76) / 100, audioState: await page.evaluate(() => window.__game.debug.perf().audioState) };
  };
  // Restart berulang di medan angkasa (dunia paling berat), dengan simulasi singkat tiap kali
  await page.evaluate(() => { const g = window.__game; g.setSeed(7); g.debug.setGod(true); g.debug.setEnemiesEnabled(true); g.startIn('space', 'free'); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); g.debug.simulate(3, 10); });
  await page.waitForTimeout(1500);
  res.restartBefore = await sample();
  for (let i = 0; i < N; i++) {
    await page.evaluate(() => { const g = window.__game; g.restart(); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); g.debug.simulate(3, 10); });
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1500);
  res.restartAfter = await sample();
  // Ganti stage kampanye berulang
  await page.evaluate(() => { const g = window.__game; g.debug.setStage?.(1); });
  res.stageBefore = await sample();
  for (let i = 0; i < N; i++) {
    await page.evaluate((k) => { const g = window.__game; g.debug.setStage?.((k % 10) + 1); g.debug.skipCutscene(); g.debug.autoContract(); g.debug.simulate(1, 10); }, i);
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => window.__game.debug.setStage?.(1));
  await page.waitForTimeout(1500);
  res.stageAfter = await sample();
  // Rendam: 5 menit simulasi bermain di angkasa (langkah tetap 1/60 detik, render tiap 30 langkah)
  await page.evaluate(() => { const g = window.__game; g.debug.setStage?.(1); g.debug.skipCutscene(); g.debug.autoContract(); });
  await page.evaluate(() => { const g = window.__game; g.restart(); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); g.debug.simulate(20, 30); });
  res.soakBefore = await sample();
  res.soakSeries = [];
  const chunks = Number(opt.soak || 10);
  for (let i = 0; i < chunks; i++) {
    await page.evaluate(() => { const g = window.__game; g.debug.skipCutscene(); g.debug.autoContract(); const lv = g.debug.levelState(); if (lv.state === 'levelup') g.debug.pickCard(lv.offer[0].split(':')[0]); g.debug.simulate(30, 30); });
    const r = await page.evaluate(() => { const x = window.__game.debug.resources(); const s = window.__game.snapshot(); return { geometries: x.geometries, programs: x.programs, wave: s.wave, enemies: s.enemies, state: s.state, pool: window.__game.debug.enemyPool?.() }; });
    r.heapMB = (await sample()).heapMB;
    res.soakSeries.push(r);
    if (i === 9) res.soakAfter = await sample();
  }
  if (!res.soakAfter) res.soakAfter = await sample();
  console.log('deret rendam (per 30 detik):', JSON.stringify(res.soakSeries));
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT}leak-${label}.json`, JSON.stringify(res, null, 2) + '\n');
const keys = ['audioState', 'sceneObjects', 'sceneChildren', 'geometries', 'textures', 'programs', 'listeners', 'domNodes', 'jsEventListeners', 'audioSources', 'heapMB'];
console.log('metrik\trestart sebelum\tsesudah\tstage sebelum\tsesudah\trendam sebelum\tsesudah 5 menit');
for (const k of keys) console.log(`${k}\t${res.restartBefore[k]}\t${res.restartAfter[k]}\t${res.stageBefore[k]}\t${res.stageAfter[k]}\t${res.soakBefore?.[k]}\t${res.soakAfter?.[k]}`);
console.log(`timers\t${JSON.stringify(res.restartBefore.timers)}\t${JSON.stringify(res.restartAfter.timers)}\t${JSON.stringify(res.stageBefore.timers)}\t${JSON.stringify(res.stageAfter.timers)}`);
