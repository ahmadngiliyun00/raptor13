# Catatan perubahan

Semua perubahan penting RAPTOR13 dicatat di berkas ini. Format mengikuti
[Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan penomoran mengikuti
[Semantic Versioning](https://semver.org/lang/id/). Tanggal diambil dari riwayat git (WIB, UTC+7).
Bukti pemilihan commit tiap tag ada di `docs/rilis/rencana-tag.md`.

## [Belum dirilis]

### Ditambahkan
- **Piko terbang mandiri (E3).** Piko bergerak dengan pegas teredam di bingkai yang ikut kapal:
  - tertinggal dan terayun saat belok;
  - idle hidup;
  - menoleh ke bos, musuh, atau pickup;
  - tidak menembus lambung dan tidak menutupi crosshair.
- **Piko menempel ke sisi lambung (E4).** Piko menempel saat nitro, kecepatan tinggi, manuver, belok tajam,
  cutscene, atau dekat permukaan benda besar. Ada histeresis dan waktu minimum, lalu Piko keluar dengan lompatan
  kecil.
- **Senjata bertingkat berbasis hardpoint (E5).** Tingkat 1 memakai dua laras bergantian, tingkat 2 dua laras
  serempak (DPS 1,8 kali), dan tingkat 3 empat laras dalam pasangan bergantian (DPS 3,14 kali, terukur).
  - Laras terlihat di model: ujung keempat sayap kapal angkasa, pod bawah sayap dan meriam akar sayap Raptor-J,
    serta laras badan Gunship.
  - Laras baru memanjang dan menyala, dengan recoil dan kilat moncong per laras.
  - Semua laras menyatu di titik temu 120 satuan di depan.
  - Perolehan lewat kartu level Peningkatan Senjata, hadiah stage 3 dan 7, dan hadiah kontrak. Tingkat tersimpan
    per kapal.
  - Indikator tingkat di tombol Tembak (mode HP), di baris LEVEL (desktop), dan di hangar.
  - Saran Piko satu kali.
  - Rincian: `docs/senjata/keseimbangan.md`.

- **Diagnosis kehalusan penerbangan (E6).** Perekam per frame `FlightProbe` dan skenario berskrip langkah tetap
  (`debug.flightRun`, `debug.flightTrace`, hanya dengan `?debug=1`). Skrip `tests/penerbangan/diagnosis.mjs`
  menghasilkan CSV, grafik PNG, dan metrik ambang. Hasilnya di `docs/penerbangan/diagnosis-halus.md`.

- **Penerbangan halus (E7).** Semua 10 skenario diagnosis kini lolos di Starfighter dan Raptor-J. Sebelumnya hanya
  looping yang lolos.
  - Laju sudut orde dua dengan percepatan dan hentakan terbatas (kurva S) untuk pitch, bank, dan belok.
  - Pemulihan berlengkung ke horizon terdekat dengan laju a/v dalam 2,4 sampai 2,6 detik. Sebelumnya ada sentakan
    roll 12,2 rad/s setelah menanjak.
  - Bank dengan pegas teredam, dan belokan memudar mulus menjelang bank 90 derajat.
  - Kamera dengan tanda atas kontinu dan laju putar dibatasi, tanpa flip 13 derajat per frame saat gulung dan balik.
  - Batas atas Bumi lunak: kecepatan vertikal berubah paling banyak 2,4 u/s per frame, sebelumnya 39,6.
  - Manuver memakai smootherstep.
  - Rincian di `docs/penerbangan/perbaikan.md`.

### Diubah
- Laju pitch 1,7 menjadi 1,8 rad/s untuk mengganti waktu ramp. Sudut yang ditempuh dalam 1 detik tetap setara.
- Kurangi gerakan kini juga membuat kamera tidak ikut roll.
- Uji "W dan S mengubah pitch" menahan W 0,7 detik, bukan 1,2 detik. Menahan 1,2 detik membawa kapal melewati puncak,
  dan kapal kini berguling tegak dengan halus, bukan seketika.
- Titik temu peluru 160 menjadi 120 satuan.
- Anggaran peluru pemain 80 menjadi 128.
- Suara tembak satu kali per voli, berlapis dengan gain 1 per akar jumlah laras, paling banyak 8 suara.
- Uji keseimbangan bot peralatan kini memakai rata-rata 3 seed. Satu seed terlalu peka terhadap urutan RNG.
- Uji Piko E3 kini mengukur lompatan Piko di ruang dunia relatif posisi kapal. Bingkai lokal kapal ikut berputar saat
  laju roll melompat ketika A ditekan (ditangani E7), walau posisi dunia Piko tetap kontinu.
- Uji perilaku bos B5 kini menilai kontak dari rata-rata tiga kesulitan, di bawah 2 per menit, dengan batas per
  kesulitan 4 kontak dalam 90 detik. Kontak terkuantisasi 0,67 per menit, dan commit E4 pun sudah mencapai 2,0 pada
  satu seed.

### Diperbaiki
- Percikan moncong tampil di ujung laras. Sebelumnya posisinya tertimpa vektor sementara `BulletPool.spawn`.
- Moncong Raptor-J tidak lagi berada di udara di depan sayap.
- Reaksi Piko saat kapal terkena tidak lagi memakai RNG permainan, sehingga simulasi berseed tetap dapat diulang.
- Piko kini selalu berada di lapisan tetap di scene saat bebas, sehingga jumlah anak scene sama antara keadaan bebas
  dan menempel. Uji kebocoran 20 restart sempat gagal sejak E4.
- Penanda bos ringkas kini menjaga bar HP kecilnya juga minimal 30 px dari crosshair, bukan hanya sudut braket.
- Kartu APK tidak lagi melewati 40 persen lebar layar di HP 844 px. Margin kiri kini ikut dihitung.

## [2.4.0] - 2026-11-14

Pembaruan besar: kontras tombol yang menyesuaikan latar, tata letak HUD baru dan editornya, sistem peralatan,
repo siap open source, PWA, serta aplikasi Android (APK) dan iOS.

### Ditambahkan
- **Kontras UI adaptif:**
  - tombol mode HP memakai pelat putih transparan di latar gelap dan pelat cokelat arang di latar terang;
  - cincin ganda (terang di dalam, gelap di luar) sehingga tepi selalu terlihat;
  - Transparansi kini hanya memudarkan pelat.

  Opsi Kontras UI (Otomatis, Selalu terang, Selalu gelap, Tinggi) ada di tab Akses. Kontras tepi tombol terhadap
  latar, diukur dari piksel nyata di 13 skenario, naik dari 1,1 sampai 1,6 menjadi 3,2 sampai 10,8
  (`docs/ui/kontras.md`).
- **Tata letak HUD mode HP baru:**
  - TEMBAK besar di sekitar x 88 dan y 66 persen, tidak menempel tepi bawah (26 persen tinggi layar);
  - tombol lain dalam busur untuk jempol: NITRO, ULTIMATE dengan cincin pengisian, Gulung, Balik, Loop, dan
    0 sampai 3 slot peralatan;
  - radar bulat di kiri atas, buff di kanan atas.

  Luas UI saat diam 12 sampai 21 persen. Tata letak desktop juga baru: radar kiri atas, status HP kiri bawah,
  slot peralatan berlabel Q, F, G di bawah tengah (`docs/ui/tata-letak.md`).
- **Editor tata letak HUD** (Pengaturan, tab Akses):
  - geser dengan snap grid dan ukuran per elemen;
  - zona terlarang ditandai, validasi langsung (elemen merah, SIMPAN nonaktif sampai valid);
  - preset Standar, Kidal, Ringkas;
  - disimpan per kelas ukuran layar.
- **Sistem peralatan**, dengan 9 peralatan orisinal:
  - Rudal Pencari Kunang, Kubah Energi, Perisai Reaktif Sisik, Meriam Rel Tombak Magnet, Gelombang Pengacau,
    Umpan Panas Suar Kelip, Ranjau Antariksa Biji Besi, Rajut Nano, Magnet Tarik;
  - slot per kapal (Starfighter 0 dengan sifat pasif, Raptor-J 1, Interceptor 2, Gunship 3);
  - panel Peralatan di hangar dan layar pra-misi;
  - perolehan lewat stage, kontrak, penemuan, dan kartu Cetak Biru;
  - Peti Suplai dan Peti Peralatan;
  - saran Piko, suara sintesis unik, getar.

  Kubah dan Sisik tidak menyelamatkan dari tabrakan fatal (`docs/equipment/`).
- **PWA:**
  - manifest dengan ikon maskable;
  - service worker: network-first untuk halaman, cache-first untuk ikon dan pustaka, cache terikat versi;
  - bisa dimainkan luring;
  - toast Versi baru tersedia hanya di luar permainan;
  - tombol Pasang aplikasi di Android.
- **Aplikasi Android (Capacitor 8.6.2):**
  - layar penuh imersif, landscape terkunci, layar tetap menyala;
  - tombol Kembali membuka Jeda;
  - ikon adaptif dan splash gelap orisinal;
  - APK rilis bertanda tangan 2,4 MB, diuji di emulator.

  Workflow GitHub Actions membangun APK dan AAB saat tag dirilis.
- **Proyek iOS (Capacitor).** Build simulator lolos dan menu berjalan di simulator iPhone 17 Pro. Panduan PWA,
  Xcode, dan TestFlight ada di `docs/ios/panduan-ios.md`.
- **Tombol Lapor Bug** di menu Jeda dan layar Tentang: info diagnostik tanpa data pribadi, membuka New Issue
  GitHub selama formulir beta belum diisi.
- **Kartu unduh APK** di menu, hanya di browser Android.
- **Berkas open source:**
  - LICENSE (MIT), LICENSE-CONTENT.md (CC BY 4.0), TRADEMARKS.md, THIRD_PARTY_NOTICES.md;
  - CONTRIBUTING.md dwibahasa dengan DCO dan kebijakan kontribusi berbantuan AI;
  - CODE_OF_CONDUCT.md, SECURITY.md, SUPPORT.md;
  - templat issue dan PR, CODEOWNERS, dependabot;
  - CI dengan pemeriksa gaya, pemindai rahasia, dan validasi HTML;
  - ARCHITECTURE.md, ROADMAP.md, 13 issue awal.
- **Hook debug baru** (hanya `?debug=1`):
  - `uiContrast`, `hudLayout`, `setEquipSlots`, `hudEditor`, `hudPreset`;
  - `equip`, `equipSet`, `equipUse`, `equipTest`, `equipBot`;
  - `pwa`, `nativeInfo`, `bugReport`, `freeze`.

### Diubah
- Tombol manuver mode HP kini bulat seperti tombol lain di busur. Pemeriksa tumpang tindih menguji area sentuh
  tombol bulat sebagai lingkaran, sesuai hit test browser.
- CSP: `worker-src 'self'` untuk service worker. Direktif lain tidak dilonggarkan.
- Peringatan komet desktop dipindah ke tumpukan peringatan bawah tengah agar tidak menimpa blok misi.

### Diperbaiki
- Mode kidal dengan 3 slot peralatan sempat menimpa radar. Kini radar dan tombol peta ikut dicerminkan ke
  kanan atas.
- Tombol Kembali pertama di menu aplikasi tidak lagi langsung keluar.
- Uji antrean notifikasi H9 distabilkan (rilis 2.3.1).

### Diketahui
- Situs live masih menyajikan 2.2.0 sampai `git pull` dijalankan di server. Sebelum deploy, ubah
  `worker-src` di header CSP server menjadi `'self'` (lihat `docs/pwa.md`).
- Frame di emulator Android diukur dengan render perangkat lunak dan tidak mewakili HP asli. Performa, panas,
  dan audio di HP asli serta di iPhone belum diuji.
- GitHub Secrets keystore belum diisi pemilik, jadi workflow rilis membangun APK debug. APK rilis bertanda
  tangan 2.4.0 dibangun lokal dan dilampirkan manual.

## [2.3.1] - 2026-11-14

Perbaikan bug zoom iPhone, kesiapan bos sebelum diuji pemilik, hitbox yang sesuai bentuk, dan dokumen
rencana APK. HP bos, damage senjata, HP musuh, dan hadiah tidak berubah.

### Diperbaiki
- **Game menyusut ke kiri atas setelah zoom di iPhone** (laporan pemilik, iPhone 12 Chrome iOS). Penyebabnya:
  ukuran canvas, kamera, bloom, dan HUD diambil dari `window.innerWidth`, yang di iOS ikut mengecil saat
  halaman ter-zoom. Kini semua ukuran berasal dari satu sumber, layout viewport
  (`document.documentElement.clientWidth`). Resize yang tidak mengubah layout diabaikan, ukuran tidak masuk
  akal ditolak, dan resolusi di perangkat sentuh tidak turun di bawah 0,7. Tombol Reset tampilan
  menyinkronkan ulang ukuran. Sebelum perbaikan 8 dari 8 uji tiruan iOS gagal (canvas 301 piksel pada zoom
  2,8); sesudahnya semua lolos di WebKit dan Chromium. Rincian: `docs/bug/zoom-viewport.md`.
- Bos di medan Bumi yang lebih jauh dari bidang jauh kamera kehilangan braket dan titik penandanya karena
  proyeksinya terpotong. Posisi layar penanda kini dihitung pada sinar pandang yang sama di dalam bidang jauh.
- Hitbox mengikuti bentuk yang terlihat:
  - bos memakai bola padat yang dibuat otomatis dari geometri (cakupan siluet 88 sampai 98 persen, isi kosong
    0 sampai 3 persen);
  - asteroid, komet, musuh, dan bulan yang tidak bulat memakai radius dari geometri;
  - ambang fatal kini relatif terhadap ukuran visual kapal pemain (rasio 2,0), sama untuk semua kapal.
  Audit semua objek lolos toleransi 15 persen, kecuali hitbox pemain yang sengaja pemaaf (2,6 dibanding
  visual 3,83). Rincian dan gambar wireframe: `docs/fisika/audit-hitbox.md`.
- Pembatas ekor bos diperkuat setelah 60 persen batas, karena di Sulit bos sesekali 9,5 detik di ekor dengan
  batas 9 detik.

### Ditambahkan
- Indikator bahaya fatal: bila benda fatal ada di jalur dan waktu tabrakan pendek, muncul peringatan BELOK
  SEKARANG, tepi layar merah ke arah benda, dan asteroid yang berbahaya diberi rona merah. Benda yang tidak
  fatal tidak memicu indikator.
- Penanda bos ringkas: bentuk lengkap (ikon, nama, jarak) hanya saat bos jauh dari tengah dan dari crosshair.
  Di zona tengah penanda menjadi braket tipis dan indikator HP kecil yang tiap sudutnya minimal 30 piksel dari
  crosshair dan tidak menutupi siluet; bos lebih dari 120 piksel hanya diberi bar HP tipis di atasnya.
- Titik piksel minimum bos kini 16 piksel dengan cincin gelap, aktif untuk semua bos di semua dunia, kualitas,
  dan jarak. Dari 576 kombinasi bos, dunia, jarak, kualitas, dan bloom, 0 tidak terlihat (sebelumnya 3).
- Bot terampil dan bot rata-rata untuk mengukur lama pertarungan bos (`debug.skilledBot`), dengan batasan
  kapal yang sama dengan pemain, tundaan reaksi, dan galat bidik.
- Telemetri lokal 10 pertarungan bos terakhir (hanya di perangkat), ikut dalam UNDUH LOG overlay `?diag=1`.
- Overlay `?diag=1` menampilkan layout viewport, visualViewport, skala zoom, ukuran canvas dan buffer,
  resolusi, serta jumlah event zoom yang dicegah. Templat laporan uji iPhone ada di `docs/zoom-ios.md`.
- Hook debug baru (hanya `?debug=1`): `skilledBot`, `botAccuracy`, `bossLog`, `showHitboxes`, `fatalWatch`,
  `hitboxAudit`, `layout`.
- Skrip `scripts/deploy.sh` (ssh BatchMode, `git pull --ff-only`, verifikasi hash dan versi yang disajikan,
  perintah rollback) dan `scripts/print-cert-fingerprint.sh` (sidik jari SHA-256 sertifikat, tanpa mencetak
  sandi).
- Dokumen: `docs/deploy/panduan-deploy.md`, `docs/bug/zoom-viewport.md`, `docs/fisika/audit-hitbox.md`,
  `docs/apk/keputusan.md` (Capacitor atau TWA), `docs/apk/naskah-kartu-unduh.md`,
  `docs/apk/checklist-pemilik.md`, dan bagian verifikasi developer Android di `docs/apk/rencana-apk.md`.

### Diubah
- Parameter perilaku bos (bukan HP atau damage) disetel dari hasil bot terampil. Waktu sampai kalah di
  Normal: Penjaga Raksasa 103 menjadi 93 detik, Penambang Raksasa 168 menjadi 133 detik, Pemburu Agung dari
  tidak kalah dalam 300 detik menjadi 110 detik. Sang Naga Vanta masih tidak kalah oleh bot dalam 600 detik;
  rekomendasi desain ada di `docs/bos/perilaku.md`.
- Jarak aman lintasan Penambang Raksasa 60 menjadi 72, karena bola padatnya kini lebih sesuai bentuk.

### Diketahui
- Situs live masih menyajikan 2.2.0 sampai `git pull` dijalankan di server. Mac pengembang belum punya host
  ssh, jadi deploy belum dijalankan (lihat `docs/deploy/panduan-deploy.md`).
- Perilaku zoom di iPhone asli masih perlu dipastikan pemilik dengan langkah di `docs/zoom-ios.md`.

## [2.3.0] - 2026-11-14

Petunjuk dan perilaku bos, tabrakan berbasis ukuran, dan pencegahan zoom di iPhone. HP bos, damage senjata,
HP musuh, dan hadiah tidak berubah.

### Ditambahkan
- Pelacakan bos:
  - ikon emblem orisinal per bos (tengkorak naga geometris untuk Sang Naga Vanta), digambar prosedural;
  - penanda di atas bos: braket sudut, ikon, nama, jarak, bar HP mini, dan panah arah gerak;
  - panah tepi layar berikon saat bos di luar layar; bila bos di belakang, panah menunjuk arah putar
    tercepat dengan ikon putar;
  - indikator BOS DI BELAKANG di bawah tengah (chip di mode HP);
  - pengenalan ikon besar di tepi atas yang mengecil ke baris misi, dan sorot kamera singkat pada kemunculan
    pertama tiap bos.
- Jejak bos 3 detik, titik bidik prediksi yang mengikuti Bantuan bidik, blip radar berikon dengan jejak mini,
  garis arah dan garis putus-putus, serta ikon bos di Peta Tata Surya.
- Kontur siluet bos yang menyala (satu draw call per bos) dan opsi Sorotan bos (Mati, Halus, Kuat) di tab
  Grafis. Bos yang di layar lebih kecil dari 14 piksel diberi titik bercahaya.
- Jendela rentan setelah bos berputar kembali ke depan: damage ke bos x1,6 (Mudah), x1,4 (Normal), x1,25
  (Sulit). Kontur dan penanda berkedip emas.
- Tabrakan berbasis ukuran dan energi (`COLLISION_TIERS`) dengan empat tingkat: kecil (tanpa damage),
  pantul (1 sampai 3 persen), sedang (persen HP maksimum dari energi, dengan pantulan), dan fatal. Umpan
  baliknya: kilat di sisi dampak dengan persen damage, bar HP berkedip, dan suara sesuai ukuran.
- Penjaga zoom iOS. Lapisannya: meta viewport lengkap, `touch-action`, pencegahan gesture WebKit, dua ketukan
  dan cubit di luar kontrol, serta cadangan `visualViewport` dengan tip Reset tampilan. Diuji di WebKit
  (iPhone 12 dan 14) dan Chromium (Pixel 7).
- Hook debug:
  - bos: `bossProbe`, `bossSim` (bot jelajah dan buru), `bossMetrics`, `bossChecks`, `bossFx`, `bossHud`,
    `placeBoss`;
  - tabrakan: `collisionTest`, `collisionConfig`;
  - lainnya: `zoomGuard`, `programList`.
- Skrip pengukuran di `tests/bos/` dan uji baru `tests/bos.spec.mjs` dan `tests/zoom.spec.mjs`. Playwright
  kini punya proyek webkit khusus uji zoom.
- Dokumen:
  - `docs/bos/diagnosis.md`, `docs/bos/perilaku.md`;
  - `docs/fisika/tabrakan.md`;
  - `docs/zoom-ios.md` (dengan langkah uji manual di iPhone);
  - `docs/apk/rencana-apk.md` (rencana APK, belum diimplementasikan).

### Diubah
- Bos tidak lagi mengekor. Siklusnya kini: mendekat lalu terbang di depan pemain, serang lewat depan, lewat
  dan menjauh, lalu berputar dan menyusul ke depan lagi. Bos tidak boleh berada di ekor lebih dari 4, 6, atau
  9 detik berturut-turut (Mudah, Normal, Sulit).
  - Hasil bot jelajah, waktu bos di kerucut depan: Mudah 1 menjadi 69 persen, Normal 1 menjadi 46 persen,
    Sulit 1 menjadi 26 persen.
  - Sentuhan badan bos: Penambang dari sekitar 6 menjadi di bawah 1 per menit, Naga dari sekitar 10 menjadi
    di bawah 1 per menit.
- Material bos mendapat emissive dan rim light berwarna khas. Kabut Bumi hanya 35 persen pada bos. Bidang jauh
  kamera Bumi diperlebar selama bos jauh.
- Tembakan bor dan lemparan batu Penambang Raksasa serta rudal Pemburu Agung kini memakai aba-aba
  (sebelumnya instan). Serbuan bor menuju samping pemain dengan jarak aman. Umpan tiruan terbang dalam formasi
  di samping bos asli.
- Nama bos tampil sebagai "BOS: nama" di bar bos dan baris misi. Spanduk nama besar diganti pengenalan ikon.
- Damage tabrakan asteroid kini mengikuti ukuran, jenis batu, dan kecepatan, bukan angka tetap per kelas.
  Damage sedang dikali kesulitan: Mudah x0,75, Normal x1, Sulit x1,25. Asteroid raksasa, planet, bulan,
  daratan, dan bos tetap fatal.

### Diperbaiki
- Bos tidak terlihat:
  - material hampir hitam di latar angkasa;
  - bos di luar bidang jauh kamera dan tertelan kabut penuh di medan Bumi kualitas Rendah (far 504);
  - bos bisa berada di dalam planet;
  - bos tidak pernah masuk penanda tepi layar.

  Pengukuran yang tidak terlihat turun dari 84 menjadi 3 dari 576.
- Tabrakan tak terlihat di Phobos dan Deimos: bola tabrakan kini sama dengan permukaan terdalam yang terlihat.
- Kerikil dan batu cincin yang jauh lebih kecil dari pesawat tidak lagi memakan 10 HP. Pecahan asteroid tidak
  terhitung sebagai benturan baru. Uji sapuan mencegah tembus pada kecepatan tinggi.
- Zoom browser saat halaman diketuk dua kali di iPhone (Safari dan Chrome iOS). Perilaku di iPhone asli
  masih perlu dipastikan dengan langkah uji manual.
- Shader bos dipanaskan di layar muat dan saat dunia berganti, jadi kemunculan bos tidak menambah program
  shader di tengah permainan.

## [2.2.0] - 2026-11-13

Audit performa, panas, keamanan, dan UI/UX. Gameplay, keseimbangan, AI musuh, dan isi konten tidak
berubah (metrik bot, skor, dan gelombang identik dengan 2.1.0 pada seed yang sama).

### Performa
- Batas FPS berbasis akumulator: layar 120 Hz tidak lagi merender dua kali lebih sering. Bawaan 60 FPS saat
  bermain, 20 FPS di menu, opsi 30, 60, atau tanpa batas.
- Layar statis (jeda, peta, kartu level dan kontrak, game over, Pengaturan, Hangar, menu dengan sesi
  dijeda, jendela tidak fokus di menu) tidak merender ulang dunia.
- Langit angkasa (nebula, Bima Sakti, galaksi) dipanggang sekali ke cubemap, bukan dihitung fbm per piksel
  tiap frame. GPU menu turun dari 10,3 ms menjadi sekitar 1,5 ms per frame.
- Batas pixel ratio per perangkat dan maksimum 2 juta piksel di kualitas Rendah dan Sedang, resolusi
  dinamis 1,0 sampai 0,6 dengan histeresis, bloom setengah resolusi di bawah Tinggi (sebelumnya skala yang
  dimaksud tertimpa dan bloom berjalan penuh).
- Mode performa Otomatis, Hemat baterai, Seimbang, Kualitas tinggi; Otomatis menurunkan satu tingkat
  kualitas bila tetap lambat dan berperilaku hemat saat baterai lemah.
- Radar 15 kali per detik dan instrumen 20 kali per detik tanpa membaca layout tiap frame (layout paksa
  turun dari sekitar 100 menjadi 23 per detik), angka HUD maksimal 10 kali per detik, penanda tepi tanpa
  string baru tiap frame.
- AudioContext berhenti saat tab tersembunyi, jendela tidak fokus di menu, jeda, dan bisu; sumber suara
  selesai diputus dari graf; anggaran suara efek.

### Ditambahkan
- Overlay performa (F3 atau Pengaturan) dan hook `debug.perf()`.
- Tutorial kontekstual pertama kali main (keyboard dan sentuh), bisa dilewati dan diulang.
- Getar (haptik) di mode HP, opsi Ukuran teks, Kurangi gerakan, Mode buta warna, tab Pengaturan Akses.
- Layar muat dengan kemajuan nyata dan pra-pemanasan shader serta tekstur.
- Overlay diagnosis `?diag=1` dengan unduh log JSON.
- Screen Wake Lock saat bermain, peringatan sebelum menutup saat sesi berjalan, tombol buka suara bila
  browser menahan audio, pesan bila simpanan rusak, peringatan kilatan sekali.
- Skrip pengukuran `tests/perf/` dan uji audit `tests/audit.spec.mjs`.
- `CHANGELOG.md`, dokumen audit di `docs/audit/`, panduan header server di `docs/deploy/`.

### Diubah
- Satu konstanta `GAME_VERSION` untuk menu, Tentang, dan overlay performa.
- Kontras teks HUD memenuhi WCAG AA di atas latar terang; HUD dan kartu membesar otomatis di layar desktop
  besar; transisi maksimal 0,4 detik.
- Batas FPS dan Resolusi maksimum di tab Lainnya, aksesibilitas di tab Akses.

### Diperbaiki
- Kotak hitam berkedip di menu: penjaga NaN `atan(0, 0)` di shader black hole dan galaksi (NaN di GPU Apple
  yang disebar bloom menjadi blok hitam), lens flare tanpa `mix-blend-mode`, beban GPU menu yang membuat
  GPU jenuh di 120 Hz, satu fungsi resize untuk kanvas, composer, dan bloom, kamera bayangan dibulatkan ke
  kisi texel, pra-pemanasan sebelum menu tampil.
- Konteks WebGL yang hilang kini dijeda dan dipulihkan otomatis.
- Ringkasan LANJUTKAN tidak crash bila data sesi rusak.

### Keamanan
- Three.js 0.187.0 ditanam lokal di `vendor/three-0.187.0/` dengan integrity sha384 di importmap; tidak ada
  permintaan ke CDN atau pihak ketiga.
- Content Security Policy ketat berbasis hash (`default-src 'none'`, tanpa `unsafe-inline` dan
  `unsafe-eval`), dijaga `tests/csp.mjs`.
- Hook uji `window.__game`, pratinjau model, dan galeri hanya aktif dengan `?debug=1`.
- Validasi ketat simpanan profil dan sesi (rentang angka, kunci yang dikenal, `Object.hasOwn`), parameter
  URL dengan daftar nilai yang diizinkan, tanpa `innerHTML`.
- Pesan ramah tanpa WebGL2, pemberitahuan bila penyimpanan penuh atau diblokir.
- Kalimat privasi di Tentang (tanpa cookie, pelacak, atau analitik).

## [2.1.0] - 2026-11-13

### Ditambahkan
- Simpan dan muat sesi di perangkat (otomatis tiap 10 detik, saat jeda, ke menu, tab disembunyikan, dan
  tombol SIMPAN), LANJUTKAN di menu setelah halaman dimuat ulang.
- Meta SEO, Open Graph, kartu X, data terstruktur VideoGame, logo, favicon, `manifest.webmanifest`,
  canonical URL.
- Mode HP landscape (blok H): satuan ukuran dari tinggi tampak, jarak tepi safe area dan override
  `?safearea=`, joystick analog melayang, cluster aksi berskala dengan hit slop 44 px, opsi ukuran,
  transparansi, kidal, dan gaya tombol arah, HUD ringkas, pusat notifikasi tunggal berprioritas, kamera
  khusus HP, layar menu dan layar sela muat di landscape 320 px, deteksi HP otomatis, layar penuh dengan
  kunci landscape, petunjuk Tambahkan ke Layar Utama di iOS, overlay putar layar.

### Diperbaiki
- `willReadFrequently` pada kanvas sumber tekstur, Enter memakai kartu terpilih bila fokus hilang, bloom
  mati bawaan di perangkat sentuh.

## [2.0.0] - 2026-11-11

Generasi kedua: perombakan dari game Bumi menjadi petualangan Tata Surya.

### Ditambahkan
- Antarmuka dunia (EarthWorld dan SpaceWorld), layar Pilih Medan, angkasa sebagai medan bawaan.
- Registri kapal berbasis data, hangar Pilih Kapal dengan kredit, Starfighter bersayap empat dengan varian
  Interceptor dan Gunship.
- Model terbang quaternion bebas, manuver Gulung Tong, Balik Arah, dan Looping, tabrakan fatal dengan
  penyebab, AI musuh dengan siklus serang, senjata dan buff baru, awan volumetrik, audio mesin baru.
- Robot pendamping Piko, asteroid empat jenis dan komet, bintang pickup lima warna dan ultimate laser.
- Tata Surya (Matahari, delapan planet, Pluto, bulan), cincin dan sabuk asteroid, latar Bima Sakti,
  galaksi, black hole, batas jelajah, panel fakta dan atlas Penemuan.
- Kampanye Tata Surya 10 stage, Jelajah Bebas, peta Tata Surya dan warp, kontrak stage dan Stage Clear.
- Roster 15 jenis musuh Sindikat Vanta, cutscene, bos Penjaga Raksasa, Penambang Raksasa, Pemburu Agung,
  dan final boss Sang Naga Vanta empat fase.
- XP, level, kartu upgrade berkelangkaan, drone pendamping, radar dan instrumen terbang, musik ambient
  generatif, dialog pembuka stage, preset kualitas, kontrol HP berikon.

## [1.0.0] - 2026-11-11

Generasi pertama: game pesawat jet di atas Bumi.

### Ditambahkan
- Satu berkas `index.html` dengan Three.js, loop dengan delta time di-clamp, CONFIG terpusat.
- Jet Raptor-J prosedural (badan loft, sayap airfoil, kanopi, nozzle, tekstur panel, angka 13), kamera
  chase sinematik dan kamera menu.
- Dunia Bumi prosedural dengan medan yang didaur ulang, laut, langit, matahari, kabut, bayangan, awan,
  pilar rintangan.
- Peluru ber-pool, nitro, dua jenis musuh bergelombang, asteroid ber-HP yang pecah, cincin, pickup,
  partikel, angka damage.
- Nyawa per kesulitan dengan respawn, HP, HUD, layar judul attract, jeda berblur dengan hitung mundur
  3-2-1, game over dan skor tertinggi, layar Tentang (kredit).
- Pengaturan lengkap dan simpan lokal berversi dengan migrasi, mode HP sentuh awal, audio sintesis dengan
  bus per kategori, suite uji Playwright.

[2.4.0]: https://github.com/ahmadngiliyun00/raptor13/compare/v2.3.1...v2.4.0
[2.3.1]: https://github.com/ahmadngiliyun00/raptor13/compare/v2.3.0...v2.3.1
[2.3.0]: https://github.com/ahmadngiliyun00/raptor13/compare/v2.2.0...v2.3.0
[2.2.0]: https://github.com/ahmadngiliyun00/raptor13/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/ahmadngiliyun00/raptor13/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/ahmadngiliyun00/raptor13/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ahmadngiliyun00/raptor13/releases/tag/v1.0.0
