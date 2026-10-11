/* NEXUM RH — service worker
   Páginas: busca sempre a versão nova na internet; sem internet, abre a última salva.
   Reconhecimento facial (jsdelivr): baixa uma vez e guarda. Firebase nunca passa pelo cache. */
const VERSAO = 'nexum-v2';
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

/* Notificações no celular (Firebase Cloud Messaging): mostra o aviso e abre o portal ao tocar */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { notification: { title: 'NEXUM', body: e.data ? e.data.text() : '' } }; }
  const n = d.notification || {}, url = (d.data && d.data.url) || (d.fcmOptions && d.fcmOptions.link) || './nexum_portal.html';
  e.waitUntil(self.registration.showNotification(n.title || 'NEXUM', { body: n.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || './nexum_portal.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => { const c = l.find(x => x.url.includes('nexum_portal')); if (c) { c.focus(); return c.navigate ? c.navigate(url).catch(() => { }) : null; } return clients.openWindow(url); }));
});
