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
const W = 1300;
const H = 800;

let aim = { x: -999, y: -999, visible: false };
let holdStartTime = null;
let currentHoverTarget = null;
const HOLD_MS = 250; // Fast 0.25s trigger

let currentTier = 'FREE'; // FREE, PLUS, PRO

// 3. HAND HOVER INTERACTION LOGIC
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

  if (hoveredElem) {
    if (currentHoverTarget !== hoveredElem) {
      currentHoverTarget = hoveredElem;
      holdStartTime = performance.now();
    } else {
      const held = performance.now() - holdStartTime;
      const progress = Math.min(held / HOLD_MS, 1.0);

      drawProgressRing(aim.x, aim.y, progress);

      if (held >= HOLD_MS) {
        triggerAction(currentHoverTarget.getAttribute('data-action'));
        holdStartTime = performance.now() + 800;
      }
    }
  } else {
    currentHoverTarget = null;
    holdStartTime = null;
  }
}

// 4. ACTION TRIGGERS & TIER LOGIC
function triggerAction(action) {
  if (action === 'nextToTier') {
    document.getElementById('howToUseScreen').style.display = 'none';
    document.getElementById('tierSelectScreen').style.display = 'flex';
  } else if (action === 'selectFree') {
    activateTier('FREE');
  } else if (action === 'selectPlus') {
    activateTier('PLUS');
  } else if (action === 'selectPro') {
    activateTier('PRO');
  } else if (action === 'alarm') {
    toggleModal('alarmModal');
  } else if (action === 'calendar') {
    toggleModal('calendarModal');
  } else if (action === 'ai') {
    if (currentTier === 'FREE') {
      showToast('AI Assistant requires Plus/Pro Tier');
    } else {
      toggleModal('aiModal');
    }
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
  }
}

function activateTier(tier) {
  currentTier = tier;
  document.getElementById('tierSelectScreen').style.display = 'none';
  document.getElementById('activeTierBadge').textContent = tier + ' OS';

  const summaryBtn = document.getElementById('summaryHudBtn');
  summaryBtn.style.display = (tier === 'PRO') ? 'flex' : 'none';

  if (tier === 'FREE') {
    showAdPopup();
  } else {
    showToast('Welcome to Smart Glass ' + tier + ' OS');
  }
}

function showAdPopup() {
  const adModal = document.getElementById('adModal');
  const timerElem = document.getElementById('adTimer');
  adModal.style.display = 'block';
  let timeLeft = 5;

  const adInterval = setInterval(() => {
    timeLeft--;
    timerElem.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(adInterval);
      adModal.style.display = 'none';
      showToast('Free AR Session Started');
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
  ctx.arc(x, y, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 5;
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawCrosshair(x, y) {
  ctx.save();
  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 16, y); ctx.lineTo(x + 16, y);
  ctx.moveTo(x, y - 16); ctx.lineTo(x, y + 16);
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

// 7. CAMERA SETUP
const video = document.getElementById('video');
navigator.mediaDevices.getUserMedia({ video: { width: 1300, height: 800, facingMode: 'user' } })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
    const camera = new Camera(video, {
      onFrame: async () => { await hands.send({ image: video }); },
      width: 1300,
      height: 800
    });
    camera.start();
  })
  .catch((err) => console.error("Camera access error:", err));
