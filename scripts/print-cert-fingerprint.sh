#!/usr/bin/env bash
# Cetak sidik jari SHA-256 sertifikat penandatanganan (D6) untuk pendaftaran nama paket di verifikasi developer Android.
# Tidak pernah mencetak atau menyimpan sandi. Sandi keystore diminta keytool secara interaktif, atau dibaca dari
# variabel lingkungan KEYSTORE_PASSWORD (tidak ditampilkan).
# Pemakaian:
#   scripts/print-cert-fingerprint.sh apk  jalur/ke/aplikasi.apk
#   scripts/print-cert-fingerprint.sh keystore jalur/ke/rilis.keystore alias
set -euo pipefail
MODE="${1:-}"
FILE="${2:-}"
if [ -z "$MODE" ]; then echo "Pemakaian: $0 apk <berkas.apk> | keystore <berkas.keystore> <alias>"; exit 2; fi
if [ -z "$FILE" ]; then echo "Berkas belum disebut."; exit 2; fi
if [ ! -f "$FILE" ]; then echo "Berkas tidak ditemukan: $FILE"; exit 2; fi
if [ "$MODE" = "apk" ]; then
  if ! command -v apksigner > /dev/null; then echo "apksigner tidak ada di PATH (bagian dari Android SDK build-tools)."; exit 2; fi
  apksigner verify --print-certs "$FILE" | grep -i "SHA-256 digest" | sed 's/.*: //' | tr 'a-f' 'A-F' | sed 's/\(..\)/\1:/g; s/:$//'
elif [ "$MODE" = "keystore" ]; then
  ALIAS="${3:-}"
  if [ -z "$ALIAS" ]; then echo "Alias kunci belum disebut."; exit 2; fi
  if [ -n "${KEYSTORE_PASSWORD:-}" ]; then
    keytool -list -v -keystore "$FILE" -alias "$ALIAS" -storepass:env KEYSTORE_PASSWORD | grep -i "SHA256:" | sed 's/.*SHA256: *//'
  else
    keytool -list -v -keystore "$FILE" -alias "$ALIAS" | grep -i "SHA256:" | sed 's/.*SHA256: *//'
  fi
else
  echo "Mode tidak dikenal: $MODE"; exit 2
fi
