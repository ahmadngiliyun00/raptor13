# Kotak hitam berkedip di menu utama (A7)

Gejala dari pemilik: di menu utama, saat kapal attract bergerak, muncul kotak hitam yang tampak sesaat lalu
hilang dan berulang. Perangkat pemilik: MacBook Pro M1 Pro (layar ProMotion 120 Hz) dan HP.

## Ringkasan jujur

- Kotak hitam **tidak berhasil direproduksi** di mesin uji, baik di Chromium headless (GPU asli lewat
  ANGLE Metal) maupun di jendela Chromium sungguhan pada layar ProMotion yang sama, pada kode sebelum
  perbaikan. Semua frame yang ditandai detektor sudah diperiksa mata dan semuanya positif palsu (objek
  gelap kecil yang bergerak di atas latar terang: batu cincin, asteroid, celah Cassini, badan kapal).
- Karena itu akar masalah ditetapkan dari bukti kode dan pengukuran, bukan dari tangkapan gejala. Dua
  penyebab paling mungkin, keduanya terbukti ada di kode lama dan keduanya sudah diperbaiki:
  1. **GPU jenuh di layar 120 Hz.** Menu lama butuh 9,1 ms GPU per frame pada 2,93 MP (baseline A1) dan
     merender setiap refresh, jadi meminta sekitar 110 persen kapasitas GPU M1 Pro terus-menerus. Saat GPU
     tidak sempat, compositor Chrome di macOS menampilkan tile lapisan DOM yang belum selesai dirasterisasi
     sebagai kotak kosong (gelap) sesaat. Menu memiliki lapisan DOM besar di atas kanvas (judul dengan
     filter drop-shadow, dan `#flare` layar penuh dengan `mix-blend-mode: screen` yang transformnya ditulis
     tiap frame) yang memperbesar kerja compositor.
  2. **Sumber NaN untuk bloom.** Uji langsung di GPU M1 Pro (ANGLE Metal) membuktikan `atan(0, 0)`
     menghasilkan NaN. Shader black hole (terlihat dari area Saturnus, latar menu) dan galaksi memanggil
     `atan` tanpa penjaga. Satu piksel NaN yang masuk ke UnrealBloomPass (target HalfFloat) disebar oleh
     rantai mip dan blur menjadi blok persegi hitam berukuran 2, 4, 8, 16, 32 piksel yang muncul dan hilang
     mengikuti gerak kamera, persis gejala "kotak hitam berkedip saat kapal bergerak".
- Setelah perbaikan: GPU menu 1,5 ms per frame pada 20 FPS (sekitar 3 persen GPU), shader terjaga dari
  NaN, lapisan DOM layar penuh tanpa mode campur, satu fungsi resize, pra-pemanasan, konteks WebGL pulih.
  Alat diagnosis `?diag=1` disediakan agar pemilik bisa memastikan di perangkat aslinya.

## 1. Reproduksi dan rekam

| Percobaan | Alat | Hasil |
| --- | --- | --- |
| Menu, 300 frame per konfigurasi, 568x320, 844x390, 1440x900, 2560x1440, DPR 1, 2, 3 (12 konfigurasi), kode sebelum perbaikan | `tests/perf/glitch.mjs` dengan `debug.glitchProbe` (baca kembali kanvas tiap frame, deteksi blok hampir hitam yang terang di frame sebelum dan sesudahnya, komponen terhubung minimal 4 sel berbentuk blok) | 38 dari 3643 frame ditandai (10,4 per 1000), semuanya positif palsu setelah diperiksa; piksel NaN 0 di 360 pindaian; objek bermatriks non-finite 0; konteks hilang 0 |
| Menu 300 frame, 1512x860 DPR 2 dan 844x390 DPR 3, 60 Hz | `tests/perf/screencast.mjs` (CDP screencast: keluaran compositor termasuk lapisan DOM) | 0 frame dengan blok hitam |
| Menu 300 frame tanpa batas frame (GPU dijenuhkan) | screencast | 60 frame ditandai, semuanya gerakan besar antar tangkapan (screencast melewatkan frame), bukan kotak hitam |
| Menu 401 frame di jendela Chromium sungguhan pada layar ProMotion 120 Hz, kode sebelum perbaikan | screencast `--headed` | 1 frame ditandai: celah Cassini cincin yang bergeser (positif palsu) |
| Uji fungsi GPU | shader uji 1x1 RGBA32F di ANGLE Metal M1 Pro dan SwiftShader | M1 Pro: `atan(0, 0)` = NaN, `pow(negatif, 2.0)` aman; SwiftShader: `normalize(vec3(0))` = NaN |

Catatan keterbatasan: screencast menangkap keluaran compositor Chrome sebelum diserahkan ke CoreAnimation
macOS, jadi tile yang hilang di tahap akhir sistem operasi tidak selalu tertangkap. Inilah alasan
diagnosis di perangkat asli (`?diag=1`) tetap dibutuhkan untuk konfirmasi.

