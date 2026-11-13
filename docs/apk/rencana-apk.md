# Rencana APK Android RAPTOR13 (B8, dokumen saja)

Status: **rencana, belum diimplementasikan.** Tidak ada proyek Android, tombol unduh, atau perubahan
`index.html` untuk APK di repo ini. Dokumen ini disusun 13 November 2026 untuk RAPTOR13 versi 2.3.0.

## Ringkasan rekomendasi

1. **Tahap 1: PWA yang bisa dipasang.** Manifest sudah ada. Yang perlu ditambahkan: service worker, ikon
   maskable, dan izin `worker-src 'self'` di CSP. Ini paling murah dan menjadi fondasi tahap berikutnya.
2. **Tahap 2: APK lewat Trusted Web Activity (TWA) dengan Bubblewrap.** Ini **rekomendasi utama.** APK
   didistribusikan langsung di halaman game dan di GitHub Releases.
3. **Tahap 3: Google Play Store**, belakangan, memakai berkas AAB dari proyek Bubblewrap yang sama.

Alasan memilih TWA:

- **Satu file, langsung jadi.** Game sudah satu `index.html` dan sudah dideploy di
  `https://raptor13.ngiliyun.my.id` lewat `git pull`. TWA hanya membungkus situs itu, jadi setiap pembaruan
  situs langsung sampai ke aplikasi tanpa membangun APK baru.
- **Mesin yang sama dengan yang sudah diuji.** TWA memakai Chrome yang terpasang di HP, mesin yang sama
  dengan yang dipakai pengujian dan audit performa (WebGL2, batas FPS, resolusi dinamis).
- **Ringan.** APK sekitar 1 sampai 2 MB, izinnya minimum, dan cocok dengan Play Store.
- **Layar penuh landscape tanpa bilah browser.** Haptik (`navigator.vibrate`) dan Wake Lock jalan karena
  ini tetap Chrome.

**Catatan jujur soal kata "lebih lancar".** TWA tidak membuat game lebih cepat dari Chrome biasa. Mesinnya
sama. Keuntungannya adalah layar penuh imersif tanpa bilah alamat, orientasi landscape terkunci, ikon di
layar utama, dan tidak ada gestur browser yang tidak sengaja (zoom, tarik untuk muat ulang). Jadi teks
ajakan di game sebaiknya "Main layar penuh di aplikasi Android", bukan "lebih lancar".

## 1. Perbandingan opsi

| Opsi | Cara kerja | Ukuran APK | Performa Three.js | Kemudahan | Play Store | Layar penuh landscape | Haptik dan wake lock | Perawatan | Risiko |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a. PWA terpasang | Manifest dan service worker; dipasang dari Chrome lewat "Instal aplikasi" | Tanpa APK | Sama dengan Chrome | Paling mudah, hanya berkas web | Tidak langsung (perlu TWA) | Ya (`display: fullscreen`, `orientation: landscape` sudah ada) | Ya, API web | Rendah | Pemain harus tahu menu "Instal"; di iOS hanya "Tambahkan ke Layar Utama" |
| b. TWA (Bubblewrap) | APK kecil yang membuka situs di Chrome tanpa bilah browser; kepemilikan domain dibuktikan dengan Digital Asset Links | Sekitar 1 sampai 2 MB | Sama dengan Chrome (mesin yang sudah diuji) | Mudah: CLI Bubblewrap, satu konfigurasi | Ya, jalur resmi Google untuk PWA | Ya, imersif, orientasi dikunci di APK | Ya (Chrome) | Rendah: pembaruan situs langsung sampai | Butuh Chrome atau browser pendukung TWA di HP; tanpa internet hanya jalan bila service worker sudah menyimpan aset |
| c. Capacitor (WebView) | Aset web dibundel di dalam APK, dijalankan di Android System WebView, plugin native | Sekitar 4 sampai 8 MB | Hampir sama; WebView diperbarui lewat Play, tetapi di HP lama bisa tertinggal | Sedang: butuh Android Studio dan Gradle | Ya | Ya, plugin Screen Orientation dan mode imersif | Ya, plugin Haptics dan Keep Awake (lebih andal dari API web) | Sedang: tiap rilis game harus membangun dan menandatangani APK baru | Versi WebView beragam di lapangan, ukuran naik, beban rilis lebih berat |
| d. Expo (React Native) | Aplikasi React Native; Three.js lewat expo-gl dan expo-three, atau game dibungkus WebView | 25 MB ke atas | expo-gl: perlu port renderer, post-processing, dan input; WebView: sama dengan Capacitor, tetapi lebih berat | Sulit untuk game satu file yang sudah jadi | Ya | Ya | Ya | Tinggi: dua basis kode | Biaya adaptasi besar tanpa manfaat bagi game web yang sudah jadi |
| e. PWABuilder atau pembuat APK online | Layanan membuat paket TWA dari URL | Sekitar 1 sampai 2 MB (TWA) | Sama dengan TWA | Paling cepat (klik) | Ya | Ya | Ya | Rendah | Kunci penandatanganan dibuat atau disimpan pihak ketiga bila tidak hati-hati; layanan lain yang tidak jelas bisa menyisipkan iklan atau pelacak |

