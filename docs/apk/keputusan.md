# Keputusan: Capacitor atau TWA (D6)

Rencana pertama (`rencana-apk.md`, 2.3.0) merekomendasikan PWA, lalu TWA (Bubblewrap), lalu Play Store.
Prompt implementasi berikutnya meminta Capacitor. Catatan ini menimbang keduanya dengan jujur.

| Aspek | TWA (Bubblewrap) | Capacitor |
| --- | --- | --- |
| Isi APK | Pembungkus tipis; game dimuat dari situs | Aset game dibundel di dalam APK |
| Offline | Hanya bila service worker sudah menyimpan aset | Penuh sejak pertama dibuka |
| Mesin | Chrome yang terpasang (sama dengan mesin yang diuji) | Android System WebView (Chromium, diperbarui lewat Play; di HP lama bisa tertinggal) |
| Pembaruan game | Langsung, mengikuti situs | Butuh APK baru per versi (atau mekanisme pembaruan web sendiri) |
| Fitur native | API web saja (getar, wake lock) | Plugin: haptik asli, kunci orientasi, layar penuh imersif, tombol Back, status bar |
| iOS | Tidak ada | Satu basis kode untuk Android dan iOS |
| Syarat | PWA dan Digital Asset Links di domain | Android Studio atau Gradle, JDK 17, Android SDK |
| Ukuran | Sekitar 1 sampai 2 MB | Sekitar 4 sampai 8 MB |

**Keputusan untuk pembaruan besar berikutnya: Capacitor.** Alasannya:

- APK yang bisa dipasang dan dimainkan tanpa koneksi.
- Haptik dan orientasi asli.
- Satu proyek untuk Android dan iOS.
- Rilis APK yang dibekukan per versi dengan checksum yang bisa diverifikasi.

Itu yang diminta pemilik untuk distribusi di luar Play.

**Kapan TWA tetap layak:**

- Untuk versi Play Store belakangan bila ingin pembaruan otomatis mengikuti situs tanpa mengunggah APK baru.
- Bila ukuran APK sangat penting.

Keduanya bisa hidup berdampingan, asalkan nama paketnya berbeda atau satu nama paket dengan kunci yang dikelola
hati-hati.

**Verifikasi developer berlaku sama untuk keduanya.** Nama paket dan sidik jari kunci tanda tangan harus
terdaftar (wajib untuk toko yang berpartisipasi sejak 30 September 2026 di Indonesia, dan untuk semua pemasangan
di perangkat bersertifikat mulai 2027). Lihat bagian "Verifikasi developer Android" di `rencana-apk.md`.
