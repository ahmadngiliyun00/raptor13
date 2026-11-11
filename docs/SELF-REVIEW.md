# Self-review Definition of Done

Tinjauan semua butir Definition of Done dari setiap blok spesifikasi. Blok yang lebih baru menang
bila bertentangan (misalnya Tata Surya menggantikan "sektor tanpa batas", dan daftar bos stage 5,
8, 10 menggantikan "bos tiap 5 stage"). Status: **Ya** (selesai dan diuji), **Sebagian** (berfungsi
dengan catatan), **Tidak**.

Bukti utama: 92 uji Playwright di `tests/game.spec.mjs` lolos (jalan penuh terakhir sekitar 7 menit
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

## Yang masih kurang menurut penilaian sendiri

- Kinerja di perangkat HP sungguhan belum diukur; preset Tinggi butuh sekitar 1,3 detik untuk
  membangun tekstur Tata Surya saat memuat.
- Generator sektor berbasis sel (bangkai kapal, kapal kargo netral, pos musuh tetap) dari blok
  angkasa awal tidak dibuat; konten muncul di sekitar pemain.
- Musuh penembak belum sengaja menyerang kargo pada kontrak Kawal Konvoi.
- Kepala Sang Naga Vanta dan bos Bumi masih sederhana dibanding model lain.
- Uji bergantung pada CDN; kegagalan `ERR_NETWORK_CHANGED` sesekali berasal dari jaringan.
