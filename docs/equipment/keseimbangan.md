# Keseimbangan peralatan (C4, 2.4.0)

Semua angka ada di satu objek data `EQUIPMENT_DEFS` di `index.html`. Pengali kesulitan ada di `EQUIP_DIFF`.

## Pembanding: senjata dasar

Senjata dasar Starfighter: 10 damage per peluru, satu tembakan tiap 0,10 detik, bergantian dari dua moncong.
Itu sekitar **100 DPS** bila semua peluru kena. Gunship sekitar 140 DPS, Interceptor sekitar 90 DPS.
Ultimate Laser: 140 DPS selama 2,5 detik (350 damage per sasaran), diisi dari pembunuhan.

## Katalog

| Peralatan | Jenis | Cooldown atau muatan | Efek | DPS setara pada sasaran tunggal |
| --- | --- | --- | --- | --- |
| Rudal Pencari Kunang | aktif | 30 detik | 2 rudal, 55 damage tiap rudal, kunci hingga 2 sasaran di kerucut 50 derajat sejauh 700, belok 3,2 rad/detik | 3,7 (burst 110) |
| Kubah Energi | aktif | 25 detik | 4 detik menahan semua damage biasa dan proyektil | pertahanan |
| Perisai Reaktif Sisik | pasif | 3 muatan, pulih 1 tiap 40 detik, penuh di stage baru | 1 muatan menahan 1 kena damage | pertahanan |
| Meriam Rel Tombak Magnet | tahan | isi 1 detik, cooldown 10 detik | sinar sejauh 1600, lebar 3, menembus semua, 140 damage per sasaran, bantuan bidik 3 derajat di mode HP | 14 (lebih bila menembus beberapa) |
| Gelombang Pengacau | aktif | 35 detik | radius 170: hapus peluru dan rudal musuh, musuh dalam radius 340 tidak bisa menembak 3 detik | pertahanan |
| Umpan Panas Suar Kelip | aktif | 15 detik | 3 suar 5 detik, rudal musuh dalam jarak 450 dari suar mengejar suar | pertahanan |
| Ranjau Antariksa Biji Besi | muatan | 3 muatan, jeda 0,6 detik, pulih 1 tiap 12 detik | ranjau aktif 0,5 detik, meledak bila musuh dalam 26 (atau ekor bos), 90 damage radius 38, hilang setelah 25 detik | sekitar 7,5 bila semua kena |
| Rajut Nano | muatan | 2 kali per stage | pulih 25 persen HP maksimum selama 4 detik | pemulihan |
| Magnet Tarik | aktif | 20 detik | 8 detik radius tarik bintang dan XP tiga kali | ekonomi |

Peralatan penyerang dibuat jauh di bawah DPS senjata dasar: Kunang 3,7, Tombak 14, dan Ranjau 7,5 per sasaran
tunggal. Keunggulannya ada pada situasi, bukan damage mentah:

- Kunang mengenai sasaran di luar bidikan.
- Tombak menembus barisan.
- Ranjau efektif melawan pengejar.

Peralatan bertahan dibatasi cooldown panjang atau muatan sedikit.

## Kesulitan

| Kesulitan | Pengali cooldown | Tambahan muatan (Sisik, Ranjau) | Rajut Nano per stage |
| --- | --- | --- | --- |
| Mudah | 0,85 | +1 | 2 |
| Normal | 1 | 0 | 2 |
| Sulit | 1,2 | -1 | 1 |

## Slot per kapal

| Kapal | Slot | Catatan |
| --- | --- | --- |
| Starfighter (dasar, angkasa) | 0 | Sifat pasif Inti Serba Guna: nitro pulih 15 persen lebih cepat |
| Raptor-J (jet Bumi) | 1 | Rudal Pencari Kunang terpasang bawaan |
| Interceptor | 2 | |
| Gunship | 3 | |

Semua slot generik: peralatan apa pun bisa dipasang di slot mana pun.

## Perolehan

| Peralatan | Cara membuka |
| --- | --- |
| Kunang, Sisik | Terbuka sejak awal |
| Kubah Energi | Selesaikan stage 2 kampanye |
| Tombak Magnet | Selesaikan stage 3 |
| Gelombang Pengacau | Selesaikan stage 5 |
| Rajut Nano | Selesaikan stage 7 |
| Suar Kelip, lalu Ranjau | Tiap 2 kontrak selesai (kontrak ke-2 dan ke-4) |
| Magnet Tarik | Temukan 6 benda angkasa |
| Peralatan apa pun yang masih terkunci | Kartu Cetak Biru di layar naik level, tiap level kelipatan 3 (menggantikan satu kartu) |

## Di dalam pertempuran

- **Peti Suplai:**
  - 2,5 persen dari musuh yang dihancurkan, hanya bila kapal membawa peralatan;
  - pasti muncul setelah bos kalah;
  - mengisi ulang semua muatan dan menghapus cooldown.
- **Peti Peralatan:**
  - 0,6 persen dari musuh;
  - memberi satu peralatan acak sementara sampai stage selesai, termasuk untuk Starfighter yang tidak punya
    slot;
  - kapal yang slotnya sudah 3 mendapat isi ulang seperti Peti Suplai.

## Tabrakan fatal

Kubah Energi dan Sisik hanya menahan damage yang lewat sistem damage biasa (`applyDamage`): peluru, rudal,
sengatan, tabrakan biasa, asteroid, dan komet. Tabrakan fatal tidak lewat sistem itu, melainkan lewat
`Player.fatalCrash`. Contohnya planet, daratan, benda raksasa, bos, dan benturan di atas ambang fatal. Jadi
peralatan tidak menyelamatkan dari tabrakan fatal. Ini diuji di C6.
