# Bug zoom browser merusak tampilan game (E1, E2)

## Bukti dari pemilik

iPhone 12, Chrome iOS, landscape, situs live (versi sebelum 2.3.0 yang belum di-deploy):

- `zoom-ios/iphone12-chrome-zoom-1.png`: halaman ter-zoom, gambar game diperbesar dan kasar, kapal bergeser
  ke kiri, tombol aksi terpotong di tepi atas.
- `zoom-ios/iphone12-chrome-zoom-2.png`: area render game menyusut menjadi kotak kecil di kiri atas (sekitar
  300x133 piksel CSS), sisanya hanya warna latar halaman. Tombol sentuh tetap di tempatnya.

## Reproduksi (sebelum perbaikan)

Uji `tests/zoom-viewport.spec.mjs` meniru perilaku iOS: `window.innerWidth`, `innerHeight`, dan `visualViewport`
(lebar, tinggi, skala, offset) mengecil sebesar skala zoom, lalu event `resize` dikirim. Uji dijalankan di
WebKit dan Chromium. Pada kode 2.3.0 **8 dari 8 uji tiruan gagal**, di kedua mesin:

| Skala zoom | Lebar CSS canvas yang diharapkan | Lebar CSS canvas sebelum |
| --- | --- | --- |
| 1,5 | 844 | 563 |
| 2,0 | 844 | 422 |
| 2,8 | 844 | 301 |
| 4,0 | 844 | 211 |

Pada skala 2,8 canvas menjadi 301 piksel CSS, sama dengan kotak sekitar 300x133 di screenshot pemilik.
Screenshot emulasi: `zoom-ios/emulasi-zoom-2.8-sebelum.jpg`. Di sana canvas menjadi kotak kecil di kiri atas,
dan tombol sentuh ikut mengecil karena satuan `--u` juga dihitung dari tinggi yang menyusut.

Zoom asli di Chromium (CDP `Emulation.setPageScaleFactor` 1,5 sampai 4,0) **lolos bahkan sebelum
perbaikan**. Chromium tidak mengubah `window.innerWidth` saat pinch zoom, sedangkan iOS mengubahnya. Ini
menjelaskan kenapa bug hanya terlihat di iPhone.

## Penyebab pasti

`onResize()` mengambil ukuran dari `window.innerWidth` dan `window.innerHeight`. Di iOS (Safari dan Chrome iOS,
keduanya WebKit), nilai ini mengikuti *visual viewport*, jadi mengecil saat halaman dicubit atau di-zoom.
`renderer.setSize(w, h)` lalu menulis lebar dan tinggi inline yang kecil ke canvas, sehingga canvas tidak lagi
memenuhi layar dan buffer render ikut mengecil (gambar kasar saat diperbesar).

Penyebab kedua dari instruksi tata letak HP sebelumnya (H1): `Viewport.update()` memakai
`visualViewport.width` dan `height` saat skala sekitar 1, dan `innerWidth` dan `innerHeight` saat ter-zoom.
Akibatnya `--u` (ukuran kontrol sentuh), `--vh1`, dan `--app-h` ikut mengecil saat zoom.

## Semua sumber ukuran yang diperiksa

| Lokasi | Dipakai untuk | Sumber sebelum | Bersalah | Sesudah |
| --- | --- | --- | --- | --- |
| `renderer.setSize` awal dan `onResize()` | ukuran canvas CSS dan buffer | `innerWidth`, `innerHeight` | **ya** | `Layout.w`, `Layout.h` |
| `camera.aspect` | aspek kamera | `innerWidth / innerHeight` | **ya** | `Layout` |
| `Post.setup`, `Post.resize` | composer dan bloom | `innerWidth`, `innerHeight` | **ya** | `Layout` |
| `Pacer.basePixelRatio` | batas 2 juta piksel di Rendah dan Sedang | `innerWidth x innerHeight` | **ya** (zoom menaikkan pixel ratio palsu) | `Layout` |
| `Viewport.update` | `--u`, `--vh1`, `--app-h`, kontrol sentuh dan HUD | `visualViewport` atau `innerWidth` | **ya** | `Layout` |
| proyeksi penanda (reticle, titik bidik, bar HP melayang, angka damage, penanda tepi, penanda bos, titik piksel minimum) | posisi elemen HUD di atas canvas | `innerWidth`, `innerHeight` | **ya** (posisi meleset saat zoom) | `Layout` |
| kontur bos (`uPxWorld`), ukuran piksel bos | tebal kontur dan ambang 14 piksel | `innerHeight` | **ya** | `Layout` |
| `GlitchProbe` dan hook debug (`bullets`, `perf`, `bossProbe`) | diagnosis dan uji | `innerWidth`, `innerHeight` | tidak kritis | `Layout` |
| `ZoomGuard` | deteksi zoom dan posisi tip | `visualViewport.scale` dan offset | tidak (memang perlu visual viewport) | tetap |
| CSS `100dvh`, `vh`, `vw` (kartu, peta, cutscene) | ukuran layar menu | satuan CSS | tidak (satuan viewport CSS tidak ikut pinch zoom) | tetap |
| `Diag.download` (`screen.width`) | log diagnosis | layar fisik | tidak | tetap |

