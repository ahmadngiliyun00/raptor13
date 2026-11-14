// Pemindai rahasia sederhana: kunci privat, token API umum, sandi keystore, dan berkas keystore yang ikut
// dilacak. --history juga memindai seluruh riwayat git (isi perubahan setiap commit).
// Pemakaian: node scripts/scan-secrets.mjs [--history]   (keluar dengan kode 1 bila ada temuan)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PATTERNS = [
  ['kunci privat', /-----BEGIN (RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/],
  ['token GitHub', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{60,}\b/],
  ['kunci AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['kunci API Google', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['token Slack', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['sandi keystore', /(storePassword|keyPassword|KEYSTORE_PASSWORD|KEY_PASSWORD)\s*[=:]\s*["']?[^\s"'$<{]{6,}/],
];
const SKIP = /^(vendor|node_modules)\//;
const hits = [];
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
for (const f of files) {
  if (/\.(jks|keystore|p12|pem|key)$/i.test(f) ? true : /(^|\/)\.env(\.|$)/.test(f)) hits.push(`${f}: berkas rahasia dilacak git`);
  if (SKIP.test(f) ? true : /\.(png|jpe?g|ico|apk|aab|webp)$/i.test(f)) continue;
  let t; try { t = readFileSync(f, 'utf8'); } catch (err) { continue; }
  if (f === 'scripts/scan-secrets.mjs') continue;
  for (const [name, re] of PATTERNS) if (re.test(t)) hits.push(`${f}: ${name}`);
}
if (process.argv.includes('--history')) {
  const log = execFileSync('git', ['log', '-p', '--all', '--no-color', '--', '.', ':(exclude)vendor', ':(exclude)scripts/scan-secrets.mjs'], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024 });
  for (const [name, re] of PATTERNS) if (re.test(log)) hits.push(`riwayat git: ${name}`);
  const names = execFileSync('git', ['log', '--all', '--name-only', '--format='], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).split('\n');
  for (const n of new Set(names)) if (/\.(jks|keystore|p12|pem|key)$/i.test(n) ? true : /(^|\/)\.env(\.|$)/.test(n)) hits.push(`riwayat git: berkas ${n}`);
}
if (hits.length) { console.log('Temuan rahasia:\n' + hits.join('\n')); process.exit(1); }
console.log('Tidak ada rahasia ditemukan (' + files.length + ' berkas' + (process.argv.includes('--history') ? ', termasuk riwayat git' : '') + ').');
