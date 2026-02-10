import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASTE YOUR CONFIG FROM FIREBASE CONSOLE HERE
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzYGP4ZgYfuR8qUt_DxvdoPWlGJn7t_mE",
  authDomain: "n-core-os.firebaseapp.com",
  projectId: "n-core-os",
  storageBucket: "n-core-os.firebasestorage.app",
  messagingSenderId: "41666035617",
  appId: "1:41666035617:web:e9e93399ca20027b3715e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exporting services for use in other components
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);