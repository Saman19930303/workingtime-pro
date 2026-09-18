const CACHE_NAME = "worktimepro-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("gstatic") ||
    url.hostname.includes("jsdelivr")
  ) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, {cache:"no-store"})
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request, {cache:"no-store"}).catch(() => caches.match(event.request))
  );
});


// Firebase Cloud Messaging background notifications
importScripts("https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey:"AIzaSyBcZ7j9pQpdjVkUAh2wGTISd3z0tPN-o-o",
  authDomain:"worktimepro-d4f8c.firebaseapp.com",
  projectId:"worktimepro-d4f8c",
  storageBucket:"worktimepro-d4f8c.firebasestorage.app",
  messagingSenderId:"677592470967",
  appId:"1:677592470967:web:e49b84f3b5b0a059598432"
});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const n=payload.notification||{};
  self.registration.showNotification(n.title||"WorkTime Pro",{
    body:n.body||"You have a new task.",
    icon:"./icon-192.png",
    badge:"./icon-192.png",
    data:payload.data||{}
  });
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const c of list){if("focus" in c)return c.focus();}
    if(clients.openWindow)return clients.openWindow("./");
  }));
});


// ===== Firebase Cloud Messaging background push =====
importScripts("https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey:"AIzaSyBcZ7j9pQpdjVkUAh2wGTISd3z0tPN-o-o",
  authDomain:"worktimepro-d4f8c.firebaseapp.com",
  projectId:"worktimepro-d4f8c",
  storageBucket:"worktimepro-d4f8c.firebasestorage.app",
  messagingSenderId:"677592470967",
  appId:"1:677592470967:web:e49b84f3b5b0a059598432"
});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const d=payload.data||{};
  self.registration.showNotification(d.title||"WorkTime Pro",{body:d.body||"You have a task.",icon:"./icon-192.png",badge:"./icon-192.png",tag:d.taskId||"worktime-task",data:{url:d.url||"./"}});
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();const url=event.notification.data?.url||"./";
  event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{for(const c of list){if("focus" in c){c.navigate(url);return c.focus()}}return clients.openWindow(url)}));
});
