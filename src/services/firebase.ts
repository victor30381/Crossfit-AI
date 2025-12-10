import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB7q70QgLNxV7axxqmtfSRL2fdb2COhKd4",
    authDomain: "crossfit-ai.firebaseapp.com",
    projectId: "crossfit-ai",
    storageBucket: "crossfit-ai.firebasestorage.app",
    messagingSenderId: "148121694956",
    appId: "1:148121694956:web:e68d0871f5a38f3fad2bc9",
    measurementId: "G-ZW9CW0FRX9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
