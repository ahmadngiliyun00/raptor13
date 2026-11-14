# Kontras UI adaptif (C1, 2.4.0)

Masalah dari pemilik: tombol mode HP transparan dan sulit terbaca karena kontrasnya ikut berubah dengan latar.
Di angkasa yang gelap tombol perlu lebih terang. Di Bumi dan di depan planet terang tombol perlu lebih gelap.

## Cara kerja

1. **Perkiraan kecerahan latar.** Kecerahan latar diperkirakan 2,5 kali per detik untuk tiga wilayah:
   kontrol kiri, kontrol kanan, dan pita HUD atas. Wilayah kiri dan kanan diambil dari kotak kontrol yang
   sebenarnya, jadi ikut tata letak, ukuran kontrol, dan mode kidal.
2. **Penghalusan dan histeresis.** Luma (sRGB terenkode, 0 sampai 1) dihaluskan dengan rata-rata bergerak.
   - Di bawah 0,25: latar gelap, pelat putih transparan.
   - Di atas 0,45: latar terang, pelat cokelat arang.
   - Di antaranya: mode sebelumnya dipertahankan, jadi tidak berkedip.

   Uji `C1: histeresis` menyuapkan luma 0,30 sampai 0,42 bergantian dan memastikan tidak ada pergantian mode.
3. **Penerapan.** Mode diterapkan lewat kelas `uic-gelap` dan `uic-terang` pada kelompok kontrol, dengan
   variabel CSS `--pl` (pelat), `--rg` (cincin), `--ik` (ikon), `--ol` (garis luar), dan pelat berwarna per
   tombol. Transisinya 400 ms.
4. **Cincin ganda.** Tiap tombol punya tepi terang di dalam dan garis luar gelap. Di latar apa pun, salah satu
   cincin kontras dengan latar.
5. **Transparansi.** Pengaturan Transparansi (tab Kontrol) kini hanya memudarkan pelat. Cincin dan ikon tetap
   pekat.
6. **Opsi Kontras UI** (Pengaturan, tab Akses):
   - **Otomatis** (bawaan);
   - **Selalu terang** (pelat putih);
   - **Selalu gelap** (pelat cokelat arang);
   - **Tinggi**: alpha pelat dan tebal tepi naik, garis luar 2 sampai 2,5 piksel.

   Nilai disimpan di localStorage dan divalidasi; nilai yang tidak dikenal jatuh ke Otomatis.
7. **Keadaan tekan** jelas di kedua mode: skala 0,94, kecerahan naik 18 persen, dan pelat oranye pekat.
   Tombol manuver yang sedang cooldown tampak pudar dengan tepi putus-putus.
8. **Pita HUD atas.**
   - Pelatnya pekat: 0,76 di latar terang dan 0,58 di latar gelap.
   - Teks putih di atas pelat 0,58, dengan latar paling terang (luma 0,92), berkontras sekitar 5,2 banding 1.
     Angka ini di atas syarat teks 4,5.

## Keputusan metode cuplik

Diukur di Mac Apple Silicon, Chrome, viewport 844x390:

| Metode | Biaya per cuplik | Catatan |
| --- | --- | --- |
| drawImage canvas game ke canvas 2D 24x14 | 2,2 ms (p90 4,0) | Hanya benar bila dipanggil di frame render yang sama; di luar itu hasilnya hitam |
| readPixels asinkron ke PBO dengan fenceSync | 0,4 sampai 0,8 ms (kirim 0,2, baca 0,4) | Di atas batas 0,3 ms; Chrome mencatat peringatan performa readback |
| Heuristik state game (metode utama) | di bawah 0,05 ms (uji: di bawah 0,1) | Tanpa akses GPU, canvas tidak tainted, tidak menyentuh CSP |

**Cara kerja heuristik.** Tiga sinar dikirim dari kamera per wilayah, dan nilai yang paling terang yang
dipakai.

- Di Bumi, sinar diuji terhadap:
  - langit (sinar naik atau tidak mengenai medan): luma 0,62;
  - medan yang bersinar matahari: 0,5;
  - salju di ketinggian: 0,7;
  - awan (saat di dalam awan): 0,75.
- Di angkasa, sinar diuji terhadap benda angkasa:
  - benda yang tersinari Matahari: warna atmosfernya dikali sudut sinar;
  - Matahari: 1;
  - ruang kosong dan sisi malam: 0,04.

Pembacaan piksel nyata (PBO) tetap tersedia sebagai alat kalibrasi lewat `debug.uiContrast('pbo')`.

**Kecocokan dengan kalibrasi piksel.** Di 13 skenario uji, mode pilihan heuristik sama dengan hasil kalibrasi
piksel, kecuali satu: kontrol kiri di skenario "Jupiter dekat". Di sana heuristik memilih gelap, padahal
pikselnya terang.

## Hasil dari piksel nyata

`node tests/ui/kontras.mjs <label>` mengambil dua screenshot berpasangan per skenario (844x390, mode HP,
kualitas Sedang). Dunia dibekukan lewat `debug.freeze` di antara keduanya:

1. dengan kontrol;
2. tanpa kontrol, yaitu latar asli di balik tiap piksel.

Rasio kontras WCAG, (L1 + 0,05) / (L2 + 0,05), dihitung untuk TEMBAK, NITRO, ULTIMATE, manuver Gulung, dan
joystick:

