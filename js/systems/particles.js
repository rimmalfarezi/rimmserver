export function burstParticles(
x,
y,
color="#22c55e"
){

let layer =
document.getElementById(
"particleLayer"
);

for(let i=0;i<14;i++){

let p =
document.createElement("div");

p.className =
"particle-burst";

p.style.background=color;

p.style.left=x+"px";
p.style.top=y+"px";

p.style.setProperty(
"--x",
(Math.random()*200-100)+"px"
);

p.style.setProperty(
"--y",
(Math.random()*200-100)+"px"
);

layer.appendChild(p);

setTimeout(()=>{
p.remove();
},800);

}
}