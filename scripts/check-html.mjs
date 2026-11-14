// Validasi HTML dasar index.html (tanpa dependensi): doctype, lang, charset, viewport, title, CSP meta, id unik,
// tanpa skrip eksternal selain vendor lokal, tanpa atribut event inline, lalu cek hash CSP dan integrity
// lewat tests/csp.mjs. Pemakaian: node scripts/check-html.mjs
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const html = readFileSync('index.html', 'utf8');
const errs = [];
const need = [
  [/^<!doctype html>/i, 'doctype html di baris pertama'],
  [/<html[^>]*\blang="id"/, 'atribut lang="id"'],
  [/<meta charset="utf-8">/i, 'meta charset utf-8'],
  [/<meta name="viewport"[^>]*user-scalable=no/, 'meta viewport dengan user-scalable=no'],
  [/<title>[^<]+<\/title>/, 'elemen title'],
  [/<meta http-equiv="Content-Security-Policy"/, 'meta CSP'],
];
for (const [re, label] of need) if (!re.test(html)) errs.push('tidak ada ' + label);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) errs.push('id ganda: ' + [...new Set(dup)].join(', '));
for (const m of html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) if (!m[1].startsWith('./vendor/') ? !m[1].startsWith('vendor/') : false) errs.push('skrip eksternal: ' + m[1]);
if (/\son(click|load|error|input|change|submit)=/i.test(html)) errs.push('atribut event inline (dilarang CSP)');
if (/https?:\/\/(cdn|unpkg|ajax\.googleapis|fonts\.googleapis)/i.test(html)) errs.push('rujukan CDN atau font eksternal');
try { execFileSync(process.execPath, ['tests/csp.mjs'], { stdio: 'pipe' }); } catch (err) { errs.push('hash CSP atau integrity usang, jalankan node tests/csp.mjs --write'); }
if (errs.length) { console.log('Masalah HTML:\n' + errs.join('\n')); process.exit(1); }
console.log('HTML dasar valid: ' + ids.length + ' id unik, CSP dan integrity cocok.');
