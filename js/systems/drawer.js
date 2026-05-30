const DRAWER_GAMES = ["tower", "mines", "crash", "gacha", "dice", "plinko", "chicken"];

export function initDrawer() {
  DRAWER_GAMES.forEach(game => {
    const panel = document.getElementById(`panel${capitalize(game)}`);
    if (!panel) return;

    // Inject handle jika belum ada
    if (!panel.querySelector(".drawer-handle")) {
      const handle = document.createElement("div");
      handle.className = "drawer-handle";
      handle.innerHTML = `<div class="drawer-bar"></div><span class="drawer-hint">TAP TO BET</span>`;
      handle.addEventListener("click", () => toggleDrawer(panel));
      panel.insertBefore(handle, panel.firstChild);
    }

    // Wrap konten dalam drawer-content
    if (!panel.querySelector(".drawer-content")) {
      const content = document.createElement("div");
      content.className = "drawer-content";
      Array.from(panel.children)
        .filter(c => !c.classList.contains("drawer-handle"))
        .forEach(c => content.appendChild(c));
      panel.appendChild(content);
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function openDrawer(panel) {
  if (!panel) return;
  panel.classList.add("drawer-open");
  document.getElementById("gameScreen")?.classList.add("drawer-open");
}

export function closeDrawer(panel) {
  if (!panel) return;
  panel.classList.remove("drawer-open");
  document.getElementById("gameScreen")?.classList.remove("drawer-open");
}

export function toggleDrawer(panel) {
  panel?.classList.contains("drawer-open") ? closeDrawer(panel) : openDrawer(panel);
}

export function getActivePanel(game) {
  const map = {
    tower: "panelTower", mines: "panelMines", crash: "panelCrash",
    gacha: "panelGacha", dice: "panelDice", plinko: "panelPlinko", chicken: "panelChicken"
  };
  return document.getElementById(map[game]);
}

export function transitionGrid() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  grid.classList.add("game-enter");
  setTimeout(() => grid.classList.remove("game-enter"), 350);
}