// Pembuat ikon orisinal RAPTOR13 dari emblem icons/favicon.svg (karya proyek), lewat Chromium headless agar bisa
// diulang tanpa dependensi gambar. Menghasilkan:
//   icons/icon-maskable-192.png, icons/icon-maskable-512.png   ikon PWA maskable (latar penuh, emblem di zona aman 80 persen)
//   mobile/assets/icon-foreground.png (1024)                   latar depan ikon adaptif Android (emblem di zona aman 66 persen)
//   mobile/assets/icon-background.png (1024)                   latar belakang ikon adaptif (gradien gelap)
//   mobile/assets/icon-only.png (1024)                          ikon penuh untuk iOS dan Android lama
//   mobile/assets/splash.png, splash-dark.png (2732)           layar pembuka gelap tanpa kilatan putih
// Pemakaian: node scripts/make-icons.mjs [--mobile]
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const svg = readFileSync('icons/favicon.svg', 'utf8');
const MOBILE = process.argv.includes('--mobile');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
// mode: 'full' latar penuh, 'fg' latar transparan, 'bg' hanya gradien; scale: porsi emblem terhadap sisi
async function render(size, mode, scale) {
  const b64 = await page.evaluate(async ([svg, size, mode, scale]) => {
    const c = document.getElementById('c'); c.width = size; c.height = size;
    const x = c.getContext('2d');
    if (mode !== 'fg') { const g = x.createRadialGradient(size / 2, size * 0.38, 0, size / 2, size * 0.38, size * 0.75); g.addColorStop(0, '#1d3a57'); g.addColorStop(0.6, '#0f2033'); g.addColorStop(1, '#070e17'); x.fillStyle = g; x.fillRect(0, 0, size, size); }
    if (mode !== 'bg') {
      const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); await img.decode();
      const s = size * scale; x.drawImage(img, (size - s) / 2, (size - s) / 2, s, s);
    }
    return c.toDataURL('image/png').split(',')[1];
  }, [svg, size, mode, scale]);
  return Buffer.from(b64, 'base64');
}
writeFileSync('icons/icon-maskable-192.png', await render(192, 'full', 0.8));
writeFileSync('icons/icon-maskable-512.png', await render(512, 'full', 0.8));
// Ukuran berkas PNG dari header (lebar dan tinggi di byte 16 sampai 24)
const pngSize = (f) => { const b = readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
async function renderRect(w, h, scale) {
  const b64 = await page.evaluate(async ([svg, w, h, scale]) => {
    const c = document.getElementById('c'); c.width = w; c.height = h;
    const x = c.getContext('2d'), g = x.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.max(w, h) * 0.75);
    g.addColorStop(0, '#1d3a57'); g.addColorStop(0.6, '#0f2033'); g.addColorStop(1, '#070e17'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const img = new Image(); img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))); await img.decode();
    const s = Math.min(w, h) * scale; x.drawImage(img, (w - s) / 2, (h - s) / 2, s, s);
    return c.toDataURL('image/png').split(',')[1];
  }, [svg, w, h, scale]);
  return Buffer.from(b64, 'base64');
}
if (MOBILE) {
  // Android: ikon lama 48 dp, latar depan ikon adaptif 108 dp (emblem di zona aman 66 dp), splash gelap
  const RES = 'mobile/android/app/src/main/res/', D = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(D)) {
    writeFileSync(RES + 'mipmap-' + d + '/ic_launcher.png', await render(Math.round(48 * k), 'full', 0.86));
    writeFileSync(RES + 'mipmap-' + d + '/ic_launcher_round.png', await render(Math.round(48 * k), 'full', 0.86));
    writeFileSync(RES + 'mipmap-' + d + '/ic_launcher_foreground.png', await render(Math.round(108 * k), 'fg', 0.6));
  }
  for (const dir of ['drawable', ...['land', 'port'].flatMap((o) => Object.keys(D).map((d) => 'drawable-' + o + '-' + d))]) {
    const f = RES + dir + '/splash.png', [w, h] = pngSize(f);
    writeFileSync(f, await renderRect(w, h, 0.3));
  }
  // iOS: ikon aplikasi 1024 tanpa transparansi, splash 2732
  writeFileSync('mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', await render(1024, 'full', 0.86));
  for (const n of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) writeFileSync('mobile/ios/App/App/Assets.xcassets/Splash.imageset/' + n, await render(2732, 'full', 0.22));

  mkdirSync('mobile/assets', { recursive: true });
  writeFileSync('mobile/assets/icon-foreground.png', await render(1024, 'fg', 0.6));
  writeFileSync('mobile/assets/icon-background.png', await render(1024, 'bg', 0));
  writeFileSync('mobile/assets/icon-only.png', await render(1024, 'full', 0.86));
  for (const n of ['splash.png', 'splash-dark.png']) writeFileSync('mobile/assets/' + n, await render(2732, 'full', 0.22));
}
await browser.close();
console.log('ikon dibuat' + (MOBILE ? ' (termasuk aset mobile)' : ''));
