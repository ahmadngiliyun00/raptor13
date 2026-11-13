# Audit UI/UX mobile dan desktop (A4)

Dasar: hasil blok H (H1 sampai H10, tata letak HP landscape) sudah ada di riwayat dan tetap dijaga
`tests/hp.spec.mjs`. Audit ini melanjutkan dengan daftar periksa 10 heuristik Nielsen dan WCAG 2.1 AA.

Screenshot sebelum (commit `b5eddf5`, sebelum blok A) dan sesudah ada di `docs/screenshots/audit/sebelum/`
dan `docs/screenshots/audit/sesudah/` untuk 568x320, 667x375, 844x390, 932x430 (HP, DPR 3, sentuh) dan
1440x900 (desktop): menu, pengaturan, tentang, gameplay, jeda, ditambah tab Akses di versi baru. Cek ulang
desktop besar di `docs/screenshots/audit/desktop/` (1280x720, 2560x1440, 3440x1440 ultrawide). Dibuat
dengan `node tests/perf/shots.mjs <label>`.

## Tabel temuan

| ID | Layar | Masalah | Heuristik atau kriteria | Keparahan | Bukti | Status |
| --- | --- | --- | --- | --- | --- | --- |
| U1 | Gameplay pertama | Pemain baru hanya melihat daftar tombol di layar judul (teks panjang, hanya keyboard); di HP tidak ada petunjuk kontekstual | N10 bantuan, N6 pengenalan | Tinggi | `sebelum/568x320-menu.jpg` | Diperbaiki: tutorial 4 langkah (gerak, tembak, nitro, manuver) yang maju saat pemain benar-benar melakukannya, maksimal 10 detik per langkah (selesai dalam sekitar 30 detik), teks per mode keyboard atau sentuh, LEWATI di desktop dan di menu jeda, ULANGI TUTORIAL di Pengaturan, Akses. Mode HP memakai pusat notifikasi sehingga anggaran tata letak H tetap terpenuhi |
| U2 | HUD di atas latar terang (awan Bumi, Saturnus) | Teks redup `#9fb0c2` di panel 55 persen: kontras terburuk 1,87 banding 1 di atas putih | WCAG 1.4.3 | Tinggi | perhitungan kontras di bawah | Diperbaiki: panel 80 persen, teks redup `#b4c3d2`, kontras terburuk 5,99 banding 1 (teks utama 9,23) |
| U3 | Semua layar | Ukuran teks tidak bisa dibesarkan | WCAG 1.4.4 | Sedang | - | Diperbaiki: Ukuran teks Normal, Besar, Sangat besar (kartu menu, layar sela, panel HUD desktop) |
| U4 | Gameplay | Kilatan layar penuh, getar kamera, animasi berkedip berulang tanpa opsi menyeluruh; tidak ada peringatan kilatan | WCAG 2.3.1, 2.2.2 | Tinggi | - | Diperbaiki: Kurangi gerakan (bawaan mengikuti `prefers-reduced-motion`): getar kamera mati, kilatan diredam ke 20 sampai 25 persen, animasi CSS berulang dan transisi seketika, menu attract diam. Peringatan kilatan sekali pada permainan pertama |
| U5 | Gameplay | Bintang merah (ultimate) dan hijau (HP) sulit dibedakan pada buta warna merah hijau | WCAG 1.4.1 | Sedang | - | Diperbaiki: Mode buta warna dengan palet Okabe-Ito (oranye, hijau kebiruan, biru langit, kuning, ungu kemerahan); label teks saat diambil (+HP, +NITRO) tetap ada. Hati dan HP sudah memakai ikon dan angka, peringatan memakai teks |
| U6 | Tombol menu dan pengaturan | Fokus keyboard terlihat hanya di sebagian elemen | WCAG 2.4.7 | Sedang | - | Diperbaiki: garis fokus putih untuk semua tombol, input, dan elemen ber-tabindex |
| U7 | Semua tombol | Tidak ada umpan balik tekan selain warna hover | N1 status sistem | Rendah | - | Diperbaiki: tombol mengecil sedikit saat ditekan |
| U8 | Gameplay HP | Tidak ada umpan balik sentuh | N1 | Sedang | - | Diperbaiki: getar singkat untuk tembak (maksimal tiap 160 ms), kena tembak, ledakan musuh, pickup, kapal hancur; opsi Getar |
| U9 | Gameplay HP | Gulir pantul, pull-to-refresh, menu tekan lama, sorot ketuk biru | N5 pencegahan galat | Sedang | - | Diperbaiki: `overscroll-behavior: none`, `-webkit-touch-callout: none`, `touch-action: none` di kanvas saat bermain, tanpa sorot ketuk |
| U10 | Gameplay HP | Layar bisa mati di tengah pertempuran | - | Sedang | - | Diperbaiki: Screen Wake Lock selama bermain, dilepas saat jeda, menu, atau tab tersembunyi |
| U11 | Gameplay | Menutup tab tanpa sengaja | N5 | Rendah | - | Diperbaiki: peringatan sebelum menutup saat sesi berjalan (sesi tetap disimpan otomatis) |
| U12 | Layar muat | Teks berkedip tanpa kemajuan | N1, WCAG 2.2.2 | Sedang | - | Diperbaiki: bilah kemajuan nyata dengan tahap (grafis, langit, dunia, antarmuka, shader, siap), tanpa kedip |
| U13 | Transisi | Pudar menu 0,8 detik, letterbox cutscene 0,45 detik | target 400 ms | Rendah | CSS | Diperbaiki: 0,4 detik |
| U14 | Audio | Bila browser menahan audio (iOS) tidak ada petunjuk | N1 | Sedang | - | Diperbaiki: tombol KETUK UNTUK MENYALAKAN SUARA muncul bila audio tertahan lebih dari 1 detik |
| U15 | Menu | Simpanan rusak diatur ulang diam-diam | N9 pemulihan galat | Rendah | - | Diperbaiki: pesan sekali di layar judul |
| U16 | Muat awal | Tanpa WebGL2 layar muat menggantung | N9 | Sedang | - | Diperbaiki (A3): kartu galat dengan langkah perbaikan |
| U17 | Pengaturan 568x320 | Opsi baru membuat tab Grafis perlu gulir | N8 minimalis | Rendah | uji H9 | Diperbaiki: Batas FPS dan Resolusi di tab Lainnya, aksesibilitas di tab baru Akses |
| U18 | Tentang 320 dan 360 px | Kalimat privasi membuat kartu perlu gulir | N8 | Rendah | uji H9 | Diperbaiki: teks dipadatkan |
| U19 | Desktop 2560x1440 dan 3440x1440 | Teks HUD 11 sampai 12 px terlalu kecil di layar besar | WCAG 1.4.4 | Sedang | `desktop/3440x1440-main.jpg` putaran 1 | Diperbaiki pada putaran 2: panel HUD dan kartu otomatis membesar di layar 2200x1200 ke atas. Putaran 2 juga menemukan reticle bergeser bila seluruh `#hud` di-zoom; diperbaiki dengan hanya men-zoom panel, elemen yang diposisikan JavaScript tidak ikut |
| U20 | Desktop ultrawide kualitas Sedang | Batas 2 MP membuat gambar 3D sedikit lebih lembut di 3440x1440 (pixel ratio 0,64) | konsekuensi A2 | Rendah | `desktop/3440x1440-main.jpg` | Diterima: pilih kualitas Tinggi atau Resolusi maksimum untuk ketajaman penuh |
| U21 | Gameplay HP | Tutorial di HP tampil lewat pusat notifikasi sehingga tidak bisa diketuk untuk dilewati | N3 kendali pengguna | Rendah | - | Sebagian: LEWATI TUTORIAL di menu jeda dan langkah maju otomatis maksimal 10 detik |

