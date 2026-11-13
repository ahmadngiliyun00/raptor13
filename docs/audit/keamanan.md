# Audit keamanan (A3)

Ruang lingkup: aplikasi statis sisi klien `index.html` (satu modul JavaScript inline), Three.js, penyimpanan
lokal, parameter URL, hook uji, header server, riwayat git. Tidak ada server aplikasi, akun, atau
komunikasi jaringan sehingga risiko utama adalah injeksi DOM, data lokal yang dimanipulasi, rantai pasok
CDN, dan konfigurasi hosting.

## Ringkasan temuan

| ID | Temuan | Keparahan | Bukti | Status | Risiko tersisa |
| --- | --- | --- | --- | --- | --- |
| K1 | Three.js dimuat dari jsDelivr tanpa SRI. CDN yang disusupi bisa menjalankan kode apa pun di halaman, dan setiap pemain mengirim alamat IP serta referrer ke CDN. | Tinggi | importmap lama menunjuk `https://cdn.jsdelivr.net/npm/three@0.187.0/...` tanpa `integrity` | Diperbaiki: berkas resmi npm ditanam di `vendor/three-0.187.0/`, importmap dengan integrity sha384, uji menolak permintaan keluar apa pun | Integrity importmap diabaikan browser lama (sebelum Chrome 127, Safari 18), tetapi berkas sudah satu origin |
| K2 | Tidak ada Content Security Policy | Sedang | tidak ada meta atau header CSP | Diperbaiki: meta CSP `default-src 'none'`, `script-src 'self'` ditambah hash sha256 dua skrip inline, `style-src 'self'` ditambah hash style, `connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, tanpa `unsafe-inline` dan `unsafe-eval`. Header server menambah `frame-ancestors 'none'`. Uji gagal bila hash usang atau ada pelanggaran di console | Hash wajib diperbarui (`node tests/csp.mjs --write`) setiap skrip atau style inline berubah; dijaga uji |
| K3 | Hook uji `window.__game` (mode kebal, kredit, lompat stage, hapus sesi) dan alat pratinjau terbuka di produksi | Sedang | `window.__game` selalu dipasang | Diperbaiki: hanya dipasang bila `?debug=1`, tidak dapat ditulis ulang, pratinjau dan galeri juga butuh `?debug=1`. Uji memakai `gameUrl()` yang menambah parameter itu | Siapa pun tetap bisa membuka `?debug=1` di perangkatnya sendiri; dampaknya hanya curang di permainan lokal miliknya |
| K4 | Simpanan sesi dimuat tanpa batas atas: skor, kredit, level, upgrade, gelombang, posisi bisa disuntik nilai ekstrem (misalnya gelombang 1e12 membuat antrean musuh raksasa, level 1e9 membuat kebutuhan XP tak hingga) | Sedang | `SessionSave.load` hanya memeriksa `Number.isFinite`; `Levels.picks` disalin apa adanya; `k.reward` objek bebas | Diperbaiki: rentang ketat untuk setiap angka, kunci kartu hanya dari `UPGRADE_CARDS`, hadiah kontrak divalidasi, posisi di luar batas jelajah diganti titik aman, ukuran JSON maksimal 200 KB | Tidak ada |
| K5 | Pencarian berbasis kunci dari data tersimpan mewarisi prototipe: `contract.type = "constructor"` atau `area = "constructor"` lolos dan membuat crash saat memuat | Sedang | `CONTRACT_TYPES[k.type]` dan `SolarSystem.byId[s.area]` bernilai truthy untuk `constructor` | Diperbaiki: `Object.hasOwn` dan pemeriksaan tipe string | Tidak ada |
| K6 | Ringkasan LANJUTKAN memakai `stageIdx` tanpa validasi: nilai bukan angka membuat layar judul crash | Rendah | `CONFIG.campaign.stages[clamp(NaN)]` | Diperbaiki | Tidak ada |
| K7 | Profil tersimpan tanpa batas atas angka (skor tertinggi, kredit, statistik) | Rendah | `Save.sanitize` hanya `Math.max(0, ...)` | Diperbaiki: skor dan statistik maksimal 1e12, kredit 1e9, kunci lama `raptor13.highscore` dipotong 15 digit | Tidak ada |
| K8 | `innerHTML` untuk ikon kontrak, bar statistik hangar (dengan atribut `style` inline), dan pembersihan teks Piko | Rendah | tiga pemanggilan; semua data berasal dari konstanta, bukan masukan pemain | Diperbaiki: `createElementNS`, `textContent`, `style.setProperty`, `replaceChildren`. Tidak ada lagi `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `document.write`, `eval`, `new Function`, atau `setTimeout` dengan string | Tidak ada |
| K9 | Parameter URL kurang ketat: `?shippreview=` menerima string bebas, `?safearea=` tanpa batas atas | Rendah | `PREVIEW_ID` mengembalikan id apa pun | Diperbaiki: satu pembaca `URLQ`, daftar nilai yang diizinkan untuk `kualitas` dan `shippreview`, `safearea` 4 angka 0 sampai 200 dengan panjang maksimal 40 karakter | Tidak ada |
| K10 | Kegagalan penyimpanan (kuota penuh, mode privat Safari, diblokir) diam-diam | Rendah | `catch` kosong | Diperbaiki: game tetap berjalan, satu pemberitahuan per sesi | Progres tidak tersimpan selama penyimpanan diblokir (keterbatasan browser) |
| K11 | Tanpa WebGL2 layar muat menggantung dengan galat di console; konteks WebGL yang hilang tidak ditangani | Rendah | `new THREE.WebGLRenderer` melempar galat | Diperbaiki: pesan ramah dengan langkah perbaikan; `webglcontextlost` menjeda game dan menampilkan status, `webglcontextrestored` memulihkan dan memanggang ulang langit (diuji dengan `WEBGL_lose_context`) | Setelah pulih, Three.js mencetak peringatan `delete: object does not belong to this context` untuk objek konteks lama (internal pustaka, tidak berbahaya) |
| K12 | Header keamanan server (HSTS, nosniff, Permissions-Policy, frame-ancestors, COOP, CORP, cache, kompresi, blokir berkas titik) belum terdokumentasi untuk OpenLiteSpeed | Sedang | konfigurasi server di luar repo | Didokumentasikan: `docs/deploy/security-headers.md` dan `docs/deploy/contoh.htaccess`, padanan nginx untuk aaPanel, perintah verifikasi `curl -I` | Harus dipasang manual di server; belum bisa diverifikasi dari repo |
| K13 | `.gitignore` belum menolak berkas rahasia umum | Rendah | tidak ada pola `.env`, `*.pem`, `*.key` | Diperbaiki | Tidak ada |
| K14 | Pindai riwayat git untuk rahasia | Info | lihat bagian di bawah | Bersih | Tidak ada |
| K15 | Privasi | Info | tidak ada `fetch`, XHR, WebSocket, `sendBeacon`, cookie, analitik, atau font eksternal | Kalimat privasi ditambahkan di layar Tentang; uji memastikan `document.cookie` kosong dan tidak ada permintaan keluar | Tidak ada |

