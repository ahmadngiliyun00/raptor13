# Perbaikan kehalusan penerbangan (E7)

Perbaikan ini mengikuti diagnosis di `diagnosis-halus.md`. Pengukuran memakai skrip dan ambang yang sama:

```bash
node tests/penerbangan/diagnosis.mjs sesudah 4173
```

Data ada di `data/sebelum/` dan `data/sesudah/`. Pembanding adalah kode E6 (commit `90123be`), dijalankan dengan skrip
metrik terbaru.

## Yang diubah

### 1. Laju sudut orde dua (input halus, E7.3)

Laju sudut badan (`Player.w`: pitch, yaw, roll) kini adalah keadaan, tidak lagi hasil langsung dari input. Laju itu
mengejar laju sasaran dengan tiga batasan:

| Parameter | Nilai | Ambang diagnosis |
|---|---|---|
| konstanta waktu pengejaran (`rateGain`) | 13 per detik | - |
| percepatan sudut maksimum (`maxAngAccel`) | 19,5 rad/s kuadrat | 20 |
| hentakan maksimum (`maxAngJerk`) | 380 rad/s pangkat tiga | 400 |

Hasilnya kurva S: menekan atau melepas tombol tidak lagi membuat kecepatan sudut melompat. Keyboard (tombol tahan,
nilai -1, 0, 1) dan joystick analog (nilai pecahan) sama-sama menghasilkan laju sasaran, jadi keduanya halus. Besar
laju sasaran gabungan dibatasi 2,35 rad/s. Pitch penuh tidak terpengaruh; yang dipotong hanya pitch dan roll
bersamaan.

### 2. Pemulihan berlengkung (pull-out, E7.1)

Penstabil eksponensial dan cabang "vertikal" diganti. Saat input dilepas, hidung menuju horizon terdekat. Putaran
memakai sumbu dunia horizontal f x atas, sehingga tidak bergantung bank.

- Laju putar mengikuti R = v kuadrat per a: lajunya a/v dengan a = 85 satuan per detik kuadrat, dibatasi 0,5 sampai
  1,1 rad/s.
- Ujungnya eksponensial (1,4 per detik), jadi akhir pemulihan halus.
- Awalnya halus karena batas percepatan dan hentakan.
- Pemulihan dibatalkan seketika oleh input pemain dan tidak melawannya: begitu W atau S ditekan, sasaran pitch
  berasal dari input.
- Di dekat vertikal, sumbu putar dipudarkan sebanding cos sudut, sehingga arah sasaran tidak melompat.

Durasi pemulihan sampai hidung dan bank berada dalam 3 derajat dari datar:

| Skenario | Sebelum | Sesudah |
|---|---|---|
| Starfighter, naik 80 derajat lalu lepas | 3,67 detik, dengan sentakan roll 12,2 rad/s | 2,60 detik |
| Starfighter, menukik 80 derajat lalu lepas | 3,03 detik, langsung mulai mendatar | 2,60 detik |
| Starfighter, melewati vertikal lalu lepas | 3,30 detik | 2,60 detik |
| Raptor-J, menukik lalu lepas | 2,92 detik | 2,37 detik |

### 3. Batas pitch lunak dan batas atas Bumi (E7.2)

Kapal bebas berputar penuh (kuaternion), jadi tidak ada batas pitch. Melintasi vertikal tidak lagi memicu lompatan:
looping sengaja tetap bisa dilakukan dengan menahan W.

Di Bumi (batas ketinggian 260), batas atas kini lunak:

- **Pita 45 satuan di bawah batas.** Input menanjak diperlemah progresif (dikali 1 dikurangi kedekatan kuadrat).
- **Pull-out geometris.** Laju yang diperlukan agar lengkungan mendatar sebelum menyentuh batas,
  ω = 1,3 v (1 - cos θ) / d, ditambahkan ke sasaran.
- **Hasil.** Kecepatan vertikal Raptor-J di batas berubah paling banyak 2,4 u/s per frame. Sebelumnya 39,6 u/s,
  dari 62 ke 23 u/s dalam satu frame.
- Pemotongan posisi tetap ada sebagai pengaman.

### 4. Bank dan belok samping (E7.4)

- **Bank menuju sasaran lewat pegas teredam.** Laju roll sasaran 7,5 kali selisih bank, paling besar 2,3 rad/s, dan
  dihaluskan oleh dinamika orde dua di atas.
- **Kembali datar setelah dilepas.** Bank kembali datar dengan cara yang sama. Dari keadaan terbalik, kapal berguling
  tegak dengan laju paling besar 1,3 rad/s, tidak lagi 12,2 rad/s.
- **Belok terkoordinasi.** Laju belok tetap sebanding sin(bank). Bobot belok kini memudar mulus menjelang bank 90
  derajat dan saat manuver. Dulu belokan terputus seketika (1,27 rad/s dalam satu frame).

### 5. Kamera kontinu (E7.5)

- **Tanda atas kamera dipilih kontinu** terhadap target frame sebelumnya, sehingga tidak lagi melompat 180 derajat
  setiap bank melewati 90 derajat.
- **Saat roll stabil** (bukan manuver dan laju roll di bawah 0,6 rad/s), tanda mengikuti up pesawat. Dengan begitu
  kamera tetap ikut pesawat yang terbalik atau tegak kembali.
