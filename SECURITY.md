# Kebijakan keamanan

## Melaporkan kerentanan

Laporkan kerentanan **secara pribadi** lewat fitur GitHub private vulnerability reporting:

1. Buka tab **Security** di repo <https://github.com/ahmadngiliyun00/raptor13>.
2. Pilih **Report a vulnerability**.
3. Jelaskan dampak, langkah reproduksi, versi game (layar Tentang atau `?diag=1`), dan browser atau perangkat.

Jangan laporkan kerentanan lewat issue publik, Discussions, atau media sosial sebelum diperbaiki. Bila fitur
pelaporan pribadi belum aktif, buka issue tanpa detail teknis yang meminta jalur pribadi, lalu pengelola akan
menghubungi Anda.

## Versi yang didukung

| Versi | Didukung |
| --- | --- |
| Rilis terbaru (lihat CHANGELOG) | Ya |
| Rilis minor sebelumnya | Hanya perbaikan keamanan berat |
| Versi lebih lama | Tidak |

## Waktu tanggap

- Konfirmasi laporan diterima: paling lambat 7 hari.
- Penilaian awal dan rencana perbaikan: paling lambat 14 hari.
- Perbaikan dirilis secepatnya sesuai tingkat keparahan. Pelapor dicantumkan di catatan rilis bila bersedia.

## Ruang lingkup

Yang termasuk:

- `index.html` dan berkas yang disajikan, termasuk CSP, validasi data localStorage, dan hook debug yang bocor
  tanpa `?debug=1`;
- service worker;
- APK Android dan proyek iOS;
- workflow CI.

Yang tidak termasuk:

- kecurangan skor lokal yang hanya memengaruhi perangkat sendiri;
- kerentanan di browser atau sistem operasi itu sendiri.

## Praktik keamanan proyek

- Tanpa jaringan, cookie, pelacak, atau analitik.
- CSP ketat dengan hash skrip.
- Pustaka ditanam lokal dengan integrity sha384.
- Data tersimpan divalidasi skemanya.
- Keystore dan sandi rilis tidak pernah berada di repo atau log CI.
