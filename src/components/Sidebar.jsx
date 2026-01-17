import { X, Trophy, Plus, Trash2, Calendar, LogOut } from "lucide-react";
import { auth } from "../firebase"; // Nhớ import auth để dùng nút logout
import { signOut } from "firebase/auth";

export default function Sidebar({
  days,
  selectedDay,
  onSelectDay,
  onDeleteDay,
  onOpenCreate,
  currentXP,
  isOpen,
  onClose,
}) {
  // Xử lý đăng xuất
  const handleLogout = () => {
    if (confirm("Bạn muốn đăng xuất?")) {
      signOut(auth);
    }
  };

  return (
    <>
      {/* 1. Màn che đen mờ (Chỉ hiện trên Mobile khi mở menu) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose} // Bấm ra ngoài là đóng
        ></div>
      )}

      {/* 2. Thanh Sidebar chính */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-[#1a1d24] text-gray-300 flex flex-col border-r border-gray-800 shadow-2xl transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0 lg:static lg:shadow-none
      `}
      >
        {/* Header của Sidebar */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1e222b]">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-blue-500">Dictation</span>Master
          </h1>
          {/* Nút đóng X chỉ hiện trên Mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Phần Rank (Thẻ bài) */}
        <div className="p-6">
          <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Trophy className="w-24 h-24 rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold bg-black/20 px-2 py-1 rounded text-orange-100">
                  CURRENT RANK
                </span>
                <span className="text-xs font-bold text-orange-200">INFO</span>
              </div>
              <h3 className="text-2xl font-black mb-1">Đồng (Bronze)</h3>
              <div className="mt-3">
                <div className="flex justify-between text-xs font-bold mb-1 opacity-90">
                  <span>{currentXP} XP</span>
                  <span>Next: 500</span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-300 w-[10%]"
                    style={{
                      width: `${Math.min((currentXP / 500) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onOpenCreate();
              onClose();
            }} // Chọn xong thì đóng menu (trên mobile)
            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Thêm bài học mới
          </button>
        </div>

        {/* Danh sách bài học (Cuộn được) */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
          <p className="text-xs font-bold text-gray-500 uppercase px-2 mb-2 tracking-wider">
            Thư viện bài học
          </p>
          {days.length === 0 ? (
            <div className="text-center text-gray-600 py-8 text-sm italic">
              Chưa có bài nào...
            </div>
          ) : (
            days.map((day) => (
              <div
                key={day.id}
                onClick={() => {
                  onSelectDay(day);
                  onClose();
                }} // Chọn bài -> Đóng menu
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent ${
                  selectedDay?.id === day.id
                    ? "bg-blue-600/10 border-blue-500/50 text-blue-400"
                    : "hover:bg-gray-800 hover:border-gray-700 hover:text-white"
                }`}
              >
                <div className="overflow-hidden">
                  <h4 className="font-bold truncate text-sm">{day.title}</h4>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(day.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    onDeleteDay(e, day.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all"
                  title="Xóa bài"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer: Nút Logout */}
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
