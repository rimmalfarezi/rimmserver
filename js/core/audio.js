const sounds = {

click:
new Audio("audio/click.mp3"),

win:
new Audio("audio/win.mp3"),

lose:
new Audio("audio/lose.mp3"),

bomb:
new Audio("audio/bomb.mp3"),

cashout:
new Audio("audio/cashout.mp3"),

rocket:
new Audio("audio/rocket.mp3"),

jackpot:
new Audio("audio/jackpot.mp3")

};

export function playSound(
name,
volume=1
){

if(!sounds[name]) return;

sounds[name].pause();

sounds[name].currentTime=0;

sounds[name].volume=volume;

sounds[name].play();

}