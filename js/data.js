/**
 * Co so du lieu & Bo xu ly tiep nhan ho tro - Phong Cong nghe thong tin Truong Dai hoc Quoc te Hong Bang (HIU)
 * Tiep nhan thong tin van de cua sinh vien va lap Phieu Tiep Nhan Ho Tro ngay lap tuc.
 */

const HIU_DATA = {
  it_department: {
    name: "Phòng Công nghệ thông tin - Trường Đại học Quốc tế Hồng Bàng",
    short_name: "Phòng CNTT HIU",
    office: "Phòng 9.9 (Cơ sở 215 Điện Biên Phủ, P.15, Q. Bình Thạnh, TP.HCM)",
    phone: "028.7308.3456 (ext: 3435) | Hotline Zalo: 0817.971.901",
    email: "itoffice@hiu.vn",
    website: "https://hiu.vn"
  },
  campuses: [
    {
      name: "Cơ sở 1 (Trụ sở chính - Tòa nhà Con tàu tri thức)",
      address: "215 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM",
      details: "Tòa nhà 25 tầng. Văn phòng Phòng CNTT đặt tại Phòng 9.9."
    },
    {
      name: "Cơ sở 2 (Cơ sở Hòa Bình - Khu thực hành & Phức hợp thể thao)",
      address: "120 Hòa Bình, Phường Hòa Thạnh, Quận Tân Phú, TP.HCM"
    }
  ]
};

/**
 * Ham xu ly tiep nhan van de va LAP PHIEU GHI NGAY LAP TUC
 * Khong phan hoi chao hoi, khong cam on, khong kem duong link hay tu khoa huong dan.
 */
function findBestHIUResponse(message, userProfile) {
  const ticketId = "HIU-IT-" + Math.floor(100000 + Math.random() * 900000);
  const nowStr = new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const issueTopic = (userProfile && userProfile.issueLabel) || "Hỗ trợ CNTT";
  // Chỉ ghi nhận nội dung yêu cầu cụ thể nếu sinh viên có nhập, không lặp lại tên vấn đề
  let questionContent = "";
  if (userProfile && typeof userProfile.issueDesc === "string") {
    questionContent = userProfile.issueDesc.trim();
  } else if (message && typeof message === "string") {
    const trimmedMsg = message.trim();
    if (trimmedMsg && trimmedMsg !== issueTopic) {
      if (trimmedMsg.toLowerCase().startsWith(issueTopic.toLowerCase() + " - ")) {
        questionContent = trimmedMsg.substring(issueTopic.length + 3).trim();
      } else {
        questionContent = trimmedMsg;
      }
    }
  }

  const ticketData = {
    ticketId: ticketId,
    fullName: (userProfile && userProfile.name) || "",
    studentId: (userProfile && userProfile.studentId) || "",
    majorClass: (userProfile && userProfile.majorClass) || "",
    studentEmail: (userProfile && userProfile.studentEmail) || "",
    personalEmail: (userProfile && userProfile.personalEmail) || "",
    phone: (userProfile && userProfile.phone) || "",
    issueType: (userProfile && userProfile.issueType) || "",
    issueLabel: issueTopic,
    isGuest: (userProfile && userProfile.isGuest) || false,
    hasImage: (userProfile && (userProfile.hasImage || (userProfile.images && userProfile.images.length > 0))) || false,
    imageName: (userProfile && userProfile.imageName) || "",
    images: (userProfile && userProfile.images) || [],
    hasVideo: (userProfile && (userProfile.hasVideo || (userProfile.videos && userProfile.videos.length > 0))) || false,
    videoName: (userProfile && userProfile.videoName) || "",
    videos: (userProfile && userProfile.videos) || [],
    question: questionContent,
    topic: issueTopic,
    department: "Phòng Công nghệ thông tin HIU",
    status: "Đã tiếp nhận",
    createdAt: nowStr
  };

  return {
    isTicket: true,
    ticket: ticketData,
    text: "Hệ thống đã **lập Phiếu Tiếp Nhận Hỗ Trợ** và chuyển đến **Phòng Công nghệ thông tin HIU**.\n\n" +
          "• **Mã phiếu:** **" + ticketId + "**\n" +
          "• **Trạng thái:** **Đã tiếp nhận**\n" +
          "• **Thời gian xử lý:** Kết quả xử lý sẽ phản hồi qua Cổng thông tin sinh viên sau 06g (kiểm tra tại mục *Thông báo nhắc nhở*) hoặc chuyên viên sẽ liên hệ qua SĐT **" + ((userProfile && userProfile.phone) || "") + "** / Email **" + (((userProfile && userProfile.personalEmail) || (userProfile && userProfile.studentEmail)) || "") + "**."
  };
}