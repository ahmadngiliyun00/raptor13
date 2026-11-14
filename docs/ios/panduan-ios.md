# Panduan iOS RAPTOR13 (C12)

Proyek iOS dibuat dengan Capacitor 8.6.2 di `mobile/ios/App`, memakai Swift Package Manager. Sumber game
tetap `index.html`: `node scripts/sync-web.mjs`, lalu `npx cap sync ios`.

## Yang sudah diuji di Mac pengembang (14 November 2026)

- `xcodebuild` untuk platform simulator generik: **BUILD SUCCEEDED** (Xcode 27.2, iOS 26.5).
- Aplikasi terpasang dan berjalan di simulator iPhone 17 Pro. Screenshot:
  `docs/screenshots/c-update/ios-simulator-menu.jpg`. Yang terlihat:
  - landscape;
  - status bar tersembunyi;
  - mode HP aktif otomatis;
  - menu utama dan scene angkasa tampil normal.
- Pengaturan `Info.plist`:
  - orientasi hanya landscape kiri dan kanan (iPhone dan iPad);
  - `UIStatusBarHidden` true dan `UIViewControllerBasedStatusBarAppearance` false;
  - `UIRequiresFullScreen` true.
- Pencegahan zoom: meta viewport `user-scalable=no`, `touch-action`, dan penjaga zoom berjalan sama seperti di
  Safari. WKWebView Capacitor memakai mesin yang sama.
- Audio: game baru memulai Web Audio setelah interaksi pertama, sesuai aturan iOS.

**Belum diuji, hanya bisa dipastikan di iPhone asli:**
- Alur bermain di simulator dengan ketukan. `simctl` tidak mendukung ketukan, dan uji alur sudah dilakukan
  di emulator Android dan browser.
- Performa dan panas.
- Safe area poni dan Dynamic Island di perangkat.
- Haptics.

## (a) Jalur gratis tercepat: PWA

Di iPhone, buka <https://raptor13.ngiliyun.my.id/> di Safari, lalu ketuk **Bagikan**, lalu **Tambahkan ke
Layar Utama**. Game terbuka layar penuh dan bisa dimainkan luring setelah kunjungan pertama, lewat service
worker (C9). Game menampilkan petunjuk ini sekali di mode HP.

## (b) Pasang ke iPhone sendiri lewat Xcode dengan Apple ID gratis

1. Di Mac, pasang Xcode dari App Store, lalu jalankan:

   ```bash
   cd mobile && npm ci && cd ..
   node scripts/sync-web.mjs && node scripts/mobile-version.mjs
   cd mobile && npx cap sync ios
   ```

2. Buka `mobile/ios/App/App.xcodeproj` di Xcode. Proyek memakai Swift Package Manager, jadi tidak ada
   `.xcworkspace` atau CocoaPods.
3. Pilih target **App**, lalu tab **Signing and Capabilities**:
   - centang Automatically manage signing;
   - pada **Team** pilih Apple ID Anda (tambahkan lewat Xcode, Settings, Accounts);
   - bila nama paket `id.my.ngiliyun.raptor13` sudah dipakai, ubah **Bundle Identifier** menjadi unik, misalnya
     `id.my.ngiliyun.raptor13.dev`.
4. Hubungkan iPhone dengan kabel, pilih iPhone sebagai tujuan di toolbar, lalu tekan **Run**.
5. Di iPhone buka Pengaturan, Umum, VPN dan Manajemen Perangkat, lalu percayai developer Apple ID Anda. Untuk
   iOS 16 ke atas, nyalakan juga Mode Pengembang (Pengaturan, Privasi dan Keamanan).

**Batas Apple ID gratis:**
- profil berlaku 7 hari, setelah itu pasang ulang dari Xcode;
- maksimal 3 aplikasi per perangkat.

## (c) Distribusi: TestFlight dan App Store

- **Akun berbayar.** Wajib bergabung dengan Apple Developer Program. Biayanya sekitar 99 dolar AS per tahun;
  cek tarif terbaru di <https://developer.apple.com/programs/>.
- **TestFlight.** Build uji berlaku 90 hari:
  - penguji internal hingga 100 orang;
  - penguji eksternal hingga 10.000 orang, setelah lolos tinjauan beta.
- **Langkah:** di Xcode pilih Product, lalu Archive, lalu Distribute App ke App Store Connect. Setelah itu atur
  TestFlight atau kirim untuk tinjauan App Store.

## (d) Catatan jujur tentang tinjauan App Store

**Risiko penolakan.** Apple dapat menolak aplikasi yang hanya membungkus situs web dengan fungsi minimal
(pedoman 4.2, Minimum Functionality).

**Mitigasi yang sudah ada di RAPTOR13:**
- seluruh game berjalan luring di dalam aplikasi, tanpa memuat situs dari jaringan;
- layar penuh dan orientasi landscape terkunci;
- haptics native lewat plugin.

**Yang masih perlu disiapkan pemilik:**
- kebijakan privasi: game tidak mengumpulkan data, dan ini perlu dinyatakan di App Store Connect;
- rating konten: kekerasan kartun ringan, tanpa pembelian;
- screenshot berukuran resmi.

## (e) Tidak ada APK untuk iOS

APK hanya untuk Android. Di iOS jalurnya hanya tiga:

1. PWA;
2. Xcode dengan Apple ID;
3. TestFlight atau App Store.

Sideload pihak ketiga, misalnya toko alternatif di Uni Eropa atau alat penandatangan ulang, memiliki batasan
wilayah, kedaluwarsa sertifikat, dan risiko keamanan. Proyek ini tidak mendukung atau menyarankannya.
