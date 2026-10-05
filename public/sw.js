/*
 * 7FX service worker — v2
 *
 * v1 served "/", "/login" and "/trade" cache-first forever. After every deploy the
 * cached HTML pointed at /_next/static/* chunk hashes that no longer exist (404
 * text/html + nosniff), so Safari rendered the page without any CSS/JS.
 *
 * v2 never caches or intercepts HTML/navigation or /_next/* — those always go to
 * the network (HTML is no-store, /_next/static is immutable+hashed). Only a few
 * static icons are cached for installability. On upgrade it deletes old caches
 * and reloads open tabs that were showing stale v1 HTML.
 */
const VERSION = "2026-10-05-v2";
const CACHE = `7fx-static-${VERSION}`;
const PRECACHE = [
  "/site.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const stale = keys.filter((k) => k !== CACHE);
      await Promise.all(stale.map((k) => caches.delete(k)));
      await self.clients.claim();
      // Upgrading from an older SW: open tabs may be rendering stale cached HTML
      // whose CSS/JS chunks are gone. Reload them once from the network.
      if (stale.length > 0) {
        const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        await Promise.all(
          wins.map((w) => {
            try {
              return w.navigate(w.url).catch(() => undefined);
            } catch (e) {
              return undefined;
            }
          })
        );
      }
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never touch documents, Next.js assets/data or API calls: network only.
  if (req.mode === "navigate" || req.destination === "document") return;
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) return;
  if (!PRECACHE.includes(url.pathname)) return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
