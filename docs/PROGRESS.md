# Progres Pengerjaan RAPTOR13

Berkas ini adalah catatan kerja agar pengerjaan bisa dilanjutkan otomatis setelah jeda
(misalnya setelah limit pemakaian habis). Perbarui berkas ini setiap kali satu task selesai.

## Aturan kerja (selalu berlaku)

- Satu file `index.html`, Three.js 0.187.0 (dan addons dari CDN yang sama bila perlu), tanpa aset eksternal, tanpa npm untuk runtime.
- Tanpa em dash dan tanpa simbol ampersand di seluruh repo, termasuk kode (pakai if bertingkat, ternary, optional chaining).
- Commit per task dengan awalan `feat:`, `fix:`, `chore:`, `docs:` dan nomor task di pesan, lalu `git push` ke remote publik https://github.com/ahmadngiliyun00/raptor13 (cabang main, sudah tersambung sejak 11 Nov 2026). Jangan force push dan jangan rewrite riwayat.
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
- B11 layar PILIH MODE setelah Angkasa (Kampanye Tata Surya atau Jelajah Bebas, diingat di Save.settings.spaceMode); Campaign (10 stage di CONFIG.campaign.stages: Merkurius, Venus, Bumi dan Bulan, Mars, Sabuk Asteroid, Jupiter, Saturnus, Uranus, Neptunus, Pluto dan Sabuk Kuiper; jumlah gelombang per stage, gelombang makin berat per stage, bonus kredit, progres di Save.data.campaign); WarpGate (gerbang loncat berpusar muncul setelah gelombang stage bersih, dilewati dengan terbang menembusnya); Warp (lompatan sinematik 2,6 detik: FOV melebar, garis warp, kilat putih, pindah area, kendali dilepas sebentar); SolarMap (Tab atau tombol peta di toolbar, state 'map' membekukan dunia, orbit skala akar, sabuk, batas, posisi dan arah kapal, 11 tujuan warp; di Kampanye tombol warp terkunci); label stage di HUD; hook campaign, setStage, finishStage, passGate, warpTo, openMap, mapState, pikoReset. Helper uji start() kini memilih mode (bawaan free). Belum: kartu pembuka, kontrak dan layar Stage Clear (A6), bos stage 5, 8, 10 (B13).
- S9 dan A5 roster 15 jenis (ENEMY_BUILDERS, ENEMY_TYPES): Drone Pengintai, Sindikat Vanta (Penyerbu rentetan 3, Pengintai, Pemburu dengan rudal yang bisa ditembak, Penjaga tembakan menyebar, Penyergap menyamar dan menyergap dari belakang, Komandan berperisai dengan 2 pengawal), Penembak Jitu dengan garis bidik 1 detik, Penabur Ranjau dan ranjau, Kapal Pelindung berperisai pulih, Makhluk Angkasa ubur-ubur bertentakel dengan sengatan, Kapal Induk Kecil peluncur drone, Menara Pos tiga turret (menabraknya fatal). Semua model loft, lathe dan pelat, maksimal 1612 segitiga. Perisai di applyDamage, formasi V, baris, lingkaran lewat spawnGroup dan leader, mundur saat HP di bawah 30 persen, gelombang memakai antrean (Bumi tetap drone dan Penyerbu), roster Angkasa bertambah per gelombang. Metrik ekor kini hanya menghitung musuh yang membuntuti (di kerucut belakang dan terbang searah pemain); drone yang sudah lewat membelok menjauh. Hasil bot gelombang 7 sampai 9: tailRatio 0,06 sampai 0,14. Galeri ?gallery=1. Hook enemyInfo, roster, spawnGroup, damageEnemy, startWave, resetMetrics.
- B12 Cutscene (state 'cutscene' membekukan dunia, shot berisi from, to, lookFrom, lookTo, durasi, pembicara dan teks, callback start dan update untuk objek berskrip, letterbox 11vh, subtitle kecil di atas garis bawah, tombol LEWATI; Enter, Esc, tap atau klik melewati). Pembuka stage kampanye diputar sekali per stage (Save.data.campaign.intros), termasuk setelah warp lewat gerbang. Warp.start kini menerima onDone. Hook playCutscene, skipCutscene, cutscene. Helper uji start() melewati pembuka stage.
- S10 dan B13 Bosses (kerangka: BossPart dengan Health per bagian, bar HP besar di bawah kotak gelombang, peluru dan ultimate mengenai bagian, menabrak bos fatal), Penjaga Raksasa (Bumi tiap 5 gelombang, 2 fase), Penambang Raksasa (stage 5: bor berputar sebagai tanda lalu menyerbu, fase 2 lengan melempar batu), Pemburu Agung (stage 8: cepat, rentetan dan rudal, fase 2 tiga umpan tiruan), Sang Naga Vanta (stage 10: kepala dan 18 segmen mengikuti jejak berbasis jarak; fase 1 tiga generator perisai, turret dan drone; fase 2 mulut terbuka dengan laser bergaris peringatan 1 detik; fase 3 kejar-kejaran 50 detik dengan puing es dan tiga inti ekor; fase 4 inti dada yang hanya bisa dihabisi ultimate dalam 70 detik, hujan bintang merah), cutscene pembuka, peralihan fase, penutup bertahap dengan gerak lambat, layar akhir (skor, waktu, musuh, kredit dibawa pulang penuh, rating bintang) dengan LANJUT KE JELAJAH BEBAS atau MENU UTAMA. Hook startBoss, bossState, skipToPhase, damageBoss, finalState.
- S11 Levels (XP dari musuh skor/12 maksimal 60, asteroid, komet 20, bos 150, bintang emas 20; kebutuhan 100 x 1,35^(n-1)), layar kartu menjeda permainan (state 'levelup'), 3 kartu dari 13 (UPGRADE_CARDS) berbobot kelangkaan biasa 0,68, langka 0,26, epik 0,06 dengan warna berbeda, pilih dengan 1 sampai 3, panah dan Enter, atau klik; kartu berbatas (drone 2, kartu Piko 1) tidak ditawarkan lagi; perisai energi pemain (menyerap sebelum HP, pulih setelah 4 detik); HP maksimum dan kapasitas nitro dari kartu; Companions (maks 2 drone yang terikat di samping kapal dan menembak musuh terdekat di depan); bot uji memilih kartu otomatis. HUD baris LEVEL, bar XP tipis, label PERISAI. Hook addXp, levelUp, levelState, offerCards, pickCard, companions.
- A6 Contracts: setiap awal stage kampanye (setelah pembuka sekali per stage) kartu STAGE n beranimasi dan PILIH KONTRAK (state 'contract', angka 1 sampai 3): Buru Target (Komandan bertanda muncul setelah 6 detik, muncul lagi bila lepas), Kawal Konvoi (kapal kargo kawan 300 HP bergerak 42 unit per detik ke suar 2600 m; peluru musuh dan drone merusaknya; hancur berarti GAME OVER), Bersihkan Sektor (10 + 2 per stage musuh). Gelombang terus berjalan sampai kontrak selesai, lalu bos (bila ada), lalu layar STAGE CLEAR (skor, waktu, musuh, HP hilang, bonus kredit dan XP, rating 1 sampai 3 bintang disimpan di Save.data.campaign.ratings) dengan LANJUT (membuka gerbang loncat) atau KELUAR KE MENU (kredit dibawa penuh). Game over kampanye menampilkan stage terakhir. HUD baris misi. Pembantu uji settle() melewati cutscene, kontrak, dan kartu level.
- S13 HUD: Radar minimap canvas 150 px di kanan bawah kotak skor, berputar mengikuti arah kapal (atas = depan), penanda U, cincin jarak, titik musuh (ukuran sesuai radius, minor lebih kecil, Penyergap tersamar tidak tampak), target kontrak bercincin emas, bos berlian magenta, gerbang berlian biru, kargo dan suar tujuan hijau, bintang dan pickup, planet dan bulan (lingkaran sesuai radius bila dalam jangkauan, penanda di tepi bila di luar), segitiga ketinggian relatif, panah tujuan misi di tepi radar. Instrumen terbang di blok kiri bawah: horizon buatan (miring sesuai bank, bergeser sesuai pitch), ARAH dalam derajat dengan mata angin U, TL, T, TG, S, BD, B, BL, PITCH bertanda, BANK dengan KIRI atau KANAN (0 saat datar). Angka skor emas besar di posisi musuh yang hancur (membesar dengan kombo) dan angka merah besar saat kapal terkena. Panel Piko dipindah di atas blok instrumen. Hook radar.
- S14 KEYMAP satu sumber data ditampilkan di layar judul (tiga atau empat kolom, disembunyikan di layar sangat pendek) dan bagian Kontrol keyboard di Pengaturan; Tentang memuat kalimat "Raptor13 dibuat dengan Three.js oleh Ahmad Ngiliyun, bantuan Claude Code."; latar menu angkasa memakai area Saturnus (CONFIG.solar.attractArea). Tombol ULTIMATE di mode HP sudah ada sejak S8.
- S15 Music: musik ambient generatif orisinal (pad akor dua osilator berselisih nada, progresi Angkasa minor dan Bumi mayor, petikan nada akor acak lewat delay bergema, denyut bass saat ada bos, lebih pelan saat cutscene), bus sendiri ke master, opsi Musik dan Volume musik di Pengaturan, memakai Math.random agar tidak mengganggu RNG gameplay ber-seed. Suara pickup per warna sudah ada sejak S8. Hook music.
- A7 STAGE_DIALOG: dialog pembuka orisinal 2 sampai 3 baris per stage antara RAPTOR 13 dan PIKO (bernada petualangan dengan sedikit humor, fakta di dalamnya akurat), satu baris per shot di cutscene pembuka (sapuan planet, kapal, sisi kokpit); komentar Piko saat memilih kontrak. Hook stageDialog.
- S16 preset kualitas kini juga mengatur planetTex (512, 512, 1024), rocks (0,45, 0,8, 1 untuk batu cincin, sabuk, pita titik) dan loadRange (0,75, 0,9, 1 untuk jarak muat sabuk dan cincin). Peta malam dan awan Bumi setengah resolusi. Hasil ukur di Mac (Metal): semua skenario berat (Bumi, cincin Saturnus, sabuk dengan roster gelombang 8, naga) 60 FPS dengan kerja CPU 1,8 sampai 3,1 ms per frame di ketiga preset; bangun Tata Surya 390 ms (Rendah), 361 ms (Sedang), sekitar 1,3 detik (Tinggi, tertutup layar boot). Perbaikan alokasi per frame Penambang dan arah umpan Pemburu Agung. Hook quality.
- 27a kontrol HP: tombol aksi kini ikon SVG garis buatan sendiri tanpa teks (bidikan, api, panah melingkar, panah U, lingkaran berpanah, bintang) dengan aria-label; tata letak grid (D-pad 3x3 sel 60 atau 56 px jarak 8 px; aksi 4 kolom 56 atau 54 px dan baris bawah nitro 68 serta tembak 84 px, jarak 12 px) sehingga tidak bisa bertumpuk. HUD mode HP dipadatkan: blok kecepatan, kill dan instrumen disembunyikan, baris level disembunyikan, misi satu baris, skor saja di kanan, radar 72 px di bawah skor, bar bos dan panel data (nama saja) di tengah atas, panel Piko dan tumpukan peringatan di celah tengah bawah yang digeser 33 px. Hook layoutOverlaps memeriksa kotak batas; uji di 852x393, 667x375, 740x360, 932x430 (nol tumpang tindih, tombol minimal 52 px), uji fungsi tembak, manuver, ultimate lewat pointer, dan petunjuk putar layar di posisi tegak.
- S17 dan B14: dua putaran tinjauan visual seluruh layar (menu, medan, mode, hangar, gameplay angkasa, komet, ultimate, jeda, kartu level, peta, Jupiter, cutscene naga, naga, medan Bumi, bos Bumi, game over, kontrak, kawal konvoi, stage clear, gerbang) tanpa error konsol; deskripsi kartu Luar Angkasa diperbarui; uji cutscene diperbaiki agar tidak flaky. Kegagalan sesekali karena ERR_NETWORK_CHANGED berasal dari jaringan saat memuat Three.js dari CDN, bukan kode. 92 uji Playwright.
- S18 README ditulis ulang menyeluruh (fitur, kontrol, cara main, kapal, Tata Surya, roster dan bos, HUD, preset dan hasil ukur, pengujian, nilai CONFIG kunci, hook debug, keputusan desain, keterbatasan, Ide lanjutan, kredit) dengan galeri screenshot; docs/SELF-REVIEW.md meninjau semua butir Definition of Done; versi 2.0.0. Semua task di daftar ini selesai.
- Simpan dan muat sesi (permintaan pemain 12 Nov): SessionSave dengan adaptor Store di localStorage kunci raptor13.session.v1; simpan otomatis tiap 10 detik, saat jeda, ke menu, tab disembunyikan, pagehide, dan tombol SIMPAN di menu jeda; LANJUTKAN di menu setelah reload dengan ringkasan; MULAI meminta konfirmasi bila ada simpanan; dihapus saat game over, tamat, keluar dari Stage Clear. Di Bumi kapal kembali ke titik aman, di Angkasa posisi dipulihkan. Rencana APK: ganti adaptor Store dengan penyimpanan native bila perlu. Pembantu uji clickStart.
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
17. (SELESAI) B11 Mode Kampanye 10 stage dan Jelajah Bebas, peta Tab dan warp. Menggantikan S12.
18. (SELESAI) S9 dan A5 Roster musuh (8 jenis ditambah 6 kapal Sindikat Vanta), tembakan adil, `?gallery=1`.
19. (SELESAI) B12 Sistem cutscene.
20. (SELESAI) S10 dan B13 Mini-boss (stage 5 Penambang Raksasa, stage 8 Pemburu Agung) dan final boss Sang Naga Vanta 4 fase. Medan Bumi: bos tiap 5 gelombang.
21. (SELESAI) S11 XP, level, kartu upgrade (kelangkaan), drone pendamping.
22. (SELESAI) A6 Sistem stage (kartu pembuka, kontrak Buru Target, Kawal Konvoi, Bersihkan Sektor, layar Stage Clear dan rating, kredit).
23. (SELESAI) S13 HUD baru (radar, XP, ultimate, bar bos, misi, angka besar). Tambahan permintaan pemain 11 Nov: MINIMAP di sisi kiri atau kanan yang menampilkan musuh (dan pickup, asteroid besar, planet terdekat) relatif terhadap arah kapal, ikut berputar sesuai heading; ditambah instrumen terbang: heading atau kompas dalam derajat, sudut pitch (naik turun) dan bank atau kemiringan (kanan kiri) dalam derajat dengan titik 0 saat datar seperti posisi awal, serta ketinggian atau jarak dari titik 0 (di Bumi ketinggian, di Angkasa jarak ke permukaan dan posisi relatif titik mulai). Bisa berupa indikator horizon buatan kecil. Harus tetap rapi di mode HP (lihat task 27a).
24. (SELESAI) S14 Menu attract angkasa, Pengaturan dan Tentang diperbarui, tombol ULTIMATE di mode HP, pemetaan tombol final di layar judul dan Pengaturan.
25. (SELESAI) S15 Audio angkasa dan musik ambient generatif (opsi Musik).
26. (SELESAI) A7 Dialog pilot (Raptor 13) dan Piko per stage.
27. (SELESAI) S16 Optimasi dan preset kualitas (bloom, partikel, bintang, jarak muat).
27a. (SELESAI) KONTROL HP (permintaan pemain 11 Nov, kerjakan setelah fitur utama selesai, sebelum S17): tombol sentuh terlalu kecil dan berupa tulisan sehingga sulit dibaca dan mudah salah pencet. Ganti dengan ikon SVG buatan sendiri (inline, tanpa aset luar) bergaya bersih seperti ikon iOS, perbesar area sentuh (minimal 56 sampai 64 px, tombol tembak lebih besar), beri jarak antar tombol, jangan ada tumpang tindih. Masalah terlihat di screenshot pemain: tombol ULTIMATE menimpa GULUNG dan BALIK, panel KECEPATAN menimpa bar ULTIMATE di kiri atas, panel kanan berdesakan dengan tombol manuver pada layar HP lanskap 852x393. Uji dengan viewport HP (misalnya 852x393 dan 390x844) dan pastikan tidak ada elemen saling menimpa (tes bounding box).
28. (SELESAI) S17 dan B14 Pengujian menyeluruh dan perbaikan visual.
29. (SELESAI) S18 README, screenshot, Ide lanjutan, self-review semua DEFINITION OF DONE, ringkasan jujur.

