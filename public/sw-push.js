// Push notification handler for the Service Worker
// This file is imported by the auto-generated SW via importScripts

// Notification type configs
const NOTIFICATION_TYPES = {
  med_reminder: {
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: 'med_reminder',
    url: '/?mod=saude',
    vibrate: [200, 100, 200],
  },
  mood_checkin: {
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: 'mood_checkin',
    url: '/?mod=saude',
    vibrate: [100, 50, 100],
  },
  crisis_alert: {
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: 'crisis_alert',
    url: '/',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
  },
};

self.addEventListener('push', (event) => {
  let data = { title: 'AntiBipolaridade', body: 'Nova notificacao' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const type = data.type || 'default';
  const typeConfig = NOTIFICATION_TYPES[type] || {};

  const options = {
    body: data.body || '',
    icon: data.icon || typeConfig.icon || '/pwa-192.png',
    badge: data.badge || typeConfig.badge || '/pwa-192.png',
    tag: data.tag || typeConfig.tag || 'default',
    data: { url: data.url || typeConfig.url || '/', type },
    vibrate: data.vibrate || typeConfig.vibrate || [200, 100, 200],
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || typeConfig.requireInteraction || false,
    silent: data.silent || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AntiBipolaridade', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  const type = notifData.type || 'default';

  // Determine target URL based on type or action clicked
  let targetUrl = notifData.url || '/';

  if (event.action) {
    switch (event.action) {
      case 'take_med':
        targetUrl = '/?mod=saude';
        break;
      case 'checkin':
        targetUrl = '/?mod=saude';
        break;
      case 'dismiss':
        return; // Just close
      default:
        break;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
          return client;
        }
      }
      // No existing window — open a new one
      return clients.openWindow(targetUrl);
    })
  );
});
