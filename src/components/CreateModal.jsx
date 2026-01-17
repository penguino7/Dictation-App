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

  // Ref để điều khiển Audio nghe thử
  const audioRef = useRef(null);
  const stopTimeRef = useRef(null); // Lưu thời điểm cần dừng
  const [playingIndex, setPlayingIndex] = useState(null); // Đang nghe dòng nào

  const parser = new Parser();

  // --- XỬ LÝ AUDIO PLAYER THÔNG MINH ---
  // Mỗi khi audio chạy, kiểm tra xem đã đến lúc dừng chưa
  const handleTimeUpdate = () => {
    if (audioRef.current && stopTimeRef.current !== null) {
      if (audioRef.current.currentTime >= stopTimeRef.current) {
        audioRef.current.pause();
        stopTimeRef.current = null;
        setPlayingIndex(null);
      }
    }
  };

  // Hàm nghe thử 1 dòng cụ thể
  const previewLine = (index) => {
    const line = srtLines[index];
    if (audioRef.current && line) {
      // Nếu đang nghe dòng này rồi thì bấm cái nữa là dừng
      if (playingIndex === index) {
        audioRef.current.pause();
        setPlayingIndex(null);
        return;
      }

      audioRef.current.currentTime = line.startTime;
      audioRef.current.play();
      stopTimeRef.current = line.endTime; // Đặt mốc dừng
      setPlayingIndex(index);
    }
  };
  // -------------------------------------

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
    reader.onload = (event) => setRawSrt(event.target.result);
    reader.readAsText(file);
  };

  const handleParseSrt = () => {
    if (!title || !audioUrl || !rawSrt) return alert("Thiếu thông tin!");
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
      alert("SRT lỗi!");
    }
  };

  const handleSplit = (index, cursorPosition) => {
    const originalLine = srtLines[index];
    const originalText = originalLine.text;
    if (cursorPosition === 0 || cursorPosition >= originalText.length) return;

    const part1Text = originalText.slice(0, cursorPosition).trim();
    const part2Text = originalText.slice(cursorPosition).trim();

    // Tách thời gian tương đối (Cần nghe lại để chỉnh cho chuẩn)
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

  // Khi sửa thời gian, nếu dòng trước kết thúc > dòng sau bắt đầu -> Có thể chỉnh tự động (Optional)
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
    if (audioRef.current) audioRef.current.pause();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1d24] w-full max-w-5xl max-h-[90vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden">
        {/* ELEMENT AUDIO ẨN ĐỂ PHỤC VỤ NGHE THỬ */}
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          className="hidden"
        />

        {/* HEADER */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e222b]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {step === 1 ? (
              <Upload className="w-5 h-5 text-blue-500" />
            ) : (
              <Split className="w-5 h-5 text-green-500" />
            )}
            {step === 1 ? "Upload Bài Học" : "Biên tập thời gian (Quan trọng)"}
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
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  1. Tiêu đề
                </label>
                <input
                  className="w-full bg-[#15171c] border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 font-bold"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  2. Audio (MP3)
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all ${audioUrl ? "border-green-500/50 bg-green-500/10" : "border-gray-700 bg-[#15171c]"}`}
                >
                  {isUploading ? (
                    <div className="text-blue-400 font-bold">
                      <Loader2 className="animate-spin w-6 h-6 inline" /> Đang
                      tải...
                    </div>
                  ) : audioUrl ? (
                    <span className="text-green-400 font-bold">
                      Đã có Audio!
                    </span>
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
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  3. SRT (Sub)
                </label>
                <div className="border border-gray-700 rounded-xl bg-[#15171c] p-4">
                  <input
                    type="file"
                    accept=".srt"
                    onChange={handleSrtUpload}
                    className="text-sm text-gray-400 file:bg-gray-700 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 cursor-pointer mb-2"
                  />
                  <textarea
                    className="w-full h-32 bg-gray-900 border border-gray-800 rounded-lg p-3 text-gray-300 font-mono text-xs outline-none"
                    value={rawSrt}
                    onChange={(e) => setRawSrt(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-3 rounded-lg text-sm mb-4">
                🎧 <b>Cách chỉnh chuẩn:</b> Bấm nút <b>Play (▶)</b> bên trái để
                nghe thử từng dòng. Nếu thấy bị hụt hoặc thừa, hãy chỉnh số giây
                ở ô thời gian rồi nghe lại.
              </div>

              {srtLines.map((line, index) => (
                <div
                  key={line.id}
                  className={`flex gap-2 items-center group p-2 rounded-lg transition-all ${playingIndex === index ? "bg-blue-900/30 border border-blue-500/30" : "hover:bg-gray-800"}`}
                >
                  {/* NÚT NGHE THỬ */}
                  <button
                    onClick={() => previewLine(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-none ${playingIndex === index ? "bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-gray-700 text-gray-400 hover:text-white hover:bg-blue-600"}`}
                    title="Nghe thử đoạn này"
                  >
                    {playingIndex === index ? (
                      <Pause className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* THỜI GIAN (START - END) */}
                  <div className="flex flex-col gap-1 w-20 flex-none">
                    <input
                      type="number"
                      step="0.1"
                      className="bg-gray-900 text-gray-300 font-mono text-[10px] p-1 rounded border border-gray-700 text-center outline-none focus:border-blue-500 focus:text-blue-400"
                      value={line.startTime}
                      onChange={(e) =>
                        handleTimeChange(index, "startTime", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="bg-gray-900 text-gray-300 font-mono text-[10px] p-1 rounded border border-gray-700 text-center outline-none focus:border-blue-500 focus:text-blue-400"
                      value={line.endTime}
                      onChange={(e) =>
                        handleTimeChange(index, "endTime", e.target.value)
                      }
                    />
                  </div>

                  {/* NỘI DUNG CHỮ */}
                  <div className="flex-1 relative">
                    <input
                      id={`input-${index}`}
                      className="w-full bg-transparent border-b border-transparent focus:border-blue-500 p-2 text-white outline-none font-medium text-sm transition-colors"
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-700 hover:bg-green-600 text-gray-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all border border-gray-600"
                    >
                      <Split className="w-3 h-3 inline mr-1" /> Split
                    </button>
                  </div>

                  {/* XÓA */}
                  <button
                    onClick={() => handleDeleteLine(index)}
                    className="p-2 text-gray-600 hover:text-red-500 opacity-50 hover:opacity-100"
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
                className="w-full py-3 border border-dashed border-gray-700 text-gray-500 rounded-xl hover:border-gray-500 hover:text-gray-300 font-bold flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-4 h-4" /> Thêm dòng mới
              </button>
            </div>
          )}
        </div>

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
              {isUploading ? "Đang tải..." : "Tiếp theo"}{" "}
              <Play className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinalSave}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20"
            >
              <Save className="w-4 h-4" /> Lưu lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