## Blok E1, D, C, E: zoom, penyelesaian 2.3.x, pembaruan besar, Piko dan senjata (permintaan pemain 14 Nov)

Sumber: tiga prompt pemilik (pembaruan 01, 02, 03; disimpan lokal, tidak dikomit). Urutan resmi 02, 01, 03,
tetapi bug zoom dari prompt 03 (E1, E2) dikerjakan PALING AWAL karena merusak game di situs live (bukti
screenshot iPhone 12 Chrome iOS di docs/bug/zoom-ios/) dan tidak bergantung pada task lain. Commit per task.

Bagian 1 (prompt 03, prioritas tertinggi):
- E1 (SELESAI, eb9eb95) Reproduksi bug zoom dan ukuran canvas, daftar sumber ukuran, docs/bug/zoom-viewport.md
- E2 (SELESAI, f173f69) Ukuran berbasis layout viewport, abaikan zoom, penjaga kewarasan, lantai resolusi dinamis, Reset tampilan, overlay diag, tes lintas skala

Bagian 2 (prompt 02, versi patch 2.3.1):
- D1 (SELESAI sebagian, 864bb68) Skrip dan panduan deploy; deploy BELUM dijalankan karena host ssh belum ada
- D2 (SELESAI, 07ab499) Bot terampil dan rata-rata, TTK bos, penyetelan BOSS_PILOT, telemetri lokal
- D3 (SELESAI, 755eb76) Penanda bos ringkas, jarak aman dari crosshair
- D4 (SELESAI, 7b65791) Audit hitbox, objek tipis, showHitboxes, ambang fatal, indikator bahaya fatal
- D5 (SELESAI, 3a3d246) Keterlihatan bos jauh, ukur ulang 576 kombinasi
- D6 (SELESAI, 68e1133) Verifikasi developer Android, keputusan Capacitor versus TWA, skrip sidik jari, naskah kartu, checklist
- D7 (SELESAI, 91a3b80) Overlay diagnostik zoom dan panduan uji manual
- D8 (SELESAI) Regresi, SELF-REVIEW, 2.3.1, CHANGELOG, tag, rilis

