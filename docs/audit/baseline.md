# Baseline performa dan profil (A1)

Diukur 13 November 2026 pada commit `b5eddf5` ditambah instrumentasi A1 (hook `debug.perf()`, penghitung
sumber audio, `debug.feature()`, `debug.glitchProbe()`), sebelum perbaikan apa pun.

## Cara mengukur

| Alat | Isi | Perintah |
| --- | --- | --- |
| `tests/perf/profile.mjs` | frame time rata-rata dan p95, kerja JS per frame, rAF dan render per detik, `renderer.info` satu frame penuh, ukuran buffer, isi scene, GC dari trace V8, layout paksa, listener DOM, timer, sumber audio, heap | `node tests/perf/profile.mjs <label> --matrix` |
| `tests/perf/gpu-breakdown.mjs` | frame time tanpa batas frame, satu fitur dimatikan dalam satu waktu | `node tests/perf/gpu-breakdown.mjs <label>` |
| `tests/perf/alloc.mjs` | sampling heap profiler CDP, situs alokasi teratas per frame | `node tests/perf/alloc.mjs <label>` |
| `tests/perf/leak.mjs` | 20 kali restart dan 20 kali ganti stage, sumber daya sebelum dan sesudah | `node tests/perf/leak.mjs <label>` |
| `tests/perf/glitch.mjs`, `tests/perf/screencast.mjs` | deteksi kotak hitam (A7) | lihat `glitch-kotak-hitam.md` |

Perangkat: MacBook Pro M1 Pro (layar 3024x1964, ProMotion 120 Hz). Chromium headless memakai GPU asli lewat
ANGLE Metal (`ANGLE Metal Renderer: Apple M1 Pro`), jadi berbeda dari asumsi awal: waktu GPU di sini nyata,
bukan SwiftShader. Timer query GPU (`EXT_disjoint_timer_query_webgl2`) tidak tersedia, sehingga beban GPU
diukur lewat mode tanpa batas frame (`--disable-frame-rate-limit --disable-gpu-vsync`): bila frame time
tanpa batas jauh di atas waktu kerja CPU, frame dibatasi GPU. Headless menjalankan rAF pada 60 Hz; mode
tanpa batas sekaligus meniru layar 120 Hz atau lebih (loop render merender setiap rAF).

Viewport 1512x860 CSS (setara jendela penuh MacBook Pro 14 inci), kualitas Sedang (bawaan desktop), data
mentah di `docs/audit/data/baseline.json`, `baseline-audio.json`, `gpu-baseline.json`, `alloc-baseline.json`,
`leak-baseline.json`.

## Angka utama (60 Hz, DPR 2, 60 detik per skenario)

| Skenario | Render per detik | Frame rata-rata, p95 (ms) | Kerja JS per frame (ms) | Draw call | Segitiga | Buffer | Bloom | GC minor per menit | Alokasi per frame | Layout paksa per detik | Heap awal, akhir (MB) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Menu (attract Saturnus) | 60,1 | 16,67, 16,8 | 1,97 | 72 | 134.697 | 2268x1290 (2,93 MP) | ya | 79 | 40 KB | 0 | 9,2, 11,3 |
| Gameplay Bumi | 59,9 | 16,72, 16,8 | 2,41 | 100 | 58.070 | 2268x1290 | tidak | 135 | 72 KB | 97 | 10,3, 11,7 |
| Gameplay angkasa ramai (gelombang 8, sabuk asteroid) | 60,0 | 16,67, 16,8 | 2,15 | 105 | 94.065 | 2268x1290 | ya | 137 | 79 KB | 116 | 10,7, 12,2 |

## Tanpa batas frame (meniru layar 120 Hz ke atas, beban GPU terlihat)

| Skenario | DPR | Render per detik | Frame rata-rata, p95 (ms) | Kerja JS (ms) | GC minor per menit |
| --- | --- | --- | --- | --- | --- |
| Menu | 2 (2,93 MP) | 104 | 9,10, 16,5 | 8,74 | 129 |
| Menu | 1 (1,30 MP) | 231 | 3,97, 7,7 | 3,77 | 250 |
| Bumi | 2 | 431 | 2,34, 5,4 | 1,73 | 619 |
| Bumi | 1 | 468 | 2,26, 5,3 | 1,80 | 648 |
| Angkasa | 2 | 91 | 10,99, 26,5 | 10,17 | 237 |
| Angkasa | 1 | 174 | 5,67, 12,9 | 4,95 | 362 |

