# Senjata bertingkat berbasis hardpoint (E5)

Senjata dasar menembak dari dua laras. Senjata bisa ditingkatkan sampai empat tembakan per interval. Setiap
peluru keluar dari ujung laras yang terlihat di model kapal. Semua angka di dokumen ini hasil ukur
`tests/senjata.spec.mjs` (14 November 2026, Chromium dengan GPU Metal). Data mentahnya:

- `docs/senjata/hasil-hardpoint.json`
- `docs/senjata/hasil-dps.json`

## Tingkat dan pola tembak

| Tingkat | Laras aktif | Pola | Voli per interval dasar | Pengali damage per peluru | Peluru per interval | DPS nominal |
|---|---|---|---|---|---|---|
| 1 | pasangan dasar | bergantian kiri dan kanan | 1 | 1,0 | 1 | 1,0 kali |
| 2 | pasangan dasar | serempak | 1 | 0,9 | 2 | 1,8 kali |
| 3 | pasangan dasar dan pasangan tambahan | pasangan bergantian, laju dua kali | 2 | 0,8 | 4 | 3,2 kali |

Interval dasar tetap `CONFIG.weapons.fireInterval` (0,10 detik). Pengali buff dan kartu (Overdrive, Pemicu Cepat,
Laras Panas) berlaku seperti sebelumnya. Seluruh tabel tingkat ada di `CONFIG.guns.tiers`.

Alasan memilih pola ini:

- Tingkat 1 sama persis dengan senjata lama: satu peluru tiap 0,1 detik, bergantian.
- Tingkat 2 terasa lebih berat karena dua peluru keluar bersamaan.
- Tingkat 3 berirama: pasangan atas lalu pasangan bawah, masing-masing tiap 0,05 detik. Tembakan terdengar dan
  terlihat lebih rapat tanpa ledakan empat peluru sekaligus.
- Angka 1,8 dan 3,2 diatur lewat damage per peluru (0,9 dan 0,8), bukan lewat HP musuh atau bos.

## Hardpoint per kapal

Posisi adalah ujung laras di ruang model, dalam satuan dunia, dengan arah tembak -z (maju). Data ada di
`SHIPS[id].hardpoints`. Kapal angkasa memakai titik pasang ujung sayap (`UL`, `UR`, `LL`, `LR`) yang dihitung
dari bentuk sayap. Laras sayap ikut bergerak bersama sayap dinamis (merapat saat nitro, puntir saat belok).

| Kapal | Tingkat 1 dan 2 | Tambahan tingkat 3 | Posisi terukur (ujung laras) |
|---|---|---|---|
| Raptor-J (Bumi) | dua pod di bawah sayap | dua meriam di akar sayap, di bawah strake | pod (plus minus 1,5, -0,27, -1,0), meriam (plus minus 0,9, -0,15, -2,0) |
| Starfighter | ujung sayap kiri atas dan kanan atas | ujung sayap kiri bawah dan kanan bawah | (plus minus 3,14, plus minus 1,71, -0,2) |
| Interceptor | ujung sayap atas | ujung sayap bawah | (plus minus 3,0, plus minus 1,2, 0,61) |
| Gunship | dua laras berat di sisi bawah badan | ujung sayap kiri atas dan kanan atas | badan (plus minus 0,82, -0,17, -2,6), sayap (plus minus 2,72, 1,86, -0,7) |

Catatan bentuk:

- **Raptor-J.** Moncong lama di (plus minus 1,25, -0,12, -1,2) berada di udara, di depan tepi depan sayap. Sekarang
  diganti pod bergantungan di bawah sayap. Untuk tingkat 3 dipilih akar sayap, bukan hidung. Di bawah strake ada ruang
  datar di samping intake, sedangkan hidung jet terlalu ramping untuk dua meriam.
- **Gunship.** Laras berat di badan dipertahankan sebagai senjata dasar, sesuai identitasnya sebagai kapal berat.
  Tingkat 3 menambah sayap atas, sehingga totalnya tetap empat laras.

## Visual

- Laras aktif terlihat. Laras yang belum terbuka disembunyikan saat bermain dan tampil redup di hangar.
- Saat tingkat naik, laras baru memanjang dari pangkal dalam 0,45 detik (ease out), dengan cincin ujung yang
  menyala lalu mendingin.
- Setiap tembakan menghasilkan:
  - kilat moncong additive sekitar 0,06 detik;
  - recoil 0,1 satuan yang pulih dalam sekitar 0,08 detik;
  - percikan partikel kecil di ujung laras.
