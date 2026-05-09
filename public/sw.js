// Service Worker for Push Notifications

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();
    const title = data.title || 'New Notification';
    const options = {
        body: data.body || '',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If a window is already open, focus it
            if (windowClients.length > 0) {
                const client = windowClients[0];
                if (event.notification.data.url) {
                    client.navigate(event.notification.data.url);
                }
                return client.focus();
            }
            // If no window is open, open a new one
            return clients.openWindow(event.notification.data.url || '/');
        })
    );
});
