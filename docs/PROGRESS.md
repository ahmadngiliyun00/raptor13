# Progres Pengerjaan RAPTOR13

Berkas ini adalah catatan kerja agar pengerjaan bisa dilanjutkan otomatis setelah jeda
(misalnya setelah limit pemakaian habis). Perbarui berkas ini setiap kali satu task selesai.

## Aturan kerja (selalu berlaku)

- Satu file `index.html`, Three.js 0.187.0 (dan addons dari CDN yang sama bila perlu), tanpa aset eksternal, tanpa npm untuk runtime.
- Tanpa em dash dan tanpa simbol ampersand di seluruh repo, termasuk kode (pakai if bertingkat, ternary, optional chaining).
- Commit per task dengan awalan `feat:`, `fix:`, `chore:`, `docs:` dan nomor task di pesan. Belum ada remote, jadi commit lokal saja. Jangan force push dan jangan rewrite riwayat.
- Semua desain, nama, dialog dan musik orisinal. Jangan menyebut waralaba mana pun.
- Pertahankan: asteroid melayang di medan Bumi yang pecah, pilar tinggi di medan Bumi (pemain menyebutnya pohon), desain jet Bumi (Raptor-J, jangan diubah), sistem kredit.
- Setelah perubahan, jalankan `npx playwright test` (server dibuat otomatis) dan periksa screenshot secara kritis.
- Teks UI dalam Bahasa Indonesia.

## Sudah selesai (lihat `git log`)