Momen yang diperiksa: pergantian kamera attract, kompilasi shader (frame pertama menu), perubahan ukuran,
perubahan kualitas, pergantian kapal di hangar. Tidak ada korelasi yang terlihat karena tidak ada kotak
hitam sungguhan yang tertangkap.

## 2. Dugaan satu per satu

| Dugaan | Bukti dari kode atau uji | Status |
| --- | --- | --- |
| a. Render target tidak sinkron | `EffectComposer.setSize` menimpa ukuran bloom sehingga skala 0,5 yang dimaksud hilang; resize renderer, composer, bloom, dan titik bintang tersebar | Diperbaiki: satu fungsi `onResize` menyinkronkan kanvas, pixel ratio (batas perangkat, batas 2 MP, skala dinamis), kamera, composer, bloom (setengah resolusi di bawah Tinggi), dan ukuran titik. Tidak ada render target yang dibuat ulang per frame; tidak ada pass yang membaca tekstur yang sedang ditulis |
| b. NaN atau Infinity | `atan(0, 0)` NaN di GPU Apple (terbukti); `pow` dengan basis yang bisa sedikit negatif karena galat pembulatan di shader perisai, rim planet, Matahari; `dt` bisa NaN bila jam melompat | Diperbaiki: penjaga `rd > 1e-5` sebelum `atan`, `clamp` basis `pow`, `dt` ditolak bila bukan angka. Pindai NaN gambar scene (target float) dan matriks objek: 0 sebelum dan sesudah |
| c. Kompilasi shader dan unggah tekstur saat berjalan | material dan tekstur kanvas planet diunggah pertama kali saat terlihat; pass bloom dibuat pada frame bloom pertama | Diperbaiki: layar muat dengan kemajuan nyata, `renderer.compile` untuk semua material (termasuk objek tersembunyi), `initTexture` untuk semua tekstur, satu render penuh termasuk bloom di balik layar muat (sekitar 0,8 detik total di M1) |
| d. Tekstur kanvas | tekstur kanvas dibuat sekali, tidak diperbarui di tengah render; WebGL2 mendukung mipmap NPOT; ukuran maksimum 1024 di bawah batas perangkat | Tidak bermasalah |
| e. Pengurutan transparan dan kedalaman | near 0,5 dan far 10000 (rasio 20.000, aman untuk depth 24 bit); langit `depthWrite: false`; langit kini dipanggang ke cubemap latar sehingga tidak ada bola langit transparan yang bertumpuk | Tidak bermasalah; risiko berkurang |
| f. Bayangan | kamera bayangan bergeser pecahan texel setiap frame (tepi bayangan berenang dan berkedip) | Diperbaiki: pusat kamera bayangan dibulatkan ke kisi texel |
| g. Konteks WebGL | tidak ada penanganan `webglcontextlost` | Diperbaiki: jeda, status "Grafis sedang dipulihkan", pulih otomatis, langit dipanggang ulang (diuji dengan `WEBGL_lose_context`) |
| h. Beban GPU berlebihan | 9,1 ms per frame x 120 Hz di menu lama | Diperbaiki lewat A2: menu 20 FPS, langit terpanggang, batas 2 MP, bloom setengah resolusi, resolusi dinamis |
| i. Lapisan DOM | `elementsFromPoint` pada area yang ditandai: kanvas dan layar judul saja; `#flare` layar penuh dengan `mix-blend-mode: screen` di atas kanvas | Diperbaiki: `#flare` tanpa mode campur dan dengan `contain: strict` |
| j. Tile compositor | `backdrop-filter` hanya di layar jeda (statis) dan kartu Pengaturan; di menu tidak ada | Layar statis kini tidak dirender ulang, sehingga blur di atasnya tidak dihitung ulang tiap frame |
| k. Model kapal di hangar | hangar memakai kanvas dan konteks WebGL sendiri; model dibuat sekali lalu di-cache | Tidak memengaruhi kanvas utama; kanvas utama kini statis saat hangar terbuka (satu konteks yang merender) |
| l. Jeda rAF panjang | `dt` di-clamp 0,05 detik | Ditambah: `lastTime` dan irama pacer di-reset saat tab kembali, resolusi dinamis mengabaikan 2 detik pemanasan |

## 3. Isolasi dengan eliminasi

Karena kotak hitam sungguhan tidak muncul di mesin uji, eliminasi tidak bisa menunjukkan fitur mana yang
"menghilangkan" gejala. Eliminasi tetap dijalankan untuk mengukur kontribusi beban GPU tiap fitur, yang
menjadi dasar penyebab 1 (`docs/audit/data/gpu-baseline.json`, tanpa batas frame, DPR 2):

| Dimatikan | Menu: frame turun (ms) |
| --- | --- |
| tidak ada (semua aktif) | 10,33 |
| bloom | 2,04 |
| nebula | 5,90 |
| Bima Sakti | 4,30 |
| galaksi | 2,36 |
| black hole | 1,51 |
| bintang | 3,44 |
| planet | 1,34 |
| bayangan | 2,61 |
| partikel | 1,24 |
| animasi dan blur CSS | 2,06 |
| semua fitur 3D di atas | 8,98 (sisa 1,35 ms) |
| audio | tidak memengaruhi GPU (utas audio terpisah) |

