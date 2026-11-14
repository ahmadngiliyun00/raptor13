# Build APK otomatis di GitHub Actions (C11)

Workflow `.github/workflows/release-apk.yml` berjalan saat tag `v*` didorong. Workflow juga bisa dijalankan
manual dari tab Actions (`workflow_dispatch`). Hasilnya dilampirkan ke GitHub Release tag itu:

| Berkas | Isi |
| --- | --- |
| `raptor13-vX.Y.Z.apk` | APK rilis bertanda tangan |
| `raptor13.apk` | Salinan yang sama dengan nama tetap, agar `releases/latest/download/raptor13.apk` (konstanta `APK_URL` di game) selalu valid |
| `raptor13-vX.Y.Z.aab` | Untuk Google Play nanti |
| `SHA256SUMS` | Checksum semua berkas |

Izin workflow minimal: `contents: read`, dan hanya job rilis yang mendapat `contents: write`. Semua action
dipin ke commit.

## Mengisi GitHub Secrets (sekali saja)

1. Siapkan keystore. Keystore rilis sudah dibuat di `~/.raptor13-secrets/raptor13-release.jks` (lihat
   `docs/apk/keystore.md`). Bila ingin membuat baru:

   ```bash
   keytool -genkeypair -keystore rilis.jks -storetype PKCS12 -alias raptor13 -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=RAPTOR13, C=ID"
   ```

2. Ubah keystore ke base64 tanpa baris baru, lalu salin ke clipboard. Jangan simpan hasilnya di berkas repo:

   ```bash
   base64 -i ~/.raptor13-secrets/raptor13-release.jks | tr -d '\n' | pbcopy
   ```

3. Di GitHub buka Settings, Secrets and variables, Actions, lalu New repository secret. Isi empat secret:

| Nama secret | Isi |
| --- | --- |
| `KEYSTORE_BASE64` | Hasil langkah 2 |
| `KEYSTORE_PASSWORD` | Sandi store (`RAPTOR13_STORE_PASSWORD` di `~/.gradle/gradle.properties`) |
| `KEY_ALIAS` | `raptor13` |
| `KEY_PASSWORD` | Sandi key (`RAPTOR13_KEY_PASSWORD`) |

Contoh di dokumen ini tidak memuat nilai nyata. Jangan pernah menempelkan nilai sandi di issue, PR, atau log.

## Bila secret belum diatur

Workflow tetap berjalan, tetapi:

- membangun APK **debug**;
- menamainya `raptor13-vX.Y.Z-debug-tidak-bertanda-tangan-rilis.apk`;
- menampilkan peringatan yang jelas di ringkasan run.

Berkas `raptor13.apk` tidak dibuat dalam keadaan ini, sehingga tautan unduhan di game tidak mengarah ke APK
debug.

## Verifikasi

Langkah verifikasi di workflow mencetak:

- sidik jari SHA-256 sertifikat (`apksigner verify --print-certs`), yang harus sama dengan
  `docs/apk/keystore.md`;
- `aapt dump badging`: nama paket, versi, minSdk, targetSdk, dan izin.
