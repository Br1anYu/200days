/* ============================================================
   200 Days ｜ 交往 200 天紀念網站
   功能：捲動進場動畫、漂浮光點、數字計數、時間軸進度線、
        相簿燈箱、信件打字機效果、按鈕漣漪、回到頂部
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initNavScrollState();
  initHeroParticles();
  initFadeUpObserver();
  initHeroNumberCount();
  initTimelineProgress();
  initAlbumLightbox();
  initLetterTyping();
  initButtonRipple();
  initBackToTop();
  initStoryParallax();
});


/* ------------------------------------------------------------
   故事區塊背景光暈：隨捲動產生視差位移（比文字內容移動更慢）
------------------------------------------------------------ */
function initStoryParallax() {
  const blobs = document.querySelectorAll(".story__blob");
  if (!blobs.length) return;

  const updateParallax = () => {
    const scrollY = window.scrollY;
    blobs.forEach((blob, index) => {
      // 不同光斑給不同視差速度，製造前後層次
      const speed = 0.05 + index * 0.03;
      const offset = scrollY * speed;
      blob.style.transform = `translateY(${offset}px)`;
    });
  };

  window.addEventListener("scroll", updateParallax, { passive: true });
  updateParallax();
}

/* ------------------------------------------------------------
   1. 導覽列：捲動超過一定距離後加上毛玻璃背景
------------------------------------------------------------ */
function initNavScrollState() {
  const nav = document.getElementById("nav");
  if (!nav) return;

  const SCROLL_THRESHOLD = 40; // 超過此捲動距離才顯示背景

  const updateNavState = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      nav.classList.add("nav--scrolled");
    } else {
      nav.classList.remove("nav--scrolled");
    }
  };

  // 使用 passive 監聽提升捲動效能
  window.addEventListener("scroll", updateNavState, { passive: true });
  updateNavState();
}

