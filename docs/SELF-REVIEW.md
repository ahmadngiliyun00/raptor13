# Self-review Definition of Done

Tinjauan semua butir Definition of Done dari setiap blok spesifikasi. Blok yang lebih baru menang
bila bertentangan (misalnya Tata Surya menggantikan "sektor tanpa batas", dan daftar bos stage 5,
8, 10 menggantikan "bos tiap 5 stage"). Status: **Ya** (selesai dan diuji), **Sebagian** (berfungsi
dengan catatan), **Tidak**.

Bukti utama: 97 uji Playwright di `tests/game.spec.mjs` lolos (jalan penuh terakhir sekitar 7 menit
di Mac dengan GPU asli), riwayat git satu commit per task, dan screenshot di `docs/screenshots/`.

## Blok awal (T1 sampai T17)

| Butir | Status | Bukti atau catatan |
| --- | --- | --- |
| Membuka `index.html` lewat server statis langsung bisa dimainkan | Ya | uji halaman termuat, MULAI |
| Semua kontrol bekerja termasuk kombinasi tombol bersamaan | Ya | uji kontrol, `W` + `D` + `Spasi` + `Enter` |
| Nitro, tembak, health, skor, wave, pickup, ring, game over, restart, pause, mute | Ya | uji per fitur |
| Tidak ada console error, tidak ada aset eksternal selain Three.js | Ya | setiap uji gagal bila ada error atau request luar |
| Frame rate stabil setelah 5 menit dan 10 restart | Ya | uji simulasi 5 menit dan 10 restart (objek, geometri, shader, listener sama) |
| README lengkap, screenshot, tests dengan satu perintah | Ya | `npm test` |
| Riwayat git rapi, satu commit per task | Ya | `git log` |
| Tanpa em dash dan ampersand | Ya | `grep` 0 di seluruh berkas proyek |

## Nyawa, asteroid, menu, pause, pengaturan, mode HP

| Butir | Status | Bukti atau catatan |
| --- | --- | --- |
| Nyawa dan bar HP, respawn dan kebal sementara | Ya | uji nyawa dan kebal 1 detik |
| Asteroid ber-HP, bar HP melayang, pecah, kepadatan diatur | Ya | uji S6 dan asteroid Bumi |
| Menu attract mode, transisi mulai mulus | Ya | latar menu angkasa di Saturnus |
| Pause berblur dengan hitung mundur, lanjut, ulang, menu | Ya | uji jeda |
| Pengaturan tersimpan, reset data, data rusak aman | Ya | uji save v3 dan migrasi |
| Mode HP penuh dengan multi-touch dan toggle | Ya | uji 27a: tombol berfungsi lewat pointer, tata letak tanpa tumpang tindih di empat ukuran |
| Tentang berisi kredit yang benar | Ya | uji S14 |

## Petualangan angkasa (S1 sampai S18)

| Butir | Status | Bukti atau catatan |
| --- | --- | --- |
| Enter menembak dan terlihat jelas | Ya | uji S1 kontras piksel peluru |
| Default berlatar angkasa, medan Bumi tetap bisa dipilih | Ya | uji S2 |
| Dunia terasa luas dengan planet, bulan, komet, asteroid berbagai jenis | Ya | digantikan Tata Surya (B8 sampai B10) |
| Kapal pemain tidak kotak dari semua sudut | Ya | pratinjau Starfighter 3 putaran, screenshot 6 sudut |
| Minimal 8 jenis musuh dan 2 bos, berbeda dan tidak kotak | Ya | 15 jenis di `?gallery=1`, 4 bos |
| Bintang lima warna, ultimate laser, drone pendamping | Ya | uji S8 dan S11 |
| XP, level, kartu upgrade, misi, gerbang loncat | Ya | uji S11, A6, B11 |
| Radar, bar bos, skor besar, feedback damage | Ya | uji S13 |
| 60 FPS di preset Sedang, tanpa kebocoran setelah restart dan pindah area | Sebagian | 60 FPS di Mac; belum diukur di perangkat HP sungguhan |
| Mode HP dengan tombol ultimate | Ya | uji 27a |