## Penyimpanan lokal

Kunci berawalan unik `raptor13.`: `raptor13.v3` (profil), `raptor13.v2` dan `raptor13.v1` (dibaca sekali
untuk migrasi), `raptor13.highscore` (versi pertama), `raptor13.session.v1` (sesi). Semua pembacaan di dalam
`try/catch`, JSON rusak diperlakukan sebagai kosong. Pengaturan hanya menerima kunci yang dikenal dengan
tipe sama, nilai enum dari daftar, angka dibulatkan dan dibatasi rentang. Tombol RESET DATA di Pengaturan
meminta konfirmasi lalu menghapus profil, kunci lama, dan sesi. Migrasi versi tetap: data v1 dan v2 lama
terbaca (diuji di `tests/game.spec.mjs`).

## Pindai rahasia riwayat git

Dijalankan pada 96 commit (`git log -p --all`, 2,1 MB diff):

- Pola token (AWS `AKIA`, GitHub `ghp_` dan `github_pat_`, Slack `xox`, kunci OpenAI dan Anthropic `sk-`,
  Google `AIza`, kunci privat PEM, JWT): **tidak ada**.
- Kata kunci `password`, `secret`, `api_key`, `token` sebagai penugasan: **tidak ada**.
- Alamat email: hanya `noreply@anthropic.com` (atribusi) dan alamat noreply GitHub milik penulis
  (`...@users.noreply.github.com`). Identitas commit dan committer seluruhnya alamat noreply GitHub.
  Tidak ada alamat email pribadi.
- Jalur lokal (`/Users/...`, `/home/...`, `C:\Users`): **tidak ada**.
- Berkas sensitif yang pernah dilacak (`.env`, `.pem`, `.key`, `id_rsa`, `.p12`, `.DS_Store`): **tidak ada**.
- Metadata gambar di `icons/`: tanpa EXIF, GPS, atau XMP.

Karena tidak ada temuan, tidak ada langkah rotasi. Bila suatu saat ada rahasia yang terlanjur di-commit:
cabut dan buat ulang rahasia di layanan asalnya lebih dulu (anggap sudah bocor karena repo publik), lalu
hapus dari berkas dan commit; penulisan ulang riwayat (misalnya `git filter-repo`) hanya dengan keputusan
pemilik karena mengubah hash semua commit dan butuh force push.

## Hook debug

Hook hanya ada dengan `?debug=1`:

- `window.__game` (snapshot, mulai, jeda, `debug.*` untuk uji), tidak enumerable dan tidak dapat ditimpa.
- `?jetpreview=1`, `?shippreview=starfighter|interceptor|gunship|jet|piko`, `?gallery=1`.
- `?diag=1` (overlay diagnosis kotak hitam, lihat `glitch-kotak-hitam.md`) dapat dipakai tanpa `debug=1`
  karena hanya membaca dan menampilkan statistik render.

## Ketahanan

| Kondisi | Perilaku |
| --- | --- |
| Tanpa WebGL2 | Kartu "GRAFIS 3D TIDAK TERSEDIA" dengan langkah perbaikan, modul berhenti tanpa galat beruntun |
| Konteks WebGL hilang | Game dijeda, status "Grafis sedang dipulihkan...", pulih otomatis |
| Autoplay audio diblokir | AudioContext baru dibuat pada ketukan atau tombol pertama (aktivasi pengguna); tidak ada peringatan autoplay di console |
| localStorage penuh atau diblokir | Game berjalan, satu pemberitahuan, simpanan diabaikan |
| JSON rusak atau dimanipulasi | Nilai bawaan atau nilai yang dibatasi |
| Layar penuh atau kunci orientasi ditolak | Janji ditolak ditangkap, game tetap berjalan dalam jendela |
