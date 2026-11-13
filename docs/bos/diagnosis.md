# Diagnosis: bos tidak terlihat (B1)

Laporan pemilik: di beberapa bos, bos tidak terlihat sama sekali. Panah arah ada, tetapi pemain tidak tahu
mana yang harus dibunuh. Bos selalu mengejar dan berada di belakang pemain, sehingga pemain harus menjauh,
putar balik, lalu menyerang, berulang terus.

## Daftar bos

Semua bos ada di `BOSS_DEFS` (`index.html`). Tidak ada mini-bos lain: target kontrak "buru" adalah musuh
biasa bertanda (komandan) dan sudah punya penanda kuning sendiri.

| Bos | Kunci | Muncul di | Ukuran (radius kasar) | Material |
| --- | --- | --- | --- | --- |
| Penjaga Raksasa | `raksasa` | medan Bumi, tiap 5 gelombang | 14 | `VANTA.hull` 0x2b2d35, `VANTA.plate` 0x5a1f33, `VANTA.dark` 0x17181d |
| Penambang Raksasa | `miner` | stage 5, Sabuk Asteroid | 20 | `BOSS_MAT.hull` 0x3a3c44, `BOSS_MAT.ind` 0x8a6a2a |
| Pemburu Agung | `hunter` | stage 8, Uranus | 10 | `VANTA.hull`, `VANTA.plate` (umpan tiruan transparan di fase 2) |
| Sang Naga Vanta | `naga` | stage 10, Pluto dan Sabuk Kuiper | 40 (18 segmen) | `BOSS_MAT.scale` 0x2a2030, `BOSS_MAT.gold` |

## Cara mengukur

Hook baru `debug.bossProbe({ kind, dist, bloom })` meletakkan bos di depan pemain pada jarak tertentu,
memperbarui kamera chase, lalu merender scene dua kali (dengan dan tanpa bos) dan membandingkan piksel
kanvas. Hasilnya: jumlah piksel bos yang benar-benar tampak, kontras luminans rata-rata, ukuran kotak di
layar, jarak kamera, bidang jauh kamera (far), status di dalam benda, terhalang, dan tingkat kabut.

- Skrip: `node tests/bos/diagnose.mjs <label> [--shots]`, ringkasan: `node tests/bos/summarize.mjs <label>`.
- Matriks: 4 bos, 12 dunia (medan Bumi, Merkurius, Venus, Bumi, Mars, Sabuk Asteroid, Jupiter, Saturnus,
  Uranus, Neptunus, Pluto, Sabuk Kuiper), jarak 50, 150, 400, 1200, kualitas Tinggi dengan dan tanpa bloom,
  ditambah kualitas Rendah. Total 576 pengukuran per putaran, viewport 1280x720.
- Kelas: **jelas** (minimal 40 piksel dan kontras rata-rata minimal 0,15), **samar** (minimal 10 piksel),
  **tidak terlihat** (kurang dari 10 piksel).
- Data mentah: `docs/bos/data/probe-sebelum.json`. Screenshot: `docs/bos/screenshots/sebelum/`
  (tiap bos di medan Bumi, Saturnus, Pluto pada jarak 400 dan 1200).
- Perilaku: `debug.bossSim(kind, 180, { difficulty, bot })` dan `node tests/bos/metrics.mjs <label>`
  (lihat `docs/bos/perilaku.md`). Data: `docs/bos/data/perilaku-sebelum.json`.
- Butir d dan g: `node tests/bos/checks.mjs` (hook `debug.bossChecks`).

## Hasil sebelum perbaikan

Ringkasan 576 pengukuran: **jelas 278, samar 214, tidak terlihat 84**.

