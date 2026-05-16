importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyAgYfawjAPCQ37yrFffbFktIxXDNRkm5VQ",
  authDomain: "social-media-project-3b1ad.firebaseapp.com",
  projectId: "social-media-project-3b1ad",
  storageBucket: "social-media-project-3b1ad.firebasestorage.app",
  messagingSenderId: "332186685537",
  appId: "1:332186685537:web:acd28f180f8731e8a7da20",
  measurementId: "G-HCQYEH8CH8",
});

const messaging = firebase.messaging();

// ✅ Background Notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Background message:", payload);

  self.registration.showNotification(
    payload.data?.title || "New Notification",
    {
      body: payload.data?.body || "You have a message",
      // icon: "/firebase-logo.png",
    },
  );
});
