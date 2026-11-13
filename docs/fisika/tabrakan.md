# Tabrakan berbasis ukuran dan energi (B6)

Laporan pemilik: menabrak meteor, planet, atau daratan membuat pesawat hancur, dan itu memang disepakati.
Tetapi asteroid kecil yang melayang juga membuat pesawat langsung hancur. Seharusnya seperti bola basket
yang ditabrak helm: terasa dan mengurangi nyawa, tetapi tidak hancur.

## Yang ditemukan sebelum perubahan

- **Asteroid.** Hanya dua kelas. Radius minimal 18 fatal. Di bawahnya damage tetap per kelas, tanpa melihat
  ukuran sebenarnya atau kecepatan: kecil 10, sedang 20, besar 35. Batu cincin Saturnus berjari-jari 0,6
  (lebih kecil dari pesawat) juga memakan 10 HP. Batu sabuk dengan R 16 sampai 26 bisa tertaut menjadi
  asteroid kelas raksasa; yang 18 ke atas fatal.
- **Bulan tak beraturan.** Phobos (R 7) dan Deimos (R 5) tampak seperti asteroid kecil yang melayang, tetapi
  termasuk kelas bulan dan fatal. Bentuknya "lumpy": permukaan yang terlihat berada antara sekitar 0,65 dan
  1,4 kali radius, sedangkan bola tabrakannya tetap 1,0 kali radius. Akibatnya pesawat bisa hancur di lekukan
  permukaan sebelum menyentuh bentuk yang terlihat. Ini **tabrakan tak terlihat** dan kemungkinan besar
  salah satu sumber laporan "asteroid kecil yang menghancurkan pesawat".
- **Hitung ganda.** Satu-satunya pelindung adalah kebal tabrakan global 1 detik. Pecahan asteroid muncul di
  posisi pesawat dan bisa terhitung lagi setelah kebal habis bila pesawat masih di dalamnya.
- **Tembus.** Tidak ada uji sapuan. Uji jarak titik per frame aman pada kecepatan normal (1,2 sampai 2,1
  satuan per frame), tetapi frame yang lambat atau kecepatan sangat tinggi bisa melompati batu kecil.

## Model baru

Semua angka ada di `COLLISION_TIERS` (`index.html`) dan bisa diubah saat uji lewat
`debug.collisionConfig({ ... })`.

- **Radius.** Radius tabrakan sama dengan bentuk yang terlihat: 0,85 kali radius batu, 0,9 kali radius
  komet. Untuk Phobos dan Deimos, bola tabrakan memakai permukaan terdalam yang terlihat: R x (1 - lumpy x
  0,9), yaitu 4,8 untuk Phobos dan 3,65 untuk Deimos.
- **Massa relatif.** M = (R / R_pesawat)^3 x kepadatan, dengan pesawat = 1. R_pesawat adalah radius tabrakan
  pesawat (2,6 untuk Raptor dan Starfighter, 2,3 Interceptor, 3,0 Gunship). Kepadatan: batu 2,6, es 0,9,
  logam 5,0, kristal 2,3, komet 0,6.
- **Energi.** E = 0,5 x M x (v_relatif / 70)^2. Angka 70 adalah kecepatan dasar pemain, dan v_relatif adalah
  selisih vektor kecepatan pesawat dan benda.

| Tingkat | Syarat | Hasil |
| --- | --- | --- |
| FATAL | Kelas fatal: planet, bulan, Matahari, daratan, laut, gunung, pilar, bos, kapal berat (kapal induk, menara). Atau R minimal 6,9 x R_pesawat (sekitar 18). Atau E minimal 1500 | Pesawat hancur seperti sebelumnya (pesan penyebab sama) |
| SEDANG | R antara 0,75 dan 6,9 x R_pesawat dan E di bawah 1500 | clamp(6,2 x E^0,4, 2, 60) persen HP maksimum, dikali kesulitan. Kebal tabrakan 0,8 detik. Pesawat terdorong keluar dari benda, kecepatan turun 4 sampai 30 persen, hidung terdorong menjauh. Kamera bergetar kecil (mati bila Kurangi gerakan atau Getar kamera dimatikan). Benda pecah |
| PANTUL | R antara 0,3 dan 0,75 x R_pesawat | 1 sampai 3 persen HP maksimum, naik dengan E. Tanpa kebal global. Benda pecah, pesawat tidak terhenti |
| KECIL | R di bawah 0,3 x R_pesawat (sekitar 0,78) | Tanpa damage. Hanya percikan dan suara. Benda pecah |