**Kapan Expo masuk akal.** Bila suatu hari dibuat game native baru dari nol yang butuh banyak fitur native
(notifikasi, pembelian dalam aplikasi, sensor) dan tim memang memakai React. Untuk RAPTOR13 yang sudah jadi
sebagai satu file web, Expo tidak sebanding.

**Kapan Capacitor lebih baik dari TWA.** Bila game harus berjalan penuh tanpa internet sejak pertama dibuka,
bila versi aplikasi harus dibekukan per rilis, atau bila Play Store menolak TWA (jarang). Capacitor menjadi
cadangan.

**PWABuilder** boleh dipakai sebagai pembanding hasil, tetapi kunci penandatanganan harus dibuat sendiri
secara lokal dan tidak pernah diunggah.

## 2. Arsitektur distribusi

- **Tempat berkas.** APK dilampirkan ke GitHub Release setiap tag versi (`vX.Y.Z`) di
  `github.com/ahmadngiliyun00/raptor13`.
- **Nama berkas:**
  - versi: `raptor13-vX.Y.Z.apk`;
  - nama tetap untuk tautan "terbaru": `raptor13-android.apk` (berkas yang sama);
  - checksum: `raptor13-vX.Y.Z.apk.sha256`, isinya satu baris hasil `sha256sum`.
- **Tautan stabil terbaru.** GitHub menyediakan
  `https://github.com/ahmadngiliyun00/raptor13/releases/latest/download/raptor13-android.apk`. Tautan ini
  hanya berfungsi bila nama berkasnya tetap, karena itu ada nama `raptor13-android.apk` di atas.
- **Catatan rilis** memuat:
  - ukuran berkas (target di bawah 3 MB);
  - checksum SHA-256;
  - sidik jari sertifikat penandatanganan (SHA-256);
  - versi Android minimal;
  - tanggal.
- **Versi Android minimal.** Rekomendasinya `minSdk 29` (Android 10). Chrome terbaru sudah tidak mendukung
  Android 8 dan 9 sejak pertengahan 2025 (periksa lagi saat membangun). Tanpa Chrome yang mutakhir, WebGL2
  dan TWA tidak terjamin. Secara teknis Bubblewrap bisa memakai minSdk yang lebih rendah, tetapi perangkat
  itu akan memakai Chrome lama atau jatuh ke tab browser biasa.
- **Tempat tautan di game** (belum diimplementasikan):
  - kartu sekali tampil di menu utama khusus Android;
  - baris di layar Tentang atau Credits;
  - halaman `docs/apk/pasang.md` di repo untuk petunjuk lengkap.

## 3. Rancangan UI di game (belum diimplementasikan)

- **Deteksi.** Kartu hanya tampil bila semua syarat ini terpenuhi:
  - `/Android/i.test(navigator.userAgent)`;
  - bukan mode terpasang: `matchMedia('(display-mode: standalone)')`, `fullscreen`, dan
    `document.referrer` yang diawali `android-app://` (tanda dibuka dari TWA) semuanya tidak cocok;
  - belum pernah ditolak.

  Disembunyikan di iOS, iPadOS, dan desktop.
