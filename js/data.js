/**
 * Cơ sở tri thức (Knowledge Base) về Trường Đại học Quốc tế Hồng Bàng (HIU)
 * Hỗ trợ Chatbot giải đáp tự động và chính xác cho sinh viên & thí sinh.
 */

const HIU_DATA = {
  university: {
    name: "Trường Đại học Quốc tế Hồng Bàng",
    code: "HIU",
    slogan: "Khơi nguồn sáng tạo - Vươn tầm quốc tế",
    founded: 1997,
    campuses: [
      {
        name: "Cơ sở 1 (Trụ sở chính - Tòa nhà Con tàu tri thức)",
        address: "215 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM",
        phone: "028.7308.3456",
        highlight: "Tòa nhà 25 tầng chuẩn 5 sao, thư viện số, phòng mô phỏng lâm sàng y khoa hiện đại bậc nhất."
      },
      {
        name: "Cơ sở 2",
        address: "120 Hòa Bình, Phường Hòa Thạnh, Quận Tân Phú, TP.HCM",
        phone: "028.7308.3456",
        highlight: "Khu liên hợp thể thao, xưởng thực hành kỹ thuật công nghệ và sân bóng chuẩn quốc tế."
      }
    ],
    hotlines: ["0938.69.2015", "0964.239.172", "0964.959.172"],
    email: "tuyensinh@hiu.vn",
    website: "https://hiu.vn"
  },

  admission_methods: [
    {
      id: "pt1",
      name: "Xét kết quả thi tốt nghiệp THPT 2026",
      desc: "Xét điểm theo tổ hợp 3 môn thi tốt nghiệp THPT theo quy định của Bộ GD&ĐT."
    },
    {
      id: "pt2",
      name: "Xét kết quả học bạ THPT",
      desc: "Linh hoạt 3 hình thức: Xét điểm trung bình cả năm lớp 12 theo tổ hợp 3 môn; hoặc Xét tổng điểm trung bình 3 học kỳ (HK1, HK2 lớp 11 & HK1 lớp 12); hoặc Xét tổng điểm cả năm lớp 12 từ 18 điểm trở lên (đối với nhóm ngành sức khỏe theo ngưỡng đảm bảo chất lượng của Bộ)."
    },
    {
      id: "pt3",
      name: "Xét kết quả thi Đánh giá năng lực ĐHQG TP.HCM",
      desc: "Dành cho thí sinh tham dự kỳ thi ĐGNL do ĐHQG TP.HCM tổ chức năm 2026."
    },
    {
      id: "pt4",
      name: "Xét tuyển thẳng theo quy định riêng của HIU & Bộ GD&ĐT",
      desc: "Áp dụng cho học sinh giỏi các trường chuyên, đạt giải học sinh giỏi quốc gia, chứng chỉ quốc tế (IELTS từ 5.0 trở lên, SAT...)."
    }
  ],

  faculties: [
    {
      name: "Khối ngành Sức khỏe (Mũi nhọn HIU)",
      majors: [
        { name: "Y khoa", code: "7720101", years: "6 năm", highlight: "Được thực hành tại các bệnh viện lớn hàng đầu TP.HCM: BV Chợ Rẫy, Thống Nhất, Nhi Đồng..." },
        { name: "Răng - Hàm - Mặt", code: "7720501", years: "6 năm", highlight: "Hệ thống phòng khám thực hành RHM tiêu chuẩn quốc tế tại cơ sở Điện Biên Phủ." },
        { name: "Dược học", code: "7720201", years: "5 năm", highlight: "Chuẩn đầu ra Dược sĩ chất lượng cao, mạng lưới liên kết hơn 20 công ty dược lớn." },
        { name: "Điều dưỡng", code: "7720301", years: "4 năm", highlight: "Cơ hội làm việc tại Nhật Bản, Đức với mức lương cao." },
        { name: "Kỹ thuật Phục hồi chức năng", code: "7720603", years: "4 năm", highlight: "Nhu cầu nhân lực y tế đang tăng trưởng vượt bậc." },
        { name: "Kỹ thuật Xét nghiệm y học", code: "7720601", years: "4 năm", highlight: "Phòng thí nghiệm hiện đại, học thực tế lâm sàng." }
      ]
    },
    {
      name: "Khối ngành Kinh tế - Quản trị",
      majors: [
        { name: "Quản trị kinh doanh", code: "7340101", years: "3.5 năm", highlight: "Chương trình song ngữ, kiến tập doanh nghiệp từ năm 1." },
        { name: "Marketing & Digital Marketing", code: "7340115", years: "3.5 năm", highlight: "Thực chiến các chiến dịch truyền thông đa kênh hiện đại." },
        { name: "Logistics và Quản lý chuỗi cung ứng", code: "7510605", years: "3.5 năm", highlight: "Ngành 'hot' thu hút đầu tư thương mại toàn cầu." },
        { name: "Tài chính - Ngân hàng / Fintech", code: "7340201", years: "3.5 năm", highlight: "Đào tạo tài chính số và ngân hàng 4.0." },
        { name: "Thương mại điện tử", code: "7340122", years: "3.5 năm", highlight: "Bùng nổ cùng thị trường kinh doanh số." }
      ]
    },
    {
      name: "Khối ngành Kỹ thuật - Công nghệ",
      majors: [
        { name: "Công nghệ thông tin (CNTT)", code: "7480201", years: "4 năm", highlight: "Chuyên sâu Trí tuệ nhân tạo (AI), An toàn thông tin, Lập trình ứng dụng." },
        { name: "Trí tuệ nhân tạo (AI & Data)", code: "7480107", years: "4 năm", highlight: "Đón đầu xu thế công nghệ kỷ nguyên số." },
        { name: "Kỹ thuật y sinh", code: "7520212", years: "4 năm", highlight: "Kết hợp giữa công nghệ cao và chăm sóc sức khỏe." }
      ]
    },
    {
      name: "Khối ngành Ngôn ngữ & Văn hóa Quốc tế",
      majors: [
        { name: "Ngôn ngữ Anh", code: "7220201", years: "3.5 năm", highlight: "Biên phiên dịch, sư phạm và tiếng Anh thương mại quốc tế." },
        { name: "Ngôn ngữ Hàn Quốc", code: "7220210", years: "3.5 năm", highlight: "Cơ hội việc làm tại các tập đoàn đa quốc gia Hàn Quốc (Samsung, CJ, LG...)." },
        { name: "Ngôn ngữ Trung Quốc", code: "7220204", years: "3.5 năm", highlight: "Học bổng giao lưu văn hóa và thực tập tại Đài Loan/Trung Quốc." },
        { name: "Ngôn ngữ Nhật", code: "7220209", years: "3.5 năm", highlight: "Cam kết giới thiệu việc làm tại Nhật Bản." }
      ]
    }
  ],

  scholarships: [
    {
      title: "Học bổng Doanh nghiệp đồng hành (100% học phí)",
      condition: "Dành cho tân sinh viên xuất sắc có thành tích học tập vượt trội hoặc hoàn cảnh nỗ lực vươn lên."
    },
    {
      title: "Học bổng Tài năng HIU (25% - 50% học phí)",
      condition: "Dành cho thí sinh đạt điểm cao trong kỳ thi tốt nghiệp THPT hoặc kỳ thi ĐGNL ĐHQG."
    },
    {
      title: "Học bổng Nhập học sớm",
      condition: "Ưu đãi học phí đặc biệt dành cho thí sinh đăng ký và hoàn tất thủ tục xét tuyển đợt 1."
    },
    {
      title: "Học bổng Thủ khoa các khối ngành",
      condition: "Miễn 100% học phí toàn khóa cho các thủ khoa đầu vào các khối ngành."
    }
  ],

  tuition_info: {
    standard: "Học phí tính theo tín chỉ, dao động trung bình từ 15 - 28 triệu VNĐ/học kỳ tùy thuộc vào ngành học (khối Kinh tế, Ngôn ngữ, Kỹ thuật).",
    health_sciences: "Khối ngành Sức khỏe (Y khoa, Răng - Hàm - Mặt, Dược học) có mức học phí đặc thù từ 30 - 85 triệu VNĐ/học kỳ do yêu cầu trang thiết bị thực hành và đào tạo lâm sàng tại bệnh viện theo quy chuẩn cao cấp.",
    commitment: "HIU cam kết ổn định học phí trong suốt lộ trình đào tạo, không tăng bất ngờ và hỗ trợ chính sách trả góp học phí 0% lãi suất với ngân hàng."
  }
};