Kesulitan hanya memengaruhi tingkat sedang dan pantul: Mudah x0,75, Normal x1,0, Sulit x1,25. Pengali
ini menggantikan pengali damage umum, bukan menambahnya. Tabrakan fatal tetap fatal di semua kesulitan.
Kartu Peredam tetap mengurangi damage tabrakan 40 persen.

**Kenapa ambang fatal 6,9 x R_pesawat, bukan 2 x seperti contoh di spesifikasi.** Dengan 2 x R_pesawat
(R 5,2), asteroid sedang (R 6) dan besar (R 11) di medan Bumi menjadi fatal. Padahal keduanya mencakup
52 persen asteroid yang muncul, jadi game akan jauh lebih sulit dan bertentangan dengan laporan pemilik.
Nilai 6,9 x R_pesawat sama dengan ambang asteroid raksasa yang sudah disepakati (R 18). Benda yang lebih
kecil tetap bisa fatal lewat energi: batu logam besar yang ditabrak pada kecepatan sangat tinggi.

**Kalibrasi.** Eksponen 0,4 dan a = 6,2 dipilih agar damage pada kecepatan dasar mendekati nilai lama untuk
ukuran standar Bumi:

| Ukuran | Lama | Baru |
| --- | --- | --- |
| Kecil (R 3) | 10 | 8 persen |
| Sedang (R 6) | 20 | 19 persen |
| Besar (R 11) | 35 | 39 persen |

Bedanya, sekarang damage ikut naik dengan kecepatan dan turun untuk benda yang jauh lebih kecil.
Eksponen 0,6 pada contoh spesifikasi membuat damage tumbuh sebanding R^1,8, sehingga asteroid sedang sudah
mencapai batas 60 persen.

## Umpan balik

- Kilat merah di sisi layar tempat dampak datang (kiri, kanan, atas, atau bawah) dengan angka persen damage.
  Pada tingkat pantul kilatnya lebih lembut.
- Bar HP (desktop dan mode HP) berkedip.
- Suara benturan yang beratnya sesuai ukuran (`Sfx.bump`).
- Percikan di titik dampak.
- Angka merah yang sudah ada di dekat pesawat dan vignette merah tetap berjalan.
- Teks tabrakan fatal tidak berubah.

## Hitung ganda dan tembus

- **Cooldown per benda.** Satu benda tidak dihitung ulang dalam 1 detik (`objectCooldown`). Pecahan dari
  benturan mewarisi waktu benturan induknya, jadi tidak terhitung sebagai benturan baru.
- **Uji sapuan.** Benturan diuji pada segmen gerak pesawat satu frame (dari posisi frame sebelumnya ke posisi
  sekarang) terhadap bola benda (`segmentHitsSphere`). Pesawat tidak bisa melompati batu kecil walau sangat
  cepat atau frame lambat.

## Tabel klasifikasi (`debug.collisionTest('tabel')`)

Persen HP maksimum pada kesulitan Normal. Kecepatan relatif dalam satuan per detik:

- rendah 40;
- dasar 70 (kecepatan dasar pemain);
- nitro 128;
- ekstrem 600 (misalnya pesawat bernitro menabrak benda yang melaju berlawanan).

