import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = "Sketchpad";
app.innerHTML = "<h1>Sketchpad</h1>";

const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
app.appendChild(canvas);

const context = canvas.getContext("2d");
const cursor = {active: false, x: 0, y: 0};
canvas.addEventListener("mousedown", (e) => {
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
    if(cursor.active && context){
        context.beginPath()
        context.moveTo(cursor.x, cursor.y);
        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
    }
});

canvas.addEventListener("mouseup", (e) => {
    cursor.active = false;
});