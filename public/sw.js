// Self-unregistering SW — clears all caches and removes itself
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => clients.claim())
  )
})
// No fetch handler — fall through to browser
