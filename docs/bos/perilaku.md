# Perilaku bos: siklus serang lewat depan (B5)

Masalah sebelumnya: bos mengorbit titik di sekitar pemain dengan kecepatan 0,6 sampai 0,8 kali kecepatan
dasar pemain, sehingga saat pemain terbang lurus bos tertinggal di ekor dan hampir selalu di luar layar.
Pemain harus menjauh, putar balik, menyerang, lalu mengulang. Bos yang memburu dari dekat juga sering
menabrak pemain (Penambang dengan serbuan bornya, Naga dengan tubuh panjangnya).

HP bos, damage bos, dan hadiah tidak berubah. Yang berubah hanya cara bos bergerak, jendela rentan, dan
aba-aba sebelum serangan.

## Siklus

Semua bos memakai satu pengendali (`BossPilot` di `index.html`). Sang Naga Vanta memakainya di fase 1, 2,
dan 4. Fase 3 (naga kabur dan dikejar) serta bidikan laser fase 2 tetap memakai gerak lama.

| Mode | Isi | Selesai bila |
| --- | --- | --- |
| lead (mendekat) | Bos terbang di depan pemain, searah, dan meliuk sempit (sekitar 10 derajat). Kecepatannya menyesuaikan jarak, jadi mudah dikejar dan ditembak | Lama `lead` habis |
| windup (khusus Penambang) | Aba-aba 1,3 detik: bor berputar cepat, bos melambat dan menghadap pemain | 1,3 detik |
| strafe (serang lewat depan) | Normal dan Sulit: bos berbalik dan melaju ke titik di samping pemain dengan jarak aman (`clear`), melintasi bidang pandang. Mudah: bos menyapu melintang dari satu sisi ke sisi lain di depan pemain | Bos melewati garis sejajar pemain (Normal, Sulit) atau sudah pindah sisi (Mudah) |
| overshoot (lewat dan menjauh) | Bos terus lurus sejauh `overshoot` | Jarak tempuh tercapai |
| turn (berputar) | Bos berputar lebar dan menyusul ke depan pemain lagi; selama masih di ekor ada dorongan kecepatan ekstra | Bos kembali di depan (kosinus sudut di atas 0,8, atau 0,75 di Mudah). Saat itu jendela rentan dimulai |

Aturan tambahan:

- **Batas ekor.** Bila bos berada di kerucut 120 derajat di belakang pemain lebih dari 35 persen dari
  `tailMax`, bos langsung masuk mode berputar dengan dorongan menyusul. Runtun terlama di ekor yang terukur
  selalu di bawah `tailMax`.
- **Jarak aman.** Bila bos lebih dekat dari `clear`, titik tujuannya didorong menjauh dari pemain. Nilai
  `clear`: Penjaga 48, Penambang 60, Pemburu 42, Naga 90. Naga di mode lead berada 1,35 kali lebih jauh dan
  30 satuan lebih tinggi, agar tubuh panjangnya tidak melintang di jalur pemain.
- **Medan dan planet.** Di Bumi tujuan selalu minimal 60 sampai 80 satuan di atas tanah. Di angkasa tujuan
  dan posisi bos didorong keluar dari planet dan bulan.
- **Kecepatan.** Saat menyusul, bos boleh lebih cepat dari batas musuh biasa (80 persen nitro), maksimal 1,15
  kali nitro pemain, atau 1,45 kali bila masih di ekor. Di mode lead bos mengikuti kecepatan pemain (0,7 sampai
  1,4 kali), jadi pemain yang memakai nitro bisa mendekat.

## Jendela rentan

Saat bos kembali ke depan setelah berputar, `b.vuln` diisi sesuai kesulitan. Selama jendela ini damage
peluru ke bos dikali `vulnMul` (ultimate tidak ikut dikali). Kontur bos berkedip emas, dan braket penanda
serta panah tepi juga berkedip emas.

## Parameter per kesulitan

Tabel ini sama dengan `BOSS_PILOT` di `index.html`.

