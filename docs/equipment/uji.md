# Uji peralatan (C6, 2.4.0)

## Skenario per peralatan

`debug.equipTest(id, skenario)` menjalankan skenario terkendali dengan langkah 1/60 detik tanpa render:
musuh dimatikan, sasaran ditempatkan sendiri, mode kebal mati. Data: `docs/equipment/data/uji-skenario.json`.
Diuji juga di `tests/equip.spec.mjs` (C6 skenario).

| Peralatan | Skenario | Hasil |
| --- | --- | --- |
| Rudal Pencari Kunang | 2 drone di kerucut depan 260 dan 300 | 2 sasaran terkunci, 2 rudal kena, tiap drone menerima damage sampai hancur (HP drone 30) |
| Kubah Energi | 5 peluru 12 damage dalam 0,5 detik | 5 ditahan, HP berkurang 0 |
| Perisai Reaktif Sisik | 5 peluru 12 damage | 3 ditahan (3 muatan), 2 menembus, HP berkurang 24 |
| Meriam Rel Tombak Magnet | 4 drone segaris di 200 sampai 600, tahan 1,15 detik | ditembakkan setelah terisi, keempat drone terkena (5 sasaran termasuk asteroid), cooldown 10 detik berjalan |
| Gelombang Pengacau | 10 peluru di dekat kapal, 1 rudal, 1 Penyerbu di 250 | 10 peluru terhapus, rudal hancur, Penyerbu tidak bisa menembak 3 detik |
| Umpan Panas Suar Kelip | 1 rudal musuh di belakang | rudal mengejar suar, HP tidak berkurang |
| Ranjau Antariksa | ranjau dijatuhkan, drone masuk radius picu | 1 ledakan kena, damage diterapkan, muatan 3 menjadi 2 |
| Rajut Nano | HP 50 persen | pulih 25,1 persen HP maksimum dalam 4 detik; pemakaian ke-2 berhasil, ke-3 ditolak (2 per stage) |
| Magnet Tarik | | pengali radius tarik 1 lalu 3 selama 8 detik, kembali 1 |
| Kubah Energi, skenario fatal | Kubah aktif (sisa 4 detik), tabrakan fatal | pemain tetap mati |
| Perisai Reaktif Sisik, skenario fatal | Sisik penuh 3 muatan, tabrakan fatal | pemain tetap mati |

**Kesulitan.** Diuji di "C6 kesulitan":
- cooldown Kunang 25,5 detik di Mudah, 30 di Normal, 36 di Sulit;
- muatan Sisik 4, 3, dan 2;
- Rajut 2, 2, dan 1 per stage.

**Peti.**
- Peti Suplai menghapus cooldown dan mengisi muatan.
- Peti Peralatan memberi Starfighter (0 slot) satu slot sementara. Busur HUD ikut menampilkan 1 slot.

## Keseimbangan dengan bot

`node tests/equipment/bot.mjs sesudah`. Data: `docs/equipment/data/bot-sesudah.json`.

**Kondisi uji:**
- Bot jelajah (AutoInput) memainkan stage 1 kampanye selama 3 menit per kesulitan.
- Kualitas Rendah, seed 777, tanpa mode kebal.
- Nyawa dijaga tidak habis agar pertarungan berlanjut; kematian tetap dihitung.
- Bot berperalatan memakai peralatan yang siap bila situasinya cocok (`Equip.botUse`).

| Kesulitan | Kapal dan peralatan | Bunuh per menit | HP rata-rata | Kematian | Damage diterima | Peralatan dipakai |
| --- | --- | --- | --- | --- | --- | --- |
| Mudah | Starfighter, 0 slot | 3,33 | 85 persen | 0 | 42 | |
| Mudah | Gunship kosong | 3,67 | 100 persen | 0 | 15 | |
| Mudah | Gunship: Kunang, Sisik, Kubah | 2,67 | 94 persen | 0 | 25 | Kubah 3, Kunang 4, 8 kena ditahan |
| Mudah | Gunship: Tombak, Pengacau, Rajut | 2,33 | 78 persen | 0 | 62 | Tombak 8, Pengacau 2 |
| Normal | Starfighter, 0 slot | 2,67 | 98 persen | 0 | 28 | |
| Normal | Gunship kosong | 3,33 | 69 persen | 0 | 76 | |
| Normal | Gunship: Kunang, Sisik, Kubah | 3,67 | 99 persen | 0 | 16 | Kubah 2, Kunang 3, 5 kena ditahan |
| Normal | Gunship: Tombak, Pengacau, Rajut | 3,67 | 96 persen | 0 | 20 | Tombak 6, Pengacau 2 |
| Sulit | Starfighter, 0 slot | 3 | 40 persen | 1 | 110 | |
| Sulit | Gunship kosong | 3 | 91 persen | 0 | 77 | |
| Sulit | Gunship: Kunang, Sisik, Kubah | 2,67 | 99 persen | 0 | 54 | Kubah 2, Kunang 3, 3 kena ditahan |
| Sulit | Gunship: Tombak, Pengacau, Rajut | 4 | 65 persen | 1 | 254 | Tombak 11, Pengacau 4, Rajut 1 |

**Penilaian jujur:**

- **Peralatan membantu tanpa membuat permainan sepele.**
  - Set bertahan (Kunang, Sisik, Kubah) menurunkan damage diterima di Normal dari 76 menjadi 16, dan di Sulit
    dari 77 menjadi 54.
  - Bunuh per menit hampir tidak berubah (2,3 sampai 4 di semua konfigurasi). Senjata dasar tetap sumber damage
    utama, sesuai rancangan.
- **Kapal 0 slot tetap layak.** Starfighter membunuh 2,7 sampai 3,3 per menit, dengan paling banyak 1 kematian
  di Sulit.
- **Batas pengukuran:**
  - Satu seed dan satu stage awal yang intensitasnya rendah (8 sampai 12 musuh dalam 3 menit), jadi variansnya
    besar.
  - Contoh varians: set Tombak, Pengacau, Rajut di Sulit menerima damage lebih besar (254) karena bot mendekati
    barisan musuh untuk membidik sinar, padahal di Normal hanya 20.
  - Uji manusia dan stage yang lebih ramai tetap diperlukan sebelum angka disetel lagi.

## Performa dan kebocoran

`tests/equip.spec.mjs` (C6 anggaran):

- **Draw call.** Rudal, Kubah, dan Ranjau aktif bersamaan menambah paling banyak 12 draw call. Semua objek
  efek dibuat sekali (pool) dan hanya tampil saat aktif, tanpa alokasi per frame.
- **20 kali restart sambil memakai peralatan:**
  - objek scene, anak scene, dan listener sama persis;
  - jumlah program shader tidak bertambah lebih dari 2.
- **Geometri GPU.** Naik +1 sampai +5. Hal yang sama terjadi tanpa memakai peralatan (diukur 97 ke 101 dalam
  60 restart). Penyebabnya: geometri jenis objek yang baru pertama kali muncul baru diunggah saat itu. Ini
  bukan kebocoran dari peralatan.

## Tabrakan

Kubah dan Sisik hanya bekerja lewat `applyDamage`. Tabrakan fatal lewat `Player.fatalCrash`, jadi tidak
tertahan (skenario fatal di atas). Tabel tabrakan berbasis ukuran dari 2.3.0 tidak berubah, dan uji B6
`tests/bos.spec.mjs` tetap lolos.
