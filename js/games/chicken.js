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

const TOTAL_LANES = 10;   // lebih panjang
const ROWS = 5;
const MID = Math.floor(ROWS / 2);
const MULTI_PER_LANE = 0.25;  // naik 0.25x per lane
const CAR_EMOJIS = ["🚗","🚕","🚙","🚌","🚓"];

const cs = {
  playing: false,
  lane: 0,
  multi: 1,
  cars: []
};

// ===== RENDER =====
export function renderChicken() {
  grid.classList.remove("grid-mode");
  grid.classList.add("flex-mode");
  grid.style.flexDirection = "column";
  grid.style.alignItems = "center";
  grid.style.gap = "10px";
  grid.innerHTML = `
    <div style="overflow-x:auto;width:100%;display:flex;justify-content:center;">
      <div class="chicken-board" id="chickenBoard"></div>
    </div>
    <div class="chicken-status" id="chickenStatus">
      Tekan <b>START</b> untuk main, lalu <b>JALAN 🐔</b> tiap langkah!
    </div>
  `;
  drawBoard();
}

function drawBoard() {
  const board = document.getElementById("chickenBoard");
  if (!board) return;
  board.innerHTML = "";

  const totalCols = TOTAL_LANES + 2;
  board.style.display = "grid";
  board.style.gridTemplateColumns = `repeat(${totalCols}, 42px)`;
  board.style.gap = "3px";
  board.style.padding = "8px";

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < totalCols; col++) {
      const cell = document.createElement("div");
      cell.className = "chicken-cell";
      cell.id = `cc-${row}-${col}`;
      cell.style.width = "42px";
      cell.style.height = "42px";
      cell.style.fontSize = "18px";

      if (col === 0) {
        cell.classList.add("chicken-start");
        if (row === MID) {
          cell.innerText = cs.playing && cs.lane === 0 ? "🐔" : "🏠";
          if (cs.playing && cs.lane === 0) cell.classList.add("chicken-here");
        }
      } else if (col === totalCols - 1) {
        cell.classList.add("chicken-finish");
        if (row === MID) {
          cell.innerText = cs.playing && cs.lane > TOTAL_LANES ? "🐔" : "🏁";
          if (cs.playing && cs.lane > TOTAL_LANES) cell.classList.add("chicken-here");
        }
      } else {
        cell.classList.add("chicken-road");

        const isChickenHere = cs.playing && cs.lane === col && row === MID;
        const hasCar = cs.cars.some(c => c.col === col && c.row === row);

        if (isChickenHere) {
          cell.innerText = "🐔";
          cell.classList.add("chicken-here");
        } else if (hasCar) {
          // Hanya tampilkan mobil di lane yang sudah dilewati atau lane berikutnya
          if (col <= cs.lane + 1) {
            cell.innerText = CAR_EMOJIS[(col + row) % CAR_EMOJIS.length];
            cell.classList.add("chicken-car");
          }
        }
      }

      board.appendChild(cell);
    }
  }
}

// ===== CAR GENERATION — susah ditebak =====
function generateCars(col) {
  cs.cars = cs.cars.filter(c => c.col !== col);

  // Jumlah mobil random 1-3, posisi row random
  const count = Math.floor(Math.random() * 3) + 1;
  const usedRows = [];

  for (let i = 0; i < count; i++) {
    if (usedRows.length >= ROWS) break;
    let row;
    let attempts = 0;
    do {
      row = Math.floor(Math.random() * ROWS);
      attempts++;
    } while (usedRows.includes(row) && attempts < 20);

    if (!usedRows.includes(row)) {
      usedRows.push(row);
      cs.cars.push({ col, row });
    }
  }
}

// ===== START =====
let resolveTimer = null;

export function startChicken() {
  if (cs.playing) return;

  const betEl = document.getElementById("betChicken");
  const bet = parseInt(betEl?.value);
  if (!bet || bet <= 0) { toast("Masukkan bet dulu", "warning"); return; }
  if (!beginGame(bet)) return;

  //Cancel pending resolve timeout dari game sebelumnya
  if (resolveTimer) {
    clearTimeout(resolveTimer);
    resolveTimer = null;
  }

  cs.playing = true;
  cs.lane = 0;
  cs.multi = 1;
  cs.cars = [];

  // Generate cars — GUARANTEE minimal 40% lanes punya mobil di MID
  for (let col = 1; col <= TOTAL_LANES; col++) generateCars(col);
  ensureMinCars();

  player.multi = 1;
  drawBoard();
  updateStatus();
}

