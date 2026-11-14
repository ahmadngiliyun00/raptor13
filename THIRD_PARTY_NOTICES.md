# Pemberitahuan pihak ketiga (THIRD_PARTY_NOTICES)

RAPTOR13 menanam pustaka berikut di dalam repo dan di dalam game yang disajikan:

| Pustaka | Versi | Lisensi | Lokasi |
| --- | --- | --- | --- |
| three.js | 0.187.0 (berkas resmi npm `three`) | MIT | `vendor/three-0.187.0/`, dimuat lewat importmap dengan integrity sha384 |

Pemberitahuan lisensi three.js juga ada di `vendor/three-0.187.0/LICENSE`, dan dirujuk lewat komentar di kepala
`index.html`.

## Alat pengembangan (tidak ikut disajikan ke pemain)

| Alat | Lisensi | Kegunaan |
| --- | --- | --- |
| @playwright/test | Apache-2.0 | Uji otomatis (`npm test`) |

Bila APK Android atau proyek iOS dibuat (folder `mobile/`), Capacitor dan pluginnya akan didaftarkan di sini
beserta lisensinya.

Semua suara disintesis dengan Web Audio. Semua model, tekstur, dan ikon dibuat oleh kode proyek ini. Tidak ada
aset pihak ketiga lain, font eksternal, atau CDN.

## Teks lisensi three.js

```
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
