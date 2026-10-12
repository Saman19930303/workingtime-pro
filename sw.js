/* WorkTime Pro service worker + Firebase Cloud Messaging
   Firebase project: worktimepro-d4f8c
   Save this file as: sw.js (repository root, beside index.html)
*/

importScripts("https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBcZ7j9pQpdjVkUAh2wGTISd3z0tPN-o-o",
  authDomain: "worktimepro-d4f8c.firebaseapp.com",
  projectId: "worktimepro-d4f8c",
  storageBucket: "worktimepro-d4f8c.firebasestorage.app",
  messagingSenderId: "677592470967",
  appId: "1:677592470967:web:e49b84f3b5b0a059598432"
});

const messaging = firebase.messaging();

/* Increase this version whenever the app shell/service worker is changed. */
const CACHE_NAME = "worktimepro-v9";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache app shell when available; don't prevent SW installation if an icon
    // or manifest is temporarily unavailable.
    await Promise.all(APP_SHELL.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) await cache.put(url, response);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith("worktimepro-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

/* Network-first for app navigation so installed users get the latest index.html
   whenever they open the app online; use cache only when offline. */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("gstatic") ||
    url.hostname.includes("jsdelivr")
  ) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: "no-store" });
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("./index.html", response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match("./index.html")) ||
          (await caches.match("./")) ||
          Response.error();
      }
    })());
    return;
  }

  // Do not let a stale cache prevent updated JS/CSS/assets from loading.
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request, { cache: "no-store" });
      if (response && response.ok && url.origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (_) {
      return (await caches.match(event.request)) || Response.error();
    }
  })());
});

/* Background Firebase Cloud Messaging. The sender should send data fields:
   title, body, taskId, cycleKey, url. */
messaging.onBackgroundMessage(async (payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};

  const title = data.title || notification.title || "🔔 WorkTime Pro Task";
  const body = data.body || notification.body || "You have a new task.";
  const taskId = data.taskId || "task";
  const cycleKey = data.cycleKey || "now";
  const targetUrl = new URL(data.url || "./#tasks", self.registration.scope).href;

  // If FCM sent a notification payload, the browser may display it automatically.
  // This handler is intended for data-only messages to avoid duplicate notifications.
  if (payload.notification) return;

  await self.registration.showNotification(title, {
    body,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: `worktime-task-${taskId}-${cycleKey}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [900, 250, 900, 250, 900, 250, 1500, 400, 1500],
    actions: [{ action: "open", title: "Open WorkTime Pro" }],
    data: {
      url: targetUrl,
      taskId,
      cycleKey
    }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || self.registration.scope;

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (const client of windowClients) {
      if ("focus" in client) {
        if ("navigate" in client && client.url !== targetUrl) {
          try { await client.navigate(targetUrl); } catch (_) {}
        }
        return client.focus();
      }
    }

    if (clients.openWindow) return clients.openWindow(targetUrl);
  })());
});
