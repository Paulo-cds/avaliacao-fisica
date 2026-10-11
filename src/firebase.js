// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFcM3YQNSJtxxpuv2TA2Ck1N2InMzydHc",
  authDomain: "avalicao-fisica-personal.firebaseapp.com",
  projectId: "avalicao-fisica-personal",
  storageBucket: "avalicao-fisica-personal.firebasestorage.app",
  messagingSenderId: "397029570237",
  appId: "1:397029570237:web:d3b6e70a8176c0844b29d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);