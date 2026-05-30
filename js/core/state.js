export const STATE = {
IDLE:0,
PLAYING:1,
END:2
};

export let historyArr = [];

export let profile = {
name:"Beta Tester",
win:0,
lose:0,
match:0
};

export const gachaItems = [
0.2,
0.5,
0.8,
1,
1.5,
2,
3,
5,
"💣",
"💣"
];

export let gachaRolling = false;

export const player = {
balance:1000,
multi:1,
bet:0,
auto:0
};

export const towerGame = {
multi:1,
row:0,
path:[],
cols:5,
openedRows:[]
};

export const minesGame = {
bombs:[],
opened:[],
mineStep:0,
multi:1
};

export let crashMulti = 1;
export let crashInterval = null;
export let crashPoint = 0;
export let ctx = null;
export let points = [];
export let panic = false;

export function clearPoints(){
points.length = 0;
}

export const gameState = {
  state: "idle",
  currentGame: "tower",

  locked: false,
  decisionOpen: false,

  tower: false,
  mines: false,
  crash: false,
  gacha: false,

  gachaRolling: false,

  crashMulti: 1,
  crashPoint: 1,
  crashInterval: null,

  panic: false,
  ctx: null,

  points: []
};

export function setState(v){
gameState.state = v;
}

export function setCurrentGame(v){
gameState.currentGame = v;
}

export function setGameLocked(v){
gameState.locked = v;
}

export function setDecisionOpen(v){
gameState.decisionOpen = v;
}

export function setGachaRolling(v){
gameState.gachaRolling = v;
}

export function setCrashMulti(v){
gameState.crashMulti = v;
}

export function setCrashInterval(v){
gameState.crashInterval = v;
}

export function setCrashPoint(v){
gameState.crashPoint = v;
}

export function setCrashPlaying(v){
gameState.crash = v;
}

export function setMinesPlaying(v){
gameState.mines = v;
}

export function setTowerPlaying(v){
gameState.tower = v;
}

export function setGachaPlaying(v){
gameState.gacha = v;
}

export function setCtx(v){
gameState.ctx = v;
}

export function setPanic(v){
gameState.panic = v;
}