- **Ikon terhadap pelat:** persentil 95 piksel ikon dibanding median pelat.
- **Tepi terhadap latar:** median pita tepi dalam dan pita garis luar, masing-masing dibanding piksel latar
  yang sama. Nilai yang lebih tinggi dipakai.

Target untuk komponen UI: 3 banding 1.

Tabel memuat nilai terkecil dari kelima tombol, dengan nama tombol terlemah di dalam kurung. "Sebelum" adalah
2.3.1. "Sesudah" adalah 2.4.0 dengan opsi Otomatis (heuristik). Kolom kalibrasi berisi ikon / tepi bila mode
dipilih dari piksel nyata.

| Skenario | Sebelum: ikon/pelat | Sebelum: tepi/latar | Sesudah: ikon/pelat | Sesudah: tepi/latar | Mode (kiri, kanan, atas) | Kalibrasi piksel | Mode kalibrasi |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bumi siang | 2,2 (joystick) | 1,2 (joystick) | 7,3 (joystick) | 3,4 (joystick) | terang, terang, terang | 7,3 / 3,4 | sama |
| Bumi menunduk ke medan | 2,1 (joystick) | 1,3 (joystick) | 6,4 (nitro) | 3,5 (joystick) | terang, terang, terang | 6,4 / 3,5 | sama |
| Bumi di dalam awan | 1,7 (nitro) | 1,1 (gulung) | 4,5 (nitro) | 4,0 (ultimate) | terang, terang, terang | 4,6 / 4,0 | sama |
| Merkurius | 2,5 (nitro) | 1,5 (joystick) | 4,8 (joystick) | 4,9 (nitro) | gelap, gelap, gelap | 4,8 / 4,9 | sama |
| Venus | 2,7 (nitro) | 1,3 (gulung) | 2,9 (gulung) | 3,7 (gulung) | gelap, gelap, gelap | 2,9 / 3,7 | sama |
| Mars | 2,9 (nitro) | 1,3 (gulung) | 5,2 (gulung) | 6,5 (nitro) | gelap, gelap, gelap | 5,2 / 6,5 | sama |
| Jupiter | 2,8 (joystick) | 1,5 (joystick) | 5,4 (joystick) | 8,3 (joystick) | gelap, gelap, gelap | 5,4 / 8,3 | sama |
| Saturnus | 3,0 (joystick) | 1,6 (joystick) | 3,0 (nitro) | 3,2 (nitro) | gelap, gelap, gelap | 3,1 / 2,8 | sama |
| Pluto | 2,9 (joystick) | 1,5 (joystick) | 7,8 (gulung) | 9,3 (tembak) | gelap, gelap, gelap | 7,8 / 9,3 | sama |
| Jelajah Bebas (sabuk) | 2,8 (joystick) | 1,5 (joystick) | 8,1 (gulung) | 10,8 (tembak) | gelap, gelap, gelap | 8,1 / 10,8 | sama |
| Venus dekat (planet memenuhi layar) | 1,2 (nitro) | 1,1 (nitro) | 3,4 (gulung) | 6,4 (joystick) | gelap, terang, gelap | 3,4 / 6,5 | sama |
| Jupiter dekat | 1,8 (nitro) | 1,1 (joystick) | 2,6 (joystick) | 4,0 (joystick) | gelap, terang, terang | 5,5 / 4,4 | beda: terang, terang, terang |
| Dekat Matahari | 2,7 (joystick) | 1,5 (joystick) | 4,6 (gulung) | 5,0 (tembak) | gelap, gelap, terang | 4,6 / 5,0 | sama |

**Ringkasan.**

- **Sebelum:** tepi terhadap latar 1,1 sampai 1,6 di semua skenario. Pelat transparan dan cincin tipis
  (alpha 0,4, dikali opacity 0,78 dan transparansi 0,8) hampir menyatu dengan latar. Ikon di depan planet
  terang turun sampai 1,2.
- **Sesudah:**
  - tepi 3,2 sampai 10,8 di semua skenario;
  - ikon terhadap pelat minimal 3,0 di 11 dari 13 skenario.
- **Masih di bawah 3** (mode Kontras UI Tinggi menaikkan nilainya):
  - manuver Gulung di Venus: ikon 2,9, tepi 3,7;
  - jempol joystick di Jupiter dekat dengan heuristik: 2,6 (kalibrasi piksel 5,5);
  - NITRO di Saturnus pada kalibrasi piksel: tepi 2,8. Tombol ini berada di atas cincin Saturnus yang
    terang, padahal rata-rata wilayahnya gelap.

**Data.**

- Data mentah: `docs/ui/data/kontras-sebelum.json`, `kontras-sesudah.json`, dan `kontras-pbo.json`.
- Screenshot: `docs/ui/screenshots/sebelum/` dan `docs/ui/screenshots/sesudah/`.

## Batas yang diketahui

- Heuristik hanya melihat langit, medan, awan, dan benda angkasa. Objek kecil yang terang (komet, ledakan,
  asteroid dekat) tidak terlihat olehnya. Perubahan sesaat seperti itu juga sengaja diredam penghalusan.
- Uji berjalan di Chrome desktop dengan emulasi HP. Layar HP asli di bawah sinar matahari belum diuji.
