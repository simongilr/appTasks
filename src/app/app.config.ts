import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 🔥 Copia tu configuración de Firebase aquí
const firebaseConfig = {
  apiKey: "AIzaSyA-D-k-RL5NKyELT9hRUXqZq2pppqEMfGU",
  authDomain: "apptasks-bad7e.firebaseapp.com",
  projectId: "apptasks-bad7e",
  storageBucket: "apptasks-bad7e.firebasestorage.app",
  messagingSenderId: "1012691873666",
  appId: "1:1012691873666:web:06d702d60224e9009ca99b",
  measurementId: "G-5XG44943TY"
};

// Inicializar app
export const app = initializeApp(firebaseConfig);

// Exportar Firestore
export const db = getFirestore(app);