Menu dan angkasa membutuhkan 9 sampai 11 ms GPU per frame pada 2,93 MP dan turun hampir sebanding dengan
jumlah piksel (sekitar 3 ms per megapiksel): beban fragmen. Bumi hanya 2,3 ms dan tidak peka terhadap DPR.
Waktu kerja JS tanpa batas ikut naik karena `render()` menunggu GPU (antrean penuh).

Pada layar ProMotion 120 Hz loop merender 120 kali per detik, sehingga menu dan angkasa meminta
120 x 9 sampai 11 ms = 1,1 sampai 1,3 detik kerja GPU per detik: GPU M1 Pro jenuh terus menerus. Inilah
sumber panas dan kipas yang dilaporkan.

## Pemecahan biaya per fitur (tanpa batas frame, DPR 2)

Selisih frame time saat satu fitur dimatikan (`docs/audit/data/gpu-baseline.json`). Menu bergerak terus
sehingga angka per fitur berisik, tetapi urutannya konsisten.

| Fitur | Menu: hemat (ms) | Angkasa: hemat (ms) | Bumi: hemat (ms) |
| --- | --- | --- | --- |
| Nebula fbm per piksel (4 fbm x 5 oktaf) | 5,90 | 3,35 | - |
| Pita Bima Sakti fbm per piksel (3 fbm, butir noise) | 4,30 | 2,64 | - |
| Bloom (UnrealBloomPass) | 2,04 | 2,90 | - |
| Bayangan (peta bayangan dirender ulang tiap frame) | 2,61 | 0,96 | 0,39 |
| Bintang (Points) | 3,44 | ~0 | - |
| Galaksi | 2,36 | ~0 | - |
| Black hole | 1,51 | ~0 | - |
| Planet dan cincin | 1,34 | ~0 | - |
| Partikel | 1,24 | ~0 | 0,54 |
| Awan Bumi | - | - | 0,60 |
| Langit gradien Bumi | - | - | 0,67 |
| Semua fitur di atas mati | 8,98 dari 10,33 | 6,64 dari 9,86 | 1,01 dari 2,69 |

## Hasil cek butir a sampai n

a. **Pembatas FPS: tidak ada.** `frame()` memanggil `update()` dan `render()` pada setiap rAF. Di layar
120 Hz game merender 120 kali per detik. `dt` sudah di-clamp ke `CONFIG.maxDelta` 0,05 detik, tetapi
`lastTime` tidak di-reset setelah tab kembali terlihat (lompatan dt dibatasi clamp, aman).

b. **Pixel ratio:** `min(devicePixelRatio, preset.pixelRatioMax, 2)` dengan Rendah 1, Sedang 1,5, Tinggi 2.
Di MacBook (DPR 2) kualitas Sedang merender 2268x1290 = 2,93 MP, DPR 3 sama (dibatasi 1,5). Tidak ada batas
megapiksel. Peta bayangan berukuran tetap (1024 atau 2048), tidak dikali DPR. **Bloom ikut dikali DPR:**
`EffectComposer.setSize` memanggil `setSize` setiap pass dengan ukuran x pixel ratio, sehingga skala 0,5
yang diberikan saat membuat `UnrealBloomPass` pada kualitas Sedang tertimpa dan bloom berjalan pada resolusi
penuh.

c. **Bloom:** RenderPass (penuh, HalfFloat), UnrealBloomPass (high-pass setengah resolusi, 5 mip masing-masing
blur horizontal dan vertikal, komposit, blend ke buffer penuh), OutputPass (penuh): sekitar 14 pass per
frame. Aktif di menu bila medan bawaan Angkasa (bawaan pemain baru). Di perangkat sentuh mati bawaan (H8).
Saat bloom aktif, MSAA renderer tidak berlaku (target composer tanpa sampel).

d. **Bayangan:** satu DirectionalLight `castShadow`, peta 1024 (Sedang) atau 2048 (Tinggi), PCF, kamera
bayangan mengikuti pemain dan **dirender ulang tiap frame** (`shadowMap.autoUpdate` bawaan). Jumlah pemancar
bayangan terlihat: 7 di menu, 32 sampai 39 di Bumi, 45 sampai 89 di angkasa (bagian musuh ikut
`castShadow`). Biaya 0,4 sampai 2,6 ms.

