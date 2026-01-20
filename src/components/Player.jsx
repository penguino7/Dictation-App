import { useState, useRef, useEffect } from "react";
import Parser from "srt-parser-2";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Type,
  Settings,
  Flame,
  Music,
  Headphones,
} from "lucide-react";
import {
  timeToSeconds,
  cleanWord,
  isMorningBonusTime,
  getStreakMultiplier,
  getFixedAudioUrl, // <--- 1. ĐÃ THÊM IMPORT MỚI
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

  // --- 1. LOGIC GIỮ NGUYÊN ---
  useEffect(() => {
    const timer = setInterval(() => {
      onUpdateStats({ addMinutes: 1 });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
  }, [day.id]);

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

  const handleNext = () => {
    setCheckResultData(null);
    if (currentLineIndex < subtitles.length - 1)
      setCurrentLineIndex((curr) => curr + 1);
    else alert("Chúc mừng! Bạn đã hoàn thành bài học.");
  };

  const handlePrevious = () => {
    setCheckResultData(null);
    if (currentLineIndex > 0) setCurrentLineIndex((curr) => curr - 1);
  };

  const handleRetry = () => {
    setCheckResultData(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const checkResult = () => {
    if (!subtitles.length) return;
    const correctText = subtitles[currentLineIndex].text;
    const correctWords = correctText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const userWordsRaw = userInput
      .replace(/[.,!?;:"()“”—\-]/g, " ")
      .trim()
      .split(/\s+/)
      .filter((w) => w.trim().length > 0);

    let correctCount = 0;
    const result = correctWords.map((word, index) => {
      const userWord = userWordsRaw[index] || "";
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
        onUpdateStats({ addXP: earnedXP, newStreak: newStreak });
        onUpdateProgress(day.id, newCompletedLines);
        setTimeout(() => setXpNotification(null), 2500);
      } else {
        if (streak > 0) {
          setStreak(0);
          onUpdateStats({ newStreak: 0 });
        }
      }
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!checkResultData) checkResult();
    }
  };

  useEffect(() => {
    const handleShortcut = (e) => {
      if (e.key === "Control") {
        e.preventDefault();
        handleTogglePlay();
        return;
      }
      if (e.key === "Alt") {
        e.preventDefault();
        handleReplayCurrentLine();
        return;
      }
      if (checkResultData) {
        if (e.key.toLowerCase() === "w") {
          e.preventDefault();
          handleRetry();
        }
        if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          handleNext();
        }
        if (e.key.toLowerCase() === "a") {
          e.preventDefault();
          handlePrevious();
        }
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [isPlaying, subtitles, currentLineIndex, checkResultData]);

  const handleTimeUpdate = () => {
    if (!subtitles.length) return;
    const currentLine = subtitles[currentLineIndex];
    if (audioRef.current.currentTime >= currentLine.endTime) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.currentTime = currentLine.endTime;
    }
  };

  // --- GIAO DIỆN ---
  return (
    <div className="h-full flex flex-col p-4 lg:p-6 bg-gradient-to-br from-[#0f1115] via-[#13161c] to-[#0f1115] text-white relative overflow-hidden font-sans">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* XP NOTIFICATION */}
      {xpNotification && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce-up pointer-events-none flex flex-col items-center">
          <div
            className={`text-6xl lg:text-8xl font-black drop-shadow-[0_0_30px_rgba(59,130,246,0.6)] ${xpNotification.isBonus ? "text-yellow-400" : "text-transparent bg-clip-text bg-gradient-to-b from-blue-300 to-blue-600"}`}
          >
            +{xpNotification.amount} XP
          </div>
          {xpNotification.streak > 1 && (
            <div className="text-orange-400 font-bold text-xl mt-2 animate-pulse">
              🔥 Streak x{xpNotification.multiplier}
            </div>
          )}
        </div>
      )}

      {/* HEADER */}
      <div className="flex-none mb-6 flex items-end justify-between border-b border-gray-800/50 pb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Music className="w-3 h-3" /> Đang học bài
            </p>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-100 tracking-tight truncate max-w-[300px] lg:max-w-none drop-shadow-md">
              {day.title}
            </h2>
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-md transition-all duration-300 ${streak > 2 ? "bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]" : "bg-gray-800/50 border-gray-700/50 text-gray-400"}`}
        >
          <Flame
            className={`w-5 h-5 ${streak > 2 ? "fill-orange-500 animate-pulse" : "text-gray-500"}`}
          />
          <span className="text-lg font-bold">{streak}</span>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 relative z-10">
        {/* SIDEBAR */}
        <div className="hidden lg:flex lg:col-span-4 flex-col bg-[#1a1d24]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden h-full shadow-2xl">
          <div className="flex-none p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Tiến độ bài học
            </span>
            <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
              {Math.round((completedLines.length / subtitles.length) * 100)}%
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar"
          >
            {subtitles.map((sub, index) => (
              <div
                key={index}
                data-index={index}
                onClick={() => setCurrentLineIndex(index)}
                className={`group p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border flex justify-between items-center ${
                  index === currentLineIndex
                    ? "bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                    : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      index === currentLineIndex
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-300"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${index === currentLineIndex ? "text-blue-400" : "text-gray-500"}`}
                    >
                      Câu #{index + 1}
                    </span>
                    <span
                      className={`text-xs font-medium truncate w-32 ${index === currentLineIndex ? "text-gray-200" : "text-gray-600 group-hover:text-gray-400"}`}
                    >
                      {Math.floor(sub.endTime - sub.startTime)}s •{" "}
                      {sub.text.split(" ").length} từ
                    </span>
                  </div>
                </div>
                {completedLines.includes(index) && (
                  <div className="bg-green-500/20 p-1 rounded-full">
                    <Check className="w-3 h-3 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PLAYER AREA */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
          {/* 👇 2. ĐÃ SỬA: BỌC HÀM getFixedAudioUrl VÀO ĐÂY */}
          <audio
            ref={audioRef}
            src={getFixedAudioUrl(day.audioUrl)}
            onTimeUpdate={handleTimeUpdate}
            playbackRate={playbackSpeed}
          />

          {/* CONTROL BAR */}
          <div className="flex-none bg-[#1a1d24]/80 backdrop-blur-xl rounded-3xl p-4 border border-white/5 flex justify-between items-center shadow-lg relative group">
            {/* Speed Control */}
            <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
              <Settings className="w-4 h-4 text-gray-500 ml-1" />
              <select
                className="bg-transparent text-gray-300 text-xs font-bold outline-none cursor-pointer"
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

            {/* Center Buttons */}
            <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              <button
                onClick={handlePrevious}
                disabled={currentLineIndex === 0}
                className="text-gray-500 hover:text-white transition-colors disabled:opacity-30 hover:bg-white/10 p-2 rounded-full"
                title="Câu trước (A)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleReplayCurrentLine}
                className="text-gray-400 hover:text-blue-400 transition-colors bg-white/5 hover:bg-white/10 p-3 rounded-full border border-white/5"
                title="Nghe lại (Alt)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 transition-all duration-200 border-4 border-[#1a1d24]"
                title="Play/Pause (Ctrl)"
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={currentLineIndex === subtitles.length - 1}
                className="text-gray-500 hover:text-white transition-colors disabled:opacity-30 hover:bg-white/10 p-2 rounded-full"
                title="Câu sau (D)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Time Display */}
            <div className="w-20 text-right text-xs font-mono text-gray-500 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
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

          {/* INPUT AREA */}
          <div className="flex-1 bg-[#1a1d24]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden relative flex flex-col shadow-2xl min-h-0 transition-all focus-within:border-blue-500/30 focus-within:bg-[#1a1d24]/80">
            <div className="flex-none px-6 py-4 border-b border-white/5 flex items-center gap-2 bg-white/5">
              <Type className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Gõ lại những gì bạn nghe thấy
              </span>
            </div>

            <textarea
              ref={inputRef}
              className={`w-full flex-1 p-6 text-xl lg:text-2xl bg-transparent outline-none resize-none font-medium leading-relaxed font-serif tracking-wide
                ${checkResultData ? "text-gray-500 cursor-not-allowed blur-[1px]" : "text-gray-200 placeholder-gray-600"} selection:bg-blue-500/30`}
              placeholder="Nghe và gõ lại..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={!!checkResultData}
              spellCheck="false"
            ></textarea>

            {/* OVERLAY RESULT */}
            {checkResultData && (
              <div className="absolute inset-0 bg-[#0f1115]/95 backdrop-blur-xl z-20 flex flex-col animate-fade-in">
                {/* Header */}
                <div className="flex-none px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h3 className="font-bold text-green-400 text-lg flex items-center gap-2">
                    <div className="p-1 bg-green-500/20 rounded-full">
                      <Check className="w-4 h-4" />
                    </div>{" "}
                    Kết quả
                  </h3>
                  <button
                    onClick={handleRetry}
                    className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex items-center justify-center">
                  <div className="flex flex-wrap gap-3 text-2xl lg:text-3xl leading-relaxed font-medium justify-center text-center">
                    {checkResultData.map((item, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl transition-all duration-500 animate-slide-up ${
                          item.isCorrect
                            ? "text-green-400 bg-green-500/5 border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]"
                            : "text-red-400 bg-red-500/5 border border-red-500/20 line-through decoration-red-500/50"
                        }`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        {item.word}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Controls Info */}
                <div className="flex-none p-6 border-t border-white/10 bg-white/5">
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <button
                      onClick={handlePrevious}
                      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-800/50 hover:bg-gray-700/80 border border-white/5 transition-all hover:-translate-y-1"
                    >
                      <span className="text-[10px] font-bold text-gray-500 uppercase mb-1 group-hover:text-blue-400">
                        Phím A
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                        <ChevronLeft className="w-4 h-4" /> Câu trước
                      </div>
                    </button>

                    <button
                      onClick={handleRetry}
                      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-800/50 hover:bg-gray-700/80 border border-white/5 transition-all hover:-translate-y-1"
                    >
                      <span className="text-[10px] font-bold text-gray-500 uppercase mb-1 group-hover:text-yellow-400">
                        Phím W
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                        <RefreshCw className="w-4 h-4" /> Làm lại
                      </div>
                    </button>

                    <button
                      onClick={handleNext}
                      className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-600/20 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all hover:-translate-y-1 text-blue-400"
                    >
                      <span className="text-[10px] font-bold opacity-60 uppercase mb-1 group-hover:text-white">
                        Phím D
                      </span>
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <ChevronRight className="w-4 h-4" /> Câu sau
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CHECK BUTTON */}
            {!checkResultData && (
              <div className="flex-none p-4 border-t border-white/5 bg-white/5 flex justify-end">
                <button
                  onClick={checkResult}
                  className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-blue-600 font-lg rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:scale-95 focus:outline-none ring-offset-2 focus:ring-2 ring-blue-500"
                >
                  <span>Kiểm tra</span>
                  <div className="ml-2 px-2 py-0.5 bg-white/20 rounded text-[10px] font-mono group-hover:bg-white/30 transition-colors">
                    Enter
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