## Konsistensi

- Bahasa Indonesia baku dan konsisten untuk istilah utama: MULAI, LANJUTKAN, KEMBALI, Pengaturan, Jeda,
  Kualitas, Mode performa, Hemat baterai. Istilah game tetap (Nitro, Ultimate) dipakai seragam di HUD,
  Pengaturan, dan tutorial.
- Warna aksi: utama oranye (MULAI, KEMBALI di kartu, tab aktif), sekunder bergaris, bahaya (RESET DATA)
  merah, nonaktif redup dengan `cursor: not-allowed`.
- Semua layar overlay punya KEMBALI yang terlihat dan Esc di desktop; dialog konfirmasi berfokus awal di
  BATAL.

## Kontras (WCAG 1.4.3)

Panel HUD `rgba(8,14,22,0.8)`; kontras terburuk dihitung atas latar putih, krem Saturnus, biru abu, dan
gelap: teks utama `#e8eef5` 9,23 banding 1, teks redup `#b4c3d2` 5,99 banding 1, aksen oranye di atas panel
gelap 8,77 banding 1. Sebelumnya teks redup 1,87 banding 1 di atas putih.

## Desktop

| Ukuran atau kondisi | Hasil |
| --- | --- |
| 1280x720, 1440x900 | Menu, HUD, jeda, pengaturan rapi, tanpa tumpang tindih |
| 2560x1440, 3440x1440 | HUD dan kartu membesar otomatis, reticle tetap di titik konvergensi |
| Jendela diubah ukurannya saat bermain | Satu fungsi resize menyinkronkan kanvas, composer, bloom; diuji di `tests/audit.spec.mjs` (1600x900, 900x600, 1280x720: ukuran buffer dan target composer cocok, tanpa NaN) |
| Zoom browser 80 dan 150 persen | Dipotret sebagai viewport setara 1800x1125 dan 960x600 (`docs/screenshots/audit/zoom/`): menu, HUD, jeda muat; di 960x600 kartu Pengaturan memanjang dan bisa digulir. Catatan: skrip memakai emulasi sentuh untuk lebar di bawah 1000 px, sehingga 960x600 terekam dalam mode HP |
| Kontrol keyboard | Tidak berubah; F3 baru untuk overlay performa |

## Temuan yang masih terbuka

- U21 (tutorial di HP tidak bisa diketuk langsung) hanya dimitigasi.
- Belum diuji dengan pembaca layar sungguhan (VoiceOver, TalkBack). Label ARIA ada pada tombol ikon,
  toolbar, layar muat (`role="status"`, `progressbar`), galat (`role="alert"`), tetapi kanvas 3D tidak
  dapat diakses pembaca layar (keterbatasan wajar game aksi).
- Ukuran teks Sangat besar di layar HP 320 px membuat beberapa kartu perlu gulir; anggaran tata letak H
  hanya dijamin pada ukuran Normal.
