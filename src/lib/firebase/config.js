// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCNM62nWGGabDasEqs-8MEW9r--g0uJg_U",
  authDomain: "bid-257a8.firebaseapp.com",
  projectId: "bid-257a8",
  storageBucket: "bid-257a8.firebasestorage.app",
  messagingSenderId: "242705778832",
  appId: "1:242705778832:web:b1ab789600d65b8c4cf015",
  measurementId: "G-R53Q7EMP0V"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
