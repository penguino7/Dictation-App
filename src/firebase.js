import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Thêm dòng này

// Cậu vào lại console.firebase.google.com để lấy cái config dán vào đây nhé
// (Cái đoạn apiKey, authDomain... hôm qua cậu lấy ấy)
const firebaseConfig = {
  apiKey: "AIzaSyC6EvMxvLAYK8Fnrre9AlSE1kALEnpOHE0",
  authDomain: "dictation-app-d103c.firebaseapp.com",
  projectId: "dictation-app-d103c",
  storageBucket: "dictation-app-d103c.firebasestorage.app",
  messagingSenderId: "763083445153",
  appId: "1:763083445153:web:97faebf6de994827a131e0",
};

// Khởi tạo App
const app = initializeApp(firebaseConfig);

// Chỉ lấy Database (Firestore) để lưu trữ
export const db = getFirestore(app);
export const auth = getAuth(app); // Xuất thêm auth