## Kapal, Piko, Sindikat Vanta, stage (A1 sampai A7)

| Butir | Status | Bukti atau catatan |
| --- | --- | --- |
| Jet Bumi tidak berubah, ada di hangar, default medan Bumi | Ya | uji A2 dan pratinjau jet |
| Starfighter bersayap empat dengan sayap dinamis tanpa tembus badan | Ya | uji A3 |
| Dua varian bisa dibuka dengan kredit, tersimpan | Ya | uji A2 |
| Piko di kapal, peringatan bersubtitle dan bip berbatas frekuensi | Ya | uji A4 |
| Enam kapal musuh baru menembak adil dan mudah dibedakan | Ya | uji roster, garis bidik, rudal yang bisa ditembak |
| Stage lengkap: kartu pembuka, kontrak, gelombang, bos, Stage Clear dengan rating | Ya | uji A6, B13; bos di stage 5, 8, 10 sesuai blok terbaru |
| Tidak meniru waralaba mana pun | Ya | semua nama, desain, dialog, musik ditulis sendiri |

## Perbaikan dari uji coba pemain (B1 sampai B14)

| Butir | Status | Bukti atau catatan |
| --- | --- | --- |
| Looping penuh, tiga manuver di Bumi dan Angkasa | Ya | uji B1 dan B2 |
| Menyentuh tanah, laut, pohon, gunung, planet, asteroid raksasa langsung game over | Ya | uji B3 dan B8 (Mars, Bulan, Matahari) |
| Musuh adil: tidak menempel di ekor, tidak menabrak terus | Ya | bot gelombang 7 sampai 9 dengan roster penuh: rasio membuntuti 0,06 sampai 0,14 |
| Tembakan cepat, menyala, buff bekerja | Ya | uji B5 |
| Awan Bumi tampak seperti awan | Ya | tinjauan visual dua putaran |
| Suara mesin dan nitro tidak seperti gas motor | Ya | uji B7 sanity audio |
| Tata Surya lengkap, cincin berasteroid, Bima Sakti, black hole, batas, fakta akurat | Ya | uji B8, B9, B10 |
| Kampanye 10 stage dan Jelajah Bebas, warp | Ya | uji B11 |
| Final boss empat fase dengan cutscene, layar akhir | Ya | uji B13 |
| Asteroid Bumi yang pecah, pohon tinggi, jet Bumi, kredit tetap | Ya | uji B3, A2, medan Bumi |

## Permintaan tambahan pemain

| Butir | Status | Bukti atau catatan |
| --- | --- | --- |
| Kontrol HP memakai ikon, lebih besar, berjarak, tanpa tumpang tindih | Ya | uji 27a, screenshot `kontrol-hp.png` |
| Minimap dengan musuh, arah, pitch, bank, ketinggian | Ya | uji S13 |
| Repo publik di GitHub bernama raptor13 | Ya | <https://github.com/ahmadngiliyun00/raptor13> |

## Blok H: tata letak dan kontrol mode HP landscape (H1 sampai H10)

Bukti: `tests/hp.spec.mjs` (31 uji, emulasi sentuh) di matriks 568x320, 667x375, 740x360, 812x375,
844x390, 915x412, 932x430, ditambah `?safearea=47,0,47,21` di 568x320 dan 844x390. Screenshot di
`docs/screenshots/hp/` (dibuat ulang dengan `SHOTS=1 npx playwright test tests/hp.spec.mjs`), dua
putaran tinjauan visual.

