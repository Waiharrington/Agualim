self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
  if(event.data?.type==='stop_reminders')event.waitUntil(self.registration.getNotifications({tag:'agualim-reminder'}).then(notifications=>notifications.forEach(notification=>notification.close())));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
    const client=clients[0];
    if(client)return client.focus();
    return self.clients.openWindow('/');
  }));
});
