# Piko pendamping yang hidup (E3 dan E4, 2.5.0)

Masalah dari pemilik: Piko hanya meniru gerakan kapal karena duduk kaku di soket di belakang kokpit sebagai
anak model kapal. Raptor-J bahkan tidak punya Piko.

## E3: model gerak mandiri

Piko kini objek tersendiri di scene. Ia hadir di semua kapal, termasuk Raptor-J. Gerakannya dihitung
`PikoFly` di `index.html`, dan semua angka ada di `PIKO_CFG`.

| Komponen | Cara kerja | Nilai |
| --- | --- | --- |
| Posisi target | Ruang lokal kapal: kanan, sedikit atas, sedikit belakang, di luar ujung sayap dan jauh dari crosshair | `offset` 4,8 kanan, 0,9 atas, 0,9 belakang |
| Pegas | Teredam kritis di bingkai yang ikut bergerak bersama kapal: a = w kuadrat (target dikurangi posisi) dikurangi 2 w (v Piko dikurangi v kapal). Peredaman relatif membuat Piko tidak tertinggal 2v/w (sekitar 28 satuan) pada kecepatan tetap. | `omega` 7 rad per detik |
| Kelembaman | Target bergeser ke belakang sebanding percepatan kapal (dibatasi). Ada ayunan keluar sebanding laju belok. | `lagAccel` 0,012, maksimal 1,6; `swing` 2,0, maksimal 2,0 |
| Percepatan dibatasi | Bagian percepatan di luar percepatan kapal dibatasi agar tidak melompat | `accelMax` 220 |
| Idle | Lissajous kecil di tiga sumbu | amplitudo 0,18; 0,16; 0,12 |
| Pindah sisi | Tiap 8 sampai 14 detik bila tenang, lewat lengkung di atas kapal (tidak memotong sayap) | `sideSwitch`, `sideArc` 3,4 |
| Orientasi | Badan mengikuti arah kapal dengan jeda, miring sesuai percepatan lateral Piko sendiri | `turnRate` 4, `bankGain` 0,05, maksimal 0,7 rad |
| Kepala | Menoleh ke bos, musuh terdekat, atau pickup dalam 420 satuan, dengan batas sudut 0,9 rad. Bila tidak ada, ia menoleh pelan. | |
| Detail | Kedip periodik. Antena baru di kepala dengan pegas sekunder. Api pendorong sebanding percepatan Piko relatif kapal. | |
| Reaksi | Tersentak saat kapal terkena, gugup saat HP di bawah 30 persen, melompat kecil saat musuh hancur atau pickup, menatap bos 3 detik saat bos muncul | |
| Opsi | Bantuan robot Mati: reaksi dimatikan. Kurangi gerakan: amplitudo idle dan reaksi 30 persen. | |
| Batas | Bola pelindung 1,08 kali radius visual kapal (di luar ujung sayap), dan jarak minimal 3,2 dari kamera | |

Tidak ada alokasi per frame: vektor dan kuaternion sementara dipakai ulang. Draw call Piko sama dengan sebelumnya,
karena model yang sama dipindahkan dari soket ke scene.

## E4: menempel (tuck)

**Pemicu:**
- nitro aktif;
- kecepatan di atas 85 persen kecepatan maksimum kapal;
- manuver berjalan;
- laju belok di atas 1,3 rad per detik;
- cutscene;
- sangat cepat di dekat permukaan planet atau bulan (180 satuan).

**Histeresis:**
- Begitu masuk, ambang turun: 78 persen kecepatan, laju belok 1,0, dan jarak benda besar 225.
- Waktu menempel minimal 0,8 detik.
- Keluar ditunda 0,6 detik setelah semua pemicu hilang.

**Gerak masuk:**
1. Lintasan lengkung ke titik tambat dalam 0,35 detik dengan ease out back. Lewatannya sekitar 3 persen, di
   bawah 5 persen.
2. Setelah sampai, Piko menjadi anak model kapal di titik tambat, sehingga ikut tanpa jitter.
3. Selama menempel mata menyipit, antena terlipat ke belakang, dan api pendorong mati.

**Gerak keluar:** Piko dilepas ke scene di posisi yang sama, melompat kecil ke samping dan atas, lalu kembali
melayang. Selama 0,5 detik bola pelindung tidak memaksa posisinya, agar tidak ada lompatan.

**Titik tambat.** Data eksplisit ada di registri kapal (`pikoDock`, sisi kanan, rendah, sedikit tertanam) dan
dicerminkan bila Piko sedang di kiri:

| Kapal | Titik tambat |
| --- | --- |
| Raptor-J | 0,62; -0,18; -1,8 |
| Starfighter | 0,5; -0,32; -1,35 |
| Interceptor | 0,42; -0,26; -1,6 |
| Gunship | 0,78; -0,36; -0,9 |

Kapal tanpa data mendapat titik hitungan otomatis dari kotak pembatas lokal model: sinar dari samping pada 30
sampai 56 persen panjang, diambil titik terdalam (badan, bukan sayap). Saat kapal berganti di hangar, titik
tambat mengikuti model aktif.

## Uji dan metrik (`tests/piko.spec.mjs`, data dari `debug.piko.trace`)

**E3:**
- Saat terbang lurus, posisi lokal Piko berubah (simpangan baku y di atas 0,04 dan z di atas 0,02). Salinan kaku
  akan bernilai 0.
- Saat belok, posisi lokal x menyimpang lebih dari 0,15 satuan dibanding saat tenang.
- Kecepatan relatif terhadap kapal tetap di bawah 30 satuan per detik di antara frame berurutan (tanpa
  lompatan).
- Jarak dari kapal tidak kurang dari bola pelindung.
- Posisi layar lebih dari 80 piksel dari crosshair.

**E4, untuk keempat kapal:**
- Menempel saat nitro, dengan posisi lokal sama dengan titik tambat (toleransi 0,03).
- Masih menempel 0,3 detik setelah nitro dilepas, lalu keluar.
- Tepat 2 pergantian mode (masuk dan keluar), tanpa kedip.
- Menempel juga saat looping, lewatan di bawah 5 persen, dan jarak antar pergantian mode minimal 0,8 detik.

Rekaman berurutan ada di `docs/screenshots/piko/`: melayang, belok tertinggal, terbang masuk, menempel saat
nitro, keluar, kembali melayang. Skrip pembuatnya: `node tests/piko/shots.mjs`.
