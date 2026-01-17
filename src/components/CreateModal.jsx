import { useState } from "react";
import {
  X,
  Upload,
  Split,
  Trash2,
  Play,
  Plus,
  Save,
  FileAudio,
  FileText,
  Loader2,
} from "lucide-react";
import Parser from "srt-parser-2";
import { timeToSeconds, secondsToTime, uploadToCloudinary } from "../utils";

export default function CreateModal({ isOpen, onClose, onSaveSuccess }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");

  // Audio State
  const [audioUrl, setAudioUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // SRT State
  const [rawSrt, setRawSrt] = useState("");

  // Logic Editor
  const [srtLines, setSrtLines] = useState([]);
  const parser = new Parser();

  // --- XỬ LÝ UPLOAD AUDIO ---
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

  // --- XỬ LÝ ĐỌC FILE SRT ---
  const handleSrtUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setRawSrt(event.target.result); // Đọc xong thì điền vào ô text
    };
    reader.readAsText(file);
  };

  // --- CHUYỂN BƯỚC (PARSE) ---
  const handleParseSrt = () => {
    if (!title) return alert("Chưa nhập tên bài!");
    if (!audioUrl) return alert("Chưa có Audio (đợi upload xong đã)!");
    if (!rawSrt) return alert("Chưa có nội dung SRT!");

    try {
      const parsed = parser.fromSrt(rawSrt);
      const editableLines = parsed.map((item) => ({
        id: Math.random().toString(36).substr(2, 9),
        startTime: timeToSeconds(item.startTime),
        endTime: timeToSeconds(item.endTime),
        text: item.text,
      }));
      setSrtLines(editableLines);
      setStep(2);
    } catch (e) {
      alert("File SRT lỗi format!");
    }
  };

  // --- LOGIC TÁCH CÂU (GIỮ NGUYÊN) ---
  const handleSplit = (index, cursorPosition) => {
    const originalLine = srtLines[index];
    const originalText = originalLine.text;
    if (cursorPosition === 0 || cursorPosition >= originalText.length) return;

    const part1Text = originalText.slice(0, cursorPosition).trim();
    const part2Text = originalText.slice(cursorPosition).trim();
    const totalDuration = originalLine.endTime - originalLine.startTime;
    const splitRatio = part1Text.length / originalText.length;
    const splitTime = originalLine.startTime + totalDuration * splitRatio;

    const newLine1 = { ...originalLine, text: part1Text, endTime: splitTime };
    const newLine2 = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: splitTime,
      endTime: originalLine.endTime,
      text: part2Text,
    };

    const newLines = [...srtLines];
    newLines.splice(index, 1, newLine1, newLine2);
    setSrtLines(newLines);
  };

  const handleTextChange = (index, newText) => {
    const newLines = [...srtLines];
    newLines[index].text = newText;
    setSrtLines(newLines);
  };

  const handleTimeChange = (index, field, value) => {
    const newLines = [...srtLines];
    newLines[index][field] = Number(value);
    setSrtLines(newLines);
  };

  const handleDeleteLine = (index) => {
    const newLines = [...srtLines];
    newLines.splice(index, 1);
    setSrtLines(newLines);
  };

  const handleFinalSave = () => {
    let finalSrtContent = "";
    srtLines.forEach((line, index) => {
      const start = secondsToTime(line.startTime);
      const end = secondsToTime(line.endTime);
      finalSrtContent += `${index + 1}\n${start} --> ${end}\n${line.text}\n\n`;
    });
    onSaveSuccess(title, audioUrl, finalSrtContent);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setTitle("");
    setAudioUrl("");
    setRawSrt("");
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1d24] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e222b]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {step === 1 ? (
              <Upload className="w-5 h-5 text-blue-500" />
            ) : (
              <Split className="w-5 h-5 text-green-500" />
            )}
            {step === 1 ? "Upload Bài Học Mới" : "Biên tập (VIP Editor)"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-6">
              {/* 1. TÊN BÀI */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  1. Tiêu đề bài học
                </label>
                <input
                  className="w-full bg-[#15171c] border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-bold"
                  placeholder="Ví dụ: Luyện nghe Bài 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* 2. UPLOAD AUDIO */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  2. Upload File Audio (MP3)
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all ${audioUrl ? "border-green-500/50 bg-green-500/10" : "border-gray-700 bg-[#15171c] hover:border-blue-500"}`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center text-blue-400 animate-pulse">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-sm font-bold">
                        Đang đẩy lên mây... chờ xíu...
                      </span>
                    </div>
                  ) : audioUrl ? (
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <FileAudio className="w-6 h-6" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-green-400 font-bold text-sm">
                          Upload thành công!
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {audioUrl}
                        </p>
                      </div>
                      <button
                        onClick={() => setAudioUrl("")}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <FileAudio className="w-10 h-10 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400 mb-2">
                        Kéo thả hoặc bấm để chọn file MP3
                      </p>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* 3. UPLOAD SRT */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  3. Upload File Phụ đề (SRT)
                </label>
                <div className="border border-gray-700 rounded-xl bg-[#15171c] p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <input
                      type="file"
                      accept=".srt"
                      onChange={handleSrtUpload}
                      className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 italic ml-auto">
                      Hoặc paste trực tiếp xuống dưới
                    </span>
                  </div>
                  <textarea
                    className="w-full h-32 bg-gray-900 border border-gray-800 rounded-lg p-3 text-gray-300 font-mono text-xs outline-none focus:border-blue-500 resize-none"
                    placeholder="Nội dung file SRT sẽ hiện ở đây..."
                    value={rawSrt}
                    onChange={(e) => setRawSrt(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-lg text-sm mb-4">
                💡 <b>Mẹo:</b> Click vào chữ rồi bấm nút <b>"Split"</b> để cắt
                đôi câu nếu bị dính.
              </div>

              {srtLines.map((line, index) => (
                <div key={line.id} className="flex gap-3 items-start group">
                  <div className="flex flex-col gap-1 w-20 flex-none">
                    <input
                      type="number"
                      step="0.1"
                      className="bg-gray-900 text-gray-400 text-xs p-1 rounded border border-gray-800 text-center outline-none focus:border-blue-500"
                      value={line.startTime}
                      onChange={(e) =>
                        handleTimeChange(index, "startTime", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="bg-gray-900 text-gray-400 text-xs p-1 rounded border border-gray-800 text-center outline-none focus:border-blue-500"
                      value={line.endTime}
                      onChange={(e) =>
                        handleTimeChange(index, "endTime", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      id={`input-${index}`}
                      className="w-full bg-[#15171c] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 focus:bg-gray-900 transition-colors font-medium"
                      value={line.text}
                      onChange={(e) => handleTextChange(index, e.target.value)}
                      autoComplete="off"
                    />
                    <button
                      tabIndex="-1"
                      onClick={() => {
                        const cursor = document.getElementById(
                          `input-${index}`,
                        ).selectionStart;
                        handleSplit(index, cursor);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-all border border-gray-700"
                    >
                      <Split className="w-3 h-3 inline mr-1" /> Split
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteLine(index)}
                    className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setSrtLines([
                    ...srtLines,
                    { id: Date.now(), startTime: 0, endTime: 0, text: "" },
                  ])
                }
                className="w-full py-2 border-2 border-dashed border-gray-700 text-gray-500 rounded-xl hover:border-gray-500 hover:text-gray-300 font-bold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Thêm dòng
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-[#1e222b]">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-400 hover:text-white font-bold"
            >
              Quay lại
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={handleParseSrt}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-bold flex items-center gap-2"
            >
              {isUploading ? "Đang Upload..." : "Tiếp theo"}{" "}
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"
            >
              <Save className="w-4 h-4" /> Lưu bài học
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