e. **Draw call dan geometri:** peluru pemain dan musuh sudah InstancedMesh (`BulletPool`), partikel Points
ber-pool (2 sistem), bintang Points, batu cincin dan sabuk InstancedMesh, awan InstancedMesh. Asteroid satu
Mesh per objek dengan material sendiri (untuk kilatan kena) tetapi di-pool, tidak dibuat ulang saat spawn.
Model musuh dibuat sekali per slot pool. Draw call 70 sampai 115, cukup rendah. Geometri dan tekstur stabil
selama bermain (60 dan 58), `disposeGame()` membuang semua.

f. **Alokasi per frame:** 40 KB (menu), 72 KB (Bumi dan angkasa) per frame, menghasilkan 80 sampai 200 GC
minor per menit pada 60 Hz dan sampai 650 per menit tanpa batas. Sekitar 25 sampai 35 KB per frame berasal
dari jalur unggah uniform Three.js (`setValueM4`, `setValueV3f`, sebanding jumlah objek dan draw call).
Situs kode game teratas (`alloc-baseline.json`): `updateCombat` 6 sampai 7 KB, `updateGunship` 4,5 KB,
`RockFields.update` 2 sampai 3 KB, `SolarSystem.update` 2 KB, `SpaceWorld.update` 1,5 KB, `Radar.update`
dan closure `blip` 2,5 KB (objek `counts`, `o`, closure tiap gambar ulang), `updateIndicators` 1,6 KB,
`Terrain.rebuild` 5 KB saat chunk dibangun ulang (Bumi).

g. **Dunia:** Bumi memakai grid chunk (5x5, 7x7, 9x9 per preset) yang didaur ulang, frustum culling bawaan
Three.js. Angkasa: proksi berskala untuk benda jauh, sabuk dibangkitkan per sel di sekitar kamera, LOD batu
ke asteroid ber-HP. Langit (nebula, Bima Sakti, galaksi, bintang jauh) `frustumCulled = false` karena
mengikuti kamera: shader fbm dihitung untuk setiap piksel layar setiap frame walau isinya statis.

h. **Partikel:** 2 sistem ring buffer (`fire` 60 persen, `smoke` 40 persen dari `maxParticles` 900, 1800,
3200), satu material per sistem, tanpa alokasi saat emit. Seluruh buffer posisi, ukuran, dan alfa diunggah
tiap frame walau partikel aktif hanya 64 sampai 273.

i. **DOM:** HUD memakai `changed()` (tulis hanya bila berubah), tetapi `Radar.update` membaca
`cv.clientWidth` dua kali per frame setelah HUD menulis teks, memaksa layout sinkron: 97 sampai 116 layout
paksa per detik saat bermain (nol di menu). Radar digambar ulang penuh 30 kali per detik (setengah rAF, jadi
60 kali per detik di layar 120 Hz). `backdrop-filter: blur` hanya di layar jeda (statis), kartu Pengaturan,
dan overlay putar layar; tidak ada blur di atas kanvas saat bermain. `#flare` adalah lapisan layar penuh
`mix-blend-mode: screen` di atas kanvas yang transform anaknya ditulis tiap frame saat Matahari terlihat.
Animasi CSS tak berhenti: `blink` dan `pulse` pada elemen peringatan (hanya saat tampil).

j. **Canvas 2D:** tidak ada CanvasTexture yang diperbarui tiap frame. Tekstur kanvas (planet, livery,
tekstur jet) dibuat sekali dengan `willReadFrequently`. `getImageData` tidak dipakai di jalur panas. Radar
dan horizon buatan adalah kanvas 2D DOM.

k. **Audio:** 15 sumber hidup di menu (4 tetap: brown noise, 2 osilator mesin, noise nitro, ditambah pad
musik), 18 di angkasa; 1,6 sumber baru per detik di menu, 23 sampai 25 per detik saat bermain (tembakan,
ledakan, bip). Sumber sekali bunyi dihentikan dengan `stop()` tetapi tidak di-`disconnect()`. Mesin dan nitro
sudah satu graf tetap yang dimodulasi (bukan node baru tiap frame). AudioContext di-suspend hanya saat state
`paused`; di menu tetap berjalan, termasuk saat tab tersembunyi.

