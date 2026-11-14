# Keystore rilis Android (C10)

## Yang sudah dibuat

| Komponen | Nilai |
| --- | --- |
| Keystore | `~/.raptor13-secrets/raptor13-release.jks` (di luar repo, folder mode 700, berkas mode 600), PKCS12, RSA 4096, alias `raptor13`, berlaku 10000 hari (sekitar 27 tahun) |
| Sandi | Acak 40 karakter, sama untuk store dan key. Disimpan hanya di `~/.gradle/gradle.properties` milik pengguna (mode 600) sebagai `RAPTOR13_STORE_FILE`, `RAPTOR13_STORE_PASSWORD`, `RAPTOR13_KEY_ALIAS`, `RAPTOR13_KEY_PASSWORD`. Tidak pernah ditulis di repo, log, atau dokumen. |
| Sidik jari SHA-256 sertifikat | `9F:0E:8C:1F:56:35:F1:AA:5E:89:DB:91:E1:E7:D3:59:19:B6:00:C1:EB:F7:5C:E3:64:B7:53:DB:A9:8A:84:68` |

`mobile/android/app/build.gradle` membaca keempat properti itu, atau variabel lingkungan dengan nama sama
(dipakai CI). Bila properti tidak ada, build rilis tetap jalan tetapi tidak bertanda tangan.

Cetak sidik jari kapan saja dengan:

```bash
scripts/print-cert-fingerprint.sh keystore ~/.raptor13-secrets/raptor13-release.jks raptor13
scripts/print-cert-fingerprint.sh apk mobile/android/app/build/outputs/apk/release/app-release.apk
```

Sandi diminta keytool secara interaktif. Bisa juga lewat variabel `KEYSTORE_PASSWORD`, yang tidak dicetak.

## Wajib: cadangkan sekarang

**Kehilangan keystore atau sandinya berarti tidak bisa merilis pembaruan dengan identitas yang sama.**
Pengguna harus mencopot aplikasi lama untuk memasang versi baru, dan nama paket di verifikasi developer Android
terikat ke sidik jari ini.

1. Salin `~/.raptor13-secrets/raptor13-release.jks` ke dua tempat terpisah, misalnya:
   - flashdisk terenkripsi;
   - pengelola sandi yang mendukung lampiran (1Password atau Bitwarden).
2. Salin keempat baris `RAPTOR13_*` dari `~/.gradle/gradle.properties` ke pengelola sandi yang sama.
3. Jangan pernah:
   - mengirim keystore atau sandi lewat chat atau email;
   - menaruhnya di Google Drive tanpa enkripsi;
   - menempelkannya di issue;
   - melakukan commit atasnya.

   `.gitignore` sudah menolak `*.jks`, `*.keystore`, `keystore.properties`, dan `signing.properties`. Pemindai
   `scripts/scan-secrets.mjs` (juga di CI) gagal bila ada berkas keystore atau sandi yang ikut terlacak.

## Play App Signing (untuk Google Play nanti)

- **Kunci aplikasi (app signing key):** dipegang Google dan dipakai menandatangani APK yang diunduh pengguna
  dari Play.
- **Kunci unggah (upload key):** dipegang pemilik dan dipakai menandatangani AAB yang diunggah ke Play Console.

Keystore ini bisa menjadi kunci unggah. Bila hilang, kunci unggah bisa direset lewat dukungan Play, tidak
seperti kunci aplikasi.

**Saran:**
- Saat mendaftar Play, pilih Google yang membuat kunci aplikasi, lalu pakai keystore ini sebagai kunci unggah.
- APK di GitHub Releases tetap ditandatangani keystore ini. Akibatnya APK dari GitHub dan dari Play memiliki
  sidik jari berbeda: pengguna tidak bisa memperbarui satu dengan yang lain tanpa copot pasang. Catat ini di
  halaman unduhan.
- Untuk verifikasi developer Android, daftarkan sidik jari di atas untuk nama paket `id.my.ngiliyun.raptor13`.
  Bila nanti Play App Signing dipakai, daftarkan juga sidik jari kunci aplikasi Play (lihat
  `docs/apk/rencana-apk.md`).
