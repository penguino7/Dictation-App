import { useState, useRef } from "react";
import {
  X,
  Upload,
  Split,
  Trash2,
  Play,
  Plus,
  Save,
  Clock,
} from "lucide-react";
import Parser from "srt-parser-2";
import { timeToSeconds, secondsToTime } from "../utils"; // Đảm bảo cậu có hàm secondsToTime trong utils

export default function CreateModal({ isOpen, onClose, onSaveSuccess }) {
  const [step, setStep] = useState(1); // Step 1: Nhập Info, Step 2: Chỉnh sửa SRT
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [rawSrt, setRawSrt] = useState("");

  // Dữ liệu SRT đã phân tích để chỉnh sửa
  const [srtLines, setSrtLines] = useState([]);
  const parser = new Parser();

  // XỬ LÝ KHI BẤM "TIẾP THEO" -> Phân tích SRT ra mảng để sửa
  const handleParseSrt = () => {
    if (!title || !audioUrl || !rawSrt)
      return alert("Vui lòng điền đủ thông tin!");

    try {
      const parsed = parser.fromSrt(rawSrt);
      // Chuyển đổi sang format dễ xử lý hơn
      const editableLines = parsed.map((item) => ({
        id: Math.random().toString(36).substr(2, 9),
        startTime: timeToSeconds(item.startTime),
        endTime: timeToSeconds(item.endTime),
        text: item.text,
      }));
      setSrtLines(editableLines);
      setStep(2); // Chuyển sang giao diện sửa
    } catch (e) {
      alert("Format SRT bị lỗi!");
    }
  };

  // --- TÍNH NĂNG VIP: TÁCH CÂU (SPLIT) ---
  const handleSplit = (index, cursorPosition) => {
    const originalLine = srtLines[index];
    const originalText = originalLine.text;

    // Nếu con trỏ ở đầu hoặc cuối thì không tách
    if (cursorPosition === 0 || cursorPosition >= originalText.length) return;

    const part1Text = originalText.slice(0, cursorPosition).trim();
    const part2Text = originalText.slice(cursorPosition).trim();

    // Tính toán thời gian chia theo tỉ lệ độ dài chữ (Heuristic)
    const totalDuration = originalLine.endTime - originalLine.startTime;
    const splitRatio = part1Text.length / originalText.length;
    const splitTime = originalLine.startTime + totalDuration * splitRatio;

    const newLine1 = {
      ...originalLine,
      text: part1Text,
      endTime: splitTime,
    };

    const newLine2 = {
      id: Math.random().toString(36).substr(2, 9),
      startTime: splitTime,
      endTime: originalLine.endTime,
      text: part2Text,
    };

    // Chèn 2 dòng mới vào vị trí cũ
    const newLines = [...srtLines];
    newLines.splice(index, 1, newLine1, newLine2);
    setSrtLines(newLines);
  };

  // Cập nhật nội dung khi gõ
  const handleTextChange = (index, newText) => {
    const newLines = [...srtLines];
    newLines[index].text = newText;
    setSrtLines(newLines);
  };

  // Cập nhật thời gian thủ công (nếu cần chỉnh mịn)
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

  // XUẤT NGƯỢC LẠI THÀNH FILE SRT ĐỂ LƯU DB
  const handleFinalSave = () => {
    let finalSrtContent = "";
    srtLines.forEach((line, index) => {
      // Format lại thành chuẩn SRT: 00:00:01,000
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
            {step === 1
              ? "Nhập thông tin bài học"
              : "Biên tập từng câu (VIP Editor)"}
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
          {/* STEP 1: NHẬP LIỆU THÔ */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Tiêu đề bài học
                </label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  placeholder="Ví dụ: Daily Conversation 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Link Audio (MP3/Cloudinary)
                </label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                  placeholder="https://..."
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Nội dung File SRT gốc
                </label>
                <textarea
                  className="w-full h-48 bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-300 font-mono text-sm outline-none focus:border-blue-500 resize-none"
                  placeholder="Paste nội dung file .srt vào đây..."
                  value={rawSrt}
                  onChange={(e) => setRawSrt(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: CHỈNH SỬA & TÁCH CÂU */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-3 rounded-lg text-sm mb-4">
                💡 <b>Mẹo:</b> Đặt con trỏ chuột vào chỗ muốn tách, rồi bấm nút{" "}
                <b>"Split"</b> bên cạnh. Thời gian sẽ tự động chia đôi!
              </div>

              {srtLines.map((line, index) => (
                <div key={line.id} className="flex gap-3 items-start group">
                  {/* TIME CONTROLS */}
                  <div className="flex flex-col gap-1 w-24 flex-none">
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

                  {/* TEXT INPUT WITH SPLIT LOGIC */}
                  <div className="flex-1 relative">
                    <input
                      id={`input-${index}`}
                      className="w-full bg-[#15171c] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 focus:bg-gray-900 transition-colors font-medium"
                      value={line.text}
                      onChange={(e) => handleTextChange(index, e.target.value)}
                      autoComplete="off"
                    />
                    {/* Nút Split hiện ra khi hover */}
                    <button
                      tabIndex="-1"
                      onClick={() => {
                        const input = document.getElementById(`input-${index}`);
                        const cursor = input.selectionStart; // Lấy vị trí con trỏ
                        handleSplit(index, cursor);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-all border border-gray-700"
                      title="Đặt con trỏ vào chữ và bấm để tách đôi"
                    >
                      <Split className="w-3 h-3 inline mr-1" /> Split
                    </button>
                  </div>

                  {/* DELETE */}
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
                <Plus className="w-4 h-4" /> Thêm dòng thủ công
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2"
            >
              Tiếp theo <Play className="w-4 h-4" />
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
