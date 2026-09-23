/**
 * Logic điều khiển Chatbox Trường Đại học Quốc tế Hồng Bàng (HIU)
 * Quản lý quy trình: Thu thập Họ tên, MSSV, SĐT -> Khởi tạo phiên chat -> Trò chuyện AI
 */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const chatTrigger = document.getElementById("hiuChatTrigger");
  const chatContainer = document.getElementById("hiuChatboxContainer");
  const chatCloseBtn = document.getElementById("chatCloseBtn");
  const chatMinimizeBtn = document.getElementById("chatMinimizeBtn");
  const unreadBadge = document.getElementById("chatUnreadBadge");

  // Views
  const onboardingView = document.getElementById("onboardingView");
  const activeChatView = document.getElementById("activeChatView");

  // Onboarding Form Elements
  const onboardForm = document.getElementById("hiuOnboardForm");
  const inputName = document.getElementById("inputFullName");
  const inputMssv = document.getElementById("inputMssv");
  const inputMajorClass = document.getElementById("inputMajorClass");
  const inputStudentEmail = document.getElementById("inputStudentEmail");
  const inputPersonalEmail = document.getElementById("inputPersonalEmail");
  const inputPhone = document.getElementById("inputPhone");
  const formErrorAlert = document.getElementById("formErrorAlert");

  // Active Chat Elements
  const userDisplayTag = document.getElementById("userDisplayTag");
  const chatMessages = document.getElementById("chatMessages");
  const chatInput = document.getElementById("chatInput");
  const btnSend = document.getElementById("btnChatSend");

  // Chat Inquiry Box (Vấn đề đang gặp & Đính kèm nhiều hình ảnh)
  const chatIssueSelect = document.getElementById("chatIssueSelect");
  const issueMandatoryHint = document.getElementById("issueMandatoryHint");
  const btnAttachImage = document.getElementById("btnAttachImage");
  const chatImageInput = document.getElementById("chatImageInput");
  const imagePreviewBar = document.getElementById("imagePreviewBar");
  const previewThumbsContainer = document.getElementById("previewThumbsContainer");
  const previewFileName = document.getElementById("previewFileName");
  const btnAddMoreImages = document.getElementById("btnAddMoreImages");
  const btnClearAllImages = document.getElementById("btnClearAllImages");
  const attachBadgeDot = document.getElementById("attachBadgeDot");
  const imageLightbox = document.getElementById("imageLightbox");
  const imageLightboxImg = document.getElementById("imageLightboxImg");
  const mediaLightboxVideo = document.getElementById("mediaLightboxVideo");

  // Issue Dictionary 
  const ISSUE_LABELS = {
    "portal": "Gặp sự cố truy cập student.hiu.vn / OneUni",
    "office365": "Quên mật khẩu đăng nhập Office 365",
    "authenticator": "Vấn đề ứng dụng xác thực (Authenticator) / đổi thiết bị",
    "teams": "Sự cố sử dụng Microsoft Teams"
  };

  // State
  let currentUser = null;
  let chatHistory = [];
  let isTyping = false;
  let attachedMedia = []; // Danh sách tệp đính kèm (Ảnh & Video): [{ dataUrl, name, size, type: 'image'|'video' }, ...]
  let attachedImages = []; // Giữ đồng bộ cho tương thích ngược

  // -------------------------------------------------------------
  // 1. Storage & State Initialization
  // -------------------------------------------------------------
  function loadSavedSession() {
    // Mỗi lần load lại trang hay vào lại trang web đều xoá và làm mới từ đầu
    clearSession();
    // Đảm bảo xoá sạch nếu trình duyệt cố tình tự khôi phục form sau khi render
    setTimeout(() => {
      wipeAllInputs();
    }, 100);
  }

  function saveSession() {
    // Không lưu phiên làm việc vào storage qua các lần reload
    // Phiếu hỗ trợ đã được lưu độc lập, an toàn và vĩnh viễn trong CSDL HIUDatabase
  }

  function wipeAllInputs() {
    try {
      if (onboardForm) onboardForm.reset();
    } catch (e) {}
    if (inputName) inputName.value = "";
    if (inputMssv) inputMssv.value = "";
    if (inputMajorClass) inputMajorClass.value = "";
    if (inputStudentEmail) inputStudentEmail.value = "";
    if (inputPersonalEmail) inputPersonalEmail.value = "";
    if (inputPhone) inputPhone.value = "";
    if (chatInput) chatInput.value = "";
    if (chatIssueSelect) chatIssueSelect.selectedIndex = 0;
    randomizeInputNames();
  }

  // Gán ngẫu nhiên thuộc tính name để triệt tiêu việc trình duyệt tự ý gợi ý thông tin cũ từ các tab khác
  function randomizeInputNames() {
    const fields = [
      inputName,
      inputMssv,
      inputMajorClass,
      inputStudentEmail,
      inputPersonalEmail,
      inputPhone,
      chatInput
    ];
    fields.forEach((field) => {
      if (field) {
        const randKey = "hiu_fld_" + Math.random().toString(36).slice(2, 9);
        field.setAttribute("name", randKey);
        field.setAttribute("autocomplete", "new-password");
        field.setAttribute("data-lpignore", "true");
      }
    });
  }

  function clearSession() {
    try {
      localStorage.removeItem("hiu_chat_user");
      localStorage.removeItem("hiu_chat_history");
      sessionStorage.removeItem("hiu_chat_user");
      sessionStorage.removeItem("hiu_chat_history");
    } catch (e) {}
    currentUser = null;
    chatHistory = [];
    clearAttachedImages();
    wipeAllInputs();
    if (chatMessages) chatMessages.innerHTML = "";
    if (userDisplayTag) userDisplayTag.innerHTML = "";
    if (formErrorAlert) {
      formErrorAlert.textContent = "";
      formErrorAlert.style.display = "none";
    }
    if (chatContainer) chatContainer.classList.remove("active");
    showOnboardingView();
  }

  // -------------------------------------------------------------
  // 2. Chatbox Toggle (Open/Close)
  // -------------------------------------------------------------
  function toggleChatbox(forceOpen = null) {
    const shouldOpen = forceOpen !== null ? forceOpen : !chatContainer.classList.contains("active");
    if (shouldOpen) {
      chatContainer.classList.add("active");
      if (unreadBadge) unreadBadge.style.display = "none";
      
      // Auto focus input
      setTimeout(() => {
        if (currentUser && chatInput) {
          chatInput.focus();
        } else if (inputName) {
          inputName.focus();
        }
      }, 300);
    } else {
      chatContainer.classList.remove("active");
    }
  }

  if (chatTrigger) chatTrigger.addEventListener("click", () => toggleChatbox());
  if (chatCloseBtn) chatCloseBtn.addEventListener("click", () => toggleChatbox(false));
  if (chatMinimizeBtn) chatMinimizeBtn.addEventListener("click", () => toggleChatbox(false));

  // Global trigger function for buttons on website
  window.openHIUChat = function() {
    toggleChatbox(true);
  };

  // -------------------------------------------------------------
  // Helper: Kiểm tra lỗi chính tả Họ và tên tiếng Việt
  // -------------------------------------------------------------
  function validateVietnameseFullName(nameStr) {
    if (!nameStr || !nameStr.trim()) {
      return { valid: false, message: "Vui lòng nhập đầy đủ Họ và tên." };
    }

    const raw = nameStr.trim().replace(/\s+/g, " ");

    // 1. Không được chứa số
    if (/\d/.test(raw)) {
      return { valid: false, message: "Họ và tên không được chứa chữ số. Vui lòng chỉ nhập chữ cái." };
    }

    // 2. Không được chứa ký tự đặc biệt (cho phép chữ cái Unicode tiếng Việt, khoảng trắng, và dấu nháy đơn)
    const specialCharsRegex = /[^\p{L}\s']/u;
    if (specialCharsRegex.test(raw)) {
      return { valid: false, message: "Họ và tên không được chứa ký tự đặc biệt. Vui lòng chỉ nhập chữ cái tiếng Việt." };
    }

    // 3. Tối thiểu 3 từ (Họ, tên đệm và tên)
    const words = raw.split(" ").filter(Boolean);
    if (words.length < 3) {
      return { valid: false, message: "Vui lòng nhập đầy đủ cả Họ, tên đệm và tên (tối thiểu 3 từ, ví dụ: Nguyễn Văn An)." };
    }

    // 4. Bắt buộc phải có dấu tiếng Việt (tránh nhập tiếng Việt không dấu)
    const vnDiacriticsRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ]/i;
    if (!vnDiacriticsRegex.test(raw)) {
      return { 
        valid: false, 
        message: "Họ và tên bắt buộc phải nhập bằng tiếng Việt có dấu đầy đủ và đúng chính tả (Ví dụ: Nguyễn Văn An)." 
      };
    }

    // 5. Kiểm tra các ký tự lạ không thuộc bảng chữ cái tiếng Việt (f, j, w, z) - thường do lỗi gõ Telex
    const foreignChars = raw.match(/[fjwzFJWZ]/g);
    if (foreignChars) {
      const uniqueChars = [...new Set(foreignChars.map(c => c.toUpperCase()))].join(", ");
      return { 
        valid: false, 
        message: `Họ và tên chứa ký tự "${uniqueChars}" không thuộc bảng chữ cái tiếng Việt (thường do lỗi bộ gõ Telex như w, f, j, z). Vui lòng kiểm tra lại!` 
      };
    }

    // Tập nguyên âm tiếng Việt (có dấu và không dấu)
    const vnVowelsPattern = /[aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ]/i;

    // Ký tự lặp bất thường: phụ âm lặp đôi (bb, cc, dd, ff, gg, hh, kk, ll, mm, nn, pp, rr, ss, tt, vv, xx)
    const doubleConsonantsRegex = /([b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z])\1/i;
    // Chuỗi gõ Telex dính phím chưa hoàn thành (aa, ee, oo, aw, ow, uw, dd)
    const rawTelexVowels = /(aa|aw|ee|oo|ow|uw|dd)/i;

    // 6. Kiểm tra từng từ (âm tiết)
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const cleanWord = word.replace(/['’]/g, "");

      // A. Không được viết tắt (từ chỉ gồm 1 chữ cái phụ âm)
      if (cleanWord.length === 1 && !vnVowelsPattern.test(cleanWord)) {
        return { 
          valid: false, 
          message: `Từ "${word}" bị viết tắt. Vui lòng nhập đầy đủ cả Họ, tên đệm và tên, không viết tắt (Ví dụ: Nguyễn Văn An)!` 
        };
      }

      // B. Mỗi từ bắt buộc phải có nguyên âm tiếng Việt
      if (!vnVowelsPattern.test(cleanWord)) {
        return { 
          valid: false, 
          message: `Từ "${word}" sai chính tả tiếng Việt (thiếu nguyên âm hợp lệ). Vui lòng nhập đúng họ và tên có dấu!` 
        };
      }

      // C. Lặp phụ âm bất thường (nn, tt, dd...)
      const doubleMatch = cleanWord.match(doubleConsonantsRegex);
      if (doubleMatch) {
        return { 
          valid: false, 
          message: `Từ "${word}" bị lặp ký tự "${doubleMatch[0]}" sai chính tả. Vui lòng kiểm tra lại bộ gõ tiếng Việt!` 
        };
      }

      // D. Ký tự gõ Telex chưa hoàn thành (aa, ee, oo, aw, ow, uw...)
      const telexMatch = cleanWord.match(rawTelexVowels);
      if (telexMatch) {
        return { 
          valid: false, 
          message: `Từ "${word}" chứa ký tự gõ Telex chưa hoàn thành "${telexMatch[0]}". Vui lòng bật bộ gõ tiếng Việt có dấu!` 
        };
      }

      // E. Âm cuối (coda) hợp lệ trong tiếng Việt (kết thúc bằng nguyên âm hoặc c, ch, m, n, ng, nh, p, t; ngoại lệ họ Ksor)
      const isKsor = cleanWord.toLowerCase() === "ksor";
      let isEndingValid = false;
      if (isKsor) {
        isEndingValid = true;
      } else if (vnVowelsPattern.test(cleanWord.slice(-1))) {
        isEndingValid = true;
      } else if (/(ch|nh|ng)$/i.test(cleanWord)) {
        isEndingValid = true;
      } else if (/[cmnptCMNPT]$/i.test(cleanWord)) {
        isEndingValid = true;
      }

      if (!isEndingValid) {
        const lastChar = cleanWord.slice(-1).toUpperCase();
        return { 
          valid: false, 
          message: `Từ "${word}" bị sai chính tả ở âm cuối (kết thúc bằng "${lastChar}"). Vui lòng kiểm tra lại dấu tiếng Việt!` 
        };
      }

      // F. Quy tắc chính tả danh từ riêng: Chữ cái đầu mỗi từ bắt buộc phải viết hoa
      const firstChar = cleanWord.charAt(0);
      const restChars = cleanWord.slice(1);
      if (firstChar !== firstChar.toUpperCase() || firstChar === firstChar.toLowerCase()) {
        return { 
          valid: false, 
          message: `Họ và tên là danh từ riêng, từ "${word}" phải viết hoa chữ cái đầu (Ví dụ: Nguyễn Văn An)!` 
        };
      }

      // Chữ cái tiếp theo không được viết hoa lộn xộn
      const isAllUpper = cleanWord === cleanWord.toUpperCase();
      const isTitle = firstChar === firstChar.toUpperCase() && restChars === restChars.toLowerCase();
      if (!isTitle && !isAllUpper) {
        return { 
          valid: false, 
          message: `Từ "${word}" viết hoa không đúng quy tắc chính tả. Vui lòng viết đúng dạng chuẩn (Ví dụ: Nguyễn Văn An)!` 
        };
      }
    }

    // Chuẩn hoá họ tên về Title Case chuẩn mực (ví dụ: NGUYỄN VĂN AN -> Nguyễn Văn An)
    const normalized = words.map(w => {
      if (/^[hH]'/i.test(w)) {
        return "H'" + w.slice(2).charAt(0).toUpperCase() + w.slice(3).toLowerCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(" ");

    return { valid: true, normalizedName: normalized };
  }

  if (inputName) {
    inputName.addEventListener("blur", () => {
      if (inputName.value) {
        inputName.value = inputName.value.replace(/\s+/g, " ").trim();
      }
    });
  }

  // -------------------------------------------------------------
  // Danh mục ngành đào tạo chính thức tại Đại học Quốc tế Hồng Bàng (HIU)
  // và Bộ kiểm tra lỗi ghi sai tên ngành
  // -------------------------------------------------------------
  const HIU_MAJORS = [
    // Khối Sức Khỏe
    {
      name: "Y khoa",
      abbr: "YK",
      aliases: ["y khoa", "y da khoa", "y đa khoa", "bác sĩ đa khoa", "bac si da khoa", "bac si", "bác sĩ", "y", "yk", "ydk"],
      keywords: ["y khoa", "y"]
    },
    {
      name: "Răng Hàm Mặt",
      abbr: "RHM",
      aliases: ["răng hàm mặt", "rang ham mat", "răng - hàm - mặt", "rang - ham - mat", "rhm", "nha khoa", "bác sĩ răng hàm mặt", "bac si rang ham mat"],
      keywords: ["răng", "hàm", "mặt", "nha khoa", "rhm"]
    },
    {
      name: "Dược học",
      abbr: "DH",
      aliases: ["dược học", "duoc hoc", "dược", "duoc", "dược sĩ", "duoc si", "dược sĩ đại học", "dh", "ds"],
      keywords: ["dược", "duoc", "dh"]
    },
    {
      name: "Điều dưỡng",
      abbr: "ĐD",
      aliases: ["điều dưỡng", "dieu duong", "điều dưỡng đa khoa", "dd", "đd"],
      keywords: ["điều dưỡng", "dieu duong"]
    },
    {
      name: "Kỹ thuật Phục hồi chức năng",
      abbr: "PHCN",
      aliases: ["phục hồi chức năng", "phuc hoi chuc nang", "kỹ thuật phục hồi chức năng", "ky thuat phuc hoi chuc nang", "vật lý trị liệu", "vat ly tri lieu", "phcn", "vltl"],
      keywords: ["phục hồi chức năng", "phcn"]
    },
    {
      name: "Kỹ thuật Xét nghiệm y học",
      abbr: "XNYH",
      aliases: ["xét nghiệm y học", "xet nghiem y hoc", "kỹ thuật xét nghiệm y học", "ky thuat xet nghiem y hoc", "xét nghiệm", "xet nghiem", "xnyh", "ktxn", "xn"],
      keywords: ["xét nghiệm", "xet nghiem", "xnyh"]
    },
    {
      name: "Y học cổ truyền",
      abbr: "YHCT",
      aliases: ["y học cổ truyền", "y hoc co truyen", "yhct", "đông y", "dong y"],
      keywords: ["y học cổ truyền", "yhct"]
    },

    // Khối Kinh Tế - Quản Trị
    {
      name: "Quản trị kinh doanh",
      abbr: "QTKD",
      aliases: ["quản trị kinh doanh", "quan tri kinh doanh", "qtkd", "bba", "kinh doanh"],
      keywords: ["quản trị kinh doanh", "qtkd"]
    },
    {
      name: "Marketing",
      abbr: "MKT",
      aliases: ["marketing", "digital marketing", "tiếp thị", "tiep thi", "mkt", "mar"],
      keywords: ["marketing", "mkt"]
    },
    {
      name: "Logistics & Quản lý chuỗi cung ứng",
      abbr: "LOG",
      aliases: ["logistics", "logistics và quản lý chuỗi cung ứng", "logistics va quan ly chuoi cung ung", "chuỗi cung ứng", "chuoi cung ung", "log", "logistics & quản lý chuỗi cung ứng"],
      keywords: ["logistics", "chuỗi cung ứng"]
    },
    {
      name: "Tài chính - Ngân hàng",
      abbr: "TCNH",
      aliases: ["tài chính ngân hàng", "tai chinh ngan hang", "tài chính - ngân hàng", "tai chinh - ngan hang", "tài chính", "tai chinh", "ngân hàng", "ngan hang", "tcnh", "fintech", "công nghệ tài chính"],
      keywords: ["tài chính", "ngân hàng", "tcnh", "fintech"]
    },
    {
      name: "Thương mại điện tử",
      abbr: "TMĐT",
      aliases: ["thương mại điện tử", "thuong mai dien tu", "tmđt", "tmdt", "e-commerce", "ecommerce"],
      keywords: ["thương mại điện tử", "tmđt", "tmdt"]
    },
    {
      name: "Kế toán",
      abbr: "KT",
      aliases: ["kế toán", "ke toan", "kiểm toán", "kiem toan", "kế toán kiểm toán", "ke toan kiem toan"],
      keywords: ["kế toán", "kiểm toán"]
    },
    {
      name: "Quản trị khách sạn",
      abbr: "QTKS",
      aliases: ["quản trị khách sạn", "quan tri khach san", "khách sạn", "khach san", "qtks", "hospitality"],
      keywords: ["khách sạn", "qtks"]
    },
    {
      name: "Quản trị dịch vụ du lịch và lữ hành",
      abbr: "QTDL",
      aliases: ["quản trị du lịch", "quan tri du lich", "du lịch", "du lich", "lữ hành", "lu hanh", "qtdl"],
      keywords: ["du lịch", "lữ hành", "qtdl"]
    },

    // Khối Kỹ Thuật & Công Nghệ
    {
      name: "Công nghệ thông tin",
      abbr: "CNTT",
      aliases: ["công nghệ thông tin", "cong nghe thong tin", "cntt", "it", "tin học", "tin hoc", "khoa học máy tính", "kỹ thuật phần mềm"],
      keywords: ["công nghệ thông tin", "cntt", "it"]
    },
    {
      name: "Trí tuệ nhân tạo",
      abbr: "AI",
      aliases: ["trí tuệ nhân tạo", "tri tue nhan tao", "ai", "ttnt", "khoa học dữ liệu", "khoa hoc du lieu", "data science"],
      keywords: ["trí tuệ nhân tạo", "ai", "ttnt"]
    },
    {
      name: "Kỹ thuật Y sinh",
      abbr: "KTYS",
      aliases: ["kỹ thuật y sinh", "ky thuat y sinh", "y sinh", "y sinh tiên tiến", "ktys", "biomedical"],
      keywords: ["kỹ thuật y sinh", "y sinh", "ktys"]
    },
    {
      name: "Thiết kế đồ họa",
      abbr: "TKĐH",
      aliases: ["thiết kế đồ họa", "thiet ke do hoa", "đồ họa", "do hoa", "tkđh", "tkdh", "đồ họa kỹ thuật số", "graphic design"],
      keywords: ["thiết kế đồ họa", "đồ họa", "tkđh", "tkdh"]
    },
    {
      name: "Kỹ thuật Xây dựng",
      abbr: "KTXD",
      aliases: ["kỹ thuật xây dựng", "ky thuat xay dung", "xây dựng", "xay dung", "ktxd", "công trình"],
      keywords: ["xây dựng", "ktxd"]
    },
    {
      name: "Kiến trúc",
      abbr: "KT",
      aliases: ["kiến trúc", "kien truc", "kiến trúc sư", "kien truc su"],
      keywords: ["kiến trúc"]
    },
    {
      name: "Công nghệ kỹ thuật điện, điện tử",
      abbr: "ĐTVT",
      aliases: ["điện điện tử", "dien dien tu", "kỹ thuật điện", "ky thuat dien", "điện tử", "dien tu", "ktdt", "đtvt"],
      keywords: ["điện tử", "kỹ thuật điện"]
    },

    // Khối Ngôn Ngữ & Quốc Tế
    {
      name: "Ngôn ngữ Anh",
      abbr: "NNA",
      aliases: ["ngôn ngữ anh", "ngon ngu anh", "tiếng anh", "tieng anh", "anh văn", "anh van", "nna", "english"],
      keywords: ["ngôn ngữ anh", "tiếng anh", "nna"]
    },
    {
      name: "Ngôn ngữ Hàn Quốc",
      abbr: "NNHQ",
      aliases: ["ngôn ngữ hàn quốc", "ngon ngu han quoc", "ngôn ngữ hàn", "ngon ngu han", "tiếng hàn", "tieng han", "hàn quốc học", "han quoc hoc", "nnhq", "korean"],
      keywords: ["ngôn ngữ hàn", "tiếng hàn", "hàn quốc học", "nnhq"]
    },
    {
      name: "Ngôn ngữ Trung Quốc",
      abbr: "NNTQ",
      aliases: ["ngôn ngữ trung quốc", "ngon ngu trung quoc", "ngôn ngữ trung", "ngon ngu trung", "tiếng trung", "tieng trung", "trung quốc học", "trung quoc hoc", "nntq", "chinese"],
      keywords: ["ngôn ngữ trung", "tiếng trung", "trung quốc học", "nntq"]
    },
    {
      name: "Ngôn ngữ Nhật Bản",
      abbr: "NNNB",
      aliases: ["ngôn ngữ nhật bản", "ngon ngu nhat ban", "ngôn ngữ nhật", "ngon ngu nhat", "tiếng nhật", "tieng nhat", "nhật bản học", "nhat ban hoc", "nnnb", "japanese"],
      keywords: ["ngôn ngữ nhật", "tiếng nhật", "nhật bản học", "nnnb"]
    },

    // Khối Khoa học Xã hội & Luật
    {
      name: "Luật",
      abbr: "Luật",
      aliases: ["luật", "luat", "luật học", "luat hoc"],
      keywords: ["luật"]
    },
    {
      name: "Luật kinh tế",
      abbr: "LKT",
      aliases: ["luật kinh tế", "luat kinh te", "lkt"],
      keywords: ["luật kinh tế", "lkt"]
    },
    {
      name: "Quan hệ quốc tế",
      abbr: "QHQT",
      aliases: ["quan hệ quốc tế", "quan he quoc te", "qhqt", "ngoại giao", "ngoai giao"],
      keywords: ["quan hệ quốc tế", "qhqt"]
    },
    {
      name: "Tâm lý học",
      abbr: "TLH",
      aliases: ["tâm lý học", "tam ly hoc", "tâm lý", "tam ly", "tlh"],
      keywords: ["tâm lý học", "tâm lý", "tlh"]
    },
    {
      name: "Truyền thông đa phương tiện",
      abbr: "TTĐPT",
      aliases: ["truyền thông đa phương tiện", "truyen thong da phuong tien", "truyền thông", "truyen thong", "ttđpt", "ttdpt"],
      keywords: ["truyền thông đa phương tiện", "truyền thông", "ttđpt"]
    },
    {
      name: "Quản lý thể dục thể thao",
      abbr: "TDTT",
      aliases: ["quản lý thể dục thể thao", "quan ly the duc the thao", "thể dục thể thao", "the duc the thao", "tdtt"],
      keywords: ["thể dục thể thao", "tdtt"]
    }
  ];

  function removeVietnameseTones(str) {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  // Damerau-Levenshtein Distance (hỗ trợ phát hiện hoán vị 2 ký tự liền kề như YCHT -> YHCT)
  function damerauLevenshteinDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const m = s1.length;
    const n = s2.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,       // deletion
          dp[i][j - 1] + 1,       // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
        // Transposition
        if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
          dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
        }
      }
    }
    return dp[m][n];
  }

  function parseMajorAndClass(input) {
    if (!input || !input.trim()) {
      return { valid: false, message: "Vui lòng nhập thông tin Ngành và Lớp học (Ví dụ: YHCT - KY26QĐV-YC4)." };
    }

    let raw = input.trim().replace(/\s+/g, " ");

    // Xóa tiền tố nếu sinh viên gõ "Ngành ... - Lớp ..."
    let cleaned = raw.replace(/^ngành\s+/i, "").replace(/^nganh\s+/i, "");

    let majorPart = "";
    let classPart = "";

    // 1. Phân tách bằng các dấu phân cách phổ biến (-, /, ,, _, |, từ "lớp")
    if (/[-/,|_]/.test(cleaned)) {
      const parts = cleaned.split(/[-/,|_]/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const classRegex = /^[0-9]{2}[A-Za-z0-9]+$/;
        if (classRegex.test(parts[0]) && !classRegex.test(parts[1])) {
          classPart = parts[0];
          majorPart = parts.slice(1).join(" - ");
        } else {
          majorPart = parts[0];
          classPart = parts.slice(1).join(" - ");
        }
      } else if (parts.length === 1) {
        majorPart = parts[0];
      }
    } else if (/\s+(lớp|lop|khoá|khoa|k)\s+/i.test(cleaned)) {
      const splitMatch = cleaned.split(/\s+(?:lớp|lop|khoá|khoa|k)\s+/i);
      majorPart = splitMatch[0].trim();
      classPart = splitMatch.slice(1).join(" ").trim();
    } else {
      // 2. Không có dấu phân cách: Tìm token mã lớp
      const tokens = cleaned.split(" ");
      if (tokens.length >= 2) {
        const lastToken = tokens[tokens.length - 1];
        if (/^[0-9]{2}[A-Za-z0-9]+$/i.test(lastToken) || /^[A-Za-z]{2,6}[0-9]{2,4}$/i.test(lastToken)) {
          classPart = lastToken;
          majorPart = tokens.slice(0, tokens.length - 1).join(" ");
        } else {
          majorPart = cleaned;
        }
      } else {
        if (/^[0-9]{2}[A-Za-z0-9]+$/i.test(cleaned)) {
          classPart = cleaned;
        } else {
          majorPart = cleaned;
        }
      }
    }

    return { majorPart: majorPart.trim(), classPart: classPart.trim(), original: raw };
  }

  function validateHIUMajorClass(inputMajorClass) {
    const parsed = parseMajorAndClass(inputMajorClass);
    if (!parsed.valid && parsed.message) {
      return parsed;
    }

    const { majorPart, classPart } = parsed;

    // 1. Kiểm tra thiếu tên ngành
    if (!majorPart) {
      return {
        valid: false,
        message: `Bạn chưa nhập Tên ngành học. Vui lòng ghi cả Tên ngành và Lớp (Ví dụ: YHCT - ${classPart || 'KY26QĐV-YC4'}).`
      };
    }

    // 2. Kiểm tra thiếu lớp
    if (!classPart) {
      return {
        valid: false,
        message: `Bạn chưa nhập Lớp học. Vui lòng ghi cả Ngành và Lớp theo định dạng: [Ngành] - [Lớp] (Ví dụ: ${majorPart} - KY26QĐV-YC4).`
      };
    }

    // Chuẩn hoá phần tên ngành
    const cleanMajor = majorPart.toLowerCase().replace(/^(ngành|nganh|khoa)\s+/i, "").trim();
    const unaccentedMajor = removeVietnameseTones(cleanMajor);

    // A. Kiểm tra khớp chính xác (Exact match) với tên chuẩn, mã viết tắt hoặc biệt danh
    for (const m of HIU_MAJORS) {
      const isNameMatch = cleanMajor === m.name.toLowerCase();
      const isAbbrMatch = cleanMajor === m.abbr.toLowerCase();
      const isAliasMatch = m.aliases.some(a => cleanMajor === a.toLowerCase());

      if (isNameMatch || isAbbrMatch || isAliasMatch) {
        const displayMajor = isAbbrMatch ? m.abbr : m.name;
        return {
          valid: true,
          major: m.name,
          abbr: m.abbr,
          classCode: classPart.toUpperCase(),
          normalized: `${displayMajor} - ${classPart.toUpperCase()}`
        };
      }
    }

    // B. Kiểm tra khớp khi gõ tiếng Việt không dấu
    for (const m of HIU_MAJORS) {
      const unaccentedName = removeVietnameseTones(m.name);
      const unaccentedAliases = m.aliases.map(a => removeVietnameseTones(a));

      if (unaccentedMajor === unaccentedName || unaccentedAliases.includes(unaccentedMajor)) {
        return {
          valid: false,
          message: `Tên ngành "${majorPart}" chưa có dấu tiếng Việt đầy đủ. Có phải bạn muốn ghi ngành "${m.name}" (${m.abbr}) không? Vui lòng nhập đúng tiếng Việt có dấu!`
        };
      }
    }

    // C. Kiểm tra lỗi chính tả (Fuzzy match với Damerau-Levenshtein)
    let bestMatch = null;
    let highestSim = 0;
    let lowestDist = 999;

    for (const m of HIU_MAJORS) {
      const candidates = [
        { text: m.abbr.toLowerCase(), isAbbr: true, isMain: true },
        { text: m.name.toLowerCase(), isAbbr: false, isMain: true },
        ...m.aliases.map(a => ({ text: a.toLowerCase(), isAbbr: a.length <= 4, isMain: false }))
      ];

      for (const cand of candidates) {
        // 1. Khoảng cách trực tiếp có dấu
        const dist = damerauLevenshteinDistance(cleanMajor, cand.text);
        const maxLen = Math.max(cleanMajor.length, cand.text.length);
        let sim = 1 - (dist / maxLen);

        if (cand.isMain && cand.isAbbr && cleanMajor.length === cand.text.length) {
          sim += 0.08;
        }

        if (sim > highestSim) {
          highestSim = sim;
          lowestDist = dist;
          bestMatch = m;
        }

        // 2. Khoảng cách không dấu
        const unaccentedCand = removeVietnameseTones(cand.text);
        const distUnaccented = damerauLevenshteinDistance(unaccentedMajor, unaccentedCand);
        let simUnaccented = 1 - (distUnaccented / Math.max(unaccentedMajor.length, unaccentedCand.length));

        if (cand.isMain && cand.isAbbr && unaccentedMajor.length === unaccentedCand.length) {
          simUnaccented += 0.08;
        }

        if (simUnaccented > highestSim) {
          highestSim = simUnaccented;
          lowestDist = distUnaccented;
          bestMatch = m;
        }
      }
    }

    // Ngưỡng phát hiện lỗi sai chính tả
    const isShortAbbrTypo = cleanMajor.length <= 5 && lowestDist <= 2 && bestMatch;
    const isNameTypo = highestSim >= 0.60 && bestMatch;

    if (isShortAbbrTypo || isNameTypo) {
      return {
        valid: false,
        message: `Tên ngành "${majorPart}" bị ghi sai chính tả. Có phải bạn muốn ghi ngành "${bestMatch.name}" (${bestMatch.abbr}) không? Vui lòng kiểm tra và sửa lại!`
      };
    }

    // D. Hoàn toàn không khớp với bất kỳ ngành nào của HIU
    return {
      valid: false,
      message: `Tên ngành "${majorPart}" không chính xác hoặc không nằm trong danh mục ngành đào tạo của Trường ĐH Quốc tế Hồng Bàng (HIU). Vui lòng nhập đúng tên ngành (Ví dụ: CNTT, Dược học, Y khoa, Quản trị kinh doanh, Marketing, Răng Hàm Mặt...)!`
    };
  }

  if (inputMajorClass) {
    inputMajorClass.addEventListener("blur", () => {
      if (inputMajorClass.value) {
        inputMajorClass.value = inputMajorClass.value.replace(/\s+/g, " ").trim();
      }
    });
  }

  if (inputStudentEmail) {
    inputStudentEmail.addEventListener("blur", () => {
      if (inputStudentEmail.value) {
        inputStudentEmail.value = inputStudentEmail.value.trim();
      }
    });
  }

  if (inputPersonalEmail) {
    inputPersonalEmail.addEventListener("blur", () => {
      if (inputPersonalEmail.value) {
        inputPersonalEmail.value = inputPersonalEmail.value.trim();
      }
    });
  }

  // -------------------------------------------------------------
  // 3. Onboarding Form Logic (Họ tên, MSSV, Lớp, Email SV, Email nhận tin, SĐT)
  // -------------------------------------------------------------
  if (onboardForm) {
    onboardForm.addEventListener("submit", (e) => {
      e.preventDefault();
      formErrorAlert.style.display = "none";

      const fullName = (inputName ? inputName.value : "").trim();
      const mssv = (inputMssv ? inputMssv.value : "").trim();
      const majorClass = (inputMajorClass ? inputMajorClass.value : "").trim();
      const studentEmail = (inputStudentEmail ? inputStudentEmail.value : "").trim();
      const personalEmail = (inputPersonalEmail ? inputPersonalEmail.value : "").trim();
      const phone = (inputPhone ? inputPhone.value : "").trim();

      // 1. Validate Họ & Tên (Kiểm tra lỗi chính tả tiếng Việt toàn diện)
      const nameValidation = validateVietnameseFullName(fullName);
      if (!nameValidation.valid) {
        showFormError(nameValidation.message);
        inputName.focus();
        return;
      }
      const verifiedFullName = nameValidation.normalizedName;
      if (inputName) inputName.value = verifiedFullName;

      // 2. Validate MSSV (bắt buộc nhập đủ 10 chữ số)
      const mssvRegex = /^\d{10}$/;
      if (!mssvRegex.test(mssv)) {
        showFormError("Mã số sinh viên (MSSV) bắt buộc phải nhập đủ 10 chữ số (Ví dụ: 2211004567).");
        inputMssv.focus();
        return;
      }

      // 3. Validate Ngành - Lớp (Kiểm tra lỗi khi ghi sai tên ngành)
      const majorValidation = validateHIUMajorClass(majorClass);
      if (!majorValidation.valid) {
        showFormError(majorValidation.message);
        if (inputMajorClass) inputMajorClass.focus();
        return;
      }
      const verifiedMajorClass = majorValidation.normalized || majorClass;
      if (inputMajorClass) inputMajorClass.value = verifiedMajorClass;

      // 4. Validate Email sinh viên (Không được viết hoa, không được ghi dấu tiếng Việt, bắt buộc phải nhập đúng chữ sau @ là student.hiu.vn)
      if (/[A-Z]/.test(studentEmail)) {
        showFormError("Email sinh viên không được viết hoa. Vui lòng nhập toàn bộ bằng chữ thường (Ví dụ: 2211004567@student.hiu.vn).");
        if (inputStudentEmail) inputStudentEmail.focus();
        return;
      }

      const vnDiacriticsPattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;
      const nonAsciiPattern = /[^\x00-\x7F]/;
      if (vnDiacriticsPattern.test(studentEmail) || nonAsciiPattern.test(studentEmail)) {
        showFormError("Email sinh viên không được ghi dấu tiếng Việt. Vui lòng nhập địa chỉ email không dấu (Ví dụ: 2211004567@student.hiu.vn).");
        if (inputStudentEmail) inputStudentEmail.focus();
        return;
      }

      const studentEmailParts = studentEmail.split("@");
      if (studentEmailParts.length !== 2 || !studentEmailParts[0].trim()) {
        showFormError("Email sinh viên không hợp lệ. Vui lòng nhập đúng định dạng có @student.hiu.vn (Ví dụ: 2211004567@student.hiu.vn).");
        if (inputStudentEmail) inputStudentEmail.focus();
        return;
      }
      if (!/^[a-z0-9._-]+$/.test(studentEmailParts[0])) {
        showFormError("Email sinh viên chứa ký tự không hợp lệ. Vui lòng nhập đúng định dạng (Ví dụ: 2211004567@student.hiu.vn).");
        if (inputStudentEmail) inputStudentEmail.focus();
        return;
      }
      const studentDomain = studentEmailParts[1].toLowerCase().trim();
      if (studentDomain !== "student.hiu.vn" && studentDomain !== "hiu.vn") {
        showFormError("Email sinh viên bắt buộc phải nhập đúng những chữ sau @ là student.hiu.vn (Ví dụ: 2211004567@student.hiu.vn).");
        if (inputStudentEmail) inputStudentEmail.focus();
        return;
      }

      // 5. Validate Email nhận thông tin (Không được viết hoa, không được ghi dấu tiếng Việt, bắt buộc phải nhập đúng tên miền sau @)
      if (/[A-Z]/.test(personalEmail)) {
        showFormError("Email nhận thông tin không được viết hoa. Vui lòng nhập toàn bộ bằng chữ thường (Ví dụ: abc@gmail.com).");
        if (inputPersonalEmail) inputPersonalEmail.focus();
        return;
      }

      if (vnDiacriticsPattern.test(personalEmail) || nonAsciiPattern.test(personalEmail)) {
        showFormError("Email nhận thông tin không được ghi dấu tiếng Việt. Vui lòng nhập địa chỉ email không dấu (Ví dụ: nguyenvanan@gmail.com).");
        if (inputPersonalEmail) inputPersonalEmail.focus();
        return;
      }

      const personalEmailParts = personalEmail.split("@");
      if (personalEmailParts.length !== 2 || !personalEmailParts[0].trim()) {
        showFormError("Email nhận thông tin không hợp lệ. Vui lòng nhập đúng định dạng email (Ví dụ: abc@gmail.com).");
        if (inputPersonalEmail) inputPersonalEmail.focus();
        return;
      }
      if (!/^[a-z0-9._%+-]+$/.test(personalEmailParts[0])) {
        showFormError("Email nhận thông tin chứa ký tự không hợp lệ. Vui lòng nhập đúng định dạng (Ví dụ: abc@gmail.com).");
        if (inputPersonalEmail) inputPersonalEmail.focus();
        return;
      }
      const personalDomain = personalEmailParts[1].toLowerCase().trim();
      const validDomainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
      if (!validDomainRegex.test(personalDomain)) {
        showFormError("Email nhận thông tin bắt buộc phải nhập đúng tên miền sau @ (Ví dụ: @gmail.com, @outlook.com).");
        if (inputPersonalEmail) inputPersonalEmail.focus();
        return;
      }

      // Không cho phép nhập email sinh viên trường (@student.hiu.vn hoặc @hiu.vn) vào ô Email nhận tin cá nhân
      if (personalDomain === "student.hiu.vn" || personalDomain === "hiu.vn" || personalDomain.endsWith(".hiu.vn")) {
        showFormError("Email nhận tin phải là email cá nhân (như @gmail.com, @outlook.com...), không được nhập lại email trường (@student.hiu.vn)!");
        if (inputPersonalEmail) inputPersonalEmail.focus();
        return;
      }

      // Kiểm tra phát hiện các lỗi sai chính tả phổ biến ở tên miền email (đặc biệt là gmail.com)
      const typoDomains = [
        "gamil.com", "gmial.com", "gmai.com", "gmaill.com", "gmeil.com", "gmal.com",
        "gamil.vn", "gmial.vn", "gmai.vn", "gmaill.vn", "gmil.com", "gnail.com",
        "hotmial.com", "hotmai.com", "outlok.com", "outloo.com"
      ];
      if (typoDomains.includes(personalDomain)) {
        let correctSuggest = "gmail.com";
        if (personalDomain.startsWith("hot")) correctSuggest = "hotmail.com";
        if (personalDomain.startsWith("out")) correctSuggest = "outlook.com";
        showFormError(`Tên miền email "@${personalDomain}" bị sai chính tả (phải là @${correctSuggest}). Vui lòng kiểm tra và nhập lại chính xác!`);
        if (inputPersonalEmail) inputPersonalEmail.focus();
        return;
      }
      // Bắt các trường hợp g...mail hoặc g...com cố ý gõ sai dạng gami*, gmia*, gmai*
      if (/^g(am|mi|ma|em)[a-z]*\.(com|vn)$/i.test(personalDomain) && personalDomain !== "gmail.com" && personalDomain !== "gmail.vn") {
        showFormError(`Tên miền email "@${personalDomain}" không đúng định dạng chuẩn (@gmail.com). Vui lòng nhập lại chính xác!`);
        if (inputPersonalEmail) inputPersonalEmail.focus();
        return;
      }

      // 6. Validate Số điện thoại VN
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ""))) {
        showFormError("Số điện thoại không hợp lệ (Cần gồm 10 chữ số, VD: 0938692015).");
        inputPhone.focus();
        return;
      }

      // Thông tin hợp lệ -> Khởi tạo User Profile
      currentUser = {
        name: verifiedFullName,
        studentId: mssv,
        majorClass: verifiedMajorClass,
        studentEmail: studentEmail,
        personalEmail: personalEmail,
        phone: phone,
        isGuest: false,
        createdAt: new Date().toISOString()
      };

      // Hiển thị lời chào khởi đầu nếu chưa có lịch sử
      if (chatHistory.length === 0) {
        initWelcomeMessage();
      }

      saveSession();
      showActiveChatView();
    });
  }

  function showFormError(msg) {
    formErrorAlert.textContent = msg;
    formErrorAlert.style.display = "block";
    formErrorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showOnboardingView() {
    onboardingView.style.display = "flex";
    activeChatView.style.display = "none";
    if (formErrorAlert) formErrorAlert.style.display = "none";
  }

  function showActiveChatView() {
    onboardingView.style.display = "none";
    activeChatView.style.display = "flex";

    // Cập nhật thông tin sinh viên trên thanh trạng thái
    if (userDisplayTag && currentUser) {
      userDisplayTag.innerHTML = `<span>${currentUser.name}</span> (MSSV: <b>${currentUser.studentId}</b> | <b>${currentUser.majorClass}</b>)`;
    }

    renderAllMessages();
    handleIssueChange();
    setTimeout(() => {
      if (chatInput) chatInput.focus();
    }, 200);
  }

  // -------------------------------------------------------------
  // Xử lý Thay đổi Vấn đề & Đính kèm hình ảnh
  // -------------------------------------------------------------
  function handleIssueChange() {
    if (!chatIssueSelect) return;
    if (issueMandatoryHint) issueMandatoryHint.style.display = "none";
    if (chatInput) {
      chatInput.placeholder = "Mô tả chi tiết vấn đề (không bắt buộc)...";
      chatInput.classList.remove("input-error");
    }
  }

  if (chatIssueSelect) {
    chatIssueSelect.addEventListener("change", handleIssueChange);
  }

  // Đính kèm hình ảnh hoặc video vấn đề (cho phép chọn nhiều tệp, không bắt buộc)
  if (btnAttachImage && chatImageInput) {
    btnAttachImage.addEventListener("click", () => {
      chatImageInput.click();
    });

    chatImageInput.addEventListener("change", (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      Array.from(files).forEach(file => {
        const isImg = file.type.startsWith("image/");
        const isVid = file.type.startsWith("video/");

        if (!isImg && !isVid) {
          alert(`Tệp "${file.name}" không hợp lệ. Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP...) hoặc video (MP4, WEBM, MOV...).`);
          return;
        }

        const maxSizeBytes = isVid ? 40 * 1024 * 1024 : 10 * 1024 * 1024;
        const maxLimitLabel = isVid ? "40MB" : "10MB";
        if (file.size > maxSizeBytes) {
          alert(`Tệp "${file.name}" vượt quá dung lượng cho phép (tối đa ${maxLimitLabel}).`);
          return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
          attachedMedia.push({
            dataUrl: evt.target.result,
            name: file.name,
            size: file.size,
            type: isVid ? "video" : "image"
          });
          attachedImages = attachedMedia.filter(m => m.type === "image");
          renderMediaPreviews();
        };
        reader.readAsDataURL(file);
      });

      // Reset value để người dùng có thể chọn tiếp
      chatImageInput.value = "";
    });
  }

  if (btnAddMoreImages && chatImageInput) {
    btnAddMoreImages.addEventListener("click", () => {
      chatImageInput.click();
    });
  }

  if (btnClearAllImages) {
    btnClearAllImages.addEventListener("click", () => {
      clearAttachedMedia();
    });
  }

  window.removeAttachedMedia = function(index) {
    if (index >= 0 && index < attachedMedia.length) {
      attachedMedia.splice(index, 1);
      attachedImages = attachedMedia.filter(m => m.type === "image");
      renderMediaPreviews();
    }
  };
  window.removeAttachedImage = window.removeAttachedMedia;

  function renderMediaPreviews() {
    if (!previewThumbsContainer || !imagePreviewBar) return;

    if (attachedMedia.length === 0) {
      imagePreviewBar.style.display = "none";
      if (attachBadgeDot) {
        attachBadgeDot.style.display = "none";
        attachBadgeDot.textContent = "";
        attachBadgeDot.classList.remove("count");
      }
      previewThumbsContainer.innerHTML = "";
      return;
    }

    imagePreviewBar.style.display = "flex";
    if (attachBadgeDot) {
      attachBadgeDot.style.display = "flex";
      attachBadgeDot.textContent = attachedMedia.length;
      attachBadgeDot.classList.add("count");
    }

    const imgCount = attachedMedia.filter(m => m.type === "image").length;
    const vidCount = attachedMedia.filter(m => m.type === "video").length;

    if (previewFileName) {
      if (attachedMedia.length === 1) {
        previewFileName.textContent = attachedMedia[0].name;
      } else {
        const parts = [];
        if (imgCount > 0) parts.push(`${imgCount} hình ảnh`);
        if (vidCount > 0) parts.push(`${vidCount} video`);
        previewFileName.textContent = `Đã chọn ${parts.join(", ")}`;
      }
    }

    previewThumbsContainer.innerHTML = attachedMedia.map((m, idx) => `
      <div class="preview-thumb-box" title="${m.name} (Bấm xem)" onclick="openMediaLightbox('${m.dataUrl}', '${m.type}')">
        ${m.type === 'video' ? `
          <video src="${m.dataUrl}" muted preload="metadata"></video>
          <div class="thumb-video-icon"><i class="fa-solid fa-play"></i></div>
        ` : `
          <img src="${m.dataUrl}" alt="${m.name}">
        `}
        <button type="button" class="btn-remove-thumb" onclick="event.stopPropagation(); removeAttachedMedia(${idx});" title="Gỡ tệp này">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join("");
  }
  function renderImagePreviews() {
    renderMediaPreviews();
  }

  function clearAttachedMedia() {
    attachedMedia = [];
    attachedImages = [];
    if (chatImageInput) chatImageInput.value = "";
    renderMediaPreviews();
  }
  function clearAttachedImages() {
    clearAttachedMedia();
  }

  window.openMediaLightbox = function(src, type = 'image') {
    if (!imageLightbox) return;
    if (type === 'video') {
      if (imageLightboxImg) imageLightboxImg.style.display = 'none';
      if (mediaLightboxVideo) {
        mediaLightboxVideo.src = src;
        mediaLightboxVideo.style.display = 'block';
        mediaLightboxVideo.play().catch(() => {});
      }
    } else {
      if (mediaLightboxVideo) {
        mediaLightboxVideo.pause();
        mediaLightboxVideo.style.display = 'none';
        mediaLightboxVideo.src = '';
      }
      if (imageLightboxImg) {
        imageLightboxImg.src = src;
        imageLightboxImg.style.display = 'block';
      }
    }
    imageLightbox.style.display = 'flex';
  };
  window.openImageLightbox = function(src) {
    window.openMediaLightbox(src, 'image');
  };
  window.closeMediaLightbox = function() {
    if (mediaLightboxVideo) {
      mediaLightboxVideo.pause();
      mediaLightboxVideo.src = '';
    }
    if (imageLightbox) {
      imageLightbox.style.display = 'none';
    }
  };

  // -------------------------------------------------------------
  // 4. Message Rendering & Helpers
  // -------------------------------------------------------------
  function formatMarkdown(text) {
    if (!text) return "";
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Markdown Links [Text](URL)
    safe = safe.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> $1</a>');

    // Bold **text**
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italic *text* or _text_
    safe = safe.replace(/\*(.*?)\*/g, "<em>$1</em>");
    safe = safe.replace(/_(.*?)_/g, "<em>$1</em>");

    // Bullet points
    safe = safe.replace(/^[•\-*]\s+(.*)$/gm, "<li>$1</li>");
    safe = safe.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

    // Line breaks
    safe = safe.replace(/\n\n/g, "<p></p>").replace(/\n/g, "<br>");
    return safe;
  }

  function formatTime(isoString) {
    const d = isoString ? new Date(isoString) : new Date();
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  function initWelcomeMessage() {
    const welcomeText = 
      `**HỆ THỐNG TIẾP NHẬN HỖ TRỢ - PHÒNG CÔNG NGHỆ THÔNG TIN HIU**\n\n` +
      `Thông tin sinh viên đã xác nhận:\n` +
      `• **Họ và tên:** ${currentUser.name}\n` +
      `• **MSSV:** ${currentUser.studentId}\n` +
      `• **Ngành - Lớp:** ${currentUser.majorClass}\n` +
      `• **Email sinh viên:** ${currentUser.studentEmail}\n` +
      `• **Email nhận tin:** ${currentUser.personalEmail}\n` +
      `• **Số điện thoại:** ${currentUser.phone}\n\n` +
      `Vui lòng chọn danh mục vấn đề bạn đang gặp phải bên dưới, nhập mô tả chi tiết (kèm theo hình ảnh hoặc video sự cố nếu có) và nhấn gửi. Hệ thống sẽ tự động lập phiếu tiếp nhận ngay lập tức!`;

    chatHistory.push({
      sender: "bot",
      text: welcomeText,
      time: new Date().toISOString()
    });
  }

  function renderAllMessages() {
    chatMessages.innerHTML = "";
    chatHistory.forEach(msg => {
      appendMessageDOM(msg, false);
    });
    scrollToBottom();
  }

  function appendMessageDOM(msg, animate = true) {
    const isBot = msg.sender === "bot";
    const wrapper = document.createElement("div");
    wrapper.className = `msg-wrapper ${isBot ? "bot" : "user"}`;

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = isBot ? '<i class="fa-solid fa-graduation-cap"></i>' : '<i class="fa-solid fa-user"></i>';

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";

    let contentHTML = `<div>${formatMarkdown(msg.text)}</div>`;

    // Render attached image(s) if present
    if (msg.images && msg.images.length > 0) {
      contentHTML += `
        <div class="chat-images-gallery">
          ${msg.images.map(img => `
            <div class="chat-attached-image-wrapper" onclick="openMediaLightbox('${img.dataUrl}', 'image')" title="${img.name} (Bấm để xem ảnh phóng to)">
              <img src="${img.dataUrl}" alt="${img.name}">
              <span class="image-zoom-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i> Xem ảnh</span>
            </div>
          `).join("")}
        </div>
      `;
    } else if (msg.imageUrl) {
      contentHTML += `
        <div class="chat-attached-image-wrapper" onclick="openMediaLightbox('${msg.imageUrl}', 'image')" title="Bấm để xem ảnh phóng to">
          <img src="${msg.imageUrl}" alt="${msg.imageName || 'Hình ảnh sự cố'}">
          <span class="image-zoom-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i> Xem ảnh</span>
        </div>
      `;
    }

    // Render attached video(s) if present
    if (msg.videos && msg.videos.length > 0) {
      contentHTML += `
        <div class="chat-videos-gallery">
          ${msg.videos.map(vid => `
            <div class="chat-attached-video-wrapper">
              <video src="${vid.dataUrl}" controls preload="metadata"></video>
              <div class="video-caption-bar">
                <i class="fa-solid fa-video"></i>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${vid.name || 'Video sự cố'}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    } else if (msg.videoUrl) {
      contentHTML += `
        <div class="chat-attached-video-wrapper">
          <video src="${msg.videoUrl}" controls preload="metadata"></video>
          <div class="video-caption-bar">
            <i class="fa-solid fa-video"></i>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${msg.videoName || 'Video sự cố'}</span>
          </div>
        </div>
      `;
    }

    if (msg.ticket) {
      contentHTML += renderTicketCardHTML(msg.ticket);
    }
    contentHTML += `<span class="msg-time">${formatTime(msg.time)}</span>`;

    bubble.innerHTML = contentHTML;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);

    chatMessages.appendChild(wrapper);
    if (animate) scrollToBottom();
  }

  function getDisplayQuestion(ticket) {
    if (!ticket || !ticket.question) return "";
    const q = (ticket.question || "").trim();
    const issue = (ticket.issueLabel || ticket.topic || "").trim();
    if (!q) return "";
    // Nếu nội dung trùng với tên vấn đề (dữ liệu cũ), không ghi lại vấn đề mà coi như để trống
    if (issue && q.toLowerCase() === issue.toLowerCase()) {
      return "";
    }
    // Nếu nội dung có dạng "Tên vấn đề - nội dung chi tiết", chỉ lấy phần nội dung chi tiết
    if (issue && q.toLowerCase().startsWith(issue.toLowerCase() + " - ")) {
      return q.substring(issue.length + 3).trim();
    }
    return q;
  }

  function renderTicketCardHTML(ticket) {
    let imageRow = "";
    const displayQuestion = getDisplayQuestion(ticket);
    const ticketImages = ticket.images || (ticket.imageUrl ? [{ dataUrl: ticket.imageUrl, name: ticket.imageName || 'Hình ảnh sự cố' }] : []);
    if (ticketImages.length > 0) {
      const imgCountText = ticketImages.length === 1 ? (ticketImages[0].name || 'Hình ảnh sự cố') : `${ticketImages.length} hình ảnh`;
      imageRow = `
        <div class="ticket-row">
          <span class="ticket-lbl">Hình ảnh đính kèm:</span>
          <span class="ticket-val" style="color: #16A34A; font-weight: 600;">
            <i class="fa-solid fa-images"></i> Có (${imgCountText})
          </span>
        </div>
        <div class="ticket-thumbnails-row">
          ${ticketImages.map((img, idx) => `
            <div class="ticket-thumb-item" onclick="openImageLightbox('${img.dataUrl}')" title="${img.name || 'Ảnh ' + (idx + 1)} (Bấm để xem phóng to)">
              <img src="${img.dataUrl}" alt="${img.name || 'Hình ảnh'}">
            </div>
          `).join("")}
        </div>
      `;
    } else if (ticket.hasImage || ticket.imageName) {
      imageRow = `
        <div class="ticket-row">
          <span class="ticket-lbl">Hình ảnh đính kèm:</span>
          <span class="ticket-val" style="color: #16A34A; font-weight: 600;"><i class="fa-solid fa-image"></i> Có (${ticket.imageName || 'Hình ảnh sự cố'})</span>
        </div>
      `;
    }

    let videoRow = "";
    const ticketVideos = ticket.videos || (ticket.videoUrl ? [{ dataUrl: ticket.videoUrl, name: ticket.videoName || 'Video sự cố' }] : []);
    if (ticketVideos.length > 0) {
      const vidCountText = ticketVideos.length === 1 ? (ticketVideos[0].name || 'Video sự cố') : `${ticketVideos.length} video`;
      videoRow = `
        <div class="ticket-row">
          <span class="ticket-lbl">Video đính kèm:</span>
          <span class="ticket-val" style="color: #0284C7; font-weight: 600;">
            <i class="fa-solid fa-video"></i> Có (${vidCountText})
          </span>
        </div>
        <div class="ticket-videos-row">
          ${ticketVideos.map((vid, idx) => `
            <div class="ticket-video-item">
              <video src="${vid.dataUrl}" controls preload="metadata"></video>
              <div style="font-size: 0.72rem; color: #64748B; margin-top: 2px;"><i class="fa-solid fa-file-video"></i> ${vid.name || 'Video ' + (idx + 1)}</div>
            </div>
          `).join("")}
        </div>
      `;
    } else if (ticket.hasVideo || ticket.videoName) {
      videoRow = `
        <div class="ticket-row">
          <span class="ticket-lbl">Video đính kèm:</span>
          <span class="ticket-val" style="color: #0284C7; font-weight: 600;"><i class="fa-solid fa-video"></i> Có (${ticket.videoName || 'Video sự cố'})</span>
        </div>
      `;
    }

    return `
      <div class="hiu-ticket-card" id="ticket-${ticket.ticketId}">
        <div class="ticket-header">
          <div class="ticket-brand">
            <i class="fa-solid fa-receipt"></i>
            <span>PHIẾU TIẾP NHẬN HỖ TRỢ</span>
          </div>
        </div>
        <div class="ticket-body">
          <div class="ticket-row">
            <span class="ticket-lbl">Mã phiếu:</span>
            <span class="ticket-val ticket-code">${ticket.ticketId}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">Họ và tên:</span>
            <span class="ticket-val" style="font-weight: 700; color: #0F172A;">${ticket.fullName}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">MSSV:</span>
            <span class="ticket-val" style="font-weight: 700; color: #A51D24;">${ticket.studentId}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">Ngành - Lớp:</span>
            <span class="ticket-val" style="font-weight: 600;">${ticket.majorClass || 'N/A'}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">Email SV:</span>
            <span class="ticket-val">${ticket.studentEmail || 'N/A'}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">Email nhận tin:</span>
            <span class="ticket-val">${ticket.personalEmail || 'N/A'}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">Số điện thoại:</span>
            <span class="ticket-val" style="font-weight: 700;">${ticket.phone}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">Vấn đề:</span>
            <span class="ticket-val" style="color: #0369A1; font-weight: 600;">${ticket.issueLabel || ticket.topic || 'Hỗ trợ CNTT'}</span>
          </div>
          ${imageRow}
          ${videoRow}
          <div class="ticket-row question">
            <span class="ticket-lbl">Nội dung yêu cầu:</span>
            ${displayQuestion ? `
              <div class="ticket-question-box">"${displayQuestion}"</div>
            ` : `
              <div class="ticket-question-box" style="color: #94A3B8; font-style: italic; border-left-color: #CBD5E1;">(Để trống)</div>
            `}
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">Đơn vị nhận:</span>
            <span class="ticket-val" style="color: #A51D24; font-weight: 600;">${ticket.department}</span>
          </div>
          <div class="ticket-row">
            <span class="ticket-lbl">Thời gian lập:</span>
            <span class="ticket-val" style="color: #64748B;">${ticket.createdAt}</span>
          </div>
        </div>
        <div class="ticket-footer ${ticket.status === 'Đã huỷ' ? 'is-cancelled' : ''}" id="ticket-footer-${ticket.ticketId}" ${ticket.status === 'Đã huỷ' ? 'style="justify-content: center;"' : ''}>
          ${ticket.status === "Đã huỷ" ? `
            <span class="ticket-cancelled-pill">
              <i class="fa-solid fa-ban"></i> Đã huỷ phiếu
            </span>
          ` : `
            <span class="ticket-status-pill">
              <i class="fa-solid fa-circle-check"></i> Đã tiếp nhận
            </span>
            <button class="btn-cancel-ticket" type="button" onclick="cancelSupportTicket('${ticket.ticketId}')" title="Huỷ phiếu tiếp nhận hỗ trợ">
              <i class="fa-solid fa-ban"></i> Huỷ lập phiếu
            </button>
          `}
        </div>
      </div>
    `;
  }

  function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;

    const typingWrapper = document.createElement("div");
    typingWrapper.className = "msg-wrapper bot";
    typingWrapper.id = "chatTypingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.innerHTML = '<i class="fa-solid fa-graduation-cap"></i>';

    const bubble = document.createElement("div");
    bubble.className = "typing-bubble";
    bubble.innerHTML = "<span></span><span></span><span></span>";

    typingWrapper.appendChild(avatar);
    typingWrapper.appendChild(bubble);

    chatMessages.appendChild(typingWrapper);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const el = document.getElementById("chatTypingIndicator");
    if (el) el.remove();
    isTyping = false;
  }

  function scrollToBottom() {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 50);
  }

  // -------------------------------------------------------------
  // 5. Sending & Responding (Lập phiếu tiếp nhận ngay)
  // -------------------------------------------------------------
  function handleUserSend(rawText = null) {
    if (!currentUser) {
      showOnboardingView();
      return;
    }

    if (isTyping) return;

    // Vấn đề đang chọn ở thanh câu hỏi
    const issueVal = chatIssueSelect ? chatIssueSelect.value : "portal";
    const issueTitle = ISSUE_LABELS[issueVal] || "Hỗ trợ CNTT";
    const descText = rawText !== null ? rawText.trim() : (chatInput ? chatInput.value.trim() : "");

    if (chatInput) chatInput.classList.remove("input-error");

    // Xây dựng thông điệp hiển thị của sinh viên
    let displayMessage = `**[Vấn đề gặp phải]**: ${issueTitle}`;
    if (descText && descText !== issueTitle) {
      displayMessage += `\n**[Mô tả chi tiết]**: ${descText}`;
    }

    const filesToSend = [...attachedMedia];
    const imagesToSend = filesToSend.filter(f => f.type === 'image');
    const videosToSend = filesToSend.filter(f => f.type === 'video');

    if (filesToSend.length > 0) {
      const parts = [];
      if (imagesToSend.length > 0) {
        if (imagesToSend.length === 1) {
          parts.push(`1 ảnh: ${imagesToSend[0].name}`);
        } else {
          parts.push(`${imagesToSend.length} ảnh (${imagesToSend.map(i => i.name).join(", ")})`);
        }
      }
      if (videosToSend.length > 0) {
        if (videosToSend.length === 1) {
          parts.push(`1 video: ${videosToSend[0].name}`);
        } else {
          parts.push(`${videosToSend.length} video (${videosToSend.map(v => v.name).join(", ")})`);
        }
      }
      displayMessage += `\n📎 _(Đính kèm ${parts.join(" và ")})_`;
    }

    // Reset ô nhập và tệp đính kèm
    if (!rawText && chatInput) chatInput.value = "";
    clearAttachedMedia();
    handleIssueChange();

    // Thêm tin nhắn của sinh viên
    const userMsg = {
      sender: "user",
      text: displayMessage,
      issueType: issueVal,
      issueLabel: issueTitle,
      issueDesc: descText,
      images: imagesToSend,
      imageUrl: imagesToSend.length > 0 ? imagesToSend[0].dataUrl : null,
      imageName: imagesToSend.length > 0 ? imagesToSend[0].name : null,
      hasVideo: videosToSend.length > 0,
      videos: videosToSend,
      videoUrl: videosToSend.length > 0 ? videosToSend[0].dataUrl : null,
      videoName: videosToSend.length > 0 ? videosToSend[0].name : null,
      time: new Date().toISOString()
    };
    chatHistory.push(userMsg);
    appendMessageDOM(userMsg, true);
    saveSession();

    // Giả lập xử lý nhanh (không trễ lâu, lập phiếu ngay)
    showTypingIndicator();

    setTimeout(() => {
      removeTypingIndicator();

      const userProfileForResponse = {
        ...currentUser,
        issueType: issueVal,
        issueLabel: issueTitle,
        issueDesc: descText,
        hasImage: imagesToSend.length > 0,
        images: imagesToSend,
        imageName: imagesToSend.length === 1 ? imagesToSend[0].name : (imagesToSend.length > 1 ? `${imagesToSend.length} hình ảnh` : ""),
        hasVideo: videosToSend.length > 0,
        videos: videosToSend,
        videoName: videosToSend.length === 1 ? videosToSend[0].name : (videosToSend.length > 1 ? `${videosToSend.length} video` : "")
      };

      const fullInquiryText = descText ? `${issueTitle} - ${descText}` : issueTitle;
      const botAnswer = findBestHIUResponse(fullInquiryText, userProfileForResponse);

      const botMsg = {
        sender: "bot",
        text: botAnswer.text,
        time: new Date().toISOString()
      };

      // Tự động lập phiếu tiếp nhận và ghi nhận vào cơ sở dữ liệu
      if (botAnswer.isTicket && botAnswer.ticket) {
        botMsg.isTicket = true;
        // Đảm bảo nội dung yêu cầu chỉ lấy phần mô tả do sinh viên nhập, không ghi lại tên vấn đề
        botAnswer.ticket.question = descText;
        if (imagesToSend.length > 0) {
          botAnswer.ticket.hasImage = true;
          botAnswer.ticket.images = imagesToSend;
          botAnswer.ticket.imageName = imagesToSend.length === 1 ? imagesToSend[0].name : `${imagesToSend.length} hình ảnh`;
          botAnswer.ticket.imageUrl = imagesToSend[0].dataUrl;
        }
        if (videosToSend.length > 0) {
          botAnswer.ticket.hasVideo = true;
          botAnswer.ticket.videos = videosToSend;
          botAnswer.ticket.videoName = videosToSend.length === 1 ? videosToSend[0].name : `${videosToSend.length} video`;
          botAnswer.ticket.videoUrl = videosToSend[0].dataUrl;
        }
        botMsg.ticket = botAnswer.ticket;
        // Ghi nhận phiếu vào cơ sở dữ liệu (IndexedDB + LocalStorage)
        recordTicketToDatabase(botAnswer.ticket);
      }

      chatHistory.push(botMsg);
      appendMessageDOM(botMsg, true);
      saveSession();
      playSoftChime();
    }, 450);
  }

  // -------------------------------------------------------------
  // 6. CƠ SỞ DỮ LIỆU PHIẾU TIẾP NHẬN HỖ TRỢ (HIUDATABASE INTEGRATION)
  // -------------------------------------------------------------
  async function recordTicketToDatabase(ticket) {
    try {
      if (window.HIUDatabase) {
        await window.HIUDatabase.recordTicket(ticket);
        console.log(`[HIUDatabase] Đã ghi nhận phiếu #${ticket.ticketId} vào cơ sở dữ liệu.`);
      } else {
        // Fallback lưu LocalStorage
        const data = localStorage.getItem("hiu_support_tickets");
        const list = data ? JSON.parse(data) : [];
        list.unshift(ticket);
        localStorage.setItem("hiu_support_tickets", JSON.stringify(list));
      }
      refreshDatabaseModalIfOpen();
    } catch (e) {
      console.warn("Lỗi ghi nhận phiếu vào CSDL:", e);
    }
  }

  // Huỷ lập phiếu: Xoá vĩnh viễn khỏi cơ sở dữ liệu và cập nhật giao diện
  window.cancelSupportTicket = async function(ticketId) {
    if (!confirm(`Bạn có chắc chắn muốn huỷ lập phiếu hỗ trợ #${ticketId} không?\nThao tác này sẽ xoá hoàn toàn phiếu khỏi cơ sở dữ liệu.`)) {
      return;
    }

    // 1. Xoá phiếu khỏi Cơ sở dữ liệu (IndexedDB + LocalStorage)
    try {
      if (window.HIUDatabase) {
        await window.HIUDatabase.deleteTicket(ticketId);
      } else {
        const raw = localStorage.getItem("hiu_support_tickets");
        const list = raw ? JSON.parse(raw) : [];
        const updated = list.filter(item => item.ticketId !== ticketId);
        localStorage.setItem("hiu_support_tickets", JSON.stringify(updated));
      }
      console.log(`[HIUDatabase] Đã xoá phiếu #${ticketId} khỏi cơ sở dữ liệu.`);
    } catch (e) {
      console.warn("Lỗi khi xoá phiếu khỏi CSDL:", e);
    }

    // 2. Cập nhật trong lịch sử phiên chat hiện tại
    chatHistory.forEach(msg => {
      if (msg.ticket && msg.ticket.ticketId === ticketId) {
        msg.ticket.status = "Đã huỷ";
        msg.ticketCancelled = true;
      }
    });
    saveSession();

    // 3. Cập nhật trực tiếp trên thẻ phiếu đang hiển thị
    const footerEl = document.getElementById(`ticket-footer-${ticketId}`);
    if (footerEl) {
      footerEl.classList.add("is-cancelled");
      footerEl.style.justifyContent = "center";
      footerEl.innerHTML = `
        <span class="ticket-cancelled-pill">
          <i class="fa-solid fa-ban"></i> Đã huỷ phiếu
        </span>
      `;
    }

    // 4. Thêm tin nhắn xác nhận vào luồng chat
    const cancelNoticeMsg = {
      sender: "bot",
      text: `Đã huỷ thành công Phiếu tiếp nhận hỗ trợ #${ticketId}`,
      time: new Date().toISOString()
    };
    chatHistory.push(cancelNoticeMsg);
    appendMessageDOM(cancelNoticeMsg, true);
    saveSession();

    // 5. Cập nhật modal CSDL nếu đang mở
    refreshDatabaseModalIfOpen();
  };

  // -------------------------------------------------------------
  // 7. GIAO DIỆN QUẢN LÝ CƠ SỞ DỮ LIỆU (DATABASE MODAL CONTROLS)
  // -------------------------------------------------------------
  let cachedDbTickets = [];

  window.openHIUTicketDatabaseModal = async function() {
    const modal = document.getElementById("hiuDatabaseModal");
    if (!modal) return;
    modal.style.display = "flex";
    const searchInput = document.getElementById("dbSearchInput");
    if (searchInput) searchInput.value = "";
    await refreshDatabaseModalUI();
  };

  window.closeHIUTicketDatabaseModal = function() {
    const modal = document.getElementById("hiuDatabaseModal");
    if (modal) modal.style.display = "none";
  };

  async function refreshDatabaseModalUI() {
    try {
      if (window.HIUDatabase) {
        cachedDbTickets = await window.HIUDatabase.getAllTickets();
      } else {
        const raw = localStorage.getItem("hiu_support_tickets");
        cachedDbTickets = raw ? JSON.parse(raw) : [];
      }
    } catch (e) {
      cachedDbTickets = [];
    }

    renderDatabaseTicketsList(cachedDbTickets);
  }

  function refreshDatabaseModalIfOpen() {
    const modal = document.getElementById("hiuDatabaseModal");
    if (modal && modal.style.display === "flex") {
      refreshDatabaseModalUI();
    }
  }

  window.filterDatabaseTickets = function() {
    const searchInput = document.getElementById("dbSearchInput");
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (!query) {
      renderDatabaseTicketsList(cachedDbTickets);
      return;
    }

    const filtered = cachedDbTickets.filter(t => {
      const matchId = (t.ticketId || "").toLowerCase().includes(query);
      const matchName = (t.fullName || "").toLowerCase().includes(query);
      const matchMssv = (t.studentId || "").toLowerCase().includes(query);
      const matchPhone = (t.phone || "").toLowerCase().includes(query);
      const matchIssue = (t.issueLabel || "").toLowerCase().includes(query);
      const matchQuestion = (t.question || "").toLowerCase().includes(query);
      return matchId || matchName || matchMssv || matchPhone || matchIssue || matchQuestion;
    });

    renderDatabaseTicketsList(filtered);
  };

  function renderDatabaseTicketsList(tickets) {
    const countEl = document.getElementById("dbTicketCount");
    if (countEl) countEl.textContent = tickets.length;

    const listEl = document.getElementById("dbTicketsList");
    if (!listEl) return;

    if (!tickets || tickets.length === 0) {
      listEl.innerHTML = `
        <div class="tickets-empty-state">
          <i class="fa-solid fa-folder-open"></i>
          <h4 style="font-size: 1rem; color: #334155; margin-bottom: 6px;">Chưa có phiếu hỗ trợ nào trong cơ sở dữ liệu</h4>
          <p style="font-size: 0.82rem;">Khi sinh viên gửi vấn đề qua Chatbox, hệ thống sẽ tự động ghi nhận phiếu vào cơ sở dữ liệu tại đây.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = tickets.map(t => {
      const isCancelled = t.status === "Đã huỷ";
      const hasImage = t.hasImage || t.imageUrl || (t.images && t.images.length > 0);
      const hasVideo = t.hasVideo || t.videoUrl || (t.videos && t.videos.length > 0);
      const videoList = t.videos && t.videos.length > 0 ? t.videos : (t.videoUrl ? [{ dataUrl: t.videoUrl, name: t.videoName || 'Video' }] : []);
      return `
        <div class="ticket-item-card" id="db-item-${t.ticketId}">
          <div class="ticket-item-top">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="ticket-item-id">${t.ticketId}</span>
              ${isCancelled ? `
                <span class="ticket-cancelled-pill" style="font-size: 0.7rem; padding: 2px 8px;">
                  <i class="fa-solid fa-ban"></i> Đã huỷ
                </span>
              ` : `
                <span class="ticket-status-pill" style="font-size: 0.7rem; padding: 2px 8px;">
                  <i class="fa-solid fa-circle-check"></i> Đã tiếp nhận
                </span>
              `}
            </div>
            <div class="ticket-item-actions">
              <span class="ticket-item-time"><i class="fa-regular fa-clock"></i> ${t.createdAt}</span>
              <button type="button" class="btn-delete-record" onclick="deleteTicketFromDatabase('${t.ticketId}')" title="Xoá vĩnh viễn phiếu này khỏi CSDL">
                <i class="fa-solid fa-trash-can"></i> Xoá khỏi CSDL
              </button>
            </div>
          </div>

          <div class="ticket-item-grid">
            <div><strong>Họ và tên:</strong> ${t.fullName || 'N/A'}</div>
            <div><strong>MSSV:</strong> <span style="color: #A51D24; font-weight: 700;">${t.studentId || 'N/A'}</span></div>
            <div><strong>Ngành - Lớp:</strong> ${t.majorClass || 'N/A'}</div>
            <div><strong>SĐT:</strong> ${t.phone || 'N/A'}</div>
            <div><strong>Email SV:</strong> ${t.studentEmail || 'N/A'}</div>
            <div><strong>Email nhận tin:</strong> ${t.personalEmail || 'N/A'}</div>
          </div>

          <div style="font-size: 0.82rem; color: #0369A1;">
            <strong>Vấn đề:</strong> ${t.issueLabel || t.topic || 'Hỗ trợ CNTT'}
          </div>

          ${getDisplayQuestion(t) ? `
            <div class="ticket-item-question">
              "${getDisplayQuestion(t)}"
            </div>
          ` : `
            <div class="ticket-item-question" style="color: #94A3B8; font-style: italic;">
              (Nội dung yêu cầu để trống)
            </div>
          `}

          ${hasImage ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <span style="font-size: 0.78rem; color: #16A34A; font-weight: 600;">
                <i class="fa-solid fa-images"></i> Có đính kèm hình ảnh ${t.images && t.images.length > 1 ? `(${t.images.length} ảnh)` : (t.imageName ? `(${t.imageName})` : '')}
              </span>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                ${(t.images && t.images.length > 0 ? t.images : (t.imageUrl ? [{ dataUrl: t.imageUrl, name: t.imageName }] : [])).map((img, idx) => `
                  <div class="ticket-thumb-item" onclick="openImageLightbox('${img.dataUrl}')" title="${img.name || 'Ảnh ' + (idx + 1)} (Bấm để xem phóng to)">
                    <img src="${img.dataUrl}" alt="${img.name || 'Ảnh'}">
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ''}

          ${hasVideo ? `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
              <span style="font-size: 0.78rem; color: #7C3AED; font-weight: 600;">
                <i class="fa-solid fa-video"></i> Có đính kèm video ${videoList.length > 1 ? `(${videoList.length} video)` : (t.videoName ? `(${t.videoName})` : '')}
              </span>
              <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                ${videoList.map((vid, idx) => `
                  <div class="ticket-video-item" style="max-width: 200px; cursor: pointer;" onclick="openMediaLightbox('${vid.dataUrl}', 'video')" title="${vid.name || 'Video ' + (idx + 1)} (Bấm để xem video)">
                    <video src="${vid.dataUrl}" preload="metadata" style="width: 100%; max-height: 120px; border-radius: 6px; background: #000; display: block;"></video>
                    <div style="font-size: 0.72rem; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">
                      <i class="fa-solid fa-play" style="color: #7C3AED; margin-right: 3px;"></i>${vid.name || 'Video ' + (idx + 1)}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join("");
  }

  window.deleteTicketFromDatabase = async function(ticketId) {
    if (!confirm(`Bạn có chắc chắn muốn xoá phiếu #${ticketId} không?`)) {
      return;
    }

    // 1. Xoá trong cơ sở dữ liệu
    try {
      if (window.HIUDatabase) {
        await window.HIUDatabase.deleteTicket(ticketId);
      } else {
        const raw = localStorage.getItem("hiu_support_tickets");
        const list = raw ? JSON.parse(raw) : [];
        const updated = list.filter(item => item.ticketId !== ticketId);
        localStorage.setItem("hiu_support_tickets", JSON.stringify(updated));
      }
    } catch (e) {
      console.warn("Lỗi xoá phiếu:", e);
    }

    // 2. Cập nhật trong thẻ phiếu ở chatbox nếu có
    const footerEl = document.getElementById(`ticket-footer-${ticketId}`);
    if (footerEl) {
      footerEl.classList.add("is-cancelled");
      footerEl.style.justifyContent = "center";
      footerEl.innerHTML = `
        <span class="ticket-cancelled-pill">
          <i class="fa-solid fa-ban"></i> Đã huỷ phiếu
        </span>
      `;
    }

    chatHistory.forEach(msg => {
      if (msg.ticket && msg.ticket.ticketId === ticketId) {
        msg.ticket.status = "Đã huỷ";
        msg.ticketCancelled = true;
      }
    });
    saveSession();

    // 3. Làm mới danh sách trong modal
    await refreshDatabaseModalUI();
  };

  window.clearAllDatabaseTickets = async function() {
    if (!confirm("CẢNH BÁO: Thao tác này sẽ xoá TOÀN BỘ phiếu hỗ trợ trong cơ sở dữ liệu vĩnh viễn. Bạn có chắc chắn không?")) {
      return;
    }

    try {
      if (window.HIUDatabase) {
        await window.HIUDatabase.clearAllTickets();
      } else {
        localStorage.removeItem("hiu_support_tickets");
      }
    } catch (e) {
      console.warn("Lỗi xoá toàn bộ CSDL:", e);
    }

    // Cập nhật tất cả thẻ phiếu trong chat
    chatHistory.forEach(msg => {
      if (msg.ticket) {
        msg.ticket.status = "Đã huỷ";
        msg.ticketCancelled = true;
      }
    });
    renderAllMessages();
    saveSession();

    await refreshDatabaseModalUI();
  };

  window.exportDatabaseJSON = async function() {
    let jsonStr = "[]";
    try {
      if (window.HIUDatabase) {
        jsonStr = await window.HIUDatabase.exportJSON();
      } else {
        jsonStr = localStorage.getItem("hiu_support_tickets") || "[]";
      }
    } catch (e) {
      jsonStr = "[]";
    }
    downloadFileBlob("hiu_support_tickets_database.json", jsonStr);
  };

  function downloadFileBlob(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Event Listeners for Chat Input
  if (btnSend) {
    btnSend.addEventListener("click", () => handleUserSend());
  }

  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleUserSend();
      }
    });
  }

  // Gentle audio chime when receiving a message
  function playSoftChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      // AudioContext might be blocked until user gesture, ignore safely
    }
  }
  // -------------------------------------------------------------
  // Initial Boot & Reload Event Listeners
  // -------------------------------------------------------------
  loadSavedSession();

  // Đảm bảo khi tải lại trang (F5, refresh, back/forward cache):
  // Xoá và làm mới sạch sẽ toàn bộ thông tin phiên làm việc
  window.addEventListener("pageshow", () => {
    clearSession();
  });

  window.addEventListener("beforeunload", () => {
    try {
      sessionStorage.removeItem("hiu_chat_user");
      sessionStorage.removeItem("hiu_chat_history");
      localStorage.removeItem("hiu_chat_user");
      localStorage.removeItem("hiu_chat_history");
    } catch (e) {}
  });
});
