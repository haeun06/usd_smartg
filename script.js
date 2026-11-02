// 1. REAL-TIME DIGITAL CLOCK
function updateClocks() {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  document.getElementById('liveClock').textContent = timeStr;
}
setInterval(updateClocks, 1000);
updateClocks();

// 2. CANVAS & HAND TRACKING SYSTEM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 1440;
const H = 900;

let aim = { x: -999, y: -999, visible: false };
let holdStartTime = null;
let currentHoverTarget = null;
const HOLD_MS = 250; // 0.25s trigger

let lastTriggerTime = 0; // Debounce timer
let currentTier = 'FREE'; // FREE, PLUS, PRO
let currentAdIndex = 0;
let freeAdTimerInterval = null;

// SLIDE AUTO-ROTATION (Every 10 seconds)
const slideImages = ['lectureusd.png', 'ppt2.png', 'ppt3.png', 'ppt4.png', 'ppt5.png', 'ppt6.png'];
const slideSubtitles = [
  "This is live translation... abcd",
  "This is creative technology (VU & UT) course.",
  "Our main course on this module is USD, ST, FiD, UHBD, and Profdev.",
  "And this work is our USD project, which is smartglasses.",
  "We hope a product like this comes out someday.",
  "Thank you for taking the time to view our work."
];
let currentSlideIdx = 0;

setInterval(() => {
  currentSlideIdx = (currentSlideIdx + 1) % slideImages.length;
  const lectureImg = document.getElementById('lectureImg');
  const subText = document.getElementById('subText');
  
  lectureImg.src = slideImages[currentSlideIdx];
  subText.textContent = `"${slideSubtitles[currentSlideIdx]}"`;
}, 10000);

// AI CHATBOT PRESET SCENARIOS
let aiQueryCount = 0;
const aiScenarios = [
  { q: "What is the relation between tech and environment?", a: "Technology enables renewable energy tracking, but tech hardware requires sustainable e-waste management." },
  { q: "What is ethics in AI?", a: "AI ethics involves ensuring fairness, algorithmic transparency, data privacy, and preventing bias in automated decisions." },
  { q: "How can AI help society?", a: "AI enhances medical diagnostics, optimizes urban traffic flow, and provides personalized accessible education." },
  { q: "What is Creative Technology?", a: "Creative Technology combines computer science, engineering, and design to build human-centered interactive systems." },
  { q: "How does AR OS improve classroom learning?", a: "AR OS offers real-time subtitle translation, instant AI query resolution, and visual glossary overlays directly in view." }
];

// IN-MODAL AI QUIZ SYSTEM
let quizStep = 0;
let userAnswers = [-1, -1, -1];
const quizData = [
  { q: "Q1. What is the name of this study / degree program?", opts: ["Creative Technology", "Business Informatics", "Computer Science"], ans: 0 },
  { q: "Q2. What is the name of this smart glasses project?", opts: ["VR Headset", "Smart Glasses", "AR Contact Lens"], ans: 1 },
  { q: "Q3. How many subscription tiers exist in this Smart Glasses OS?", opts: ["2 Tiers", "3 Tiers", "5 Tiers"], ans: 1 }
];

// 3. HAND HOVER INTERACTION LOGIC WITH DEBOUNCE
function checkHoverTargets() {
  const elements = document.querySelectorAll('.interactive-element');
  let hoveredElem = null;

  const wrapperRect = document.getElementById('wrapper').getBoundingClientRect();

  elements.forEach(elem => {
    if (elem.offsetWidth > 0 && elem.offsetHeight > 0) {
      const rect = elem.getBoundingClientRect();
      const padding = 15;
      const x = rect.left - wrapperRect.left - padding;
      const y = rect.top - wrapperRect.top - padding;
      const w = rect.width + (padding * 2);
      const h = rect.height + (padding * 2);

      if (aim.x >= x && aim.x <= x + w && aim.y >= y && aim.y <= y + h) {
        hoveredElem = elem;
      }
    }
  });

  const now = performance.now();
  if (now - lastTriggerTime < 1200) {
    return;
  }

  if (hoveredElem) {
    if (currentHoverTarget !== hoveredElem) {
      currentHoverTarget = hoveredElem;
      holdStartTime = now;
    } else {
      const held = now - holdStartTime;
      const progress = Math.min(held / HOLD_MS, 1.0);

      drawProgressRing(aim.x, aim.y, progress);

      if (held >= HOLD_MS) {
        lastTriggerTime = now;
        triggerAction(currentHoverTarget.getAttribute('data-action'));
        currentHoverTarget = null;
        holdStartTime = null;
      }
    }
  } else {
    currentHoverTarget = null;
    holdStartTime = null;
  }
}