- **Kartu kecil** di bawah tombol menu utama atau di layar Tentang, sekali per sesi sampai ditolak:
  - judul: "Main layar penuh di aplikasi Android";
  - isi satu baris: "APK resmi, sekitar 2 MB, gratis dan tanpa iklan.";
  - tombol: **Unduh**, **Nanti**, dan kotak centang **Jangan tampilkan lagi**.

  Pilihan disimpan di localStorage lewat adaptor `Store` yang sudah ada, kunci `raptor13.apkHint`, dengan
  nilai `ditolak` atau tanggal terakhir tampil. Tombol Unduh membuka panel petunjuk sebelum mengunduh.
- **Panel petunjuk pasang** (teks jujur):
  1. Unduh hanya dari `raptor13.ngiliyun.my.id` atau GitHub resmi.
  2. Saat diminta, izinkan "Instal aplikasi tidak dikenal" untuk browser yang dipakai. Matikan lagi setelah
     selesai.
  3. Google Play Protect bisa memperingatkan "aplikasi tidak dikenal" atau meminta pemindaian. Itu wajar
     untuk APK di luar Play Store. Lanjutkan hanya bila APK diunduh dari tautan resmi.
  4. Opsional, verifikasi checksum: bandingkan SHA-256 berkas dengan yang ada di catatan rilis. Di komputer
     pakai `sha256sum raptor13-vX.Y.Z.apk` (Linux, macOS: `shasum -a 256`) atau `certutil -hashfile ...
     SHA256` (Windows). Di HP pakai aplikasi pengelola berkas yang menampilkan hash.
- **Kebijakan distribusi di luar Play Store.** Android mengizinkan pemasangan dari sumber lain dengan izin
  pengguna. **Penting untuk Indonesia:** menurut pengumuman Google pada Agustus 2025, mulai September 2026
  aplikasi yang dipasang di perangkat Android bersertifikat di Brasil, Indonesia, Singapura, dan Thailand
  harus berasal dari **developer yang terverifikasi**. Nama paket dan kunci penandatanganan harus
  didaftarkan di Android Developer Console, termasuk untuk APK yang tidak lewat Play Store. Pemilik sudah
  punya akun developer Play, jadi verifikasi identitas dan pendaftaran nama paket
  (misalnya `id.my.ngiliyun.raptor13`) harus dilakukan **sebelum** APK dibagikan. Status dan rincian
  aturan ini harus dicek ulang di dokumentasi resmi Google saat membangun, karena bisa berubah.

## 4. Penandatanganan dan keamanan

- **Keystore tidak pernah masuk repo.** Tambahkan `*.keystore`, `*.jks`, `android/`, dan `twa-manifest.json`
  yang memuat jalur kunci ke `.gitignore` sebelum proyek Bubblewrap dibuat. Pemindaian rahasia dari audit A3
  (`docs/audit/keamanan.md`) dijalankan lagi sebelum setiap push.
- **Penyimpanan kunci:**
  - simpan di password manager (berkas dan dua kata sandinya);
  - simpan cadangan terenkripsi di dua tempat terpisah (misalnya flashdisk di rumah dan penyimpanan awan
    pribadi terenkripsi).

  Kehilangan kunci berarti APK sideload tidak bisa diperbarui; pemain harus menghapus dan memasang ulang.
- **Data kunci:** alias `raptor13`, RSA 2048 atau 4096, masa berlaku minimal 30 tahun (Play mensyaratkan
  sertifikat berlaku setelah 22 Oktober 2033).
- **Play App Signing (tahap 3).** Google menyimpan *kunci aplikasi*, pemilik memegang *kunci unggah*.
  - Bila APK sideload ditandatangani dengan kunci yang berbeda dari kunci aplikasi Play, pemain tidak bisa
    berpindah antar jalur tanpa memasang ulang.
  - Pilihan yang disarankan: memakai kunci yang sama sejak awal (unggah kunci sendiri ke Play App Signing
    sebagai kunci aplikasi), atau menerima bahwa versi Play dan versi GitHub adalah dua pemasangan berbeda.
  - Untuk TWA, `/.well-known/assetlinks.json` di domain harus memuat **kedua** sidik jari SHA-256 (kunci
    sideload dan kunci aplikasi Play).
