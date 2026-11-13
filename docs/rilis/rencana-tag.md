# Rencana tag rilis (A6)

Repo belum punya tag. Tag dibuat beranotasi (`git tag -a`) dengan `GIT_COMMITTER_DATE` dan
`GIT_AUTHOR_DATE` sama dengan tanggal commit yang ditandai, sehingga urutan tag mengikuti sejarah. Tidak
ada commit yang diubah, di-rebase, atau di-amend.

## Tabel tag

| Tag | Hash commit | Tanggal (WIB) | Pesan commit | Alasan pemilihan | Bukti dapat dijalankan |
| --- | --- | --- | --- | --- | --- |
| v1.0.0 | `95d12e94b892ff889f567e89120c33b0f85440a6` | 2026-11-11 01:19:23 | fix: uji game over membaca skor tertinggi dari save berversi raptor13.v1 | Commit terakhir generasi pertama, tepat sebelum `95707e4` (S2) yang memulai perombakan ke angkasa. Semua syarat definisi ada: jet Raptor-J (J1 sampai J8 selesai), nyawa dan HP (T10), asteroid ber-HP (T8), menu utama (T13), pengaturan dan simpan lokal berversi (T15), layar Tentang atau kredit, jeda dengan hitung mundur 3-2-1 (T14), plus perbaikan awal S1 dan T17 | Termuat ke menu, Tentang menampilkan 1.1.0, masuk permainan Bumi, 18 tembakan, 3 nyawa, 60 FPS, console bersih |
| v2.0.0 | `e5ca2722cd962fb6632604f97c6f1c185bf580cc` | 2026-11-11 12:53:01 | docs: S18 README lengkap dengan screenshot, Ide lanjutan, self-review Definition of Done, versi 2.0.0 | Commit yang menetapkan versi 2.0.0 (`CONFIG.version` berubah dari 1.1.0 ke 2.0.0, README dan self-review). Seluruh fitur generasi kedua sudah selesai di commit ini: Tata Surya dengan Kampanye 10 stage, Jelajah Bebas, Sang Naga Vanta, manuver aerobatik, kapal dan hangar, Piko | Termuat ke menu, Tentang 2.0.0, masuk permainan Bumi, 16 tembakan, 60 FPS, console bersih |
| v2.1.0 | `2f582565a7837811cfa6ab90520f56f6fd12e239` | 2026-11-13 13:51:54 | docs: H10 README mode HP (...) dan self-review blok H | Commit terakhir blok H (H1 sampai H10, tata letak HP landscape). Memuat juga simpan dan muat sesi (12 Nov) serta SEO dan manifest (13 Nov) yang muncul setelah 2.0.0. Perbaikan dan penyempurnaan tanpa mengubah gameplay inti, jadi naik minor | Termuat ke menu, Tentang 2.0.0, masuk permainan Bumi, 16 tembakan, 60 FPS, console bersih1 |
| v2.2.0 | commit akhir audit blok A (dicatat di bagian Verifikasi) | 2026-11-13 | lihat Verifikasi | Akhir audit performa, keamanan, UI/UX, dan glitch: perbaikan dan penyempurnaan tanpa mengubah gameplay (metrik bot identik), naik minor | seluruh uji lolos, lihat `docs/audit/ringkasan.md` |

## Ambiguitas dan keputusan jujur

1. **Nomor 1.0.0 di kode.** Versi 1.0.0 pertama kali ditulis di `97f16cd` (2026-11-11 00:35, "versi 1.0.0
   dan bebas ampersand"), tetapi saat itu game belum punya nyawa, menu utama, pengaturan, simpan lokal,
   maupun jeda dengan hitung mundur (semuanya datang di T2 sampai T17 sesudahnya). Satu menit kemudian
   `b9e1b23` (T2) menaikkan `CONFIG.version` menjadi 1.1.0, dan angka itu bertahan sampai `95d12e9`.
   Definisi pemilik untuk v1.0.0 menyebut fitur-fitur tersebut secara eksplisit, jadi v1.0.0 ditandai di
   `95d12e9`, walaupun teks versi di dalam berkas commit itu tertulis 1.1.0. Konsekuensi: game pada tag
   v1.0.0 menampilkan "Versi 1.1.0" di layar Tentang. Ini dicatat di pesan tag.
2. **Usulan tonggak antara (tidak dibuat).** `97f16cd` bisa dianggap v1.0.0-awal (versi pertama yang
   lengkap dan berjalan: terbang, menembak, musuh, HUD), dan `95d12e9` sebagai v1.1.0 sesuai teks di
   kode. Karena definisi pemilik meminta v1.0.0 sebagai akhir generasi pertama dan hanya tag v1.0.0,
   v2.0.0, dan tag pekerjaan ini yang dibuat kecuali bukti sangat jelas, tag tambahan tidak dibuat.
3. **Fitur setelah 2.0.0.** Simpan dan muat sesi (`03d7afa`) serta SEO (`fc202b2`, `35eb0bd`) terjadi
   setelah versi 2.0.0 ditetapkan dan sebelum blok H; keduanya masuk catatan v2.1.0.
4. **Versi di kode untuk v2.1.0.** Di `2f58256` teks versi masih 2.0.0 (belum pernah dinaikkan). Tag
   v2.1.0 tetap dibuat di commit itu sesuai permintaan; teks versi di kode dinaikkan langsung ke 2.2.0
   pada akhir audit (`GAME_VERSION`).

## Verifikasi sebelum membuat tag

Setiap commit kandidat di-checkout ke `git worktree` terpisah (working tree utama tidak disentuh), dilayani
server statis, dimuat di Chromium dengan GPU asli, permainan dimulai di medan Bumi, kapal digerakkan dan
menembak, lalu galat console dicatat (`node tests/perf/tagcheck.mjs <hash>`, hasil di
`docs/rilis/data/tagcheck.json` dan screenshot `docs/rilis/data/<hash>.jpg`). Commit lama memuat Three.js
dari jsDelivr.

| Commit | Menu | Versi di Tentang | State setelah mulai | Tembakan | FPS | Galat console |
| --- | --- | --- | --- | --- | --- | --- |
| `95d12e9` | ya | 1.1.0 | playing | 18 | 60 | 0 |
| `e5ca272` | ya | 2.0.0 | playing | 16 | 60 | 0 |
| `2f58256` | ya | 2.0.0 | playing | 15 | 60 | 0 |

Selain itu seluruh 141 uji Playwright lolos di commit akhir audit sebelum tag v2.2.0 dibuat.
