import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  setDoc,
  getDoc,
} from "firebase/firestore";

// Hàm hỗ trợ lấy đường dẫn User
const getUserLessonRef = (userId) => collection(db, "users", userId, "lessons");
const getUserStatsRef = (userId) =>
  doc(db, "users", userId, "stats", "my_stats");

// --- 1. QUẢN LÝ BÀI HỌC (Có userId) ---

export const addDay = async (userId, title, audioUrl, srtContent) => {
  try {
    // Lưu vào sub-collection của user đó
    return await addDoc(getUserLessonRef(userId), {
      title,
      audioUrl,
      srtContent,
      createdAt: new Date().toISOString(),
      progress: [],
    });
  } catch (e) {
    console.error("Lỗi lưu bài:", e);
    alert("Lỗi mạng!");
  }
};

export const getAllDays = async (userId) => {
  try {
    const q = query(getUserLessonRef(userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const days = [];
    querySnapshot.forEach((doc) => {
      days.push({ id: doc.id, ...doc.data() });
    });
    return days;
  } catch (e) {
    console.error("Lỗi tải bài:", e);
    return [];
  }
};

export const deleteDay = async (userId, id) => {
  // Xóa đúng bài trong folder của user đó
  await deleteDoc(doc(db, "users", userId, "lessons", id));
};

export const updateDayProgress = async (userId, id, completedLines) => {
  if (!id) return;
  const lessonRef = doc(db, "users", userId, "lessons", id);
  await updateDoc(lessonRef, { progress: completedLines });
};

// --- 2. QUẢN LÝ RANK & STREAK (Riêng từng người) ---

export const saveUserStats = async (userId, xp, streak) => {
  await setDoc(getUserStatsRef(userId), { xp, streak }, { merge: true });
};

export const getUserStats = async (userId) => {
  const docSnap = await getDoc(getUserStatsRef(userId));
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return { xp: 0, streak: 0 };
  }
};
