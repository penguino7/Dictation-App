import { useState, useEffect } from "react";
import { BookOpen, Menu } from "lucide-react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDay,
  getAllDays,
  deleteDay,
  updateDayProgress,
  getUserStats,
  updateUserStats,
} from "./db";

import Sidebar from "./components/Sidebar";
import CreateModal from "./components/CreateModal";
import Player from "./components/Player";
import Auth from "./components/Auth";

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // State quản lý chỉ số User
  const [stats, setStats] = useState({
    xp: 0,
    streak: 0,
    totalMinutes: 0,
    todayMinutes: 0,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    const lessonData = await getAllDays(user.uid);
    setDays(lessonData);
    const userStats = await getUserStats(user.uid);
    setStats(userStats);
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

  // Hàm cập nhật Stats (XP, Streak, Time)
  const handleUpdateStats = async (changes) => {
    // changes = { addXP: 10, newStreak: 5, addMinutes: 1 }
    const newStats = await updateUserStats(user.uid, changes);
    setStats(newStats); // Cập nhật ngay lên giao diện
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
        user={user} // Truyền info user vào
        stats={stats} // Truyền stats (time, xp) vào
        days={days}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onDeleteDay={handleDeleteDay}
        onOpenCreate={() => setIsCreating(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
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
            onUpdateStats={handleUpdateStats} // Truyền hàm xử lý mới
            onUpdateProgress={handleUpdateProgress}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4 text-center">
            <BookOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Chọn bài học để cày nào!</p>
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
