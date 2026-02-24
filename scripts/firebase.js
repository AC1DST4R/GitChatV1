import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCXi-M0wMZT165T9FHCK8Dw-WJK_I1MuDg",
  authDomain: "gitchat-backend.firebaseapp.com",
  projectId: "gitchat-backend",
  storageBucket: "gitchat-backend.appspot.com",
  messagingSenderId: "385257284178",
  appId: "1:385257284178:web:20d7ce32ba1b1ed554f58b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Sign in anonymously
signInAnonymously(auth).then(() => console.log("Signed in anonymously ✅"));
