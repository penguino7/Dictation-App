import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";

// --- 1. QUẢN LÝ BÀI HỌC (KHO CHUNG) ---

// Chỉ Admin mới gọi hàm này
export const addGlobalLesson = async (title, audioUrl, srtContent) => {
  try {
    // Lưu vào collection "lessons" ở root (ngoài cùng)
    return await addDoc(collection(db, "lessons"), {
      title,
      audioUrl,
      srtContent,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Lỗi thêm bài:", e);
    alert("Lỗi khi lưu bài học!");
  }
};

export const deleteGlobalLesson = async (id) => {
  await deleteDoc(doc(db, "lessons", id));
};

// Hàm này tải bài học chung + ghép với tiến độ riêng của user
export const getGlobalLessonsWithProgress = async (userId) => {
  try {
    // 1. Tải danh sách bài học chung
    const q = query(collection(db, "lessons"), orderBy("createdAt", "desc"));
    const lessonSnap = await getDocs(q);
    const lessons = [];

    // 2. Tải tiến độ riêng của user
    const progressRef = collection(db, "users", userId, "progress");
    const progressSnap = await getDocs(progressRef);
    const userProgress = {}; // Tạo map: { lessonId: [1, 2, 3] }

    progressSnap.forEach((doc) => {
      userProgress[doc.id] = doc.data().completedLines || [];
    });

    // 3. Ghép lại
    lessonSnap.forEach((doc) => {
      const lessonId = doc.id;
      lessons.push({
        id: lessonId,
        ...doc.data(),
        // Nếu user có tiến độ bài này thì lấy, ko thì rỗng
        progress: userProgress[lessonId] || [],
      });
    });

    return lessons;
  } catch (e) {
    console.error("Lỗi tải bài:", e);
    return [];
  }
};

// --- 2. QUẢN LÝ TIẾN ĐỘ RIÊNG ---

export const updateUserProgress = async (userId, lessonId, completedLines) => {
  if (!lessonId) return;
  // Lưu vào users/{userId}/progress/{lessonId}
  const progressRef = doc(db, "users", userId, "progress", lessonId);
  await setDoc(progressRef, { completedLines }, { merge: true });
};

// --- 3. GIỮ NGUYÊN PHẦN STATS (RANK, TIME) ---
const getUserStatsRef = (userId) =>
  doc(db, "users", userId, "stats", "my_stats");

export const updateUserStats = async (
  userId,
  { addXP, newStreak, addMinutes },
) => {
  const statsRef = getUserStatsRef(userId);
  const snap = await getDoc(statsRef);
  let stats = snap.exists()
    ? snap.data()
    : { xp: 0, streak: 0, totalMinutes: 0, todayMinutes: 0, lastDate: "" };

  const todayStr = new Date().toDateString();
  if (stats.lastDate !== todayStr) {
    stats.todayMinutes = 0;
    stats.lastDate = todayStr;
  }

  if (addXP) stats.xp = (stats.xp || 0) + addXP;
  if (newStreak !== undefined) stats.streak = newStreak;
  if (addMinutes) {
    stats.totalMinutes = (stats.totalMinutes || 0) + addMinutes;
    stats.todayMinutes = (stats.todayMinutes || 0) + addMinutes;
  }

  await setDoc(statsRef, stats, { merge: true });
  return stats;
};

export const getUserStats = async (userId) => {
  const snap = await getDoc(getUserStatsRef(userId));
  if (snap.exists()) {
    let stats = snap.data();
    const todayStr = new Date().toDateString();
    if (stats.lastDate !== todayStr) stats.todayMinutes = 0;
    return stats;
  }
  return { xp: 0, streak: 0, totalMinutes: 0, todayMinutes: 0 };
};