| Bos | Jarak | Piksel tampak (median angkasa) | Kontras rata-rata | Medan Bumi (piksel) | Kualitas Rendah | Dunia samar atau tidak terlihat |
| --- | --- | --- | --- | --- | --- | --- |
| Penjaga Raksasa | 50 | 3184 | 0,18 | 5474 | 3203 | 5 dari 12 |
| Penjaga Raksasa | 150 | 354 | 0,14 | 672 | 406 | 8 dari 12 |
| Penjaga Raksasa | 400 | 30 | 0,13 | 118 | 35 | 9 dari 12 |
| Penjaga Raksasa | 1200 | 6 | 0,14 | 0 (di luar far) | 3 | 12 dari 12 |
| Penambang Raksasa | 50 | 10710 | 0,13 | 11499 | 10683 | 10 dari 12 |
| Penambang Raksasa | 150 | 1094 | 0,12 | 1502 | 1280 | 10 dari 12 |
| Penambang Raksasa | 400 | 153 | 0,11 | 244 | 185 | 9 dari 12 |
| Penambang Raksasa | 1200 | 18 | 0,11 | 0 (di luar far) | 18 | 12 dari 12 |
| Pemburu Agung | 50 | 759 | 0,20 | 1194 | 764 | 1 dari 12 |
| Pemburu Agung | 150 | 98 | 0,16 | 190 | 105 | 5 dari 12 |
| Pemburu Agung | 400 | 20 | 0,12 | 31 | 15 | 12 dari 12 |
| Pemburu Agung | 1200 | 1 | 0,06 | 0 (di luar far) | 2 | 12 dari 12 |
| Sang Naga Vanta | 50 | 28170 | 0,23 | 25246 | 28101 | 2 dari 12 |
| Sang Naga Vanta | 150 | 4117 | 0,23 | 2996 | 4053 | 5 dari 12 |
| Sang Naga Vanta | 400 | 652 | 0,22 | 267 | 628 | 4 dari 12 |
| Sang Naga Vanta | 1200 | 83 | 0,20 | 0 (di luar far) | 74 | 6 dari 12 |

Contoh: Pemburu Agung pada jarak 400 di Saturnus hanya 20 piksel dengan kontras 0,12 (bintik gelap di atas
latar nebula, `screenshots/sebelum/hunter-saturnus-400.jpg`). Penjaga Raksasa pada jarak 400 di medan Bumi
tampak sebagai bercak abu kecil yang tidak bisa dibedakan dari drone (`raksasa-earth-400.jpg`). Pada jarak
1200 di medan Bumi semua bos 0 piksel.

Perilaku (bot 180 detik, Normal): dengan bot **jelajah** (terbang tanpa membidik, memperlihatkan kecenderungan
bos sendiri) bos hanya **5 sampai 14 persen** waktu di kerucut depan, **37 sampai 42 persen** di ekor, runtun
ekor terlama **5,4 sampai 6,5 detik**, dan **75 sampai 89 persen** di luar layar. Dengan bot **buru** (selalu
membidik bos) Penambang dan Naga menyentuh pesawat **6,4 sampai 9,3 kali per menit** (dalam mode kebal; di
permainan biasa setiap sentuhan adalah tabrakan fatal).

## Pemeriksaan tiap dugaan

