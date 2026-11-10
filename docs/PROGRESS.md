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

## Urutan task berikutnya (blok terakhir menang bila bertentangan)

Fase 0, rasa main (paling awal):
1. (SELESAI) B1 Model terbang quaternion bebas (looping penuh dengan menahan W atau S), kecepatan plus minus 15 persen saat menukik atau menanjak, penstabil otomatis (opsi, default hidup), roll kamera diredam (opsi "Kamera ikut berguling", default mati), Shift tahan untuk lihat belakang.
2. (SELESAI) B2 Manuver Z Gulung Tong (kebal peluru selama gulungan, arah ikut A atau D, juga ketuk ganda A atau D), X Balik Arah (Immelmann), C Looping. Cooldown 4 sampai 6 detik di CONFIG, indikator HUD, tiga tombol kecil di mode HP.
3. B3 Tabrakan fatal (tanah, laut, gunung, pilar, planet, stasiun, bos, asteroid raksasa) langsung game over dengan penyebab; hapus bantuan naik otomatis dan lantai ketinggian; efek ledakan besar, gerak lambat 0,8 detik, kamera orbit; peringatan TERLALU RENDAH atau TARIK NAIK; opsi "Tabrakan fatal" (default hidup, bila mati hanya damage besar dan pantulan).
4. B4 AI musuh: kecepatan 70 sampai 85 persen pemain, maksimum 80 persen kecepatan nitro; siklus APPROACH, ATTACK (tanda sebelum menembak), BREAK, REPOSITION; 80 persen spawn di kerucut depan; jarak pisah antar musuh; kebal 1 detik setelah damage; penanda lead; bantuan bidik Mati, Rendah, Sedang (default Rendah); peringatan musuh di belakang; metrik tes waktu musuh di kerucut belakang dan tabrakan per menit di bawah ambang CONFIG.
5. B5 Laju tembak cooldown 0,10 sampai 0,12 detik, kecepatan peluru sekitar 3 kali, bolt plasma merah oranye dengan inti putih dan halo, peluru musuh berbeda (bulat merah magenta); buff OVERDRIVE (laju 1,6 kali) dan PENGHANCUR (damage 1,5 kali) 10 detik dengan ikon dan penghitung; pickup kristal; kartu upgrade permanen (disiapkan untuk sistem kartu S11).
6. B6 Awan Bumi volumetrik low-poly instanced (kumulus, stratus, serat), dua lapisan, memudar saat kamera dekat, tanpa popping.
7. B7 Audio mesin: brown noise lewat lowpass ditambah dua sine atau triangle 50 sampai 90 Hz; nitro: whoosh bandpass 400 sampai 2500 Hz 0,4 detik ditambah sub-bass sekali lalu desis; compressor master; tes sanity tanpa NaN dan gain master di bawah 1.

Fase berikutnya:
8. A2 Hangar Pilih Kapal (alur MULAI, Pilih Medan, Pilih Kapal), kredit, buka kapal, save v3 dengan migrasi.
9. S3 Skybox angkasa (bintang paralaks 3 lapis, nebula, debu dekat kamera, warp streak saat nitro), matahari dan lens flare, EffectComposer dan UnrealBloomPass sesuai preset kualitas.
10. A3 Starfighter bersayap empat konfigurasi X dengan sayap dinamis dan thruster manuver, varian Interceptor (500 kredit) dan Gunship (1200 kredit), `?shippreview=` (starfighter, jet, interceptor, gunship, piko), minimal 3 putaran iterasi visual.
11. A4 Robot Piko (model loft, ekspresi mata, bip, panel HUD bersubtitle, batas frekuensi, opsi Bantuan robot, 3 kartu upgrade).
12. S6 Asteroid angkasa ukuran kontinu dan 4 jenis (batu, es, logam, kristal) serta komet berekor.
13. S8 Pickup bintang warna (merah ultimate, hijau HP, biru nitro, emas XP dan skor, ungu nyawa) dan ultimate laser E.
14. B8 Tata Surya (Matahari, 8 planet, Pluto, bulan, tekstur prosedural, cahaya dari Matahari). Menggantikan S5 dan S7.
15. B9 Cincin berisi asteroid instanced dengan LOD ke objek ber-HP, Sabuk Asteroid, Sabuk Kuiper.
16. B10 Latar Bima Sakti, galaksi, black hole; batas jelajah dan dinding energi; panel data fakta akurat dan daftar Penemuan.
17. B11 Mode Kampanye 10 stage dan Jelajah Bebas, peta Tab dan warp. Menggantikan S12.
18. S9 dan A5 Roster musuh (8 jenis ditambah 6 kapal Sindikat Vanta), tembakan adil, `?gallery=1`.
19. B12 Sistem cutscene.
20. S10 dan B13 Mini-boss (stage 5 Penambang Raksasa, stage 8 Pemburu Agung) dan final boss Sang Naga Vanta 4 fase. Medan Bumi: bos tiap 5 gelombang.
21. S11 XP, level, kartu upgrade (kelangkaan), drone pendamping.
22. A6 Sistem stage (kartu pembuka, kontrak Buru Target, Kawal Konvoi, Bersihkan Sektor, layar Stage Clear dan rating, kredit).
23. S13 HUD baru (radar, XP, ultimate, bar bos, misi, angka besar).
24. S14 Menu attract angkasa, Pengaturan dan Tentang diperbarui, tombol ULTIMATE di mode HP, pemetaan tombol final di layar judul dan Pengaturan.
25. S15 Audio angkasa dan musik ambient generatif (opsi Musik).
26. A7 Dialog pilot (Raptor 13) dan Piko per stage.
27. S16 Optimasi dan preset kualitas (bloom, partikel, bintang, jarak muat).
28. S17 dan B14 Pengujian menyeluruh dan perbaikan visual.
29. S18 README, screenshot, Ide lanjutan, self-review semua DEFINITION OF DONE, ringkasan jujur.

## Catatan teknis

- State game: boot, menu, starting, playing, paused, countdown, gameover, preview.
- Dunia aktif lewat `Worlds.active` (EarthWorld, SpaceWorld). Kapal lewat `SHIPS` dan `Player.setShip`.
- Hook debug di `window.__game` (snapshot, setSeed, startIn, skipTransition, debug.*).
- Uji: `tests/game.spec.mjs`, helper `start(page, { world })` memakai medan Bumi secara bawaan.
