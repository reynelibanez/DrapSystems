
// Service Worker para DRAP Appointment PWA
const CACHE_NAME = 'drap-v1.0.2';
const DEBUG = true;

// Detectar si estamos en producción (con base path)
const BASE_PATH = self.location.pathname.includes('/booking-suite') ? '/booking-suite' : '';

function log(...args) {
  if (DEBUG) {
    console.log('[SW]', ...args);
  }
}

log('📄 Service Worker script loaded and parsed');
log('Base path:', BASE_PATH);
log('Location:', self.location.href);

// Instalación
self.addEventListener('install', (event) => {
  log('⚙️ INSTALL event fired');
  
  event.waitUntil(
    (async () => {
      try {
        log('Installing...');
        
        // Forzar activación inmediata
        await self.skipWaiting();
        
        log('✅ Installation complete, skipWaiting called');
      } catch (error) {
        log('❌ Installation error:', error);
        throw error;
      }
    })()
  );
});

// Activación
self.addEventListener('activate', (event) => {
  log('🔄 ACTIVATE event fired');
  
  event.waitUntil(
    (async () => {
      try {
        log('Activating...');
        
        // Limpiar cachés antiguos
        const cacheNames = await caches.keys();
        log('Current caches:', cacheNames);
        
        await Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              log('Deleting old cache:', name);
              return caches.delete(name);
            })
        );
        
        // Tomar control de todas las páginas
        await self.clients.claim();
        
        log('✅ Activation complete, clients claimed');
      } catch (error) {
        log('❌ Activation error:', error);
        throw error;
      }
    })()
  );
});

// Fetch - estrategia: Network First, fallback a Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Solo manejar peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar peticiones a dominios externos
  if (url.origin !== self.location.origin) {
    return;
  }

  // Ignorar peticiones a la API
  if (url.pathname.startsWith(BASE_PATH + '/api/') || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Intentar obtener de la red primero
        const networkResponse = await fetch(request);
        
        // Si la respuesta es exitosa, guardarla en caché
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Si falla la red, intentar obtener del caché
        log('Network failed, trying cache for:', url.pathname);
        
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          log('✅ Serving from cache:', url.pathname);
          return cachedResponse;
        }
        
        // Si no hay caché, devolver página offline básica
        log('❌ No cache available for:', url.pathname);
        
        return new Response(
          `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sin conexión</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
                text-align: center;
                padding: 1rem;
              }
              .container {
                max-width: 400px;
              }
              h1 { color: #333; }
              p { color: #666; }
              button {
                margin-top: 1rem;
                padding: 0.75rem 1.5rem;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
              }
              button:hover { background: #0056b3; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>📡 Sin conexión</h1>
              <p>No hay conexión a internet y esta página no está disponible sin conexión.</p>
              <button onclick="location.reload()">Reintentar</button>
            </div>
          </body>
          </html>
          `,
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
              'Content-Type': 'text/html; charset=utf-8'
            }
          }
        );
      }
    })()
  );
});

// Mensajes desde la aplicación
self.addEventListener('message', (event) => {
  log('📨 Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    log('Skipping waiting...');
    self.skipWaiting();
  }
});

log('✅ All event listeners registered');

// ============================================
// NOTIFICACIONES PUSH
// ============================================

// Manejar evento de notificación push
self.addEventListener('push', (event) => {
  log('📬 Push notification received');
  
  let data = {
    title: 'DRAP Appointment',
    body: 'Nueva notificación',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'drap-notification',
  };

  // Intentar parsear los datos del push
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
      log('Push data:', data);
    } catch (error) {
      log('Error parsing push data:', error);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'drap-notification',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || [200, 100, 200],
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejar click en la notificación
self.addEventListener('notificationclick', (event) => {
  log('🖱️ Notification clicked:', event.notification.tag);
  
  event.notification.close();

  // Obtener la URL de destino
  const urlToOpen = event.notification.data?.url || BASE_PATH + '/dashboard';
  
  event.waitUntil(
    (async () => {
      try {
        // Buscar si ya hay una ventana abierta
        const clientList = await clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });

        // Si hay una ventana abierta, enfocarla y navegar
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            await client.focus();
            if (client.navigate) {
              await client.navigate(urlToOpen);
            }
            return;
          }
        }

        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          await clients.openWindow(urlToOpen);
        }
      } catch (error) {
        log('Error handling notification click:', error);
      }
    })()
  );
});

// Manejar cierre de la notificación
self.addEventListener('notificationclose', (event) => {
  log('🔕 Notification closed:', event.notification.tag);
  
  // Aquí podrías enviar analytics o realizar otras acciones
  // cuando el usuario cierra la notificación sin hacer click
});

log('✅ Push notification handlers registered');

