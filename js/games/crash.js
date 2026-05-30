import { UI } from "../core/ui.js";
import { CONFIG } from "../core/config.js";
import { playSound } from "../core/audio.js";
import { addHistory } from "../systems/history.js";
import { updateProfile } from "../systems/profile.js";
import { update } from "../systems/hud.js";
import { saveLocal } from "../core/storage.js";
import { beginGame } from "../core/gameManager.js";
import {
  gameState, player, STATE,
  setCrashMulti, setCrashInterval, setCrashPoint,
  setCtx, clearPoints, setPanic,
  setCrashPlaying, setDecisionOpen, setGameLocked
} from "../core/state.js";

const grid = UI.grid;
const W = 400, H = 260;

// ===== RENDER =====
export function renderCrash() {
  grid.classList.remove("grid-mode");
  grid.classList.add("flex-mode");
  grid.style.flexDirection = "column";
  grid.style.alignItems = "center";
  grid.style.justifyContent = "center";
  grid.innerHTML = `<canvas id='chart' width='${W}' height='${H}' style='border-radius:14px;background:#020617;max-width:100%;'></canvas>`;
  setCtx(document.getElementById("chart").getContext("2d"));
  clearPoints();
  drawGraph();
}

// ===== GRAPH =====
// ===== Tambah di atas file, setelah const W, H =====
let bgStars = [];
let bgClouds = [];
let bgMoons = [];
let bgInitialized = false;
let rocketProgress = 0; // 0 = bawah-kiri, 1 = tengah (settled)

const ROCKET_START_X = W * 0.08;
const ROCKET_START_Y = H * 0.88;
const ROCKET_END_X = W * 0.48;
const ROCKET_END_Y = H * 0.42;
const SETTLE_TICKS = 60; // rocket sampai tengah dalam 60 ticks (~3 detik)

function initBackground() {
  bgStars = [];
  bgClouds = [];
  bgMoons = [];

  // Bintang kecil
  for (let i = 0; i < 40; i++) {
    bgStars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 1 + Math.random() * 2,
      speed: 1 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.6
    });
  }

  // Awan
  for (let i = 0; i < 4; i++) {
    bgClouds.push({
      x: Math.random() * W,
      y: -20 + Math.random() * H * 0.3,
      width: 35 + Math.random() * 55,
      speed: 0.8 + Math.random() * 1.2,
      opacity: 0.07 + Math.random() * 0.08
    });
  }

  // Bulan
  for (let i = 0; i < 2; i++) {
    bgMoons.push({
      x: W * 0.3 + Math.random() * W * 0.5,
      y: -20 - Math.random() * 40,
      size: 14 + Math.random() * 8,
      speed: 0.5 + Math.random() * 0.5
    });
  }

  bgInitialized = true;
}

function updateBackground() {
  // Semua bergerak ke BAWAH — ilusi rocket naik
  bgStars.forEach(s => {
    s.y += s.speed;
    if (s.y > H + 5) {
      s.y = -5;
      s.x = Math.random() * W;
      s.opacity = 0.3 + Math.random() * 0.6;
    }
  });

  bgClouds.forEach(c => {
    c.y += c.speed;
    if (c.y > H + 30) {
      c.y = -40;
      c.x = Math.random() * W;
      c.width = 35 + Math.random() * 55;
    }
  });

  bgMoons.forEach(m => {
    m.y += m.speed;
    if (m.y > H + 40) {
      m.y = -40;
      m.x = W * 0.2 + Math.random() * W * 0.6;
    }
  });
}