- **Mencegah APK palsu:**
  - tautan hanya dari domain resmi dan GitHub resmi;
  - checksum dan sidik jari sertifikat dipublikasikan di catatan rilis dan di halaman Tentang;
  - pemain diminta tidak memasang RAPTOR13 dari sumber lain;
  - Digital Asset Links juga mencegah APK lain menampilkan situs dalam mode TWA tanpa bilah alamat.

## 5. Pipeline build (rencana)

Prasyarat PWA (tahap 1):

1. `sw.js` dengan cache bernama `raptor13-<GAME_VERSION>` berisi `index.html`, `vendor/three-0.187.0/...`,
   ikon, dan manifest. Strategi: dokumen *network first* agar pembaruan cepat sampai, aset bervendor *cache
   first*. Cache lama dibersihkan saat versi berganti.
2. CSP diubah `worker-src 'none'` menjadi `worker-src 'self'`, lalu didaftarkan dari skrip ber-hash yang sama
   (`node tests/csp.mjs --write`). Header server di aaPanel ikut disesuaikan
   (`docs/deploy/security-headers.md`).
3. Ikon maskable 512x512 dengan zona aman 80 persen (`purpose: maskable`) di samping ikon yang ada.
4. Uji Lighthouse PWA dan uji Playwright: service worker terdaftar, berjalan tanpa jaringan setelah kunjungan
   pertama, tidak ada error CSP.

Langkah TWA (tahap 2):

```bash
npm install -g @bubblewrap/cli          # sekali, membutuhkan JDK 17 dan Android SDK (diunduh Bubblewrap)
bubblewrap init --manifest https://raptor13.ngiliyun.my.id/manifest.webmanifest
# isi: packageId id.my.ngiliyun.raptor13, display fullscreen, orientation landscape, minSdk 29,
#      warna #0b1622, ikon maskable, tanpa izin notifikasi, kunci di luar folder repo
bubblewrap build                         # menghasilkan app-release-signed.apk dan app-release-bundle.aab
bubblewrap fingerprint add <SHA-256>     # sidik jari untuk assetlinks.json
sha256sum app-release-signed.apk > raptor13-v2.3.0.apk.sha256
```

- **Versi.** `versionName` sama dengan `GAME_VERSION` (misalnya `2.3.0`). `versionCode` dihitung
  `mayor x 10000 + minor x 100 + patch`, jadi 2.3.0 menjadi 20300. Selalu naik, cocok dengan semver dan tag
  git.
- **Ikon adaptif dan splash.** Ikon adaptif memakai logo `icons/favicon.svg` yang sudah orisinal. Lapisan
  depan adalah logo, lapisan belakang warna `#0b1622`. Splash memakai warna latar dan logo yang sama.
- **Orientasi dan layar.** Orientasi landscape dikunci di APK. Layar penuh imersif: bilah status dan navigasi
  disembunyikan, muncul dengan geser dari tepi.
- **Tombol Back** (perlu sedikit kode game di tahap 2, bukan sekarang). Saat sesi bermain, game menambah satu
  entri riwayat (`history.pushState`). Event `popstate` membuka menu jeda alih-alih menutup aplikasi. Di menu
  utama, Back menutup aplikasi seperti biasa.
- **Izin.** Hanya `INTERNET` (bawaan TWA). Tanpa lokasi, kamera, mikrofon, kontak, atau notifikasi. Getar
  lewat API web tidak membutuhkan izin berbahaya.
- **Uji:**
  - emulator Android Studio (API 29, 33, dan 35, dengan Chrome terbaru);
  - minimal dua HP nyata: satu kelas bawah (RAM 3 sampai 4 GB) dan satu kelas menengah;
  - fokus: layar penuh, orientasi, Back, Wake Lock, haptik, FPS (overlay F3 dan `?diag=1`), panas setelah 15
    menit, dan pemasangan ulang di atas versi lama.
