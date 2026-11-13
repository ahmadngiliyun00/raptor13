# Dependensi dan rantai pasok (A3 butir 7)

Diperiksa 13 November 2026.

## Runtime (dimuat oleh browser)

| Paket | Versi | Lisensi | Sumber | Cara dimuat | Advisori |
| --- | --- | --- | --- | --- | --- |
| three | 0.187.0 (r187, versi terbaru di npm saat diperiksa) | MIT, salinan di `vendor/three-0.187.0/LICENSE` | tarball npm resmi `three-0.187.0.tgz` | ditanam lokal di `vendor/three-0.187.0/`, dipetakan importmap dengan integrity sha384 | `npm audit`: 0 kerentanan |

Berkas yang ditanam (tidak diubah sedikit pun dari paket npm):

- `build/three.module.js`, `build/three.core.js`
- `examples/jsm/postprocessing/EffectComposer.js`, `RenderPass.js`, `UnrealBloomPass.js`, `OutputPass.js`,
  `ShaderPass.js`, `MaskPass.js`, `Pass.js`
- `examples/jsm/shaders/CopyShader.js`, `LuminosityHighPassShader.js`, `OutputShader.js`

Verifikasi asal:

- Integrity tarball dari registry npm: `sha512-Qiu7R+Cmh8CstZsY1uJOSWnVlfo7ZtNLV7mF8Jltk3LB3AtDu9cRZlcnRKkAk8Y4z6KKw35z7Y7Urd7jWY8etA==`
  (cocok dengan `npm view three@0.187.0 dist.integrity`), SHA-256 tarball
  `ff540832ded0cfe919764d24a3d88f3e2a05f23303f876423e4f893841e90728`.
- `three.module.js`, `three.core.js`, dan `UnrealBloomPass.js` dibandingkan byte per byte dengan berkas yang
  sebelumnya dimuat dari jsDelivr: identik.
- Integrity sha384 tiap modul ada di importmap `index.html` dan diperiksa ulang oleh `node tests/csp.mjs`
  (juga dijalankan uji `tests/audit.spec.mjs`). Browser menolak modul yang isinya berubah.

Mengapa ditanam lokal, bukan CDN: tidak ada permintaan ke pihak ketiga (privasi, tidak ada alamat IP
pemain yang terkirim ke CDN), game tetap jalan bila CDN gangguan, dan CSP bisa memakai `script-src 'self'`.

Ukuran: paket npm 0.187.0 tidak menyertakan berkas `.min.js` (versi `.min` di jsDelivr dibuat otomatis
oleh CDN). Minifikasi lokal dengan alat seperti terser tidak dilakukan pada audit ini (unduh dan jalankan
alat baru tidak diizinkan di lingkungan kerja), sehingga berkas resmi dipakai apa adanya: 2,13 MB sebelum
kompresi, sekitar 420 KB dengan gzip (three.core.js 290 KB, three.module.js 129 KB) dan lebih kecil dengan Brotli di server (lihat
`docs/deploy/security-headers.md`). Tree shaking modul yang tidak dipakai membutuhkan bundler dan
bertentangan dengan aturan tanpa build step.

Pembaruan Three.js berikutnya: unduh tarball resmi (`npm pack three@VERSI`), periksa integrity, salin
berkas di atas ke `vendor/three-VERSI/`, ubah `VENDOR` di `tests/csp.mjs`, jalankan
`node tests/csp.mjs --write`, lalu seluruh uji.

## Pengembangan (tidak dikirim ke pemain)

| Paket | Versi | Lisensi | Kegunaan | Advisori |
| --- | --- | --- | --- | --- |
| @playwright/test | 1.65.0 | Apache-2.0 | uji otomatis | `npm audit`: 0 kerentanan |

`node_modules/` tidak dilacak git dan diblokir di server.

## Aset lain

Tidak ada font, gambar, audio, atau skrip pihak ketiga. Ikon dan gambar pratinjau di `icons/` dibuat
sendiri dan tidak berisi metadata EXIF, GPS, atau XMP.