| Butir | Dugaan | Hasil | Bukti |
| --- | --- | --- | --- |
| a | Material terlalu gelap, hampir hitam di latar angkasa | **Penyebab utama** | Warna dasar 0x17181d sampai 0x3a3c44 dengan specular rendah. Cahaya angkasa: matahari 2,5 (turun ke 0,3 saat gerhana), hemisfer 0,5 biru gelap, rim 0,7. Kontras rata-rata bos di angkasa 0,11 sampai 0,14 untuk Penjaga, Penambang, Pemburu pada jarak 150 ke atas, padahal Naga yang bersisik emas 0,22. |
| b | Tidak ada emissive atau rim light | **Penyebab** | Semua material Phong bos tanpa emissive. Rim light dunia (0,7, dari arah berlawanan matahari) hanya menerangi sisi tertentu; bos yang membelakangi matahari dan rim tampak sebagai siluet hitam. |
| c | Skala kecil atau jauh, melewati batas far kamera | **Penyebab** | Medan Bumi: far kamera 1009 di kualitas Tinggi dan sekitar 500 di Rendah (`chunkRadius` 2), kabut penuh di jarak itu. Pada jarak 1200 semua bos 0 piksel (`onScreen` false karena di luar far). Di kualitas Rendah far 504 dan faktor kabut sudah 1 (penuh) pada jarak 400, sehingga bos tinggal siluet warna kabut. Penjaga Raksasa muncul 600 di depan, artinya **di luar far pada kualitas Rendah**, bawaan perangkat sentuh. Pemburu Agung (radius 10) di jarak 400 hanya sekitar 26 piksel tinggi di layar 720 piksel. |
| d | Frustum culling salah karena bounding sphere tidak diperbarui | Bukan penyebab | Piksel bos pada jarak 400 dengan culling dan tanpa culling: Penjaga 100 dan 109, Penambang 235 dan 233, Pemburu 22 dan 22, Naga 1498 dan 1378 (selisih karena animasi antar render). |
| e | Spawn di dalam planet, asteroid, atau di balik objek besar | Penyebab kecil | Bos tidak didorong keluar dari planet seperti musuh biasa (`SpaceWorld.update` hanya mendorong musuh dan asteroid). Saat area awal di dekat Bumi dan Bulan, Pemburu Agung 1,8 sampai 2,1 persen waktu berada di dalam benda padat. Di area stage aslinya (Sabuk, Uranus, Pluto) 0 persen. Di medan Bumi Penjaga Raksasa 1,1 persen waktu terhalang bukit (bot jelajah). |
| f | depthWrite atau renderOrder membuat bos tertutup bintang atau nebula | Bukan penyebab | Langit terpanggang di `scene.background`; bintang dan nebula memakai renderOrder negatif. Bos selalu menghasilkan piksel saat di layar; tidak ada kasus 0 piksel di angkasa pada jarak 50 sampai 400. |
| g | Lompatan posisi atau NaN | Bukan penyebab | 18 pemindaian per bos selama 90 detik simulasi: 0 matriks non-finite. |
| h | `visible` atau layer dimatikan oleh efek (cutscene) | Bukan penyebab | Tidak ada kode yang menyembunyikan grup bos selain `Bosses.clear`. Cutscene hanya memindahkan kamera. |
| i | LOD atau culling jarak jauh dari optimasi performa memotong bos | Bukan penyebab | Optimasi A2 tidak menyentuh bos; tidak ada LOD bos. Yang memotong hanya far kamera (butir c). |
| j | Bos jatuh ke kualitas Rendah dan material diganti | Bukan penyebab | Preset Rendah tidak mengganti material. Median piksel Rendah sama dengan Tinggi tanpa bloom (contoh Penambang 400: 185 dan 153). Bloom justru mengurangi piksel tampak rata-rata 76 piksel karena tepi gelap tersapu pendar latar. |
| perilaku | Bos selalu di ekor | **Penyebab utama "tidak tahu mana bosnya"** | Bos mengorbit titik di sekitar pemain dengan kecepatan 0,6 sampai 0,8 kali kecepatan dasar pemain (Penjaga 52, Penambang 42, Naga 56, pemain 70 sampai 128). Saat pemain terbang lurus bos tertinggal: 75 sampai 89 persen waktu di luar layar. Bos juga tidak pernah masuk penanda tepi layar (hanya musuh biasa), sehingga satu-satunya petunjuk adalah panah kecil di tepi radar. |

## Tabel bos, penyebab, bukti, perbaikan

