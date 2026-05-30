export function toast(
msg,
type="success"
){

let box =
document.getElementById("toastBox");

let div =
document.createElement("div");

div.className =
`toast ${type}`;

div.innerText = msg;

box.appendChild(div);

setTimeout(()=>{
div.remove();
},3200);

}