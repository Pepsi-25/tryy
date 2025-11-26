// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// 🚨🚨🚨 هام جداً: استبدل هذه القيم بقيم مشروعك الفعلية من Firebase Console 🚨🚨🚨
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR-PROJECT-ID.firebaseapp.com",
  databaseURL: "https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT-ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); 

console.log('Firebase initialized. Using Realtime Database for state synchronization.');