| Bos | Penyebab | Bukti | Perbaikan (B2 sampai B5) |
| --- | --- | --- | --- |
| Penjaga Raksasa | a, b (lambung Vanta hampir hitam), c (muncul 600 di depan, di luar far Rendah 500 dan kabut), perilaku (orbit lambat, tertinggal) | 30 piksel median di jarak 400, 9 dari 12 dunia samar; 0 piksel di jarak 1200 medan Bumi; bot jelajah: 12 persen di depan, 76 persen di luar layar | emissive dan rim jingga, kabut hanya 35 persen pada bos, far kamera Bumi diperlebar sejauh bos, kontur jingga, ikon, panah tepi, siklus lewat depan |
| Penambang Raksasa | a, b (lambung abu gelap), c (jarak 1200), perilaku (orbit 0,6 kali kecepatan pemain, serudukan bor menabrak) | kontras 0,11 sampai 0,13 di semua jarak, 9 sampai 10 dari 12 dunia samar; bot buru: 6,4 sentuhan per menit | emissive dan rim emas, kontur, ikon, siklus lewat depan dengan jarak aman, telegraf tembakan yang sebelumnya tanpa aba-aba |
| Pemburu Agung | a, b, c (paling kecil: radius 10), e (bisa berada di dalam planet), perilaku (umpan tiruan membingungkan) | 20 piksel di jarak 400 dan 12 dari 12 dunia samar; 1 piksel di jarak 1200; 1,8 sampai 2,1 persen di dalam benda di dekat Bumi | emissive dan rim magenta, kontur hanya pada bos asli (umpan tidak), penanda piksel minimum, dorongan keluar dari planet, ikon dan penanda yang membedakan bos dari umpan |
| Sang Naga Vanta | c (jarak 1200 di beberapa dunia), perilaku (tubuh panjang menyapu pemain, kepala di belakang) | 83 piksel di jarak 1200; bot buru: 9,3 sentuhan per menit; bot jelajah: 5 persen di depan | rim merah, kontur satu draw call (BatchedMesh), ikon tengkorak naga, siklus lewat depan dengan jarak aman tubuh |

Hasil setelah perbaikan dicatat di bagian bawah berkas ini (B2) dan di `docs/bos/perilaku.md` (B5).

## Hasil setelah perbaikan keterlihatan (B2)

Perubahan: material bos disalin dengan emissive 22 persen warna sendiri dan rim fresnel berwarna khas
(Penjaga jingga, Penambang emas, Pemburu magenta, Naga merah), kabut Bumi hanya 35 persen pada bos, far kamera
Bumi diperlebar sejauh bos (maksimal 2,5 kali), bos didorong keluar dari planet dan bulan, dan kontur siluet
menyala. Kontur adalah geometri gabungan bos yang digelembungkan beberapa piksel layar (tebal tetap di jarak
berapa pun), digambar BackSide setelah semua objek buram dengan kedalaman didorong menjauh sepanjang sinar
pandang, sehingga hanya tampak di atas latar dan tidak menutupi bagian bos sendiri. Opsi **Sorotan bos**
(tab Grafis): Mati, Halus (bawaan, 1,8 piksel), Kuat (3,2 piksel, lebih terang). Di medan Bumi kontur dibuat
lebih gelap dan pekat karena latarnya terang. Umpan tiruan Pemburu Agung tidak diberi kontur, jadi bos asli
selalu bisa dibedakan. Bos yang di layar lebih kecil dari 14 piksel diberi titik bercahaya (`#boss-dot`).

Biaya: **tepat satu draw call tambahan per bos** (`debug.bossFx()`: Pemburu 81 menjadi 82, Naga 87 menjadi 88;
Sang Naga Vanta memakai `BatchedMesh` dengan 19 instans, kepala dan 18 segmen, dalam satu panggilan
multi-draw). Kontur aktif juga di kualitas Rendah. Shader bos dan kontur dikompilasi di layar muat
(`Warmup`), jadi kemunculan bos pertama tidak tersendat.

Ringkasan 576 pengukuran: **jelas 498 (sebelumnya 278), samar 75 (214), tidak terlihat 3 (84)**.
Data: `docs/bos/data/probe-sesudah-b2.json`, screenshot: `docs/bos/screenshots/sesudah-b2/`.

