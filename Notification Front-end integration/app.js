import { messaging } from "./firebase.js";

const VAPID_KEY =
  "BNN8_SEyedqs9-fcIH4qA5PUPx0aUbNj8zUv0-DZvaIOjVh9BbHU2M37SzuhyQQ1JXPCO5gMufudlE4knMUKLt0";
const BACKEND_URL = "http://localhost:3000/send-notification";

let serviceWorkerRegistration = null;

// ✅ Register Service Worker
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    serviceWorkerRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    console.log("✅ Service Worker registered");
  }
}
registerServiceWorker();

// ✅ Get Token
async function getFcmToken() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Permission denied");
      return;
    }

    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    });

    console.log("🔥 TOKEN:", token);

    $("#tokenBox").val(token);
    $("#status").html(`<span class="text-success">Token generated</span>`);
  } catch (err) {
    console.error(err);
  }
}

$("#getTokenBtn").click(getFcmToken);

// ✅ Foreground Notifications (IMPORTANT)
messaging.onMessage((payload) => {
  console.log("📩 Foreground message:", payload);

  if (Notification.permission === "granted") {
    new Notification(payload.data?.title || "New Notification", {
      body: payload.data?.body || "You have a message",
      // icon: "/firebase-logo.png",
    });
  }
});

// ✅ Send Notification
$("#sendTestBtn").click(() => {
  const token = $("#tokenBox").val();

  if (!token) return alert("Token is empty!");

  $.ajax({
    url: BACKEND_URL,
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify({ token }),
    success: () => {
      $("#status").html(`<span class="text-success">Notification sent</span>`);
    },
    error: () => {
      $("#status").html(`<span class="text-danger">Failed</span>`);
    },
  });
});
