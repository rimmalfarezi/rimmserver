import { UI } from "../core/ui.js";
import { playSound } from "../core/audio.js";
import { spawnText, formatMoney } from "../core/utils.js";
import { burstParticles } from "../systems/particles.js";
import { addHistory } from "../systems/history.js";
import { updateProfile } from "../systems/profile.js";
import { update } from "../systems/hud.js";
import { saveLocal } from "../core/storage.js";
import { beginGame } from "../core/gameManager.js";
import { toast } from "../systems/toast.js";
import { gameState, player, STATE, setState, setGameLocked } from "../core/state.js";

const grid = UI.grid;
const ROWS = 8;
const MULTIPLIERS = [10, 3, 1.5, 0.5, 0.3, 0.5, 1.5, 3, 10];
const COLORS = ["#f59e0b","#f97316","#22c55e","#64748b","#ef4444","#64748b","#22c55e","#f97316","#f59e0b"];

export function renderPlinko() {
  grid.classList.remove("grid-mode");
  grid.classList.add("flex-mode");
  grid.style.flexDirection = "column";
  grid.style.alignItems = "center";
  grid.style.gap = "0px";
  grid.innerHTML = `
    <div class="plinko-wrapper">
      <canvas id="plinkoCanvas" width="340" height="300"></canvas>
      <div class="plinko-slots">
        ${MULTIPLIERS.map((m, i) => `
          <div class="plinko-slot" id="pslot${i}" style="background:${COLORS[i]}">${m}x</div>
        `).join("")}
      </div>
      <div class="plinko-result" id="plinkoResult">Drop the ball!</div>
    </div>
  `;
  drawBoard();
}

function drawBoard() {
  const canvas = document.getElementById("plinkoCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 340, 300);
  for (let row = 0; row < ROWS; row++) {
    const pins = row + 2;
    for (let col = 0; col < pins; col++) {
      const x = 170 - (pins - 1) * 18 + col * 36;
      const y = 28 + row * 33;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fill();
    }
  }
}

export function dropPlinko() {
  if (gameState.state === STATE.PLAYING) return;

  const betEl = document.getElementById("betPlinko");
  const bet = parseInt(betEl?.value);
  if (!bet || bet <= 0) { toast("Masukkan bet dulu", "warning"); return; }
  if (!beginGame(bet)) return;

  setGameLocked(true);

  const canvas = document.getElementById("plinkoCanvas");
  const ctx = canvas.getContext("2d");
  const resultEl = document.getElementById("plinkoResult");
  resultEl.innerText = "🔵 Dropping...";

  // Simulate path
  let col = 0;
  const path = [];
  for (let row = 0; row < ROWS; row++) {
    if (Math.random() > 0.5) col++;
    path.push({ row, col });
  }
  const finalSlot = col;

  // Pin positions
  function pinPos(row, c) {
    const pins = row + 2;
    return {
      x: 170 - (pins - 1) * 18 + c * 36,
      y: 28 + row * 33
    };
  }

  let step = 0;
  let ballX = 170, ballY = 5;

  function animate() {
    drawBoard();
    ctx.beginPath();
    ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#facc15";
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#facc15";
    ctx.fill();
    ctx.shadowBlur = 0;

    if (step < path.length) {
      const target = pinPos(path[step].row, path[step].col);
      ballX += (target.x - ballX) * 0.22;
      ballY += (target.y - ballY) * 0.22;
      if (Math.abs(ballY - target.y) < 3) step++;
      requestAnimationFrame(animate);
    } else {
      ballY += 6;
      if (ballY < 285) {
        requestAnimationFrame(animate);
      } else {
        resolvePlinko(bet, finalSlot, resultEl);
      }
    }
  }
  animate();
}

// Ganti bagian setelah ball lands (di dalam animate() resolve):
// Cari dimana finalSlot dipakai, ganti resolve logic jadi:

function resolveResult(bet, finalSlot) {
  const multi = MULTIPLIERS[finalSlot];
  const winAmount = Math.floor(bet * multi);
  const resultEl = document.getElementById("plinkoResult");
  const slotEl = document.getElementById(`pslot${finalSlot}`);

  // Highlight slot
  if (slotEl) slotEl.classList.add("plinko-slot-hit");
  setTimeout(() => slotEl?.classList.remove("plinko-slot-hit"), 1500);

  setState(STATE.IDLE);
  setGameLocked(false);

  if (multi >= 1) {
    player.balance += winAmount;
    resultEl.innerHTML = `<span class="win-text">🎉 ${multi}x — +$${formatMoney(winAmount)}</span>`;
    playSound("win", 0.6);
    spawnText("+" + formatMoney(winAmount), "win");
    burstParticles(window.innerWidth / 2, window.innerHeight / 2, COLORS[finalSlot]);
    addHistory("plinko", `🔵 ${multi}x Win +${formatMoney(winAmount)}`);
    updateProfile(true);
  } else {
    const lostAmount = bet - winAmount;
    player.balance += winAmount;
    resultEl.innerHTML = `<span class="lose-text">😢 ${multi}x — -$${formatMoney(lostAmount)}</span>`;
    playSound("lose", 0.5);
    spawnText("-" + formatMoney(lostAmount), "lose");
    addHistory("plinko", `🔵 ${multi}x Lose -${formatMoney(lostAmount)}`);
    updateProfile(false);
  }

  saveLocal();
  update();
}
