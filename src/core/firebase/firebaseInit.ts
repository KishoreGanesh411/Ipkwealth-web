import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDSh9ccZviLr1VIfhVD261jyK9_0si0f4g",
  authDomain: "ipkwealth-crm.firebaseapp.com",
  projectId: "ipkwealth-crm",
  storageBucket: "ipkwealth-crm.firebasestorage.app",
  messagingSenderId: "865119744232",
  appId: "1:865119744232:web:866da3f3b582b4f49a595d",
  measurementId: "G-NES6XWW4YC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);