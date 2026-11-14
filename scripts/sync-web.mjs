// Salin game ke mobile/www untuk Capacitor (C10). index.html tetap satu-satunya sumber kebenaran: berkas
// disalin apa adanya, tidak ada kode yang digandakan atau diubah. Ikut disalin: manifest, ikon, dan pustaka
// three.js lokal (hanya berkas yang dipetakan importmap beserta lisensinya). Service worker tidak disalin
// karena aplikasi native sudah luring dan game tidak mendaftarkannya di Capacitor.
// Pemakaian: node scripts/sync-web.mjs
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT = ROOT + 'mobile/www/';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest']) cpSync(ROOT + f, OUT + f);
cpSync(ROOT + 'icons', OUT + 'icons', { recursive: true });
const html = readFileSync(ROOT + 'index.html', 'utf8');
const map = JSON.parse(/<script type="importmap">([\s\S]*?)<\/script>/.exec(html)[1]);
const files = new Set(Object.keys(map.integrity || {}).filter((p) => p.startsWith('./vendor/')));   // berkas berintegrity saja (pemetaan folder three/addons/ dilewati)
for (const p of files) { const rel = p.slice(2); mkdirSync(OUT + rel.replace(/[^/]+$/, ''), { recursive: true }); cpSync(ROOT + rel, OUT + rel); }
cpSync(ROOT + 'vendor/three-0.187.0/LICENSE', OUT + 'vendor/three-0.187.0/LICENSE');
const v = /const GAME_VERSION = '([0-9.]+)'/.exec(html)[1];
writeFileSync(OUT + 'versi.txt', v + '\n');
console.log('mobile/www disinkronkan: index.html, manifest, ikon, ' + files.size + ' berkas vendor, versi ' + v);
