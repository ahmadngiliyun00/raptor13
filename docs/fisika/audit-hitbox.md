# Audit hitbox (D4)

Tujuan: tidak ada tabrakan tak terlihat. Bentuk tabrakan setiap benda harus cocok dengan bentuk yang terlihat
(toleransi 15 persen). Dibuat lewat hook `debug.hitboxAudit()`, diuji di `tests/bos.spec.mjs` (D4), dan
digambar lewat `debug.showHitboxes(true)`. Screenshot wireframe ada di `docs/fisika/hitbox/`: merah fatal,
kuning merusak.

## Cara ukur

- **Radius visual:** persentil 75 jarak titik mesh buram ke pusat benda, setelah skala. Persentil dipakai
  karena kokoh terhadap bentuk bersayap atau bertonjolan.
- **Bulan tak beraturan (Phobos, Deimos):** dibanding persentil 10, yaitu permukaan terdalam yang terlihat.
  Bola tabrakan tidak boleh lebih besar dari itu.
- **Bos:** tidak memakai satu radius. Ada dua ukuran.
  - **Cakupan**: persen titik model (titik sudut dan titik tengah tiap segitiga) yang berada di dalam salah
    satu bola padat. Target minimal 85 persen.
  - **Isi kosong**: persen titik acak di dalam bola padat yang lebih jauh dari 15 persen ukuran bos dari
    permukaan model. Target paling banyak 15 persen.

## Sebelum perbaikan

| Objek | Visual | Tabrakan | Selisih | Masalah |
| --- | --- | --- | --- | --- |
| asteroid kecil (R 3) | 3,44 | 2,55 | minus 26 persen | bola lebih kecil dari batu (peluru dan kapal menembus tepi) |
| asteroid raksasa (R 24) | 30,24 | 20,4 | minus 33 persen | sama |
| komet inti (R 6) | 6,55 | 5,4 | minus 18 persen | sama |
| Phobos | 5,74 (terdalam) | 7,0 lalu 4,8 di 2.3.0 | plus 22 lalu minus 16 persen | 2.2.0: tabrakan tak terlihat; 2.3.0: terlalu dalam |
| Deimos | 4,31 (terdalam) | 5,0 lalu 3,65 | plus 16 lalu minus 15 persen | sama |
| drone, pengintai, pemburu, penjaga, kapal pelindung | 1,7 sampai 4,1 | 2,2 sampai 5 | plus 17 sampai 38 persen | bola sentuh lebih besar dari kapal (tabrakan tak terlihat) |
| makhluk angkasa | 1,13 | 3,2 | plus 184 persen | sama |
| penembak jitu | 4,4 | 3 | minus 32 persen | bola lebih kecil dari kapal |
| bos Penjaga Raksasa | cakupan 24 persen | 1 bola | | sayap dan mesin bisa ditembus |
| bos Penambang Raksasa | cakupan 54 persen | 2 bola | | ujung lambung, lengan, dan capit bisa ditembus |
| bos Pemburu Agung | cakupan 49 persen | 1 bola | | sayap bisa ditembus |
| bos Sang Naga Vanta | cakupan 63 persen | 10 bola | | tanduk, sirip, dan setengah segmen tanpa bola |

## Perbaikan

- **Asteroid dan komet:** radius tabrakan kini dihitung dari geometri masing-masing (persentil 75), bukan
  0,85 atau 0,9 kali radius nominal.
- **Phobos dan Deimos:** bola tabrakan tepat di permukaan terdalam yang terlihat.
- **Kapal musuh:** mendapat radius sentuh badan dari bentuknya (`contactR`). Radius untuk peluru
  (`cfg.radius`) **tidak diubah**, agar keseimbangan tembak dan HP musuh tetap sama.
- **Bos:** mendapat bola padat yang dibangkitkan otomatis dari tiap bagian model (`bossAutoSolids`).
  - Bagian memanjang dibagi beberapa bola sepanjang sumbunya.
  - Pelat tipis (sayap, sirip) mendapat grid bola kecil hanya di titik yang benar-benar terisi.
  - Bagian kecil (lampu, kilat) dilewati.
  - Untuk naga, bola penahan peluru (`blockers`) tetap yang lama, sehingga sulitnya menembak tidak berubah.
- **Pesawat pemain:** radius 2,6 sengaja lebih kecil dari bentang sayap (visual 3,83). Ini hitbox pemaaf
  yang lazim di game tembak dan satu-satunya pengecualian. Membesarkannya membuat semua tabrakan lebih sering.

## Sesudah perbaikan

