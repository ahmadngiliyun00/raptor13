# PWA (C9, 2.4.0)

RAPTOR13 bisa dipasang sebagai aplikasi web progresif dan dimainkan tanpa internet setelah kunjungan pertama.

## Isi

- **`manifest.webmanifest`:**
  - id, nama, dan nama pendek;
  - `display: fullscreen` dengan cadangan `standalone` (`display_override`);
  - orientasi landscape, tema gelap;
  - ikon 192 dan 512 (`any`) serta 192 dan 512 maskable.
- **Ikon maskable:**
  - emblem di zona aman 80 persen di atas latar penuh;
  - dibuat ulang dengan `node scripts/make-icons.mjs` dari `icons/favicon.svg`, yang merupakan karya proyek.
- **`sw.js`:**
  - Versi cache terikat `GAME_VERSION` lewat `sw.js?v=<versi>`.
  - Halaman (`index.html`) memakai **network-first**: versi terbaru selalu dicoba dulu, dan cache dipakai saat
    luring.
  - Ikon, manifest, dan pustaka vendor memakai **cache-first**.
  - Cache versi lama dihapus saat versi baru aktif.
- **Versi baru:**
  - Bila service worker baru terpasang, ia menunggu.
  - Toast **Versi baru tersedia** dengan tombol **MUAT ULANG** hanya muncul di menu, jeda, atau layar akhir.
    Saat bermain tidak pernah ada muat ulang paksa.
- **Petunjuk pasang:**
  - Android Chrome: tombol **PASANG APLIKASI** di menu utama lewat `beforeinstallprompt`. Tombol hanya muncul
    bila belum terpasang, dan tidak muncul di aplikasi Android.
  - iPhone: petunjuk sekali saja di menu mode HP, "ketuk Bagikan lalu Tambahkan ke Layar Utama", dan bisa
    ditutup.
- **CSP:**
  - meta CSP kini `worker-src 'self'` (sebelumnya `'none'`) dan `manifest-src 'self'`;
  - `connect-src` tetap `'none'` dan direktif lain tidak dilonggarkan.

## Uji (`tests/pwa.spec.mjs`)

- Manifest valid dan semua ikon tersedia.
- Service worker terpasang dan mengendalikan halaman setelah muat ulang.
- **Mode luring** (`context.setOffline`): game termuat dan bisa mulai bermain.
- Versi baru menunggu selama bermain, toast muncul setelah jeda, lalu MUAT ULANG mengaktifkan versi baru.
- Tombol Pasang aplikasi hanya muncul setelah `beforeinstallprompt`.
- Konsol bersih, termasuk tanpa pelanggaran CSP.

Saat `?debug=1`, service worker hanya didaftarkan bila URL memuat `&sw=1`, agar cache tidak memengaruhi uji
lain.

## Wajib di server sebelum deploy 2.4.0

1. Bila header CSP server sudah dipasang dari `docs/deploy/security-headers.md` versi lama, ubah `worker-src
   'none'` menjadi `worker-src 'self'`. Tanpa perubahan ini service worker ditolak; game tetap jalan, tetapi
   tanpa mode luring.
2. Tambahkan `location = /sw.js { add_header Cache-Control "no-cache" always; }`.
3. Tambahkan `scripts` dan `mobile` ke aturan 404 folder pengembangan.
4. Purge cache Cloudflare untuk `/sw.js` dan `/manifest.webmanifest` setelah deploy.
