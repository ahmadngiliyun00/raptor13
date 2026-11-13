// Pemeriksaan B1 butir d (frustum culling) dan g (NaN atau lompatan posisi) untuk tiap bos.
// Bos disimulasikan 90 detik (bot memburu, kebal); tiap 5 detik matriks grup bos diperiksa, lalu piksel
// bos pada jarak 400 dibandingkan dengan dan tanpa frustum culling. Pemakaian: node tests/bos/checks.mjs
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const PORT = Number(process.env.PERF_PORT || 4193);
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const gpuArgs = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const server = spawn(process.execPath, ['tests/static-server.mjs', String(PORT)], { cwd: process.env.PERF_SITE || ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((r) => server.stdout.once('data', r));
const browser = await chromium.launch({ args: gpuArgs });
const HOME = { raksasa: 'earth', miner: 'sabuk', hunter: 'uranus', naga: 'pluto' };
try {
  for (const [kind, world] of Object.entries(HOME)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`http://localhost:${PORT}/index.html?debug=1`);
    await page.waitForFunction(() => window.__game?.snapshot().state === 'menu', null, { timeout: 60000 });
    const r = await page.evaluate(([kind, world]) => {
      const g = window.__game, d = g.debug;
      g.setSeed(4242); d.setEnemiesEnabled(false); d.setSetting('tutorialDone', true);
      if (world === 'earth') g.startIn('earth'); else { d.setArea(world); g.startIn('space', 'free'); }
      g.skipTransition(); d.skipCutscene?.();
      if (world !== 'earth') d.viewArea(world);
      const out = [];
      d.startBoss(kind); d.skipCutscene();
      for (let i = 0; i < 18; i++) { d.simulate(5, 0); d.skipCutscene(); const s = d.bossChecks({ scanOnly: true }); if (!s) break; out.push(s.nonFinite); }
      const c = d.bossChecks({ dist: 400 });
      return { ...c, scans: out.length, nonFiniteMax: Math.max(0, ...out) };
    }, [kind, world]);
    console.log(JSON.stringify(r));
    await page.close();
  }
} finally { await browser.close(); server.kill(); }
