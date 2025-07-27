import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Tu configuración de Firebase (obtenerla desde Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDNMdSNB-Ipa5yZC2MBiMQMhJRJXD5-tco",
  authDomain: "fido-37f41.firebaseapp.com",
  projectId: "fido-37f41",
  storageBucket: "fido-37f41.firebasestorage.app",
  messagingSenderId: "237495518878",
  appId: "1:237495518878:web:7c6b758e4aa3e1f6cf1d8f",
  measurementId: "G-5F8GXR8404"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firebase Auth y Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;