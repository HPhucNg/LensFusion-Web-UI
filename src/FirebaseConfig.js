// FirebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCnb4MoAw9uDGWd_IqJhp9KHsYreKv3DMA",
  authDomain: "lensfusion-2716b.firebaseapp.com",
  projectId: "lensfusion-2716b",
  storageBucket: "lensfusion-2716b.appspot.com",
  messagingSenderId: "1034966194013",
  appId: "1:1034966194013:web:07f706ee1b4e8ef471bab4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Initialize Firestore Database

export { db }; 