- Perbaikan bug lama: percikan partikel dulu tidak tampil di laras. `BulletPool.spawn` menimpa vektor sementara
  `_va`, sehingga event `shot` mengirim posisi yang salah. Sekarang asal dan arah peluru disimpan di vektor khusus
  (`_gunPos`, `_gunDir`).
- Laras ditandai `userData.gun`. `visualRadius` mengabaikannya, sehingga ambang tabrakan fatal (D4) dan jarak
  aman Piko tidak berubah.

## Arah dan konvergensi

- Semua laras menembak ke titik temu di depan hidung pada `CONFIG.weapons.convergeDistance` = 120 satuan. Angka ini
  boleh disetel antara 80 dan 150; nilai sebelumnya 160. Reticle tetap diproyeksikan dari titik yang sama.
- Ada penyebaran kecil deterministik (`CONFIG.guns.spread` = 0,0035 radian, pola Lissajous dari hitungan
  tembakan). Penyebaran ini tidak memakai RNG permainan, jadi simulasi berseed tetap dapat diulang.
- Hasil uji untuk 4 kapal dan 3 tingkat:
  - perkalian titik arah peluru dengan arah hidung minimal 0,9994;
  - jarak terdekat lintasan peluru ke titik temu paling besar 0,59 satuan (batas uji 0,73);
  - asal peluru menyimpang dari ujung laras paling besar 0,011 satuan.

## DPS efektif

**Cara ukur.** Peluru sungguhan direkam selama 2,5 detik sambil menahan tembak. Setiap peluru dihitung kena bila
lintasannya melewati bola sasaran di depan hidung. Ada dua ukuran sasaran:

- drone: radius 2,6 ditambah padding kena 0,9;
- sasaran kecil seperti rudal: radius 0,6 ditambah 0,9.

Angka di tabel adalah "pengali damage per detik", yaitu jumlah kena dikali pengali tingkat per detik. Kalikan
dengan damage kapal untuk mendapat DPS: Starfighter 10, Gunship 14. Bantuan bidik dimatikan dalam hitungan
geometris ini. Di permainan, bantuan bidik melengkungkan peluru ke sasaran di dalam kerucutnya.

| Kapal, tingkat | Nominal | Drone 40 | Drone 120 | Drone 200 | Kecil 40 | Kecil 80 | Kecil 120 | Kecil 160 | Kecil 200 |
|---|---|---|---|---|---|---|---|---|---|
| Starfighter 1 | 10,4 | 10,4 | 10,4 | 10,4 | 0 | 9,6 | 10,4 | 6,8 | 0 |
| Starfighter 2 | 18,9 (1,82 kali) | 18,9 | 18,9 | 18,9 | 0 | 17,4 | 18,9 | 12,5 | 0 |
| Starfighter 3 | 32,7 (3,14 kali) | 32,7 | 32,7 | 32,7 | 0 | 30,4 | 32,7 | 21,2 | 0,3 |
| Gunship 1 | 10,4 | 10,4 | 10,4 | 10,4 | 10,4 | 10,4 | 10,4 | 10,4 | 10,4 |
| Gunship 2 | 18,8 (1,80 kali) | 18,8 | 18,8 | 18,8 | 18,8 | 18,8 | 18,8 | 18,8 | 18,8 |
| Gunship 3 | 32,7 (3,14 kali) | 32,7 | 32,7 | 32,7 | 16,3 | 32,7 | 32,7 | 29,4 | 17,6 |

**Kesimpulan:**

- Terhadap drone dan sasaran yang lebih besar, semua laras kena pada semua jarak uji. Rasio efektif sama dengan
  target tabel: 1,8 dan 3,14. Angka 3,14, bukan 3,2, berasal dari pembulatan interval 0,05 detik ke frame 60 FPS.
- Terhadap sasaran kecil, laras ujung sayap hanya kena di sekitar titik temu (kira-kira 80 sampai 160 satuan).
  Inilah harga senjata di ujung sayap: tembakan menyatu di depan, tidak sejajar.
- Laras badan Gunship tetap kena pada semua jarak.

**Batas yang jujur.** Dibanding moncong lama Starfighter di plus minus 0,75, senjata tingkat 1 kini lebih sering
meleset terhadap sasaran kecil yang sangat dekat atau jauh. Hasil bot `equipBot` 60 detik dengan 5 seed:

| Kapal | Rata-rata kill sekarang | Sebelum E3 | Sebaran sekarang |
|---|---|---|---|
| Gunship berperalatan | 4,4 | 4,0 | 2 sampai 7 per seed |
| Starfighter tanpa peralatan | 3,0 | 4,2 | 2 sampai 5 per seed |