| Parameter | Mudah | Normal | Sulit |
| --- | --- | --- | --- |
| Sasaran waktu di kerucut depan 60 derajat | sekitar 65 persen | sekitar 45 persen | sekitar 25 persen |
| Lama lead (detik) | 14 sampai 17 | 4,4 sampai 5,6 | 2 sampai 2,8 |
| Jarak lead di depan pemain | 190 | 230 | 270 |
| Gaya serang | melintang di depan | berhadapan lalu lewat | berhadapan lalu lewat |
| Jarak overshoot | 50 | 150 | 280 |
| Laju belok saat berputar | 2,8 | 2,0 | 1,5 |
| Kecepatan menyusul (kali kecepatan pemain) | 2,0 | 1,6 | 1,35 |
| Jendela rentan | 3,0 detik, damage x1,6 | 2,2 detik, x1,4 | 1,5 detik, x1,25 |
| Batas detik berturut-turut di ekor | 4 | 6 | 9 |

Jelajah Bebas dan bos final mengikuti kesulitan yang dipilih (`Game.difficultyKey`).

## Aba-aba serangan (adil)

| Serangan | Sebelum | Sesudah |
| --- | --- | --- |
| Penjaga Raksasa, semburan peluru | aba-aba 0,7 detik | tetap |
| Penambang Raksasa, tembakan bor | **tanpa aba-aba** | aba-aba 0,6 detik (kilat di ujung bor) |
| Penambang Raksasa, lemparan batu fase 2 | **tanpa aba-aba** | aba-aba 0,6 detik di kedua lengan |
| Penambang Raksasa, serbuan bor | aba-aba 1,3 detik, lalu menyerbu langsung ke posisi pemain (sering menabrak) | aba-aba 1,3 detik, lalu menyerbu ke samping pemain dengan jarak aman |
| Pemburu Agung, tembakan | aba-aba 0,5 detik | tetap |
| Pemburu Agung, rudal | **langsung meluncur** | aba-aba 0,5 detik |
| Sang Naga Vanta, turret dan laser | aba-aba 0,55 detik dan 1 detik | tetap |

Umpan tiruan Pemburu Agung kini terbang dalam formasi di samping bos asli (sebelumnya mengorbit pemain
sendiri-sendiri). Hanya bos asli yang mendapat kontur, penanda, dan ikon.

## Metrik

Hook `debug.bossSim(kind, detik, { difficulty, bot })` menjalankan simulasi dengan langkah tetap 1/60
detik, mode kebal, dan gelombang dimatikan (anak buah bos tetap muncul). Ringkasan dari `debug.bossMetrics()`:

- `frontPct`: persen waktu bos di kerucut depan 60 derajat.
- `rearPct`: persen waktu di ekor (lebih dari 120 derajat dari hidung).
- `maxRearStreak`: runtun terlama di ekor.
- `overshootsPerMin`: bos berpindah dari depan ke belakang dalam jarak 500.
- `contactsPerMin`: sentuhan badan bos.
- `vulnWindows`: jumlah jendela rentan.
- `offscreenPct`: persen waktu di luar layar.
- `defeatAt`: waktu sampai bos kalah.

Dua bot dipakai:

- **jelajah**: terbang meliuk lembut tanpa membidik. Memperlihatkan kecenderungan bos sendiri, mendekati
  pemain yang belum mengejar. Sasaran kesulitan diukur dengan bot ini.
- **buru**: selalu membidik bagian bos yang bisa ditembak, menembak terus, dan memakai ultimate saat penuh.

Skrip: `node tests/bos/metrics.mjs <label>` (3 menit per bos, kesulitan, dan bot, kualitas Rendah, bos di
area stage-nya: Penjaga di medan Bumi, Penambang di Sabuk Asteroid, Pemburu di Uranus, Naga di Pluto).
Data: `docs/bos/data/perilaku-sebelum.json` dan `perilaku-sesudah.json`. Simulasi deterministik:
seed lain memberi angka yang sama karena gelombang dimatikan.

### Bot jelajah (sebelum / sesudah)

