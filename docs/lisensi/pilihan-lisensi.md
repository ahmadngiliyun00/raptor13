# Pilihan lisensi RAPTOR13

Catatan untuk pemilik. **Ini bukan nasihat hukum.** Untuk keputusan bisnis, tanyakan konsultan HKI.

## Pilihan bawaan

| Bagian | Lisensi | Berkas |
| --- | --- | --- |
| Kode sumber | MIT | `LICENSE` |
| Konten kreatif: nama, cerita, Piko, desain kapal dan ikon, teks | CC BY 4.0 | `LICENSE-CONTENT.md` |
| Nama dan logo RAPTOR13 | tidak dilisensikan | `TRADEMARKS.md` |

## Perbandingan untuk game seperti ini

| Lisensi | Kelebihan | Kekurangan | Dampak pada klon komersial | Dampak pada rencana Google Play |
| --- | --- | --- | --- | --- |
| MIT | Paling sederhana dan paling dikenal, kontributor mudah ikut, cocok dengan hampir semua pustaka | Siapa pun boleh membuat versi tertutup | Klon berbayar diizinkan asal mencantumkan pemberitahuan hak cipta | Tidak ada hambatan; pemilik bebas merilis versi Play |
| Apache-2.0 | Seperti MIT, ditambah lisensi paten eksplisit dan aturan perubahan berkas | Teks lebih panjang, wajib berkas NOTICE bila ada | Sama dengan MIT | Tidak ada hambatan |
| GPL-3.0 | Turunan yang didistribusikan wajib terbuka dengan lisensi yang sama | Membatasi penggabungan dengan kode tertutup; sebagian kontributor enggan | Klon tertutup dilarang, klon terbuka tetap boleh dijual | Pemilik tetap boleh merilis karena memegang hak cipta; pihak lain yang merilis wajib membuka kode |
| AGPL-3.0 | Seperti GPL, juga berlaku untuk layanan lewat jaringan (situs web) | Paling ketat; banyak perusahaan menghindarinya | Situs klon wajib membuka kode | Sama dengan GPL |

## Alasan MIT ditambah CC BY 4.0

- Tujuan proyek adalah mengundang kontributor dan memudahkan belajar. Lisensi sederhana menurunkan hambatan.
- Nilai unik RAPTOR13 ada pada nama, karakter, dan dunia, bukan semata kode. Konten dilisensikan terpisah
  dengan CC BY 4.0, jadi pemakaian ulangnya wajib mencantumkan atribusi.
- Kebijakan merek (`TRADEMARKS.md`) mencegah fork menyamar sebagai versi resmi. Pencegahan itu tidak datang dari
  pembatasan kode.

**Konsekuensi yang perlu dipahami.** MIT mengizinkan siapa pun menjual klon kode, asal mencantumkan
pemberitahuan. Bila Anda ingin klon tertutup tidak mungkin, pilih GPL-3.0 atau AGPL-3.0.

## Hak cipta dan HKI

**Lisensi terbuka tidak memindahkan kepemilikan hak cipta.**

- Pemilik tetap pemegang hak cipta.
- Pemilik bisa mendaftarkan pencatatan ciptaan atau merek di DJKI.
- Pemilik bisa merilis versi resmi di toko aplikasi.

Kontribusi dari orang lain tetap dimiliki penulisnya, tetapi dilisensikan ke proyek dengan lisensi yang sama
lewat DCO (lihat `CONTRIBUTING.md`).

## Cara mengganti lisensi

1. Ganti isi `LICENSE`, dan bila perlu `LICENSE-CONTENT.md`.
2. Perbarui badge dan bagian lisensi di README, lalu bagian lisensi di `CONTRIBUTING.md`.
3. Kode yang sudah dirilis dengan MIT tetap berlaku MIT bagi yang sudah menerimanya. Pergantian hanya berlaku
   untuk versi berikutnya.
4. Bila ada kontribusi pihak lain, minta persetujuan mereka atau pastikan lisensi barunya kompatibel.