SELF-REVIEW D1 sampai D7 (2.3.1):
- D1: skrip tidak menebak host, memakai BatchMode dan `--ff-only`, tidak mengubah konfigurasi server. Kurang:
  deploy tidak bisa dijalankan dari Mac ini; situs live masih 2.2.0.
- D2: bot memakai batasan kapal pemain dan kerusakan sungguhan. Normal masuk target untuk tiga bos reguler.
  Kurang: Sulit di atas target, Naga tidak terkalahkan bot (butuh keputusan desain pemilik), belum diuji manusia.
- D3: jarak sudut braket ke crosshair minimal 30 px di lima ukuran layar. Kurang: hanya diukur di emulasi.
- D4: semua objek dalam toleransi 15 persen kecuali hitbox pemain yang sengaja pemaaf. Indikator fatal tidak
  muncul untuk benda tidak fatal. Kurang: sayap tetap diwakili bola.
- D5: 0 dari 576 kombinasi tidak terlihat. Ditemukan dan diperbaiki penanda hilang saat bos di luar bidang
  jauh kamera Bumi. Kurang: belum dicek di layar HP asli.
- D6: sumber resmi dicek 14 November 2026, keputusan dan checklist tertulis. Kurang: angka batas perangkat
  distribusi terbatas berbeda antar sumber (20 atau 50), ditandai untuk dicek ulang pemilik.
