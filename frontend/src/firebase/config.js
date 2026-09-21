// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyDaLxBPZedVE2DuklKpv69wOVartJMG_Dg",
  authDomain: "mlp-kids-studio-5c728.firebaseapp.com",
  projectId: "mlp-kids-studio-5c728",
  storageBucket: "mlp-kids-studio-5c728.firebasestorage.app",
  messagingSenderId: "601838623184",
  appId: "1:601838623184:web:25b599a4d9620b22ea41d5",
  measurementId: "G-6ZD73ZKE1T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore database
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Initialize Analytics conditionally (safely handles environments where IndexedDB/cookies are restricted)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics optional fallback
  });
}

export default app;
