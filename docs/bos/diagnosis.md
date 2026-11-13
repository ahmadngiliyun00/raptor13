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
