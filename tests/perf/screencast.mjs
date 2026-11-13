// Rekam frame hasil komposisi browser (kanvas WebGL ditambah semua lapisan DOM) lewat CDP screencast,
// lalu cari blok hampir hitam yang muncul 1 sampai 3 frame lalu hilang (A7 butir 1, i, j).
// Pemakaian: node tests/perf/screencast.mjs <label> [--frames=400] [--size=1512x860] [--dpr=2] [--uncapped]
//            [--query=...] [--scene=menu|space]
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const label = argv.find((a) => !a.startsWith('--')) || 'run';
const FRAMES = Number(opt.frames || 400);
const [W, H] = String(opt.size || '1512x860').split('x').map(Number);
const DPR = Number(opt.dpr || 2);
const PORT = Number(process.env.PERF_PORT || 4185);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = fileURLToPath(new URL('../../docs/audit/data/', import.meta.url));
mkdirSync(`${OUT}screencast/`, { recursive: true });
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const extra = opt.uncapped ? ['--disable-frame-rate-limit', '--disable-gpu-vsync'] : [];

const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: [...gpuArgs, ...extra] });
let result;
try {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const page = await ctx.newPage();
  const qs = new URLSearchParams(opt.query ? String(opt.query) : ''); qs.set('debug', '1');
  await page.goto(`http://localhost:${PORT}/index.html?${qs}`);
  await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
  if (opt.scene === 'space') {
    await page.evaluate(() => { const g = window.__game; g.debug.setGod(true); g.debug.setEnemiesEnabled(true); g.startIn('space', 'free'); g.skipTransition(); g.debug.skipCutscene(); g.debug.autoContract(); g.debug.startWave(8); g.debug.setAutoplay(true); });
  }
  await page.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  await new Promise((resolve) => {
    cdp.on('Page.screencastFrame', async (f) => {
      frames.push(f.data);
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
      if (frames.length >= FRAMES) resolve();
    });
    cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: W, maxHeight: H });
  });
  await cdp.send('Page.stopScreencast');
  // Analisis di halaman kosong: luminans rata-rata per blok 16 px, blok hampir hitam yang terang di frame tetangga
  const ana = await ctx.newPage();
  const B = 16, lum = [];
  for (const d of frames) {
    lum.push(await ana.evaluate(async ([data, B]) => {
      const img = await createImageBitmap(await (await fetch('data:image/png;base64,' + data)).blob());
      const c = new OffscreenCanvas(img.width, img.height), g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, img.width, img.height).data, bw = Math.floor(img.width / B), bh = Math.floor(img.height / B);
      const L = new Array(bw * bh);
      for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
        let s = 0;
        for (let y = 0; y < B; y += 2) for (let x = 0; x < B; x += 2) { const i = ((by * B + y) * img.width + bx * B + x) * 4; s += px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722; }
        L[by * bw + bx] = s / (B * B / 4) / 255;
      }
      return { L, bw, bh };
    }, [d, B]));
  }
  result = { frames: lum.length, flagged: 0, events: [] };
  for (let t = 1; t < lum.length - 1; t++) {
    const a = lum[t - 1].L, b = lum[t].L, c = lum[t + 1].L, bw = lum[t].bw, bh = lum[t].bh;
    if (a.length !== b.length ? true : b.length !== c.length) continue;
    let n = 0, x0 = bw, y0 = bh, x1 = -1, y1 = -1;
    for (let i = 0; i < bw * bh; i++) {
      const ref = Math.min(a[i], c[i]);
      if (ref > 0.1 ? b[i] < 0.025 : false) { n++; const x = i % bw, y = (i - x) / bw; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    if (n >= 2) { result.flagged++; if (result.events.length < 40) result.events.push({ frame: t, blocks: n, rect: [x0 * B, y0 * B, (x1 - x0 + 1) * B, (y1 - y0 + 1) * B] }); }
  }
  result.per1000 = Math.round(result.flagged / result.frames * 10000) / 10;
  // Simpan beberapa frame bermasalah beserta tetangganya
  for (const e of result.events.slice(0, 4)) for (const k of [-1, 0, 1]) writeFileSync(`${OUT}screencast/${label}-f${e.frame + k}.png`, Buffer.from(frames[e.frame + k], 'base64'));
  result.label = label; result.size = `${W}x${H}`; result.dpr = DPR; result.uncapped = !!opt.uncapped; result.query = opt.query || '';
} finally {
  await browser.close();
  server.kill();
}
writeFileSync(`${OUT}screencast-${label}.json`, JSON.stringify(result, null, 2) + '\n');
console.log(`${label}: ${result.flagged}/${result.frames} frame dengan blok hitam (${result.per1000} per 1000)`);
for (const e of result.events.slice(0, 10)) console.log('  frame', e.frame, 'blok', e.blocks, 'kotak', e.rect.join(','));
