# Panduan deploy ke situs live (D1)

Situs: `https://raptor13.ngiliyun.my.id/`. Folder situs di server adalah clone git dari `origin/main`.
Catatan sebelumnya menyebut folder `/www/wwwroot/raptor13.ngiliyun.my.id` (aaPanel). Bila server memakai
CyberPanel dan OpenLiteSpeed, foldernya biasanya `/home/<domain>/public_html`. Pakai yang sesuai.

**Status:** deploy otomatis belum dijalankan. Mac ini belum punya host ssh untuk server di `~/.ssh/config`,
dan Claude Code tidak menebak host atau sandi. Pemeriksaan 14 November 2026: situs live masih menyajikan
`GAME_VERSION = '2.2.0'` tanpa `user-scalable=no`. Artinya perbaikan sejak 2.3.0 (bos, tabrakan, pencegahan
zoom) dan perbaikan bug zoom 2.3.1 belum sampai ke pemain sampai `git pull` dijalankan di server. Jalankan langkah manual di bawah, atau siapkan ssh tanpa
sandi lalu pakai `scripts/deploy.sh`.

## Cara manual (di server)

Masuk ke server (terminal aaPanel atau CyberPanel, atau ssh), lalu jalankan:

```bash
cd /www/wwwroot/raptor13.ngiliyun.my.id
git fetch origin
git pull --ff-only origin main
git log -1 --oneline
grep -o "const GAME_VERSION = '[0-9.]*'" index.html
chown -R www:www .
```

Baris `grep` harus menampilkan versi terbaru (sama dengan CHANGELOG). `chown` hanya perlu bila server memakai
pemilik `www` (aaPanel); di CyberPanel pemiliknya biasanya nama pengguna situs.

**Rollback** ke versi sebelumnya bila ada masalah:

```bash
cd /www/wwwroot/raptor13.ngiliyun.my.id
git tag --sort=-v:refname
git checkout v2.3.0
```

Ganti `v2.3.0` dengan tag sebelumnya yang diinginkan. Kembali ke versi terbaru dengan `git checkout main`
lalu `git pull --ff-only origin main`.

## Cara otomatis (dari Mac, setelah ssh siap)

1. Pastikan bisa login tanpa sandi: tambahkan blok `Host raptor13-server` di `~/.ssh/config` dengan
   HostName, User, dan IdentityFile kunci ssh, lalu uji `ssh -o BatchMode=yes raptor13-server echo ok`.
2. Jalankan dari akar repo:

```bash
DEPLOY_HOST=raptor13-server DEPLOY_PATH=/www/wwwroot/raptor13.ngiliyun.my.id DEPLOY_OWNER=www:www scripts/deploy.sh
```

Yang dilakukan skrip:

- Memastikan working tree bersih dan HEAD sama dengan `origin/main`.
- Menjalankan `git pull --ff-only` di server lewat ssh BatchMode (tidak pernah meminta atau menyimpan sandi).
- Memeriksa bahwa hash commit di server sama dengan hash lokal.
- Memeriksa asap: status 200, header, dan `GAME_VERSION` di HTML yang disajikan sama dengan versi lokal.
- Mencetak perintah rollback.

Skrip tidak mengubah konfigurasi server atau header.

## Cache browser dan Cloudflare

Domain ini berada di belakang Cloudflare. Bila versi lama masih tampil setelah deploy:

- `index.html` sebaiknya selalu divalidasi ulang. Tambahkan header `Cache-Control: no-cache` untuk dokumen
  HTML di vhost (lihat `docs/deploy/security-headers.md`). Aset bervendor (`vendor/`, `icons/`) boleh
  di-cache lama.
- Di Cloudflare: Caching, Configuration, lalu Purge Cache untuk URL `https://raptor13.ngiliyun.my.id/`.
- Di HP: muat ulang halaman, atau buka sekali dengan `?v=2` di akhir URL untuk melewati cache.

## Verifikasi setelah deploy

Buka `https://raptor13.ngiliyun.my.id/?diag=1`. Overlay diagnosis menampilkan `DIAGNOSIS RAPTOR13` diikuti
nomor versi. Versi itu harus sama dengan `GAME_VERSION` terbaru. Pastikan juga perbaikan zoom aktif: sumber
halaman harus memuat `user-scalable=no` di meta viewport.
