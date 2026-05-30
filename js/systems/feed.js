import {
formatMoney
}
from "../core/utils.js";

const fakeUsers = [

"Alan Walker",
"Mark Zuckerberg",
"Hikaru",
"Veldora",
"Lelouch vi Britannia",
"Anos Voldigoad",
"Rimm",
"Rimuru"

];

export function randomFeed(){

let games = [
"Crash",
"Mines",
"Tower",
"Gacha"
];

let user =
fakeUsers[
Math.floor(
Math.random()*
fakeUsers.length
)
];

let game =
games[
Math.floor(
Math.random()*
games.length
)
];

let amount =
Math.floor(
Math.random()*90000
)+1000;

let text =
`🔥 ${user} menang $${formatMoney(amount)} di ${game}`;

let d =
document.createElement("div");

d.className="feed-item";

d.innerText=text;

document
.getElementById(
"liveFeed"
)
.appendChild(d);

setTimeout(()=>{
d.remove();
},5400);

}

export function startFeed(){

setInterval(
randomFeed,
6000
);

}