l. **Visibility:** rAF berhenti sendiri saat tab tersembunyi dan game masuk jeda, tetapi saat jendela hanya
kehilangan fokus di menu loop tetap penuh. Menu menjalankan scene 3D penuh (attract, bloom, langit fbm) pada
kualitas penuh dan laju penuh, juga ketika Pengaturan, Hangar, Penemuan, atau peta menutupi layar. Saat Hangar
terbuka ada dua konteks WebGL yang merender bersamaan. Saat jeda, kartu level, kontrak, peta, game over,
dunia beku tetapi scene tetap dirender ulang setiap frame.

m. **Kebocoran (20 kali restart, 20 kali ganti stage):** objek scene 1188 tetap, anak scene 277 tetap,
tekstur 58 tetap, listener `Events` 70 tetap, timer aktif 0, heap 10,68 ke 11,13 MB (restart, +4 persen) dan
11,45 ke 11,55 MB (stage). Geometri 60 ke 69 dan program 44 ke 46 setelah ganti stage (model bos dan proksi
yang baru pertama kali dibuat, tidak bertambah lagi). Listener DOM 144 ke 146 (restart) dan 148 ke 157
(stage): tombol kontrak dibuat ulang setiap stage.

n. **Ukuran Three.js:** tidak di-inline. Dimuat dari jsDelivr lewat importmap dalam versi **tidak
diminifikasi**: `three.module.js` 659 KB ditambah `three.core.js` 1.475 KB, total 2,13 MB untuk di-parse,
dibanding versi `.min.js` 392 KB ditambah 422 KB (814 KB). Addon yang dipakai hanya EffectComposer,
RenderPass, UnrealBloomPass, OutputPass dan dependensinya. Tanpa SRI. Kode game inline sekitar 590 KB.

## Peringkat akar masalah panas

| Peringkat | Akar masalah | Bukti | Perkiraan kontribusi |
| --- | --- | --- | --- |
| 1 | Loop tanpa batas FPS di layar 120 Hz | `frame()` merender tiap rAF; tanpa batas frame menu 104 sampai 231 render per detik, Bumi 431 | Menggandakan semua kerja GPU dan CPU di MacBook ProMotion dan HP 120 Hz |
| 2 | Langit angkasa (nebula dan Bima Sakti) dihitung fbm per piksel setiap frame | 5,9 dan 4,3 ms dari 10,3 ms di menu; 3,4 dan 2,6 ms dari 9,9 ms di angkasa | Sekitar 60 persen kerja GPU menu dan angkasa |
| 3 | Jumlah piksel tanpa batas megapiksel, bloom pada resolusi penuh | 2,93 MP di DPR 2 dan 3, biaya sekitar 3 ms per MP; bloom 2 sampai 3 ms karena skala 0,5 tertimpa `composer.setSize` | Sebanding luas layar |
| 4 | Menu dan layar statis tetap merender penuh | Menu 60 render per detik dengan bloom dan langit fbm; jeda, peta, kartu, Hangar tetap merender scene | Seluruh beban menu berjalan saat pemain hanya membaca menu |
| 5 | Peta bayangan dirender ulang tiap frame dengan banyak pemancar | 0,4 sampai 2,6 ms, 32 sampai 89 pemancar | Sedang |
| 6 | Alokasi dan layout paksa per frame | 40 sampai 79 KB per frame, 80 sampai 200 GC minor per menit, 100 layout paksa per detik | CPU kecil (kerja JS 2 sampai 2,5 ms per frame) tetapi menggandakan di 120 Hz |
| 7 | AudioContext selalu berjalan di menu dan saat tersembunyi | `audioState` running di menu, 15 sumber hidup | Kecil (utas audio) |

Kerja JS per frame (2 sampai 2,5 ms) jauh di bawah target 6 ms; panas berasal dari GPU. Pada HP, kualitas
Rendah (DPR 1, tanpa bloom) tetap menjalankan shader fbm langit di seluruh layar pada GPU yang jauh lebih
lemah, dan banyak HP Android merender 90 sampai 120 Hz.
