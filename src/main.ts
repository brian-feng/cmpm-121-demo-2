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
const spacer3 = document.createElement("div");
spacer3.style.marginTop = "15px";
app.append(spacer3);

// Set up the sticker buttons
const pumpkinButton = document.createElement("button");
const ghostButton = document.createElement("button");
const zombieButton = document.createElement("button")
pumpkinButton.textContent = "🎃";
ghostButton.textContent = "👻";
zombieButton.textContent = "🧟";
ghostButton.style.marginLeft = "10px";
zombieButton.style.marginLeft = "10px";
app.append(pumpkinButton); 
app.append(ghostButton);
app.append(zombieButton);

const context = canvas.getContext("2d");

let mouseDown = false;
let currentThickness = 1;

interface Command {
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

class StickerCommand implements Command {
    x: number;
    y: number;
    sticker: string;

    constructor(x: number, y: number, sticker: string){
        this.x = x;
        this.y = y;
        this.sticker = sticker
    }

    display(ctx: CanvasRenderingContext2D){
        if (ctx) {
            console.log(this.x, this.y);
            ctx.font = '20px Arial';
            ctx.fillText(this.sticker, this.x-10, this.y+10);
        }
    }

    drag(x: number, y: number){
        this.x = x;
        this.y = y;
    }
}

class drawStickerCommand implements Command {
    x: number;
    y: number;
    sticker: string;
    ctx: CanvasRenderingContext2D;

    constructor(x: number, y: number, sticker: string, ctx: CanvasRenderingContext2D){
        this.x = x;
        this.y = y;
        this.sticker = sticker
        this.ctx = ctx;
    }

    display(ctx: CanvasRenderingContext2D){
        if (ctx) {
            ctx.font = '20px Arial';
            ctx.fillText(this.sticker, this.x-10, this.y+10);
        }
    }

    drag(x: number, y: number){
        this.x = x;
        this.y = y;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(this.sticker, this.x-10, this.y+10);
    }
}

const commands: Command[] = [new MouseCommand(0, 0, currentThickness), new drawStickerCommand(-100, -100, "🎃", context!), new drawStickerCommand(-100, -100, "👻", context!), new drawStickerCommand(-100, -100, "🧟", context!)];
const redoCommands: Command[] = [];
let cursor = commands[0];

canvas.addEventListener("mousedown", (e) => {
    if(cursor.constructor.name === "MouseCommand"){
        mouseDown = true;
        commands.push(new DrawCommand(e.offsetX, e.offsetY, currentThickness));
    }
    else if(cursor.constructor.name === "StickerCommand"){
        for(let i = 0; i < commands.length; i++){
            if(commands[i].constructor.name === "drawStickerCommand" && (commands[i] as drawStickerCommand).sticker == (cursor as StickerCommand).sticker){
                commands[i].drag(e.offsetX, e.offsetY);
            }
        }
    }
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

canvas.addEventListener("mouseleave", () => {
    cursor = commands[0];
    commands.shift();
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseenter", () => {
    commands.unshift(cursor);
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

const buttons = [thinButton, thickButton, pumpkinButton, ghostButton, zombieButton];
function unselectButtons(){
    for(const button of buttons){
        button.classList.remove("selected-button");
        button.classList.add("button");
    }
}

thinButton.addEventListener("click", () => {
    currentThickness = 1;
    commands.shift();
    commands.unshift(new MouseCommand(0, 0, currentThickness));
    cursor = commands[0];
    unselectButtons();
    thinButton.classList.remove("button");
    thinButton.classList.add("selected-button");
});

thickButton.addEventListener("click", () => {
    currentThickness = 5;
    commands.shift();
    commands.unshift(new MouseCommand(0, 0, currentThickness));
    cursor = commands[0];
    unselectButtons();
    thickButton.classList.remove("button");
    thickButton.classList.add("selected-button");
});

pumpkinButton.addEventListener("click", () => {
    commands.shift();
    commands.unshift(new StickerCommand(0, 0, "🎃"));
    cursor = commands[0];
    unselectButtons();
    pumpkinButton.classList.remove("button");
    pumpkinButton.classList.add("selected-button");
});

ghostButton.addEventListener("click", () => {
    commands.shift();
    commands.unshift(new StickerCommand(0, 0, "👻"));
    cursor = commands[0];
    unselectButtons();
    ghostButton.classList.remove("button");
    ghostButton.classList.add("selected-button");
});

zombieButton.addEventListener("click", () => {
    commands.shift();
    commands.unshift(new StickerCommand(0, 0, "🧟"));
    cursor = commands[0];
    unselectButtons();
    zombieButton.classList.remove("button");
    zombieButton.classList.add("selected-button");
});