- D7: overlay dan hook diuji terkunci tanpa parameter. Kurang: zoom iOS asli hanya bisa dipastikan di iPhone.
- Uji B5 sempat tidak stabil (runtun ekor 9,52 detik di Sulit, batas 9); pembatas ekor diperkuat dan uji
  lolos 9 kali berturut-turut.
- Regresi penuh 2.3.1: 176 lolos, 9 dilewati (uji khusus WebKit atau Chromium), 1 gagal karena tidak stabil:
  uji antrean notifikasi H9 terganggu sapaan Piko saat pickup langka muncul acak. Uji kini mematikan Piko
  selama bagian antrean, lalu lolos 4 kali berturut-turut.

Bagian 3 (prompt 01, versi minor 2.4.0):
- C1 (SELESAI) Kontras UI adaptif
- C2 (SELESAI) Tata letak HUD baru (busur tombol)
- C3 (SELESAI) Editor tata letak HUD
- C4 (SELESAI) Data dan aturan equipment
- C5 (SELESAI) UI equipment
- C6 (SELESAI) Pengujian equipment dan keseimbangan
- C7 (SELESAI) Persistensi dan keamanan data baru
- C8 (SELESAI) Open source (lisensi, kontribusi, templat, CI, arsitektur, roadmap)
- C9 (SELESAI) PWA
- C10 Android Capacitor (APK)
- C11 Workflow rilis APK
- C12 iOS
- C13 Regresi, versi, rilis
- C14 Verifikasi akhir

