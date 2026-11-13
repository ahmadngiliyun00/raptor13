# Hasil perbaikan performa dan panas (A2)

Perangkat dan metode sama dengan `baseline.md`: MacBook Pro M1 Pro, Chromium dengan GPU asli lewat ANGLE
Metal, viewport 1512x860 CSS, kualitas Sedang, pengaturan bawaan (Mode performa Otomatis), baterai
penguji diabaikan (`debug.ignoreBattery`). Data mentah: `docs/audit/data/akhir.json`,
`akhir-rendah.json`, `gpu-akhir.json`, `alloc-akhir.json`, `leak-a2.json`.

## Akar masalah panas dan hasilnya

Penyebab utama: loop merender tanpa batas di layar ProMotion 120 Hz, dan di menu serta angkasa setiap
frame menghitung shader fbm langit untuk seluruh layar pada 2,93 MP dengan bloom resolusi penuh. GPU M1
Pro diminta sekitar 1,1 sampai 1,3 detik kerja per detik di menu, artinya jenuh terus.

| Ukuran | Sebelum | Sesudah | Perubahan |
| --- | --- | --- | --- |
| Render per detik di menu, layar 120 Hz atau lebih (tanpa batas frame) | 104 (DPR 2), 231 (DPR 1) | 20 | turun 81 sampai 91 persen |
| Render per detik saat bermain, layar 120 Hz atau lebih | 91 sampai 468 | 60 | dibatasi |
| Kerja GPU per frame di menu (tanpa batas, DPR 2) | 10,33 ms | 1,88 ms | turun 82 persen |
| Kerja GPU per frame di angkasa ramai | 9,86 ms | 2,58 ms | turun 74 persen |
| Kerja GPU per detik di menu, layar 120 Hz | sekitar 1.240 ms (jenuh) | sekitar 38 ms | turun 97 persen |
| Kerja GPU per detik di angkasa, layar 120 Hz | sekitar 1.180 ms (jenuh) | sekitar 155 ms | turun 87 persen |
| Ukuran buffer render (DPR 2 dan 3, Sedang) | 2268x1290 (2,93 MP) | 1874x1066 (2,00 MP) | turun 32 persen piksel |
| Bloom | resolusi penuh (skala 0,5 tertimpa) | setengah resolusi di bawah Tinggi | sesuai rancangan |
| Saat jeda, peta, kartu, Pengaturan, Hangar | dirender ulang 60 sampai 120 kali per detik | 1 render lalu diam | hampir nol |
| Tab tersembunyi atau jendela tidak fokus di menu | rAF berhenti, tetapi AudioContext tetap berjalan dan menu tetap merender saat hanya tidak fokus | render dan audio berhenti | berhenti |

## Tabel lengkap 60 Hz, DPR 2, 60 detik