| Butir | Status | Bukti atau catatan |
| --- | --- | --- |
| Di semua ukuran uji, tidak ada tumpang tindih UI dan tidak ada elemen terpotong | Ya | uji tata letak (idle dan `stressHud`) dan uji layar per ukuran: tidak ada tumpang tindih, tidak keluar layar atau safe area, kartu tanpa scroll |
| HUD dan kontrol idle maksimal 22 persen luas layar, zona tengah bebas | Ya | luas idle 12,2 sampai 19,3 persen (15,5 persen di 568x320 berponi); zona x 30 sampai 70 persen dan y 20 sampai 80 persen kosong, juga saat kasus terburuk |
| Kontrol berskala, area sentuh efektif minimal 44 px, joystick analog, opsi ukuran dan kidal | Ya, dengan catatan | uji joystick, deadzone, multi-touch, kidal, tombol arah; ukuran 70 dan 130 persen lolos asersi. Di HP 320 sampai 430 px tinggi, 130 persen dibatasi menjadi sekitar 105 persen agar cluster tetap di bawah 30 persen tinggi |
| Jarak ke tepi memakai max(safe area, 8px), terbukti lewat uji ?safearea | Ya | `debug.viewport().ed` = 47, 8, 47, 21 untuk `?safearea=47,0,47,21` |
| Hanya satu notifikasi tampil, tidak pernah menutup tengah atau pesawat | Ya | uji notifikasi (sela prioritas, antrean maksimal 4, kedaluwarsa 4 detik), toast selalu di atas 20 persen tinggi |
| Menu, jeda, pengaturan, kontrak, level, dan layar lain muat di 320 px tanpa teks tembus | Ya | uji layar per ukuran untuk 18 layar termasuk tiap tab Pengaturan; HUD dan kontrol tersembunyi di balik overlay |
| Tidak ada teks petunjuk keyboard di mode HP | Ya | `debug.keyboardHints()` kosong di semua layar mode HP |
| Layar penuh dan orientasi bekerja, overlay portrait rapi | Sebagian | Fullscreen API dan tombol diuji di Chromium; kunci landscape hanya berlaku di browser yang mendukung (Android Chrome) dan belum dicoba di perangkat sungguhan; petunjuk Layar Utama iOS belum dicoba di iPhone sungguhan |
| Mode keyboard desktop dan gameplay tidak berubah, semua tes lama lolos | Ya | `tests/game.spec.mjs` |
| Tidak ada em dash dan ampersand di seluruh repo | Ya | `grep` 0 di seluruh berkas proyek di luar dependensi |

## Blok BT: petunjuk bos, tabrakan berbasis ukuran, zoom iOS, rencana APK (B1 sampai B10)

Bukti utama ada di `docs/bos/diagnosis.md`, `docs/bos/perilaku.md`, `docs/fisika/tabrakan.md`,
`docs/zoom-ios.md`, dan `docs/apk/rencana-apk.md`. Uji: `tests/bos.spec.mjs` dan `tests/zoom.spec.mjs`.
Screenshot sebelum dan sesudah ada di `docs/bos/screenshots/`.

