export const timeToSeconds = (timeString) => {
  if (!timeString) return 0;
  const parts = timeString.split(":");
  const secondsParts = parts[2].split(",");
  return (
    parseInt(parts[0], 10) * 3600 +
    parseInt(parts[1], 10) * 60 +
    parseInt(secondsParts[0], 10) +
    parseInt(secondsParts[1], 10) / 1000
  );
};

export const cleanWord = (word) => {
  if (!word) return "";

  return (
    word
      .toLowerCase() // 1. Chuyển hết thành chữ thường (Hello -> hello)
      // 2. Xóa sạch các dấu câu phổ biến (chấm, phẩy, hỏi, than, ngoặc, gạch ngang...)
      .replace(/[.,!?;:"()“”‘’'—\-]/g, "")
      .trim()
  ); // 3. Cắt khoảng trắng thừa
};

export const isMorningBonusTime = () => {
  const currentHour = new Date().getHours();
  return currentHour >= 5 && currentHour < 12;
};

export const getStreakMultiplier = (streak) => {
  if (streak >= 30) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
};

export const secondsToTime = (totalSeconds) => {
  const pad = (num, size = 2) => num.toString().padStart(size, "0");

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
};

// --- HÀM UPLOAD ĐÃ SỬA ---
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

  // QUAN TRỌNG: Đổi thành "video" để cho phép file MP3 lớn hơn 10MB (lên tới 100MB)
  formData.append("resource_type", "video");

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!res.ok) throw new Error("Upload thất bại");

    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error("Upload lỗi:", error);
    alert("Lỗi khi tải file! (Kiểm tra lại mạng hoặc file quá 100MB)");
    return null;
  }
};
export const getFixedAudioUrl = (url) => {
  if (!url) return "";
  // Kiểm tra xem có phải link Cloudinary không
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    // Chèn tham số "br_192" (Bitrate 192k cố định) vào sau chữ "upload/"
    // Điều này ép Cloudinary trả về file chuẩn CBR, giúp tua chính xác tuyệt đối.
    return url.replace("/upload/", "/upload/br_192/");
  }
  return url;
};
