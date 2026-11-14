# Antarmuka peralatan (C5, 2.4.0)

## Hangar dan pra-misi

Hangar dibuka dari menu utama (tombol HANGAR) atau dari alur MULAI. Pada alur MULAI, layar pilih kapal
berfungsi sebagai layar pra-misi.

**Membuka panel.** Tombol **PERALATAN** mengganti panel info kapal dengan panel Peralatan.

**Isi panel:**
- **Slot kapal:**
  - Gunship 3 slot, Interceptor 2, Raptor-J 1;
  - Starfighter tanpa slot, panelnya menampilkan sifat pasif Inti Serba Guna.
- **Daftar 9 peralatan.** Warna tepi menandakan kelangkaan: biru langka, ungu epik. Peralatan terkunci tampak
  pudar.
- **Deskripsi.** Memuat nama, cooldown atau muatan, efek, dan cara membuka bila masih terkunci.

**Memasang:**
1. Pilih slot.
2. Ketuk peralatan. Peralatan yang sudah ada di slot lain ditukar; mengetuk peralatan yang sama di slot
   terpilih melepasnya.

**Tombol lain:**
- **LEPAS:** mengosongkan slot terpilih.
- **PASANG OTOMATIS:** mengisi slot dengan urutan serba guna yang sudah terbuka (Kunang, Sisik, Kubah, Tombak,
  Pengacau, Rajut, Suar, Ranjau, Magnet).

Loadout tersimpan per kapal dan langsung divalidasi.

**Layar pendek.** Di layar setinggi 320 px panel memakai ubin 36 px (area sentuh 44 px) dan deskripsi
maksimal 3 baris. Kartu hangar muat tanpa scroll; tinggi kartu 304 px di 568x320.

## Di dalam permainan

**Mode HP.** Slot tampil di lapis luar busur tombol (C2), dengan:
- ikon peralatan;
- cincin cooldown biru;
- penghitung muatan;
- denyut halus saat siap;
- tampilan pudar saat cooldown.

Cara memakai:
- Ketuk untuk memakai.
- Tombak Magnet: tekan dan tahan, lalu sinar menembak setelah sekitar 1 detik. Melepas lebih awal membatalkan.
- Slot sementara dari Peti Peralatan bertepi putus-putus.

**Desktop.** Slot tampil sebaris dengan Gulung, Balik, dan Loop di bawah tengah, berlabel tombol **Q**, **F**,
dan **G**. Tombol Q, F, dan G tidak bentrok dengan kontrol yang ada: W, S, A, D, Spasi, Enter, E, Z, X, C,
Shift, Tab, P, Esc, M, R, 1, 2, 3. Daftar kontrol di menu dan Pengaturan memuat baris "peralatan slot 1
sampai 3". Label keyboard tidak tampil di mode HP.

**Penanda kunci.** Saat Kunang siap, cincin kuning berkedip menandai hingga 2 sasaran yang akan dikunci.

**Saran Piko.** Satu kali per peralatan per sesi, lewat pusat notifikasi tunggal, dan mengikuti opsi Bantuan
robot. Contohnya:
- "Rudal musuh mengunci kita, luncurkan Suar Kelip";
- "HP kita rendah, pakai Rajut Nano";
- "Ada pengejar di belakang, jatuhkan Ranjau";
- "Sisik menahan satu pukulan".

**Umpan balik:**
- suara sintesis unik per peralatan, didefinisikan sebagai data di `EQUIPMENT_DEFS` (nada dan derau);
- getar singkat di mode HP;
- efek visual dari pool objek: rudal berjejak asap, gelembung Kubah, sinar Tombak, bola kawat Pengacau, suar
  berkedip, dan ranjau berkedip.

Screenshot: `docs/screenshots/c-update/hangar-peralatan-*.jpg` dan `hud-peralatan-*.jpg`.
