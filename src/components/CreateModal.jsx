import { useState } from "react";
import { uploadToCloudinary } from "../cloudinary";
import { readFileAsText } from "../utils";
import { CloudUpload, X, FileAudio, FileText, Type } from "lucide-react";

export default function CreateModal({ isOpen, onClose, onSaveSuccess }) {
  const [isUploading, setIsUploading] = useState(false);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [tempAudio, setTempAudio] = useState(null);
  const [tempSrt, setTempSrt] = useState(null);

  const handleSave = async () => {
    if (!newDayTitle || !tempAudio || !tempSrt) {
      alert("Vui lòng nhập đủ thông tin!");
      return;
    }

    setIsUploading(true);
    try {
      const srtText = await readFileAsText(tempSrt);
      const cloudAudioUrl = await uploadToCloudinary(tempAudio);
      await onSaveSuccess(newDayTitle, cloudAudioUrl, srtText);
      setNewDayTitle("");
      setTempAudio(null);
      setTempSrt(null);
      onClose();
    } catch (error) {
      alert("Lỗi: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-fade-in-up">
        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 relative mb-4">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Đang tải lên mây...
            </h3>
            <p className="text-gray-500 mt-2 text-sm">
              Vui lòng không tắt trình duyệt
            </p>
          </div>
        )}

        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Thêm bài học
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="group">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                <Type className="w-4 h-4" /> Tên bài học
              </label>
              <input
                className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl outline-none font-semibold text-slate-700 transition-all placeholder:font-normal"
                placeholder="VD: Friends - Tập 1"
                value={newDayTitle}
                onChange={(e) => setNewDayTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                <FileAudio className="w-4 h-4" /> File Audio (MP3)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setTempAudio(e.target.files[0])}
                />
                <div
                  className={`w-full p-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 transition-all ${
                    tempAudio
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <CloudUpload className="w-5 h-5" />
                  <span className="text-sm font-medium truncate">
                    {tempAudio ? tempAudio.name : "Chọn file MP3 từ máy"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
                <FileText className="w-4 h-4" /> File Subtitle (.SRT)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".srt"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setTempSrt(e.target.files[0])}
                />
                <div
                  className={`w-full p-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 transition-all ${
                    tempSrt
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm font-medium truncate">
                    {tempSrt ? tempSrt.name : "Chọn file SRT từ máy"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-6 py-3 text-slate-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading}
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg shadow-gray-300 transition-transform active:scale-95"
            >
              Lưu & Bắt đầu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
