# Diagnosis kehalusan penerbangan (E6)

Dokumen ini dibuat sebelum ada perubahan apa pun pada kode terbang. Semua angka hasil ukur pada 14 November 2026
dengan versi E5 (commit `4d9d03d`).

## Instrumentasi

**Perekam.** `FlightProbe` di `index.html` merekam satu baris per frame, setelah kamera diperbarui. Kolomnya
(`debug.flightColumns()`):

| Kolom | Isi |
|---|---|
| `t` | waktu permainan (detik) |
| `qx qy qz qw` | kuaternion kapal |
| `pitch_deg bank_deg yaw_deg` | sudut turunan untuk HUD |
| `wx_pitch wy_yaw wz_roll` | kecepatan sudut di sumbu badan (rad per detik), dari selisih kuaternion dua frame |
| `cam_qx cam_qy cam_qz cam_qw` | kuaternion kamera |
| `cam_up_x cam_up_y cam_up_z` | vektor atas kamera |
| `cam_up_delta_deg` | perubahan vektor atas kamera dari frame sebelumnya |
| `cam_wx cam_wy cam_wz` | kecepatan sudut kamera |
| `in_pitch in_yaw` | input |
| `speed pos_y maneuver dt` | kecepatan, ketinggian, manuver aktif, langkah waktu |

Skrip analisis (`tests/penerbangan/diagnosis.mjs`) menambah tiga kolom turunan:

- `ang_step_deg`: putaran orientasi per frame;
- `ang_accel`: besar perubahan vektor kecepatan sudut dibagi dt;
- `ang_jerk`: perubahan percepatan sudut dibagi dt.

**Skenario berskrip.** `debug.flightRun(segmen)` menjalankan simulasi langkah tetap 1/60 detik dengan input
berskrip (`Debug.scriptInput`), jadi hasilnya dapat diulang persis. Input berskrip hanya bisa dipakai lewat hook
debug.

**Cara menjalankan.** `node tests/penerbangan/diagnosis.mjs sebelum 4173`, dengan server statis berjalan.

**Keluaran.** Folder `docs/penerbangan/data/sebelum/` berisi:

- CSV per kapal per skenario;
- PNG grafik dengan empat panel: pitch dan bank, kecepatan sudut, percepatan sudut, serta atas kamera
  dibandingkan putaran kapal. Pita merah menandai frame yang melewati ambang;
- `ringkasan.json`.

| Skenario | Isi |
|---|---|
| naik-tahan-lepas | tahan W 0,75 detik (sekitar 80 derajat), lepas 4 detik |
| naik-vertikal-lepas | tahan W 0,95 detik (melewati vertikal), lepas |
| turun-tahan-lepas | tahan S 0,75 detik, lepas |
| miring-kanan-lepas, miring-kiri-lepas | tahan D atau A 2 detik, lepas |
| kanan-kiri-cepat | D, A, D masing-masing 0,6 detik |
| loop, gulung, balik | manuver C, Z, X |
| kombinasi | naik sambil belok, lalu turun sambil belok, lalu lepas |

Kapal yang diuji adalah Starfighter di angkasa (sabuk asteroid) dan Raptor-J di Bumi (mulai ketinggian 230, batas
atas 260).

## Metrik dan ambang

| Metrik | Ambang | Alasan |
|---|---|---|
| Putaran orientasi tanpa input dan tanpa manuver (pemulihan otomatis) | 1,5 derajat per frame (1,57 rad/s) | Prompt meminta tidak ada lonjakan tak diperintah di atas 1 sampai 2 derajat per frame. Pemulihan 80 derajat dalam 2 detik dengan kurva S memerlukan puncak sekitar 1,1 derajat per frame. |
| Putaran dengan input tahan | 2,0 derajat per frame | Laju pitch penuh Starfighter 1,87 rad/s, yaitu 1,79 derajat per frame. Belok penuh tidak perlu lebih cepat dari itu. |
| Percepatan sudut di luar manuver | 20 rad/s kuadrat | Kecepatan sudut berubah paling banyak 0,33 rad/s per frame. Laju pitch penuh dicapai dalam sekitar 0,15 detik, cukup responsif di keyboard tanpa terasa sebagai sentakan. |
| Hentakan sudut di luar manuver | 400 rad/s pangkat tiga | Percepatan maksimum dibangun dalam paling sedikit 0,05 detik (3 frame), yaitu kurva S, bukan tangga. |
| Percepatan dan hentakan selama manuver akrobatik | 60 dan 1500 | Gulung tong memang cepat: 360 derajat dalam 0,85 detik. Kurva hanya perlu mulai dan berakhir halus. |
| Atas kamera | tidak lebih cepat dari putaran kapal ditambah 1 derajat per frame; satu frame di atas 20 derajat dianggap flip | Kamera boleh ikut rotasi yang diperintahkan, misalnya looping, tetapi tidak boleh berputar sendiri lebih cepat dari kapal. |

## Hasil (sebelum perbaikan)

Starfighter. Raptor-J hampir sama, karena kelincahannya 1,0 dibanding 1,1:

