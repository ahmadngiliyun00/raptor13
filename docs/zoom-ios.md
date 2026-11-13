# Zoom dua kali ketuk dan cubit di iPhone (B7)

Laporan pemilik: di iPhone 12 (Chrome iOS), mengetuk dua kali di halaman game memicu zoom browser, sehingga
game tampak terpotong dan harus di-zoom out manual. Chrome di iOS memakai mesin WebKit, jadi perilakunya sama
dengan Safari.

## Lapisan pencegahan

Semua lapisan dipakai sekaligus, karena iOS bisa mengabaikan sebagian.

1. **Meta viewport**: `width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1,
   user-scalable=no, viewport-fit=cover`. Sejak iOS 10, Safari mengabaikan `user-scalable=no` dan
   `maximum-scale` demi aksesibilitas, terutama untuk cubit. Karena itu lapisan berikutnya tetap wajib.
2. **CSS**:
   - `touch-action: manipulation` pada `html`, `body`, layar menu, kartu, dan tombol. Ini menghapus zoom dua
     ketukan dan jeda ketuk di WebKit.
   - `touch-action: none` pada kanvas game, seluruh kontrol sentuh (`#touch` dan isinya), dan zona joystick.
   - `-webkit-user-select: none`, `-webkit-touch-callout: none`, `-webkit-tap-highlight-color: transparent`,
     `overscroll-behavior: none`, dan `-webkit-text-size-adjust: 100%`.
3. **JavaScript** (`ZoomGuard` di `index.html`). Listener dengan `passive: false` dipasang hanya untuk
   event berikut:
   - `gesturestart`, `gesturechange`, dan `gestureend` (event cubit khusus WebKit) dicegah.
   - `dblclick` dicegah.
   - `touchend` kedua dalam 350 ms dicegah, kecuali di input teks.
   - `touchmove` dengan dua jari atau lebih dicegah bila salah satu jari berada di luar kontrol sentuh. Jadi
     multi-touch joystick, tembak, dan nitro tidak terganggu. Kontrol sentuh memakai Pointer Events, yang
     tidak dibatalkan oleh pencegahan ini.
4. **Cadangan bila zoom tetap terjadi.** `window.visualViewport.scale` dipantau. Bila skala di atas 1,01,
   meta viewport disetel ulang (cara yang kadang membuat iOS kembali ke skala 1). Lalu tip kecil muncul di
   tepi atas area yang terlihat: "Zoom terdeteksi. Cubit untuk memperkecil", dengan tombol **Reset
   tampilan**. Tip ini menempel pada area tampak dan tidak ikut membesar. **iOS tidak mengizinkan zoom
   direset lewat kode di semua kasus.** Bila tombol tidak berhasil, pemain perlu mencubit untuk memperkecil.
5. **Input teks.** Saat ini game tidak punya input teks (hanya slider dan kotak centang). Aturan CSS
   cadangan tetap dipasang: input teks, select, dan textarea minimal 16 px, agar iOS tidak memperbesar saat
   input difokus bila suatu hari ditambahkan.
6. **Aksesibilitas.** Opsi **Ukuran teks** yang sudah ada (Pengaturan, tab Akses: Normal, Besar, Sangat
   besar) diberi catatan "pengganti zoom browser". Pemain yang butuh teks lebih besar tetap punya cara yang
   aman.

## Uji otomatis

`tests/zoom.spec.mjs`, dijalankan otomatis oleh `npx playwright test`:

- Proyek **webkit** (mesin Safari dan Chrome iOS) dengan emulasi iPhone 12 dan iPhone 14 landscape 844x390,
  serta iPhone 14 dengan `?safearea=47,0,47,21`.
- Proyek **chromium** dengan emulasi Pixel 7, untuk memastikan Chrome Android tidak terganggu.

Yang diperiksa:

- Isi meta viewport.
- `touch-action` pada html, body, kanvas, kontrol sentuh, dan layar judul.
- Aturan `-webkit-text-size-adjust`.
- Tidak ada input teks di bawah 16 px.
- Event sintetis `dblclick` dan `gesturestart`/`gesturechange`/`gestureend` dicegah.
- `touchend` pertama tidak dicegah, yang kedua dalam 350 ms dicegah.
- Cubit dua jari di luar kontrol dicegah, sedangkan di atas joystick dan tombol tembak tidak.
- Ketukan ganda nyata (`touchscreen.tap`) di menu, di permainan, di zona joystick, dan di pojok tidak
  mengubah `visualViewport.scale`.
- Tembak bersama joystick (multi-touch) tetap mengeluarkan peluru.

**Batas uji otomatis.** Emulasi WebKit di Playwright berjalan di macOS dan tidak menjalankan logika zoom iOS
yang sebenarnya. Uji ini memastikan setiap lapisan terpasang dan event ditangani, tetapi **tidak membuktikan**
bahwa iPhone asli tidak memperbesar halaman. Hal itu hanya bisa dipastikan di perangkat iOS sungguhan.

