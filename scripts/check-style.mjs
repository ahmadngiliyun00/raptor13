// Pemeriksa gaya RAPTOR13: tanpa em dash (U+2014) di berkas mana pun, dan tanpa ampersand dalam teks prosa
// (Markdown, YAML, teks). Ampersand sebagai sintaks kode (operator, entitas HTML, query string) diizinkan,
// jadi untuk berkas kode hanya em dash yang diperiksa; di Markdown blok kode, kode inline, tautan URL, dan
// entitas HTML dilewati. Hanya berkas yang dilacak git; vendor dan dependensi pihak ketiga dikecualikan.
// Pemakaian: node scripts/check-style.mjs   (keluar dengan kode 1 bila ada pelanggaran)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const EM = String.fromCharCode(0x2014), AMP = String.fromCharCode(38);
const SKIP = /^(vendor|node_modules|mobile\/android|mobile\/ios|mobile\/node_modules)\//;
const BIN = /\.(png|jpe?g|gif|webp|ico|glb|bin|zip|apk|aab|keystore|jks|pdf|woff2?)$/i;
const PROSE = /\.(md|ya?ml|txt)$/i;
const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter((f) => (f ? !SKIP.test(f) : false)).filter((f) => !BIN.test(f));
const bad = [];
for (const f of files) {
  let text;
  try { text = readFileSync(f, 'utf8'); } catch (err) { continue; }
  const lines = text.split('\n');
  let fence = false;
  lines.forEach((line, i) => {
    if (line.includes(EM)) bad.push(`${f}:${i + 1}: em dash`);
    if (!PROSE.test(f)) return;
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
    if (fence) return;
    // Lewati kode inline, URL, dan entitas HTML
    const prose = line.replace(/`[^`]*`/g, '').replace(/https?:\/\/\S+/g, '').replace(new RegExp(AMP + '[a-zA-Z]+;|' + AMP + '#[0-9]+;', 'g'), '');
    if (prose.includes(AMP)) bad.push(`${f}:${i + 1}: ampersand dalam teks`);
  });
}
if (bad.length) { console.log('Pelanggaran gaya:\n' + bad.join('\n')); process.exit(1); }
console.log('Gaya bersih: ' + files.length + ' berkas diperiksa, tanpa em dash dan tanpa ampersand dalam teks.');