- Tahap awal T1 sampai T17 (core, input, jet, kamera, dunia Bumi, senjata, musuh, asteroid ber-HP, nyawa, partikel, HUD, menu attract, jeda berblur dengan hitung mundur, pengaturan dan save, mode HP, audio per kategori).
- Perbaikan jet J1 sampai J8 (model prosedural loft, mode `?jetpreview=1`).
- S1 bug tembakan (peluru terlihat, fallback e.key).
- S2 antarmuka dunia EarthWorld dan SpaceWorld, layar Pilih Medan, save v2, skor per medan.
- A1 registri kapal `SHIPS` berbasis data, `buildJetRaptor`, `Player.rig`.
- B1 model terbang quaternion bebas (looping), penstabil otomatis, kamera diredam, Shift lihat belakang.
- B2 manuver Z Gulung Tong, X Balik Arah, C Looping dengan cooldown, chip HUD, tombol HP.
- B3 tabrakan fatal dengan penyebab (tanah, laut, gunung, pohon atau pilar, asteroid raksasa), gerak lambat dan orbit kamera, peringatan, opsi latihan.
- B4 AI musuh (siklus approach, attack dengan telegraf, break, reposition), batas kecepatan, spawn depan, separasi, kebal 1 detik setelah damage, penanda lead, bantuan bidik Mati, Rendah, Sedang, peringatan musuh di belakang, metrik bot (ambang: tailRatio di bawah 0,25, tabrakan di bawah 4 per menit; hasil uji 0,07 sampai 0,21).
- B5 laju tembak 10 per detik, peluru 750 ditambah kecepatan pesawat, bolt plasma dengan halo berwarna per peluru, peluru musuh bola magenta, buff OVERDRIVE dan PENGHANCUR 10 detik dari kristal, pengali upgrade permanen Player.upgrades.
- B6 awan Bumi volumetrik low-poly instanced (kumulus, stratus, serat), dua lapisan, memudar dekat kamera, tabir putih saat menembus awan.
- B7 audio mesin brown noise ditambah dua osilator 52 sampai 90 Hz, whoosh dan sub-bass saat nitro mulai lalu desis stabil, compressor ringan, uji sanity.
- Fase 0 (B1 sampai B7) selesai.
- A2 hangar (alur MULAI, Pilih Medan, Pilih Kapal, dan tombol HANGAR di menu), kredit dari loot dan 50 persen dibawa pulang saat game over, save v3 dengan migrasi. Interceptor dan Gunship terdaftar dengan statistik akhir tetapi model masih jet sementara sampai A3.
- S3 langit angkasa (nebula fbm, bintang tiga lapis, debu, garis warp, matahari jauh, lens flare DOM, rim light) dan bloom UnrealBloomPass hanya di angkasa sesuai preset, opsi Bloom, kualitas Rendah bawaan di perangkat sentuh.
- A3 buildStarfighter (loft, bahu menyatu, empat bilah X dinamis, thruster manuver, cincin mesin, kanopi, soket Piko di pikoMount, livery kanvas dengan 13), varian Interceptor dan Gunship lewat params, ?shippreview=. Segitiga: Starfighter 3724, Gunship 4036. Tiga putaran visual. 
- A4 Piko (model loft 852 segitiga, ekspresi mata, bip per ekspresi, panel HUD bersubtitle, jeda 6 detik, cooldown 25 detik per pesan, prioritas, opsi Bantuan robot, upgrade autoRepair, scanner, damper di Player.upgrades). Pemicu komet, ranjau, gerbang sudah ada di PIKO_LINES dan tinggal dipanggil Piko.say saat fiturnya dibuat.
- Penyetelan B4: maxTailTime 1,2 detik, droneMaxTailTime 0,6 detik; metrik dipisah collisionsPerMin (non-kamikaze, ambang 2) dan ramsPerMin (drone, ambang 6).
- S6 asteroid angkasa ukuran kontinu (spaceRadius per kelas) dan empat jenis (batu, es, logam, kristal; kristal lebih sering menjatuhkan pickup), komet (Comets) dengan koma, ekor menjauhi matahari, peringatan KOMET MENDEKAT dan Piko, bisa dihancurkan. Asteroid Bumi tidak berubah.
- B8 Tata Surya (SolarSystem): Matahari bergranulasi, 8 planet, Pluto, 9 bulan (Bulan, Phobos, Deimos, Io, Europa, Ganymede, Callisto, Titan, Charon), tekstur kanvas noise 3D tanpa sambungan, bump kawah, lampu kota sisi malam Bumi, awan berputar, atmosfer, cincin Saturnus dengan celah Cassini dan bayangan planet, cincin tipis Jupiter dan Uranus, cahaya dari posisi Matahari (termasuk gerhana pada kapal), proksi berskala untuk benda jauh (camera.far 10000), tabrakan fatal planet, bulan, Matahari, peringatan TARIK NAIK, ketinggian HUD = jarak ke permukaan terdekat, pose awal per area (`SpaceWorld.area`), hook `solar`, `setArea`, `viewBody`. Jarak dipadatkan, bukan skala asli.
- B9 RockFields: cincin Saturnus (6000 batu es pada kualitas tinggi), Jupiter dan Uranus berisi batu InstancedMesh di ruang lokal cincin; Sabuk Asteroid (10200 sampai 12600) dan Sabuk Kuiper (35500 sampai 42000) dibangkitkan per sel di sekitar kamera secara deterministik ditambah pita titik jauh berjarak dipadatkan; LOD: batu terdekat (radius 170, maksimal 14) diganti Asteroid ber-HP, yang hancur tetap hilang selama sesi; tekstur cincin memudar dari dekat; area awal 'sabuk' dan 'kuiper' dengan gelembung aman; hook `fields`, `enterRing`, `viewArea`.
- B10 DeepSky (pita Bima Sakti dengan jalur debu, 4 galaksi spiral, black hole dengan piringan akresi, Doppler, cincin foton dan busur terbelokkan, terlihat mulai 17000 dari Matahari), Boundary (dinding grid berpendar di radius 45000, peringatan KELUAR BATAS MISI 1500 sebelum dinding, putar balik otomatis dan dorongan, tanpa game over, Piko memperingatkan), Discovery (panel data nama, golongan dan 2 sampai 3 fakta dunia nyata dalam BODY_FACTS untuk 21 benda termasuk dua sabuk), atlas PENEMUAN di menu, disimpan di Save.data.discoveries.
- S8 pickup bintang lima warna (merah ultimate, hijau HP, biru nitro, emas XP dan skor, ungu nyawa) dengan magnet, jatuh dari musuh, asteroid kristal, komet dan kluster angkasa; ultimate laser E (meter dari bintang merah dan kill, sinar 2,5 detik), tombol ULTIMATE di mode HP, bar HUD. Game.xp disiapkan untuk S11.

