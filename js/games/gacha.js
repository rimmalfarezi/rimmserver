import { UI } from "../core/ui.js";
import { CONFIG } from "../core/config.js";
import { playSound } from "../core/audio.js";
import { spawnText, formatMoney } from "../core/utils.js";
import { burstParticles } from "../systems/particles.js";
import { addHistory } from "../systems/history.js";
import { updateProfile } from "../systems/profile.js";
import { updateWallet, updateHUD, updateProfit } from "../systems/hud.js";
import { saveLocal } from "../core/storage.js";
import { toast } from "../systems/toast.js";
import { beginGame } from "../core/gameManager.js";
import {
  gameState,
  player,
  gachaItems,
  setGachaPlaying
} from "../core/state.js";

const grid = UI.grid;

export function renderGacha() {
  grid.classList.remove("grid-mode");
  grid.classList.add("flex-mode");
  grid.innerHTML = "";
  grid.style.justifyContent = "center";
  grid.style.alignItems = "center";

  grid.innerHTML = `
    <div class="gacha-wrapper">
      <div class="gacha-pointer"></div>
      <div id="gachaRoll" class="gacha-roll"></div>
    </div>
  `;

  let roll = document.getElementById("gachaRoll");
  for (let i = 0; i < 40; i++) {
    let randomItem = gachaItems[Math.floor(Math.random() * gachaItems.length)];

    let item = document.createElement("div");
    item.className = "gacha-item";

    if (randomItem === 5) {
      item.classList.add("legendary");
    } else if (randomItem >= 2) {
      item.classList.add("epic");
    } else if (randomItem >= 1) {
      item.classList.add("rare");
    }

    if (randomItem === "💣") {
      item.classList.add("bomb-item");
    }

    item.innerText = randomItem === "💣" ? "💣" : randomItem + "x";
    roll.appendChild(item);
  }
}

export function startGacha() {
  try {
    if (gameState.gacha) return;

    const betGacha = document.getElementById("betGacha");
    let bet = parseInt(betGacha.value);

    if (!bet || bet < 500) {
      toast("Minimal bet 500", "warning");
      return;
    }
    if (bet > player.balance) {
      toast("Balance tidak cukup", "error");
      return;
    }

    player.bet = bet;
    if (!beginGame(bet)) return;

    setGachaPlaying(true);
    renderGacha();

    let roll = document.getElementById("gachaRoll");
    let finalIndex = Math.floor(Math.random() * 30) + 5;
    let finalItem = roll.children[finalIndex];
    let reward = finalItem.innerText;
    let offset = finalIndex * 132 - 280;

    setTimeout(() => {
      roll.style.transform = `translateX(-${offset}px)`;
    }, 100);

    setTimeout(() => {
      if (reward === "💣") {
        addHistory("gacha", "💣 Gacha Lose");
        updateProfile(false);
      } else {
        let totalWin = Math.floor(bet * parseFloat(reward));

        if (parseFloat(reward) >= 3) {
          playSound("jackpot", 1);
        } else {
          playSound("win", 0.6);
        }

        spawnText("JACKPOT", "jackpot");
        burstParticles(window.innerWidth / 2, window.innerHeight / 2, "#a855f7");

        player.balance += totalWin;
        addHistory("gacha", `🎁 ${reward}x Win +${totalWin}`);
        updateProfile(true);
      }

      updateWallet();
      updateHUD();
      updateProfit();
      saveLocal();
      setGachaPlaying(false);
    }, 4500);

  } catch (err) {
    console.error(err);
    setGachaPlaying(false);
  }
}
