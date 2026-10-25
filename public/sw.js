/*
 * 7FX service worker — v5 (network HTML and Next chunks; push stays)
 *
 * v1 served "/", "/login" and "/trade" cache-first forever. After every deploy the
 * cached HTML pointed at /_next/static/* chunk hashes that no longer exist (404
 * text/html + nosniff), so Safari rendered the page without any CSS/JS.
 *
 * v2–v4 never wrote HTML or /_next into the Cache API. v5 bumps the cache name so
 * any worker still on v1–v4 activates, deletes those caches, and reloads open tabs.
 * Navigations are fetched with cache: "no-store". /_next and /api are not intercepted
 * and are never stored. Only the offline page and a few icons stay in this cache.
 */
const VERSION = "2026-10-25-v5-network";
const CACHE = `7fx-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/site.webmanifest",
  "/icons/v3/icon-192.png",
  "/icons/v3/icon-512.png",
  "/icons/v3/icon-maskable-192.png",
  "/icons/v3/icon-maskable-512.png",
  "/icons/v3/apple-touch-icon.png",
  "/icons/v3/favicon.ico",
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

async function reloadStaleWindows() {
  const wins = await self.clients.matchAll({ type: "window" });
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

self.addEventListener("activate", (event) => {
  let upgraded = false;
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const stale = keys.filter((k) => k !== CACHE);
      upgraded = stale.length > 0;
      await Promise.all(stale.map((k) => caches.delete(k)));
      const current = await caches.open(CACHE);
      const kept = await current.keys();
      await Promise.all(
        kept.map((request) => {
          const path = new URL(request.url).pathname;
          const htmlNav = request.mode === "navigate" || path === "/" || (path.endsWith(".html") && path !== "/offline.html");
          if (htmlNav || path.startsWith("/_next/")) {
            return current.delete(request);
          }
          return undefined;
        })
      );
      await self.clients.claim();
    })().then(() => {
      // Upgrading from an older SW: open tabs may be rendering stale cached HTML
      // whose CSS/JS chunks are gone. Reload them once from the network.
      // Must run AFTER activation finishes (navigations wait for an activating SW).
      if (upgraded) setTimeout(() => { reloadStaleWindows().catch(() => undefined); }, 50);
    })
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
  // Documents stay network-only. A failed navigation (offline) falls back to the
  // precached offline page. Successful HTML is never written into the cache.
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(url.href, { cache: "no-store", credentials: "same-origin", redirect: "follow" }).catch(async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(OFFLINE_URL);
        return cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      })
    );
    return;
  }
  // Never respond from, or write, a Next chunk or API response. The browser fetches them.
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) return;
  if (!PRECACHE.includes(url.pathname)) return;
  event.respondWith(
    caches.open(CACHE).then((cache) => cache.match(req).then((cached) => cached || fetch(req)))
  );
});

/* ——— Web Push (live support notifications) ——— */
self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data && event.data.text() }; }
  const title = d.title || "7FX";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || "",
      icon: "/icons/v3/icon-192.png",
      badge: "/icons/v3/icon-192.png",
      data: { href: d.href || "/" },
      tag: d.href || "7fx",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/";
  const url = new URL(href, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of wins) {
        if (new URL(w.url).origin === self.location.origin) {
          await w.focus();
          return w.navigate(url).catch(() => self.clients.openWindow(url));
        }
      }
      return self.clients.openWindow(url);
    })()
  );
});
