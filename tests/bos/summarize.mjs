// Ringkas data probe keterlihatan bos menjadi tabel markdown (dipakai docs/bos/diagnosis.md).
// Pemakaian: node tests/bos/summarize.mjs <label> [label2]
import { readFileSync } from 'node:fs';
const labels = process.argv.slice(2);
const load = (l) => JSON.parse(readFileSync(new URL(`../../docs/bos/data/probe-${l}.json`, import.meta.url)));
// Kelas: jelas (minimal 40 piksel dan kontras 0,15), samar (minimal 10 piksel), tidak terlihat
const cls = (r) => (r.pixels >= 40 ? (r.meanContrast >= 0.15 ? 'jelas' : 'samar') : r.pixels >= 10 ? 'samar' : 'tidak');
const W = (r) => (r.world === 'earth' ? 'medan Bumi' : r.area);
const NAMES = { raksasa: 'Penjaga Raksasa', miner: 'Penambang Raksasa', hunter: 'Pemburu Agung', naga: 'Sang Naga Vanta' };
for (const l of labels) {
  const rows = load(l);
  console.log(`\n### Data ${l}\n`);
  console.log('| Bos | Jarak | Piksel tampak (median dunia angkasa) | Kontras rata-rata | Medan Bumi (piksel) | Kualitas Rendah (median) | Dunia tidak terlihat atau samar |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  for (const kind of Object.keys(NAMES)) for (const dist of [50, 150, 400, 1200]) {
    const hi = rows.filter((r) => r.kind === kind ? (r.dist === dist ? r.quality === 'tinggi' : false) : false);
    const space = hi.filter((r) => r.world !== 'earth' ? !r.bloom : false), earth = hi.find((r) => r.world === 'earth' ? !r.bloom : false);
    const low = rows.filter((r) => r.kind === kind ? (r.dist === dist ? (r.quality === 'rendah' ? r.world !== 'earth' : false) : false) : false);
    const med = (a) => { const v = a.map((x) => x.pixels).sort((p, q) => p - q); return v.length ? v[Math.floor(v.length / 2)] : '-'; };
    const mc = (a) => (a.length ? Math.round(a.reduce((s, x) => s + x.meanContrast, 0) / a.length * 100) / 100 : '-');
    const badWorlds = [...new Set(hi.filter((r) => cls(r) !== 'jelas').map(W))];
    console.log(`| ${NAMES[kind]} | ${dist} | ${med(space)} | ${mc(space).toString().replace('.', ',')} | ${earth ? earth.pixels + (earth.onScreen ? '' : ' (di luar far)') : '-'} | ${med(low)} | ${badWorlds.length ? badWorlds.length + ' dari 12' + (badWorlds.length < 12 ? ' (' + badWorlds.join(', ') + ')' : '') : 'tidak ada'} |`);
  }
  const tot = rows.length, counts = { jelas: 0, samar: 0, tidak: 0 };
  for (const r of rows) counts[cls(r)]++;
  // D5: terlihat bila kanvas jelas atau samar, ATAU penanda HUD (braket atau titik) tampil
  if (rows.some((r) => r.hud !== undefined)) {
    const seen = (r) => (cls(r) !== 'tidak' ? true : (r.hud === 'mark' ? true : r.dot));
    const inv = rows.filter((r) => !seen(r));
    const eff = rows.map((r) => Math.max(r.boxW || 0, r.boxH || 0, r.dot ? (r.dotW || 16) : 0, r.hud === 'mark' ? 26 : 0));
    console.log('\nD5: kombinasi tidak terlihat (kanvas dan penanda): ' + inv.length + ' dari ' + tot + '; ukuran efektif minimum bos plus penanda: ' + Math.min(...eff) + ' px; titik piksel minimum tampil di ' + rows.filter((r) => r.dot).length + ' kombinasi.');
    for (const r of inv) console.log('  tidak terlihat: ' + r.quality + ' ' + W(r) + ' ' + r.kind + ' ' + r.dist + (r.bloom ? ' bloom' : ''));
  }
  console.log(`\nTotal ${tot} pengukuran: jelas ${counts.jelas}, samar ${counts.samar}, tidak terlihat ${counts.tidak}.`);
  const bloomDiff = rows.filter((r) => r.bloom).map((r) => { const nb = rows.find((x) => x.quality === r.quality ? (x.world === r.world ? (x.kind === r.kind ? (x.dist === r.dist ? !x.bloom : false) : false) : false) : false); return nb ? r.pixels - nb.pixels : 0; });
  console.log(`Bloom mengubah piksel tampak rata-rata ${Math.round(bloomDiff.reduce((s, x) => s + x, 0) / Math.max(1, bloomDiff.length))} piksel.`);
}
