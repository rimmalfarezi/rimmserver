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
const DICE_FACES = ["⚀","⚁","⚂","⚃","⚄","⚅"];

export function renderDice() {
  grid.classList.remove("grid-mode");
  grid.classList.add("flex-mode");
  grid.style.flexDirection = "column";
  grid.style.alignItems = "center";
  grid.style.gap = "20px";
  grid.innerHTML = `
    <div class="dice-arena">
      <div class="dice-display" id="diceDisplay">
        <div class="dice-face" id="diceLeft">⚄</div>
        <div class="dice-vs">VS</div>
        <div class="dice-face" id="diceRight">⚂</div>
      </div>
      <div class="dice-result" id="diceResult">
        Pilih: Player lebih tinggi, lebih rendah, atau sama?
      </div>
    </div>
  `;
}

export function startDice(prediction) {
  if (gameState.state === STATE.PLAYING) return;

  const betEl = document.getElementById("betDice");
  const bet = parseInt(betEl?.value);
  if (!bet || bet <= 0) { toast("Masukkan bet dulu", "warning"); return; }
  if (!beginGame(bet)) return;

  setGameLocked(true);

  const resultEl = document.getElementById("diceResult");
  const leftEl = document.getElementById("diceLeft");
  const rightEl = document.getElementById("diceRight");

  if (!resultEl || !leftEl || !rightEl) return;

  resultEl.innerText = "🎲 Rolling...";
  leftEl.classList.add("dice-rolling");
  rightEl.classList.add("dice-rolling");

  let ticks = 0;
  const rollInterval = setInterval(() => {
    leftEl.innerText = DICE_FACES[Math.floor(Math.random() * 6)];
    rightEl.innerText = DICE_FACES[Math.floor(Math.random() * 6)];
    ticks++;
    if (ticks >= 14) {
      clearInterval(rollInterval);
      leftEl.classList.remove("dice-rolling");
      rightEl.classList.remove("dice-rolling");
      resolveDice(bet, prediction, leftEl, rightEl, resultEl);
    }
  }, 80);
}

function resolveDice(bet, prediction, leftEl, rightEl, resultEl) {
  const playerRoll = Math.floor(Math.random() * 6) + 1;
  const houseRoll = Math.floor(Math.random() * 6) + 1;

  leftEl.innerText = DICE_FACES[playerRoll - 1];
  rightEl.innerText = DICE_FACES[houseRoll - 1];

  let win = false;
  if (prediction === "high" && playerRoll > houseRoll) win = true;
  if (prediction === "low" && playerRoll < houseRoll) win = true;
  if (prediction === "equal" && playerRoll === houseRoll) win = true;

  const multiplier = prediction === "equal" ? 5 : 1.9;
  const winAmount = Math.floor(bet * multiplier);

  setTimeout(() => {
    setState(STATE.IDLE);
    setGameLocked(false);

    if (win) {
      player.balance += winAmount;
      resultEl.innerHTML = `<span class="win-text">🎉 KAMU MENANG! +$${formatMoney(winAmount)}</span>`;
      playSound("win", 0.7);
      spawnText("+" + formatMoney(winAmount), "win");
      burstParticles(window.innerWidth / 2, window.innerHeight / 2, "#22c55e");
      addHistory("dice", `🎲 Win +${formatMoney(winAmount)} (${playerRoll} vs ${houseRoll})`);
      updateProfile(true);
    } else {
      resultEl.innerHTML = `<span class="lose-text">💀 KAMU KALAH!</span>`;
      playSound("bomb", 0.5);
      spawnText("-" + formatMoney(bet), "lose");
      burstParticles(window.innerWidth / 2, window.innerHeight / 2, "#ef4444");
      addHistory("dice", `🎲 Lose -${formatMoney(bet)} (${playerRoll} vs ${houseRoll})`);
      updateProfile(false);
    }

    saveLocal();
    update();
  }, 300);
}
