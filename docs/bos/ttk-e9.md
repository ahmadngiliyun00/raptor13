# TTK bos setelah senjata bertingkat dan penerbangan baru (E9)

Waktu sampai bos kalah (TTK) diukur dengan `tests/bos/ttk.mjs` pada 14 November 2026:

- dua profil bot: terampil dan rata-rata;
- empat bos;
- tiga kesulitan;
- 8 seed;
- batas 300 detik;
- bot menerima kerusakan sungguhan.

**Pembanding "sebelum".** Kode E4 (commit `1ab9564`, sebelum senjata bertingkat dan penerbangan E7), dijalankan
lewat `PERF_SITE`.

**"Sesudah".** Kode E9 dengan opsi `--tier=realistis`, yaitu tingkat senjata yang wajar dimiliki pemain saat bos itu
muncul menurut aturan perolehan E5:

| Bos | Kemunculan | Tingkat realistis | Alasan |
|---|---|---|---|
| Penjaga Raksasa | Bumi, tiap beberapa gelombang | 2 | kartu Peningkatan Senjata di level 5 |
| Penambang Raksasa | stage 5 | 2 | hadiah selesai stage 3 |
| Pemburu Agung | stage 8 | 3 | hadiah selesai stage 7 |
| Sang Naga Vanta | stage 10 | 3 | |

Data:

- `docs/bos/data/ttk-e9-sebelum.json`
- `ttk-e9-sesudah.json`
- `ttk-e9-t1.json` dan `ttk-e9-t2.json`: tingkat tetap, sebelum penyesuaian perilaku bos.

## Masalah yang ditemukan

**Tanpa penyesuaian, senjata bertingkat memotong TTK terlalu jauh.** Bot terampil, Normal:

| Bos | Tingkat 1 | Tingkat 2 | Tingkat 3 (realistis untuk Pemburu) |
|---|---|---|---|
| Penjaga Raksasa | 102 | 57 | - |
| Penambang Raksasa | 160 | 83 | 80 |
| Pemburu Agung | 130 | 83 | 36 |

Angka Pemburu tingkat 3 berasal dari run pertama `--tier=realistis` sebelum penyesuaian. Berkasnya tertimpa run
akhir, dan angkanya tercatat di riwayat kerja E9.

**Penyetelan syarat perolehan saja tidak cukup.**

- Penambang di tingkat 1 sedikit di atas target (160), sedangkan di tingkat 2 di bawahnya (83).
- Penjaga muncul berulang di Bumi, jadi pertarungan berikutnya selalu terjadi di tingkat lebih tinggi.

Karena itu yang disetel adalah perilaku bos.

## Penyetelan (hanya perilaku bos)

`BOSS_PILOT.tier` menambah pengali per kesulitan dan per tingkat senjata pemain untuk dua hal:

- lama bos berada di depan pemain (`lead`);
- lama jendela rentan (`vuln`).

Saat pemain membawa lebih banyak laras, bos lebih cepat berpindah dari kerucut bidik, dan titik lemahnya terbuka lebih
singkat. HP bos, damage bos, HP musuh, dan hadiah tidak berubah. Aturan perolehan E5 juga tidak berubah.

| Kesulitan | lead (T1, T2, T3) | vuln (T1, T2, T3) | Alasan |
|---|---|---|---|
| Mudah | 1; 0,5; 0,35 | 1; 0,7; 0,5 | lama di depan Mudah panjang (14 sampai 17 detik) |
| Normal | 1; 0,62; 0,55 | 1; 0,8; 0,7 | T3 0,42 sempat dicoba, tetapi bot rata-rata gagal mengalahkan Pemburu di 80 persen run |
| Sulit | 1; 1; 0,85 | 1; 1; 0,9 | lama di depan Sulit sudah pendek (2 sampai 2,8 detik); pengali Normal membuat Sulit tidak terkalahkan |

## Hasil (median dengan rentang, detik)

**Bot terampil.** Target awal D2: Mudah 60 sampai 100, Normal 90 sampai 150, Sulit 120 sampai 200.

| Bos (tingkat) | Kesulitan | Sebelum (E4, T1) | Sesudah (realistis) | Kerusakan | Mati |
|---|---|---|---|---|---|
| Penjaga Raksasa (T2) | mudah | 54 (32 sampai 90) | 32 (27 sampai 44) | 32 | 0 |
| Penjaga Raksasa (T2) | normal | 98 (76 sampai 142) | 128 (99 sampai 169) | 174 | 1,3 |
| Penjaga Raksasa (T2) | sulit | 179 (148 sampai 213) | 148 (77 sampai 276) | 248 | 2,1 |
| Penambang Raksasa (T2) | mudah | 117 (103 sampai 145) | 75 (47 sampai 111) | 110 | 0,5 |
| Penambang Raksasa (T2) | normal | 115 (112 sampai 160) | 108 (72 sampai 145) | 185 | 1,3 |
| Penambang Raksasa (T2) | sulit | 223 (188 sampai 264) | 207 (155 sampai 247) | 335 | 3 |
| Pemburu Agung (T3) | mudah | 36 (31 sampai 42) | 21 (19 sampai 74) | 61 | 0,3 |
| Pemburu Agung (T3) | normal | 106 (88 sampai 177) | 115 (34 sampai 159) | 141 | 0,8 |
| Pemburu Agung (T3) | sulit | 276 (258 sampai 295), 63 persen tidak kalah | 113 (68 sampai 247) | 231 | 1,9 |
| Sang Naga Vanta (T3) | semua | tidak kalah | tidak kalah | 221 sampai 285 | 1,6 sampai 2,3 |