| Skenario | Putar tanpa input | Putar dengan input | Percepatan | Hentakan | Percepatan manuver | Hentakan manuver | Atas kamera (lebih dari kapal) | Hasil |
|---|---|---|---|---|---|---|---|---|
| naik-tahan-lepas | 11,61 | 1,79 | 732 | 43916 | 0 | 0 | 13,26 (6,84) | GAGAL |
| naik-vertikal-lepas | 11,61 | 1,79 | 732 | 43916 | 0 | 0 | 13,24 (6,82) | GAGAL |
| turun-tahan-lepas | 1,26 | 1,79 | 173 | 10404 | 0 | 0 | 1,74 (0,55) | GAGAL |
| miring-kanan-lepas | 4,05 | 3,88 | 244 | 14631 | 0 | 0 | 0,25 (0) | GAGAL |
| miring-kiri-lepas | 4,05 | 3,88 | 244 | 14631 | 0 | 0 | 0,25 (0) | GAGAL |
| kanan-kiri-cepat | 3,39 | 7,48 | 491 | 29244 | 0 | 0 | 0,40 (0) | GAGAL |
| loop | 0 | 0 | 2,8 | 167 | 5,5 | 167 | 3,38 (0,86) | LOLOS |
| gulung | 0,41 | 0 | 50 | 1545 | 50 | 1545 | 13,26 (3,99) | GAGAL |
| balik | 0 | 0 | 16 | 965 | 31 | 966 | 13,14 (7,22) | GAGAL |
| kombinasi | 3,46 | 8,02 | 490 | 29325 | 0 | 0 | 1,68 (0,16) | GAGAL |

Satuan: derajat per frame, rad/s kuadrat, dan rad/s pangkat tiga. Data lengkap ada di
`docs/penerbangan/data/sebelum/ringkasan.json`.

Hasil ini cocok dengan masukan pemilik:

- **Looping** (manuver vertikal) satu-satunya yang lolos. Masukan (a) menyebut manuver vertikal sudah halus.
- **Miring kanan dan kiri** gagal di semua metrik input. Masukan (a) menyebut gerak ke samping tidak halus.
- **Naik lalu lepas** memiliki lonjakan terbesar: 11,6 derajat per frame. Ini masukan (c).
- **Menukik lalu lepas** langsung mulai mendatar dengan percepatan 173 rad/s kuadrat. Ini masukan (d).

## Frame bermasalah dan penyebabnya

### Naik lalu lepas (masukan c)

Grafik: `data/sebelum/starfighter-naik-tahan-lepas.png`.

1. **Frame 30** (W mulai ditekan): kecepatan pitch melompat dari 0 ke 1,87 rad/s dalam satu frame. Percepatannya
   112 rad/s kuadrat dan hentakannya 6732.
2. **Saat W dilepas di atas 70 derajat:** cabang "vertikal" (`Math.abs(f.y) > 0,94`) terus memutar hidung ke arah
   atas kapal dengan laju tetap 0,6 kali laju pitch. Hidung melewati vertikal, dan kapal menjadi terbalik (bank
   melompat dari 0 ke 180 derajat pada grafik).
3. **Keluar dari zona vertikal dalam keadaan terbalik:** penstabil bank memakai
   `diff * (1 - exp(-4 dt))` dengan selisih 180 derajat. Laju roll seketika menjadi 12,2 rad/s (11,6 derajat
   per frame), dengan percepatan 732 rad/s kuadrat. Inilah sentakan yang terasa.
4. **Kamera:** target atas kamera dibalik tandanya (`_cu.dot(pu) < 0` lalu negate) saat bank melewati 90 derajat.
   Target melompat 180 derajat, dan slerp dengan laju 5 per detik memutar kamera sampai 13,3 derajat per frame. Itu
   6,8 derajat lebih cepat dari kapal.

### Menukik lalu lepas (masukan d)

- Saat S dilepas, penstabil pitch `-pitchAng * (1 - exp(-1,1 dt))` langsung bekerja dengan laju penuh. Kecepatan
  pitch melompat dari -1,87 ke sekitar +1,3 rad/s, dengan percepatan 173 rad/s kuadrat.
- Pada sudut di atas 70 derajat menukik, cabang vertikal berlaku lebih dulu (laju tetap 1,02 rad/s). Di sudut 70
  derajat logika berpindah ke penstabil eksponensial, sehingga terjadi lompatan kedua (frame 75: 163 rad/s
  kuadrat).
- Kurva eksponensial mulai paling cepat lalu melambat. Akibatnya pemulihan terasa "langsung datar", bukan
  lengkungan yang dimulai halus.

### Miring kanan atau kiri, lalu lepas (masukan a)

- Bank menuju target 60 derajat dengan respons orde satu (`rollResponse` 4). Laju roll melompat seketika ke
  4,2 rad/s, yaitu 3,9 derajat per frame. Percepatannya 244 rad/s kuadrat dan hentakannya 14631.
