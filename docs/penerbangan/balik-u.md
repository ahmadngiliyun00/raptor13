# Manuver Putar Balik U (E8)

Manuver ini membalik arah pesawat 180 derajat dengan belokan datar miring. Bila dilihat dari atas, jalurnya
berbentuk huruf U. Gunanya agar pemain yang terlalu cepat melewati bos bisa kembali menghadapnya dan menembak lagi.

## Pilihan bentuk: belok datar miring, bukan wingover

Kedua bentuk dibandingkan dengan dinamika E7:

- **Wingover** (menanjak miring lalu jatuh berbalik):
  - ketinggian berubah besar;
  - di Bumi bertabrakan dengan batas atas 260 dan medan;
  - kecepatan keluar berubah karena faktor menanjak dan menukik;
  - bos lebih sulit dibaca karena horizon ikut naik turun.
- **Belok datar miring** (banked level U-turn):
  - ketinggian tetap;
  - bos yang biasanya sejajar tetap di bidang pandang saat keluar;
  - jalurnya mudah diprediksi pemain.

Pilihan jatuh pada belok datar miring, dengan hidung yang didatarkan bila manuver dimulai sambil sedikit menanjak
atau menukik.

## Definisi

Orientasi sasaran dihitung dari sudut YXZ untuk k = t / durasi, dengan s = smootherstep(k). Kecepatan dan percepatan
smootherstep nol di awal dan akhir.

| Besaran | Rumus | Nilai (Starfighter dan Raptor-J, terukur) |
|---|---|---|
| Heading | heading awal ditambah arah kali pi kali s | perubahan arah 178,95 sampai 179,05 derajat |
| Bank | bank awal kali (1 - s), ditambah arah kali 75 derajat kali 16 k kuadrat (1 - k) kuadrat | bank maksimum 75,05 derajat |
| Pitch | pitch awal kali (1 - s) | didatarkan |
| Durasi | `CONFIG.maneuvers.uturn.duration` | 2,02 detik |
| Panjang jalur | kecepatan kali durasi | 140,1 satuan pada 70 u/s |
| Jari-jari rata-rata | panjang jalur dibagi pi | sekitar 45 satuan |
| Kecepatan keluar | tidak diubah manuver | 70,03 u/s (masuk 70) |

**Belokan terkoordinasi.** Bank berbentuk lonceng yang sebanding dengan laju belok (turunan smootherstep), sehingga
kemiringan terbesar terjadi tepat di tengah U.

**Penerapan.** Manuver diterapkan sebagai selisih rotasi dunia terhadap sasaran frame sebelumnya. Dengan begitu sisa
laju sudut dari sebelum manuver tetap kontinu dan memudar.

**Metrik kehalusan E6** (tanpa satu frame pun bermasalah):

| Metrik | Terukur | Ambang |
|---|---|---|
| percepatan sudut manuver | 9,98 rad/s kuadrat | 60 |
| hentakan sudut manuver | 309 rad/s pangkat tiga | 1500 |
| atas kamera lebih cepat dari kapal | 0,05 derajat per frame | - |

**Syarat mulai.** Bank di bawah 80 derajat dan pitch di bawah 60 derajat. Pada keadaan terbalik atau hampir tegak,
heading tidak terdefinisi, dan Balik vertikal atau Looping lebih tepat.

## Arah

**Keyboard, tombol V.** Periksa terlebih dahulu: V tidak dipakai oleh W, S, A, D, Spasi, Enter, E, Z, X, C, Shift,
Tab, P, Esc, M, R, 1, 2, 3, Q, F, G.

1. A atau D yang sedang ditahan menentukan arah. Belokan searah dengan menahan tombol itu.
2. Bila tidak ada yang ditahan, manuver menuju bos di belahan belakang. Bila tidak ada bos, manuver menuju musuh
   terdekat di belahan belakang dalam jarak 900.
3. Bila tidak ada sasaran sama sekali, manuver berbelok ke kanan layar.

**Sentuh: tombol Balik di busur manuver**, digabung dengan Balik vertikal lama:

- **Ketuk biasa** memberi Putar Balik U. Arahnya dari defleksi joystick ke samping bila lebih dari 0,3; selain itu
  menuju sasaran di belakang, atau ke kanan.
