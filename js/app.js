import { saveLocal, loadLocal } from "./core/storage.js";
import { playSound } from "./core/audio.js";
import { formatMoney, spawnText } from "./core/utils.js";
import {
  STATE, setState, gameState,
  setCurrentGame, setGameLocked, setDecisionOpen,
  player, setGachaPlaying, setMinesPlaying,
  setTowerPlaying, setCrashPlaying, setCrashMulti,
  setCrashInterval, setPanic
} from "./core/state.js";

import { addHistory, renderHistory, openHistory } from "./systems/history.js";
import { updateProfile, renderProfile } from "./systems/profile.js";
import { startFeed } from "./systems/feed.js";
import { UI } from "./core/ui.js";
import { toast } from "./systems/toast.js";
import { burstParticles } from "./systems/particles.js";
import { updateHUD, update, updateProfit, updateWallet } from "./systems/hud.js";

import { startTower, renderTower, resetTower } from "./games/tower.js";
import { startGacha, renderGacha } from "./games/gacha.js";
import { startMines, renderMines, resetMines } from "./games/mines.js";
import { startCrash, renderCrash, resumeCrash, cashoutCrash, endCrash, resetCrash, closeDecision } from "./games/crash.js";
import { initDrawer, openDrawer, closeDrawer, getActivePanel, transitionGrid } from "./systems/drawer.js";
import { supabase } from "./core/storage.js";
import { startDice, renderDice } from "./games/dice.js";
import { dropPlinko, renderPlinko } from "./games/plinko.js";
import { startChicken, renderChicken, stepChicken, cashoutChicken, resetChicken } from "./games/chicken.js";


// ===== ELEMENTS =====
const historyBox = document.getElementById("historyBox");
const gameScreen = document.getElementById("gameScreen");
const lobbyScreen = document.getElementById("lobbyScreen");

const panelGacha = document.getElementById("panelGacha");
const panelTower = document.getElementById("panelTower");
const panelMines = document.getElementById("panelMines");
const panelCrash = document.getElementById("panelCrash");
const panelDice = document.getElementById("panelDice");
const panelPlinko = document.getElementById("panelPlinko");
const panelChicken = document.getElementById("panelChicken");


const grid = UI.grid;
const balanceEl = UI.balance;
const multiEl = UI.multi;
const profitEl = UI.profit;

function unlockGame() { setGameLocked(false); }

// ===== SWITCH GAME =====
function switchGame(g) {
  playSound("click", 0.4);
  setCurrentGame(g);

  document.querySelectorAll(".nav button").forEach(btn => btn.classList.remove("active"));

  if (g !== "history") {
    document.getElementById("btnHome").classList.add("active");
  }

  if (g === "gacha") {
    multiEl.innerText = "🎰 CASE OPENING";
    profitEl.innerText = "Hit jackpot untuk menang besar";
  } else {
    multiEl.innerText = player.multi.toFixed(2) + "x";
    profitEl.innerText = "Profit: " + Math.floor((player.multi - 1) * player.bet);
  }

  panelGacha.classList.toggle("hidden", g !== "gacha");
  panelTower.classList.toggle("hidden", g !== "tower");
  panelMines.classList.toggle("hidden", g !== "mines");
  panelCrash.classList.toggle("hidden", g !== "crash");
  panelDice.classList.toggle("hidden", g !== "dice");
  panelPlinko.classList.toggle("hidden", g !== "plinko");
  panelChicken.classList.toggle("hidden", g !== "chicken");


  if (g === "gacha") renderGacha();
  if (g === "mines") renderMines();
  if (g === "crash") renderCrash();
  if (g === "dice") renderDice();
  if (g === "plinko") renderPlinko();
  if (g === "chicken") renderChicken();


  transitionGrid();

  if (g === "history") {
    multiEl.style.display = "none";
    profitEl.style.display = "none";
    lobbyScreen.classList.add("hidden");
    gameScreen.classList.add("hidden");
    historyBox.classList.remove("hidden");
    panelGacha.classList.add("hidden");
    panelTower.classList.add("hidden");
    panelMines.classList.add("hidden");
    panelCrash.classList.add("hidden");
    panelDice.classList.add("hidden");
    panelPlinko.classList.add("hidden");
    panelChicken.classList.add("hidden");

    renderHistory();
  } else {
    multiEl.style.display = "block";
    profitEl.style.display = "block";
    gameScreen.classList.remove("hidden");
    historyBox.classList.add("hidden");
  }
}

