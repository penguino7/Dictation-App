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

const LESSONS_COL = "lessons";
const STATS_COL = "settings"; // Tạo thêm folder để lưu Rank

// --- 1. QUẢN LÝ BÀI HỌC ---

export const addDay = async (title, audioUrl, srtContent) => {
  try {
    const docRef = await addDoc(collection(db, LESSONS_COL), {
      title,
      audioUrl,
      srtContent,
      createdAt: new Date().toISOString(),
      progress: [],
    });
    return docRef;
  } catch (e) {
    console.error("Lỗi lưu bài:", e);
    alert("Lỗi mạng! Không lưu được bài.");
  }
};

export const getAllDays = async () => {
  try {
    const q = query(collection(db, LESSONS_COL), orderBy("createdAt", "desc"));
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

export const deleteDay = async (id) => {
  await deleteDoc(doc(db, LESSONS_COL, id));
};

export const updateDayProgress = async (id, completedLines) => {
  if (!id) return;
  const lessonRef = doc(db, LESSONS_COL, id);
  await updateDoc(lessonRef, { progress: completedLines });
};

// --- 2. QUẢN LÝ RANK & STREAK (Lưu lên mây luôn) ---

export const saveUserStats = async (xp, streak) => {
  // Lưu vào một file cố định tên là 'my_stats'
  await setDoc(
    doc(db, STATS_COL, "my_stats"),
    {
      xp,
      streak,
    },
    { merge: true }
  );
};

export const getUserStats = async () => {
  const docRef = doc(db, STATS_COL, "my_stats");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return { xp: 0, streak: 0 };
  }
};
