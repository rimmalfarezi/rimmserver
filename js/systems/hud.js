import { UI } from "../core/ui.js";
import { formatMoney } from "../core/utils.js";
import { gameState, player } from "../core/state.js";

const balanceEl = document.getElementById("balance");

// ===== SMOOTH COUNT UP/DOWN =====
let countAnimFrame = null;
let currentDisplayBalance = null;

export function animateBalance(targetValue) {
  if (currentDisplayBalance === null) {
    currentDisplayBalance = targetValue;
    balanceEl.innerText = formatMoney(targetValue);
    return;
  }

  if (countAnimFrame) cancelAnimationFrame(countAnimFrame);

  const start = currentDisplayBalance;
  const end = targetValue;
  const diff = end - start;
  const duration = Math.min(800, Math.max(300, Math.abs(diff) / 100));
  const startTime = performance.now();

  // Flash color
  const wallet = balanceEl.parentElement;
  wallet.classList.remove("win", "lose");
  wallet.classList.add(diff >= 0 ? "win" : "lose");
  setTimeout(() => wallet.classList.remove("win", "lose"), 600);

  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + diff * eased);
    currentDisplayBalance = current;
    balanceEl.innerText = formatMoney(current);

    if (progress < 1) {
      countAnimFrame = requestAnimationFrame(tick);
    } else {
      currentDisplayBalance = end;
      balanceEl.innerText = formatMoney(end);
    }
  }

  countAnimFrame = requestAnimationFrame(tick);
}

export function updateWallet() {
  animateBalance(player.balance);

  balanceEl.parentElement.classList.add("pulse");
  setTimeout(() => balanceEl.parentElement.classList.remove("pulse"), 400);
}

export function updateHUD() {
  if (gameState.currentGame === "gacha") {
    UI.multi.innerText = "🎰 CASE OPENING";
    UI.profit.innerText = "Hit jackpot untuk menang besar";
    return;
  }

  if (gameState.currentGame === "history") {
    UI.multi.innerText = "📜 HISTORY";
    UI.profit.innerText = "Semua riwayat permainan";
    return;
  }

  UI.multi.innerText = player.multi.toFixed(2) + "x";

  if (gameState.currentGame !== "crash") {
    UI.multi.animate([
      { transform: "scale(1)" },
      { transform: "scale(1.08)" },
      { transform: "scale(1)" }
    ], { duration: 220 });
  }
}

export function updateProfit() {
  if (gameState.currentGame === "gacha") return;
  UI.profit.innerText = "Profit: " + Math.floor((player.multi - 1) * player.bet);
}

export function update() {
  updateWallet();
  updateHUD();
  updateProfit();
}
