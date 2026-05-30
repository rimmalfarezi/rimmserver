import {
STATE,
setState,
gameState,
player
} from "./state.js";

import { update } from "../systems/hud.js";

export function beginGame(bet){

if(gameState.state===STATE.PLAYING)
return false;

if(gameState.locked)
return false;

if(!bet || bet<=0)
return false;

if(bet > player.balance)
return false;

player.bet = bet;
player.balance -= bet;
player.multi = 1;

setState(STATE.PLAYING);

update();

return true;
}