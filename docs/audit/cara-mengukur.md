# Cara mengukur performa dan panas sendiri

Panduan singkat untuk memeriksa apakah RAPTOR13 membebani perangkat, tanpa alat khusus.

## 1. Overlay performa di dalam game (F3)

- Desktop: tekan **F3** kapan saja. HP: Pengaturan, tab Grafis, centang **Overlay performa**.
- Isi overlay:
  - `FPS` dan `target`: laju render nyata dan batas yang sedang berlaku (60 saat bermain, 20 di menu,
    `statis` saat jeda atau layar menu tertutup panel, 30 di mode Hemat baterai).
  - `frame` dan `p95`: rata-rata dan persentil 95 jarak antar frame. Nilai p95 jauh di atas rata-rata
    berarti ada patah-patah.
  - `JS`: waktu kerja JavaScript per frame (update dan pengiriman render). Di bawah 6 ms sehat.
  - `draw` dan `segitiga`: jumlah draw call dan segitiga satu frame penuh.
  - `resolusi`, `skala`, `pr`: ukuran buffer render, skala resolusi dinamis (1,00 sampai 0,60), dan pixel
    ratio efektif.
  - `kualitas`, `mode`, `turun n`: preset, mode performa, dan berapa tingkat sudah diturunkan otomatis.
  - `bloom` dan `bayangan`: apakah efek itu sedang aktif.

## 2. Chrome Task Manager (Shift+Esc)

1. Buka game di Chrome, tekan **Shift+Esc** (macOS: menu Window, Task Manager).
2. Klik kanan judul kolom, aktifkan **GPU memory** dan **CPU**.
3. Bandingkan baris tab RAPTOR13 dan baris **GPU Process**:
   - di menu utama CPU tab seharusnya rendah dan GPU Process jauh di bawah saat bermain;
   - saat jeda atau saat panel Pengaturan terbuka, CPU tab hampir nol karena game tidak merender ulang.

## 3. Activity Monitor (macOS)

1. Buka Activity Monitor, tab **CPU**. Menu Window, **GPU History** (Cmd+4) untuk grafik GPU.
2. Cari proses **Google Chrome Helper (GPU)** dan **Google Chrome Helper (Renderer)**.
3. Tab **Energy** menunjukkan Energy Impact per aplikasi; bandingkan menu, bermain, dan jeda.
4. Suhu dan kipas tidak tampil di Activity Monitor. Bila ingin melihatnya, pakai aplikasi pihak ketiga
   seperti Stats atau iStat Menus (opsional).

## 4. chrome://gpu

Buka `chrome://gpu` lalu periksa:

- **Graphics Feature Status**: `WebGL` dan `WebGL2` harus `Hardware accelerated`. Bila `Software only`,
  game berjalan di CPU dan pasti lambat serta panas: perbarui driver atau aktifkan akselerasi perangkat
  keras di chrome://settings/system.
- **GL_RENDERER**: di Mac M1 tertulis `ANGLE Metal Renderer: Apple M1 ...`.

## 5. DevTools Performance

1. Buka DevTools (Cmd+Opt+I atau F12), tab **Performance**.
2. Klik ikon roda gigi, set **CPU: No throttling**, lalu rekam 10 detik saat bermain.
3. Periksa:
   - **Frames**: batang hijau rata; frame merah berarti terlewat.
   - **Main**: blok `Animation Frame Fired` yang memanggil `frame`; panjangnya sebanding nilai `JS` F3.
   - **GPU**: aktivitas GPU per frame. Celah besar antar blok berarti GPU santai.
   - Ringkasan **Bottom-Up**: fungsi dengan Self Time terbesar.
4. Tab **Memory**, Heap snapshot sebelum dan sesudah beberapa kali mulai ulang: jumlah objek tidak boleh
   terus naik.

## 6. Hook pengukuran untuk pengembang

Buka `index.html?debug=1`, lalu di Console:

```js
__game.debug.perf()            // fps, frame time rata-rata dan p95, draw call, segitiga, buffer, audio, heap
__game.debug.setPerfMode('hemat')   // otomatis | hemat | seimbang | kualitas
__game.debug.feature('bloom', false) // matikan satu fitur untuk membandingkan biaya
```

Skrip otomatis di `tests/perf/` (lihat `docs/audit/baseline.md`) mengulang pengukuran yang sama.

## Tips bila perangkat tetap panas

- Pengaturan, Grafis, **Mode performa: Hemat baterai** (30 FPS, tanpa bloom dan bayangan, resolusi 0,75).
- **Batas FPS: 30** untuk sesi panjang.
- **Resolusi maksimum: 1x** di layar Retina.
- Kualitas **Rendah** (berlaku setelah dimuat ulang).