| Bos | Jarak | Piksel tampak (median angkasa) | Kontras rata-rata | Medan Bumi (piksel) | Kualitas Rendah | Dunia samar atau tidak terlihat |
| --- | --- | --- | --- | --- | --- | --- |
| Penjaga Raksasa | 50 | 6268 (3184) | 0,37 (0,18) | 6453 | 6067 | tidak ada |
| Penjaga Raksasa | 150 | 993 (354) | 0,45 (0,14) | 1089 | 915 | 4 dari 12 |
| Penjaga Raksasa | 400 | 248 (30) | 0,56 (0,13) | 294 | 216 | 6 dari 12 |
| Penjaga Raksasa | 1200 | 74 (6) | 0,64 (0,14) | 95 (0) | 62 | 12 dari 12 |
| Penambang Raksasa | 50 | 12883 (10710) | 0,35 (0,13) | 12643 | 12211 | 1 dari 12 |
| Penambang Raksasa | 150 | 1785 (1094) | 0,36 (0,12) | 1861 | 1693 | tidak ada |
| Penambang Raksasa | 400 | 338 (153) | 0,44 (0,11) | 378 | 315 | 1 dari 12 |
| Penambang Raksasa | 1200 | 76 (18) | 0,56 (0,11) | 93 (0) | 64 | 9 dari 12 |
| Pemburu Agung | 50 | 1674 (759) | 0,39 (0,20) | 1820 | 1529 | tidak ada |
| Pemburu Agung | 150 | 365 (98) | 0,44 (0,16) | 391 | 322 | tidak ada |
| Pemburu Agung | 400 | 111 (20) | 0,51 (0,12) | 137 | 96 | 2 dari 12 |
| Pemburu Agung | 1200 | 38 (1) | 0,56 (0,06) | 50 (0) | 34 | 12 dari 12 |
| Sang Naga Vanta | 50 | 28259 (28170) | 0,26 (0,23) | 25243 | 28125 | 1 dari 12 |
| Sang Naga Vanta | 150 | 4120 (4117) | 0,29 (0,23) | 2964 | 4053 | tidak ada |
| Sang Naga Vanta | 400 | 656 (652) | 0,35 (0,22) | 253 | 629 | tidak ada |
| Sang Naga Vanta | 1200 | 84 (83) | 0,52 (0,20) | 8 (0) | 76 | 3 dari 12 |

Angka dalam kurung adalah nilai sebelum perbaikan. Yang masih "samar" di jarak 1200 adalah bos yang memang
hanya 7 sampai 14 piksel tinggi di layar 720 piksel (kontrasnya sudah 0,52 sampai 0,64); untuk jarak ini
pelacakan bergantung pada penanda di atas bos, panah tepi layar, dan radar (B3, B4). Naga di medan Bumi pada
jarak 1200 dan kualitas Tinggi tertutup lapisan awan stratus (bos diuji 96 satuan di atas pemain, setinggi
awan 205 sampai 248); pada kualitas Rendah yang awannya lebih sedikit Naga tampak 76 piksel. Dalam permainan
Naga hanya muncul di Pluto. Bloom kini menambah piksel tampak (rata-rata 4770) karena kontur dan rim cukup
terang untuk berpendar, sebelumnya mengurangi 76.

## Pembaruan 2.3.1: penanda piksel minimum untuk semua bos (D5)

Masalah dari laporan pemilik: Penjaga Raksasa yang jauh nyaris tidak terlihat. Pada 2.3.0 masih ada 3 dari 576
pengukuran yang tidak terlihat di kanvas, dan bos di jarak 1200 hanya 7 sampai 14 piksel tinggi.

Perubahan:

- Titik piksel minimum (`#boss-dot`) kini 16 piksel dengan inti putih, warna khas bos, dan cincin gelap tipis
  2 piksel, sehingga tetap kontras di langit Bumi yang terang maupun di angkasa yang gelap. Titik aktif untuk
  semua bos, di semua dunia dan kualitas, kapan pun bos di layar lebih kecil dari 14 piksel, tanpa batas
  jarak (bidang jauh kamera sudah diperlebar sejauh bos sejak 2.3.0).
- Bug yang ditemukan saat menguji: bos di medan Bumi yang lebih jauh dari bidang jauh kamera (kualitas Rendah
  1261 satuan, Tinggi 2522 satuan, sudah termasuk perluasan 2,5 kali) terpotong, sehingga proyeksinya
  dianggap "di belakang" dan braket serta titik hilang. Kini posisi layar penanda dihitung dari titik pada
  sinar pandang yang sama di dalam bidang jauh (`projectBoss`), jadi braket dan titik tetap tampil di posisi
  yang benar walau bos sangat jauh.
