# Berkontribusi ke RAPTOR13

Terima kasih sudah tertarik membantu. Dokumen ini dalam bahasa Indonesia, dengan ringkasan bahasa Inggris di
bagian akhir.

## Menjalankan secara lokal

1. Clone repo.
2. Jalankan server statis dari akar repo, misalnya `python3 -m http.server 8080` atau `npm run serve`.
3. Buka `http://localhost:8080/`.

Game tidak bisa dibuka lewat `file://` karena memakai ES module dan importmap. Untuk bermain tidak perlu
`npm install`.

**Parameter URL untuk pengembang:**

| Parameter | Fungsi |
| --- | --- |
| `?debug=1` | Membuka hook `window.__game`. Lihat bagian Hook debug di README. |
| `?diag=1` | Overlay diagnosis (WebGL, zoom, ukuran canvas) dan tombol UNDUH LOG |
| `?kualitas=rendah`, `sedang`, `tinggi` | Memaksa kualitas grafis |
| `?safearea=47,0,47,21` | Meniru safe area HP berponi |

## Struktur kode

Seluruh game ada di satu berkas `index.html` (HTML, CSS, dan JavaScript inline). Peta sistemnya ada di
`ARCHITECTURE.md`. Sistem besar ditandai komentar blok berjudul huruf kapital, misalnya `PERALATAN DI DALAM
PERMAINAN (C4)`. Data yang sering disetel dikumpulkan dalam objek konfigurasi:

- `CONFIG` (umum);
- `SHIPS` (kapal);
- `EQUIPMENT_DEFS` (peralatan);
- `BOSS_PILOT` (perilaku bos);
- `COLLISION_TIERS` (tabrakan).

## Menjalankan uji

```bash
npm install
npx playwright install chromium webkit
npx playwright test                         # semua uji
npx playwright test tests/equip.spec.mjs    # satu berkas
node tests/csp.mjs --write                  # wajib setelah mengubah skrip atau gaya inline (hash CSP)
node scripts/check-style.mjs                # pemeriksa gaya: tanpa em dash dan ampersand di teks
```

Di macOS uji memakai GPU asli (ANGLE Metal). Di platform lain uji memakai SwiftShader, jadi beberapa uji
performa dilewati.

## Anggaran performa

Jangan sampai mundur dari angka berikut. Ukur dengan `debug.perf()` dan uji otomatis.

- Draw call dan frame time tidak memburuk. Efek baru memakai pool atau instancing, tanpa membuat objek per
  frame.
- Tidak ada kebocoran setelah 20 kali restart (uji `tidak ada kebocoran objek`).
- Mode HP:
  - UI maksimal 22 persen luas layar;
  - zona tengah (x 30 sampai 70 persen, y 20 sampai 80 persen) bebas;
  - area sentuh minimal 44 px;
  - teks minimal 11 px.

## Alur kerja

1. Fork repo, lalu buat cabang dari `main`, misalnya `fitur/peralatan-baru` atau `perbaikan/zoom-ios`.
2. Commit kecil dan terfokus. Gaya pesan commit: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `ci:`, diikuti
   kalimat bahasa Indonesia.
3. Sertakan baris DCO di setiap commit dengan `git commit -s` (lihat bagian DCO).
4. Buka pull request ke `main` dan isi templatnya. CI harus lolos.

## Konvensi proyek

- Game tetap satu `index.html`. Pengecualian hanya berkas pendukung PWA dan aplikasi native: manifest,
  service worker, ikon, folder `mobile/`, dan skrip build.
- Tanpa aset eksternal atau CDN. Three.js ditanam lokal di `vendor/`.
- Semua konten orisinal (lihat bagian Kebijakan konten).
- **Tanpa em dash dan tanpa ampersand dalam teks dan kode.**
  - Pakai tanda hubung biasa sebagai ganti em dash, dan "dan" atau "and" sebagai ganti ampersand.
  - Ampersand sebagai sintaks kode tetap boleh, misalnya operator `&&` atau entitas HTML.
  - Pemeriksa otomatis ada di `scripts/check-style.mjs` dan dijalankan CI.
- Bahasa antarmuka dan dokumen: bahasa Indonesia.

