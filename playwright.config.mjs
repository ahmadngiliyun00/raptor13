// Konfigurasi Playwright untuk RAPTOR13.
// Di macOS memakai GPU asli lewat ANGLE Metal; di platform lain memakai SwiftShader (render perangkat lunak).
import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PORT || 4173);
const isMac = process.platform === 'darwin';
const gpuArgs = isMac
  ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.mjs$/,
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { args: [...gpuArgs, '--js-flags=--expose-gc'] } } },
    // B7: pencegahan zoom iOS diuji di WebKit (mesin Safari dan Chrome iOS), hanya berkas zoom.spec.mjs
    { name: 'webkit', testMatch: /zoom(-viewport)?\.spec\.mjs$/, use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: `node tests/static-server.mjs ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 20_000,
  },
});
