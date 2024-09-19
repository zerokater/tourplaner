// src/lib/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBL1m7ZuKpme9GApslRPE-zGFZRUnDeXA",
  authDomain: "tourenplaner-53728.firebaseapp.com",
  projectId: "tourenplaner-53728",
  storageBucket: "tourenplaner-53728.appspot.com",
  messagingSenderId: "844233943014",
  appId: "1:844233943014:web:05713ed76dc5532cf51827",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
