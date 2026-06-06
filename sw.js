// v5 - GitHub Pages compatible
const CACHE = 'recomp-v5';
const BASE = '/recomp-me';
const ASSETS = [BASE+'/', BASE+'/index.html', BASE+'/gym.html', BASE+'/manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('api.anthropic.com') ||
      e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com')) return;
  e.respondWith(fetch(e.request).catch(() => new Response('Offline')));
});
