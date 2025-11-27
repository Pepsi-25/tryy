// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // IMPORTANT: Replace these placeholder values with your actual Firebase project settings
  apiKey: "AIzaSyAn25xKxFKTDVsLqm0PesHDRLIWTj3vh3I",
  authDomain: "tryy-5ea43.firebaseapp.com",
  databaseURL: "https://tryy-5ea43-default-rtdb.firebaseio.com",
  projectId: "tryy-5ea43",
  storageBucket: "tryy-5ea43.firebasestorage.app",
  messagingSenderId: "259503180304",
  appId: "1:259503180304:web:c0066e0b3c041efa439895"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