## Urutan task berikutnya (blok terakhir menang bila bertentangan)

Fase 0, rasa main (paling awal):
1. (SELESAI) B1 Model terbang quaternion bebas (looping penuh dengan menahan W atau S), kecepatan plus minus 15 persen saat menukik atau menanjak, penstabil otomatis (opsi, default hidup), roll kamera diredam (opsi "Kamera ikut berguling", default mati), Shift tahan untuk lihat belakang.
2. (SELESAI) B2 Manuver Z Gulung Tong (kebal peluru selama gulungan, arah ikut A atau D, juga ketuk ganda A atau D), X Balik Arah (Immelmann), C Looping. Cooldown 4 sampai 6 detik di CONFIG, indikator HUD, tiga tombol kecil di mode HP.
3. (SELESAI) B3 Tabrakan fatal (tanah, laut, gunung, pilar, planet, stasiun, bos, asteroid raksasa) langsung game over dengan penyebab; hapus bantuan naik otomatis dan lantai ketinggian; efek ledakan besar, gerak lambat 0,8 detik, kamera orbit; peringatan TERLALU RENDAH atau TARIK NAIK; opsi "Tabrakan fatal" (default hidup, bila mati hanya damage besar dan pantulan).
4. (SELESAI) B4 AI musuh: kecepatan 70 sampai 85 persen pemain, maksimum 80 persen kecepatan nitro; siklus APPROACH, ATTACK (tanda sebelum menembak), BREAK, REPOSITION; 80 persen spawn di kerucut depan; jarak pisah antar musuh; kebal 1 detik setelah damage; penanda lead; bantuan bidik Mati, Rendah, Sedang (default Rendah); peringatan musuh di belakang; metrik tes waktu musuh di kerucut belakang dan tabrakan per menit di bawah ambang CONFIG.
5. (SELESAI) B5 Laju tembak cooldown 0,10 sampai 0,12 detik, kecepatan peluru sekitar 3 kali, bolt plasma merah oranye dengan inti putih dan halo, peluru musuh berbeda (bulat merah magenta); buff OVERDRIVE (laju 1,6 kali) dan PENGHANCUR (damage 1,5 kali) 10 detik dengan ikon dan penghitung; pickup kristal; kartu upgrade permanen (disiapkan untuk sistem kartu S11).
6. (SELESAI) B6 Awan Bumi volumetrik low-poly instanced (kumulus, stratus, serat), dua lapisan, memudar saat kamera dekat, tanpa popping.
7. (SELESAI) B7 Audio mesin: brown noise lewat lowpass ditambah dua sine atau triangle 50 sampai 90 Hz; nitro: whoosh bandpass 400 sampai 2500 Hz 0,4 detik ditambah sub-bass sekali lalu desis; compressor master; tes sanity tanpa NaN dan gain master di bawah 1.

