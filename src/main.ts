import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = "Sketchpad";
app.innerHTML = "<h1>Sketchpad</h1>";

// Set up the canvas
const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
app.appendChild(canvas);
const spacer = document.createElement("div");
spacer.style.marginTop = "15px";
app.append(spacer);

// Set up the undo and redo buttons
const undoButton = document.createElement("button");
const redoButton = document.createElement("button");
undoButton.textContent = "Undo";
redoButton.textContent = "Redo";
undoButton.style.marginRight = "10px";
app.append(undoButton);
app.append(redoButton);
const spacer2 = document.createElement("div");
spacer2.style.marginTop = "15px";
app.append(spacer2);

// Set up the brush buttons
const thinButton = document.createElement("button");
const thickButton = document.createElement("button");
thinButton.textContent = "Thin Brush";
thickButton.textContent = "Thick Brush";
thickButton.style.marginLeft = "10px";
app.append(thinButton);
app.append(thickButton);

const context = canvas.getContext("2d");

let mouseDown = false;
let currentThickness = 1;

const commands: DrawCommand[] = [];
const redoCommands: DrawCommand[] = [];

class DrawCommand {
    points: {x: number, y: number}[];
    thickness: number;

    constructor(x: number, y: number, thickness: number){
        this.points = [{x, y}];
        this.thickness = thickness
    }

    display(ctx: CanvasRenderingContext2D){
        ctx.lineWidth = this.thickness;
        ctx.beginPath();
        const {x, y} = this.points[0];
        ctx.moveTo(x, y);
        for(const {x, y} of this.points){
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    drag(x: number, y: number){
        this.points.push({x, y});
    }
}

canvas.addEventListener("mousedown", (e) => {
    mouseDown = true;
    commands.push(new DrawCommand(e.offsetX, e.offsetY, currentThickness));
});

canvas.addEventListener("mousemove", (e) => {
    if(mouseDown){
        commands[commands.length-1].drag(e.offsetX, e.offsetY);
    }
});

canvas.addEventListener("mouseup", () => {
    mouseDown = false;
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
    if(context){
        context.clearRect(0, 0, canvas.width, canvas.height);
        for(let i = 0; i < commands.length; i++){
            commands[i].display(context);
        }
    }
});

undoButton.addEventListener("click", () => {
    if(commands.length > 0){
        redoCommands.push(commands.pop()!);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

redoButton.addEventListener("click", () => {
    if(redoCommands.length > 0){
        commands.push(redoCommands.pop()!);
        canvas.dispatchEvent(new Event("drawing-changed"));
    }
});

thinButton.addEventListener("click", () => {
    currentThickness = 1;
});

thickButton.addEventListener("click", () => {
    currentThickness = 5;
});