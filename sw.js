/* WorkTime Pro service worker + Firebase Cloud Messaging
   Project: worktimepro-d4f8c
   IMPORTANT: keep this exact file name as /sw.js beside index.html.
*/

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
const CACHE_NAME="worktimepro-v8";

self.addEventListener("install",event=>{
  // Do NOT cache a fixed app-shell here. A missing icon/manifest must never make
  // the service worker installation fail, because FCM depends on an active SW.
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  if(event.request.mode!=="navigate")return;

  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request,{cache:"no-store"});
      const cache=await caches.open(CACHE_NAME);
      cache.put(event.request,response.clone()).catch(()=>{});
      return response;
    }catch(_e){
      return (await caches.match(event.request)) || (await caches.match("./index.html")) || Response.error();
    }
  })());
});

messaging.onBackgroundMessage(payload=>{
  const data=payload.data||{};
  const title=data.title||"WorkTime Pro";
  const body=data.body||"You have a task.";
  const taskId=data.taskId||"task";
  const cycleKey=data.cycleKey||"now";
  const targetUrl=new URL(data.url||"./#tasks",self.registration.scope).href;

  return self.registration.showNotification(title,{
    body,
    icon:"./icon-192.png",
    badge:"./icon-192.png",
    tag:`worktime-task-${taskId}-${cycleKey}`,
    renotify:true,
    requireInteraction:true,
    vibrate:[900,250,900,250,900,250,1500,400,1500],
    actions:[{action:"open",title:"Open WorkTime Pro"}],
    data:{url:targetUrl,taskId,cycleKey}
  });
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=(event.notification.data&&event.notification.data.url) || self.registration.scope;

  event.waitUntil((async()=>{
    const list=await clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of list){
      try{
        if("navigate" in client)await client.navigate(target);
      }catch(_e){}
      if("focus" in client)return client.focus();
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
