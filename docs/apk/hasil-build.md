# Hasil build dan uji APK (C10)

Dibangun di Mac pengembang pada 14 November 2026 dengan:

- Capacitor 8.6.2;
- JDK 21 (bawaan Android Studio);
- Android SDK build-tools 37.

## Lingkungan dan perintah

```bash
cd mobile && npm ci && cd ..
node scripts/sync-web.mjs          # salin index.html, manifest, ikon, vendor ke mobile/www (index.html tetap satu sumber)
node scripts/mobile-version.mjs    # versionName = GAME_VERSION, versionCode = mayor x 10000 + minor x 100 + patch
node scripts/make-icons.mjs --mobile   # ikon adaptif, ikon lama, splash gelap Android dan iOS
cd mobile && npx cap sync android && cd android
./gradlew assembleDebug                       # APK debug untuk uji
./gradlew assembleRelease bundleRelease       # APK rilis dan AAB bertanda tangan (properti RAPTOR13_* di ~/.gradle/gradle.properties)
```

## Hasil (build pertama, isi game 2.3.1 ditambah C1 sampai C9)

| Item | Nilai |
| --- | --- |
| Nama paket | `id.my.ngiliyun.raptor13` |
| minSdk dan targetSdk | 24 dan 36 (Android 16). Google Play mensyaratkan target API 35 untuk aplikasi baru sejak Agustus 2025; 36 memenuhi. |
| Izin | INTERNET (normal, untuk pemuat lokal Capacitor) dan VIBRATE (plugin Haptics). Tanpa izin berbahaya. |
| APK debug | 16,8 MB, tanpa R8 |
| APK rilis | 2,4 MB dengan R8 dan pengecilan resource, tanda tangan skema v2, `apksigner verify` lolos |
| AAB rilis | 2,9 MB |
| Sidik jari SHA-256 sertifikat | `9F:0E:8C:1F:56:35:F1:AA:5E:89:DB:91:E1:E7:D3:59:19:B6:00:C1:EB:F7:5C:E3:64:B7:53:DB:A9:8A:84:68`, sama dengan keystore |

Ukuran dan checksum rilis 2.4.0 dicatat di catatan rilis dan di `SHA256SUMS` pada GitHub Release.

## Uji di emulator

**Lingkungan:** AVD Pixel 10 Pro, Android API 37, arm64, tanpa jendela, GPU SwiftShader. Screenshot ada di
`docs/screenshots/c-update/apk-*.jpg`.

| Uji | Hasil |
| --- | --- |
| Pasang APK rilis (`adb install`) | Berhasil |
| Buka, waktu sampai jendela tampil | 1,4 detik (`am start -W`) |
| Landscape terkunci | Ya: rotasi 90 derajat, `sensorLandscape` |
| Layar penuh imersif | Ya. Bilah status dan navigasi tersembunyi; Android menampilkan pemberitahuan sekali "Viewing full screen" milik sistem. |
| Safe area dan cutout | `shortEdges` aktif; HUD di dalam tepi aman (screenshot apk-main) |
| Mode HP otomatis | Ya, tanpa pop-up deteksi |
| Alur menu, pilih medan, mode, pra-misi dengan tombol PERALATAN, terbang | Berhasil (apk-menu, apk-pra-misi, apk-main) |
| Tombol Back saat bermain | Membuka menu Jeda (apk-jeda-back). Di menu utama, Back pertama meminta konfirmasi dan Back kedua dalam 2 detik keluar; diuji dengan tiruan jembatan di `tests/apk.spec.mjs`. |
| Crash di logcat | Tidak ada (`FATAL EXCEPTION` 0) |
| Pelanggaran CSP | Tidak ada pesan "Refused to" dari proses aplikasi. Jembatan Capacitor disuntik WebView, bukan skrip inline halaman. |
| Plugin terdaftar | App, Browser, Haptics, KeepAwake, ScreenOrientation, StatusBar |
| Memori | PSS 106 MB saat bermain |
| Frame (`dumpsys gfxinfo`) | Median 150 ms per frame |

**Catatan jujur soal frame.** Emulator ini merender dengan SwiftShader, yaitu GPU perangkat lunak di CPU Mac,
jadi angka frame tidak mewakili HP asli. Performa, panas, dan audio harus diuji di perangkat. Daftar uji
manual ada di bawah.

## Uji manual di HP Android asli (untuk pemilik)

1. Pasang `raptor13.apk` dari GitHub Releases lewat browser. Catat peringatan Play Protect bila muncul.
2. Buka aplikasi:
   - layar pembuka gelap tanpa kilatan putih;
   - landscape;
   - tanpa bilah status.
3. Mainkan 10 menit di Bumi dan di angkasa:
   - FPS di overlay F3 (Pengaturan, tab Lainnya);
   - panas HP;
   - suara mesin dan tembakan.
4. Tekan tombol Kembali:
   - saat bermain harus muncul Jeda;
   - di menu utama, dua kali untuk keluar.
5. Kunci layar lalu buka lagi: game terjeda dan audio berhenti, lalu lanjut normal.
6. Putar HP: tetap landscape. Bila ada, uji juga layar berponi.
7. Getar saat menembak dan terkena (opsi Getar di tab Akses).
8. Tutup aplikasi, buka lagi: simpanan sesi dan pengaturan tetap ada.
9. Tekan Lapor Bug di menu Jeda: halaman GitHub terbuka di browser dengan info diagnostik.

## Rilis 2.4.0

| Berkas | Ukuran | SHA-256 |
| --- | --- | --- |
| `raptor13-v2.4.0.apk` dan `raptor13.apk` | 2.404.688 byte | `083f95c2b31317ad0a84825da65f97ba2b85a40d76590eb56e5b18b029d73003` |
| `raptor13-v2.4.0.aab` | 2.884.571 byte | `7835199c379928c8d99c4dcd2f150ca41bc910499c6da6ec78a308538bade673` |

**Identitas APK:**
- versionName 2.4.0, versionCode 20400;
- minSdk 24, targetSdk 36;
- sidik jari sertifikat sama dengan di atas.

**Uji pembaruan di emulator:**
- APK 2.4.0 dipasang di atas build sebelumnya (`adb install -r`, tanda tangan sama) dan berhasil.
- Sesi tersimpan dan pengaturan tetap ada: menu menampilkan LANJUTKAN untuk sesi Jelajah Bebas sebelumnya.
- Tanpa crash.