- Braket penanda di atas bos (minimal 26 piksel) tetap tampil setiap kali bos di layar, dan panah tepi layar
  mengambil alih saat bos di luar layar.
- `debug.bossProbe` kini ikut memperbarui `BossHud`, dan `tests/bos/diagnose.mjs` mencatat status penanda
  (`hud`, `dot`, ukuran titik) pada frame yang sama dengan pengukuran kanvas. Sebuah kombinasi dihitung
  terlihat bila kanvas jelas atau samar, atau penanda tampil.

Ringkasan 576 pengukuran (`docs/bos/data/probe-sesudah-d5.json`):

- Kanvas saja: **jelas 498, samar 78, tidak terlihat 0** (2.3.0: 498, 75, 3).
- Kanvas dan penanda: **0 dari 576 tidak terlihat**. Braket tampil di 576 dari 576, titik piksel minimum
  tampil di 72 kombinasi (semuanya jarak 1200 atau bos kecil di jarak 400). Ukuran efektif terkecil bos
  ditambah penanda: 26 piksel.

| Bos | Jarak | Piksel tampak (median angkasa) | Kontras rata-rata | Medan Bumi (piksel) | Kualitas Rendah | Dunia samar di kanvas |
| --- | --- | --- | --- | --- | --- | --- |
| Penjaga Raksasa | 400 | 251 | 0,55 | 294 | 210 | 3 dari 12 |
| Penjaga Raksasa | 1200 | 72 | 0,65 | 94 | 62 | 12 dari 12 |
| Penambang Raksasa | 1200 | 75 | 0,56 | 94 | 62 | 8 dari 12 |
| Pemburu Agung | 400 | 119 | 0,45 | 138 | 82 | 10 dari 12 |
| Pemburu Agung | 1200 | 37 | 0,53 | 56 | 34 | 11 dari 12 |
| Sang Naga Vanta | 1200 | 83 | 0,52 | 78 | 76 | 2 dari 12 |

Tabel hanya memuat baris yang masih samar di kanvas; semuanya tertolong braket dan titik. Baris lain sama
dengan tabel B2 di atas (selisih di bawah 3 persen karena acak dunia). Kelas "samar" memakai ambang yang sama
dengan sebelumnya (minimal 10 piksel, atau 40 piksel dengan kontras di bawah 0,15).

Uji: `tests/bos.spec.mjs` (D5) memeriksa bahwa braket dan titik (16 piksel, cincin gelap) tampil untuk keempat
bos pada jarak tempat bos sekitar 11 piksel di layar (Penjaga 1340, Penambang 1900, Pemburu 960, Naga 3800),
di angkasa dan di medan Bumi, dan titik tersembunyi saat bos dekat (150).

## Anggaran performa

`node tests/bos/perf.mjs <label>`: tanpa bos dan dengan tiap bos, medan Bumi dan Saturnus, kualitas Tinggi
dan Rendah, batas 60 FPS, autopilot, 6,5 detik per skenario, MacBook Pro M1 Pro (ANGLE Metal). Nilai di kiri
tanda garis miring adalah sebelum blok BT (snapshot setelah B1), di kanan sesudah. Data:
`docs/bos/data/perf-sebelum.json` dan `perf-sesudah.json`.

