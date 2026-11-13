# Perintah rilis (A6)

Perintah yang dipakai untuk membuat tag beranotasi dan GitHub Release. Tanggal tag disamakan dengan
tanggal commit yang ditandai agar urutan sejarah rapi. Jalankan dari akar repo.

```bash
tag() {   # tag <nama> <hash> <berkas-pesan>
  D="$(git log -1 --format=%cI "$2")"
  GIT_COMMITTER_DATE="$D" GIT_AUTHOR_DATE="$D" git tag -a --cleanup=verbatim "$1" "$2" -F "$3"
}
tag v1.0.0 95d12e94b892ff889f567e89120c33b0f85440a6 docs/rilis/catatan/v1.0.0.md
tag v2.0.0 e5ca2722cd962fb6632604f97c6f1c185bf580cc docs/rilis/catatan/v2.0.0.md
tag v2.1.0 2f582565a7837811cfa6ab90520f56f6fd12e239 docs/rilis/catatan/v2.1.0.md
tag v2.2.0 <hash commit "docs: A6 rencana tag dan perintah rilis"> docs/rilis/catatan/v2.2.0.md
git push origin --tags

gh release create v1.0.0 --title "RAPTOR13 1.0.0 (sejarah)" --notes-file docs/rilis/catatan/v1.0.0.md --latest=false
gh release create v2.0.0 --title "RAPTOR13 2.0.0 (sejarah)" --notes-file docs/rilis/catatan/v2.0.0.md --latest=false
gh release create v2.1.0 --title "RAPTOR13 2.1.0" --notes-file docs/rilis/catatan/v2.1.0.md --latest=false
gh release create v2.2.0 --title "RAPTOR13 2.2.0" --notes-file docs/rilis/catatan/v2.2.0.md --latest

# Verifikasi
git tag -n
for t in v1.0.0 v2.0.0 v2.1.0 v2.2.0; do git show --no-patch --format='%H %ci %s' "$t^{commit}"; done
git log --oneline --decorate | grep tag:
git ls-remote --tags origin
```
