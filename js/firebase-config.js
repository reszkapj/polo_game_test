// Firebase configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDf5K0C7ipmKGKXRsw8KzgP22ZGVQ14Bag",
  authDomain: "polo-game-tracker.firebaseapp.com",
  projectId: "polo-game-tracker",
  storageBucket: "polo-game-tracker.firebasestorage.app",
  messagingSenderId: "573484036840",
  appId: "1:573484036840:web:6c20fc034513756ee74f5d",
  measurementId: "G-51QRWRCR4V"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const messaging = getMessaging(app);