| Objek | Kelas | Visual | Tabrakan | Selisih | Status | Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| asteroid small (R 3) | sedang atau fatal | 3,44 | 3,44 | 0% | lolos |  |
| asteroid medium (R 6) | sedang atau fatal | 5,09 | 5,09 | 0% | lolos |  |
| asteroid large (R 11) | sedang atau fatal | 10,06 | 10,06 | 0% | lolos |  |
| asteroid giant (R 24) | sedang atau fatal | 30,24 | 30,24 | 0% | lolos |  |
| komet inti (R 6) | sedang | 6,55 | 6,55 | 0% | lolos | koma dan ekor tidak padat |
| Matahari | fatal | 900 | 900 | 0% | lolos |  |
| Merkurius | fatal | 48 | 48 | 0% | lolos |  |
| Venus | fatal | 112 | 112 | 0% | lolos |  |
| Bulan | fatal | 33 | 33 | 0% | lolos |  |
| Bumi | fatal | 120 | 120 | 0% | lolos |  |
| Phobos | fatal | 5,74 | 5,74 | 0% | lolos | tak beraturan: dibanding permukaan terdalam (persentil 10) |
| Deimos | fatal | 4,31 | 4,31 | 0% | lolos | tak beraturan: dibanding permukaan terdalam (persentil 10) |
| Mars | fatal | 68 | 68 | 0% | lolos |  |
| Io | fatal | 26 | 26 | 0% | lolos |  |
| Europa | fatal | 22 | 22 | 0% | lolos |  |
| Ganymede | fatal | 38 | 38 | 0% | lolos |  |
| Callisto | fatal | 34 | 34 | 0% | lolos |  |
| Jupiter | fatal | 480 | 480 | 0% | lolos |  |
| Titan | fatal | 37 | 37 | 0% | lolos |  |
| Saturnus | fatal | 400 | 400 | 0% | lolos |  |
| Uranus | fatal | 220 | 220 | 0% | lolos |  |
| Neptunus | fatal | 210 | 210 | 0% | lolos |  |
| Charon | fatal | 12 | 12 | 0% | lolos |  |
| Pluto | fatal | 24 | 24 | 0% | lolos |  |
| musuh drone | sentuhan | 1,97 | 1,97 | 0% | lolos | radius peluru tetap 2.3 |
| musuh gunship | sentuhan | 3,14 | 3,14 | 0% | lolos | radius peluru tetap 3.4 |
| musuh scout | sentuhan | 1,73 | 1,73 | 0% | lolos | radius peluru tetap 2.2 |
| musuh hunter | sentuhan | 2,71 | 2,71 | 0% | lolos | radius peluru tetap 3.4 |
| musuh guardian | sentuhan | 4,1 | 4,1 | 0% | lolos | radius peluru tetap 5 |
| musuh stalker | sentuhan | 2,6 | 2,6 | 0% | lolos | radius peluru tetap 3 |
| musuh commander | sentuhan | 3,78 | 3,78 | 0% | lolos | radius peluru tetap 4.2 |
| musuh sniper | sentuhan | 4,4 | 4,4 | 0% | lolos | radius peluru tetap 3 |
| musuh minelayer | sentuhan | 3 | 3 | 0% | lolos | radius peluru tetap 3.4 |
| musuh shieldship | sentuhan | 2,47 | 2,47 | 0% | lolos | radius peluru tetap 3.4 |
| musuh creature | sentuhan | 1,13 | 1,13 | 0% | lolos | radius peluru tetap 3.2 |
| musuh carrier | fatal | 8,09 | 8,09 | 0% | lolos | radius peluru tetap 9 |
| musuh station | fatal | 9,66 | 9,66 | 0% | lolos | radius peluru tetap 10 |
| musuh mine | sentuhan | 1,8 | 1,8 | 0% | lolos | radius peluru tetap 1.8 |
| musuh missile | sentuhan | 1,3 | 1,3 | 0% | lolos | radius peluru tetap 1.4 |
| pesawat pemain starfighter | pemain | 3,83 | 2,6 | -32% | di luar toleransi | sengaja lebih kecil dari bentang sayap (hitbox pemaaf) |
| bos raksasa | fatal | 0,94 | 65 bola | 1% | lolos | visual = persen titik model di dalam bola padat, selisih = persen isi bola yang kosong |
| bos miner | fatal | 0,88 | 62 bola | 0% | lolos | visual = persen titik model di dalam bola padat, selisih = persen isi bola yang kosong |
| bos hunter | fatal | 0,89 | 26 bola | 3% | lolos | visual = persen titik model di dalam bola padat, selisih = persen isi bola yang kosong |
| bos naga | fatal | 0,98 | 289 bola | 0% | lolos | visual = persen titik model di dalam bola padat, selisih = persen isi bola yang kosong |

Untuk bos, kolom Visual berisi cakupan dan kolom Selisih berisi isi kosong.

## Objek tipis dan tidak padat

| Objek | Keputusan | Alasan |
| --- | --- | --- |
| Cincin planet (pita tekstur) | tidak padat | Yang padat hanya batu di dalamnya, yang tertaut menjadi asteroid sungguhan dekat pemain dan memakai tingkat sesuai ukuran (kebanyakan kerikil tanpa damage) |
| Awan Bumi | tidak padat | Hanya tabir putih saat ditembus |
| Koma dan ekor komet | tidak padat | Yang padat hanya inti |
| Atmosfer planet | tidak padat | Tabrakan memakai bola planet tanpa lapisan atmosfer |
| Sayap, sirip, tanduk, dan segmen bos | padat dan fatal | Sesuai kesepakatan bahwa bos fatal; kini tercakup bola sesuai bentuk |
| Peluru | tidak berubah | Diatur sistem senjata (aturan: perilaku peluru tidak diubah) |
| Medan Bumi, laut, gunung, pilar | tidak berubah | Medan memakai tinggi permukaan yang sama dengan mesh; pilar memakai silinder meruncing yang sama dengan bentuknya |
