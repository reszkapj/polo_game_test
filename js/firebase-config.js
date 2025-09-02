// Firebase configuration
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
const app = firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.auth = firebase.auth();
window.functions = firebase.functions();
window.messaging = firebase.messaging();