// 4. ACTION TRIGGERS & TIER LOGIC
function triggerAction(action) {
  if (!action) return;

  if (action === 'nextToTier') {
    document.getElementById('howToUseScreen').style.display = 'none';
    document.getElementById('tierSelectScreen').style.display = 'flex';
  } else if (action === 'selectFree') {
    activateTier('FREE');
  } else if (action === 'selectPlus') {
    activateTier('PLUS');
  } else if (action === 'selectPro') {
    activateTier('PRO');
  } else if (action === 'resetToStart') {
    document.querySelectorAll('.ar-modal').forEach(m => m.style.display = 'none');
    document.getElementById('tierSelectScreen').style.display = 'none';
    document.getElementById('howToUseScreen').style.display = 'flex';
    if (freeAdTimerInterval) clearInterval(freeAdTimerInterval);
    showToast('Resetting to Initial Setup');
  } else if (action === 'alarm') {
    toggleModal('alarmModal');
  } else if (action === 'calendar') {
    toggleModal('calendarModal');
  } else if (action === 'cal_5') {
    document.getElementById('calDetailBox').textContent = "📌 Nov 5: USD Demo Day";
  } else if (action === 'cal_9') {
    document.getElementById('calDetailBox').textContent = "📌 Nov 9: FID Resit Exam";
  } else if (action === 'cal_10') {
    document.getElementById('calDetailBox').textContent = "📌 Nov 10: M6 Start";
  } else if (action === 'ai') {
    if (currentTier === 'FREE') {
      showToast('AI Assistant requires Plus/Pro Tier');
    } else {
      toggleModal('aiModal');
    }
  } else if (action === 'triggerMic') {
    handleAiMicQuery();
  } else if (action === 'subtitle') {
    if (currentTier === 'FREE') {
      showToast('Live Subtitles require Plus/Pro Tier');
    } else {
      const sub = document.getElementById('subtitleBox');
      sub.style.display = (sub.style.display === 'block') ? 'none' : 'block';
    }
  } else if (action === 'bookmark') {
    showToast('Lecture Moment Saved');
  } else if (action === 'word') {
    if (currentTier === 'FREE') {
      showToast('Key Glossary requires Plus/Pro Tier');
    } else {
      toggleModal('wordModal');
    }
  } else if (action === 'summary') {
    toggleModal('summaryModal');
  } else if (action === 'quiz') {
    quizStep = 0;
    userAnswers = [-1, -1, -1];
    renderQuizStep();
    toggleModal('quizModal');
  } else if (action === 'quizPrev') {
    if (quizStep > 0) { quizStep--; renderQuizStep(); }
  } else if (action === 'quizNext') {
    if (quizStep < quizData.length - 1) {
      quizStep++; renderQuizStep();
    } else {
      submitQuizInModal();
    }
  } else if (action.startsWith('selectOpt_')) {
    const optIdx = parseInt(action.split('_')[1]);
    userAnswers[quizStep] = optIdx;
    renderQuizStep();
  }
}

