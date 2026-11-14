# Tata letak HUD (C2, 2.4.0)

Tata letak mode HP mengikuti pola game tembak mobile orang ketiga. Tombol tembak besar menjadi jangkar di
kanan bawah, tidak menempel tepi bawah, dan tombol aksi lain tersusun dalam busur untuk jempol.

## Mode HP

| Wilayah | Isi |
| --- | --- |
| Kanan bawah | TEMBAK (1,45 satuan kontrol), pusat sekitar x 88 persen dan y 66 persen, minimal 20 persen tinggi layar dari tepi bawah (terukur 26 persen). Lapis dalam busur: NITRO (atas) dan ULTIMATE (kiri, 1,15 satuan, dengan cincin pengisian). Lapis luar: slot peralatan (0 sampai 3, cincin cooldown dan penghitung muatan), Loop, Balik, Gulung, dari atas ke kiri bawah |
| Kiri bawah | Joystick melayang (zona sentuh x di bawah 45 persen), posisi diam di sekitar x 13 persen dan y 70 persen |
| Kiri atas | Strip status (nyawa, HP, nitro, ultimate, level), radar bulat 56 px tepat di bawahnya, tombol Peta Tata Surya di samping radar |
| Tengah atas | Satu baris misi dan skor, bar bos tipis di bawahnya saat bos aktif, satu pusat notifikasi |
| Kanan atas | Jeda dan Suara (44 px area sentuh), deretan buff aktif di bawahnya |

Peringatan kritis tetap berupa indikator tepi dan chip di bawah zona tengah, bukan banner tengah.

Strip status ditempatkan di kiri atas, bukan di bawah tengah kiri. Prompt mengizinkan pilihan ini bila
bentrok, dan memang bentrok: di layar 320 px, pita bawah di bawah zona tengah hanya setinggi 56 px dan
berbagi ruang dengan pesawat (pusatnya di 55 sampai 80 persen tinggi layar). Radar diletakkan tepat di
bawah strip status, karena di HP berponi strip status di bawah radar akan masuk zona tengah.

### Cara busur dihitung

`HudLayout` di `index.html` menghitung posisi dari satuan kontrol (`--cu`, 11 persen tinggi layar dikali
Ukuran kontrol):

1. Tiap tombol digeser sepanjang busur (lingkaran untuk lapis dalam, lingkaran atau elips untuk lapis luar)
   sampai lingkaran area sentuhnya (minimal 44 px) terpisah 2 px dari semua tombol yang sudah ditempatkan.
2. Busur luar dipusatkan di sekitar 168 derajat, yaitu kiri sedikit ke atas, dalam jangkauan jempol.
3. Pusat TEMBAK digeser ke kanan bila busur masuk zona tengah (x 30 sampai 70 persen). Busur digeser ke atas
   bila melewati tepi bawah aman.
4. Bila tetap tidak muat, skala kontrol dikecilkan. Untuk tiap rasio busur luar (lingkaran 1, elips 0,85,
   elips 0,72) dicari skala terbesar, lalu dipakai rasio dengan skala terbesar.
5. Mode kidal mencerminkan semua posisi kontrol. Radar dan tombol peta ikut pindah ke kanan atas (di bawah Jeda
   dan Suara), dan deretan buff ke kiri atas. Tanpa itu, busur di kiri menimpa radar saat ada 3 slot
   peralatan. Bug ini ditemukan uji `opsi kontrol {"leftHanded":true}` dan sudah diperbaiki.

Area sentuh tombol bulat diuji sebagai lingkaran. Chromium dan WebKit menguji sentuhan sesuai border-radius,
termasuk pada hit slop `::before`; ini diperiksa dengan `elementFromPoint` (pojok kotak 44 px di luar
lingkaran tidak mengenai tombol). Karena itu tombol manuver kini bulat seperti tombol lain di busur.

### Hasil per ukuran layar

`node tests/ui/tata-letak.mjs --shots`, dengan 0 dan 3 slot peralatan. Luas UI idle mencakup strip status,
baris misi, Jeda dan Suara, radar, tombol peta, semua tombol sentuh, dan joystick.