Setelah perbaikan seluruh menu hanya 1,5 ms per frame (`docs/audit/data/gpu-a2.json`).

## 4. Alat diagnosis untuk perangkat asli

- `index.html?diag=1`: overlay kecil di kanan berisi jumlah frame diperiksa, frame dengan blok hitam,
  piksel NaN terakhir dan jumlah pindaian ber-NaN, objek non-finite, status konteks WebGL (hilang dan pulih),
  ukuran kanvas, pixel ratio, ukuran target composer, ukuran mip bloom pertama, state, dunia, kualitas.
  Tombol **UNDUH LOG** menyimpan `raptor13-diagnosis.json` (versi, browser, layar, log konteks, ukuran
  target render, `debug.perf()`, dan sampai 200 kejadian dengan waktu, posisi, ukuran, state, kualitas, DPR).
- `index.html?debug=1` lalu `__game.debug.glitchProbe('start')`, `...('report')`, `...('nan')`.

Cara pemilik merekam: buka `https://raptor13.ngiliyun.my.id/?diag=1` di browser yang bermasalah, biarkan
menu berjalan 1 sampai 2 menit, lalu tekan UNDUH LOG. Bila kotak hitam terlihat di layar tetapi angka
"blok hitam" di overlay tetap 0, kotak itu berasal dari compositor atau sistem operasi (penyebab 1), bukan
dari gambar WebGL. Bila angka naik bersamaan dengan "pindaian ber-NaN", penyebabnya NaN di shader.

## 5. Pengujian sebelum dan sesudah (frame ditandai per 1000)

Detektor yang sama dipasang di kode lama (worktree `8be2a94`) dan kode baru. Menu baru berjalan 20 FPS,
sehingga gerakan antar frame tiga kali lebih besar dan derau detektor naik (kolom terakhir); untuk
perbandingan yang adil menu baru juga diukur pada 60 FPS lewat `debug.fpsOverride(60)`.

| Ukuran | DPR | Sebelum (60 FPS) | Sesudah (60 FPS) | Sesudah (menu 20 FPS) | Pindaian NaN (sebelum, sesudah) |
| --- | --- | --- | --- | --- | --- |
| 568x320 | 1 | 0/302 (0) | 1/301 (3,3) | 19/301 (63,1) | 0, 0 |
| 568x320 | 2 | 2/302 (6,6) | 3/300 (10) | 19/302 (62,9) | 0, 0 |
| 568x320 | 3 | 1/302 (3,3) | 2/300 (6,7) | 31/301 (103) | 0, 0 |
| 844x390 | 1 | 5/303 (16,5) | 2/300 (6,7) | 21/301 (69,8) | 0, 0 |
| 844x390 | 2 | 4/304 (13,2) | 5/300 (16,7) | 22/301 (73,1) | 0, 0 |
| 844x390 | 3 | 4/304 (13,2) | 6/315 (19) | 26/301 (86,4) | 0, 0 |
| 1440x900 | 1 | 0/304 (0) | 0/301 (0) | 28/302 (92,7) | 0, 0 |
| 1440x900 | 2 | 2/309 (6,5) | 0/302 (0) | 25/302 (82,8) | 0, 0 |
| 1440x900 | 3 | 2/308 (6,5) | 0/301 (0) | 18/301 (59,8) | 0, 0 |
| 2560x1440 | 1 | 3/314 (9,6) | 1/303 (3,3) | 22/301 (73,1) | 0, 0 |
| 2560x1440 | 2 | 11/307 (35,8) | 0/301 (0) | 18/302 (59,6) | 0, 0 |
| 2560x1440 | 3 | 4/304 (13,2) | 1/303 (3,3) | 30/301 (99,7) | 0, 0 |
| Total | | 38/3643 (10,4) | 21/3607 (5,8) | 279/3616 (77,2) | 0, 0 |

Semua frame yang ditandai di ketiga kolom sudah diperiksa dari cuplikan (sebelum, bermasalah, sesudah)
dan merupakan objek gelap kecil yang bergerak, bukan blok hitam. Tidak ada `webglcontextlost`, tidak ada
objek non-finite, dan tidak ada galat atau peringatan console di seluruh konfigurasi. Transisi menu ke
permainan, ganti kapal di hangar, ganti medan, dan ganti mode performa saat berjalan dicakup uji
`tests/audit.spec.mjs` dan `tests/game.spec.mjs` (console wajib bersih, termasuk pelanggaran CSP).

## Risiko tersisa

Akar masalah belum terkonfirmasi di perangkat pemilik. Bila gejala masih muncul setelah pembaruan,
log dari `?diag=1` akan menunjukkan apakah sumbernya gambar WebGL (NaN, target render) atau compositor.
Langkah sementara yang aman bagi pemain: Pengaturan, Mode performa Hemat baterai, atau matikan Bloom.