| Bos | Kesulitan | Di depan (%) | Di ekor (%) | Runtun ekor terlama (detik) | Lewat per menit | Sentuhan per menit | Jendela rentan (3 menit) | Di luar layar (%) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Penjaga Raksasa | mudah | 1,3 / 72,7 | 53,6 / 0 | 10,62 / 0 | 2,7 / 0,6 | 0 / 0 | 5 | 96,2 / 10 |
| Penjaga Raksasa | normal | 1,3 / 43,5 | 52,6 / 24,2 | 11,77 / 5,05 | 4 / 4,7 | 0 / 0 | 13 | 96,2 / 46,6 |
| Penjaga Raksasa | sulit | 1,3 / 23,4 | 53,6 / 13 | 10,62 / 6,75 | 2,7 / 5 | 0 / 0,7 | 12 | 96,2 / 60,4 |
| Penambang Raksasa | mudah | 2,7 / 69,5 | 47,4 / 5,6 | 10,87 / 1,9 | 3,3 / 3,3 | 0 / 0 | 8 | 94,3 / 17,7 |
| Penambang Raksasa | normal | 2,8 / 46 | 47,2 / 32,5 | 10,87 / 5,65 | 4 / 4,7 | 0 / 0,3 | 13 | 94,3 / 47,8 |
| Penambang Raksasa | sulit | 2,8 / 23,3 | 47,5 / 34,8 | 10,87 / 8,25 | 3,3 / 5 | 0 / 1,7 | 14 | 94,3 / 63 |
| Pemburu Agung | mudah | 2,9 / 75,1 | 56,5 / 0 | 11,23 / 0 | 3 / 0,3 | 0 / 0 | 10 | 94,7 / 5,7 |
| Pemburu Agung | normal | 2,9 / 45,9 | 56,6 / 27,6 | 11,23 / 5,82 | 3 / 4,7 | 0 / 0 | 13 | 94,7 / 46,9 |
| Pemburu Agung | sulit | 2,9 / 25,8 | 56,7 / 18,3 | 11,32 / 7,07 | 3 / 4,7 | 0 / 0,3 | 14 | 94,7 / 61,9 |
| Sang Naga Vanta | mudah | 2,9 / 57 | 48,9 / 0 | 9,63 / 0 | 3,7 / 1,7 | 0 / 0,7 | 7 | 95,7 / 20,6 |
| Sang Naga Vanta | normal | 2,9 / 50 | 48,9 / 21,5 | 9,63 / 5,2 | 3,7 / 4,7 | 0 / 0 | 13 | 95,7 / 41,6 |
| Sang Naga Vanta | sulit | 3 / 30,9 | 49 / 31,5 | 9,63 / 6,17 | 3,7 / 4,7 | 0 / 0 | 13 | 95,7 / 58,7 |

Rata-rata waktu di kerucut depan sesudah perubahan: **Mudah 68,6 persen** (sasaran 65), **Normal 46,4
persen** (sasaran 45), **Sulit 25,9 persen** (sasaran 25). Runtun ekor terlama per kesulitan: Mudah 1,9
detik (batas 4), Normal 5,82 detik (batas 6), Sulit 8,25 detik (batas 9). Sebelumnya semua bos 1 sampai 3
persen di depan dan sampai 11,8 detik berturut-turut di ekor.

### Bot buru (sebelum / sesudah)

| Bos | Kesulitan | Di depan (%) | Di ekor (%) | Runtun ekor terlama (detik) | Sentuhan per menit | Jendela rentan | Di luar layar (%) | Kalah pada detik |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Penjaga Raksasa | mudah | 34,9 / 54,7 | 14,3 / 17,1 | 2,7 / 1,48 | 0,8 / 0 | 5 | 55,7 / 37,6 | 143 / 34 |
| Penjaga Raksasa | normal | 33,9 / 54,6 | 14 / 5,2 | 2,88 / 1,28 | 0,7 / 0 | 6 | 57,3 / 37 | tidak / 68 |
| Penjaga Raksasa | sulit | 32,5 / 35,2 | 10 / 7,5 | 2,68 / 1,53 | 0,7 / 0 | 14 | 52,6 / 47,1 | tidak / 148 |
| Penambang Raksasa | mudah | 41,9 / 57,9 | 21,6 / 7,3 | 2,73 / 2,38 | 5,5 / 0,8 | 9 | 51,5 / 33,1 | 141 / 152 |
| Penambang Raksasa | normal | 49,5 / 46,1 | 19,6 / 11,6 | 3,17 / 1,6 | 6,3 / 0 | 20 | 44,5 / 45,9 | 114 / tidak |
| Penambang Raksasa | sulit | 44,7 / 44,2 | 19,9 / 8,9 | 4,05 / 1,68 | 5,7 / 0,7 | 24 | 48,7 / 41,1 | 169 / tidak |
| Pemburu Agung | mudah | 100 / 68,4 | 0 / 1,2 | 0 / 1,77 | 0 / 0 | 10 | 0 / 22,2 | 77 / tidak |
| Pemburu Agung | normal | 100 / 48,7 | 0 / 8,7 | 0 / 2,13 | 0 / 0 | 16 | 0 / 42,3 | 102 / tidak |
| Pemburu Agung | sulit | 100 / 37,7 | 0 / 1,6 | 0 / 1,12 | 0 / 0 | 17 | 0 / 49,8 | 129 / tidak |
| Sang Naga Vanta | mudah | 44,2 / 56,5 | 20,3 / 4,3 | 3 / 1,7 | 10,3 / 0 | 8 | 47,3 / 29,5 | tidak / tidak |
| Sang Naga Vanta | normal | 45 / 36,4 | 20,2 / 7,1 | 3 / 2,2 | 9,7 / 0,3 | 15 | 47,7 / 44,8 | tidak / tidak |
| Sang Naga Vanta | sulit | 42,8 / 33,6 | 23 / 1,2 | 3 / 1,02 | 9,7 / 1 | 14 | 50,6 / 53,8 | tidak / tidak |

