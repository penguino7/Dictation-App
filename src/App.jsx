import { useState, useEffect } from "react";
import { BookOpen, Menu } from "lucide-react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
// Import các hàm mới
import {
  addGlobalLesson,
  getGlobalLessonsWithProgress,
  deleteGlobalLesson,
  updateUserProgress,
  getUserStats,
  updateUserStats,
} from "./db";

import Sidebar from "./components/Sidebar";
import CreateModal from "./components/CreateModal";
import Player from "./components/Player";
import Auth from "./components/Auth";

// ⚠️ THAY EMAIL CỦA CẬU VÀO ĐÂY NHÉ
const ADMIN_EMAIL = "ngocnhat@gmail.com";

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [stats, setStats] = useState({
    xp: 0,
    streak: 0,
    totalMinutes: 0,
    todayMinutes: 0,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Biến kiểm tra xem có phải Admin không
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadData();
    else {
      setDays([]);
      setStats({ xp: 0, streak: 0, totalMinutes: 0, todayMinutes: 0 });
      setSelectedDay(null);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    // Dùng hàm mới: Lấy bài chung + tiến độ riêng
    const lessonData = await getGlobalLessonsWithProgress(user.uid);
    setDays(lessonData);

    const userStats = await getUserStats(user.uid);
    setStats(userStats);
  };

  const handleSaveDay = async (title, audioUrl, srtContent) => {
    // Chỉ Admin mới được lưu
    if (!isAdmin) return alert("Bạn không có quyền thêm bài!");

    await addGlobalLesson(title, audioUrl, srtContent);
    await loadData();
    alert("Đã đăng bài lên kho chung!");
  };

  const handleDeleteDay = async (e, id) => {
    e.stopPropagation();
    // Chỉ Admin mới được xóa
    if (!isAdmin) return alert("Chỉ Admin mới được xóa bài!");

    if (confirm("Xóa bài này khỏi hệ thống chung?")) {
      await deleteGlobalLesson(id);
      if (selectedDay && selectedDay.id === id) setSelectedDay(null);
      await loadData();
    }
  };

  const handleUpdateStats = async (changes) => {
    const newStats = await updateUserStats(user.uid, changes);
    setStats(newStats);
  };

  // Hàm cập nhật tiến độ (Sửa lại để gọi hàm mới)
  const handleUpdateProgress = async (dayId, completedLines) => {
    await updateUserProgress(user.uid, dayId, completedLines);

    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, progress: completedLines } : d,
      ),
    );
    if (selectedDay?.id === dayId) {
      setSelectedDay({ ...selectedDay, progress: completedLines });
    }
  };

  if (loadingUser)
    return (
      <div className="h-screen bg-[#0f1115] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  if (!user) return <Auth />;

  return (
    <div className="flex h-screen bg-[#0f1115] font-sans text-gray-200 overflow-hidden">
      <Sidebar
        user={user}
        stats={stats}
        days={days}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onDeleteDay={handleDeleteDay}
        onOpenCreate={() => setIsCreating(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isAdmin={isAdmin} // Truyền quyền Admin xuống Sidebar
      />

      <div className="flex-1 flex flex-col relative bg-[#13161c]">
        <div className="lg:hidden flex items-center p-4 bg-[#1a1d24] border-b border-gray-800">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-300 hover:text-white mr-4"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black text-white">
            Dictation<span className="text-blue-500">Master</span>
          </h1>
        </div>

        {selectedDay ? (
          <Player
            key={selectedDay.id}
            day={selectedDay}
            initialStreak={stats.streak}
            onUpdateStats={handleUpdateStats}
            onUpdateProgress={handleUpdateProgress}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {isAdmin
                ? "Chào Thầy Giáo! Hãy thêm bài học cho mọi người."
                : "Chào bạn! Chọn bài để học nhé."}
            </p>
          </div>
        )}

        {/* Chỉ hiện Modal thêm bài nếu là Admin */}
        {isAdmin && (
          <CreateModal
            isOpen={isCreating}
            onClose={() => setIsCreating(false)}
            onSaveSuccess={handleSaveDay}
          />
        )}
      </div>
    </div>
  );
}

export default App;
