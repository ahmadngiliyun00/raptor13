# Catatan perubahan

Semua perubahan penting RAPTOR13 dicatat di berkas ini. Format mengikuti
[Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan penomoran mengikuti
[Semantic Versioning](https://semver.org/lang/id/). Tanggal diambil dari riwayat git (WIB, UTC+7).
Bukti pemilihan commit tiap tag ada di `docs/rilis/rencana-tag.md`.

## [2.2.0] - 2026-11-13

Audit performa, panas, keamanan, dan UI/UX. Gameplay, keseimbangan, AI musuh, dan isi konten tidak
berubah (metrik bot, skor, dan gelombang identik dengan 2.1.0 pada seed yang sama).

### Performa
- Batas FPS berbasis akumulator: layar 120 Hz tidak lagi merender dua kali lebih sering. Bawaan 60 FPS saat
  bermain, 20 FPS di menu, opsi 30, 60, atau tanpa batas.
- Layar statis (jeda, peta, kartu level dan kontrak, game over, Pengaturan, Hangar, menu dengan sesi
  dijeda, jendela tidak fokus di menu) tidak merender ulang dunia.
- Langit angkasa (nebula, Bima Sakti, galaksi) dipanggang sekali ke cubemap, bukan dihitung fbm per piksel
  tiap frame. GPU menu turun dari 10,3 ms menjadi sekitar 1,5 ms per frame.
- Batas pixel ratio per perangkat dan maksimum 2 juta piksel di kualitas Rendah dan Sedang, resolusi
  dinamis 1,0 sampai 0,6 dengan histeresis, bloom setengah resolusi di bawah Tinggi (sebelumnya skala yang
  dimaksud tertimpa dan bloom berjalan penuh).
- Mode performa Otomatis, Hemat baterai, Seimbang, Kualitas tinggi; Otomatis menurunkan satu tingkat
  kualitas bila tetap lambat dan berperilaku hemat saat baterai lemah.
- Radar 15 kali per detik dan instrumen 20 kali per detik tanpa membaca layout tiap frame (layout paksa
  turun dari sekitar 100 menjadi 23 per detik), angka HUD maksimal 10 kali per detik, penanda tepi tanpa
  string baru tiap frame.
- AudioContext berhenti saat tab tersembunyi, jendela tidak fokus di menu, jeda, dan bisu; sumber suara
  selesai diputus dari graf; anggaran suara efek.

### Ditambahkan
- Overlay performa (F3 atau Pengaturan) dan hook `debug.perf()`.
- Tutorial kontekstual pertama kali main (keyboard dan sentuh), bisa dilewati dan diulang.
- Getar (haptik) di mode HP, opsi Ukuran teks, Kurangi gerakan, Mode buta warna, tab Pengaturan Akses.
- Layar muat dengan kemajuan nyata dan pra-pemanasan shader serta tekstur.
- Overlay diagnosis `?diag=1` dengan unduh log JSON.
- Screen Wake Lock saat bermain, peringatan sebelum menutup saat sesi berjalan, tombol buka suara bila
  browser menahan audio, pesan bila simpanan rusak, peringatan kilatan sekali.
- Skrip pengukuran `tests/perf/` dan uji audit `tests/audit.spec.mjs`.
- `CHANGELOG.md`, dokumen audit di `docs/audit/`, panduan header server di `docs/deploy/`.

### Diubah
- Satu konstanta `GAME_VERSION` untuk menu, Tentang, dan overlay performa.
- Kontras teks HUD memenuhi WCAG AA di atas latar terang; HUD dan kartu membesar otomatis di layar desktop
  besar; transisi maksimal 0,4 detik.
- Batas FPS dan Resolusi maksimum di tab Lainnya, aksesibilitas di tab Akses.

### Diperbaiki
- Kotak hitam berkedip di menu: penjaga NaN `atan(0, 0)` di shader black hole dan galaksi (NaN di GPU Apple
  yang disebar bloom menjadi blok hitam), lens flare tanpa `mix-blend-mode`, beban GPU menu yang membuat
  GPU jenuh di 120 Hz, satu fungsi resize untuk kanvas, composer, dan bloom, kamera bayangan dibulatkan ke
  kisi texel, pra-pemanasan sebelum menu tampil.
- Konteks WebGL yang hilang kini dijeda dan dipulihkan otomatis.
- Ringkasan LANJUTKAN tidak crash bila data sesi rusak.

### Keamanan
- Three.js 0.187.0 ditanam lokal di `vendor/three-0.187.0/` dengan integrity sha384 di importmap; tidak ada
  permintaan ke CDN atau pihak ketiga.
- Content Security Policy ketat berbasis hash (`default-src 'none'`, tanpa `unsafe-inline` dan
  `unsafe-eval`), dijaga `tests/csp.mjs`.
- Hook uji `window.__game`, pratinjau model, dan galeri hanya aktif dengan `?debug=1`.
- Validasi ketat simpanan profil dan sesi (rentang angka, kunci yang dikenal, `Object.hasOwn`), parameter
  URL dengan daftar nilai yang diizinkan, tanpa `innerHTML`.
- Pesan ramah tanpa WebGL2, pemberitahuan bila penyimpanan penuh atau diblokir.
- Kalimat privasi di Tentang (tanpa cookie, pelacak, atau analitik).

## [2.1.0] - 2026-11-13

### Ditambahkan
- Simpan dan muat sesi di perangkat (otomatis tiap 10 detik, saat jeda, ke menu, tab disembunyikan, dan
  tombol SIMPAN), LANJUTKAN di menu setelah halaman dimuat ulang.
- Meta SEO, Open Graph, kartu X, data terstruktur VideoGame, logo, favicon, `manifest.webmanifest`,
  canonical URL.
- Mode HP landscape (blok H): satuan ukuran dari tinggi tampak, jarak tepi safe area dan override
  `?safearea=`, joystick analog melayang, cluster aksi berskala dengan hit slop 44 px, opsi ukuran,
  transparansi, kidal, dan gaya tombol arah, HUD ringkas, pusat notifikasi tunggal berprioritas, kamera
  khusus HP, layar menu dan layar sela muat di landscape 320 px, deteksi HP otomatis, layar penuh dengan
  kunci landscape, petunjuk Tambahkan ke Layar Utama di iOS, overlay putar layar.

### Diperbaiki
- `willReadFrequently` pada kanvas sumber tekstur, Enter memakai kartu terpilih bila fokus hilang, bloom
  mati bawaan di perangkat sentuh.

## [2.0.0] - 2026-11-11

Generasi kedua: perombakan dari game Bumi menjadi petualangan Tata Surya.

### Ditambahkan
- Antarmuka dunia (EarthWorld dan SpaceWorld), layar Pilih Medan, angkasa sebagai medan bawaan.
- Registri kapal berbasis data, hangar Pilih Kapal dengan kredit, Starfighter bersayap empat dengan varian
  Interceptor dan Gunship.
- Model terbang quaternion bebas, manuver Gulung Tong, Balik Arah, dan Looping, tabrakan fatal dengan
  penyebab, AI musuh dengan siklus serang, senjata dan buff baru, awan volumetrik, audio mesin baru.
- Robot pendamping Piko, asteroid empat jenis dan komet, bintang pickup lima warna dan ultimate laser.
- Tata Surya (Matahari, delapan planet, Pluto, bulan), cincin dan sabuk asteroid, latar Bima Sakti,
  galaksi, black hole, batas jelajah, panel fakta dan atlas Penemuan.
- Kampanye Tata Surya 10 stage, Jelajah Bebas, peta Tata Surya dan warp, kontrak stage dan Stage Clear.
- Roster 15 jenis musuh Sindikat Vanta, cutscene, bos Penjaga Raksasa, Penambang Raksasa, Pemburu Agung,
  dan final boss Sang Naga Vanta empat fase.
- XP, level, kartu upgrade berkelangkaan, drone pendamping, radar dan instrumen terbang, musik ambient
  generatif, dialog pembuka stage, preset kualitas, kontrol HP berikon.

## [1.0.0] - 2026-11-11

Generasi pertama: game pesawat jet di atas Bumi.

### Ditambahkan
- Satu berkas `index.html` dengan Three.js, loop dengan delta time di-clamp, CONFIG terpusat.
- Jet Raptor-J prosedural (badan loft, sayap airfoil, kanopi, nozzle, tekstur panel, angka 13), kamera
  chase sinematik dan kamera menu.
- Dunia Bumi prosedural dengan medan yang didaur ulang, laut, langit, matahari, kabut, bayangan, awan,
  pilar rintangan.
- Peluru ber-pool, nitro, dua jenis musuh bergelombang, asteroid ber-HP yang pecah, cincin, pickup,
  partikel, angka damage.
- Nyawa per kesulitan dengan respawn, HP, HUD, layar judul attract, jeda berblur dengan hitung mundur
  3-2-1, game over dan skor tertinggi, layar Tentang (kredit).
- Pengaturan lengkap dan simpan lokal berversi dengan migrasi, mode HP sentuh awal, audio sintesis dengan
  bus per kategori, suite uji Playwright.

[2.2.0]: https://github.com/ahmadngiliyun00/raptor13/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/ahmadngiliyun00/raptor13/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/ahmadngiliyun00/raptor13/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ahmadngiliyun00/raptor13/releases/tag/v1.0.0
