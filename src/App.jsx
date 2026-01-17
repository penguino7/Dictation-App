import { useState, useEffect } from "react";
import { BookOpen, LogOut } from "lucide-react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDay,
  getAllDays,
  deleteDay,
  updateDayProgress,
  getUserStats,
  saveUserStats,
} from "./db";

import Sidebar from "./components/Sidebar";
import CreateModal from "./components/CreateModal";
import Player from "./components/Player";
import Auth from "./components/Auth";

function App() {
  const [user, setUser] = useState(null); // Lưu thông tin người dùng
  const [loadingUser, setLoadingUser] = useState(true);

  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentXP, setCurrentXP] = useState(0);
  const [streak, setStreak] = useState(0);

  // 1. THEO DÕI TRẠNG THÁI ĐĂNG NHẬP
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. KHI CÓ USER -> TẢI DỮ LIỆU CỦA USER ĐÓ
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      // Reset dữ liệu khi đăng xuất
      setDays([]);
      setCurrentXP(0);
      setStreak(0);
      setSelectedDay(null);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const lessonData = await getAllDays(user.uid); // Truyền ID user vào
    setDays(lessonData);

    const stats = await getUserStats(user.uid); // Truyền ID user vào
    setCurrentXP(stats.xp || 0);
    setStreak(stats.streak || 0);
  };

  const handleSaveDay = async (title, audioUrl, srtContent) => {
    await addDay(user.uid, title, audioUrl, srtContent);
    await loadData();
    alert("Thêm bài thành công!");
  };

  const handleDeleteDay = async (e, id) => {
    e.stopPropagation();
    if (confirm("Xóa bài này nhé?")) {
      await deleteDay(user.uid, id);
      if (selectedDay && selectedDay.id === id) setSelectedDay(null);
      await loadData();
    }
  };

  const handleUpdateStats = (addedXP, newStreak) => {
    const newXP = currentXP + addedXP;
    setCurrentXP(newXP);
    let finalStreak = streak;
    if (newStreak !== undefined) {
      setStreak(newStreak);
      finalStreak = newStreak;
    }
    saveUserStats(user.uid, newXP, finalStreak);
  };

  const handleUpdateProgress = async (dayId, completedLines) => {
    await updateDayProgress(user.uid, dayId, completedLines);
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, progress: completedLines } : d,
      ),
    );
    if (selectedDay?.id === dayId) {
      setSelectedDay({ ...selectedDay, progress: completedLines });
    }
  };

  // NẾU ĐANG TẢI USER -> Màn hình đen chờ
  if (loadingUser)
    return (
      <div className="h-screen bg-[#0f1115] flex items-center justify-center text-white">
        Loading...
      </div>
    );

  // NẾU CHƯA ĐĂNG NHẬP -> HIỆN BẢNG LOGIN
  if (!user) return <Auth />;

  // ĐÃ ĐĂNG NHẬP -> HIỆN APP
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
      <Sidebar
        days={days}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onDeleteDay={handleDeleteDay}
        onOpenCreate={() => setIsCreating(true)}
        currentXP={currentXP}
      />

      <div className="flex-1 flex flex-col relative bg-gray-50">
        {/* Nút Đăng xuất ở góc trên phải */}
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => signOut(auth)}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all"
          >
            <LogOut className="w-3 h-3" /> Logout ({user.email})
          </button>
        </div>

        {selectedDay ? (
          <Player
            key={selectedDay.id}
            day={selectedDay}
            initialStreak={streak}
            onUpdateStats={handleUpdateStats}
            onUpdateProgress={handleUpdateProgress}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <BookOpen className="w-20 h-20 mb-4 opacity-10" />
            <p className="text-lg">Chào mừng, {user.email}!</p>
          </div>
        )}

        <CreateModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onSaveSuccess={handleSaveDay}
        />
      </div>
    </div>
  );
}

export default App;
