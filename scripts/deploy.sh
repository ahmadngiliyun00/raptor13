#!/usr/bin/env bash
# Deploy RAPTOR13 ke situs live lewat git pull di server (D1).
# Pemakaian:
#   DEPLOY_HOST=nama-host-ssh DEPLOY_PATH=/jalur/ke/situs scripts/deploy.sh
# DEPLOY_HOST harus host ssh yang sudah bisa login tanpa sandi (kunci ssh, terdaftar di ~/.ssh/config).
# Skrip ini tidak mengubah konfigurasi server, header, atau berkas selain isi repo.
# Opsional: DEPLOY_URL (bawaan https://raptor13.ngiliyun.my.id/), DEPLOY_OWNER (misalnya www:www untuk chown).
set -euo pipefail

if [ -z "${DEPLOY_HOST:-}" ]; then echo "DEPLOY_HOST belum diisi. Lihat docs/deploy/panduan-deploy.md"; exit 2; fi
if [ -z "${DEPLOY_PATH:-}" ]; then echo "DEPLOY_PATH belum diisi. Lihat docs/deploy/panduan-deploy.md"; exit 2; fi
URL="${DEPLOY_URL:-https://raptor13.ngiliyun.my.id/}"
cd "$(dirname "$0")/.."

# 1. Working tree bersih dan commit sudah di-push
if [ -n "$(git status --porcelain)" ]; then echo "Working tree belum bersih. Commit atau simpan dulu."; exit 1; fi
git fetch -q origin
LOCAL="$(git rev-parse HEAD)"
REMOTE="$(git rev-parse origin/main)"
if [ "$LOCAL" != "$REMOTE" ]; then echo "HEAD lokal ($LOCAL) belum sama dengan origin/main ($REMOTE). Push dulu."; exit 1; fi
VERSION="$(grep -o "const GAME_VERSION = '[0-9.]*'" index.html | grep -o "[0-9][0-9.]*")"
PREV="$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "-")"
echo "Deploy commit $LOCAL versi $VERSION ke $DEPLOY_HOST:$DEPLOY_PATH"

# 2. Tarik di server (BatchMode: gagal bila butuh sandi, tidak pernah meminta sandi)
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=10 "$DEPLOY_HOST")
"${SSH[@]}" "cd '$DEPLOY_PATH'; git fetch -q origin; git pull --ff-only -q origin main"
if [ -n "${DEPLOY_OWNER:-}" ]; then "${SSH[@]}" "chown -R '$DEPLOY_OWNER' '$DEPLOY_PATH'"; fi

# 3. Hash commit di server sama dengan lokal
SERVER="$("${SSH[@]}" "cd '$DEPLOY_PATH'; git rev-parse HEAD")"
if [ "$SERVER" != "$LOCAL" ]; then echo "Hash di server ($SERVER) berbeda dari lokal ($LOCAL)."; exit 1; fi
echo "Server di commit $SERVER"

# 4. Pemeriksaan asap: status 200, header, dan versi yang disajikan
CODE="$(curl -s -o /dev/null -w '%{http_code}' -H 'Cache-Control: no-cache' "$URL?v=$LOCAL")"
echo "Status $CODE"
curl -sI "$URL" | grep -iE '^(content-type|cache-control|content-security-policy|server):' || true
SERVED="$(curl -s -H 'Cache-Control: no-cache' "$URL?v=$LOCAL" | grep -o "const GAME_VERSION = '[0-9.]*'" | grep -o "[0-9][0-9.]*" || true)"
echo "Versi disajikan: ${SERVED:-tidak ditemukan}, versi lokal: $VERSION"
if [ "$CODE" != "200" ]; then echo "Status bukan 200."; exit 1; fi
if [ "$SERVED" != "$VERSION" ]; then echo "Versi yang disajikan berbeda. Periksa cache CDN atau browser."; exit 1; fi

echo "Deploy selesai."
echo "Rollback bila perlu (di server):"
echo "  cd $DEPLOY_PATH"
echo "  git checkout $PREV"
echo "Kembali ke main setelah rollback: git checkout main"