function drawBackgroundElements(ctx) {
  // Stars
  bgStars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.fill();
  });

  // Clouds
  bgClouds.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.width, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(148,163,184,${c.opacity})`;
    ctx.fill();
  });

  // Moons
  bgMoons.forEach(m => {
    ctx.font = `${m.size}px serif`;
    ctx.fillText("🌙", m.x, m.y);
  });
}

// ===== GANTI SELURUH drawGraph() =====
export function drawGraph() {
  const ctx = gameState.ctx;
  if (!ctx) return;

  if (!bgInitialized) initBackground();

  if (gameState.crash) updateBackground();

  ctx.clearRect(0, 0, W, H);

  // Sky background
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, "#020617");
  skyGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Draw moving background
  drawBackgroundElements(ctx);

  const pts = gameState.points;

  // Color based on danger
  let color = "#22c55e";
  if (gameState.crashMulti > gameState.crashPoint * 0.7) color = "#f97316";
  if (gameState.crashMulti > gameState.crashPoint * 0.9) color = "#ef4444";

  let colorAlpha;
  if (color === "#22c55e") colorAlpha = "rgba(34,197,94,0.15)";
  else if (color === "#f97316") colorAlpha = "rgba(249,115,22,0.15)";
  else if (color === "#ef4444") colorAlpha = "rgba(239,68,68,0.15)";
  else colorAlpha = "rgba(34,197,94,0.15)";

  // Rocket position and progress
  if (gameState.crash) {
    rocketProgress = Math.min(1, rocketProgress + (1 / SETTLE_TICKS));
  }

  const ease = 1 - Math.pow(1 - rocketProgress, 3);
  const rocketX = ROCKET_START_X + (ROCKET_END_X - ROCKET_START_X) * ease;
  const rocketY = ROCKET_START_Y + (ROCKET_END_Y - ROCKET_START_Y) * ease;

  // Exhaust particles behind rocket (same as before)
  if (gameState.crash && pts.length > 3) {
    for (let i = 0; i < 4; i++) {
      const px = rocketX + (Math.random() - 0.5) * 10;
      const py = rocketY + 20 + Math.random() * 18;
      const size = 2 + Math.random() * 5;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(251,146,60,${0.2 + Math.random() * 0.5})`;
      ctx.fill();
    }
    for (let i = 0; i < 2; i++) {
      const sx = rocketX + (Math.random() - 0.5) * 14;
      const sy = rocketY + 30 + Math.random() * 12;
      const ssize = 4 + Math.random() * 6;
      ctx.beginPath();
      ctx.arc(sx, sy, ssize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,116,139,${0.1 + Math.random() * 0.15})`;
      ctx.fill();
    }
  }

  // Rocket glow and emoji (same as before)
  ctx.beginPath();
  ctx.arc(rocketX, rocketY, 16, 0, Math.PI * 2);
  ctx.fillStyle = colorAlpha;
  ctx.shadowBlur = 20;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.font = "24px serif";
  ctx.fillText("🚀", rocketX - 12, rocketY + 8);

  // === SCROLLING GRAPH LINE ===
  if (pts.length >= 2) {
    const graphTop = H * 0.68;
    const graphBottom = H - 8;
    const graphHeight = graphBottom - graphTop;
    const PIXELS_PER_POINT = 2.5;
    const maxVisiblePoints = Math.floor(W / PIXELS_PER_POINT);

    // Calculate how many points fit to the left of rocketX
    const pointsBeforeRocket = Math.floor(rocketX / PIXELS_PER_POINT);

    // The graph window should end at rocketX, so startIdx is:
    let endIdx = pts.length - 1;
    let startIdx = Math.max(0, endIdx - pointsBeforeRocket);

    // If not enough points to fill left side, shift startIdx back to show from 0
    if (startIdx === 0) {
      endIdx = Math.min(pts.length - 1, pointsBeforeRocket);
    }

    const currentMax = Math.max(...pts.slice(startIdx, endIdx + 1));
    const yScale = graphHeight / Math.max(currentMax - 1, 0.5);

    function getY(val) {
      return graphBottom - (val - 1) * yScale;
    }
    function getX(i) {
      return rocketX - (endIdx - i) * PIXELS_PER_POINT;
    }

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, graphTop, 0, graphBottom);
    grad.addColorStop(0, colorAlpha);
    grad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    for (let i = startIdx; i <= endIdx; i++) {
      const x = getX(i);
      const y = getY(pts[i]);
      i === startIdx ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const lastX = getX(endIdx);
    ctx.lineTo(lastX, graphBottom);
    ctx.lineTo(getX(startIdx), graphBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line stroke
    ctx.beginPath();
    for (let i = startIdx; i <= endIdx; i++) {
      const x = getX(i);
      const y = getY(pts[i]);
      i === startIdx ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Tip glow
    const tipX = lastX;
    const tipY = getY(pts[endIdx]);
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Multiplier text (top center)
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(gameState.crashMulti.toFixed(2) + "x", W / 2, 26);
  ctx.textAlign = "start";
}




export function closeDecision(sound = true) {
  const el = document.getElementById("crashDecision");
  if (el) el.classList.add("hidden");
  setDecisionOpen(false);
  if (sound) playSound("click", 0.4);
}


// ===== CRASH POINT GENERATOR — lebih susah =====
function generateCrashPoint() {
  // House edge ~45% — mayoritas crash di bawah 2x
  const r = Math.random();
  if (r < 0.30) return 1 + Math.random() * 0.4;        // 30%: crash 1.0–1.4x
  if (r < 0.55) return 1.4 + Math.random() * 0.6;      // 25%: crash 1.4–2x
  if (r < 0.72) return 2 + Math.random() * 1.5;        // 17%: crash 2–3.5x
  if (r < 0.84) return 3.5 + Math.random() * 2.5;      // 12%: crash 3.5–6x
  if (r < 0.93) return 6 + Math.random() * 4;          // 9%: crash 6–10x
  return 10 + Math.random() * 10;                       // 7%: crash 10–20x
}

// ===== TICK =====
function crashTick(autoCrashVal) {
  const multi = gameState.crashMulti;
  const point = gameState.crashPoint;

  setPanic(multi > point * 0.80);

  // Smoother speed curve — exponential acceleration
  let speed = 0.003 + (multi - 1) * 0.002;

  // Random micro-fluctuations biar nggak boring
  if (Math.random() > 0.75) speed *= (0.5 + Math.random() * 0.8);
  if (Math.random() > 0.92) speed *= 1.8; // sudden spike

  const newMulti = Math.max(1, multi + speed);
  setCrashMulti(newMulti);
  player.multi = newMulti;

  gameState.points.push(newMulti);
  if (gameState.points.length > 300) gameState.points.shift();

  drawGraph();

  if (autoCrashVal > 1 && newMulti >= autoCrashVal && gameState.state === STATE.PLAYING) {
    cashoutCrash();
    return;
  }

  update();

  if (gameState.panic && Math.random() > 0.92) {
    document.body.classList.add("screen-shake");
    setTimeout(() => document.body.classList.remove("screen-shake"), 60);
  }
}


// ===== START =====
export function startCrash() {
  if (gameState.crash) return;

  const betCrash = document.getElementById("betCrash");
  if (!beginGame(parseInt(betCrash.value))) return;

  setCrashPlaying(true);
  playSound("rocket", 0.15);
  setCrashMulti(1);
  setCrashPoint(generateCrashPoint());
  clearPoints();

  rocketProgress = 0;
  bgInitialized = false; // re-init background for new game
  drawGraph();

  const autoCrash = document.getElementById("autoCrash");

  setCrashInterval(setInterval(() => {
  if (gameState.crashMulti >= gameState.crashPoint) {
    clearInterval(gameState.crashInterval);
    setCrashInterval(null);
    endCrash();
    return;
  }
  crashTick(parseFloat(autoCrash.value));
}, 50));  // ← 50ms = smoother animation
}

export function resumeCrash() {
  // Stub — popup dihapus, tidak dipakai lagi
}

// ===== CASHOUT =====
export function cashoutCrash() {
  if (gameState.state !== STATE.PLAYING) return;

  clearInterval(gameState.crashInterval);
  setCrashInterval(null);

  const finalMulti = gameState.crashMulti;
  const winAmount = Math.floor(player.bet * finalMulti);

  player.balance += winAmount;
  playSound("cashout", 0.7);  // ✅ Sound
  playSound("win", 0.5);      // ✅ Sound
  addHistory("crash", `🚀 ${finalMulti.toFixed(2)}x +${winAmount}`);
  player.multi = finalMulti;

  updateProfile(true);
  saveLocal();
  update();
  setGameLocked(false);
  setCrashPlaying(false);
  window.reset();
}

// ===== END (crash/lose) =====
export function endCrash() {
  playSound("bomb", 0.6);

  const ctx = gameState.ctx;
  if (ctx) {
    // Explosion at rocket's final position
    const ease = 1 - Math.pow(1 - rocketProgress, 3);
    const rx = ROCKET_START_X + (ROCKET_END_X - ROCKET_START_X) * ease;
    const ry = ROCKET_START_Y + (ROCKET_END_Y - ROCKET_START_Y) * ease;

    ctx.font = "40px serif";
    ctx.textAlign = "center";
    ctx.fillText("💥", rx, ry + 12);

    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#ef4444";
    ctx.fillText("CRASHED!", W / 2, H * 0.2);
    ctx.textAlign = "start";
  }

  setCrashPlaying(false);
  setGameLocked(false);
  addHistory("crash", `💥 Crash ${gameState.crashPoint.toFixed(2)}x — Lose -${player.bet}`);
  updateProfile(false);
  saveLocal();

  setTimeout(() => window.reset(), 1200);
}


// ===== RESET =====
export function resetCrash() {
  if (gameState.crashInterval) {
    clearInterval(gameState.crashInterval);
    setCrashInterval(null);
  }
  setCrashMulti(1);
  setPanic(false);
}
