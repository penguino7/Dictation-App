import { useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  CloudUpload,
  Calendar,
  Zap,
  X,
  Lock,
  Trophy,
} from "lucide-react";
import {
  getCurrentRank,
  getNextRank,
  isMorningBonusTime,
  RANKS,
} from "../utils";

export default function Sidebar({
  days,
  selectedDay,
  onSelectDay,
  onDeleteDay,
  onOpenCreate,
  currentXP,
}) {
  const [showRankModal, setShowRankModal] = useState(false); // State để bật tắt bảng Rank

  const rank = getCurrentRank(currentXP);
  const nextRank = getNextRank(currentXP);
  const isBonus = isMorningBonusTime();

  // Tính % thanh tiến độ
  let progressPercent = 100;
  if (nextRank) {
    const currentLevelXP = currentXP - rank.minXP;
    const nextLevelXP = nextRank.minXP - rank.minXP;
    progressPercent = (currentLevelXP / nextLevelXP) * 100;
  }

  return (
    <>
      <div className="w-80 bg-white/90 backdrop-blur-md border-r border-gray-100 flex flex-col shadow-2xl z-20 h-full font-sans">
        {/* HEADER */}
        <div className="p-6 pb-4 bg-gradient-to-b from-blue-50 to-white">
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-4">
            <BookOpen className="w-6 h-6 text-blue-600" /> Dictation Master
          </h1>

          {/* THẺ RANK (Bấm vào để xem tất cả) */}
          <div
            onClick={() => setShowRankModal(true)}
            className={`group p-4 rounded-2xl bg-gradient-to-r ${rank.color} text-white shadow-lg relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-xs uppercase tracking-widest opacity-90 flex items-center gap-1">
                Current Rank{" "}
                <span className="bg-white/20 px-1.5 rounded text-[10px] group-hover:bg-white/40 transition-colors">
                  Info
                </span>
              </span>
              <span className="text-2xl filter drop-shadow-md">
                {rank.icon}
              </span>
            </div>
            <div className="text-2xl font-black tracking-tight mb-3">
              {rank.name}
            </div>

            {/* Thanh XP */}
            <div className="relative pt-1">
              <div className="flex mb-1 items-center justify-between">
                <span className="text-[10px] font-bold opacity-80">
                  {currentXP} XP
                </span>
                <span className="text-[10px] font-bold opacity-80">
                  {nextRank ? `Next: ${nextRank.minXP}` : "Max"}
                </span>
              </div>
              <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-black/20">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white/80 transition-all duration-500"
                ></div>
              </div>
            </div>
          </div>

          {/* Morning Bonus */}
          {isBonus && (
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 animate-pulse">
              <Zap className="w-4 h-4 fill-orange-500" /> Giờ vàng học sáng: x2
              XP!
            </div>
          )}

          <button
            onClick={onOpenCreate}
            className="mt-4 w-full py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl flex justify-center items-center gap-2 text-sm font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm bài học mới
          </button>
        </div>

        {/* DANH SÁCH BÀI HỌC */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mt-2 mb-2">
            Thư viện bài học
          </h3>

          {days.length === 0 && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Chưa có bài nào...
            </p>
          )}

          {days.map((day) => (
            <div
              key={day.id}
              onClick={() => onSelectDay(day)}
              className={`group relative p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                selectedDay?.id === day.id
                  ? "bg-blue-50 border-blue-200 shadow-sm"
                  : "bg-white border-transparent hover:border-gray-100 hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <h3
                  className={`font-bold text-sm line-clamp-2 ${
                    selectedDay?.id === day.id
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {day.title}
                </h3>
                <button
                  onClick={(e) => onDeleteDay(e, day.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                <Calendar className="w-3 h-3" />{" "}
                {new Date(day.createdAt).toLocaleDateString("vi-VN")}
                {day.progress && day.progress.length > 0 && (
                  <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-1 ml-auto">
                    {(
                      (day.progress.length /
                        (day.srtContent.split("\n\n").length || 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL BẢNG XẾP HẠNG (RANK SYSTEM) */}
      {showRankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowRankModal(false)}
          />

          <div className="bg-white rounded-3xl w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" /> Lộ trình thăng
                tiến
              </h2>
              <button
                onClick={() => setShowRankModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {RANKS.map((r, index) => {
                const isUnlocked = currentXP >= r.minXP;
                const isCurrent = rank.name === r.name;

                return (
                  <div
                    key={index}
                    className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      isUnlocked
                        ? `bg-white border-blue-100 ${
                            isCurrent
                              ? "ring-2 ring-blue-500 shadow-lg scale-[1.02]"
                              : "opacity-100"
                          }`
                        : "bg-gray-50 border-transparent opacity-60 grayscale"
                    }`}
                  >
                    {/* Icon Rank */}
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner ${
                        isUnlocked
                          ? "bg-gradient-to-br " + r.color + " text-white"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isUnlocked ? r.icon : <Lock className="w-6 h-6" />}
                    </div>

                    {/* Thông tin */}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3
                          className={`font-bold text-lg ${
                            isUnlocked ? "text-slate-800" : "text-gray-500"
                          }`}
                        >
                          {r.name}
                        </h3>
                        {isCurrent && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-400 mt-1">
                        Yêu cầu:{" "}
                        <span className="text-slate-600">{r.minXP} XP</span>
                      </p>
                    </div>

                    {/* Progress Bar nhỏ nếu đang ở rank này */}
                    {isCurrent && nextRank && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-gray-50 text-center text-xs text-gray-400 border-t border-gray-100">
              Cố gắng duy trì Streak để x3 kinh nghiệm nhé! 🔥
            </div>
          </div>
        </div>
      )}
    </>
  );
}
