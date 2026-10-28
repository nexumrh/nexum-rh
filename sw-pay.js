/* NEXUM PAY: app instalável e avisos no celular (Firebase Cloud Messaging) */
const VERSAO = 'nexum-pay-v1';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || !(r.mode === 'navigate' || r.destination === 'document')) return;
  e.respondWith((async () => { const c = await caches.open(VERSAO); try { const n = await fetch(r, { cache: 'no-store' }); if (n.ok) c.put(r, n.clone()); return n; } catch (er) { return (await c.match(r, { ignoreSearch: true })) || Response.error(); } })());
});
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (er) { d = { data: { titulo: 'NEXUM PAY', corpo: e.data ? e.data.text() : '' } }; }
  const x = d.data || {}, n = d.notification || {};
  e.waitUntil(self.registration.showNotification(x.titulo || n.title || 'NEXUM PAY', { body: x.corpo || n.body || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: x.url || './' }, tag: x.tag || 'nexum-pay', renotify: true }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => { const c = l.find(x => x.url.startsWith(self.registration.scope)); if (c) { c.focus(); return; } return clients.openWindow(url); }));
});