**Bot rata-rata** (perkiraan pemain biasa):

| Bos (tingkat) | Kesulitan | Sebelum (E4, T1) | Sesudah (realistis) | Kerusakan | Mati |
|---|---|---|---|---|---|
| Penjaga Raksasa (T2) | mudah | 100 (73 sampai 184) | 51 (31 sampai 69) | 30 | 0 |
| Penjaga Raksasa (T2) | normal | 169 (138 sampai 210) | 223 (115 sampai 294), 13 persen tidak kalah | 311 | 2,6 |
| Penjaga Raksasa (T2) | sulit | tidak kalah | 241 (224 sampai 251), 63 persen tidak kalah | 498 | 4,6 |
| Penambang Raksasa (T2) | mudah | 166 (146 sampai 205) | 99 (84 sampai 127) | 143 | 0,8 |
| Penambang Raksasa (T2) | normal | 179 (165 sampai 202) | 161 (143 sampai 241) | 223 | 1,8 |
| Penambang Raksasa (T2) | sulit | tidak kalah | 269 (248 sampai 277), 63 persen tidak kalah | 516 | 4,8 |
| Pemburu Agung (T3) | mudah | 62 (56 sampai 77) | 85 (32 sampai 122) | 154 | 1,1 |
| Pemburu Agung (T3) | normal | 198 (136 sampai 277) | 229 (144 sampai 299), 13 persen tidak kalah | 338 | 2,9 |
| Pemburu Agung (T3) | sulit | tidak kalah | 252 (176 sampai 287), 38 persen tidak kalah | 416 | 3,4 |
| Sang Naga Vanta (T3) | semua | tidak kalah | tidak kalah | 202 sampai 353 | 1,4 sampai 2,6 |

## Penilaian jujur

- **Normal, bot terampil.** Ketiga bos reguler masuk target: 128, 108, dan 115 detik.
- **Sulit, bot terampil.** Ketiganya lebih dekat ke target daripada sebelumnya: 148, 207, dan 113. Sebelumnya 179,
  223, dan 276 (Pemburu tidak kalah di 63 persen run). Penambang 7 detik di atas batas 200, dan Pemburu 7 detik di
  bawah batas 120.
- **Mudah** tetap lebih cepat dari target untuk Penjaga (32) dan Pemburu (21). Kondisi ini sama dengan sebelum E5
  (54 dan 36) dan sengaja dibiarkan seperti di D2. Penambang kini masuk target (75; sebelumnya 117).
- **Bot rata-rata** di Normal kini 1,5 sampai 2 kali bot terampil (161 sampai 229 detik). Penjaga dan Pemburu Normal
  lebih lama dari sebelumnya (223 dibanding 169, dan 229 dibanding 198), dan 13 persen run tidak selesai dalam 300
  detik. Penyebab utamanya penerbangan E7: ramp kurva S membuat bot yang bereaksi lambat sedikit kurang tepat. Bot
  Sulit kini kadang menang, sedangkan sebelumnya tidak pernah.
- **Variasi antar seed sangat besar.** Contohnya Pemburu Normal 34 sampai 159 detik. Median 5 seed dan 8 seed bisa
  berbeda sampai 40 detik, jadi angka tunggal perlu dibaca bersama rentangnya.
- **Sang Naga Vanta** tetap tidak terkalahkan oleh bot di semua kesulitan, sama seperti sebelum perubahan. Penyebabnya
  generator perisai fase 1 yang terlalu kecil untuk bot (lihat `perilaku.md`). Itu keputusan desain di luar prompt
  ini, dan belum diuji oleh manusia.
- **Tabrakan dan perilaku fatal tidak berubah.** Uji B6 (tabel tabrakan), D4, dan uji tabrakan Balik U lolos di
  regresi penuh.

## Cara mengulang

```bash
node tests/bos/ttk.mjs e9-sesudah --tier=realistis --seeds=1,2,3,4,5,6,7,8
PERF_SITE=<folder salinan versi lama> node tests/bos/ttk.mjs e9-sebelum --seeds=1,2,3,4,5,6,7,8
```
