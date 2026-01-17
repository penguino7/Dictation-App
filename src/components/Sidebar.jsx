import {
  X,
  Trophy,
  Plus,
  Trash2,
  Calendar,
  LogOut,
  User,
  Clock,
  Sun,
} from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Sidebar({
  user,
  stats,
  days,
  selectedDay,
  onSelectDay,
  onDeleteDay,
  onOpenCreate,
  isOpen,
  onClose,
}) {
  const handleLogout = () => {
    if (confirm("Bạn muốn đăng xuất?")) signOut(auth);
  };

  // Format phút thành Giờ:Phút (ví dụ: 125p -> 2h 5m)
  const formatTime = (minutes) => {
    if (!minutes) return "0p";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h ${m}p`;
    return `${m}p`;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        ></div>
      )}

      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-[#1a1d24] text-gray-300 flex flex-col border-r border-gray-800 shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:shadow-none
      `}
      >
        {/* 1. GÓC THÔNG TIN USER (Mới thêm) */}
        <div className="p-6 bg-[#1e222b] border-b border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-white truncate text-sm">
                {user?.email?.split("@")[0]}
              </h2>
              <p className="text-[10px] text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden ml-auto text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Thống kê thời gian */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#15171c] p-2 rounded-lg border border-gray-700/50 flex flex-col items-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Tổng cộng
              </span>
              <span className="text-sm font-black text-blue-400">
                {formatTime(stats.totalMinutes)}
              </span>
            </div>
            <div className="bg-[#15171c] p-2 rounded-lg border border-gray-700/50 flex flex-col items-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1">
                <Sun className="w-3 h-3 text-yellow-500" /> Hôm nay
              </span>
              <span className="text-sm font-black text-yellow-400">
                {formatTime(stats.todayMinutes)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. RANK CARD */}
        <div className="p-6 pb-2">
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group">
            <Trophy className="absolute -bottom-2 -right-2 w-20 h-20 text-white/10 rotate-12" />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded text-orange-100">
                  RANK
                </span>
                <span className="text-xs font-bold">{stats.xp} XP</span>
              </div>
              <h3 className="text-xl font-black mb-2">Đồng (Bronze)</h3>
              <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-300 w-[10%]"
                  style={{ width: `${Math.min((stats.xp / 500) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <button
            onClick={() => {
              onOpenCreate();
              onClose();
            }}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm bài mới
          </button>
        </div>

        {/* 3. DANH SÁCH BÀI HỌC */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
          <p className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-2 tracking-wider">
            Thư viện bài học
          </p>
          {days.length === 0 ? (
            <div className="text-center text-gray-600 py-8 text-xs italic">
              Trống trơn...
            </div>
          ) : (
            days.map((day) => (
              <div
                key={day.id}
                onClick={() => {
                  onSelectDay(day);
                  onClose();
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border border-transparent ${
                  selectedDay?.id === day.id
                    ? "bg-blue-600/10 border-blue-500/50 text-blue-400"
                    : "hover:bg-gray-800 hover:border-gray-700 hover:text-white"
                }`}
              >
                <div className="overflow-hidden">
                  <h4 className="font-bold truncate text-sm">{day.title}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(day.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => onDeleteDay(e, day.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 py-2 rounded-lg transition-all text-sm font-bold"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
}
