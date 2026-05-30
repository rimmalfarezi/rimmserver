import { historyArr } from "../core/state.js";
import { playSound } from "../core/audio.js";

export function addHistory(game, text) {
  historyArr.unshift({ game, text });
  if (historyArr.length > 20) historyArr.pop();
  renderHistory();
}

export function renderHistory(filter = "all") {
  document.querySelectorAll(".history-top button").forEach(btn => btn.classList.remove("active"));

  const map = { all: 0, gacha: 1, tower: 2, mines: 3, crash: 4, dice: 5, plinko: 6, chicken: 7 };
  const btns = document.querySelectorAll(".history-top button");
  if (btns[map[filter]]) btns[map[filter]].classList.add("active");

  const box = document.getElementById("historyList");
  if (!box) return;
  box.innerHTML = "";

  const filtered = historyArr.filter(h => filter === "all" || h.game === filter);

  filtered.forEach(h => {
    const d = document.createElement("div");
    d.className = "history-card";
    d.innerHTML = `
      <div class="history-game">${h.game.toUpperCase()}</div>
      <div class="history-text">${h.text}</div>
    `;
    box.appendChild(d);
  });
}

export function openHistory() {
  playSound("click", 0.4);

  // Gunakan getElementById agar tidak bergantung pada variable global
  document.getElementById("lobbyScreen")?.classList.add("hidden");
  document.getElementById("gameScreen")?.classList.add("hidden");
  document.getElementById("historyBox")?.classList.remove("hidden");

  // Hide semua panel
  ["panelGacha","panelTower","panelMines","panelCrash","panelDice","panelPlinko","panelChicken"]
    .forEach(id => document.getElementById(id)?.classList.add("hidden"));

  // Set tombol History active
  document.querySelectorAll(".nav button").forEach(btn => btn.classList.remove("active"));
  document.getElementById("btnHistory")?.classList.add("active");

  renderHistory();
}