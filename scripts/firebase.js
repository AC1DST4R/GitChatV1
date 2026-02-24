// scripts/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCXi-M0wMZT165T9FHCK8Dw-WJK_I1MuDg",
  authDomain: "gitchat-backend.firebaseapp.com",
  projectId: "gitchat-backend",
  storageBucket: "gitchat-backend.firebasestorage.app",
  messagingSenderId: "385257284178",
  appId: "1:385257284178:web:20d7ce32ba1b1ed554f58b"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Auto anonymous login
signInAnonymously(auth)
  .then(() => console.log("Anonymous login ✅"))
  .catch(err => console.error("Anonymous login failed:", err));
