const firebaseConfig = {
  apiKey: "AIzaSyAgYfawjAPCQ37yrFffbFktIxXDNRkm5VQ",
  authDomain: "social-media-project-3b1ad.firebaseapp.com",
  projectId: "social-media-project-3b1ad",
  storageBucket: "social-media-project-3b1ad.firebasestorage.app",
  messagingSenderId: "332186685537",
  appId: "1:332186685537:web:acd28f180f8731e8a7da20",
  measurementId: "G-HCQYEH8CH8",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

export { messaging };
