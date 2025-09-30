// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDe-YCvOYUThCmzWLzJD1rKGKAwRfkw4pw",
  authDomain: "fable-5e142.firebaseapp.com",
  projectId: "fable-5e142",
  storageBucket: "fable-5e142.firebasestorage.app",
  messagingSenderId: "1097846552031",
  appId: "1:1097846552031:web:1613514e0d41a99d05c06a",
  measurementId: "G-8VE8WMQPR0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;