Bagian 4 (prompt 03 sisa, versi minor 2.5.0):
- E3 Piko gerak mandiri
- E4 Piko menempel (tuck)
- E5 Senjata bertingkat berbasis hardpoint
- E6 Diagnosis kehalusan penerbangan
- E7 Perbaikan penerbangan
- E8 Manuver Putar Balik U
- E9 Uji kehalusan, bot, TTK
- E10 Regresi, versi, rilis, deploy bila siap

## Blok BT: petunjuk bos, tabrakan berbasis ukuran, zoom dua kali ketuk, rencana APK (permintaan pemain 13 Nov)

Nomor task mengikuti spesifikasi pemain (B1 sampai B10, berbeda dari B1 sampai B11 Fase 0 di atas).
Aturan tambahan: satu `index.html` tanpa build step; mode keyboard desktop, anggaran performa (draw call,
frame time), keamanan (CSP, hook hanya lewat `?debug=1`), tata letak HP (anggaran blok H) dan perbaikan
kotak hitam tidak boleh mundur; semua ikon bos orisinal; setiap klaim disertai angka atau screenshot.
HP bos, damage senjata, HP musuh, dan hadiah tidak berubah.

- B1 (SELESAI) Diagnosis bos tidak terlihat: hook `debug.bossProbe` (piksel bos terlihat dan kontras, dengan dan tanpa bos), semua bos di semua dunia pada jarak 50, 150, 400, 1200, dengan dan tanpa bloom, kualitas Rendah; metrik baseline perilaku bos; `docs/bos/diagnosis.md`.
- B2 (SELESAI) Keterlihatan bos: emissive dan rim light, kontur siluet (maksimal satu draw call per bos), penanda piksel minimum, bos tidak tertutup planet, opsi Sorotan bos (Mati, Halus, Kuat).
- B3 (SELESAI) Ikon bos orisinal, penanda di atas bos, panah tepi layar dengan arah putar, indikator BOS DI BELAKANG, peringatan awal, aman di mode HP.
- B4 (SELESAI) Jejak bos, panah arah gerak, titik bidik prediksi (ikut Bantuan bidik), blip radar dengan ikon dan garis putus-putus, ikon bos di Peta Tata Surya.
- B5 (SELESAI) Perilaku bos: siklus mendekat, serang lewat depan, lewat dan menjauh, berputar; batas waktu di ekor; jendela rentan; parameter per kesulitan; `debug.bossMetrics`; `docs/bos/perilaku.md`.
- B6 (SELESAI) Tabrakan berbasis ukuran dan energi: COLLISION_TIERS, tiga tingkat, cooldown per objek, sapuan anti tembus, umpan balik, `debug.collisionTest`, `docs/fisika/tabrakan.md`.
- B7 (SELESAI) Cegah zoom dua kali ketuk dan cubit di iOS: meta, CSS, JS, fallback visualViewport, input 16 px, uji WebKit, langkah uji manual.
- B8 (SELESAI) Rencana APK `docs/apk/rencana-apk.md` (dokumen saja).
- B9 (SELESAI) Regresi penuh, screenshot, CHANGELOG, GAME_VERSION, tag, rilis.
- B10 (SELESAI) Verifikasi Definition of Done dan ringkasan jujur.

