// Tính giây (như cũ)
export const timeToSeconds = (timeString) => {
  if (!timeString) return 0;
  const [hours, minutes, seconds] = timeString.split(":");
  const [sec, ms] = seconds.split(",");
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(sec) +
    parseInt(ms) / 1000
  );
};

export const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const cleanWord = (word) => {
  return word.toLowerCase().replace(/[.,/#!?$%^&*;:{}=\-_`~()]/g, "");
};

// --- LOGIC MỚI: RANK & XP ---

// Cấu hình các cấp bậc
export const RANKS = [
  {
    name: "Đồng (Bronze)",
    minXP: 0,
    color: "from-orange-400 to-orange-600",
    icon: "🥉",
  },
  {
    name: "Bạc (Silver)",
    minXP: 500,
    color: "from-gray-300 to-gray-500",
    icon: "🥈",
  },
  {
    name: "Vàng (Gold)",
    minXP: 1500,
    color: "from-yellow-400 to-yellow-600",
    icon: "🥇",
  },
  {
    name: "Bạch Kim (Platinum)",
    minXP: 3000,
    color: "from-cyan-400 to-cyan-600",
    icon: "💠",
  },
  {
    name: "Kim Cương (Diamond)",
    minXP: 6000,
    color: "from-purple-500 to-pink-600",
    icon: "💎",
  },
  {
    name: "Thách Đấu (Master)",
    minXP: 10000,
    color: "from-red-500 to-rose-700",
    icon: "👑",
  },
];

export const getCurrentRank = (xp) => {
  return (
    RANKS.slice()
      .reverse()
      .find((r) => xp >= r.minXP) || RANKS[0]
  );
};

export const getNextRank = (xp) => {
  return RANKS.find((r) => r.minXP > xp) || null;
};

export const isMorningBonusTime = () => {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 8;
};

// --- LOGIC MỚI: TÍNH MULTIPLIER CHO STREAK ---
export const getStreakMultiplier = (streak) => {
  if (streak < 2) return 1; // Mới bắt đầu: x1
  if (streak <= 5) return 1.5; // Streak 2-5: x1.5
  if (streak <= 10) return 2; // Streak 6-10: x2
  return 3; // Streak 11+: x3
};

export const secondsToTime = (totalSeconds) => {
  const pad = (num, size = 2) => num.toString().padStart(size, "0");

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
};

// ... Giữ nguyên các hàm cũ (timeToSeconds, cleanWord, secondsToTime...)

export const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    alert("Chưa cấu hình Cloudinary trong .env!");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("resource_type", "auto"); // Tự động nhận diện mp3/video

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );
    const data = await res.json();
    return data.secure_url; // Trả về link file trên mạng
  } catch (error) {
    console.error("Upload lỗi:", error);
    alert("Lỗi khi tải file lên Cloudinary!");
    return null;
  }
};