// ===== CASHOUT =====
function cashout() {
  if (gameState.state !== STATE.PLAYING) return;
  playSound("cashout", 0.7);

  spawnText("+" + formatMoney(Math.floor(player.bet * player.multi)), "win");
  burstParticles(window.innerWidth / 2, window.innerHeight / 2, "#22c55e");

  player.balance += Math.floor(player.bet * player.multi);
  addHistory(gameState.currentGame, "💰 Win +" + formatMoney(Math.floor(player.bet * player.multi)));
  updateProfile(true);
  saveLocal();

  balanceEl.parentElement.classList.add("win");
  multiEl.classList.add("win-pop");
  setTimeout(() => multiEl.classList.remove("win-pop"), 400);

  update();
  reset();
}

// ===== END GAME (lose) =====
function endGame() {
  if (gameState.currentGame === "tower") setTowerPlaying(false);
  if (gameState.currentGame === "mines") setMinesPlaying(false);
  if (gameState.currentGame === "crash") setCrashPlaying(false);
  if (gameState.currentGame === "gacha") setGachaPlaying(false);

  setGameLocked(true);

  spawnText("-" + formatMoney(player.bet), "lose");
  burstParticles(window.innerWidth / 2, window.innerHeight / 2, "#ef4444");

  addHistory(gameState.currentGame, "💀 Lose -" + player.bet);
  updateProfile(false);
  saveLocal();
  balanceEl.parentElement.classList.add("lose");
  update();

  setTimeout(() => {
    resetMines();
    resetCrash();
    resetChicken();
    setGameLocked(false);
    unlockGame();
    setState(STATE.IDLE);
    reset();
  }, 500);
}

// ===== RESET =====
function reset() {
  setTowerPlaying(false);
  setMinesPlaying(false);
  setCrashPlaying(false);
  setGachaPlaying(false);
  setGameLocked(false);
  setDecisionOpen(false);
  unlockGame();
  setState(STATE.IDLE);
  setCrashMulti(1);
  player.bet = 0;

  document.querySelectorAll(".tile").forEach(tile => tile.style.pointerEvents = "auto");
  document.querySelectorAll(".panel").forEach(p => p.style.pointerEvents = "auto");

  player.multi = 1;
  resetMines();
  resetCrash();
  resetChicken();
  player.auto = 0;
  setPanic(false);

  if (gameState.crashInterval) {
    clearInterval(gameState.crashInterval);
    setCrashInterval(null);
  }

  if (player.balance < 0) player.balance = 0;
  update();
  saveLocal();
}

// ===== BET HELPERS =====
function setBet(amount) {
  const map = {
    tower: "betTower",
    mines: "betMines",
    crash: "betCrash",
    gacha: "betGacha"
  };
  const id = map[gameState.currentGame];
  if (id) document.getElementById(id).value = amount;
}

function halfBet() { setBet(Math.floor(player.balance / 2)); }
function maxBet() { setBet(player.balance); }

// ===== NAVIGATION =====
function enterGame(game) {
  lobbyScreen.classList.add("hidden");
  historyBox.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  multiEl.style.display = "none";
  profitEl.style.display = "none";
  panelGacha.classList.add("hidden");
  panelTower.classList.add("hidden");
  panelMines.classList.add("hidden");
  panelCrash.classList.add("hidden");
  panelDice.classList.add("hidden");     
  panelPlinko.classList.add("hidden"); 
  panelChicken.classList.add("hidden");
  switchGame(game);
  setTimeout(() => openDrawer(getActivePanel(game)), 300);
}

function goHome() {
  historyBox.classList.add("hidden");
  gameScreen.classList.add("hidden");
  lobbyScreen.classList.remove("hidden");
  setGachaPlaying(false);
  grid.innerHTML = "";
  playSound("click", 0.4);
  closeDecision(false);
  reset();

  document.querySelectorAll(".panel").forEach(p => p.classList.add("hidden"));
  multiEl.style.display = "none";
  profitEl.style.display = "none";
  panelGacha.classList.add("hidden");
  panelTower.classList.add("hidden");
  panelMines.classList.add("hidden");
  panelCrash.classList.add("hidden");
  panelDice.classList.add("hidden");
  panelPlinko.classList.add("hidden");
  panelChicken.classList.add("hidden");


  document.querySelectorAll(".nav button").forEach(btn => btn.classList.remove("active"));
  document.getElementById("btnHome").classList.add("active");
  document.getElementById("historyBox").classList.add("hidden");
  gameScreen.classList.add("hidden");
  lobbyScreen.classList.remove("hidden");
}

// ===== DAILY REWARD =====
let claimingDaily = false;
let dailyData = { day: 1, lastClaim: 0 };
const dailyRewards = [500, 1500, 3000, 5000, 10000, 12500, 15000];

function loadDaily() {
  try {
    dailyData = JSON.parse(localStorage.getItem("rimm_daily")) || dailyData;
  } catch {}
}

function saveDaily() {
  localStorage.setItem("rimm_daily", JSON.stringify(dailyData));
}