| Benda | Rendah (40) | Dasar (70) | Nitro (128) | Ekstrem (600) |
| --- | --- | --- | --- | --- |
| kerikil es (R 0,6) | kecil, 0% | kecil, 0% | kecil, 0% | kecil, 0% |
| puing batu (R 1,5) | pantul, 1,11% | pantul, 1,33% | pantul, 2,11% | pantul, 3% |
| asteroid kecil (R 3) | sedang, 5,23% | sedang, 8,18% | sedang, 13,25% | sedang, 45,6% |
| asteroid sedang (R 6) | sedang, 12% | sedang, 18,78% | sedang, 30,44% | sedang, 60% |
| asteroid besar (R 11) | sedang, 24,85% | sedang, 38,88% | sedang, 60% | FATAL (energi) |
| asteroid logam besar (R 14) | sedang, 43,1% | sedang, 60% | sedang, 60% | FATAL (energi) |
| asteroid raksasa (R 18) | FATAL (ukuran) | FATAL (ukuran) | FATAL (ukuran) | FATAL (ukuran) |
| komet (R 6) | sedang, 6,68% | sedang, 10,45% | sedang, 16,93% | sedang, 58,28% |
| bulan Phobos | FATAL (kelas) | FATAL (kelas) | FATAL (kelas) | FATAL (kelas) |
| planet Mars | FATAL (kelas) | FATAL (kelas) | FATAL (kelas) | FATAL (kelas) |
| daratan atau air | FATAL (kelas) | FATAL (kelas) | FATAL (kelas) | FATAL (kelas) |
| bos | FATAL (kelas) | FATAL (kelas) | FATAL (kelas) | FATAL (kelas) |

Pada Mudah persen sedang dan pantul dikali 0,75, pada Sulit 1,25. Data lengkap (rasio, massa, energi)
ada di `docs/fisika/data-tabrakan.json`.

## Uji nyata lewat jalur permainan

`debug.collisionTest({ radius, kind }, kecepatan)` meletakkan batu diam tepat di jalur pesawat, mengunci
kecepatan pesawat, lalu menjalankan simulasi frame demi frame lewat `update()` yang sebenarnya. Mode latihan
dipakai sementara agar tabrakan fatal tercatat tanpa mengakhiri sesi. Pada mode latihan, damage benturan
fatal adalah 40 HP.

| R | Jenis | Kecepatan | Langkah per frame | Benturan tercatat | Tingkat | HP hilang | Fatal |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0,6 | es | 70 | 1,17 | 1 | kecil | 0% | tidak |
| 1,5 | batu | 70 | 1,17 | 1 | pantul | 1,33% | tidak |
| 3 | batu | 70 | 1,17 | 1 | sedang | 8,18% | tidak |
| 6 | batu | 70 | 1,17 | 1 | sedang | 18,78% | tidak |
| 11 | batu | 70 | 1,17 | 1 | sedang | 38,88% | tidak |
| 11 | batu | 128 | 2,13 | 1 | sedang | 60% | tidak |
| 14 | logam | 128 | 2,13 | 1 | sedang | 60% | tidak |
| 18 | batu | 70 | 1,17 | 1 | fatal | 40% (mode latihan) | ya |
| 0,6 | es | 2000 | 33,33 | 1 | kecil | 0% | tidak |
| 3 | batu | 2000 | 33,33 | 1 | fatal (energi 1630) | 40% (mode latihan) | ya |
| 6 | batu | 2000 | 33,33 | 1 | fatal | 40% (mode latihan) | ya |
| 18 | batu | 2000 | 33,33 | 1 | fatal | 40% (mode latihan) | ya |
| 0,6 | es | 6000 | 100 | 1 | kecil | 0% | tidak |

Semua kasus tercatat tepat satu benturan (tanpa hitung ganda). Kerikil R 0,6 tetap terdeteksi pada 100
satuan per frame (tanpa tembus).

## Dampak pada keseimbangan

Metrik bot A5 (`node tests/perf/metrics.mjs`, 120 detik, seed 4242, 7, 99, medan Bumi dan Angkasa) dibanding
hasil audit A5: **5 dari 6 kombinasi identik** (tailRatio, tabrakan, serudukan, kill, skor). Satu kombinasi
(Bumi, seed 7) menyimpang karena lintasan bot berubah setelah pantulan asteroid yang baru:

| Metrik | Sebelum | Sesudah | Ambang |
| --- | --- | --- | --- |
| Tabrakan per menit | 0 | 0,5 | 2 |
| Serudukan per menit | 0,5 | 1,5 | 6 |
| Kill | 24 | 17 | - |

Pesawat tetap bisa hancur oleh benturan besar: asteroid raksasa, bulan, planet, daratan, bos, dan batu besar
pada kecepatan sangat tinggi tetap fatal.

Yang tidak diubah sesuai aturan: perilaku peluru, damage senjata, HP musuh, dan damage sentuhan kapal musuh
(drone kamikaze 18, rudal 16, dan seterusnya; kapal berat tetap fatal).