- **Otomatisasi GitHub Actions** (opsional, setelah alur manual stabil). Workflow `release-apk.yml` dipicu
  oleh push tag `v*`:
  1. setup JDK 17 dan Node;
  2. pasang Bubblewrap;
  3. pulihkan keystore dari secret base64 ke folder sementara;
  4. jalankan `bubblewrap build`;
  5. hitung SHA-256;
  6. unggah `raptor13-vX.Y.Z.apk`, `raptor13-android.apk`, dan berkas checksum ke Release dengan `gh`;
  7. hapus keystore sementara.

  Secret: `KEYSTORE_B64`, `KEYSTORE_PASSWORD`, `KEY_PASSWORD`. Repo publik, jadi workflow hanya berjalan pada
  tag dari pemilik, bukan pada pull request dari fork.

## 6. Beta test dan umpan balik

- **Formulir** Google Form atau Tally, dengan pertanyaan siap pakai:
  1. Merek dan model HP
  2. Versi Android
  3. Versi game (terlihat di menu dan layar Tentang)
  4. Ukuran layar atau jenis (HP, tablet)
  5. Browser atau cara bermain (Chrome, Safari, aplikasi APK)
  6. Mode kontrol (HP sentuh atau keyboard) dan kualitas grafis
  7. FPS terasa (skala 1 sampai 5) dan angka FPS dari overlay F3 bila sempat dilihat
  8. Apakah HP terasa panas setelah 10 menit (tidak, hangat, panas)
  9. Bug yang ditemukan: apa yang terjadi, langkah untuk mengulang, screenshot bila ada
  10. Bagian yang paling disukai
  11. Saran perbaikan
  12. Boleh dihubungi lagi? (opsional, kontak hanya bila pengisi mau)
- **Tombol "Lapor Bug" di game** (belum diimplementasikan):
  - letak: di menu jeda dan layar Tentang;
  - cara kerja: membuka tautan formulir di tab baru dengan isian diagnostik otomatis lewat parameter URL
    (fitur prefill Google Form atau Tally): versi game, kualitas grafis, mode performa, mode kontrol, ukuran
    layar dan pixel ratio, FPS rata-rata dari `Perf`, user agent;
  - **tanpa data pribadi**, dan pemain bisa melihat serta mengubah isian sebelum mengirim;
  - membuka tautan adalah navigasi biasa, jadi tidak bertentangan dengan CSP `connect-src 'none'`.
- **Kebijakan privasi singkat** (dibutuhkan juga untuk Play Store):
  - game tidak mengumpulkan data pribadi dan tidak memakai pelacak, iklan, atau analitik;
  - progres dan pengaturan disimpan di perangkat (localStorage);
  - formulir umpan balik bersifat sukarela, dan datanya diproses oleh penyedia formulir.

  Diletakkan di `docs/privasi.md` dan di halaman situs.
- **Kanal beta:**
  - sekarang: grup tester (WhatsApp atau Telegram) dan GitHub pre-release (`vX.Y.Z-beta.N`);
  - nanti: Google Play Internal Testing, lalu Closed Testing (lihat bagian 7).

## 7. Kesiapan Play Store (daftar periksa untuk nanti)

- [x] Akun developer Google Play (sudah ada)
- [ ] Verifikasi identitas developer dan pendaftaran nama paket (juga wajib untuk APK sideload di Indonesia,
      lihat bagian 3)
- [ ] URL kebijakan privasi
- [ ] Penilaian konten (kuesioner IARC): kekerasan fantasi terhadap kapal dan robot, tanpa darah, tanpa
      interaksi pengguna. Perkiraan rating rendah (sekitar 7 tahun ke atas), dipastikan oleh kuesioner.
- [ ] Formulir keamanan data: tidak ada data yang dikumpulkan atau dibagikan
- [ ] Ikon 512x512, grafik fitur 1024x500 (dari `icons/og-image.jpg` yang disesuaikan)
- [ ] Minimal 4 tangkapan layar landscape 16:9 (bisa dari `docs/screenshots/`)
- [ ] Target API level sesuai syarat terbaru: API 35 (Android 15) untuk aplikasi baru sejak 31 Agustus 2025.
      Syarat ini naik tiap tahun, jadi kemungkinan API 36 untuk unggahan setelah Agustus 2026. Cek halaman
      kebijakan saat mengunggah.
