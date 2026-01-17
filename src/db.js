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

// Hàm hỗ trợ lấy đường dẫn
const getUserLessonRef = (userId) => collection(db, "users", userId, "lessons");
const getUserStatsRef = (userId) =>
  doc(db, "users", userId, "stats", "my_stats");

// --- 1. QUẢN LÝ BÀI HỌC ---
export const addDay = async (userId, title, audioUrl, srtContent) => {
  try {
    return await addDoc(getUserLessonRef(userId), {
      title,
      audioUrl,
      srtContent,
      createdAt: new Date().toISOString(),
      progress: [],
    });
  } catch (e) {
    console.error(e);
    alert("Lỗi mạng!");
  }
};

export const getAllDays = async (userId) => {
  try {
    const q = query(getUserLessonRef(userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const days = [];
    querySnapshot.forEach((doc) => days.push({ id: doc.id, ...doc.data() }));
    return days;
  } catch (e) {
    return [];
  }
};

export const deleteDay = async (userId, id) => {
  await deleteDoc(doc(db, "users", userId, "lessons", id));
};

export const updateDayProgress = async (userId, id, completedLines) => {
  if (!id) return;
  await updateDoc(doc(db, "users", userId, "lessons", id), {
    progress: completedLines,
  });
};

// --- 2. QUẢN LÝ STATS (Rank, Streak, TIME) ---

export const updateUserStats = async (
  userId,
  { addXP, newStreak, addMinutes },
) => {
  const statsRef = getUserStatsRef(userId);
  const snap = await getDoc(statsRef);

  // Lấy dữ liệu cũ hoặc tạo mới nếu chưa có
  let stats = snap.exists()
    ? snap.data()
    : { xp: 0, streak: 0, totalMinutes: 0, todayMinutes: 0, lastDate: "" };

  const todayStr = new Date().toDateString(); // Ví dụ: "Sat Jan 17 2026"

  // Kiểm tra ngày mới để reset phút hôm nay
  if (stats.lastDate !== todayStr) {
    stats.todayMinutes = 0;
    stats.lastDate = todayStr;
  }

  // Cộng dồn dữ liệu
  if (addXP) stats.xp = (stats.xp || 0) + addXP;
  if (newStreak !== undefined) stats.streak = newStreak;
  if (addMinutes) {
    stats.totalMinutes = (stats.totalMinutes || 0) + addMinutes;
    stats.todayMinutes = (stats.todayMinutes || 0) + addMinutes;
  }

  await setDoc(statsRef, stats, { merge: true });
  return stats; // Trả về stats mới nhất để App cập nhật giao diện
};

export const getUserStats = async (userId) => {
  const snap = await getDoc(getUserStatsRef(userId));
  if (snap.exists()) {
    let stats = snap.data();
    // Nếu load lên mà thấy sang ngày mới rồi thì reset hiển thị luôn
    const todayStr = new Date().toDateString();
    if (stats.lastDate !== todayStr) {
      stats.todayMinutes = 0;
    }
    return stats;
  }
  return { xp: 0, streak: 0, totalMinutes: 0, todayMinutes: 0 };
};
