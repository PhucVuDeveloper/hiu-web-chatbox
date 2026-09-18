/**
 * Main UI Scripts for Hong Bang International University (HIU) Website
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Sticky Header scroll effect
  const header = document.querySelector(".main-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 30) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // 2. Animated Counter for Stats
  const statNumbers = document.querySelectorAll(".stat-number");
  let statsCounted = false;

  function countUp(el, target, suffix = "+") {
    let current = 0;
    const duration = 1600;
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        clearInterval(timer);
        el.textContent = `${target}${suffix}`;
      } else {
        el.textContent = `${Math.floor(current)}${suffix}`;
      }
    }, stepTime);
  }

  function handleStatsObserver() {
    const statsSection = document.querySelector(".stats-section");
    if (!statsSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsCounted) {
          statsCounted = true;
          statNumbers.forEach(stat => {
            const val = parseInt(stat.getAttribute("data-target"), 10);
            const suffix = stat.getAttribute("data-suffix") || "+";
            if (!isNaN(val)) countUp(stat, val, suffix);
          });
        }
      });
    }, { threshold: 0.25 });

    observer.observe(statsSection);
  }

  handleStatsObserver();

  // 3. Mobile Navigation Menu Toggle
  const mobileToggle = document.getElementById("mobileToggle");
  const navMenu = document.querySelector(".nav-menu");

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener("click", () => {
      const isExpanded = navMenu.classList.toggle("mobile-active");
      mobileToggle.innerHTML = isExpanded 
        ? '<i class="fa-solid fa-xmark"></i>' 
        : '<i class="fa-solid fa-bars"></i>';
    });

    // Close mobile menu when clicking nav links
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("mobile-active");
        mobileToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      });
    });
  }

  // 4. Quick Action triggers to open Chatbox
  document.querySelectorAll("[data-chat-query]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof window.openHIUChat === "function") {
        window.openHIUChat();
      }
    });
  });
});
