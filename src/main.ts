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
thinButton.classList.add("selected-button");
thinButton.classList.remove("button");
app.append(thinButton);
app.append(thickButton);

const context = canvas.getContext("2d");

let mouseDown = false;
let currentThickness = 1;

interface Command {
    thickness: number;
    display(ctx: CanvasRenderingContext2D): void;
    drag(x: number, y: number): void;
}

class MouseCommand implements Command{
    x: number;
    y: number;
    thickness: number;
    constructor(x: number, y: number, thickness: number){
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }

    display(ctx: CanvasRenderingContext2D){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness, 0, 2*Math.PI);
        ctx.fill();
    }
    drag(x: number, y: number){
        this.x = x;
        this.y = y;
    }
}

class DrawCommand implements Command{
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

const commands: Command[] = [new MouseCommand(0, 0, currentThickness)];
const redoCommands: Command[] = [];

canvas.addEventListener("mousedown", (e) => {
    mouseDown = true;
    commands.push(new DrawCommand(e.offsetX, e.offsetY, currentThickness));
});

canvas.addEventListener("mousemove", (e) => {
    if(mouseDown){
        commands[commands.length-1].drag(e.offsetX, e.offsetY);
    }
    commands[0].drag(e.offsetX, e.offsetY);
    canvas.dispatchEvent(new Event("tool-moved"));
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

canvas.addEventListener("tool-moved", () => {
    canvas.dispatchEvent(new Event("drawing-changed"));
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
    commands[0].thickness = currentThickness
    thinButton.classList.remove("button");
    thinButton.classList.add("selected-button");
    thickButton.classList.remove("selected-button");
    thickButton.classList.add("button");
});

thickButton.addEventListener("click", () => {
    currentThickness = 5;
    commands[0].thickness = currentThickness
    thinButton.classList.remove("selected-button");
    thinButton.classList.add("button");
    thickButton.classList.remove("button");
    thickButton.classList.add("selected-button");
});