| Layar | Slot | Skala | Luas UI idle | TEMBAK (x, y) | Jarak bawah TEMBAK | Lebar busur | Tinggi busur | Tumpang tindih |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 568x320 | 0 | 1 | 19,4 persen | 90,0 persen, 66,0 persen | 26,0 persen | 24,0 persen | 38,0 persen | 0 |
| 568x320 | 3 | 1 | 21,2 persen | 90,0 persen, 66,0 persen | 26,0 persen | 24,0 persen | 65,0 persen | 0 |
| 568x320 berponi | 0 | 1 | 19,2 persen | 87,0 persen, 66,0 persen | 26,0 persen | 19,0 persen | 55,0 persen | 0 |
| 568x320 berponi | 3 | 0,635 | 14,3 persen | 88,0 persen, 65,0 persen | 30,0 persen | 21,0 persen | 60,0 persen | 0 |
| 667x375 | 0 | 1 | 16,7 persen | 88,0 persen, 66,0 persen | 26,0 persen | 22,0 persen | 34,0 persen | 0 |
| 667x375 | 3 | 1 | 18,4 persen | 89,0 persen, 66,0 persen | 26,0 persen | 23,0 persen | 59,0 persen | 0 |
| 740x360 | 0 | 1 | 14,9 persen | 88,0 persen, 66,0 persen | 26,0 persen | 20,0 persen | 35,0 persen | 0 |
| 740x360 | 3 | 1 | 16,4 persen | 88,0 persen, 66,0 persen | 26,0 persen | 20,0 persen | 60,0 persen | 0 |
| 812x375 | 0 | 1 | 13,7 persen | 88,0 persen, 66,0 persen | 26,0 persen | 18,0 persen | 34,0 persen | 0 |
| 812x375 | 3 | 1 | 15,1 persen | 88,0 persen, 66,0 persen | 26,0 persen | 19,0 persen | 59,0 persen | 0 |
| 844x390 | 0 | 1 | 13,2 persen | 88,0 persen, 66,0 persen | 26,0 persen | 18,0 persen | 33,0 persen | 0 |
| 844x390 | 3 | 1 | 14,7 persen | 88,0 persen, 66,0 persen | 26,0 persen | 19,0 persen | 57,0 persen | 0 |
| 915x412 | 0 | 1 | 12,3 persen | 88,0 persen, 66,0 persen | 26,0 persen | 18,0 persen | 32,0 persen | 0 |
| 915x412 | 3 | 1 | 13,7 persen | 88,0 persen, 66,0 persen | 26,0 persen | 18,0 persen | 56,0 persen | 0 |
| 932x430 | 0 | 1 | 12,2 persen | 88,0 persen, 66,0 persen | 26,0 persen | 18,0 persen | 31,0 persen | 0 |
| 932x430 | 3 | 1 | 13,6 persen | 88,0 persen, 66,0 persen | 26,0 persen | 18,0 persen | 55,0 persen | 0 |

Semua ukuran lolos asersi `tests/hp.spec.mjs`:

- tanpa tumpang tindih, termasuk kasus terburuk `stressHud` dengan 3 slot peralatan;
- di dalam tepi aman;
- zona tengah bebas;
- area sentuh minimal 44 px;
- teks minimal 11 px;
- tanpa petunjuk keyboard;
- luas UI idle maksimal 22 persen;
- lebar busur maksimal 26 persen.

**Kekurangan:** di HP berponi 568x320 dengan 3 slot peralatan, skala kontrol turun ke 0,64. Ruang di kanan
zona tengah hanya 123 px setelah tepi poni 47 px. Area sentuhnya tetap 44 px, tetapi tombol tampak kecil.
Tanpa slot, atau di layar lain, skalanya 1,0.

Screenshot: `docs/screenshots/c-update/hp-*.jpg`.

## Desktop