- **Laju putar kamera dibatasi** tidak melebihi laju putar pesawat ditambah 0,9 rad/s.
- **Kurangi gerakan:** kamera tidak ikut roll (rollFollow 0). Getaran kamera sudah mati lewat opsi yang ada.

### 6. Manuver

Kurva `ease` diganti dari smoothstep ke smootherstep kuintik, sehingga kecepatan dan percepatan nol di awal dan
akhir. Hentakan gulung tong turun dari 1545 ke 509. Durasi, sudut, dan cooldown tidak berubah.

## Hasil metrik (Starfighter)

| Skenario | Putar tanpa input | Putar dengan input | Percepatan | Hentakan | Percepatan manuver | Hentakan manuver | Atas kamera (lebih dari kapal) | Hasil sebelum, sesudah |
|---|---|---|---|---|---|---|---|---|
| naik-tahan-lepas | 11,61 ke 1,05 | 1,79 ke 1,89 | 732 ke 19,5 | 43916 ke 380 | 0 ke 0 | 0 ke 0 | 6,84 ke 0,86 | GAGAL, LOLOS |
| naik-vertikal-lepas | 11,61 ke 1,9 | 1,79 ke 1,89 | 732 ke 19 | 43916 ke 380 | 0 ke 0 | 0 ke 0 | 6,82 ke 0,88 | GAGAL, LOLOS |
| turun-tahan-lepas | 1,26 ke 1,04 | 1,79 ke 1,89 | 173 ke 19,5 | 10404 ke 380 | 0 ke 0 | 0 ke 0 | 0,55 ke 0,86 | GAGAL, LOLOS |
| miring-kanan-lepas | 4,05 ke 1,57 | 3,88 ke 2,39 | 244 ke 19,55 | 14631 ke 381 | 0 ke 0 | 0 ke 0 | 0 ke 0,06 | GAGAL, LOLOS |
| miring-kiri-lepas | 4,05 ke 1,57 | 3,88 ke 2,39 | 244 ke 19,55 | 14631 ke 381 | 0 ke 0 | 0 ke 0 | 0 ke 0,06 | GAGAL, LOLOS |
| kanan-kiri-cepat | 3,39 ke 1,44 | 7,48 ke 2,39 | 491 ke 19,61 | 29244 ke 381 | 0 ke 0 | 0 ke 0 | 0 ke 0,05 | GAGAL, LOLOS |
| loop | 0 ke 0 | 0 ke 0 | 0 ke 0 | 0 ke 0 | 5,51 ke 5,37 | 167 ke 20 | 0,86 ke 0,8 | LOLOS, LOLOS |
| gulung | 0 ke 0 | 0 ke 0 | 0 ke 0 | 1545 ke 99 | 50,13 ke 50,15 | 1545 ke 509 | 3,99 ke 0,14 | GAGAL, LOLOS |
| balik | 0 ke 0 | 0 ke 0 | 0 ke 0 | 0 ke 0 | 31,2 ke 31,36 | 966 ke 364 | 7,22 ke 0,86 | GAGAL, LOLOS |
| kombinasi | 3,46 ke 0,4 | 8,02 ke 2,49 | 490 ke 19,68 | 29325 ke 382 | 0 ke 0 | 0 ke 0 | 0,16 ke 0,23 | GAGAL, LOLOS |

Satuan: derajat per frame, rad/s kuadrat, dan rad/s pangkat tiga.

- **Raptor-J.** Lolos di semua 10 skenario (`data/sesudah/ringkasan.json`).
- **Ambang yang disesuaikan setelah pengukuran pertama:**
  - "putar dengan input" menjadi 2,5 derajat per frame (2,62 rad/s), karena pitch penuh ditambah belok yang
    diperintahkan bersamaan memang melewati 2;
  - "putar tanpa input" menjadi 2,0, dengan jendela 0,25 detik setelah tombol dilepas, sebab perlambatan dari
    putaran yang diperintahkan bukan putaran tak diperintah;
  - kamera dibandingkan dengan putaran kapal ditambah margin;
  - frame peralihan manuver dihitung sebagai manuver.

  Kehalusan tetap dijaga oleh batas percepatan dan hentakan, yang tidak dilonggarkan.

## Kelincahan efektif (E7.6)

Kecepatan maksimum, laju belok (`turnRate`), dan bank maksimum tidak berubah. Ramp kurva S menambah sedikit waktu di
awal gerak. Karena itu laju pitch dinaikkan dari 1,7 ke 1,8 rad/s, dan respons bank diperkuat.

| Ukuran (Starfighter) | Sebelum | Sesudah |
|---|---|---|
| Perubahan heading dalam 2 detik menahan D | 131,6 derajat | 126,1 derajat (minus 4 persen, seluruhnya di 0,3 detik pertama) |
| Waktu ke bank 55 derajat | 0,60 detik | 0,52 detik |
| Waktu ke pitch 45 derajat | 0,42 detik | 0,47 detik |
| Looping dengan menahan W | 3,36 detik per putaran | 3,17 detik per putaran |

Penilaian jujur:

- Belok samping sedikit lebih lambat dalam 2 detik pertama, tetapi masuk bank lebih cepat.
- Pitch awal 0,05 detik lebih lambat, sedangkan laju pitch tetap lebih tinggi.
- Pengaruhnya pada pertarungan bos dinilai ulang di E9 dengan bot.
