// Thay 2 thông tin bạn vừa lấy được vào đây
const CLOUD_NAME = "dkfezzkhu"; // Ví dụ từ ảnh của bạn, hãy kiểm tra lại
const UPLOAD_PRESET = "dictation_app"; // Cái bạn vừa tạo ở Bước 2 (nhớ chọn Unsigned)

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("resource_type", "auto"); // Để nó tự nhận diện là audio/video

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    // Trả về đường link file online (https://res.cloudinary...)
    return data.secure_url;
  } catch (error) {
    console.error("Lỗi upload Cloudinary:", error);
    throw error;
  }
};
