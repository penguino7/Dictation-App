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
  ListMusic,
  Flame,
  Settings,
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

  const [completedLines, setCompletedLines] = useState(day.progress || []);
  const [xpNotification, setXpNotification] = useState(null);
  const [streak, setStreak] = useState(initialStreak);

  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null); // Để tự cuộn danh sách câu
  const isFirstLoad = useRef(true);
  const parser = new Parser();

  // 1. INIT DATA
  useEffect(() => {
    if (day) {
      const srtData = parser.fromSrt(day.srtContent);
      const processedSubs = srtData.map((item) => ({
        ...item,
        startTime: timeToSeconds(item.startTime),
        endTime: timeToSeconds(item.endTime),
      }));
      setSubtitles(processedSubs);

      const firstIncomplete = processedSubs.findIndex(
        (_, idx) => !(day.progress || []).includes(idx),
      );
      setCurrentLineIndex(firstIncomplete !== -1 ? firstIncomplete : 0);

      setUserInput("");
      setCheckResultData(null);
      setIsPlaying(false);
      setCompletedLines(day.progress || []);
      isFirstLoad.current = true;
    }
  }, [day]);

  // 2. AUDIO LOGIC
  useEffect(() => {
    setUserInput("");
    setCheckResultData(null);
    if (inputRef.current) inputRef.current.focus();

    if (subtitles.length > 0 && audioRef.current) {
      audioRef.current.currentTime = subtitles[currentLineIndex].startTime;
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }

      // Tự động cuộn danh sách bên trái đến câu đang học
      if (scrollRef.current) {
        const activeItem = scrollRef.current.querySelector(
          `[data-index='${currentLineIndex}']`,
        );
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [currentLineIndex, subtitles]);

  // 3. HANDLERS
  const handleNext = () => {
    setCheckResultData(null);
    if (currentLineIndex < subtitles.length - 1) {
      setCurrentLineIndex((curr) => curr + 1);
    } else {
      alert("Chúc mừng! Bạn đã hoàn thành bài học.");
    }
  };

  const checkResult = () => {
    if (!subtitles.length) return;
    const correctText = subtitles[currentLineIndex].text;
    const correctWords = correctText.trim().split(/\s+/);
    const userWords = userInput.trim().split(/\s+/);

    let correctCount = 0;
    const result = correctWords.map((word, index) => {
      const userWord = userWords[index] || "";
      const isCorrect = cleanWord(word) === cleanWord(userWord);
      if (isCorrect) correctCount++;
      return { word, isCorrect, userTyped: userWord };
    });

    setCheckResultData(result);
    const accuracy = (correctCount / correctWords.length) * 100;

    if (!completedLines.includes(currentLineIndex)) {
      if (accuracy >= 80) {
        const newStreak = streak + 1;
        const baseXP = 10;
        const streakMultiplier = getStreakMultiplier(newStreak);
        const isBonus = isMorningBonusTime();
        let earnedXP = Math.round(
          baseXP * streakMultiplier * (isBonus ? 2 : 1),
        );

        setStreak(newStreak);
        const newCompletedLines = [...completedLines, currentLineIndex];
        setCompletedLines(newCompletedLines);
        setXpNotification({
          amount: earnedXP,
          isBonus,
          streak: newStreak,
          multiplier: streakMultiplier,
        });

        onUpdateStats(earnedXP, newStreak);
        onUpdateProgress(day.id, newCompletedLines);
        setTimeout(() => setXpNotification(null), 2500);
      } else {
        if (streak > 0) {
          setStreak(0);
          onUpdateStats(0, 0);
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!checkResultData) checkResult();
      else handleNext();
    }
  };

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else {
      const currentLine = subtitles[currentLineIndex];
      if (audioRef.current.currentTime >= currentLine.endTime) {
        audioRef.current.currentTime = currentLine.startTime;
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

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
    // Container chính: h-full để lấp đầy màn hình, flex-col để chia bố cục
    <div className="h-full flex flex-col p-4 lg:p-6 bg-[#0f1115] text-white relative overflow-hidden">
      {/* 1. HIỆU ỨNG XP BAY LÊN */}
      {xpNotification && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce-up pointer-events-none flex flex-col items-center">
          <div
            className={`text-6xl font-black drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] ${
              xpNotification.isBonus ? "text-yellow-400" : "text-blue-500"
            }`}
          >
            +{xpNotification.amount} XP
          </div>
        </div>
      )}

      {/* 2. HEADER: Tên bài & Streak */}
      <div className="flex-none mb-6 flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
            Đang học bài
          </p>
          <h2 className="text-2xl lg:text-3xl font-black text-gray-100 tracking-tight">
            {day.title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Streak Box */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold transition-all ${
              streak > 2
                ? "bg-orange-500/10 border-orange-500/50 text-orange-500"
                : "bg-gray-800 border-gray-700 text-gray-400"
            }`}
          >
            <Flame
              className={`w-5 h-5 ${
                streak > 2 ? "fill-orange-500 animate-pulse" : "text-gray-500"
              }`}
            />
            <span className="text-lg">{streak}</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN LAYOUT: Grid chia cột Trái/Phải */}
      {/* min-h-0 là CHÌA KHÓA để scroll hoạt động trong Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* === CỘT TRÁI: TIẾN ĐỘ (Đã fix Scroll) === */}
        <div className="hidden lg:flex lg:col-span-4 flex-col bg-[#1a1d24] rounded-2xl border border-gray-800 overflow-hidden h-full shadow-lg">
          {/* Header nhỏ */}
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

          {/* List Scrollable */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar"
          >
            {subtitles.map((sub, index) => (
              <div
                key={index}
                data-index={index}
                onClick={() => setCurrentLineIndex(index)}
                className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent flex justify-between items-center ${
                  index === currentLineIndex
                    ? "bg-blue-600/10 border-blue-500/50" // Active
                    : "hover:bg-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      index === currentLineIndex
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium truncate w-40 ${
                        index === currentLineIndex
                          ? "text-blue-200"
                          : "text-gray-400 group-hover:text-gray-200"
                      }`}
                    >
                      {index === currentLineIndex
                        ? "▶ Đang nghe..."
                        : "Câu tiếp theo"}
                    </span>
                  </div>
                </div>
                {completedLines.includes(index) && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* === CỘT PHẢI: TRÌNH PHÁT & NHẬP LIỆU === */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
          <audio
            ref={audioRef}
            src={day.audioUrl}
            onTimeUpdate={handleTimeUpdate}
            playbackRate={playbackSpeed}
          />

          {/* Thanh điều khiển (Control Bar) */}
          <div className="flex-none bg-[#1a1d24] rounded-2xl p-4 border border-gray-800 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <select
                className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs font-bold outline-none cursor-pointer border border-gray-700 hover:border-gray-500 transition-colors"
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
                <option value="1.5">1.5x</option>
              </select>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  const currentLine = subtitles[currentLineIndex];
                  audioRef.current.currentTime = currentLine.startTime;
                  audioRef.current.play();
                  setIsPlaying(true);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center transition-transform transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/50"
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
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="w-20 text-right text-xs font-mono text-gray-500">
              {subtitles[currentLineIndex] && (
                <span>
                  {Math.floor(subtitles[currentLineIndex].startTime)}s -{" "}
                  {Math.floor(subtitles[currentLineIndex].endTime)}s
                </span>
              )}
            </div>
          </div>

          {/* Khu vực Nhập liệu (Input) - Kéo giãn hết phần còn lại */}
          <div className="flex-1 bg-[#1a1d24] rounded-2xl border border-gray-800 overflow-hidden relative flex flex-col shadow-lg min-h-0">
            <div className="flex-none px-6 py-3 border-b border-gray-800 flex items-center gap-2 bg-[#1e222b]">
              <Type className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-gray-400 uppercase">
                Gõ lại những gì bạn nghe thấy
              </span>
            </div>

            <textarea
              ref={inputRef}
              className={`w-full flex-1 p-6 text-xl lg:text-2xl bg-transparent outline-none resize-none font-medium leading-relaxed
                ${
                  checkResultData
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-gray-200 placeholder-gray-600"
                }`}
              placeholder="Start typing..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!!checkResultData}
              spellCheck="false"
            ></textarea>

            {/* Lớp phủ Kết quả (Overlay) */}
            {checkResultData && (
              <div className="absolute inset-0 bg-[#1a1d24]/95 backdrop-blur-sm z-10 flex flex-col animate-fade-in">
                <div className="flex-none px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-green-900/20">
                  <h3 className="font-bold text-green-400 flex items-center gap-2">
                    <Check className="w-5 h-5" /> Kết quả
                  </h3>
                  <button
                    onClick={() => setCheckResultData(null)}
                    className="text-sm font-bold text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" /> Làm lại
                  </button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <div className="flex flex-wrap gap-2 text-xl lg:text-2xl leading-relaxed">
                    {checkResultData.map((item, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded ${
                          item.isCorrect
                            ? "text-green-400 border-b-2 border-green-500/30"
                            : "text-red-400 border-b-2 border-red-500/30 line-through decoration-red-500/50"
                        }`}
                      >
                        {item.word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Nút Submit nằm góc dưới */}
            <div className="absolute bottom-6 right-6">
              {!checkResultData ? (
                <button
                  onClick={checkResult}
                  className="px-6 py-3 bg-gray-100 hover:bg-white text-gray-900 rounded-xl font-bold text-sm shadow-lg shadow-white/10 transition-transform transform hover:-translate-y-1 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Check (Enter)
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30 transition-transform transform hover:-translate-y-1 flex items-center gap-2"
                >
                  Tiếp theo <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <h1>AUTHOR FIXED</h1>
    </div>
  );
}
//test