| Butir | Status | Bukti atau catatan |
| --- | --- | --- |
| Semua bos dan mini-bos terlihat jelas di semua dunia, dengan outline, ikon, panah tepi, jejak, arah gerak, dan blip radar | Ya, dengan catatan | Dari 576 pengukuran, yang tidak terlihat turun dari 84 menjadi 3, dan yang jelas naik dari 278 menjadi 498. Uji B2 lolos untuk 4 bos x 12 dunia x 4 jarak: minimal 20 piksel atau penanda tampil. Catatan: di jarak 1200 bos kecil hanya 7 sampai 14 piksel tinggi, jadi pelacakan bergantung pada penanda; Naga di medan Bumi kualitas Tinggi bisa tertutup awan |
| Penyebab bos tidak terlihat teridentifikasi dengan bukti dan diperbaiki | Ya | Tabel butir a sampai j di diagnosis. Penyebab utama: material gelap tanpa emissive atau rim, far kamera Bumi (504 di Rendah) dan kabut, bos mengekor di luar layar, dan bos tidak masuk penanda tepi. Butir d, f, g, h, i, j terbukti bukan penyebab |
| Siklus serang bos memberi jendela rentan di depan pemain, parameter per kesulitan bekerja, metrik terukur dan tertulis | Ya | Bot jelajah di kerucut depan: Mudah 68,6 persen, Normal 46,4 persen, Sulit 25,9 persen (sebelumnya 1 sampai 3 persen). Runtun ekor di bawah 4, 6, dan 9 detik. Sentuhan bos di bawah 1 per menit (sebelumnya sampai 10). Uji B5 lolos |
| Tabrakan berbasis ukuran dan energi: benda kecil hanya mengurangi persen HP atau tidak berdampak; benda besar, planet, daratan, dan bos tetap fatal; tidak ada tabrakan tak terlihat atau hitung ganda | Ya | Tabel `collisionTest`: kerikil 0 persen, puing 1 sampai 3 persen, sedang 19 persen, raksasa, bulan, planet, daratan, dan bos fatal. Uji nyata mencatat tepat satu benturan, juga pada 100 satuan per frame. Bola tabrakan Phobos dan Deimos kini sama dengan permukaan yang terlihat |
| Zoom dua kali ketuk dan cubit dicegah dengan semua lapisan B7, tes otomatis lolos, langkah uji manual iPhone tersedia | Ya, dengan catatan | 8 uji zoom lolos (WebKit iPhone 12 dan 14, iPhone 14 berponi, Chromium Pixel 7). Catatan: emulasi WebKit tidak menjalankan logika zoom iOS yang sebenarnya, jadi perilaku di iPhone asli belum terverifikasi. Langkah manual ada di `docs/zoom-ios.md` |
| docs/apk/rencana-apk.md lengkap, spesifik, dengan rekomendasi tegas, tanpa implementasi di game | Ya | Rekomendasi: PWA, lalu TWA Bubblewrap, lalu Play Store. Tidak ada berkas Android, tombol, atau perubahan game untuk APK |
| Tidak ada regresi gameplay, kontrol, performa, keamanan, atau tata letak HP | Ya | Suite lengkap 159 uji lolos (8 uji zoom dilewati karena khusus mesin lain), console bersih termasuk CSP. Metrik bot A5: 5 dari 6 kombinasi identik; satu menyimpang karena pantulan asteroid baru, tetap jauh di bawah ambang. Performa: frame 16,67 ms di 20 skenario, kerja JS 1,59 menjadi 1,51 ms. CSP berbasis hash diperbarui dan hook tetap hanya lewat `?debug=1` |
| CHANGELOG, versi, tag, dan rilis diperbarui, tidak ada em dash dan ampersand | Ya | CHANGELOG 2.3.0, tag beranotasi `v2.3.0`, GitHub Release RAPTOR13 2.3.0. `GAME_VERSION` dan `package.json` 2.3.0. `git grep` tanpa em dash dan ampersand di berkas teks |

## Blok E (prompt 03): zoom, Piko, senjata bertingkat, kehalusan terbang, Putar Balik U (E1 sampai E10)

**Bukti utama:**

| Bagian | Dokumen | Uji |
| --- | --- | --- |
| zoom | `docs/bug/zoom-viewport.md`, `docs/zoom-ios.md` | `tests/zoom.spec.mjs`, `tests/zoom-viewport.spec.mjs` |
| Piko | `docs/piko/gerak.md` | `tests/piko.spec.mjs` |
| senjata | `docs/senjata/keseimbangan.md` | `tests/senjata.spec.mjs` |
| terbang | `docs/penerbangan/diagnosis-halus.md`, `docs/penerbangan/perbaikan.md` | `tests/kehalusan.spec.mjs` |
| Putar Balik U | `docs/penerbangan/balik-u.md` | `tests/manuver.spec.mjs` |
| TTK bos | `docs/bos/ttk-e9.md` | - |