- [ ] Uji tertutup wajib untuk akun pribadi yang dibuat setelah 13 November 2023: minimal 12 tester ikut
      selama 14 hari berturut-turut sebelum bisa mengajukan produksi
- [ ] Digital Asset Links memuat sidik jari kunci aplikasi Play
- [ ] Deskripsi singkat dan lengkap dalam Bahasa Indonesia (dan Inggris bila mau)

Perkiraan waktu sampai tayang di Play: 3 sampai 5 minggu sejak AAB pertama siap. Rinciannya: 14 hari uji
tertutup ditambah waktu peninjauan Google, yang untuk akun baru bisa beberapa hari sampai lebih dari seminggu.

## 8. Risiko, hal yang belum diketahui, perkiraan waktu, dan urutan kerja

**Risiko dan hal yang belum diketahui:**

- **Verifikasi developer Google untuk Indonesia.** Aturan, biaya, dan alur pastinya harus dicek saat
  membangun. Bila verifikasi belum selesai, APK sideload bisa ditolak di HP bersertifikat.
- **Chrome atau mesin TWA di HP pemain.** Ada HP tanpa Chrome (misalnya sebagian HP tanpa layanan Google) atau
  dengan Chrome lama. TWA lalu jatuh ke tab browser biasa (masih jalan, tetapi tidak imersif). Perlu diuji di
  satu HP seperti itu.
- **Performa di HP kelas bawah tidak berubah.** Aplikasi tidak membuat GPU lebih cepat. Yang membantu tetap
  kualitas Rendah, batas FPS, dan resolusi dinamis dari audit A2.
- **Service worker dan pembaruan.** Cache yang salah bisa membuat pemain tertahan di versi lama. Perlu uji
  pembaruan versi dan strategi network first untuk dokumen.
- **Header server aaPanel.** CSP di header server harus ikut diubah untuk `worker-src`. Bila lupa, PWA dan TWA
  gagal tanpa pesan jelas.
- **Kunci penandatanganan hilang.** Pembaruan APK sideload tidak bisa dilakukan. Mitigasinya cadangan di dua
  tempat.
- **Play Protect.** Peringatan untuk APK sideload tidak bisa dihilangkan sepenuhnya. Verifikasi developer dan
  rilis yang konsisten mengurangi peringatan.

**Perkiraan biaya waktu:**

| Tahap | Pekerjaan | Perkiraan |
| --- | --- | --- |
| 1 | PWA: service worker, CSP dan header, ikon maskable, uji | 1 sampai 2 hari |
| 2a | Verifikasi developer dan nama paket di Google | 1 sampai 7 hari (bergantung pada Google) |
| 2b | TWA Bubblewrap: konfigurasi, kunci, assetlinks.json, build, uji emulator dan 2 HP | 2 sampai 3 hari |
| 2c | Kartu unduh, panel petunjuk, tombol Back ke jeda, Lapor Bug, halaman privasi | 1 sampai 2 hari |
| 2d | Rilis GitHub dengan checksum, catatan, dan tautan stabil; workflow Actions (opsional) | 0,5 sampai 1 hari |
| 3 | Play Store: listing, rating, keamanan data, 14 hari uji tertutup, peninjauan | 3 sampai 5 minggu kalender (kerja aktif sekitar 2 hari) |

**Urutan kerja yang disarankan:**

1. PWA, dan pastikan Lighthouse PWA hijau di situs live.
2. Verifikasi developer dan pendaftaran nama paket (bisa berjalan paralel dengan langkah 1).
3. Keystore dibuat dan dicadangkan; `.gitignore` diperbarui.
4. TWA dengan Bubblewrap; `assetlinks.json` dipasang di server; uji di emulator dan HP nyata.
5. Rilis beta di GitHub (pre-release) untuk grup tester, bersama formulir umpan balik.
6. Kartu unduh dan petunjuk di game, rilis stabil dengan tautan `latest`.
7. Play Store: AAB dari proyek yang sama, uji tertutup 14 hari, produksi.
