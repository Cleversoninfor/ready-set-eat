// Service Worker for push notifications on locked screen

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const tag = event.notification.tag || '';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Determine target based on notification tag
      const isDriver = tag.startsWith('driver-');
      const targetPath = isDriver ? '/driver/dashboard' : '/admin/orders';
      const searchPath = isDriver ? '/driver' : '/admin';

      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(searchPath) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window if none found
      if (clients.openWindow) {
        return clients.openWindow(targetPath);
      }
    })
  );
});

// Keep service worker alive for notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
