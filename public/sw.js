self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
  if(event.data?.type==='stop_reminders')event.waitUntil(self.registration.getNotifications({tag:'agualim-reminder'}).then(notifications=>notifications.forEach(notification=>notification.close())));
});
self.addEventListener('push',event=>{
  let payload={title:'Wai te recuerda',body:'Es hora de tomar un sorbito de agua 💧',url:'/'};
  try{if(event.data)payload={...payload,...event.data.json()}}catch{}
  event.waitUntil(self.registration.showNotification(payload.title,{body:payload.body,icon:'/wai-app-icon-192.png',badge:'/wai-app-icon-192.png',tag:'agualim-reminder',renotify:true,requireInteraction:true,data:{url:payload.url||'/'},vibrate:[250,100,250],actions:[{action:'open',title:'Registrar agua'}]}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  if(event.action==='pause')return;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
    const client=clients[0];
    if(client)return client.focus();
    return self.clients.openWindow('/');
  }));
});