function handleAiMicQuery() {
  const chatBox = document.getElementById('chatBox');
  const chatInput = document.getElementById('chatInputDisplay');

  if (currentTier === 'PLUS' && aiQueryCount >= 3) {
    chatInput.value = "Limit Reached (3/3)";
    const limitMsg = document.createElement('div');
    limitMsg.className = 'chat-msg-ai';
    limitMsg.style.borderColor = '#ff3366';
    limitMsg.textContent = "⚠️ Query limit reached for Plus Tier. Please wait 24 hours or upgrade to Pro for unlimited AI access.";
    chatBox.appendChild(limitMsg);
    chatBox.scrollTop = chatBox.scrollHeight;
    return;
  }

  if (aiQueryCount < aiScenarios.length) {
    const item = aiScenarios[aiQueryCount];
    chatInput.value = item.q;

    const uMsg = document.createElement('div');
    uMsg.className = 'chat-msg-user';
    uMsg.textContent = item.q;
    chatBox.appendChild(uMsg);

    setTimeout(() => {
      const aMsg = document.createElement('div');
      aMsg.className = 'chat-msg-ai';
      aMsg.textContent = item.a;
      chatBox.appendChild(aMsg);
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 400);

    aiQueryCount++;
  }
}

// IN-MODAL QUIZ RENDER & SUBMIT
function renderQuizStep() {
  const qData = quizData[quizStep];
  const container = document.getElementById('quizContainer');
  
  container.innerHTML = `
    <h3 class="quiz-q-title">${qData.q}</h3>
    <div class="quiz-options-grid">
      ${qData.opts.map((optText, idx) => `
        <div class="quiz-opt-btn interactive-element ${userAnswers[quizStep] === idx ? 'quiz-opt-selected' : ''}" 
             data-action="selectOpt_${idx}">
          ${String.fromCharCode(65 + idx)}. ${optText}
        </div>
      `).join('')}
    </div>
    <div class="quiz-nav-row">
      ${quizStep > 0 ? `<button class="interactive-element quiz-nav-btn" data-action="quizPrev">BACK</button>` : `<div></div>`}
      <button class="interactive-element quiz-nav-btn" data-action="quizNext">${quizStep === quizData.length - 1 ? 'SUBMIT' : 'NEXT'}</button>
    </div>
  `;
}

function submitQuizInModal() {
  const container = document.getElementById('quizContainer');
  
  container.innerHTML = `
    <div style="text-align: center; padding-top: 80px;">
      <div style="font-family:'Orbitron'; font-size: 24px; color: var(--ar-cyan); margin-bottom: 20px;">AI EVALUATION IN PROGRESS...</div>
      <div style="font-size: 16px; color: rgba(255,255,255,0.7);">Analyzing answers against lecture material...</div>
    </div>
  `;

  setTimeout(() => {
    container.innerHTML = `
      <div style="text-align: center; padding-top: 40px;">
        <div style="font-family:'Orbitron'; font-size: 28px; color: var(--ar-green); margin-bottom: 16px;">QUIZ COMPLETED!</div>
        <div style="font-family:'Orbitron'; font-size: 50px; font-weight: 900; color: #fff; margin-bottom: 12px; text-shadow: 0 0 25px var(--ar-green);">3 / 3</div>
        <div style="font-size: 20px; color: var(--ar-cyan); margin-bottom: 30px;">SCORE: 100%</div>
        <button class="interactive-element quiz-nav-btn" data-action="quiz" style="margin: 0 auto; display: block;">RETRY QUIZ</button>
      </div>
    `;
  }, 3000);
}

function activateTier(tier) {
  currentTier = tier;
  document.getElementById('tierSelectScreen').style.display = 'none';
  document.getElementById('activeTierBadge').textContent = tier + ' OS';

  const bgImg = document.getElementById('locationBg');
  const summaryBtn = document.getElementById('summaryHudBtn');
  const quizBtn = document.getElementById('quizHudBtn');

  if (tier === 'FREE') {
    bgImg.src = 'tram.png';
    summaryBtn.style.display = 'none';
    quizBtn.style.display = 'none';
    showAdPopup();

    if (freeAdTimerInterval) clearInterval(freeAdTimerInterval);
    freeAdTimerInterval = setInterval(() => {
      if (currentTier === 'FREE') showAdPopup();
    }, 60000);

  } else if (tier === 'PLUS') {
    bgImg.src = 'rest.png';
    summaryBtn.style.display = 'none';
    quizBtn.style.display = 'none';
    if (freeAdTimerInterval) clearInterval(freeAdTimerInterval);
    showToast('Welcome to Smart Glass PLUS OS');
  } else if (tier === 'PRO') {
    bgImg.src = 'train.png';
    summaryBtn.style.display = 'flex';
    quizBtn.style.display = 'flex';
    if (freeAdTimerInterval) clearInterval(freeAdTimerInterval);
    showToast('Welcome to Smart Glass PRO OS');
  }
}

function showAdPopup() {
  const adModal = document.getElementById('adModal');
  const timerElem = document.getElementById('adTimer');
  const adBanner = document.getElementById('adBannerImg');

  currentAdIndex = (currentAdIndex === 0) ? 1 : 0;
  adBanner.src = (currentAdIndex === 0) ? 'adbannerusd.png' : 'ad2.png';

  adModal.style.display = 'block';
  let timeLeft = 5;

  const adInterval = setInterval(() => {
    timeLeft--;
    timerElem.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(adInterval);
      adModal.style.display = 'none';
      showToast('AR Session Active');
    }
  }, 1000);
}

function toggleModal(id) {
  const modal = document.getElementById(id);
  const isShown = modal.style.display === 'block';
  document.querySelectorAll('.ar-modal').forEach(m => m.style.display = 'none');
  modal.style.display = isShown ? 'none' : 'block';
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 2200);
}

// 5. DRAW CROSSHAIR & PROGRESS RING
function drawProgressRing(x, y, progress) {
  ctx.beginPath();
  ctx.arc(x, y, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 5;
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCrosshair(x, y) {
  ctx.save();
  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 14;

  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20);
  ctx.stroke();
  ctx.restore();
}

function renderLoop() {
  ctx.clearRect(0, 0, W, H);
  if (aim.visible) {
    checkHoverTargets();
    drawCrosshair(aim.x, aim.y);
  }
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// 6. MEDIAPIPE HAND TRACKING PIPELINE
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.65,
  minTrackingConfidence: 0.6
});

hands.onResults((results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    aim.x = (1 - landmarks[8].x) * W;
    aim.y = landmarks[8].y * H;
    aim.visible = true;
  } else {
    aim.visible = false;
  }
});

// 7. BACKGROUND CAMERA SETUP
const video = document.getElementById('video');
navigator.mediaDevices.getUserMedia({ video: { width: 1440, height: 900, facingMode: 'user' } })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
    const camera = new Camera(video, {
      onFrame: async () => { await hands.send({ image: video }); },
      width: 1440,
      height: 900
    });
    camera.start();
  })
  .catch((err) => console.error("Camera access error:", err));
