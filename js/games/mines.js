import { UI } from "../core/ui.js";
import { CONFIG } from "../core/config.js";
import { playSound } from "../core/audio.js";
import { createTile, flip } from "../core/utils.js";
import { burstParticles } from "../systems/particles.js";
import { addHistory } from "../systems/history.js";
import { beginGame } from "../core/gameManager.js";
import { update } from "../systems/hud.js";
import {
  gameState,
  player,
  minesGame,
  setMinesPlaying,
  STATE
} from "../core/state.js";

const grid = UI.grid;

export function renderMines() {
  grid.innerHTML = "";
  grid.classList.remove("flex-mode");
  grid.classList.add("grid-mode");
  grid.style.gridTemplateColumns = "repeat(5, 65px)";

  for (let i = 0; i < CONFIG.mines.gridSize; i++) {
    let t = createTile(() => clickMine(t, i));
    grid.appendChild(t);
  }
}

export function startMines() {
  minesGame.multi = 1;
  if (gameState.mines) return;

  const betMines = document.getElementById("betMines");
  const autoMines = document.getElementById("autoMines");
  const bombCount = document.getElementById("bombCount");

  if (!beginGame(parseInt(betMines.value))) return;
  setMinesPlaying(true);
  player.auto = parseFloat(autoMines.value) || 0;

  minesGame.bombs = [];
  minesGame.opened = [];
  let count = parseInt(bombCount.value) || 3;
  minesGame.mineStep = count * CONFIG.mines.plusMultiPerBomb;

  while (minesGame.bombs.length < count) {
    let r = Math.floor(Math.random() * CONFIG.mines.gridSize);
    if (!minesGame.bombs.includes(r)) minesGame.bombs.push(r);
  }

  renderMines();
  update();
}

export function clickMine(el, i) {
  if (!gameState.mines) return;
  if (minesGame.opened.includes(i)) return;
  if (gameState.locked) return;

  if (minesGame.bombs.includes(i)) {
    flip(el, "bomb");
    playSound("bomb", 0.8);
    minesGame.bombs.forEach(b => flip(grid.children[b], "bomb"));

    document.body.classList.add("screen-shake", "flash-lose");
    setTimeout(() => {
      document.body.classList.remove("screen-shake", "flash-lose");
    }, 400);

    setTimeout(() => window.endGame("💣"), 400);
    return;
  }

  minesGame.opened.push(i);
  flip(el, "safe");

  let rect = el.getBoundingClientRect();
  burstParticles(rect.left + 30, rect.top + 30, "#22c55e");
  playSound("win", 0.5);

  el.classList.add("glow");
  setTimeout(() => el.classList.remove("glow"), 350);

  minesGame.multi *= 1 + minesGame.mineStep * 0.45;
  player.multi = minesGame.multi;
  update();

  if (player.auto > 0 && player.multi >= player.auto) {
    setTimeout(window.cashout, 200);
  }
}

export function resetMines() {
  minesGame.bombs = [];
  minesGame.opened = [];
  minesGame.multi = 1;
  minesGame.mineStep = 0;
}
