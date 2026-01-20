import { useState } from "react";
import {
  X,
  Upload,
  Save,
  FileAudio,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { uploadToCloudinary } from "../utils";

export default function CreateModal({ isOpen, onClose, onSaveSuccess }) {
  const [title, setTitle] = useState("");

  // Audio State
  const [audioUrl, setAudioUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // SRT State
  const [srtContent, setSrtContent] = useState("");
  const [fileName, setFileName] = useState("");

  // 1. XỬ LÝ UPLOAD AUDIO
  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      setAudioUrl(url);
    }
    setIsUploading(false);
  };

  // 2. XỬ LÝ ĐỌC FILE SRT (Lấy y nguyên nội dung)
  const handleSrtUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSrtContent(event.target.result); // Lưu nội dung thô
    };
    reader.readAsText(file);
  };

  // 3. LƯU BÀI HỌC
  const handleSave = () => {
    if (!title) return alert("Chưa nhập tên bài!");
    if (!audioUrl) return alert("Chưa có Audio!");
    if (!srtContent) return alert("Chưa có nội dung SRT!");

    // Gửi dữ liệu ra ngoài App để lưu vào Firebase
    onSaveSuccess(title, audioUrl, srtContent);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setAudioUrl("");
    setSrtContent("");
    setFileName("");
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1d24] w-full max-w-2xl rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        {/* HEADER */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#1e222b]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-500" />
            Thêm Bài Học Mới
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* 1. TÊN BÀI */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
              1. Tiêu đề bài học
            </label>
            <input
              className="w-full bg-[#15171c] border border-gray-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 font-bold text-lg placeholder-gray-600 transition-all"
              placeholder="Ví dụ: TOEIC Part 3 - Test 01"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* 2. UPLOAD AUDIO */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
              2. File Audio (MP3)
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-4 transition-all ${audioUrl ? "border-green-500/50 bg-green-500/5" : "border-gray-700 bg-[#15171c] hover:border-blue-500"}`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-3 text-blue-400 py-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-bold">Đang tải lên mây...</span>
                </div>
              ) : audioUrl ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-green-400 font-bold text-sm">
                        Đã tải xong Audio!
                      </p>
                      <p className="text-xs text-gray-500 max-w-[200px] truncate">
                        {audioUrl}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              ) : (
                <div className="relative group cursor-pointer text-center py-4">
                  <FileAudio className="w-8 h-8 text-gray-500 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm text-gray-400 group-hover:text-white">
                    Bấm để chọn file MP3
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. UPLOAD SRT */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
              3. File Phụ đề (SRT)
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-4 transition-all ${srtContent ? "border-purple-500/50 bg-purple-500/5" : "border-gray-700 bg-[#15171c] hover:border-blue-500"}`}
            >
              {srtContent ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-purple-400 font-bold text-sm">
                        Đã đọc nội dung SRT!
                      </p>
                      <p className="text-xs text-gray-500">{fileName}</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-purple-500" />
                </div>
              ) : (
                <div className="relative group cursor-pointer text-center py-4">
                  <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                  <p className="text-sm text-gray-400 group-hover:text-white">
                    Bấm để chọn file SRT chuẩn
                  </p>
                  <input
                    type="file"
                    accept=".srt"
                    onChange={handleSrtUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-gray-800 flex justify-end gap-3 bg-[#1e222b]">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-gray-400 hover:text-white font-bold transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            onClick={handleSave}
            disabled={!title || !audioUrl || !srtContent || isUploading}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Save className="w-5 h-5" /> Lưu Bài Học
          </button>
        </div>
      </div>
    </div>
  );
}