## Blok H: tata letak dan kontrol mode HP landscape (permintaan pemain 13 Nov)

Fokus hanya UI dan UX mode HP landscape. Gameplay, keseimbangan, AI musuh, dunia, audio, mode keyboard
desktop, dan semua hook debug tidak berubah. Matriks uji: 568x320, 667x375, 740x360, 812x375, 844x390,
915x412, 932x430, ditambah ?safearea=47,0,47,21. Anggaran idle: HUD dan kontrol maksimal 22 persen luas
layar, tiap cluster maksimal 30 persen tinggi dan 26 persen lebar, zona tengah (x 30 sampai 70 persen,
y 20 sampai 80 persen) bebas UI.

- H1 (SELESAI) Audit CSS mode HP, var --u (clamp(34px, 11vh, 48px), dari visualViewport), --sa-l/t/r/b = max(safe-area, 8px), override ?safearea=kiri,atas,kanan,bawah, hapus penjumlahan 16px dengan safe-area.
- H2 (SELESAI) Joystick analog melayang (separuh kiri, deadzone 12 persen, kurva halus, lewat Controls), cluster aksi baru (tembak pojok kanan bawah, nitro di atasnya, 2x2 manuver dan ultimate), hit slop 44 px, opsi Ukuran kontrol, Transparansi, Mode kidal, Gaya kontrol kiri (Joystick atau Tombol arah).
- H3 (SELESAI) HUD kompak (kiri atas 150x48, baris misi tengah atas, kanan atas hanya Jeda dan Suara), radar 48 sampai 56 px dengan ikon peta, teks minimum 11 px.
- H4 (SELESAI) Pusat notifikasi tunggal dengan antrean prioritas (Piko, area, pickup, level, kontrak), indikator tepi untuk peringatan kritis, Bantuan robot: Penuh, Ringkas, Hanya ikon, Mati.
- H5 (SELESAI) Kamera mode HP: jarak dan offset agar pesawat maksimal 18 persen tinggi di sepertiga bawah, opsi Jarak kamera.
- H6 (SELESAI) Menu dua kolom, jeda dua kolom, pengaturan bertab, kartu kontrak dan level, game over, stage clear, peta, hangar, atlas muat di 320 px; teks petunjuk per mode; overlay menyembunyikan HUD.
- H7 (SELESAI) Deteksi perangkat sentuh otomatis, layar penuh dan kunci orientasi, petunjuk Tambahkan ke Layar Utama di iOS, overlay putar layar.
- H8 (SELESAI) willReadFrequently, Enter di Pilih Mode, kualitas Rendah dan bloom mati di perangkat sentuh.
- H9 (SELESAI) Uji Playwright matriks penuh, debug.stressHud, layoutOverlaps diperluas, screenshot docs/screenshots/hp/, dua putaran perbaikan.
- H10 (SELESAI) README dan self-review Definition of Done blok H.

