# Arsitektur RAPTOR13

Seluruh game berada di satu berkas `index.html`, berurutan: HTML layar dan HUD, CSS, importmap Three.js lokal,
lalu satu skrip module. Tidak ada build step. Sistem ditandai komentar blok berjudul huruf kapital. Cari
judulnya untuk melompat, misalnya `PERALATAN DI DALAM PERMAINAN`.

## Peta sistem

```
index.html
├─ <head>  meta viewport (anti zoom), meta CSP berhash, manifest, importmap three 0.187.0 (integrity sha384)
├─ HTML    layar menu, hangar, pengaturan, peta, HUD desktop (#hud), HUD mode HP (.hpx-*), kontrol sentuh (#touch),
│          editor tata letak (#hud-editor)
├─ CSS     tema, layar, HUD, mode HP, kontras adaptif (.uic-*), busur tombol, editor
└─ module  urutan kira-kira:
   ├─ CONFIG, kualitas, kesulitan, SETTING_DEFAULTS            data yang bisa disetel
   ├─ EQUIPMENT_DEFS, SHIP_SLOTS, EQUIP_DIFF                    data peralatan
   ├─ Save (raptor13.v3), Store                                 simpanan tervalidasi dan migrasi
   ├─ Events                                                    bus event sederhana (on, off, emit)
   ├─ Health, applyDamage                                       satu pintu damage untuk pemain, musuh, asteroid
   ├─ Layout, Viewport, renderer, Post (bloom)                  ukuran dari layout viewport, render
   ├─ Worlds: EarthWorld (medan, awan) dan SpaceWorld (SolarSystem, asteroid, komet)
   ├─ SHIPS, Player, PlayerRig, CamRig                          kapal, fisika terbang, manuver, kamera
   ├─ Weapons, Enemies (+ AI fighter, rudal, ranjau), Waves     tempur
   ├─ Bosses, BossPilot, BOSS_PILOT, BossFX, BossHud            bos, perilaku, penanda
   ├─ COLLISION_TIERS, updateCombat, FatalWatch                 tabrakan berbasis ukuran dan energi
   ├─ Pickups, Stars, Buffs, Ultimate, Combo, Levels            hadiah dan progres sesi
   ├─ Equip, EquipUI                                            peralatan: efek, peti, perolehan, UI
   ├─ Campaign, Contracts, Discovery                            kampanye 10 stage, kontrak, atlas
   ├─ Sfx (Web Audio sintesis), Music                           semua suara dibuat kode
   ├─ hud, Notify, Piko                                         HUD, pusat notifikasi, robot pemandu
   ├─ UiContrast, HudLayout, HudCustom, HudEditor, Touch        kontras adaptif, busur tombol, editor, sentuh
   ├─ Hangar, Settings, UI, SolarMap                            layar menu
   ├─ ZoomGuard, Diag, GlitchProbe, Pacer, Perf                 pencegahan zoom iOS, diagnosis, performa
   └─ GameHooks (window.__game, hanya ?debug=1)                 hook uji dan debug
```

## Alur satu frame

```
requestAnimationFrame
  └─ Pacer (batas FPS, resolusi dinamis)
      └─ update(dt)
          ├─ masukan: Keyboard, Touch, AutoInput (bot uji)
          ├─ Player.update, CamRig.update
          ├─ Enemies, Bosses, Waves, Asteroids, Comets
          ├─ updateCombat (peluru, tabrakan, damage lewat applyDamage)
          ├─ Pickups, Stars, Ultimate, Equip, EquipUI, Piko, Contracts, Discovery
          └─ updateHud (HUD, BossHud, UiContrast, penanda)
      └─ render() lalu UiContrast.afterRender (kalibrasi PBO hanya lewat debug)
```

## Prinsip

- **Data terpusat.** Angka yang disetel ada di objek data, bukan tersebar di logika.
- **Satu pintu damage.** Semua damage lewat `applyDamage`. Perisai peralatan memotong di sana, sedangkan
  tabrakan fatal lewat `Player.fatalCrash`.
- **Tanpa alokasi per frame.** Efek memakai pool atau instancing. Vektor sementara dipakai ulang (`_va`, `_vb`).
- **Ukuran dari layout viewport.** Sumbernya `Layout.w` dan `Layout.h`, bukan `innerWidth`, agar zoom iOS tidak
  merusak canvas.
- **Keamanan.**
  - CSP berhash;
  - tanpa jaringan;
  - localStorage divalidasi dengan kunci berawalan `raptor13.`;
  - hook debug hanya lewat `?debug=1`.

## Uji

| Berkas | Isi |
| --- | --- |
| `tests/game.spec.mjs` | Alur permainan, kebocoran, performa |
| `tests/hp.spec.mjs` | Tata letak mode HP di matriks layar, editor C3 |
| `tests/hud.spec.mjs` | Tata letak desktop |
| `tests/bos.spec.mjs` | Bos, tabrakan, hitbox |
| `tests/audit.spec.mjs` | Keamanan, glitch, performa |
| `tests/zoom*.spec.mjs` | Zoom iOS (WebKit) |
| `tests/kontras.spec.mjs` | Kontras UI |
| `tests/equip.spec.mjs` | Peralatan |
| `tests/bos/`, `tests/ui/`, `tests/equipment/` | Skrip pengukuran yang menghasilkan data di `docs/` |
