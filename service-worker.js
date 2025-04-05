const CACHE_NAME = "clean-notes-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/site.webmanifest",
  "/icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  // Estrategia "Stale While Revalidate"
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Incluso si hay una respuesta en caché, actualiza el caché desde la red
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Si la respuesta es válida, guárdala en caché
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si hay un error en la red (offline), no hacemos nada especial
          // y dejamos que el código de abajo devuelva la respuesta en caché
        });

      // Devuelve la respuesta en caché o espera la respuesta de la red
      return cachedResponse || fetchPromise;
    })
  );
});

// Activación y limpieza de cachés antiguas
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manejo de sincronización en segundo plano para guardar notas cuando estás offline
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notes") {
    event.waitUntil(syncNotes());
  }
});

// Función para sincronizar notas pendientes
function syncNotes() {
  // Aquí iría el código para sincronizar las notas pendientes
  // cuando la conexión se restablezca
  return Promise.resolve();
}
