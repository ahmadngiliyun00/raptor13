# Penyimpanan dan keamanan data baru (C7, 2.4.0)

Semua kunci localStorage berawalan `raptor13.`. Uji `C7 hook peralatan` memeriksa ini setelah semua fitur baru
dipakai.

| Kunci | Isi | Versi skema |
| --- | --- | --- |
| `raptor13.v3` | Simpanan utama: pengaturan, skor, kapal, kampanye, penemuan, dan kini `equip` | 3, dengan field `equip` baru |
| `raptor13.hudlayout.v1` | Tata letak HUD kustom per kelas ukuran layar (C3) | `v: 1` |
| `raptor13.bosslog.v1` | Sepuluh pertarungan bos terakhir (D2) | 1 |

## Field `equip` di `raptor13.v3`

```
equip: {
  unlocked: ['kunang', 'sisik', ...],         // id peralatan yang terbuka
  loadout: { 'raptor-j': ['kunang'], starfighter: [], interceptor: [null, null], gunship: [null, null, null] },
  contracts: 0                                  // jumlah kontrak selesai (perolehan Suar dan Ranjau)
}
```

## Validasi saat dimuat (`Save.sanitizeEquip`)

**Daftar terbuka (`unlocked`):**
- Hanya id dari `EQUIPMENT_DEFS` yang diterima. Id asing, angka, dan `__proto__` dibuang.
- Kunang dan Sisik selalu terbuka.

**Loadout per kapal:**
- Panjang loadout selalu sama dengan jumlah slot kapal. Kelebihan dipotong, kekurangan diisi `null`.
- Id yang belum terbuka atau duplikat dalam satu kapal menjadi `null`.
- Bila tipenya salah, misalnya bukan array, dipakai loadout bawaan.

**Penghitung kontrak:** harus bilangan bulat tidak negatif, maksimal 1 juta.

**Batas ukuran:** teks simpanan di atas 200 KB tidak dibaca. Simpanan dianggap rusak, pemain diberi tahu sekali
di menu, dan bawaan dipakai.

**Migrasi:** simpanan lama tanpa field `equip` (2.3.x dan sebelumnya) mendapat bawaan: Kunang dan Sisik
terbuka, dan Raptor-J membawa Kunang.

## Tata letak HUD (`HudCustom.clean`)

- Hanya kunci elemen yang dikenal yang diterima: `fire`, `nitro`, `ult`, `roll`, `imm`, `loop`, `eq0`
  sampai `eq2`, dan `joy`.
- Rentang nilai: offset maksimal 0,7 dan skala 0,7 sampai 1,3.
- Kelas layar yang diterima hanya `kecil`, `sedang`, atau `besar`, digabung dengan `mendatar` atau `tegak`.

Data yang melanggar diabaikan. Tata letak yang valid secara skema tetapi tidak valid di layar sekarang tidak
dipakai, dan game kembali ke bawaan.

## Hook debug

Hook peralatan dan editor (`equip`, `equipSet`, `equipUse`, `equipTest`, `equipBot`, `hudEditor`, `hudPreset`,
dan lainnya) hanya ada di `window.__game.debug`. Objek itu sendiri hanya dibuat bila halaman dibuka dengan
`?debug=1`. Tanpa parameter tidak ada global baru: `Equip`, `HudEditor`, dan `EQUIPMENT_DEFS` adalah variabel
modul, bukan properti `window`.

Diuji di `tests/equip.spec.mjs` (C7) dan `tests/audit.spec.mjs` (A3).