| Skenario | Render per detik | Kerja JS per frame (ms) | Skrip ms per detik | Draw call | Buffer (MP) | GC minor per menit | Alokasi per frame (KB) | Layout paksa per detik | Heap akhir (MB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Menu sebelum | 60,1 | 1,97 | 119,9 | 72 | 2,93 | 79 | 40 | 0 | 11,3 |
| Menu sesudah | 20,0 | 2,80 | 59,8 | 68 | 2,00 | 53 | 56 | 0 | 13,2 |
| Bumi sebelum | 59,9 | 2,41 | 121,7 | 100 | 2,93 | 135 | 72 | 97 | 11,7 |
| Bumi sesudah | 60,0 | 2,23 | 136,1 | 92 | 2,00 | 131 | 75 | 24 | 14,7 |
| Angkasa sebelum | 60,0 | 2,15 | 110,3 | 105 | 2,93 | 137 | 79 | 116 | 12,2 |
| Angkasa sesudah | 60,0 | 1,88 | 113,7 | 116 | 2,00 | 126 | 80 | 26 | 14,4 |

Catatan jujur:

- Kerja JS per frame di menu naik (1,97 ke 2,80 ms) karena tiap frame menu kini mencakup simulasi tiga kali
  lebih panjang dan setiap pemanggilan render menunggu GPU; total skrip per detik turun separuh.
- Skrip per detik di Bumi naik sedikit (121,7 ke 136,1 ms). Selisih ini sekitar 0,25 ms per frame dan berada
  di dalam variasi antar run (Bumi DPR 1 dan 3 baseline 114 sampai 119 ms per detik, sesudah 123 sampai
  140). Kontributor yang terukur: pacer, overlay, tutorial, dan resolusi dinamis per frame.
- Draw call angkasa 105 ke 116 bervariasi antar run karena jumlah musuh dan batu sabuk di layar berbeda;
  langit terpanggang sendiri mengurangi 6 draw call (nebula, Bima Sakti, empat galaksi menjadi satu latar).
- Heap akhir sedikit lebih tinggi karena cubemap langit dan modul baru; tidak bertambah seiring waktu
  (lihat kebocoran).

## Matriks DPR dan tanpa batas frame (15 detik)

| Skenario | DPR | Tanpa batas | Render per detik | Buffer (MP) | Bloom |
| --- | --- | --- | --- | --- | --- |
| Menu | 1 | tidak | 20,1 | 1,30 | ya |
| Menu | 3 | tidak | 20,1 | 2,00 | ya |
| Menu | 2 dan 1 | ya | 20,1 dan 20,0 | 2,00 dan 1,30 | ya |
| Bumi | 1 dan 3 | tidak | 60,1 | 1,30 dan 2,00 | - |
| Bumi | 2 dan 1 | ya | 60,2 dan 60,0 | 2,00 dan 1,30 | - |
| Angkasa | 1 dan 3 | tidak | 60,1 dan 60,2 | 1,30 dan 2,00 | ya |
| Angkasa | 2 dan 1 | ya | 60,3 dan 60,2 | 2,00 dan 1,30 | ya |

Sebelum perbaikan, baris "tanpa batas" merender 91 sampai 468 kali per detik.

## Kualitas Rendah (20 detik, DPR 2)

| Skenario | Render per detik | Draw call | Buffer (MP) | Kerja JS (ms) |
| --- | --- | --- | --- | --- |
| Menu | 20,0 | 44 | 1,30 | 3,00 |
| Bumi | 60,1 | 63 | 1,30 | 1,95 |
| Angkasa | 60,1 | 83 | 1,30 | 1,80 |

## Target terukur

| Target | Hasil | Status |
| --- | --- | --- |
| Kerja CPU JS di bawah 6 ms rata-rata, angkasa Sedang | 1,88 ms | Tercapai |
| Draw call di bawah 150 di Sedang | 92 sampai 116 (maksimum rata-rata run 127) | Tercapai |
| Draw call di bawah 80 di Rendah | menu 44, Bumi 63, angkasa 83 | Hampir: angkasa ramai 3 di atas target (bagian model musuh adalah mesh terpisah) |
| Tidak ada alokasi berulang berarti, GC minor jarang | 56 sampai 80 KB per frame, 53 GC minor per menit di menu dan 126 sampai 131 saat bermain (sekitar 2 per detik, masing-masing di bawah 1 ms) | Tidak tercapai sepenuhnya: 25 sampai 35 KB per frame berasal dari jalur unggah uniform Three.js dan sisanya dari angka yang dikotakkan di AI dan tabrakan. Alokasi game yang jelas (closure radar, string penanda tepi, kunci peringatan, closure dorong planet) sudah dihapus. GC per detik di menu turun karena frame lebih jarang |
| Memori tidak tumbuh lebih dari 5 persen setelah 5 menit | rendam 7,5 menit: geometri datar di 192 sejak gelombang 8, heap 13,24 MB (menit 5) ke 13,03 MB (menit 7,5), turun 1,6 persen. Dari awal rendam sampai menit 5 heap naik 8 persen mengikuti jumlah musuh hidup (3 ke 45) | Tercapai untuk keadaan tunak; kenaikan awal adalah isi gelombang, bukan kebocoran |
| Menu memakai CPU dan GPU sangat rendah | 20 FPS, skrip 60 ms per detik (6 persen satu inti), GPU sekitar 38 ms per detik | Tercapai |

## Kebocoran (20 kali restart, 20 kali ganti stage, rendam 5 menit)

| Metrik | Restart sebelum | Restart sesudah | Stage sebelum | Stage sesudah |
| --- | --- | --- | --- | --- |
| Objek scene | 1182 | 1182 | 1182 | 1182 |
| Tekstur | 59 | 59 | 59 | 59 |
| Listener Events | 72 | 72 | 72 | 72 |
| Timer aktif | 0 | 0 | 0 | 0 |
| Heap (MB) | 10,70 | 11,20 | 11,52 | 11,75 |

Geometri dan program naik hanya saat jenis musuh atau bos baru pertama kali tampil, lalu datar.

## Perbaikan per butir

| Butir | Perbaikan | Bukti |
| --- | --- | --- |
| 1 Batas FPS | Pacer berbasis akumulator, 60 bawaan, 30, 60, tanpa batas; 45 dan 30 di perangkat sentuh saat Otomatis turun tingkat | render per detik tepat 60 dan 20 di semua baris tanpa batas; simulasi pacer: 60,0 render per detik di layar 60, 90, 120, 144 Hz |
| 2 Resolusi dinamis | skala 1,0 sampai 0,6, turun 0,1 setelah dua jendela lambat, naik 0,05 setelah 5 detik lancar, tunggu naik berlipat bila langsung lambat lagi; batas 1,5 desktop (opsi 1, 1,5, 2), 1,25 sentuh, 2 MP di Rendah dan Sedang | uji `A2: mode performa ...` (pola 90 Hz tidak dianggap lambat, frame 40 ms menurunkan skala lalu tingkat) |
| 3 Mode performa | Otomatis, Hemat baterai, Seimbang, Kualitas tinggi; baterai lemah dan `prefers-reduced-motion` dideteksi; toast sekali | uji yang sama |
| 4 Berhenti merender | statis di layar diam, menu 20 FPS, audio berhenti saat tersembunyi atau tidak fokus | uji `A2: batas FPS ...`, `A2: tab tersembunyi ...`, `A2: jendela kehilangan fokus ...` |
| 5 Draw call dan beban | langit terpanggang, bloom setengah resolusi, bayangan mati di Hemat, partikel 50 persen di Hemat dan tingkat 2; peluru, partikel, bintang, batu, awan sudah instanced atau Points dan ber-pool sejak awal | pemecahan GPU |
| 6 DOM dan CSS | HUD angka 10 kali per detik, radar 15 kali per detik tanpa baca layout, lens flare tanpa mode campur, blur hanya di layar statis | layout paksa 97 sampai 116 menjadi 23 sampai 26 per detik |
| 7 Audio | sumber selesai diputus, anggaran 32 suara efek (10 di Hemat), tembakan musuh jauh dilewati di Hemat, AudioContext di-suspend saat jeda, tersembunyi, bisu | `audioState` suspended di uji |
| 8 Kebocoran | diukur, tidak ada | tabel di atas |
| 9 Overlay | `debug.perf()` dan overlay F3 | uji F3 |
| 11 Cara mengukur | `docs/audit/cara-mengukur.md` | - |
