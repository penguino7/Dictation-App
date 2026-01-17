import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
// Import thêm các hàm xử lý Stats từ db.js
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

function App() {
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Mặc định là 0, sau đó sẽ tải từ trên mây về
  const [currentXP, setCurrentXP] = useState(0);
  const [streak, setStreak] = useState(0);

  // 1. CHẠY KHI MỞ WEB: Tải Bài học + Rank từ Firebase
  useEffect(() => {
    const initData = async () => {
      // Tải bài học
      const lessonData = await getAllDays();
      setDays(lessonData);

      // Tải Rank & Streak
      const stats = await getUserStats();
      setCurrentXP(stats.xp || 0);
      setStreak(stats.streak || 0);
    };

    initData();
  }, []);

  const handleSaveDay = async (title, audioUrl, srtContent) => {
    await addDay(title, audioUrl, srtContent);
    // Reload lại danh sách sau khi thêm
    const data = await getAllDays();
    setDays(data);
    alert("Đã lưu bài lên Mây thành công!");
  };

  const handleDeleteDay = async (e, id) => {
    e.stopPropagation();
    if (confirm("Xóa bài này khỏi Server nhé?")) {
      await deleteDay(id);
      if (selectedDay && selectedDay.id === id) setSelectedDay(null);

      const data = await getAllDays();
      setDays(data);
    }
  };

  // 2. CẬP NHẬT RANK LÊN MÂY
  const handleUpdateStats = (addedXP, newStreak) => {
    const newXP = currentXP + addedXP;
    setCurrentXP(newXP);

    let finalStreak = streak;
    if (newStreak !== undefined) {
      setStreak(newStreak);
      finalStreak = newStreak;
    }

    // Gọi hàm lưu lên Server
    saveUserStats(newXP, finalStreak);
  };

  const handleUpdateProgress = async (dayId, completedLines) => {
    await updateDayProgress(dayId, completedLines);
    setDays((prev) =>
      prev.map((d) => (d.id === dayId ? { ...d, progress: completedLines } : d))
    );
    if (selectedDay?.id === dayId) {
      setSelectedDay({ ...selectedDay, progress: completedLines });
    }
  };

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
            <p className="text-lg">Dữ liệu của bạn đang an toàn trên Mây ☁️</p>
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
//
