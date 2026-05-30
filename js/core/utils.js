export function formatMoney(x){
return x.toLocaleString("en-US");
}

export function createTile(fn){

let t=document.createElement("div");

t.className="tile";

t.innerHTML=`
<div class="inner">
<div class="front"></div>
<div class="back"></div>
</div>
`;

t.onclick=fn;

return t;
}

export function flip(el,type){

let inner=
el.querySelector(".inner");

inner.classList.add("flip");

let back=
el.querySelector(".back");

back.innerText=
type==="safe"
? "💎"
: "💣";

back.classList.remove(
"safe",
"bomb"
);

back.classList.add(
type==="safe"
? "safe"
: "bomb"
);

}

export function spawnText(text,type="win"){

const div =
document.createElement("div");

div.className =
`float-text float-${type}`;

div.innerText = text;

div.style.left = "50%";
div.style.top = "50%";

document
.getElementById("particleLayer")
.appendChild(div);

setTimeout(()=>{
div.remove();
},1000);

}