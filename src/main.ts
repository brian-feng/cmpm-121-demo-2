import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = "Sketchpad";
app.innerHTML = "<h1>Sketchpad</h1>";

const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
app.appendChild(canvas);

const context = canvas.getContext("2d");
let mouseDown = false;

const mousePoints: number[][] = [];
canvas.addEventListener("mousedown", (e) => {
    mouseDown = true;
    mousePoints.push([e.offsetX, e.offsetY]);
});

canvas.addEventListener("mousemove", (e) => {
    if(mouseDown){
        mousePoints.push([e.offsetX, e.offsetY]);
    }
});

canvas.addEventListener("mouseup", () => {
    mouseDown = false;
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
    if(context){
        context.clearRect(0, 0, canvas.width, canvas.height);
        for(let i = 0; i < mousePoints.length - 1; i++){
            context.beginPath();
            context.moveTo(mousePoints[i][0], mousePoints[i][1]);
            context.lineTo(mousePoints[i+1][0], mousePoints[i+1][1]);
            context.stroke();
            console.log(mousePoints[i][0], mousePoints[i][1]);
        }
    }
});