"Tidak" artinya bos belum kalah dalam 180 detik.

## Catatan jujur

- **Sentuhan badan bos hampir hilang.** Penambang turun dari 5,5 sampai 6,3 menjadi 0 sampai 0,8 sentuhan
  per menit, Naga dari 9,7 sampai 10,3 menjadi 0 sampai 1. Dalam permainan biasa setiap sentuhan adalah
  tabrakan fatal.
- **Waktu sampai kalah naik untuk Pemburu Agung dan Penambang dengan bot buru.** Sebelumnya Pemburu Agung
  mengorbit pelan sehingga bot bisa menempel di ekornya 100 persen waktu pada jarak sekitar 84 dan menembak
  terus. Itu terlalu mudah dan bukan pola yang dilihat pemain manusia. Sekarang bot sederhana ini (tanpa
  memanfaatkan jendela rentan dan tanpa titik bidik prediksi) menghabiskan sekitar separuh HP dalam 3 menit
  di Normal: Pemburu tersisa 44 persen di fase 2, Penambang 54 persen, Naga 54 persen di fase 1. Penjaga
  Raksasa justru kini kalah di ketiga kesulitan (34, 68, dan 148 detik). Pemain manusia mendapat bantuan yang
  tidak dipakai bot: penanda, titik bidik prediksi, dan jendela rentan berkedip emas. Bila pertarungan terasa
  terlalu lama, `vulnMul`, `vuln`, dan `lead` di `BOSS_PILOT` bisa dinaikkan tanpa menyentuh HP bos.
- Persentase bot buru di kerucut depan lebih bergantung pada bot itu sendiri (ia selalu berbelok ke bos),
  karena itu sasaran kesulitan diukur dengan bot jelajah.

## Kesiapan bos: bot terampil dan durasi pertarungan (D2, 2.3.1)

Bot jelajah dan bot buru tidak mewakili pemain sungguhan. Karena itu ada bot baru (`debug.skilledBot`, hanya
lewat `?debug=1`) yang memakai batasan kapal yang sama dengan pemain: input pitch dan yaw, laju putar, nitro,
cooldown manuver, dan jarak tembak. Perilakunya:

- membidik titik bidik prediksi dengan tundaan reaksi (posisi sasaran yang dilihat adalah posisi beberapa
  frame lalu) dan galat bidik acak yang berubah tiap 0,4 detik;
- menembak hanya saat sasaran di kerucut bidik;
- mengabaikan umpan tiruan (pemain membedakannya lewat kontur);
- mengejar dengan nitro saat jauh atau saat jendela rentan;
- menghindari serangan beraba-aba dengan gulung tong;
- memakai Balik Arah bila bos lama di belakang;
- menjauh dari badan bos agar tidak menabrak.

Bot menerima kerusakan sungguhan, tanpa mode kebal. Tabrakan keras dicatat dalam mode latihan agar
pertarungan berlanjut.

