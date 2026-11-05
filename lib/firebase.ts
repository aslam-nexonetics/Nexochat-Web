import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";
import { apiClient } from "@/lib/api/client";

// Firebase Configuration matching Flutter DefaultFirebaseOptions
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBVm7x-PJs_V_hkT39dRpKRTOqjG4adbKQ",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:920842187301:web:721797ae09f0f928e045cc",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "920842187301",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "chatapp-fbb04",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "chatapp-fbb04.firebaseapp.com",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "chatapp-fbb04.appspot.com",
};

export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const app = getFirebaseApp();
    return getMessaging(app);
  } catch (err) {
    console.warn("Firebase Messaging initialization skipped or unsupported:", err);
    return null;
  }
}

/**
 * Register Service Worker for Firebase Messaging
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    console.warn("Failed to register firebase-messaging-sw.js:", err);
    return null;
  }
}

/**
 * Request notification permission and retrieve the FCM Web Token
 * @param vapidKey Optional VAPID public key from Firebase Console
 */
export async function requestFcmToken(vapidKey?: string): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted:", permission);
      return null;
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    const registration = await registerServiceWorker();

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration || undefined,
      vapidKey: vapidKey || process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      console.log("🔑 FCM Web Token retrieved:", token);
      // Automatically send to backend
      await sendFcmTokenToBackend(token);
      return token;
    }
    return null;
  } catch (err) {
    console.warn("Error getting FCM token:", err);
    return null;
  }
}

/**
 * Send FCM token to backend (matching Flutter FCMRepositoryImpl)
 */
export async function sendFcmTokenToBackend(token: string): Promise<boolean> {
  try {
    await apiClient.post("/fcm/fcm-token/", { fcm_token: token });
    console.log("✅ FCM token successfully sent to backend");
    return true;
  } catch (err) {
    console.warn("Failed to send FCM token to backend:", err);
    return false;
  }
}

/**
 * Delete FCM token from backend (matching Flutter logout flow)
 */
export async function deleteFcmTokenFromBackend(): Promise<boolean> {
  try {
    await apiClient.delete("/fcm/fcm-token/");
    console.log("✅ FCM token removed from backend");
    return true;
  } catch (err) {
    console.warn("Failed to delete FCM token from backend:", err);
    return false;
  }
}

/**
 * Subscribe to foreground FCM messages
 */
export function onFcmForegroundMessage(callback: (payload: any) => void): () => void {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("📩 Foreground FCM message received:", payload);
    callback(payload);
  });
}
