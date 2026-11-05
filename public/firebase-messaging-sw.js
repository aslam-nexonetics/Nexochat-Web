// public/firebase-messaging-sw.js
// Firebase Messaging Service Worker for Nexo Chat & Workspace Web
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBVm7x-PJs_V_hkT39dRpKRTOqjG4adbKQ",
  appId: "1:920842187301:web:721797ae09f0f928e045cc",
  messagingSenderId: "920842187301",
  projectId: "chatapp-fbb04",
  authDomain: "chatapp-fbb04.firebaseapp.com",
  storageBucket: "chatapp-fbb04.appspot.com",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);

  const title =
    payload.notification?.title ||
    payload.data?.title ||
    payload.data?.sender_name ||
    'New Message';

  const body =
    payload.notification?.body ||
    payload.data?.body ||
    payload.data?.message_text ||
    payload.data?.message ||
    'You have a new update in your workspace.';

  const notificationOptions = {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.chat_id || payload.data?.channel_id || 'nexo-chat',
    data: payload.data || {},
  };

  self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const collectionName = data.collection_name?.toLowerCase() || 'gig';
  const targetUrl = data.url || (data.chat_id ? `/workspace/${collectionName}/chat` : `/workspace/${collectionName}`);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
