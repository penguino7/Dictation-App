import { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  Split,
  Trash2,
  Play,
  Plus,
  Save,
  FileAudio,
  Loader2,
  Pause,
  Merge,
  Wand2,
} from "lucide-react";
import Parser from "srt-parser-2";
import { timeToSeconds, secondsToTime, uploadToCloudinary } from "../utils";

export default function CreateModal({ isOpen, onClose, onSaveSuccess }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");

  const [audioUrl, setAudioUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [rawSrt, setRawSrt] = useState("");

  const [srtLines, setSrtLines] = useState([]);

  // Audio Player State
  const audioRef = useRef(null);
  const stopTimeRef = useRef(null);
  const [playingIndex, setPlayingIndex] = useState(null);

  const parser = new Parser();

  // --- AUDIO PREVIEW LOGIC ---
  const handleTimeUpdate = () => {
    if (audioRef.current && stopTimeRef.current !== null) {
      if (audioRef.current.currentTime >= stopTimeRef.current) {
        audioRef.current.pause();
        stopTimeRef.current = null;
        setPlayingIndex(null);
      }
    }
  };

  const previewLine = (index) => {
    const line = srtLines[index];
    if (audioRef.current && line) {
      if (playingIndex === index) {
        audioRef.current.pause();
        setPlayingIndex(null);
        return;
      }
      audioRef.current.currentTime = line.startTime;
      audioRef.current.play();
      stopTimeRef.current = line.endTime;
      setPlayingIndex(index);
    }
  };

  // --- TÍNH NĂNG MỚI: LỌC RÁC TOEIC ---
  const filterToeicGarbage = (lines) => {
    const garbagePatterns = [
      /^questions? \d+ through \d+/i,
      /^refer to the following/i,
      /^No\.\s*\d+/i, // Ví dụ: No.32 what...
      /^go on to the next page/i,
      /^look at the graphic/i,
      /^question \d+ through \d+/i,
    ];

    return lines.filter((line) => {
      const text = line.text.trim();
      // Giữ lại dòng nếu KHÔNG khớp bất kỳ pattern rác nào
      const isGarbage = garbagePatterns.some((pattern) => pattern.test(text));
      return !isGarbage;
    });
  };

  // --- PARSE & AUTO CLEAN ---
  const handleParseSrt = () => {
    if (!title || !audioUrl || !rawSrt) return alert("Thiếu thông tin!");
    try {
      const parsed = parser.fromSrt(rawSrt);
      let editableLines = parsed.map((item) => ({
        id: Math.random().toString(36).substr(2, 9),
        startTime: timeToSeconds(item.startTime),
        endTime: timeToSeconds(item.endTime),
        text: item.text.replace(/\r\n/g, " ").replace(/\n/g, " "), // Xóa xuống dòng thừa
      }));

      // Tự động lọc rác luôn cho sạch
      const cleanedLines = filterToeicGarbage(editableLines);

      if (cleanedLines.length < editableLines.length) {
        alert(
          `Đã tự động xóa ${editableLines.length - cleanedLines.length} dòng rác (Intro, Câu hỏi...)!`,
        );
      }

      setSrtLines(cleanedLines);
      setStep(2);
    } catch (e) {
      alert("SRT lỗi!");
    }
  };

  // --- TÍNH NĂNG MỚI: GỘP DÒNG (MERGE) ---
  const handleMergeUp = (index) => {
    if (index === 0) return; // Không gộp được dòng đầu tiên

    const prevLine = srtLines[index - 1];
    const currLine = srtLines[index];

    // Tạo dòng mới: Start của dòng trước -> End của dòng hiện tại
    const mergedLine = {
      ...prevLine,
      endTime: currLine.endTime,
      text: `${prevLine.text} ${currLine.text}`.trim(),
    };

    const newLines = [...srtLines];
    newLines.splice(index - 1, 2, mergedLine); // Xóa 2 dòng cũ, thay bằng 1 dòng gộp
    setSrtLines(newLines);
  };

  // --- TÁCH DÒNG (SPLIT) ---
  const handleSplit = (index, cursorPosition) => {
    const originalLine = srtLines[index];
    const text = originalLine.text;
    if (cursorPosition === 0 || cursorPosition >= text.length) return;

    const part1 = text.slice(0, cursorPosition).trim();
    const part2 = text.slice(cursorPosition).trim();

    // Chia thời gian theo tỉ lệ độ dài chữ
    const totalTime = originalLine.endTime - originalLine.startTime;
    const splitPoint =
      originalLine.startTime + totalTime * (part1.length / text.length);

    const line1 = { ...originalLine, text: part1, endTime: splitPoint };
    const line2 = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: splitPoint,
      endTime: originalLine.endTime,
      text: part2,
    };

    const newLines = [...srtLines];
    newLines.splice(index, 1, line1, line2);
    setSrtLines(newLines);
  };

  // --- CÁC HÀM CŨ (Upload, Change, Delete, Save) ---
  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadToCloudinary(file);
    if (url) setAudioUrl(url);
    setIsUploading(false);
  };

  const handleSrtUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setRawSrt(e.target.result);
    reader.readAsText(file);
  };

  const handleTextChange = (index, val) => {
    const newLines = [...srtLines];
    newLines[index].text = val;
    setSrtLines(newLines);
  };

  const handleTimeChange = (index, field, val) => {
    const newLines = [...srtLines];
    newLines[index][field] = Number(val);
    setSrtLines(newLines);
  };

  const handleDelete = (index) => {
    const newLines = [...srtLines];
    newLines.splice(index, 1);
    setSrtLines(newLines);
  };

  const handleFinalSave = () => {
    let content = "";
    srtLines.forEach((line, idx) => {
      content += `${idx + 1}\n${secondsToTime(line.startTime)} --> ${secondsToTime(line.endTime)}\n${line.text}\n\n`;
    });
    onSaveSuccess(title, audioUrl, content);
    onClose();
    // Reset state
    setStep(1);
    setTitle("");
    setAudioUrl("");
    setRawSrt("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-[#1a1d24] w-full max-w-5xl max-h-[95vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden">
        {/* PLAYER ẨN */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          className="hidden"
        />

        {/* HEADER */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e222b]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {step === 1 ? (
              <Upload className="w-5 h-5 text-blue-500" />
            ) : (
              <Wand2 className="w-5 h-5 text-purple-500" />
            )}
            {step === 1
              ? "Bước 1: Upload File (MP3 & SRT)"
              : "Bước 2: Chuẩn hóa TOEIC"}
          </h2>
          <button
            onClick={() => {
              onClose();
              setStep(1);
            }}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-6">
              {/* Tên bài */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  Tiêu đề
                </label>
                <input
                  className="w-full bg-[#15171c] border border-gray-700 rounded-xl p-3 text-white outline-none font-bold focus:border-blue-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: TOEIC Test 1 - Part 3"
                />
              </div>

              {/* Upload Audio */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  Audio (MP3)
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center ${audioUrl ? "border-green-500/50 bg-green-900/10" : "border-gray-700 bg-[#15171c]"}`}
                >
                  {isUploading ? (
                    <div className="text-blue-400 flex gap-2 items-center">
                      <Loader2 className="animate-spin" /> Đang tải lên...
                    </div>
                  ) : audioUrl ? (
                    <div className="text-green-400 font-bold flex gap-2 items-center">
                      <FileAudio /> Đã có Audio!
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="block w-full text-sm text-gray-500 file:bg-blue-600 file:text-white file:border-0 file:rounded-full file:px-4 file:py-2 cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* Upload SRT */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  Phụ đề (SRT)
                </label>
                <div className="bg-[#15171c] border border-gray-700 rounded-xl p-4">
                  <input
                    type="file"
                    accept=".srt"
                    onChange={handleSrtUpload}
                    className="text-sm text-gray-400 file:bg-gray-700 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 cursor-pointer mb-2"
                  />
                  <textarea
                    className="w-full h-32 bg-gray-900 border border-gray-800 rounded-lg p-3 text-gray-300 font-mono text-xs outline-none resize-none"
                    value={rawSrt}
                    onChange={(e) => setRawSrt(e.target.value)}
                    placeholder="Nội dung SRT..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="bg-purple-500/10 border border-purple-500/20 text-purple-200 p-3 rounded-lg text-sm mb-4 flex gap-2">
                <span>💡</span>
                <div>
                  <b>Mẹo TOEIC:</b>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-purple-300">
                    <li>
                      Hệ thống đã <b>tự động xóa</b> các dòng "Questions...",
                      "No.32...".
                    </li>
                    <li>
                      Dùng nút <b>Gộp (Merge)</b> ⬆️ để nối các câu bị ngắt
                      quãng.
                    </li>
                    <li>
                      Dùng nút <b>Tách (Split)</b> ✂️ để chia nhỏ câu dài.
                    </li>
                    <li>
                      Bấm <b>Play ▶</b> để nghe kiểm tra lại.
                    </li>
                  </ul>
                </div>
              </div>

              {srtLines.map((line, index) => (
                <div
                  key={line.id}
                  className={`flex gap-2 items-center group p-2 rounded-lg transition-all ${playingIndex === index ? "bg-blue-900/30 border border-blue-500/30" : "hover:bg-gray-800"}`}
                >
                  {/* NÚT MERGE (Nối với dòng trên) */}
                  {index > 0 && (
                    <button
                      onClick={() => handleMergeUp(index)}
                      className="p-2 text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                      title="Gộp với dòng trên"
                    >
                      <Merge className="w-4 h-4 rotate-180" />
                    </button>
                  )}

                  {/* NÚT PLAY */}
                  <button
                    onClick={() => previewLine(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-none ${playingIndex === index ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400 hover:text-white"}`}
                  >
                    {playingIndex === index ? (
                      <Pause className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* THỜI GIAN */}
                  <div className="flex flex-col gap-1 w-16 flex-none">
                    <input
                      type="number"
                      step="0.1"
                      className="bg-gray-900 text-gray-400 text-[10px] p-1 rounded text-center outline-none"
                      value={line.startTime}
                      onChange={(e) =>
                        handleTimeChange(index, "startTime", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="bg-gray-900 text-gray-400 text-[10px] p-1 rounded text-center outline-none"
                      value={line.endTime}
                      onChange={(e) =>
                        handleTimeChange(index, "endTime", e.target.value)
                      }
                    />
                  </div>

                  {/* NỘI DUNG & SPLIT */}
                  <div className="flex-1 relative">
                    <input
                      id={`input-${index}`}
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-500 p-2 text-white outline-none font-medium text-sm"
                      value={line.text}
                      onChange={(e) => handleTextChange(index, e.target.value)}
                      autoComplete="off"
                    />

                    {/* Nút Split ẩn */}
                    <button
                      tabIndex="-1"
                      onClick={() => {
                        const cur = document.getElementById(
                          `input-${index}`,
                        ).selectionStart;
                        handleSplit(index, cur);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-green-600 text-gray-300 hover:text-white px-2 py-0.5 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Split className="w-3 h-3 inline mr-1" /> Split
                    </button>
                  </div>

                  {/* XÓA */}
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-2 text-gray-600 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
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
                className="w-full py-2 border border-dashed border-gray-700 text-gray-500 rounded-xl hover:text-gray-300 text-sm mt-2"
              >
                <Plus className="w-4 h-4 inline" /> Thêm dòng
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-[#1e222b]">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-400 font-bold"
            >
              Quay lại
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={handleParseSrt}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2"
            >
              {isUploading ? "Đang tải..." : "Xử lý & Lọc rác"}{" "}
              <Wand2 className="w-4 h-4" />
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
