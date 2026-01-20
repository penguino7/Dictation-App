import { useState, useRef, useEffect } from "react";
import Parser from "srt-parser-2";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronRight,
  RefreshCw,
  Type,
  Settings,
  Flame,
} from "lucide-react";
import {
  timeToSeconds,
  cleanWord,
  isMorningBonusTime,
  getStreakMultiplier,
} from "../utils";

export default function Player({
  day,
  initialStreak,
  onUpdateStats,
  onUpdateProgress,
}) {
  const [subtitles, setSubtitles] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [checkResultData, setCheckResultData] = useState(null);

  const [completedLines, setCompletedLines] = useState(day?.progress || []);
  const [xpNotification, setXpNotification] = useState(null);
  const [streak, setStreak] = useState(initialStreak);

  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const isFirstLoad = useRef(true);
  const parser = new Parser();

  // --- 1. ĐẾM GIỜ HỌC ---
  useEffect(() => {
    const timer = setInterval(() => {
      onUpdateStats({ addMinutes: 1 });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. KHỞI TẠO DỮ LIỆU (CHỈ CHẠY KHI ĐỔI BÀI KHÁC) ---
  useEffect(() => {
    if (day) {
      const srtData = parser.fromSrt(day.srtContent);
      const processedSubs = srtData.map((item) => ({
        ...item,
        startTime: timeToSeconds(item.startTime),
        endTime: timeToSeconds(item.endTime),
      }));
      setSubtitles(processedSubs);

      // Tìm câu chưa học đầu tiên
      const firstIncomplete = processedSubs.findIndex(
        (_, idx) => !(day.progress || []).includes(idx),
      );
      setCurrentLineIndex(firstIncomplete !== -1 ? firstIncomplete : 0);

      // Reset trạng thái
      setUserInput("");
      setCheckResultData(null);
      setIsPlaying(false);
      setCompletedLines(day.progress || []);
      isFirstLoad.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day.id]); // <--- QUAN TRỌNG: Chỉ reset khi ID bài thay đổi

  // --- 3. ĐỒNG BỘ AUDIO VÀ SCROLL ---
  useEffect(() => {
    setUserInput("");
    setCheckResultData(null);
    if (inputRef.current) inputRef.current.focus();

    if (subtitles.length > 0 && audioRef.current) {
      audioRef.current.currentTime = subtitles[currentLineIndex].startTime;
      if (isFirstLoad.current) isFirstLoad.current = false;
      else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }

      if (scrollRef.current) {
        const activeItem = scrollRef.current.querySelector(
          `[data-index='${currentLineIndex}']`,
        );
        if (activeItem)
          activeItem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentLineIndex, subtitles]);

  // --- 4. CÁC HÀM XỬ LÝ AUDIO ---
  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const currentLine = subtitles[currentLineIndex];
      if (currentLine && audioRef.current.currentTime >= currentLine.endTime) {
        audioRef.current.currentTime = currentLine.startTime;
      }
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleReplayCurrentLine = () => {
    if (!audioRef.current || !subtitles[currentLineIndex]) return;
    const currentLine = subtitles[currentLineIndex];
    audioRef.current.currentTime = currentLine.startTime;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
    if (inputRef.current) inputRef.current.focus();
  };

  // --- 5. HÀM CHẤM ĐIỂM THÔNG MINH (FIX LỖI LỆCH DÒNG) ---
  const checkResult = () => {
    if (!subtitles.length) return;
    const correctText = subtitles[currentLineIndex].text;

    // Tách từ gốc
    const correctWords = correctText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);

    // Xử lý Input user: Biến dấu câu ngắt nghỉ thành khoảng trắng -> Tách -> Lọc rác
    // Giữ lại dấu nháy đơn (') cho các từ như I've, Don't
    const userWordsRaw = userInput
      .replace(/[.,!?;:"()“”—\-]/g, " ")
      .trim()
      .split(/\s+/)
      .filter((w) => w.trim().length > 0);

    let correctCount = 0;
    const result = correctWords.map((word, index) => {
      const userWord = userWordsRaw[index] || "";
      // So sánh dễ tính (bỏ qua hoa thường)
      const isCorrect = cleanWord(word) === cleanWord(userWord);

      if (isCorrect) correctCount++;
      return { word, isCorrect, userTyped: userWord };
    });

    setCheckResultData(result);

    // Tính điểm
    const accuracy = (correctCount / correctWords.length) * 100;

    // Nếu chưa hoàn thành câu này thì xét điểm
    if (!completedLines.includes(currentLineIndex)) {
      if (accuracy >= 80) {
        // TRÊN 80% LÀ QUA MÔN
        const newStreak = streak + 1;
        const baseXP = 10;
        const streakMultiplier = getStreakMultiplier(newStreak);
        const isBonus = isMorningBonusTime();
        let earnedXP = Math.round(
          baseXP * streakMultiplier * (isBonus ? 2 : 1),
        );

        setStreak(newStreak);
        const newCompletedLines = [...completedLines, currentLineIndex];
        setCompletedLines(newCompletedLines); // Cập nhật state ngay lập tức
        setXpNotification({
          amount: earnedXP,
          isBonus,
          streak: newStreak,
          multiplier: streakMultiplier,
        });

        onUpdateStats({ addXP: earnedXP, newStreak: newStreak });
        onUpdateProgress(day.id, newCompletedLines);
        setTimeout(() => setXpNotification(null), 2500);
      } else {
        // SAI: Reset streak
        if (streak > 0) {
          setStreak(0);
          onUpdateStats({ newStreak: 0 });
        }
      }
    }
  };

  const handleNext = () => {
    setCheckResultData(null);
    if (currentLineIndex < subtitles.length - 1)
      setCurrentLineIndex((curr) => curr + 1);
    else alert("Chúc mừng! Bạn đã hoàn thành bài học.");
  };

  // --- 6. XỬ LÝ ENTER (LOGIC MỚI) ---
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // Trường hợp 1: Chưa bấm kiểm tra -> Gọi hàm Check
      if (!checkResultData) {
        checkResult();
        return;
      }

      // Trường hợp 2: Đã hiện kết quả -> Kiểm tra xem ĐÚNG hay SAI
      // Lưu ý: Phải check dựa trên danh sách completedLines
      const isPassed = completedLines.includes(currentLineIndex);

      if (isPassed) {
        // Nếu ĐÚNG -> Enter để qua câu tiếp
        handleNext();
      } else {
        // Nếu SAI -> Enter để làm lại
        setCheckResultData(null);
        setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
        }, 0);
      }
    }
  };

  // --- 7. PHÍM TẮT ---
  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.key === "Control") {
        e.preventDefault();
        handleTogglePlay();
      }
      if (e.key === "Alt") {
        e.preventDefault();
        handleReplayCurrentLine();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [isPlaying, subtitles, currentLineIndex]); // Re-bind khi state thay đổi

  const handleTimeUpdate = () => {
    if (!subtitles.length) return;
    const currentLine = subtitles[currentLineIndex];
    if (audioRef.current.currentTime >= currentLine.endTime) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.currentTime = currentLine.endTime;
    }
  };

  return (
    <div className="h-full flex flex-col p-3 lg:p-6 bg-[#0f1115] text-white relative overflow-hidden">
      {xpNotification && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce-up pointer-events-none flex flex-col items-center">
          <div
            className={`text-6xl font-black drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] ${xpNotification.isBonus ? "text-yellow-400" : "text-blue-500"}`}
          >
            +{xpNotification.amount} XP
          </div>
        </div>
      )}

      <div className="flex-none mb-4 lg:mb-6 flex items-end justify-between border-b border-gray-800 pb-3">
        <div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
            Đang học bài
          </p>
          <h2 className="text-xl lg:text-3xl font-black text-gray-100 tracking-tight truncate max-w-[200px] lg:max-w-none">
            {day.title}
          </h2>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${streak > 2 ? "bg-orange-500/10 border-orange-500/50 text-orange-500" : "bg-gray-800 border-gray-700 text-gray-400"}`}
        >
          <Flame
            className={`w-4 h-4 ${streak > 2 ? "fill-orange-500 animate-pulse" : "text-gray-500"}`}
          />
          <span className="text-sm">{streak}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
        <div className="hidden lg:flex lg:col-span-4 flex-col bg-[#1a1d24] rounded-2xl border border-gray-800 overflow-hidden h-full shadow-lg">
          <div className="flex-none p-4 bg-[#1e222b] border-b border-gray-800 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Tiến độ ({completedLines.length}/{subtitles.length})
            </span>
            <div className="h-1 flex-1 mx-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${(completedLines.length / subtitles.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar"
          >
            {subtitles.map((sub, index) => (
              <div
                key={index}
                data-index={index}
                onClick={() => setCurrentLineIndex(index)}
                className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent flex justify-between items-center ${index === currentLineIndex ? "bg-blue-600/10 border-blue-500/50" : "hover:bg-gray-800 hover:border-gray-700"}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index === currentLineIndex ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400"}`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-sm font-medium truncate w-32 ${index === currentLineIndex ? "text-blue-200" : "text-gray-400 group-hover:text-gray-200"}`}
                  >
                    Câu #{index + 1}
                  </span>
                </div>
                {completedLines.includes(index) && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-3 lg:gap-4 h-full min-h-0">
          <audio
            ref={audioRef}
            src={day.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            playbackRate={playbackSpeed}
          />

          <div className="flex-none bg-[#1a1d24] rounded-2xl p-3 lg:p-4 border border-gray-800 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500 hidden sm:block" />
              <select
                className="bg-gray-800 text-gray-300 px-2 py-1.5 rounded text-xs font-bold outline-none border border-gray-700"
                onChange={(e) => {
                  setPlaybackSpeed(Number(e.target.value));
                  if (audioRef.current)
                    audioRef.current.playbackRate = Number(e.target.value);
                }}
              >
                <option value="0.75">0.75x</option>
                <option value="1" selected>
                  1.0x
                </option>
                <option value="1.25">1.25x</option>
              </select>
            </div>
            <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
              <button
                onClick={handleReplayCurrentLine}
                className="text-gray-400 hover:text-white p-2"
                title="Nghe lại (Alt)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleTogglePlay}
                className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
                title="Play/Pause (Ctrl)"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </button>
              <button
                onClick={handleNext}
                disabled={currentLineIndex === subtitles.length - 1}
                className="text-gray-400 hover:text-white p-2 disabled:opacity-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="w-10 sm:w-20 text-right text-xs font-mono text-gray-500 hidden sm:block">
              {subtitles[currentLineIndex] && (
                <span>
                  {Math.floor(
                    subtitles[currentLineIndex].endTime -
                      subtitles[currentLineIndex].startTime,
                  )}
                  s
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 bg-[#1a1d24] rounded-2xl border border-gray-800 overflow-hidden relative flex flex-col shadow-lg min-h-0">
            <div className="flex-none px-4 py-3 border-b border-gray-800 flex items-center gap-2 bg-[#1e222b]">
              <Type className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Gõ lại những gì bạn nghe thấy
              </span>
            </div>

            <textarea
              ref={inputRef}
              className={`w-full flex-1 p-4 lg:p-6 text-lg lg:text-2xl bg-transparent outline-none resize-none font-medium leading-relaxed ${checkResultData ? "text-gray-500 cursor-not-allowed" : "text-gray-200 placeholder-gray-600"}`}
              placeholder="Nghe và gõ lại..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!!checkResultData}
              spellCheck="false"
            ></textarea>

            {checkResultData && (
              <div className="absolute inset-0 bg-[#1a1d24]/95 backdrop-blur-sm z-10 flex flex-col animate-fade-in">
                <div className="flex-none px-4 py-3 border-b border-gray-800 flex justify-between items-center bg-green-900/20">
                  <h3 className="font-bold text-green-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" /> Kết quả
                  </h3>
                  <button
                    onClick={() => setCheckResultData(null)}
                    className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 bg-gray-800 px-2 py-1 rounded"
                  >
                    <RefreshCw className="w-3 h-3" /> Làm lại
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                  <div className="flex flex-wrap gap-2 text-lg lg:text-xl leading-relaxed">
                    {checkResultData.map((item, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded ${item.isCorrect ? "text-green-400 border-b border-green-500/30" : "text-red-400 border-b border-red-500/30 line-through decoration-red-500/50"}`}
                      >
                        {item.word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-none p-4 border-t border-gray-800 bg-[#15171c] flex justify-end">
              {!checkResultData ? (
                <button
                  onClick={checkResult}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-100 hover:bg-white text-gray-900 rounded-xl font-bold text-sm shadow-lg shadow-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Kiểm tra (Enter)
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Tiếp theo <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