| Butir Definition of Done | Status | Bukti atau catatan |
| --- | --- | --- |
| Zoom atau cubit tidak lagi merusak game di semua skala uji; bug tereproduksi lalu hilang; panduan iPhone dan overlay diag tersedia | Ya, dengan catatan | Diperbaiki sejak 2.3.1 (E1, E2). Uji zoom lintas skala 1,0 sampai 4,0 di Chromium dan WebKit lolos di regresi 2.5.0. Catatan: iPhone asli belum dicoba; langkahnya di `docs/zoom-ios.md` |
| Pencegahan zoom aktif di kode dan di situs live, atau perintah deploy jelas | Sebagian | Aktif di kode (meta viewport, touch-action, penjaga gesture; diuji). Situs live masih versi lama karena deploy belum dikonfigurasi di sesi ini. Perintah deploy ada di `docs/deploy/panduan-deploy.md` (`scripts/deploy.sh`) |
| Piko bergerak mandiri dengan keterlambatan dan idle hidup, menempel di sisi lambung saat nitro, manuver, dan percepatan tinggi, lalu keluar halus | Ya | Diukur dengan `debug.piko.trace`: lag beberapa frame lewat korelasi silang, idle std y di atas 0,02, menempel tepat di titik tambat dengan toleransi 0,03 di keempat kapal, minimal 0,8 detik dengan histeresis. Rekaman berurutan di `docs/screenshots/piko/` |
| Senjata bertingkat sampai 4 laras berbasis hardpoint yang terlihat, peluru dari ujung laras, menyerang ke depan, keseimbangan dan perolehan terdokumentasi, anggaran performa terjaga | Ya | Penyimpangan asal peluru terhadap ujung laras paling besar 0,011 satuan. Perkalian titik arah dengan hidung minimal 0,9994. DPS 1,8 dan 3,14 kali. Skenario terburuk 96 peluru dari anggaran 128, kerja p95 1,6 ms. Nol kebocoran dalam 20 restart |
| Tidak ada snap atau flip pada manuver vertikal, menanjak, menukik, bank, dan belok samping; semua metrik di bawah ambang; pull-out berlengkung | Ya | Sebelumnya 2 dari 20 skenario lolos, sekarang 24 dari 24 (termasuk Balik U). Lonjakan terburuk 11,6 menjadi 1,9 derajat per frame. Percepatan sudut 732 menjadi 19,5 rad/s kuadrat. Kamera flip 13 derajat per frame hilang. Pemulihan 2,4 sampai 2,6 detik |
| Putar Balik U berfungsi di keyboard dan sentuh, halus, terintegrasi dengan Piko, bot, dan HUD tanpa melanggar asersi layout | Ya | Terukur: belok 179 derajat, bank 75, durasi 2,02 detik, nol frame melewati ambang. Tombol sentuh Balik digabung, sehingga jumlah tombol busur tetap dan uji tata letak HP lolos. Bot terampil memakai Balik U |
| TTK bos per stage tetap dalam target setelah perubahan, tanpa mengubah HP atau damage | Ya untuk Normal, dengan catatan | Bot terampil Normal: 128, 108, 115 detik (target 90 sampai 150), lewat `BOSS_PILOT.tier`. Sulit: 148, 207, 113, sedikit di luar di dua bos, tetapi lebih dekat ke target dari sebelumnya. Mudah tetap lebih cepat dari target, seperti sebelum E5. Naga tetap tidak terkalahkan oleh bot (masalah lama) |
| Semua tes lolos, tanpa regresi performa, keamanan, atau tata letak | Ya | Regresi penuh 2.5.0: lihat CHANGELOG. 9 uji dilewati karena khusus mesin lain atau peka waktu di SwiftShader. Performa 4 laras dengan Piko dibanding E4: 60 FPS, kerja rata-rata 1,74 menjadi 1,78 ms, draw call 131 menjadi 141 |
| CHANGELOG, versi minor, tag, rilis; tanpa em dash dan ampersand | Ya | 2.5.0, tag `v2.5.0`, GitHub Release. Pemindai gaya bersih |