function openDaily() {
  renderDaily();
  document.getElementById("dailyPopup").classList.remove("hidden");
}

function closeDaily() {
  document.getElementById("dailyPopup").classList.add("hidden");
}

function canClaimDaily() {
  return (Date.now() - dailyData.lastClaim) >= 86400000;
}

function renderDaily() {
  let grid = document.getElementById("dailyGrid");
  grid.innerHTML = "";

  for (let i = 1; i <= 7; i++) {
    let div = document.createElement("div");
    div.className = "daily-item";

    if (i < dailyData.day) {
      div.classList.add("claimed");
      div.innerHTML = `<div>DAY ${i}</div><div class="daily-reward">$${formatMoney(dailyRewards[i - 1])}</div><div class="claim-text">CLAIMED</div>`;
    } else if (i === dailyData.day && canClaimDaily()) {
      div.classList.add("available");
      div.innerHTML = `<div>DAY ${i}</div><div class="daily-reward">$${formatMoney(dailyRewards[i - 1])}</div><div class="claim-text">CLICK</div>`;
      div.onclick = claimDaily;
    } else {
      div.classList.add("locked");
      div.innerHTML = `<div>DAY ${i}</div><div class="daily-reward">$${formatMoney(dailyRewards[i - 1])}</div>`;
    }

    grid.appendChild(div);
  }

  updateDailyTimer();
}

function claimDaily() {
  if (claimingDaily || !canClaimDaily()) return;
  claimingDaily = true;

  let reward = dailyRewards[dailyData.day - 1];
  player.balance = Number(player.balance) + Number(reward);
  dailyData.lastClaim = Date.now();
  dailyData.day++;
  if (dailyData.day > 7) dailyData.day = 1;

  saveDaily();
  saveLocal();
  update();

  toast(`🎁 Daily reward +$${formatMoney(reward)}`);
  spawnText("+" + formatMoney(reward), "jackpot");
  burstParticles(window.innerWidth / 2, window.innerHeight / 2, "#facc15");
  playSound("cashout", 0.7);
  playSound("jackpot", 0.7);

  renderDaily();
  setTimeout(() => { closeDaily(); claimingDaily = false; }, 800);
}

function updateDailyTimer() {
  let el = document.getElementById("dailyTimer");

  if (canClaimDaily()) {
    document.getElementById("dailyMiniTimer").innerText = "READY";
    el.innerText = "Reward ready to claim";
    return;
  }

  let remain = 86400000 - (Date.now() - dailyData.lastClaim);
  let h = Math.floor(remain / 3600000);
  let m = Math.floor((remain % 3600000) / 60000);
  let s = Math.floor((remain % 60000) / 1000);

  el.innerText = `Next reward in ${h}h ${m}m ${s}s`;
  document.getElementById("dailyMiniTimer").innerText = `${h}h ${m}m`;
}

setInterval(() => {
  let popup = document.getElementById("dailyPopup");
  if (!popup.classList.contains("hidden")) updateDailyTimer();
}, 1000);

window.addEventListener("click", (e) => {
  let popup = document.getElementById("dailyPopup");
  if (e.target === popup) closeDaily();
});

// ===== EXPOSE GLOBALS =====
window.enterGame = enterGame;
window.goHome = goHome;
window.startMines = startMines;
window.startCrash = startCrash;
window.startGacha = startGacha;
window.startTower = startTower;
window.cashout = cashout;
window.endGame = endGame;
window.cashoutCrash = cashoutCrash;
window.switchGame = switchGame;
window.openHistory = openHistory;
window.openDaily = openDaily;
window.closeDaily = closeDaily;
window.halfBet = halfBet;
window.maxBet = maxBet;
window.setBet = setBet;
window.closeDecision = closeDecision;
window.renderHistory = renderHistory;
window.updateProfile = updateProfile;
window.renderProfile = renderProfile;
window.updateWallet = updateWallet;
window.updateHUD = updateHUD;
window.update = update;
window.updateProfit = updateProfit;
window.addHistory = addHistory;
window.toast = toast;
window.resumeCrash = resumeCrash;
window.reset = reset;
window.startDice = startDice;
window.dropPlinko = dropPlinko;
window.startChicken = startChicken;
window.stepChicken = stepChicken;
window.cashoutChicken = cashoutChicken;


// ===== INIT =====
// ===== AUTH GUARD =====
async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "auth.html";
    return false;
  }
  return true;
}

async function logout() {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = "auth.html";
}
window.logout = logout;

window.addEventListener("load", async () => {
  const ok = await checkAuth();
  if (!ok) return;

  initDrawer();
  startFeed();
  loadDaily();
  await loadLocal();
  renderProfile();
  setTimeout(() => grid.classList.remove("fade-out"), 150);
  update();
});