/* ------------------------------------------------------------
   2. Hero 背景漂浮光點／愛心
   以原生 Canvas-free 方式，動態建立多個 DOM 元素並指派隨機動畫參數
------------------------------------------------------------ */
function initHeroParticles() {
  const container = document.getElementById("heroParticles");
  if (!container) return;

  const PARTICLE_COUNT = 18;
  // 交錯使用愛心符號與圓點光點，比例上以光點為主，避免太過俗氣
  const symbols = ["♥", "✦", "·", "♥", "·", "✦"];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const particle = document.createElement("span");
    particle.className = "hero__particle";
    particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    particle.setAttribute("aria-hidden", "true");

    // 隨機水平位置
    particle.style.left = `${Math.random() * 100}%`;
    // 隨機大小，營造遠近層次感
    const size = 0.6 + Math.random() * 1.2;
    particle.style.fontSize = `${size}rem`;
    // 隨機飄動時間與延遲，讓畫面看起來自然不規律
    const duration = 10 + Math.random() * 12;
    const delay = Math.random() * 14;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    // 隨機左右飄移距離（CSS 自訂屬性，對應 keyframes 中的 --drift）
    particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 6}rem`);

    container.appendChild(particle);
  }
}

/* ------------------------------------------------------------
   3. 捲動進場動畫：Fade In + Slide Up
   使用 IntersectionObserver 偵測元素進入畫面後加上 .is-visible
------------------------------------------------------------ */
function initFadeUpObserver() {
  const targets = document.querySelectorAll(".fade-up");
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          // 進場後不再需要觀察，節省效能
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -5% 0px",
    }
  );

  targets.forEach((target) => observer.observe(target));
}

/* ------------------------------------------------------------
   4. Hero 數字計數動畫：0 緩緩跳動到 200
------------------------------------------------------------ */
function initHeroNumberCount() {
  const numberEl = document.querySelector("[data-count-to]");
  if (!numberEl) return;

  const target = parseInt(numberEl.dataset.countTo, 10);
  const DURATION = 1800; // 動畫總長（毫秒）
  let startTime = null;

  // 使用 easeOutCubic 讓數字「先快後慢」，更接近自然的停止感
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  function step(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / DURATION, 1);
    const eased = easeOutCubic(progress);
    numberEl.textContent = Math.round(eased * target);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  // 進入畫面才開始計數（Hero 通常一開啟就可見，但仍保留保險機制）
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(step);
          obs.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );
  observer.observe(numberEl);
}

/* ------------------------------------------------------------
   5. 時間軸：依捲動位置點亮金色進度線（Parallax 風格效果）
------------------------------------------------------------ */
function initTimelineProgress() {
  const timeline = document.getElementById("timeline");
  const progressLine = document.getElementById("timelineProgress");
  if (!timeline || !progressLine) return;

  const LINE_LENGTH = 1000; // 對應 SVG viewBox 高度，需與 HTML 中設定一致

  const updateProgress = () => {
    const rect = timeline.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // 計算時間軸區塊在視窗中被捲過的比例（0 ~ 1）
    const total = rect.height + viewportHeight;
    const scrolled = viewportHeight - rect.top;
    let ratio = scrolled / total;
    ratio = Math.max(0, Math.min(1, ratio));

    // stroke-dashoffset 從 LINE_LENGTH（全隱藏）到 0（全顯示）
    const offset = LINE_LENGTH * (1 - ratio);
    progressLine.style.strokeDashoffset = offset;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();
}

/* ------------------------------------------------------------
   6. 相簿燈箱：點擊照片放大檢視，支援鍵盤 Esc 與點擊背景關閉
------------------------------------------------------------ */
function initAlbumLightbox() {
  const cards = document.querySelectorAll(".album__card");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeBtn = document.getElementById("lightboxClose");
  if (!cards.length || !lightbox) return;

  let lastFocusedCard = null;

  const openLightbox = (card) => {
    const fullSrc = card.dataset.full;
    const caption = card.dataset.caption || "";
    lightboxImg.src = fullSrc;
    lightboxImg.alt = caption;
    lightboxCaption.textContent = caption;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    lastFocusedCard = card;
    closeBtn.focus();
    document.body.style.overflow = "hidden"; // 開啟時鎖定背景捲動
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedCard) lastFocusedCard.focus();
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => openLightbox(card));
  });

  closeBtn.addEventListener("click", closeLightbox);

  // 點擊背景（非照片本身）時關閉
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  // 按下 Esc 關閉
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

/* ------------------------------------------------------------
   7. 信件打字機效果：進入畫面後逐字顯示，結束後淡入署名
------------------------------------------------------------ */
function initLetterTyping() {
  const target = document.getElementById("letterTyped");
  const signature = document.getElementById("letterSignature");
  if (!target) return;

  // 信件內容集中放在這裡，方便日後直接修改文字
  const letter =
    "200 天，說長不長，說短也不短。\n" +
    "但我很確定，這是我這輩子最不想浪費的 200 天。\n\n" +
    "謝謝妳願意把日常的瑣碎，都分享給我；\n" +
    "謝謝妳在我情緒不好的時候，還是選擇留下來；\n" +
    "謝謝妳讓「我們」這兩個字，變成我每天最期待的事。\n\n" +
    "未來的每一個 100 天、200 天、好多好多天，\n" +
    "我都想繼續牽著妳的手，一起走下去。";

  const letterText = 
  "不知不覺我們已經一起走過200天了。這段時間裡有好多快樂的回憶，也有不少爭吵和磨合。我知道我讓妳生氣的次數並不少，也常常因為一些事情讓我們都變得不開心。但每一次妳都願意用成熟的態度和耐心，慢慢告訴我妳真正的想法，讓我知道哪些地方做得不好，也讓我有機會一點一滴變成更好的自己。謝謝妳沒有放棄我，而是願意陪著我一起成長。\n\n"+
  "我知道現在的我還不夠好，我們也還在尋找彼此最舒服、最適合的相處方式。但我會繼續努力，因為妳值得我成為更好的人。\n\n"+
  "我會記住妳對我說過的每一句話。輸贏，不會再是我對妳態度不好的藉口；愛一個人，也不是限制妳自由、讓妳沒有私人空間的理由。我想給妳的安全感是信任、理解和陪伴，而不是束縛。我希望未來的妳能因為有我而感到安心，而不是委屈。\n\n"+
  "謝謝妳一直陪在我身邊陪我笑、陪我哭，也陪我一起經歷這200天的點點滴滴。我真的很愛妳，也很珍惜和妳一起創造的每一個回憶。希望我們都能繼續透過溝通和理解，一起找回最初相愛時那份單純的心動，也一起走向更多個200天、500天，甚至一輩子。\n";


  const TYPING_SPEED = 38; // 每字打字間隔（毫秒）
  let hasStarted = false;
  let charIndex = 0;

  // 建立游標元素，打字過程中顯示在文字尾端
  const cursor = document.createElement("span");
  cursor.className = "letter__cursor";

  function typeNextChar() {
    if (charIndex < letterText.length) {
      // 重新組合文字內容 + 游標，確保游標永遠在最末端
      target.textContent = letterText.slice(0, charIndex + 1);
      target.appendChild(cursor);
      charIndex++;
      setTimeout(typeNextChar, TYPING_SPEED);
    } else {
      // 打字結束，移除游標並淡入署名
      cursor.remove();
      if (signature) signature.classList.add("is-visible");
    }
  }

  // 使用 IntersectionObserver，當信件區塊進入畫面才開始打字
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasStarted) {
          hasStarted = true;
          typeNextChar();
          obs.disconnect();
        }
      });
    },
    { threshold: 0.4 }
  );
  observer.observe(target);
}

/* ------------------------------------------------------------
   8. 按鈕漣漪效果（Ripple）：點擊按鈕時從點擊位置擴散圓形漣漪
------------------------------------------------------------ */
function initButtonRipple() {
  const rippleButtons = document.querySelectorAll(".ripple");
  if (!rippleButtons.length) return;

  rippleButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const rect = button.getBoundingClientRect();
      const circle = document.createElement("span");
      const size = Math.max(rect.width, rect.height);

      circle.className = "ripple-circle";
      circle.style.width = circle.style.height = `${size}px`;
      circle.style.left = `${event.clientX - rect.left - size / 2}px`;
      circle.style.top = `${event.clientY - rect.top - size / 2}px`;

      button.appendChild(circle);

      // 動畫結束後移除元素，避免 DOM 累積
      circle.addEventListener("animationend", () => circle.remove());
    });
  });
}

/* ------------------------------------------------------------
   9. 回到頂部按鈕：捲動超過一定距離才顯示，點擊平滑回頂
------------------------------------------------------------ */
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
