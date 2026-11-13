// Penjaga Content Security Policy dan Subresource Integrity untuk index.html (A3).
// - Menghitung integrity sha384 tiap berkas Three.js di vendor/ yang dipetakan importmap.
// - Menghitung hash sha256 setiap <script> inline yang dieksekusi (importmap dan module) dan <style> inline.
// - Menyusun meta CSP dari hash tersebut.
// Pemakaian:
//   node tests/csp.mjs           periksa saja (keluar dengan kode 1 bila hash atau integrity usang)
//   node tests/csp.mjs --write   perbarui importmap dan meta CSP di index.html
// Jalankan --write setiap kali skrip game, style, atau berkas vendor berubah. Uji Playwright menjalankan
// pemeriksaan ini dan juga gagal bila browser melaporkan pelanggaran CSP.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const FILE = `${ROOT}index.html`;
const VENDOR = 'vendor/three-0.187.0/';
const MODULES = [
  'build/three.module.js', 'build/three.core.js',
  'examples/jsm/postprocessing/EffectComposer.js', 'examples/jsm/postprocessing/RenderPass.js',
  'examples/jsm/postprocessing/UnrealBloomPass.js', 'examples/jsm/postprocessing/OutputPass.js',
  'examples/jsm/postprocessing/ShaderPass.js', 'examples/jsm/postprocessing/MaskPass.js',
  'examples/jsm/postprocessing/Pass.js', 'examples/jsm/shaders/CopyShader.js',
  'examples/jsm/shaders/LuminosityHighPassShader.js', 'examples/jsm/shaders/OutputShader.js',
];

const b64 = (algo, data) => createHash(algo).update(data).digest('base64');

export function importMap() {
  const integrity = {};
  for (const m of MODULES) integrity[`./${VENDOR}${m}`] = `sha384-${b64('sha384', readFileSync(`${ROOT}${VENDOR}${m}`))}`;
  const map = { imports: { three: `./${VENDOR}build/three.module.js`, 'three/addons/': `./${VENDOR}examples/jsm/` }, integrity };
  return '\n' + JSON.stringify(map, null, 2) + '\n';
}

export function policy(html) {
  const scripts = [...html.matchAll(/<script type="(importmap|module)">([\s\S]*?)<\/script>/g)].map((m) => `'sha256-${b64('sha256', m[2])}'`);
  const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => `'sha256-${b64('sha256', m[1])}'`);
  return [
    "default-src 'none'",
    `script-src 'self' ${scripts.join(' ')}`,
    `style-src 'self' ${styles.join(' ')}`,
    "img-src 'self' data: blob:",
    "media-src 'self' data: blob:",
    "connect-src 'none'",
    "font-src 'none'",
    "worker-src 'none'",
    "manifest-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

const META_RE = /<meta http-equiv="Content-Security-Policy" content="[^"]*">/;
const MAP_RE = /(<script type="importmap">)([\s\S]*?)(<\/script>)/;

let html = readFileSync(FILE, 'utf8');
const wantMap = importMap();
const mapOk = MAP_RE.exec(html)?.[2] === wantMap;
if (process.argv.includes('--write')) {
  html = html.replace(MAP_RE, (_, a, __, c) => a + wantMap + c);
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy(html)}">`;
  html = META_RE.test(html) ? html.replace(META_RE, meta) : html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n${meta}`);
  writeFileSync(FILE, html);
  console.log('importmap dan meta CSP diperbarui');
} else {
  const cur = META_RE.exec(html)?.[0] || '';
  const ok = mapOk ? cur === `<meta http-equiv="Content-Security-Policy" content="${policy(html)}">` : false;
  console.log(ok ? 'CSP dan integrity mutakhir' : 'CSP atau integrity usang: jalankan node tests/csp.mjs --write');
  process.exitCode = ok ? 0 : 1;
}