## Blok A: audit performa, panas, keamanan, UI/UX, dan tag rilis (permintaan pemain 13 Nov)

Aturan tambahan: tetap satu `index.html` tanpa build step; gameplay, keseimbangan, AI musuh, dan isi
konten tidak berubah; tampilan hanya boleh turun lewat tingkat kualitas dan kualitas Tinggi tetap
secantik sebelumnya; setiap temuan dicatat dengan angka sebelum dan sesudah; commit per task dengan
awalan perf:, security:, fix:, docs:, chore:, test:; tanpa rewrite riwayat. Urutan pengerjaan:

- (SELESAI) A1 Baseline dan profiling: hook debug.perf(), skrip CDP tests/perf/profile.mjs (menu, Bumi,
  angkasa ramai; DPR 1, 2, 3; emulasi 120 Hz), cek butir a sampai n, peringkat akar masalah,
  docs/audit/baseline.md.
- (SELESAI) A2 Perbaikan performa dan panas: batas FPS berbasis akumulator, batas DPR dan resolusi dinamis,
  Mode performa (Otomatis, Hemat baterai, Seimbang, Kualitas tinggi), berhenti render saat tersembunyi
  dan di layar statis, langit dipanggang ke cubemap, bloom setengah resolusi, pooling dan dispose,
  HUD dan DOM, audio, uji kebocoran, overlay F3, docs/audit/performa.md dan docs/audit/cara-mengukur.md.