## Perbaikan (E2)

1. **Satu sumber ukuran.** `Layout` membaca `document.documentElement.clientWidth` dan `clientHeight` (layout
   viewport, tidak berubah saat zoom). Semua tempat di tabel di atas memakai `Layout.w` dan `Layout.h`.
   `window.innerWidth` dan `innerHeight` tidak lagi dipakai untuk ukuran.
2. **Abaikan zoom.** Saat `visualViewport.scale` di atas 1,01, layout tidak berubah, jadi renderer tidak
   disentuh. `onResize()` keluar lebih awal bila ukuran dan pixel ratio sama dengan yang terakhir diterapkan.
   Peristiwa resize saat zoom dihitung (`ignoredZoom`) untuk overlay diagnosis.
3. **Resize dua langkah.** Langsung, lalu sekali lagi 120 ms kemudian, karena iOS memperbarui ukuran layout
   sedikit terlambat setelah rotasi.
4. **Penjaga kewarasan.** Ukuran yang tidak masuk akal (bukan angka, lebar di bawah 100 atau tinggi di bawah
   60 piksel CSS) ditolak, ukuran sah terakhir dipakai, dan kejadiannya dicatat (`rejected`).
5. **Lantai resolusi dinamis.** Di perangkat sentuh pixel ratio efektif tidak turun di bawah 0,7 piksel buffer
   per piksel CSS (sebelumnya bisa 0,6 kali batas perangkat), jadi gambar tidak tampak kasar. Resolusi
   dinamis tidak lagi bereaksi pada resize palsu dari zoom.
6. **UI stabil.** `--u`, kontrol sentuh, dan HUD memakai ukuran layout, jadi tidak berubah ukuran atau bergeser
   akibat zoom.
7. **Reset tampilan.** Tombol pada tip "Zoom terdeteksi" menyetel ulang meta viewport (dua kali, sebelum dan
   300 ms sesudah), menggulir ke pojok, dan menyinkronkan ulang ukuran render.
8. **Pencegahan zoom B7 tetap ada** (meta viewport, `touch-action`, gesture, `dblclick`, ketuk ganda 350 ms,
   cubit di luar kontrol). Dua jempol di joystick dan tombol (keduanya di dalam `#touch`) tidak dicegah dan
   tidak dianggap cubit, karena area kontrol memakai `touch-action: none`. Catatan: iOS tetap bisa memaksa
   zoom aksesibilitas; perbaikan di atas memastikan game tetap utuh walau itu terjadi (pertahanan berlapis).

## Hasil sesudah perbaikan

`tests/zoom-viewport.spec.mjs` lolos di WebKit dan Chromium untuk skala 1,5, 2,0, 2,8, dan 4,0, plus zoom asli
CDP di Chromium. Yang ditegaskan:

- lebar dan tinggi CSS canvas sama dengan layout viewport, posisi 0,0;
- buffer tidak menyusut;
- aspek kamera tetap;
- kapal di tengah;
- posisi dan ukuran tombol tembak tidak berubah;
- skala resolusi dinamis tidak turun;
- semuanya normal lagi setelah kembali ke skala 1.

Screenshot emulasi: `zoom-ios/emulasi-zoom-2.8-sesudah.jpg`. Game memenuhi layar dengan kapal di tengah dan
tombol di tempatnya, dan tip "Zoom terdeteksi" tampil.

**Batas.** Uji ini meniru cara iOS melaporkan ukuran. Kebenaran akhir hanya bisa dipastikan di iPhone
sungguhan (langkah di `docs/zoom-ios.md`, dengan overlay `?diag=1` yang kini menampilkan layout, visualViewport,
skala, canvas CSS, buffer, resolusi, dan jumlah resize yang diabaikan).
