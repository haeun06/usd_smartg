// 1. REAL-TIME DIGITAL CLOCK
function updateClocks() {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  document.getElementById('liveClock').textContent = timeStr;
  document.getElementById('welcomeClock').textContent = timeStr;
}
setInterval(updateClocks, 1000);
updateClocks();

// 2. CANVAS & HAND TRACKING SYSTEM (1300x800)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 1300;
const H = 800;

let aim = { x: -999, y: -999, visible: false };
let holdStartTime = null;
let currentHoverTarget = null;
const HOLD_MS = 400; // 0.4s hover activation

// 3. HAND HOVER INTERACTION LOGIC
function checkHoverTargets() {
  const elements = document.querySelectorAll('.interactive-element');
  let hoveredElem = null;

  const wrapperRect = document.getElementById('wrapper').getBoundingClientRect();

  elements.forEach(elem => {
    if (elem.offsetWidth > 0 && elem.offsetHeight > 0) {
      const rect = elem.getBoundingClientRect();
      
      const x = rect.left - wrapperRect.left;
      const y = rect.top - wrapperRect.top;
      const w = rect.width;
      const h = rect.height;

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
        holdStartTime = performance.now() + 1000; // Cooldown after trigger
      }
    }
  } else {
    currentHoverTarget = null;
    holdStartTime = null;
  }
}

// 4. ACTION TRIGGERS
function triggerAction(action) {
  if (action === 'join') {
    document.getElementById('welcomeScreen').style.opacity = '0';
    setTimeout(() => document.getElementById('welcomeScreen').style.display = 'none', 500);
  } else if (action === 'alarm') {
    toggleModal('alarmModal');
  } else if (action === 'calendar') {
    toggleModal('calendarModal');
  } else if (action === 'ai') {
    toggleModal('aiModal');
  } else if (action === 'subtitle') {
    const sub = document.getElementById('subtitleBox');
    sub.style.display = (sub.style.display === 'block') ? 'none' : 'block';
  } else if (action === 'bookmark') {
    showToast('Lecture Moment Saved');
  } else if (action === 'word') {
    showToast('Key Terms / Glossary Opened');
  }
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
  setTimeout(() => toast.style.display = 'none', 2000);
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
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.6
});

hands.onResults((results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    aim.x = (1 - landmarks[8].x) * W; // Mirrored X coordinate
    aim.y = landmarks[8].y * H;
    aim.visible = true;
  } else {
    aim.visible = false;
  }
});

// 7. CAMERA SETUP (1300x800 Stream)
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