
import {
UI,
setGridMode
}
from "../core/ui.js";
const grid = UI.grid;

import {
towerGame,
player,
gameState,
setTowerPlaying,
STATE
}
from "../core/state.js";

import {
flip,
createTile
}
from "../core/utils.js";

import {
burstParticles
}
from "../systems/particles.js";

import { beginGame }
from "../core/gameManager.js";

import { CONFIG }
from "../core/config.js";

import { renderHistory }
from "../systems/history.js";

import { playSound }
from "../core/audio.js";

import { update }
from "../systems/hud.js";

const autoTower =
document.getElementById("autoTower");

const tileCount =
document.getElementById("tileCount");

export const tileTypes = [
"safe", 
"bomb"
];


export function startTower(){
  towerGame.multi = 1;
  if(gameState.tower) return;

  const bet = parseInt(document.getElementById("betTower").value);
  if(!beginGame(bet)) return; // ✅ pass bet 
setTowerPlaying(true);
player.auto=parseFloat(autoTower.value)||0;
towerGame.openedRows = [];
towerGame.row=0;
towerGame.cols=parseInt(tileCount.value);

towerGame.path=[];
for(let i=0;i<CONFIG.tower.rows;i++)towerGame.path.push(Math.floor(Math.random()*towerGame.cols));

renderTower();update();
}

export function renderTower(){
grid.innerHTML="";
setGridMode();
let tileSize = 65;
if(towerGame.cols===4) tileSize=85;
if(towerGame.cols===3) tileSize=115;
if(towerGame.cols===2) tileSize=170;
grid.style.gridTemplateColumns =
`repeat(${towerGame.cols},${tileSize}px)`;
for(let r=0;r<CONFIG.tower.rows;r++){
for(let c=0;c<towerGame.cols;c++){
let tile=createTile();
if(r!==towerGame.row){
tile.style.opacity=".65";
}
tile.onclick=()=>clickTower(tile,c,r);
if(
towerGame.openedRows.includes(r) &&
towerGame.path[r] === c
){
flip(tile,"safe");
}
grid.appendChild(tile);
}}}

export function clickTower(el,c,r){
if(gameState.state!==STATE.PLAYING||r!==towerGame.row)return;
if(gameState.locked)return;

if(towerGame.path[r]===c){
flip(el,"safe");
towerGame.openedRows.push(r);
let rect =
el.getBoundingClientRect();

burstParticles(
rect.left + 30,
rect.top + 30,
"#22c55e"
);
playSound("win",0.5);
el.classList.add("glow");
setTimeout(()=>{
el.classList.remove("glow");
},350);
let riskMulti =
1 + ((5 - towerGame.cols) * 0.12);
towerGame.multi *=
CONFIG.tower.baseMulti * riskMulti;

player.multi = towerGame.multi;
towerGame.row++;update();

if(player.auto>0 && player.multi>=player.auto) setTimeout(cashout,200);
if(towerGame.row>=CONFIG.tower.rows)window.cashout();
else renderTower();

}else{
flip(el,"bomb");
playSound("bomb",0.8);
document.body.classList.add(
"screen-shake"
);
document.body.classList.add(
"flash-lose"
);
setTimeout(()=>{
document.body.classList.remove(
"screen-shake"
);
document.body.classList.remove(
"flash-lose"
);
},400);
setTimeout(()=>window.endGame("💣"),400);
}
}

export function resetTower(){

towerGame.row = 0;
towerGame.path = [];
towerGame.multi = 1;
towerGame.openedRows = [];

}