- Saat dilepas, hal yang sama terjadi ke arah sebaliknya: tanpa pegas dan tanpa ramp.
- Ganti arah cepat (kanan, kiri, kanan) menggandakan selisih target, sampai 7,5 derajat per frame.
- Laju belok sebanding sin(bank). Karena bank melompat, laju belok ikut melompat.

### Gulung dan balik

- Kurva `ease` (smoothstep) memiliki percepatan tidak nol di awal dan akhir. Hentakan gulung di awal mencapai
  1545, sedikit di atas ambang manuver.
- Kamera flip yang sama seperti di atas terjadi saat bank melewati 90 derajat (13,3 derajat per frame), 4 sampai 7
  derajat lebih cepat dari kapal.

## Pemeriksaan dugaan (E6.2)

| Dugaan | Hasil | Bukti |
|---|---|---|
| (a) batas pitch keras (clamp) | Tidak. Terbang memakai kuaternion bebas, dan `CONFIG.player.maxPitch` tidak dipakai di mana pun. | grep `maxPitch` hanya menemukan definisi |
| (b) auto-level tanpa batas laju | **Ya, penyebab utama.** Penstabil bank dan pitch eksponensial mulai dengan laju penuh. Dari keadaan terbalik lajunya 12,2 rad/s. | naik-tahan-lepas, turun-tahan-lepas |
| (c) kamera lookAt dengan atas dunia tetap | **Sebagian.** Kamera tidak memakai atas dunia tetap. Masalahnya, target atasnya dibalik tanda saat bank melewati 90 derajat, sehingga target melompat 180 derajat. | gulung, balik, naik-tahan-lepas: atas kamera 13 derajat per frame |
| (d) sudut Euler dan gimbal lock | **Sebagian.** Orientasi kuaternion, tetapi logika bercabang memakai `f.y > 0,94` dan bank dari atan2. Bank tidak terdefinisi dekat vertikal, sehingga perilaku berganti seketika di 70 derajat. | frame 75 turun-tahan-lepas |
| (e) slerp jalur terpendek melompat | Ya, untuk kamera: slerp menuju target yang baru dibalik. Kapal tidak memakai slerp. | sama dengan (c) |
| (f) input menjadi kecepatan sudut instan | **Ya.** Pitch dari 0 ke 1,87 rad/s dalam satu frame. Roll seketika 4,2 rad/s. | frame 30 setiap skenario input |
| (g) bank kembali datar tanpa pegas | **Ya.** Respons orde satu: kecepatan melompat saat input dilepas. | miring-kanan-lepas |
| (h) guncangan kamera atau FOV nitro | Bukan penyebab di skenario ini. Getaran hanya muncul dengan trauma atau nitro, dan FOV diredam. | skenario tanpa nitro tetap gagal |
| (i) dt besar setelah jeda atau resolusi dinamis | Bukan penyebab snap. dt dibatasi 0,05 detik (`CONFIG.maxDelta`), dan semua hukum terbang stabil pada dt itu. Satu frame panjang memutar 3 kali lebih jauh, tetapi tetap sesuai waktu nyata. | `index.html`: `Math.min(raw, CONFIG.maxDelta)` |
| (j) batas ketinggian atau medan Bumi | **Ya, khusus Bumi.** Batas atas 260 memotong posisi y. Raptor-J yang menanjak 75 derajat kehilangan kecepatan vertikal seketika: 62 ke 23 lalu 0 u/s, dan 239 frame menempel di batas dengan hidung tetap menanjak. Tabrakan medan memantulkan hidung ke 23 derajat dalam satu frame (`pitchUpAfterBounce`, 25 derajat per frame). Pantulan itu respons tabrakan yang disengaja dan tidak diubah. | raptor-j-naik-tahan-lepas.csv, raptor-j-turun-tahan-lepas.csv t 16,25 |

## Rencana perbaikan (E7)

1. **Dinamika orde dua.** Laju pitch, roll, dan belok menjadi keadaan yang dibatasi percepatan dan hentakannya
   (kurva S). Input menjadi laju sasaran, bukan laju instan.
2. **Pemulihan berlengkung.** Ganti penstabil eksponensial dan cabang vertikal dengan pull-out berlaju sudut
   a/v (R = v kuadrat per a, setara beberapa g), yang dimulai dan diakhiri dengan smoothstep. Kapal tidak lagi
   terus memutar melewati puncak. Dari keadaan terbalik, kapal berguling tegak dengan laju roll terbatas.
3. **Bank dengan pegas teredam** menuju target, dan belok terkoordinasi dari bank yang sudah halus.
4. **Kamera:** bingkai atas kontinu tanpa pembalikan tanda tiba-tiba, dan laju putar kamera dibatasi tidak
   melebihi kapal.
5. **Batas atas Bumi lunak:** hidung didorong turun secara progresif mendekati 260, bukan posisi dipotong.
6. **Manuver** memakai smootherstep (kuintik), sehingga percepatan nol di awal dan akhir.
7. Kecepatan maksimum, laju pitch penuh, dan laju belok tidak berubah. Ramp hanya membuang sentakan, dan
   kelincahan efektif disetel setara (diukur di E9).