| Kualitas | Dunia | Bos | Frame rata-rata (ms) | Kerja JS rata-rata (ms) | Kerja JS p95 (ms) | Draw call | Segitiga | Program |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| tinggi | medan Bumi | tanpa bos | 16,67 / 16,67 | 1,85 / 1,48 | 3,9 / 2,4 | 99 / 99 | 77282 / 77282 | 94 / 102 |
| tinggi | medan Bumi | raksasa | 16,67 / 16,67 | 1,66 / 1,51 | 2,3 / 3,2 | 104 / 99 | 79218 / 79026 | 95 / 106 |
| tinggi | medan Bumi | miner | 16,67 / 16,67 | 1,28 / 1,79 | 2 / 2,7 | 105 / 102 | 77858 / 79026 | 95 / 106 |
| tinggi | medan Bumi | hunter | 16,67 / 16,67 | 1,55 / 1,63 | 3,8 / 3,2 | 117 / 104 | 83398 / 79334 | 95 / 106 |
| tinggi | medan Bumi | naga | 16,67 / 16,67 | 1,64 / 1,63 | 3,6 / 2,5 | 145 / 106 | 79742 / 82762 | 96 / 107 |
| tinggi | Saturnus | tanpa bos | 16,67 / 16,67 | 1,83 / 1,41 | 2,6 / 2,5 | 68 / 68 | 145718 / 146134 | 77 / 81 |
| tinggi | Saturnus | raksasa | 16,67 / 16,67 | 1,57 / 1,74 | 2,3 / 3,6 | 69 / 71 | 147654 / 147702 | 80 / 86 |
| tinggi | Saturnus | miner | 16,67 / 16,67 | 1,63 / 1,61 | 3 / 2,4 | 66 / 66 | 145974 / 146182 | 80 / 86 |
| tinggi | Saturnus | hunter | 16,67 / 16,67 | 1,75 / 1,54 | 3 / 2,4 | 70 / 84 | 131726 / 224586 | 80 / 86 |
| tinggi | Saturnus | naga | 16,67 / 16,67 | 1,79 / 1,55 | 3,8 / 2,2 | 68 / 70 | 146358 / 150958 | 81 / 87 |
| rendah | medan Bumi | tanpa bos | 16,67 / 16,67 | 1,56 / 1,62 | 3,6 / 3,5 | 61 / 61 | 34098 / 34098 | 61 / 69 |
| rendah | medan Bumi | raksasa | 16,67 / 16,67 | 1,14 / 1,13 | 2,1 / 1,8 | 66 / 67 | 36034 / 36514 | 62 / 73 |
| rendah | medan Bumi | miner | 16,67 / 16,67 | 1,55 / 1,39 | 3,4 / 3,3 | 66 / 65 | 34594 / 35202 | 62 / 73 |
| rendah | medan Bumi | hunter | 16,67 / 16,67 | 1,53 / 1,26 | 3,6 / 2,9 | 76 / 68 | 37094 / 36310 | 62 / 73 |
| rendah | medan Bumi | naga | 16,67 / 16,67 | 2,15 / 1,6 | 4,6 / 2,6 | 126 / 68 | 38178 / 39898 | 63 / 74 |
| rendah | Saturnus | tanpa bos | 16,67 / 16,67 | 1,67 / 1,68 | 4 / 3,9 | 47 / 47 | 77456 / 77456 | 46 / 50 |
| rendah | Saturnus | raksasa | 16,67 / 16,67 | 1,42 / 1,21 | 3,6 / 2 | 48 / 50 | 78976 / 79440 | 48 / 54 |
| rendah | Saturnus | miner | 16,67 / 16,67 | 1,51 / 1,5 | 3,6 / 2,9 | 45 / 45 | 77712 / 77920 | 48 / 54 |
| rendah | Saturnus | hunter | 16,67 / 16,67 | 1,12 / 1,51 | 2,3 / 2,4 | 47 / 63 | 62972 / 156324 | 48 / 54 |
| rendah | Saturnus | naga | 16,67 / 16,67 | 1,55 / 1,4 | 3,7 / 2,2 | 47 / 50 | 78096 / 82360 | 49 / 55 |

Ringkasan:
- Frame time tetap 16,67 ms (60 FPS) di semua 20 skenario.
- Kerja JS rata-rata 1,59 ms sebelum dan 1,51 ms sesudah, dalam batas variasi pengukuran.
- Jumlah draw call per frame bergantung pada posisi bos (di layar atau di luar). Kontur sendiri tepat satu
  draw call per bos (`debug.bossFx`).
- Program shader naik 4 sampai 11, karena varian shader bos (material, kontur, jejak) kini dikompilasi di
  layar muat dan saat dunia berganti. Kemunculan bos tidak lagi menambah program di tengah permainan.
