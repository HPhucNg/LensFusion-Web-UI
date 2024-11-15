// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.local.FIREBASE_API_KEY,
  authDomain: "lensfusion-2716b.firebaseapp.com",
  projectId: "lensfusion-2716b",
  storageBucket: "lensfusion-2716b.firebasestorage.app",
  messagingSenderId: "1034966194013",
  appId: "1:1034966194013:web:07f706ee1b4e8ef471bab4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default{
    app
} 