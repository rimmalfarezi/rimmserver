export const UI = {
  grid:
    document.getElementById("grid"),

  balance:
    document.getElementById("balance"),

  multi:
    document.getElementById("multi"),

  profit:
    document.getElementById("profit")
};

export function setGridMode(){

UI.grid.classList.remove(
"flex-mode"
);

UI.grid.classList.add(
"grid-mode"
);

}