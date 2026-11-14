// Service worker RAPTOR13 (C9). Versi cache terikat GAME_VERSION lewat parameter ?v= saat didaftarkan.
// - index.html dan navigasi: network-first (versi terbaru selalu dicoba dulu, cadangan dari cache saat luring)
// - ikon, manifest, dan pustaka vendor: cache-first (berkas berversi atau jarang berubah)
// - cache versi lama dihapus saat aktif; versi baru menunggu sampai pemain menekan Muat ulang
const VERSION = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = 'raptor13-' + VERSION;
const V = './vendor/three-0.187.0/';
const CORE = [
  './', './index.html', './manifest.webmanifest',
  './icons/favicon.svg', './icons/favicon.ico', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-192.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  V + 'build/three.module.js', V + 'build/three.core.js',
  V + 'examples/jsm/postprocessing/EffectComposer.js', V + 'examples/jsm/postprocessing/RenderPass.js',
  V + 'examples/jsm/postprocessing/UnrealBloomPass.js', V + 'examples/jsm/postprocessing/OutputPass.js',
  V + 'examples/jsm/postprocessing/ShaderPass.js', V + 'examples/jsm/postprocessing/MaskPass.js',
  V + 'examples/jsm/postprocessing/Pass.js', V + 'examples/jsm/shaders/CopyShader.js',
  V + 'examples/jsm/shaders/LuminosityHighPassShader.js', V + 'examples/jsm/shaders/OutputShader.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('raptor13-') ? k !== CACHE : false) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Halaman meminta versi baru aktif (tombol Muat ulang pada toast Versi baru tersedia)
self.addEventListener('message', (e) => { if (e.data === 'aktifkan') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate' ? true : url.pathname.endsWith('/index.html');
  if (isPage) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-cache' });
        if (fresh.ok) { const c = await caches.open(CACHE); await c.put('./index.html', fresh.clone()); }
        return fresh;
      } catch (err) {
        const hit = await caches.match('./index.html');
        return hit || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok ? (url.pathname.includes('/icons/') ? true : url.pathname.includes('/vendor/')) : false) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
    return res;
  })());
});