| Wilayah | Isi |
| --- | --- |
| Kiri atas | Radar 150 px, tombol peta di sampingnya, data terbang (arah, pitch, bank, kecepatan, ketinggian) di bawahnya |
| Kiri bawah | Status: nyawa, integritas (HP), nitro, ultimate, level; Piko di atasnya |
| Tengah atas | Misi dan skor gelombang, bar bos di bawahnya |
| Kanan atas | Toolbar, skor, buff aktif |
| Kanan bawah | Panel penemuan dan hitungan musuh |
| Bawah tengah | Manuver dengan label tombol keyboard; slot peralatan menyusul di C5 |

Peringatan komet dipindah dari bawah blok misi ke tumpukan peringatan bawah tengah, karena blok misi yang
memuat teks stage panjang menimpanya (sudah terjadi sebelum C2).

`tests/hud.spec.mjs` memeriksa 1280x720, 1440x900, 2560x1440, 1440x900 dengan Ukuran teks Besar, dan 1280x800
dengan Sangat besar: posisi sudut, semua blok di dalam layar, dan tanpa tumpang tindih saat semua HUD tampil.

## Editor tata letak (C3)

**Membuka editor.** Pengaturan, tab Akses, lalu **EDIT TATA LETAK HUD** (hanya tampil di mode HP).

**Yang bisa diatur:**
- Semua tombol mode HP, tiga slot peralatan (pratinjau), dan joystick bisa digeser.
- Geseran menempel ke grid 8 px.
- Ukuran tiap elemen diubah lewat slider 70 sampai 130 persen, yang muncul saat elemen dipilih.

**Tanda di layar:**
- Zona terlarang diberi arsir merah:
  - zona tengah;
  - pita atas (Jeda, Suara, buff, misi, status);
  - radar dengan tombol peta (di kanan atas saat kidal).
- Tepi aman ditandai garis putus-putus biru.

**Validasi langsung.** Elemen berwarna merah bila:
- keluar tepi aman;
- masuk zona terlarang;
- lingkaran area sentuhnya (minimal 44 px) bertumpuk dengan elemen lain.

Pesan di bawah tombol menyebut masalah pertama. SIMPAN nonaktif sampai semua valid.

**Tombol:**
- Preset **Standar** (tata letak bawaan, tangan kanan).
- Preset **Kidal** (dicerminkan).
- Preset **Ringkas** (tombol 85 persen, TEMBAK 90 persen).
- **RESET** ke bawaan.
- **PRATINJAU** (menyembunyikan grid dan penanda).
- **BATAL** dan **SIMPAN**.

Editor memakai salinan tombol sendiri, jadi menggeser tidak memicu tembakan atau manuver.

**Penyimpanan.**
- Data disimpan di `raptor13.hudlayout.v1` (versi skema 1). Isinya offset pusat per elemen dalam pecahan
  lebar dan tinggi layar (sisi tangan kanan) serta skala ukuran.
- Data dipisah per kelas ukuran layar dan orientasi: tinggi di bawah 360 px "kecil", di bawah 400 px
  "sedang", selebihnya "besar".
- Saat dimuat, skema diperiksa ketat. Hanya kunci elemen yang dikenal yang diterima, dengan rentang:
  - offset maksimal 0,7;
  - skala 0,7 sampai 1,3.

  Data yang rusak diabaikan.
- Tata letak yang valid secara skema tetapi melanggar aturan di layar sekarang (misalnya terlalu dekat setelah
  ukuran kontrol diperbesar) tidak dipakai. Game kembali ke bawaan dan statusnya terbaca di
  `debug.hudLayout().custom`.

**Uji (`tests/hp.spec.mjs`, bagian C3):**
- Ketiga preset dengan Ukuran kontrol 70 dan 130 persen, ditambah 3 slot peralatan, lolos semua asersi tata
  letak di matriks 568x320 sampai 932x430.
- Alur editor diuji dengan pointer: geser ke zona tengah lalu SIMPAN nonaktif; posisi valid lalu tersimpan;
  setelah muat ulang tata letak kustom dipakai; kelas layar lain tetap bawaan.
- Lima bentuk data rusak diabaikan.

Batas luas UI 22 persen kini juga menjadi syarat skala kontrol. Sebelumnya, Ukuran kontrol 130 persen dengan
3 slot di 568x320 mencapai 22,3 persen.

Screenshot: `docs/screenshots/c-update/editor-568x320.jpg`.