Fase berikutnya:
8. (SELESAI) A2 Hangar Pilih Kapal (alur MULAI, Pilih Medan, Pilih Kapal), kredit, buka kapal, save v3 dengan migrasi.
9. (SELESAI) S3 Skybox angkasa (bintang paralaks 3 lapis, nebula, debu dekat kamera, warp streak saat nitro), matahari dan lens flare, EffectComposer dan UnrealBloomPass sesuai preset kualitas.
10. (SELESAI) A3 Starfighter bersayap empat konfigurasi X dengan sayap dinamis dan thruster manuver, varian Interceptor (500 kredit) dan Gunship (1200 kredit), `?shippreview=` (starfighter, jet, interceptor, gunship, piko), minimal 3 putaran iterasi visual.
11. (SELESAI) A4 Robot Piko (model loft, ekspresi mata, bip, panel HUD bersubtitle, batas frekuensi, opsi Bantuan robot, 3 kartu upgrade).
12. (SELESAI) S6 Asteroid angkasa ukuran kontinu dan 4 jenis (batu, es, logam, kristal) serta komet berekor.
13. (SELESAI) S8 Pickup bintang warna (merah ultimate, hijau HP, biru nitro, emas XP dan skor, ungu nyawa) dan ultimate laser E.
14. (SELESAI) B8 Tata Surya (Matahari, 8 planet, Pluto, bulan, tekstur prosedural, cahaya dari Matahari). Menggantikan S5 dan S7.
15. (SELESAI) B9 Cincin berisi asteroid instanced dengan LOD ke objek ber-HP, Sabuk Asteroid, Sabuk Kuiper.
16. (SELESAI) B10 Latar Bima Sakti, galaksi, black hole; batas jelajah dan dinding energi; panel data fakta akurat dan daftar Penemuan.
17. B11 Mode Kampanye 10 stage dan Jelajah Bebas, peta Tab dan warp. Menggantikan S12.
18. S9 dan A5 Roster musuh (8 jenis ditambah 6 kapal Sindikat Vanta), tembakan adil, `?gallery=1`.
19. B12 Sistem cutscene.
20. S10 dan B13 Mini-boss (stage 5 Penambang Raksasa, stage 8 Pemburu Agung) dan final boss Sang Naga Vanta 4 fase. Medan Bumi: bos tiap 5 gelombang.
21. S11 XP, level, kartu upgrade (kelangkaan), drone pendamping.
22. A6 Sistem stage (kartu pembuka, kontrak Buru Target, Kawal Konvoi, Bersihkan Sektor, layar Stage Clear dan rating, kredit).
23. S13 HUD baru (radar, XP, ultimate, bar bos, misi, angka besar). Tambahan permintaan pemain 11 Nov: MINIMAP di sisi kiri atau kanan yang menampilkan musuh (dan pickup, asteroid besar, planet terdekat) relatif terhadap arah kapal, ikut berputar sesuai heading; ditambah instrumen terbang: heading atau kompas dalam derajat, sudut pitch (naik turun) dan bank atau kemiringan (kanan kiri) dalam derajat dengan titik 0 saat datar seperti posisi awal, serta ketinggian atau jarak dari titik 0 (di Bumi ketinggian, di Angkasa jarak ke permukaan dan posisi relatif titik mulai). Bisa berupa indikator horizon buatan kecil. Harus tetap rapi di mode HP (lihat task 27a).
24. S14 Menu attract angkasa, Pengaturan dan Tentang diperbarui, tombol ULTIMATE di mode HP, pemetaan tombol final di layar judul dan Pengaturan.
25. S15 Audio angkasa dan musik ambient generatif (opsi Musik).
26. A7 Dialog pilot (Raptor 13) dan Piko per stage.
27. S16 Optimasi dan preset kualitas (bloom, partikel, bintang, jarak muat).
27a. KONTROL HP (permintaan pemain 11 Nov, kerjakan setelah fitur utama selesai, sebelum S17): tombol sentuh terlalu kecil dan berupa tulisan sehingga sulit dibaca dan mudah salah pencet. Ganti dengan ikon SVG buatan sendiri (inline, tanpa aset luar) bergaya bersih seperti ikon iOS, perbesar area sentuh (minimal 56 sampai 64 px, tombol tembak lebih besar), beri jarak antar tombol, jangan ada tumpang tindih. Masalah terlihat di screenshot pemain: tombol ULTIMATE menimpa GULUNG dan BALIK, panel KECEPATAN menimpa bar ULTIMATE di kiri atas, panel kanan berdesakan dengan tombol manuver pada layar HP lanskap 852x393. Uji dengan viewport HP (misalnya 852x393 dan 390x844) dan pastikan tidak ada elemen saling menimpa (tes bounding box).
28. S17 dan B14 Pengujian menyeluruh dan perbaikan visual.
29. S18 README, screenshot, Ide lanjutan, self-review semua DEFINITION OF DONE, ringkasan jujur.

## Catatan teknis

- State game: boot, menu, starting, playing, paused, countdown, gameover, preview.
- Dunia aktif lewat `Worlds.active` (EarthWorld, SpaceWorld). Kapal lewat `SHIPS` dan `Player.setShip`.
- Hook debug di `window.__game` (snapshot, setSeed, startIn, skipTransition, debug.*).
- Uji: `tests/game.spec.mjs`, helper `start(page, { world })` memakai medan Bumi secara bawaan.
