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
  const checkIsCandidate = document.getElementById("checkIsCandidate");
  const inputPhone = document.getElementById("inputPhone");
  const selectTopic = document.getElementById("selectTopic");
  const formErrorAlert = document.getElementById("formErrorAlert");

  // Active Chat Elements
  const userDisplayTag = document.getElementById("userDisplayTag");
  const btnSwitchUser = document.getElementById("btnSwitchUser");
  const chatMessages = document.getElementById("chatMessages");
  const quickReplies = document.getElementById("quickReplies");
  const chatInput = document.getElementById("chatInput");
  const btnSend = document.getElementById("btnChatSend");

  // State
  let currentUser = null;
  let chatHistory = [];
  let isTyping = false;

  // -------------------------------------------------------------
  // 1. Storage & State Initialization
  // -------------------------------------------------------------
  function loadSavedSession() {
    try {
      const savedUser = localStorage.getItem("hiu_chat_user");
      const savedHistory = localStorage.getItem("hiu_chat_history");

      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (savedHistory) {
          chatHistory = JSON.parse(savedHistory);
        }
        showActiveChatView();
      } else {
        showOnboardingView();
      }
    } catch (e) {
      console.warn("Storage access failed:", e);
      showOnboardingView();
    }
  }

  function saveSession() {
    try {
      if (currentUser) {
        localStorage.setItem("hiu_chat_user", JSON.stringify(currentUser));
        localStorage.setItem("hiu_chat_history", JSON.stringify(chatHistory));
      }
    } catch (e) {
      console.warn("Could not save to storage", e);
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem("hiu_chat_user");
      localStorage.removeItem("hiu_chat_history");
    } catch (e) {}
    currentUser = null;
    chatHistory = [];
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

  // Global trigger function for buttons on website (e.g. "Tư vấn ngay")
  window.openHIUChat = function(suggestedQuery = null) {
    toggleChatbox(true);
    if (currentUser && suggestedQuery) {
      setTimeout(() => handleUserSend(suggestedQuery), 400);
    }
  };

  // -------------------------------------------------------------
  // 3. Onboarding Form Logic (Họ tên, MSSV, SĐT)
  // -------------------------------------------------------------
  if (checkIsCandidate) {
    checkIsCandidate.addEventListener("change", (e) => {
      if (e.target.checked) {
        inputMssv.value = "";
        inputMssv.disabled = true;
        inputMssv.placeholder = "Hệ thống sẽ cấp mã thí sinh tự động";
      } else {
        inputMssv.disabled = false;
        inputMssv.placeholder = "Ví dụ: 221100456";
        inputMssv.focus();
      }
    });
  }

  if (onboardForm) {
    onboardForm.addEventListener("submit", (e) => {
      e.preventDefault();
      formErrorAlert.style.display = "none";

      const fullName = inputName.value.trim();
      const isCandidate = checkIsCandidate.checked;
      let mssv = inputMssv.value.trim();
      const phone = inputPhone.value.trim();
      const topic = selectTopic.value;

      // Validate Họ & Tên
      if (!fullName) {
        showFormError("Vui lòng nhập Họ và tên của bạn.");
        inputName.focus();
        return;
      }

      // Validate MSSV (nếu không phải thí sinh vãng lai)
      if (!isCandidate && !mssv) {
        showFormError("Vui lòng nhập Mã số sinh viên (MSSV) hoặc tích chọn 'Tôi là thí sinh/Chưa có MSSV'.");
        inputMssv.focus();
        return;
      }

      // Nếu là thí sinh, cấp mã định danh tra cứu tạm thời
      if (isCandidate) {
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        mssv = `TS2026-${randomCode}`;
      }

      // Validate Số điện thoại VN
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(phone.replace(/\s+/g, ""))) {
        showFormError("Số điện thoại không hợp lệ (Cần gồm 10 chữ số, VD: 0938692015).");
        inputPhone.focus();
        return;
      }

      // Thông tin hợp lệ -> Khởi tạo User
      currentUser = {
        name: fullName,
        studentId: mssv,
        isGuest: isCandidate,
        phone: phone,
        topic: topic,
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
  }

  function showOnboardingView() {
    onboardingView.style.display = "flex";
    activeChatView.style.display = "none";
    if (formErrorAlert) formErrorAlert.style.display = "none";
  }

  function showActiveChatView() {
    onboardingView.style.display = "none";
    activeChatView.style.display = "flex";

    // Cập nhật thẻ định danh người dùng trên thanh trạng thái
    if (userDisplayTag && currentUser) {
      const roleText = currentUser.isGuest ? "Thí sinh" : "Sinh viên";
      userDisplayTag.innerHTML = `<span>${currentUser.name}</span> (${roleText}: <b>${currentUser.studentId}</b> - SĐT: <b>${currentUser.phone}</b>)`;
    }

    renderAllMessages();
    setTimeout(() => {
      if (chatInput) chatInput.focus();
    }, 200);
  }

  if (btnSwitchUser) {
    btnSwitchUser.addEventListener("click", () => {
      if (confirm("Bạn có muốn đổi thông tin định danh (Họ tên, MSSV, SĐT) không?")) {
        clearSession();
      }
    });
  }

  // -------------------------------------------------------------
  // 4. Message Rendering & Helpers
  // -------------------------------------------------------------
  function formatMarkdown(text) {
    if (!text) return "";
    let safe = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

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
    const roleDesc = currentUser.isGuest ? "Thí sinh xét tuyển 2026" : "Sinh viên HIU";
    const welcomeText = 
      `Xin chào **${currentUser.name}**! 👋\n\n` +
      `HIU đã tiếp nhận thông tin của bạn:\n` +
      `• Đối tượng: **${roleDesc}** (Mã: **${currentUser.studentId}**)\n` +
      `• Số điện thoại: **${currentUser.phone}**\n` +
      `• Nhu cầu quan tâm: **${currentUser.topic}**\n\n` +
      `Tôi là **Trợ lý Tư vấn Trực tuyến HIU**. Tôi có thể hỗ trợ bạn tìm hiểu học phí, phương thức xét tuyển, các khối ngành đào tạo hoặc thủ tục học bổng ngay bây giờ!`;

    chatHistory.push({
      sender: "bot",
      text: welcomeText,
      time: new Date().toISOString(),
      quickReplies: ["Học phí 2026", "Phương thức xét tuyển", "Khối ngành Sức khỏe", "Chính sách Học bổng", "Hotline tư vấn"]
    });
  }

  function renderAllMessages() {
    chatMessages.innerHTML = "";
    chatHistory.forEach(msg => {
      appendMessageDOM(msg, false);
    });
    scrollToBottom();

    // Render quick replies of the latest bot message
    const lastBotMsg = [...chatHistory].reverse().find(m => m.sender === "bot" && m.quickReplies && m.quickReplies.length > 0);
    renderQuickReplies(lastBotMsg ? lastBotMsg.quickReplies : []);
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
    bubble.innerHTML = `
      <div>${formatMarkdown(msg.text)}</div>
      <span class="msg-time">${formatTime(msg.time)}</span>
    `;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);

    chatMessages.appendChild(wrapper);
    if (animate) scrollToBottom();
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

  function renderQuickReplies(replies) {
    quickReplies.innerHTML = "";
    if (!replies || replies.length === 0) {
      quickReplies.style.display = "none";
      return;
    }

    quickReplies.style.display = "flex";
    replies.forEach(text => {
      const pill = document.createElement("button");
      pill.className = "quick-reply-pill";
      pill.textContent = text;
      pill.addEventListener("click", () => {
        handleUserSend(text);
      });
      quickReplies.appendChild(pill);
    });
  }

  // -------------------------------------------------------------
  // 5. Sending & Responding
  // -------------------------------------------------------------
  function handleUserSend(rawText = null) {
    if (!currentUser) {
      showOnboardingView();
      return;
    }

    const text = rawText || chatInput.value.trim();
    if (!text || isTyping) return;

    if (!rawText) chatInput.value = "";

    // Add user message
    const userMsg = {
      sender: "user",
      text: text,
      time: new Date().toISOString()
    };
    chatHistory.push(userMsg);
    appendMessageDOM(userMsg, true);
    saveSession();

    // Hide quick replies while thinking
    renderQuickReplies([]);

    // Bot typing simulation
    showTypingIndicator();

    const responseDelay = Math.min(1400, Math.max(700, text.length * 30));

    setTimeout(() => {
      removeTypingIndicator();

      // Retrieve intelligent response from data.js engine
      let botAnswer;
      if (typeof findBestHIUResponse === "function") {
        botAnswer = findBestHIUResponse(text, currentUser);
      } else {
        botAnswer = {
          text: `Cảm ơn bạn **${currentUser.name}**. Chuyên viên tuyển sinh HIU đã tiếp nhận câu hỏi và sẽ gọi điện cho bạn qua số **${currentUser.phone}**.`,
          quickReplies: ["Học phí", "Tuyển sinh 2026", "Học bổng"]
        };
      }

      const botMsg = {
        sender: "bot",
        text: botAnswer.text,
        time: new Date().toISOString(),
        quickReplies: botAnswer.quickReplies || []
      };

      chatHistory.push(botMsg);
      appendMessageDOM(botMsg, true);
      renderQuickReplies(botMsg.quickReplies);
      saveSession();
      playSoftChime();
    }, responseDelay);
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
  // Initial Boot
  // -------------------------------------------------------------
  loadSavedSession();
});
