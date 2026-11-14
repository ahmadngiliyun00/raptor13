# Header keamanan server untuk RAPTOR13

RAPTOR13 adalah situs statis: `index.html`, `manifest.webmanifest`, `icons/`, dan `vendor/three-0.187.0/`
(Three.js yang ditanam lokal). Meta tag di `index.html` sudah memuat Content-Security-Policy ketat dengan
hash skrip, tetapi beberapa perlindungan hanya bisa diberikan lewat header HTTP (HSTS, frame-ancestors,
nosniff, Permissions-Policy, COOP, CORP). Dokumen ini berisi konfigurasi untuk dua server yang mungkin
dipakai.

Catatan lingkungan: permintaan audit menyebut VPS AlmaLinux dengan CyberPanel (OpenLiteSpeed), sedangkan
catatan deploy sebelumnya menyebut situs live di aaPanel dengan nginx. Keduanya disediakan; pakai yang
sesuai dengan server yang sebenarnya melayani `raptor13.ngiliyun.my.id`.

## Header yang dipasang dan alasannya

| Header | Nilai | Alasan |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=31536000` | Browser selalu memakai HTTPS. Tambahkan `includeSubDomains; preload` hanya bila semua subdomain ngiliyun.my.id sudah HTTPS. |
| `X-Content-Type-Options` | `nosniff` | Berkas tidak ditafsirkan dengan tipe lain (penting untuk modul JS di `vendor/`). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Alamat lengkap tidak bocor ke situs lain. |
| `X-Frame-Options` | `DENY` | Cadangan untuk browser lama; `frame-ancestors 'none'` di CSP adalah pengganti modernnya. |
| `Permissions-Policy` | kamera, mikrofon, geolokasi, pembayaran, USB, serial, Bluetooth, HID, MIDI, sensor gerak, tangkap layar, topik iklan dimatikan; `fullscreen`, `screen-wake-lock`, `autoplay` hanya untuk situs sendiri | Game hanya butuh layar penuh, wake lock, dan audio. |
| `Content-Security-Policy` | kebijakan kasar tanpa hash ditambah `frame-ancestors 'none'` dan `upgrade-insecure-requests` | Meta CSP tidak bisa mengatur `frame-ancestors`. Kebijakan header dan meta ditegakkan bersamaan (irisan), jadi hash skrip yang ketat tetap berlaku dari meta tanpa perlu mengubah server tiap rilis. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Jendela lain tidak bisa memegang referensi ke tab game. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Aset tidak bisa disematkan oleh situs lain. Catatan: gambar pratinjau `icons/og-image.jpg` diambil oleh crawler (bukan browser lintas situs), jadi tidak terpengaruh. |
| `Cache-Control` | `no-cache` untuk HTML dan manifest, 7 hari untuk ikon, 1 tahun `immutable` untuk `vendor/three-0.187.0/` | Pembaruan game langsung terlihat; pustaka berversi di URL aman di-cache lama. |
| Kompresi | Brotli bila tersedia, selain itu gzip | `three.core.js` 1,47 MB menjadi sekitar 300 KB terkirim. |
| Sembunyikan versi server | `ServerSignature Off`, `server_tokens off`, hapus `X-Powered-By` | Mengurangi informasi untuk penyerang. |
| Directory listing | `Options -Indexes`, `autoindex off` | Isi folder tidak terdaftar. |
| Berkas tersembunyi dan pengembangan | 403 atau 404 untuk `.git`, `.env`, berkas titik lain (kecuali `.well-known`), `docs/`, `tests/`, `node_modules/`, `package*.json`, `playwright.config.mjs`, `README.md`, `CHANGELOG.md` | Riwayat git dan alat uji tidak terbuka ke publik. |
| HTTP ke HTTPS | 301 | Semua lalu lintas terenkripsi. |

## OpenLiteSpeed atau CyberPanel

Pakai `docs/deploy/contoh.htaccess`, salin ke akar situs sebagai `.htaccess`.

1. CyberPanel, Websites, List Websites, Manage pada domain, lalu File Manager: unggah `.htaccess` ke
   `public_html`, atau dari server: `cp docs/deploy/contoh.htaccess /home/DOMAIN/public_html/.htaccess`.
2. OpenLiteSpeed membaca `.htaccess` untuk rewrite secara bawaan. Untuk header, pastikan di WebAdmin
   (port 7080), Virtual Hosts, domain, General: `Enable Rewrite` Yes, dan `Auto Load from .htaccess` Yes.
3. Kompresi di OpenLiteSpeed diatur di Server Configuration, Tuning: `Enable GZIP Compression` Yes,
   `Enable Brotli Compression` di atas 0 (misalnya 6), `Compressible Types` memuat `text/javascript`.
4. Sembunyikan versi: Server Configuration, General, `Server Signature` diisi `Hide Version` atau
   `Hide Full Header`.
5. Mulai ulang: `sudo systemctl restart lsws`.

## nginx (aaPanel)

Tambahkan di blok `server` situs (aaPanel: Website, situs, Config file, di bawah `#REWRITE-END`):