- **Ketuk sambil joystick didorong jelas ke atas atau bawah** (vertikal lebih dari 0,55, samping kurang dari 0,35)
  memberi Balik vertikal (Immelmann) seperti sebelumnya.

**Alasan menggabungkan, bukan menambah tombol.** Busur luar sudah berisi enam slot: Gulung, Balik, Loop, dan tiga
slot peralatan. Di HP berponi 568x320 dengan tiga slot, skala tombol sudah 0,64, kekurangan yang tercatat di C14.
Tombol ketujuh akan memperkecil semua tombol lagi.

Menggabungkan menjaga anggaran tata letak tanpa membuang Immelmann. Arah tetap dibaca dari joystick yang memang
sedang dipegang ibu jari kiri. Ikon tombol diganti menjadi panah U, dan label aksesibilitas menjelaskan kedua fungsi.

**Desktop.** Strip manuver bawah kini menampilkan Z GULUNG, X BALIK, C LOOP, dan V BALIK U, beserta cooldown.

## Aturan permainan

| Aturan | Nilai |
|---|---|
| Cooldown | 5 detik, setara Looping |
| Nitro | tidak wajib |
| Kebal | tidak; tabrakan tetap bekerja |

Bukti tabrakan: `debug.uturnObstacleTest`. Batu diam diletakkan di puncak lengkung, 62 satuan dari titik awal. Batu
itu tertabrak satu kali, dan HP turun dari 100 ke 88,4.

## Efek

- Kapal miring sampai 75 derajat, dan kamera mengikuti dengan halus.
- Batas laju kamera kini memakai laju putar kapal yang diukur dari selisih kuaternion. Sebelumnya laju kamera dibatasi
  0,9 rad/s selama manuver, sehingga kamera tertinggal dan kapal tampak menyamping.
- Uap ujung sayap muncul sebanding bank.
- Desir angin halus: noise bandpass menyapu 380 sampai 1100 Hz selama 1,8 detik.
- Rekaman berurutan ada di `docs/screenshots/manuver/balik-u-1.jpg` sampai `balik-u-5.jpg`.

## Integrasi

- **Piko** menempel (tuck) selama manuver lewat pemicu manuver E4 (diuji).
- **Bot terampil** (`SkilledBot`) memakai Putar Balik U ke arah bos bila bos tertinggal di belakang. Balik vertikal
  menjadi cadangan saat Balik U belum bisa. Simulasi bos hunter 90 detik (Normal, seed 3) mencatat satu Balik U
  (`bossSim` mengembalikan `uturns`).
- **Indikator BOS DI BELAKANG** di desktop menampilkan saran tombol V.
- **Bantuan robot:** Piko memberi saran satu kali per sesi bila bos di belakang lebih dari 1,5 detik dan Balik U siap
  (`uturnTip`). Teksnya disesuaikan untuk sentuh: "Ketuk Balik".
- **Layar bantuan dan tutorial** mencantumkan V Putar Balik U.

## Uji (`tests/manuver.spec.mjs`)

1. Starfighter dan Raptor-J, kanan dan kiri. Yang diperiksa:
   - perubahan arah 180 plus minus 10 derajat;
   - durasi 1,6 sampai 2,4 detik;
   - bank 68 sampai 82 derajat;
   - jalur 0,8 sampai 1,25 kali kecepatan dikali durasi;
   - kecepatan keluar 0,8 sampai 1,25 kali kecepatan masuk;
   - arah sesuai tanda;
   - nol frame melewati ambang E6.
2. Keyboard:
   - V dengan D searah D, dan V dengan A searah A;
   - tanpa input ke kanan;
   - cooldown;
   - Piko menempel.
3. Arah otomatis ke bos di belakang kanan atau kiri.
4. Tabrakan tetap bekerja di jalur U.
5. Sentuh:
   - ketuk memberi Balik U;
   - joystick ke atas memberi Balik vertikal;
   - joystick ke samping memberi Balik U;
   - jumlah tombol manuver tetap tiga.
6. Bot terampil memakai Balik U.
7. Strip desktop, saran V, dan rekaman berurutan.

Skenario `balik-u-kanan` dan `balik-u-kiri` juga ditambahkan ke `tests/penerbangan/diagnosis.mjs`.
