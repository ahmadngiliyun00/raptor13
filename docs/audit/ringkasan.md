# Ringkasan audit blok A (versi 2.2.0)

Audit performa dan panas, keamanan, UI/UX, dan kotak hitam di menu, 13 November 2026, pada MacBook Pro M1
Pro dengan Chromium (GPU asli lewat ANGLE Metal). Rincian: `baseline.md`, `performa.md`, `keamanan.md`,
`ui-ux.md`, `glitch-kotak-hitam.md`, `dependencies.md`, `cara-mengukur.md`.

## Angka sebelum dan sesudah

| Ukuran | Sebelum | Sesudah |
| --- | --- | --- |
| Render per detik menu di layar 120 Hz atau lebih | 104 sampai 231 | 20 |
| Render per detik saat bermain di layar 120 Hz atau lebih | 91 sampai 468 | 60 |
| GPU per frame menu, DPR 2 | 10,33 ms | 1,88 ms |
| GPU per frame angkasa ramai, DPR 2 | 9,86 ms | 2,58 ms |
| GPU per detik menu di 120 Hz | sekitar 1.240 ms (jenuh) | sekitar 38 ms |
| Piksel render, DPR 2 dan 3, Sedang | 2,93 MP | 2,00 MP |
| Kerja JS per frame angkasa Sedang | 2,15 ms | 1,88 ms |
| Skrip per detik menu | 120 ms | 60 ms |
| Layout paksa per detik saat bermain | 97 sampai 116 | 23 sampai 26 |
| Draw call Sedang (menu, Bumi, angkasa) | 72, 100, 105 | 68, 92, 116 |
| Draw call Rendah (menu, Bumi, angkasa) | tidak diukur | 44, 63, 83 |
| Alokasi per frame (menu, Bumi, angkasa) | 40, 72, 79 KB | 56, 75, 80 KB |
| GC minor per menit (menu, Bumi, angkasa) | 79, 135, 137 | 53, 131, 126 |
| Layar statis (jeda, peta, Pengaturan) | dirender ulang terus | 1 render |
| Heap setelah 20 restart | +4 persen | +4,7 persen (10,70 ke 11,20 MB), objek, tekstur, listener, timer tetap |
| Heap rendam menit 5 ke 7,5 | tidak diukur | turun 1,6 persen |
| Frame dengan blok hitam per 1000 (menu, 12 konfigurasi, detektor sama, 60 FPS) | 10,4 (semua positif palsu) | 5,8 (semua positif palsu) |
| Piksel NaN di gambar scene | 0 dari 360 pindaian | 0 dari 360 pindaian |
| Metrik bot (tailRatio, collisionsPerMin, ramsPerMin, kill, skor, gelombang) 6 seed | lihat `data/metrics-sebelum.json` | identik sampai digit terakhir (`data/metrics-sesudah.json`) |
| Uji otomatis | 128 | 141 lolos |

## Semua temuan

| ID | Area | Temuan | Keparahan | Status |
| --- | --- | --- | --- | --- |
| P1 | Performa | Loop tanpa batas FPS di layar 120 Hz | Tinggi | Diperbaiki |
| P2 | Performa | Langit fbm per piksel tiap frame (60 persen GPU menu) | Tinggi | Diperbaiki (cubemap) |
| P3 | Performa | Tanpa batas megapiksel, bloom resolusi penuh karena skala tertimpa | Tinggi | Diperbaiki |
| P4 | Performa | Menu dan layar statis merender penuh terus | Sedang | Diperbaiki |
| P5 | Performa | Peta bayangan tiap frame dengan 32 sampai 89 pemancar | Sedang | Sebagian: mati di Hemat dan tingkat 2; kamera bayangan per texel |
| P6 | Performa | Layout paksa radar tiap frame | Sedang | Diperbaiki |
| P7 | Performa | Alokasi 40 sampai 80 KB per frame | Rendah | Sebagian: alokasi game yang jelas dihapus, sisanya internal Three.js dan angka dikotakkan |
| P8 | Performa | AudioContext berjalan saat menu tidak fokus dan tab tersembunyi | Rendah | Diperbaiki |
| P9 | Performa | Three.js tidak diminifikasi (2,13 MB) | Rendah | Terbuka: berkas resmi ditanam apa adanya (sekitar 420 KB gzip), minifikasi butuh alat yang tidak diizinkan di lingkungan kerja |
| P10 | Performa | Resolusi dinamis memakai median salah di layar 90 Hz (ditemukan saat ukur akhir) | Sedang | Diperbaiki, dijaga uji |
| K1 sampai K15 | Keamanan | lihat `keamanan.md` (CDN tanpa SRI, tanpa CSP, hook terbuka, validasi simpanan, prototipe, innerHTML, parameter URL, kegagalan penyimpanan, WebGL, header server, gitignore, rahasia, privasi) | Tinggi sampai Info | Semua diperbaiki atau didokumentasikan; header server harus dipasang manual |
| U1 sampai U21 | UI/UX | lihat `ui-ux.md` (tutorial, kontras, ukuran teks, kurangi gerakan, buta warna, fokus, tekan, haptik, gulir, wake lock, tutup, layar muat, transisi, audio diblokir, simpanan rusak, WebGL, tata letak tab, Tentang, layar besar, ultrawide, tutorial HP) | Tinggi sampai Rendah | U20 diterima, U21 sebagian, sisanya diperbaiki |
| G1 | Glitch | Kotak hitam di menu: NaN `atan(0, 0)` ke bloom, GPU jenuh, lapisan mode campur, resize terpisah, tanpa pra-pemanasan, bayangan berenang, konteks tidak dipulihkan | Tinggi | Penyebab yang terbukti ada di kode diperbaiki; gejala belum terkonfirmasi hilang di perangkat pemilik (tidak bisa direproduksi di mesin uji) |

## Pengujian dan regresi

- `npx playwright test`: 97 uji gameplay, 31 uji mode HP, 13 uji audit, semuanya lolos, console wajib
  bersih termasuk pelanggaran CSP, tanpa permintaan keluar.
- Uji audit baru: hook terkunci tanpa `?debug=1`, parameter query berbahaya, localStorage rusak dan
  dimanipulasi, CSP dan integrity mutakhir, konteks WebGL hilang dan pulih, batas FPS dan layar statis, mode
  performa dan resolusi dinamis (termasuk pola 90 Hz), tab tersembunyi dan F3, jendela tidak fokus,
  tutorial, aksesibilitas dan anti gulir, resize, satu nomor versi.
- Kebocoran 20 kali restart dan 20 kali ganti stage serta rendam 5 menit: `tests/perf/leak.mjs`; uji lama
  kebocoran dinaikkan dari 10 ke 20 restart.
- Regresi gameplay: `tests/perf/metrics.mjs` pada worktree sebelum audit dan sesudah memberi metrik bot,
  kill, skor, dan gelombang yang identik untuk 3 seed di tiap medan.
- Uji notifikasi H9 yang sesekali gagal (kapal tanpa kendali melayang dekat permukaan) distabilkan dengan
  memindahkan kapal ke titik aman sebelum memeriksa antrean.
