# Checklist pemilik: verifikasi developer Android (D6)

Langkah yang hanya bisa dilakukan pemilik, bukan Claude Code. Disusun 14 November 2026 dari sumber resmi yang
tercantum di `rencana-apk.md` (bagian "Verifikasi developer Android").

- [ ] Masuk Play Console yang sudah dimiliki (akun organisasi pemilik).
- [ ] Buka halaman verifikasi developer Android di Play Console. Pastikan identitas developer berstatus
      terverifikasi.
- [ ] Buat keystore rilis di luar repo (langkahnya ditulis di `docs/apk/keystore.md` saat APK dibuat). Simpan
      sandi di password manager.
- [ ] Cadangkan keystore dan sandinya di dua tempat terpisah (misalnya flashdisk terenkripsi dan penyimpanan
      awan pribadi terenkripsi). Kehilangan keystore berarti tidak bisa merilis pembaruan dengan identitas yang
      sama dan tidak bisa membuktikan kepemilikan nama paket.
- [ ] Cetak sidik jari SHA-256: `scripts/print-cert-fingerprint.sh keystore <berkas> <alias>`.
- [ ] Daftarkan nama paket `id.my.ngiliyun.raptor13` dan sidik jari itu sebagai aplikasi yang dibagikan di luar
      Play.
- [ ] Simpan email konfirmasi "Registered" dan catat tanggalnya di sini: ______
- [ ] Bila nanti memakai Play App Signing: daftarkan juga sidik jari kunci aplikasi Play, atau pakai kunci
      sendiri sebagai kunci aplikasi saat unggahan pertama.

Tenggat:

- **Sudah berlaku** sejak 30 September 2026 untuk toko yang berpartisipasi (termasuk Google Play) di Indonesia.
- **2027** (bulan belum diumumkan) untuk semua pemasangan di perangkat bersertifikat, termasuk APK langsung.
  Daftarkan sebelum itu.

Catatan: aturan ini bisa berubah. Cek ulang https://developer.android.com/developer-verification sebelum rilis.