// ===== STEP =====
export function stepChicken() {
  if (!cs.playing) { toast("Tekan START dulu!", "warning"); return; }
  if (gameState.locked) return;

  const nextLane = cs.lane + 1;

  // Sampai finish
  if (nextLane > TOTAL_LANES) {
    cs.lane = nextLane;
    drawBoard();
    resolveChicken(true, "finish");
    return;
  }

  // Cek tabrak
  const hit = cs.cars.some(c => c.col === nextLane && c.row === MID);
  cs.lane = nextLane;
  drawBoard();

  if (hit) {
    const cell = document.getElementById(`cc-${MID}-${nextLane}`);
    if (cell) { cell.innerText = "💥"; cell.classList.add("chicken-explode"); }
    playSound("bomb", 0.8);
    document.body.classList.add("screen-shake", "flash-lose");
    setTimeout(() => document.body.classList.remove("screen-shake", "flash-lose"), 400);
    setTimeout(() => resolveChicken(false, "hit"), 700);
    return;
  }

  // Aman — naikkan multi
  cs.multi = parseFloat((cs.multi + MULTI_PER_LANE).toFixed(2));
  player.multi = cs.multi;
  playSound("win", 0.35);
  update();
  updateStatus();
  drawBoard();
}

// ===== CASHOUT =====
export function cashoutChicken() {
  if (!cs.playing) return;
  if (cs.lane === 0) { toast("Jalan dulu baru cashout!", "warning"); return; }
  resolveChicken(true, "cashout");
}

// ===== RESOLVE =====
function resolveChicken(win, reason) {
  cs.playing = false;
  setState(STATE.IDLE);
  setGameLocked(false);

  const bet = player.bet;
  const statusEl = document.getElementById("chickenStatus");

  if (win) {
    const winAmount = Math.floor(bet * cs.multi);
    player.balance += winAmount;
    const label = reason === "finish" ? "🏁 FINISH!" : "💰 Cashout";
    if (statusEl) statusEl.innerHTML = `<span class="win-text">${label} ${cs.multi.toFixed(2)}x = +${formatMoney(winAmount)}</span>`;
    spawnText("+" + formatMoney(winAmount), cs.multi >= 2 ? "jackpot" : "win");
    burstParticles(window.innerWidth / 2, window.innerHeight / 2, "#22c55e");
    playSound(cs.multi >= 2 ? "jackpot" : "cashout", 0.7);
    addHistory("chicken", `${label} ${cs.multi.toFixed(2)}x +${formatMoney(winAmount)}`);
    updateProfile(true);
  } else {
    if (statusEl) statusEl.innerHTML = `<span class="lose-text">💥 Ayam kena mobil! -${formatMoney(bet)}</span>`;
    spawnText("-" + formatMoney(bet), "lose");
    addHistory("chicken", `💥 Kena mobil di lane ${cs.lane}! -${formatMoney(bet)}`);
    updateProfile(false);
  }

  saveLocal();
  player.multi = 1;
  update();

  resolveTimer = setTimeout(() => {
  resolveTimer = null;
  cs.cars = [];
  cs.lane = 0;
  cs.multi = 1;
  renderChicken();
  update();
}, 1800);
}

// Pastikan minimal 40% lane di tengah (MID) punya mobil untuk jaga tingkat kesulitan
function ensureMinCars() {
  const midCars = cs.cars.filter(c => c.row === MID);
  const minRequired = Math.floor(TOTAL_LANES * 0.4); // minimal 4 dari 10 lane

  if (midCars.length < minRequired) {
    const freeLanes = [];
    for (let col = 1; col <= TOTAL_LANES; col++) {
      if (!cs.cars.some(c => c.col === col && c.row === MID)) {
        freeLanes.push(col);
      }
    }
    // Shuffle dan tambah mobil sampai minimum tercapai
    freeLanes.sort(() => Math.random() - 0.5);
    const needed = minRequired - midCars.length;
    for (let i = 0; i < needed && i < freeLanes.length; i++) {
      cs.cars.push({ col: freeLanes[i], row: MID });
    }
  }
}

// STATUS
function updateStatus() {
  const el = document.getElementById("chickenStatus");
  if (!el) return;

  if (!cs.playing || cs.lane === 0) {
    el.innerHTML = `Tekan <b>START</b> untuk main, lalu <b>JALAN 🐔</b> tiap langkah!`;
    return;
  }

  const profit = Math.floor(player.bet * cs.multi);
  el.innerHTML = `
    Lane <b>${cs.lane}/${TOTAL_LANES}</b> &nbsp;·&nbsp;
    Multi: <span class="win-text"><b>${cs.multi.toFixed(2)}x</b></span> &nbsp;·&nbsp;
    +${formatMoney(profit)} &nbsp;—&nbsp; Lanjut atau Cashout?
  `;
}

// ===== RESET =====
export function resetChicken() {
  cs.playing = false;
  cs.lane = 0;
  cs.multi = 1;
  cs.cars = [];
}