- (SELESAI) A3 Audit keamanan: validasi localStorage, injeksi, hook debug hanya dengan ?debug=1, Three.js
  ditanam lokal dengan SRI, CSP, header server dan .htaccess, rantai pasok, pindai rahasia riwayat
  git, ketahanan WebGL dan penyimpanan, privasi, docs/audit/keamanan.md.
- (SELESAI) A4 Audit UI/UX mobile dan desktop: tutorial singkat, konsistensi, haptik, aksesibilitas (ukuran
  teks, kurangi gerakan, buta warna, ARIA, fokus), kenyamanan (wake lock, anti gulir, peringatan
  tutup), layar muat dan error, desktop 1280 sampai 2560 dan ultrawide, docs/audit/ui-ux.md,
  screenshot sebelum dan sesudah di docs/screenshots/audit/.
- (SELESAI) A7 Kotak hitam berkedip di menu: reproduksi, eliminasi, akar masalah, debug.glitchProbe dan
  ?diag=1, pra-pemanasan shader dan tekstur, fungsi resize tunggal, pemulihan konteks WebGL,
  docs/audit/glitch-kotak-hitam.md.
- (SELESAI) A5 Pengujian dan regresi: uji kebocoran, console bersih termasuk CSP, localStorage rusak, query
  berbahaya, hook terkunci, mode performa, jeda saat tersembunyi, tata letak; metrik bot dibanding
  baseline; docs/audit/ringkasan.md.
- (SELESAI) A6 Versi dan rilis: docs/rilis/rencana-tag.md, tag v1.0.0, v2.0.0, v2.1.0 (akhir blok H) dan
  v2.2.0 (akhir audit), GAME_VERSION tunggal, CHANGELOG.md, README, GitHub Release.

Hasil blok A: `docs/audit/ringkasan.md`. Setelah mengubah skrip atau style di `index.html`, jalankan
`node tests/csp.mjs --write` (hash CSP), lalu `npx playwright test`. Hook uji hanya dengan `?debug=1`.

## Catatan teknis

- State game: boot, menu, starting, playing, paused, countdown, gameover, preview.
- Dunia aktif lewat `Worlds.active` (EarthWorld, SpaceWorld). Kapal lewat `SHIPS` dan `Player.setShip`.
- Hook debug di `window.__game` (snapshot, setSeed, startIn, skipTransition, debug.*).
- Uji: `tests/game.spec.mjs`, helper `start(page, { world })` memakai medan Bumi secara bawaan.
- SEO dan ikon (permintaan pemain 13 Nov): meta deskripsi, kata kunci, penulis dan hak cipta Ahmad Ngiliyun, Open Graph dan kartu X, data terstruktur VideoGame, `manifest.webmanifest`, logo SVG di `icons/` yang diekspor ke ICO dan PNG, serta gambar pratinjau `icons/og-image.jpg`. Setelah dihosting, ganti alamat og:image dengan alamat lengkap.