## Langkah uji manual untuk pemilik (iPhone, Chrome iOS dan Safari)

Lakukan di Chrome iOS lalu ulangi di Safari. Pegang HP landscape dan buka situs game (sesudah `git pull` di
server).

1. **Menu.** Ketuk dua kali cepat di tengah layar judul, di judul RAPTOR13, dan di tombol MULAI. Halaman
   tidak boleh membesar. Satu ketukan tombol tetap berfungsi.
2. **Pojok.** Ketuk dua kali cepat di keempat pojok layar menu.
3. **Gameplay.** Mulai bermain. Ketuk dua kali cepat di langit (tengah atas), di zona joystick kiri, di
   tombol tembak, dan di pojok kanan atas.
4. **Multi-touch.** Tahan joystick dengan jempol kiri sambil menahan tembak, lalu ketuk nitro dua kali.
   Pesawat harus berbelok, menembak, dan nitro menyala tanpa halaman membesar.
5. **Cubit.** Cubit dengan dua jari di tengah layar, di menu, lalu di gameplay. Bila halaman tetap membesar,
   tip "Zoom terdeteksi" harus muncul di tepi atas. Tekan **Reset tampilan**. Bila tidak kembali ke ukuran
   normal, cubit untuk memperkecil. Catat versi iOS dan browser yang dipakai.
6. **Pengaturan.** Buka Pengaturan, geser slider Ukuran kontrol dan Transparansi, lalu ketuk dua kali di
   tombol tab. Halaman tidak boleh membesar.
7. **Orientasi.** Putar HP ke potret lalu kembali ke landscape. Game harus tetap penuh layar tanpa zoom.

Bila zoom masih terjadi di salah satu langkah, catat langkahnya, versi iOS, dan browsernya. Ganti mode
kontrol dan ukuran teks tidak diperlukan untuk uji ini.

## Pembaruan 2.3.1: game tetap utuh walau zoom lolos, dan uji terukur dengan ?diag=1

Bug di screenshot pemilik (canvas menyusut ke kiri atas) sudah ditemukan penyebabnya dan diperbaiki: ukuran
canvas dulu diambil dari `window.innerWidth`, yang di iOS ikut mengecil saat zoom. Rinciannya ada di
`docs/bug/zoom-viewport.md`. Sekarang, walau iOS tetap memperbesar halaman, ukuran render, kamera, kapal, dan
tombol tetap sama.

### Langkah uji terukur (iPhone 12, Chrome iOS lalu Safari)

1. Buka `https://raptor13.ngiliyun.my.id/?diag=1`. Overlay diagnosis tampil di atas game.
2. Di menu: ketuk dua kali cepat di tengah, lalu di tombol MULAI. Catat baris "zoom dicegah" dan "skala".
3. Mulai bermain. Ketuk dua kali cepat di langit, di zona joystick, di tombol tembak, dan di pojok kanan atas.
4. Tahan joystick dengan jempol kiri sambil menahan tembak.
5. Cubit dengan dua jari di tengah layar. Lihat apakah game tetap penuh layar dan kapal di tengah.
6. Bila halaman membesar, tekan **Reset tampilan** pada tip di atas, lalu cubit untuk memperkecil bila perlu.
7. Tekan **UNDUH LOG** pada overlay. Berkas JSON berisi bagian `zoom` dengan semua angka di bawah.

### Templat laporan

```text
Perangkat dan versi iOS        :
Browser dan versinya           : (Chrome iOS / Safari)
Versi game (layar Tentang)     :
Langkah 2 menu                 : halaman membesar? ya/tidak, skala:
Langkah 3 gameplay             : halaman membesar? ya/tidak, skala:
Langkah 4 joystick dan tembak  : berfungsi? ya/tidak
Langkah 5 cubit                : game tetap penuh layar? ya/tidak, kapal di tengah? ya/tidak
Langkah 6 Reset tampilan       : kembali normal? ya/tidak
Dari overlay ?diag=1:
  layout                       : (contoh 844x390)
  visualViewport dan skala     :
  skala tertinggi dan jam      :
  canvas CSS dan buffer        :
  resolusi                     :
  resize diabaikan karena zoom :
  zoom dicegah (dblclick, gesture, ketuk ganda, cubit):
```

Arti angka: "canvas CSS" harus selalu sama dengan "layout", walau "skala" lebih dari 1. Bila "skala tertinggi"
pernah lebih dari 1,01, berarti iOS sempat memperbesar halaman. Itu dibatasi iOS (zoom aksesibilitas tidak
bisa dimatikan sepenuhnya oleh situs), tetapi game tidak boleh rusak.
