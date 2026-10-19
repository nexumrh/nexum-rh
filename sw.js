/* NEXUM RH — service worker
   Páginas: busca sempre a versão nova na internet; sem internet, abre a última salva.
   Reconhecimento facial (jsdelivr) e os arquivos do Firebase: baixa uma vez e guarda. Os dados do Firebase nunca passam pelo cache. */
const VERSAO = 'nexum-v5';
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
  /* Firebase (só os arquivos do programa, que têm a versão no endereço): guardados para o app abrir sem internet. Os dados nunca passam por aqui. */
  if (u.hostname === 'www.gstatic.com' && /^\/firebasejs\/[\d.]+\/firebase-[a-z-]+\.js$/.test(u.pathname)) {
    e.respondWith(caches.open(VERSAO + '-libs').then(async c => { const h = await c.match(r); if (h) return h; const n = await fetch(r); if (n.ok) c.put(r, n.clone()); return n; }));
    return;
  }
  if (u.origin !== location.origin) return;
  if (/\.(mp4|webm)$/.test(u.pathname)) return; /* videoaulas: o navegador busca em partes, não guarda no cache */
  if (r.mode === 'navigate' || r.destination === 'document') {
    e.respondWith(fetch(r).then(n => { const cp = n.clone(); caches.open(VERSAO).then(c => c.put(r, cp)); return n; }).catch(() => caches.match(r, { ignoreSearch: true }).then(h => h || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then(h => { const n = fetch(r).then(x => { if (x.ok) caches.open(VERSAO).then(c => c.put(r, x.clone())); return x; }).catch(() => h); return h || n; }));
});

/* Notificações no celular (Firebase Cloud Messaging): chegam com o app fechado; tocar abre o NEXUM no lugar certo */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { data: { titulo: 'NEXUM', corpo: e.data ? e.data.text() : '' } }; }
  const x = d.data || {}, n = d.notification || {}, url = x.url || (d.fcmOptions && d.fcmOptions.link) || './nexum_portal.html', tag = x.tag || '';
  e.waitUntil(self.registration.showNotification(x.titulo || n.title || 'NEXUM', { body: x.corpo || n.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url }, ...(tag ? { tag, renotify: true } : {}) }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const url = new URL((e.notification.data && e.notification.data.url) || './nexum_portal.html', self.registration.scope).href, portal = url.includes('nexum_portal');
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
    const c = l.find(x => x.url.includes('nexum_portal') === portal && x.url.startsWith(self.registration.scope));
    if (c) { c.focus(); return; } return clients.openWindow(url);
  }));
});
