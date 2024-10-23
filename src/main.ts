import "./style.css";

const APP_NAME = "Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = "<h1>Sketchpad</h1>";

const canvas = document.createElement("canvas");
canvas.style.width = "256px";
canvas.style.height = "256px";
app.appendChild(canvas);