```nginx
server_tokens off;
autoindex off;

# Berkas tersembunyi (kecuali ACME) dan berkas pengembangan
location ~ /\.(?!well-known/) { deny all; return 404; }
location ~ ^/(docs|tests|scripts|mobile|node_modules|test-results|playwright-report)(/|$) { return 404; }
location ~ ^/(package\.json|package-lock\.json|playwright\.config\.mjs|README\.md|CHANGELOG\.md)$ { return 404; }

add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "DENY" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=(), browsing-topics=(), interest-cohort=(), fullscreen=(self), screen-wake-lock=(self), autoplay=(self)" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'; font-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests" always;

location = /index.html { add_header Cache-Control "no-cache" always; }
location ~ ^/vendor/three-0\.187\.0/ { add_header Cache-Control "public, max-age=31536000, immutable" always; }
location = /manifest.webmanifest { default_type application/manifest+json; add_header Cache-Control "no-cache" always; }
# Service worker (2.4.0): selalu divalidasi ulang agar versi baru cepat ditemukan
location = /sw.js { add_header Cache-Control "no-cache" always; }

gzip on;
gzip_types text/css text/javascript application/javascript application/json application/manifest+json image/svg+xml;
```

Catatan nginx: `add_header` di dalam `location` menimpa semua `add_header` dari tingkat `server`. Bila
memakai blok `location` dengan `add_header` sendiri, salin header keamanan ke dalamnya juga, atau pakai
`include` berkas berisi header tersebut. Pengalihan HTTP ke HTTPS di aaPanel diaktifkan lewat SSL,
Force HTTPS.

## Verifikasi

```bash
# Header utama halaman
curl -sI https://raptor13.ngiliyun.my.id/ | grep -iE 'strict-transport|content-security|x-content-type|referrer-policy|permissions-policy|cross-origin|cache-control|server|x-powered'

# HTTP dialihkan ke HTTPS (harus 301 dengan Location https)
curl -sI http://raptor13.ngiliyun.my.id/ | grep -iE '^HTTP|^location'

# Berkas rahasia dan pengembangan tertutup (harus 403 atau 404)
for p in .git/config .git/HEAD .env .htaccess docs/PROGRESS.md tests/game.spec.mjs package.json node_modules/ README.md; do
  printf '%s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "https://raptor13.ngiliyun.my.id/$p"
done

# Tanpa directory listing (harus 403 atau 404, bukan daftar berkas)
curl -s -o /dev/null -w '%{http_code}\n' https://raptor13.ngiliyun.my.id/icons/

# Kompresi aktif (harus content-encoding br atau gzip)
curl -sI -H 'Accept-Encoding: br, gzip' https://raptor13.ngiliyun.my.id/vendor/three-0.187.0/build/three.core.js | grep -iE 'content-encoding|cache-control|content-type'

# Modul JS bertipe benar
curl -sI https://raptor13.ngiliyun.my.id/vendor/three-0.187.0/build/three.module.js | grep -i content-type
```

Pemeriksa daring yang dapat dipakai: securityheaders.com dan observatory.mozilla.org (masukkan alamat
situs). Setelah header dipasang, buka game dan pastikan console browser tidak menampilkan pelanggaran CSP.