/**
 * Bộ xử lý logic tìm kiếm câu trả lời thông minh dựa trên từ khóa người dùng gửi
 */
function findBestHIUResponse(message, userProfile) {
  const msg = (message || "").toLowerCase().trim();

  // 1. Chào hỏi
  if (msg.match(/^(xin chào|chào|hello|hi|hey|alo|bạn ơi)/i)) {
    return {
      text: `Xin chào **${userProfile.name}**! HIU rất vui được hỗ trợ bạn.\n\n` +
            `Bạn đang cần tư vấn thông tin gì về **Trường Đại học Quốc tế Hồng Bàng**? Bạn có thể bấm chọn nhanh các gợi ý bên dưới hoặc gửi câu hỏi trực tiếp nhé!`,
      quickReplies: ["Học phí 2026", "Phương thức xét tuyển", "Khối ngành Sức khỏe", "Chính sách Học bổng", "Địa chỉ cơ sở HIU"]
    };
  }

  // 2. Học phí
  if (msg.includes("học phí") || msg.includes("hoc phi") || msg.includes("bao nhiêu tiền") || msg.includes("chi phí") || msg.includes("đóng tiền")) {
    return {
      text: `🎓 **Thông tin học phí tại Trường Đại học Quốc tế Hồng Bàng (HIU):**\n\n` +
            `• **Các ngành tiêu chuẩn** (Kinh tế, Ngôn ngữ, CNTT, Xã hội): ${HIU_DATA.tuition_info.standard}\n\n` +
            `• **Khối ngành Sức khỏe** (Y khoa, Răng - Hàm - Mặt, Dược): ${HIU_DATA.tuition_info.health_sciences}\n\n` +
            `💡 **Chính sách hỗ trợ:** HIU áp dụng chương trình *Trả góp học phí 0% lãi suất* và gói học bổng tài trợ doanh nghiệp giảm từ 25% - 100% học phí.\n\n` +
            `Bạn muốn tra cứu học phí chi tiết của ngành nào cụ thể không?`,
      quickReplies: ["Học phí Y - Dược", "Học phí ngành CNTT", "Học bổng 2026", "Gặp tư vấn viên"]
    };
  }

  // 3. Phương thức xét tuyển / Tuyển sinh
  if (msg.includes("xét tuyển") || msg.includes("xet tuyen") || msg.includes("tuyển sinh") || msg.includes("tuyen sinh") || msg.includes("nộp hồ sơ") || msg.includes("điểm chuẩn") || msg.includes("học bạ")) {
    let methodsList = HIU_DATA.admission_methods.map((m, idx) => `**${idx + 1}. ${m.name}:**\n   ${m.desc}`).join("\n\n");
    return {
      text: `📋 **HIU áp dụng 4 phương thức xét tuyển linh hoạt năm 2026:**\n\n${methodsList}\n\n` +
            `⚡ *Thí sinh có thể nộp học bạ online ngay hôm nay tại cổng tuyển sinh HIU để giữ chỗ sớm và nhận học bổng!*`,
      quickReplies: ["Xét học bạ cần giấy tờ gì?", "Học bổng nhập học sớm", "Đăng ký tư vấn trực tiếp"]
    };
  }

  // 4. Ngành Y, Dược, Sức khỏe
  if (msg.includes("y khoa") || msg.includes("răng hàm mặt") || msg.includes("dược") || msg.includes("điều dưỡng") || msg.includes("sức khỏe") || msg.includes("y dược") || msg.includes("xét nghiệm")) {
    const healthFaculty = HIU_DATA.faculties[0];
    let majorsStr = healthFaculty.majors.map(m => `• **${m.name}** (Mã: ${m.code}, ${m.years}): ${m.highlight}`).join("\n");
    return {
      text: `🏥 **Khối ngành Sức khỏe - Mũi nhọn Đào tạo tại HIU:**\n\n` +
            `HIU tự hào là một trong những trường ĐH quốc tế hàng đầu đào tạo đa ngành sức khỏe với cơ sở vật chất phòng khám chuẩn 5 sao và liên kết với hơn 30 bệnh viện tuyến trung ương.\n\n` +
            `${majorsStr}\n\n` +
            `📌 **Điều kiện xét tuyển Sức khỏe:** Áp dụng ngưỡng đảm bảo chất lượng của Bộ GD&ĐT (Học lực lớp 12 loại Giỏi đối với Y, Dược, RHM; Khá đối với Điều dưỡng, Xét nghiệm).`,
      quickReplies: ["Học phí ngành Y khoa", "Học phí Răng Hàm Mặt", "Cơ sở vật chất Y khoa", "Hotline tư vấn Y Dược"]
    };
  }

  // 5. Ngành CNTT, Kỹ thuật, AI
  if (msg.includes("cntt") || msg.includes("công nghệ thông tin") || msg.includes("ai") || msg.includes("trí tuệ nhân tạo") || msg.includes("kỹ thuật") || msg.includes("it")) {
    return {
      text: `💻 **Khối ngành Kỹ thuật & Công nghệ HIU:**\n\n` +
            `• **Công nghệ thông tin:** Đào tạo chuyên sâu Lập trình di động, Trí tuệ nhân tạo (AI), Điện toán đám mây và An ninh mạng.\n` +
            `• **Trí tuệ nhân tạo (AI & Data Science):** Nắm bắt kỷ nguyên tự động hóa, học máy và phân tích dữ liệu lớn.\n` +
            `• **Kỹ thuật Y sinh:** Cầu nối liên ngành công nghệ số và thiết bị y tế tương lai.\n\n` +
            `🏢 Sinh viên được thực tập tại các tập đoàn công nghệ đối tác và tham gia các lab nghiên cứu hiện đại.`,
      quickReplies: ["Học phí CNTT", "Phương thức xét tuyển", "Cơ hội việc làm"]
    };
  }

  // 6. Kinh tế, Marketing, Quản trị, Logistics
  if (msg.includes("kinh tế") || msg.includes("quản trị") || msg.includes("marketing") || msg.includes("logistics") || msg.includes("thương mại điện tử") || msg.includes("tài chính")) {
    return {
      text: `📈 **Khối ngành Kinh tế - Quản trị tại HIU:**\n\n` +
            `• **Quản trị kinh doanh:** Trang bị tư duy lãnh đạo, khởi nghiệp và điều hành doanh nghiệp hiện đại.\n` +
            `• **Marketing & Digital Marketing:** Làm chủ chiến lược thương hiệu, quảng cáo đa nền tảng và sáng tạo nội dung số.\n` +
            `• **Logistics & Quản lý chuỗi cung ứng:** Đào tạo theo chuẩn thực chiến quốc tế, liên kết doanh nghiệp cảng biển & vận tải lớn.\n` +
            `• **Thương mại điện tử & Fintech:** Dẫn đầu xu hướng mua sắm trực tuyến và thanh toán thông minh.`,
      quickReplies: ["Học phí khối Kinh tế", "Học bổng Doanh nghiệp", "Đăng ký xét tuyển"]
    };
  }

  // 7. Học bổng
  if (msg.includes("học bổng") || msg.includes("hoc bong") || msg.includes("ưu đãi") || msg.includes("miễn giảm")) {
    let schList = HIU_DATA.scholarships.map(s => `🌟 **${s.title}**\n   _${s.condition}_`).join("\n\n");
    return {
      text: `🎁 **Chính sách Học bổng Trường Đại học Quốc tế Hồng Bàng (HIU):**\n\n${schList}\n\n` +
            `👉 Quỹ học bổng HIU lên đến hàng chục tỷ đồng nhằm khuyến khích sinh viên tài năng và đồng hành cùng phụ huynh.`,
      quickReplies: ["Làm sao nhận học bổng 100%?", "Học phí 2026", "Tư vấn hồ sơ học bổng"]
    };
  }

  // 8. Địa chỉ / Cơ sở
  if (msg.includes("địa chỉ") || msg.includes("cơ sở") || msg.includes("ở đâu") || msg.includes("campus") || msg.includes("con tàu tri thức")) {
    let campuses = HIU_DATA.university.campuses.map(c => `📍 **${c.name}:**\n   - Địa chỉ: ${c.address}\n   - Điểm nhấn: ${c.highlight}`).join("\n\n");
    return {
      text: `🏫 **Hệ thống cơ sở đào tạo của HIU:**\n\n${campuses}\n\n` +
            `🚢 Tòa nhà **"Con tàu tri thức"** tại số 215 Điện Biên Phủ, P.15, Q. Bình Thạnh là biểu tượng kiến trúc đại học hiện đại nổi tiếng bậc nhất TP.HCM.`,
      quickReplies: ["Đặt lịch tham quan trường", "Cơ sở vật chất", "Gặp tư vấn viên"]
    };
  }

  // 9. Liên hệ, hotline, tư vấn viên người thật
  if (msg.includes("liên hệ") || msg.includes("hotline") || msg.includes("số điện thoại") || msg.includes("gặp tư vấn viên") || msg.includes("tư vấn viên") || msg.includes("zalo") || msg.includes("tổng đài")) {
    return {
      text: `📞 **Kênh liên hệ Trung tâm Tuyển sinh & Truyền thông HIU:**\n\n` +
            `• **Hotline / Zalo tư vấn:** ${HIU_DATA.university.hotlines.join(" - ")}\n` +
            `• **Email:** ${HIU_DATA.university.email}\n` +
            `• **Cơ sở 1:** 215 Điện Biên Phủ, P.15, Q. Bình Thạnh, TP.HCM\n` +
            `• **Cơ sở 2:** 120 Hòa Bình, P. Hòa Thạnh, Q. Tân Phú, TP.HCM\n\n` +
            `Chúng tôi đã ghi nhận số điện thoại **${userProfile.phone}** của bạn **${userProfile.name}** (Mã: ${userProfile.studentId}). Chuyên viên tư vấn tuyển sinh HIU sẽ liên hệ hỗ trợ bạn trong ít phút!`,
      quickReplies: ["Học phí", "Phương thức xét tuyển", "Học bổng"]
    };
  }

  // 10. Ký túc xá / Đời sống sinh viên / Câu lạc bộ
  if (msg.includes("ký túc xá") || msg.includes("ktx") || msg.includes("câu lạc bộ") || msg.includes("clb") || msg.includes("hoạt động")) {
    return {
      text: `🏢 **Đời sống sinh viên & Tiện ích tại HIU:**\n\n` +
            `• **Ký túc xá & Chỗ ở:** HIU liên kết với KTX Đại học Quốc gia và hỗ trợ mạng lưới phòng trọ an toàn, giá tốt gần trường cho sinh viên ở tỉnh.\n` +
            `• **Câu lạc bộ (CLB):** Hơn 30 CLB năng động từ học thuật, văn nghệ, thể thao (HIU Dance Club, Âm nhạc, CLB Y Dược trẻ, CLB Tiếng Anh, CLB Taekwondo...).\n` +
            `• **Cơ sở vật chất:** Phòng gym, sân bóng đá, cà phê sân thượng, thư viện số đa phương tiện.`,
      quickReplies: ["Học phí", "Khối ngành đào tạo", "Địa chỉ trường"]
    };
  }

  // Default Fallback
  return {
    text: `Cảm ơn bạn **${userProfile.name}** đã đặt câu hỏi!\n\n` +
          `Về nội dung *"_${message}_"*, hệ thống đã chuyển tiếp thông tin của bạn đến Chuyên viên tư vấn HIU. Chuyên viên sẽ gọi đến SĐT **${userProfile.phone}** để giải đáp chi tiết nhất cho bạn.\n\n` +
          `Trong lúc chờ đợi, bạn có thể tham khảo nhanh các chủ đề đang được quan tâm nhiều nhất dưới đây:`,
    quickReplies: ["Học phí 2026", "Phương thức xét tuyển", "Khối ngành Sức khỏe", "Chính sách Học bổng", "Hotline tư vấn"]
  };
}