## Hook debug

- Hook hanya boleh tersedia lewat `?debug=1` (objek `window.__game`, tidak enumerable).
- Jangan pernah menambah variabel global lain.
- Jangan mengaktifkan hook berdasarkan kondisi lain.

Uji keamanan memeriksa bahwa `window.__game` tidak ada tanpa parameter.

## Keamanan

- Game tidak memakai jaringan, cookie, pelacak, atau analitik. Jangan menambahkannya.
- Data dari localStorage selalu divalidasi skemanya dan dibatasi rentangnya.
- Kunci localStorage berawalan `raptor13.`.
- CSP ketat di meta `index.html`. Setelah mengubah skrip atau gaya inline, jalankan `node tests/csp.mjs --write`.
- Jangan pernah melakukan commit untuk keystore, sandi, `.env`, atau `gradle.properties` berisi sandi.

## Kebijakan konten dan hak cipta

- Semua nama, ikon, ilustrasi, suara, dan cerita harus orisinal.
- Dilarang memasukkan IP milik pihak lain: nama, istilah, desain, musik, atau aset dari waralaba lain.
- Hindari istilah khas waralaba fiksi ilmiah terkenal.
- Pakai nama sendiri dalam bahasa Indonesia.

Kontribusi kode dilisensikan MIT, dan kontribusi konten kreatif dilisensikan CC BY 4.0 (lihat `LICENSE` dan
`LICENSE-CONTENT.md`).

## Kontribusi yang dibantu AI

Boleh, dengan syarat:

- Diungkapkan di deskripsi pull request: alat apa yang dipakai dan untuk bagian apa.
- Penulis PR memahami dan menguji seluruh perubahan. Reviewer akan menanyakan alasan desainnya.
- Hasilnya tetap mematuhi semua konvensi di atas, termasuk orisinalitas konten.

## DCO (Developer Certificate of Origin)

Proyek ini memakai DCO 1.1 (<https://developercertificate.org/>), tanpa CLA. Dengan menambahkan baris berikut di
setiap commit, Anda menyatakan berhak mengirimkan kontribusi itu di bawah lisensi proyek:

```
Signed-off-by: Nama Anda <email@contoh.id>
```

Pakai `git commit -s` agar baris itu ditambahkan otomatis. Anda boleh memakai alamat email noreply GitHub.

## Melaporkan bug

1. Buka issue dengan templat **Laporan bug**.
2. Lampirkan info diagnostik:
   - di game, buka Jeda, lalu **Lapor Bug**, yang menyalin info versi, kontrol, kualitas, ukuran layar, dan
     FPS rata-rata tanpa data pribadi;
   - atau buka `index.html?diag=1` lalu tekan UNDUH LOG.
3. Untuk kerentanan keamanan, ikuti `SECURITY.md`. Jangan laporkan lewat issue publik.

## Mengusulkan kapal, peralatan, musuh, atau dunia baru

Pakai templat issue **Usulan kapal atau peralatan**. Sertakan:

- nama orisinal;
- peran dalam permainan dan dampaknya pada keseimbangan (bandingkan dengan tabel di
  `docs/equipment/keseimbangan.md`);
- sketsa bentuk atau ikon sebagai deskripsi atau gambar buatan sendiri;
- biaya performa yang diperkirakan.

---

## English summary

- **Run locally:** serve the repo root with any static server, open `http://localhost:8080/`. Add `?debug=1`
  for the `window.__game` hooks.
- **Tests:** `npm install`, `npx playwright install chromium webkit`, `npx playwright test`. After editing
  inline scripts or styles run `node tests/csp.mjs --write`.
- **Conventions:**
  - the game stays a single `index.html`;
  - no external assets or CDNs;
  - all content must be original (no third party IP);
  - no em dash and no ampersand in text (code syntax is fine), checked by `scripts/check-style.mjs`.
- **Workflow:** fork, branch, small commits with `feat:` or `fix:` prefixes, sign off every commit (DCO,
  `git commit -s`, no CLA), open a pull request.
- **AI assisted contributions** are welcome if disclosed in the pull request and fully understood and tested
  by the author.
- **Security issues:** see `SECURITY.md`.