| Profil | Reaksi | Galat bidik | Kerucut tembak | Peluang menghindar |
| --- | --- | --- | --- | --- |
| terampil | 250 ms | 1 derajat | 7 derajat | 85 persen |
| rata-rata | 450 ms | 2,6 derajat | 9 derajat | 35 persen |

Skrip: `node tests/bos/ttk.mjs <label>`. Tiap bos di area stage-nya, Mudah, Normal, Sulit, 5 seed (arah
awal dan galat bidik berbeda), batas 300 detik (Naga 600 detik dengan 3 seed). Data:
`docs/bos/data/ttk-sebelum.json`, `ttk-sesudah.json`, `ttk-sesudah-naga.json`.

### Penyetelan (hanya parameter perilaku; HP bos, damage, dan hadiah tidak berubah)

| Parameter | Sebelum | Sesudah | Alasan |
| --- | --- | --- | --- |
| Jarak mode depan Sulit | 270 | 240 | Pertarungan Sulit terlalu lama |
| Jarak mode depan per bos (`leadMul`) | 1 untuk semua (naga 1,35) | Penjaga 0,9, Penambang 0,8, Pemburu 0,6, Naga 1,1 (fase 2: 0,75) | Pemburu kecil dan cepat: dari jarak 230 hampir tidak pernah ada di kerucut bidik |
| Kecepatan di mode depan (`leadSpeed`) | sama dengan pemain | Pemburu 0,9, Naga 0,9 | Pemain bisa merapat dengan sengaja |
| Liukan mode depan Pemburu (`weave`) | 1 | 0,45 | Liukan lebar membuat Pemburu jarang di kerucut bidik |
| Jendela rentan Naga (`vulnTime`) | 1 | 1,6 kali | Titik lemah Naga kecil |
| Naga fase 1 | 30 di atas pemain | 45 di bawah dan 70 ke samping | Generator di punggung tertutup segmen ekor bila dilihat dari belakang |
| Naga fase 2 | kepala searah gerak | kepala menghadap pemain di mode depan | Titik lemah ada di mulut |

### Waktu sampai bos kalah (detik, median dengan rentang; sebelum lalu sesudah)

Bot terampil (target awal: Mudah 60 sampai 100, Normal 90 sampai 150, Sulit 120 sampai 200, Naga sekitar dua
kali lipat). Kolom setelah "sesudah" adalah nilai sesudah: kerusakan diterima (HP), kematian, jendela rentan
terpakai, persen waktu di depan, dan runtun ekor terlama (detik).

| Bos | Kesulitan | Sebelum | Sesudah | Kerusakan | Mati | Rentan terpakai | Di depan | Ekor terlama |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Penjaga Raksasa | mudah | 93 (51 sampai 114) | 53 (32 sampai 79) | 24 | 0 | 2,8 | 91 | 0 |
| Penjaga Raksasa | normal | 103 (60 sampai 190) | 93 (56 sampai 107) | 54 | 0,2 | 5,2 | 65 | 1,5 |
| Penjaga Raksasa | sulit | 227 (139 sampai 257) | 175 (113 sampai 273) | 239 | 2 | 8 | 53 | 2,27 |
| Penambang Raksasa | mudah | 113 (97 sampai 134) | 102 (91 sampai 114) | 203 | 1,6 | 3,6 | 70 | 1,37 |
| Penambang Raksasa | normal | 168 (114 sampai 191) | 133 (106 sampai 139) | 253 | 2,2 | 7 | 67 | 2,07 |
| Penambang Raksasa | sulit | 225 (200 sampai 264) | 233 (178 sampai 246) | 413 | 3,6 | 14,2 | 55 | 2,52 |
| Pemburu Agung | mudah | 258 (225 sampai 284) | 36 (36 sampai 57) | 88 | 0,2 | 2 | 84 | 1,02 |
| Pemburu Agung | normal | tidak kalah dalam 300 | 110 (90 sampai 154) | 227 | 1,6 | 8,2 | 52 | 1,72 |
| Pemburu Agung | sulit | tidak kalah dalam 300 | 257 (229 sampai 295), 20 persen tidak kalah | 520 | 4,6 | 15,8 | 41 | 1,97 |
| Sang Naga Vanta | mudah | tidak kalah | tidak kalah dalam 600 | 525 | 5 | 3,7 | 56 | 1,33 |
| Sang Naga Vanta | normal | tidak kalah | tidak kalah dalam 600 | 575 | 5 | 17,3 | 48 | 1,53 |
| Sang Naga Vanta | sulit | tidak kalah | tidak kalah dalam 600 | 662 | 5,7 | 10,7 | 35 | 1,52 |

