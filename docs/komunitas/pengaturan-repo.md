# Rekomendasi pengaturan repo GitHub

Pengaturan sensitif tidak diubah otomatis. Pemilik sebaiknya mengaktifkan yang berikut lewat Settings di
GitHub.

| Pengaturan | Lokasi | Alasan |
| --- | --- | --- |
| Discussions | Settings, General, Features | Tempat tanya jawab dan usulan tanpa memenuhi issue |
| Private vulnerability reporting | Settings, Code security | Jalur laporan kerentanan di `SECURITY.md` |
| Dependabot alerts dan security updates | Settings, Code security | Peringatan untuk dependensi uji dan proyek mobile |
| Secret scanning dan push protection | Settings, Code security | Mencegah kunci atau sandi ikut terdorong |
| Proteksi cabang `main` | Settings, Branches, Add rule | Wajibkan pull request, minimal 1 review, dan status CI lolos; larang force push dan penghapusan |
| Wajibkan tanda DCO | Pasang aplikasi DCO dari GitHub Marketplace | Memastikan baris Signed-off-by ada di setiap commit kontribusi |
| GitHub Pages | Settings, Pages, Deploy from a branch, `main` / root | Situs alternatif selain domain utama |

Yang sudah diatur lewat gh CLI (tidak sensitif):

- topik repo;
- label standar;
- issue awal "good first issue" dan "help wanted".

Daftarnya ada di ringkasan rilis 2.4.0.