Sebarannya besar, jadi selisih ini belum pasti bermakna. E9 menilai ulang TTK bos dengan bot dan hanya menyetel
BOSS_PILOT atau syarat perolehan bila keluar target.

## Perolehan

Tingkat disimpan per kapal di `Save.data.guns`. Semua syarat ada di `CONFIG.guns`.

| Jalur | Syarat | Hasil |
|---|---|---|
| Kartu level "Peningkatan Senjata" (epik, selalu di kartu pertama selama syarat terpenuhi) | ke tingkat 2: naik ke level 5 | tingkat 2 untuk kapal yang dipakai |
| Kartu level, angkasa | ke tingkat 3: naik ke level 10 dan stage kampanye 5 sudah terbuka (atau kampanye tamat) | tingkat 3 |
| Kartu level, Bumi | ke tingkat 3: naik ke level 12 | tingkat 3 |
| Hadiah stage | selesai stage 3 | minimal tingkat 2 |
| Hadiah stage | selesai stage 7 | minimal tingkat 3 |
| Hadiah kontrak | tiap 4 kontrak selesai (hitungan bersama peralatan) | naik satu tingkat, paling tinggi tingkat 2 |

**Alasan syarat.** Tingkat 2 mudah dicapai karena kenaikannya sedang. Tingkat 3 dikunci di paruh kedua kampanye
agar stage awal tidak menjadi sepele: DPS 3,2 kali akan memotong TTK bos stage 2 dan 4 terlalu jauh.

**Simpanan.**

- Field `guns` baru ditambahkan tanpa menaikkan versi skema.
- Simpanan lama tanpa field ini mulai dari tingkat 1.
- Nilai di luar 1 sampai 3, tipe yang salah, dan id kapal asing dibuang oleh `Save.sanitize`. Uji: "E5 simpanan".
- `gunHint` mencatat bahwa Piko sudah memberi saran.

## Suara

- `Sfx.shoot(n)` dipanggil sekali per voli dan menyusun n lapisan nada.
- Gain tiap lapisan dikali 1 per akar n, sehingga energi total voli tetap.
- Ada variasi pitch kecil, siklus 5 langkah 1,2 persen ditambah 3 persen per lapisan.
- Paling banyak 8 suara tembak berbunyi bersamaan (`CONFIG.guns.voiceCap`).
- Getaran (haptic) juga hanya sekali per voli.

## HUD, hangar, dan Piko

- **Mode HP.** Empat titik kecil di dalam tombol Tembak. Titik yang menyala sama dengan jumlah peluru per interval:
  1, 2, atau 4. Titik berada di dalam kotak tombol, jadi asersi tata letak tidak berubah.
- **Desktop.** Titik yang sama di baris LEVEL pada panel kiri bawah.
- **Hangar.** Baris "Senjata T1, T2, atau T3" di daftar statistik. Model pratinjau menampilkan laras aktif dengan
  cincin ujung menyala, dan laras terkunci tampil redup. Screenshot ada di `docs/screenshots/senjata/`.
- **Piko.** Piko memberi satu kali saran ketika kartu Peningkatan Senjata akan muncul di level berikutnya
  (`gunReady`). Tanda sudah memberi saran tersimpan.

## Performa

Skenario terburuk: tingkat 3, Overdrive, empat kali Pemicu Cepat, dan 10 drone.

- Peluru aktif terbanyak: 96, di bawah anggaran 128 (`maxPlayerBullets`, naik dari 80).
- Waktu kerja p95: 1,6 ms. Sebagai pembanding, tingkat 1 tanpa buff 1,5 ms.
- Draw call tambahan dari laras tingkat 3, tanpa musuh: paling banyak 6 (dua laras ditambah cincin ujung).
- Peluru tetap satu InstancedMesh.
- Animasi laras berjalan tanpa alokasi per frame.
- Kebocoran: 20 kali restart pada tingkat 3. Jumlah objek scene, anak scene, dan listener sama persis, dan geometri
  bertambah paling banyak 6.

## Hook debug (hanya dengan `?debug=1`)

- `debug.setGunTier(n)` menyetel tingkat kapal aktif (1 sampai 3) dengan animasi laras.
- `debug.gunInfo()` mengembalikan:
  - tingkat dan pola;
  - urutan voli;
  - titik temu;
  - tiap hardpoint, dengan posisi lokal, posisi dunia, aktif, dan terlihat.
- `debug.gunTrace('start')` mulai merekam, lalu `debug.gunTrace('stop')` mengembalikan rekaman asal peluru. Isi
  tiap baris: waktu, asal, arah, indeks laras, posisi dan kuaternion kapal, terlihat, dan tingkat.