Bot rata-rata (perkiraan pemain biasa):

| Bos | Kesulitan | Sebelum | Sesudah | Kerusakan | Mati |
| --- | --- | --- | --- | --- | --- |
| Penjaga Raksasa | mudah | 114, 20 persen tidak kalah | 111 (93 sampai 196) | 29 | 0 |
| Penjaga Raksasa | normal | 223 | 193 (141 sampai 203) | 179 | 1,6 |
| Penjaga Raksasa | sulit | 272, 40 persen tidak kalah | tidak kalah dalam 300 | 452 | 4 |
| Penambang Raksasa | mudah | 181 | 158 (139 sampai 166) | 303 | 2,6 |
| Penambang Raksasa | normal | 220 | 176 (155 sampai 229) | 375 | 3,2 |
| Penambang Raksasa | sulit | 292, 60 persen tidak kalah | tidak kalah dalam 300 | 466 | 4 |
| Pemburu Agung | mudah | 252 | 64 (56 sampai 68) | 135 | 1 |
| Pemburu Agung | normal | tidak kalah | 215 (164 sampai 276) | 415 | 3,8 |
| Pemburu Agung | sulit | tidak kalah | tidak kalah dalam 300 | 603 | 5,6 |

### Penilaian jujur

- **Normal:** ketiga bos reguler masuk target bot terampil (93, 133, 110 detik). Bot rata-rata 1,6 sampai 2
  kali lebih lama (176 sampai 215 detik), sesuai perkiraan 1,5 sampai 2,5 kali untuk manusia, dan di bawah
  batas 6 menit.
- **Mudah:** lebih cepat dari target untuk Penjaga (53) dan Pemburu (36). Ini sengaja dibiarkan, karena Mudah
  yang terlalu cepat lebih aman daripada Normal yang terlalu lama.
- **Sulit:** Penambang (233) dan Pemburu (257) di atas target 200 detik untuk bot terampil. Bot rata-rata
  tidak mengalahkan Penjaga, Penambang, dan Pemburu dalam 300 detik. Ini perlu disetel lagi setelah pemilik
  mencoba sendiri (calon: `vuln` dan `lead` Sulit).
- **Bot tetap terancam:** bot terampil menerima 24 sampai 662 HP kerusakan dan mati 0 sampai 5,7 kali per
  pertarungan, jadi bos tetap berbahaya.
- **Batas ekor dipatuhi:** runtun di ekor terlama 2,85 detik, jauh di bawah batas 4, 6, dan 9 detik.
- **Sang Naga Vanta tidak kalah oleh kedua bot dalam 600 detik** di semua kesulitan, dan juga tidak sebelum
  perubahan. Bot tertahan di fase 1: generator perisai di punggung berukuran bola radius 3. Pada jarak sekitar
  170, itu kira-kira 1 derajat, sehingga 873 peluru dalam 240 detik hanya 16 yang kena. Mengubah perilaku
  terbang (posisi di samping, di bawah, lebih dekat, lebih lambat) tidak cukup. Yang dibutuhkan adalah
  keputusan desain di luar batas prompt ini, misalnya generator lebih besar dan lebih terang, atau sudut tembak
  ke generator yang lebih bebas. Rekomendasinya ada di ringkasan rilis. Naga belum diuji oleh manusia.

## Telemetri lokal pertarungan bos (D2)

Sepuluh pertarungan bos terakhir disimpan di perangkat (`raptor13.bosslog.v1`, divalidasi, tanpa data pribadi,
tanpa jaringan): bos, kesulitan, durasi, HP hilang, jendela rentan terpakai, hasil (menang, kalah, batal), dan
tanggal. Data ini ikut dalam berkas UNDUH LOG pada overlay `?diag=1` (bagian `pertarunganBos`), sehingga
pemilik bisa melaporkan rasa bertarung dengan angka. Simulasi uji tidak dicatat.
