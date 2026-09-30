/* NEXUM RH — service worker
   Páginas: busca sempre a versão nova na internet; sem internet, abre a última salva.
   Reconhecimento facial (jsdelivr): baixa uma vez e guarda. Firebase nunca passa pelo cache. */
const VERSAO = 'nexum-v1';
const BASE = ['./', './index.html', './nexum_portal.html', './manifest-rh.webmanifest', './manifest-portal.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSAO).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname === 'cdn.jsdelivr.net' && /face-api|xlsx/.test(u.pathname)) {
    e.respondWith(caches.open(VERSAO + '-libs').then(async c => { const h = await c.match(r); if (h) return h; const n = await fetch(r); if (n.ok) c.put(r, n.clone()); return n; }));
    return;
  }
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate' || r.destination === 'document') {
    e.respondWith(fetch(r).then(n => { const cp = n.clone(); caches.open(VERSAO).then(c => c.put(r, cp)); return n; }).catch(() => caches.match(r, { ignoreSearch: true }).then(h => h || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then(h => { const n = fetch(r).then(x => { if (x.ok) caches.open(VERSAO).then(c => c.put(r, x.clone())); return x; }).catch(() => h); return h || n; }));
});