## Yang masih kurang menurut penilaian sendiri

- Kinerja di perangkat HP sungguhan belum diukur; preset Tinggi butuh sekitar 1,3 detik untuk
  membangun tekstur Tata Surya saat memuat.
- Generator sektor berbasis sel (bangkai kapal, kapal kargo netral, pos musuh tetap) dari blok
  angkasa awal tidak dibuat; konten muncul di sekitar pemain.
- Musuh penembak belum sengaja menyerang kargo pada kontrak Kawal Konvoi.
- Kepala Sang Naga Vanta dan bos Bumi masih sederhana dibanding model lain.
- Uji bergantung pada CDN; kegagalan `ERR_NETWORK_CHANGED` sesekali berasal dari jaringan.
- Mode HP: anggaran 30 persen tinggi membuat slider Ukuran kontrol di atas sekitar 105 persen tidak
  berpengaruh di HP; di layar 568x320 berponi kontrol bahkan dikecilkan otomatis sekitar 80 persen.
- Mode HP: di tinggi 320 px toast hanya muat satu baris sehingga ucapan Piko mode Penuh terpotong
  (mode Ringkas yang menjadi bawaan di perangkat sentuh muat).
- Mode HP belum dicoba di perangkat sungguhan: Fullscreen API, kunci orientasi, safe area asli, dan
  rasa joystick hanya diuji lewat emulasi.
- Bos (2.3.0): bot sederhana butuh lebih lama mengalahkan Pemburu Agung, Penambang, dan Naga karena bos tidak
  lagi bisa ditempel dari belakang. Di Normal bot menghabiskan sekitar separuh HP dalam 3 menit. Rasa
  pertarungan untuk pemain manusia belum diuji; parameter `BOSS_PILOT` mungkin perlu disetel setelah
  dicoba pemilik.
- Bos (2.3.0): penanda di atas bos menempel pada bos, jadi bisa berada di zona tengah atau menimpa panel HUD
  saat bos melintas di sana. Panah tepi dan indikator di belakang yang dijaga dari tumpang tindih.
- Zoom iOS (2.3.0): belum dicoba di iPhone asli. Bila iOS tetap memperbesar lewat cubit, hanya tip "Reset
  tampilan" dan cubit manual yang tersedia; iOS tidak mengizinkan reset zoom lewat kode di semua kasus.
- Tabrakan (2.3.0): ambang fatal ukuran sengaja 6,9 kali radius pesawat (R 18), bukan 2 kali seperti contoh
  di spesifikasi, agar asteroid sedang dan besar tidak menjadi fatal. Bila pemilik ingin lebih ketat, cukup
  ubah `fatalRatio`.
- Senjata (2.5.0): laras ujung sayap Starfighter dan Interceptor hanya mengenai sasaran kecil (radius 0,6) di sekitar
  titik temu, yaitu 80 sampai 160 satuan. Bantuan bidik membantu, tetapi pemain yang mematikan bantuan bidik akan
  lebih sering meleset terhadap rudal dari jarak dekat.
- Terbang (2.5.0): ramp kurva S membuat bot rata-rata sedikit kurang tepat. TTK bot rata-rata Normal untuk Penjaga
  dan Pemburu naik dari 169 menjadi 223 detik dan dari 198 menjadi 229 detik, dan 13 persen run tidak selesai dalam
  300 detik. Perlu dicoba pemain manusia.
- Putar Balik U (2.5.0): tombol sentuh Balik kini dua fungsi (Balik U bawaan, Balik vertikal dengan joystick ke atas
  atau bawah). Pemain lama yang terbiasa dengan Balik vertikal perlu tahu perubahan ini (ada di catatan rilis).
