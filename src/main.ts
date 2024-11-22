import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = "Goon Squad";
app.innerHTML = "<h1>Goon Squad</h1>";

function generateSpacer(): HTMLDivElement {
    const spacer = document.createElement("div");
    spacer.style.marginTop = "15px";
    app.append(spacer);
    return spacer;
}   

// Set up the canvas
const canvas = document.createElement("canvas");
canvas.height = 256;
canvas.width = 256;
app.appendChild(canvas);
generateSpacer()

// Set up the undo and redo buttons
const undoButton = document.createElement("button");
const redoButton = document.createElement("button");
undoButton.textContent = "Undo";
redoButton.textContent = "Redo";
undoButton.style.marginRight = "10px";
app.append(undoButton);
app.append(redoButton);
generateSpacer()

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
generateSpacer()

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
generateSpacer()

// Set up the custom sticker button
const customButton = document.createElement("button");
customButton.textContent = "Import Custom Goon";
app.append(customButton);
generateSpacer();

// Set up the export button
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
app.append(exportButton);
generateSpacer();


// Set up the color sliders
class ColorSlider {
    name: string; 
    color: number; 
    slider: HTMLInputElement; 
    hex: string;
    constructor(name: string, color: number, hex: string) {
        this.name = name;
        this.color = color;
        this.slider = document.createElement("input");
        this.slider.type = "range";
        this.slider.style.background = "linear-gradient(to right, #FF0000 0%, #FF0000 0%, white 0%, white 100%)";
        this.slider.max = "100";
        this.slider.min = "0";
        this.slider.value = "0";
        this.hex = hex;
    }
}

const sliderList: ColorSlider[] = 
    [ new ColorSlider("rSlider", 0, "#FF0000"), new ColorSlider("gSlider", 0, "#00FF00"), new ColorSlider("bSlider", 0, "#0000FF")];

for (const colorSlider of sliderList) {
    generateSpacer();
    app.append(colorSlider.slider);
}

const context = canvas.getContext("2d");

let mouseDown = false;
let isSticker = false;
const smallThickness = 2;
const largeThickness = 5;
let currentThickness = smallThickness;
let mouseInScreen = 0;

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
    color: {r: number, g: number, b: number};

    constructor(x: number, y: number, thickness: number, red: number, green: number, blue: number){
        this.points = [{x, y}];
        this.thickness = thickness
        this.color = {r: red, g: green, b: blue};
    }

    display(ctx: CanvasRenderingContext2D){
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = this.thickness;
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 1)`;
        const {x, y} = this.points[0];
        ctx.moveTo(x, y);
        for(const {x, y} of this.points){
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
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
            ctx.font = '30px Arial';
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
            ctx.font = '30px Arial';
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

const commands: Command[] = [new MouseCommand(0, 0, currentThickness)];
const redoCommands: Command[] = [];
let cursor = commands[0];

canvas.addEventListener("mousedown", (e) => {
    if(!isSticker){
        mouseDown = true;
        commands.push(new DrawCommand(e.offsetX, e.offsetY, currentThickness, sliderList[0].color, sliderList[1].color, sliderList[2].color));
    }
    else{
        let found = false;
        for(let i = 1; i < commands.length; i++){
            if((commands[i] as drawStickerCommand).sticker == (cursor as StickerCommand).sticker){
                commands[i].drag(e.offsetX, e.offsetY);
                found = true;
            }
        }
        if(!found){
            commands.push(new drawStickerCommand(e.offsetX, e.offsetY, (cursor as StickerCommand).sticker, context!));
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
    mouseInScreen = 0;
    mouseDown = false;
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("mouseenter", () => {
    mouseInScreen = 1;
    canvas.dispatchEvent(new Event("drawing-changed"));
});

canvas.addEventListener("drawing-changed", () => {
    if(context){
        context.clearRect(0, 0, canvas.width, canvas.height);
        for(let i = 1-mouseInScreen; i < commands.length; i++){
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

const buttons = [thinButton, thickButton, pumpkinButton, ghostButton, zombieButton, customButton];
function unselectButtons(){
    for(const button of buttons){
        button.classList.remove("selected-button");
        button.classList.add("button");
    }
}

thinButton.addEventListener("click", () => {
    changeDrawingButton(smallThickness);
    changeButton(thinButton);
});

thickButton.addEventListener("click", () => {
    changeDrawingButton(largeThickness);
    changeButton(thickButton);
});

pumpkinButton.addEventListener("click", () => {
    changeSticker("🎃");
    changeButton(pumpkinButton);
});

ghostButton.addEventListener("click", () => {
    changeSticker("👻");
    changeButton(ghostButton);
});

zombieButton.addEventListener("click", () => {
    changeSticker("🧟");
    changeButton(zombieButton);
});

customButton.addEventListener("click", () => {
    const sticker = prompt("Enter a custom sticker");
    if(sticker){
        changeSticker(sticker);
        changeButton(customButton);
    }
});

function changeDrawingButton(thickness: number) {
    currentThickness = thickness;
    isSticker = false;
    commands.shift();
    commands.unshift(new MouseCommand(0, 0, currentThickness));
}

function changeButton(button: HTMLButtonElement) {
    cursor = commands[0];
    unselectButtons();
    button.classList.remove("button");
    button.classList.add("selected-button");
}

function changeSticker(sticker: string) {
    isSticker = true;
    commands.shift();
    commands.unshift(new StickerCommand(0, 0, sticker));
}

exportButton.addEventListener("click", () => {
    if(context){
        const tempCanvas = document.createElement("canvas"); 
        tempCanvas.height = 1024;
        tempCanvas.width = 1024;
        const tempContext = tempCanvas.getContext("2d")!;
        tempContext.scale(4, 4);
        for(let i = 1; i < commands.length; i++){
            commands[i].display(tempContext);
        }
        const anchor = document.createElement("a");
        anchor.href = tempCanvas.toDataURL("image/png");
        anchor.download = "goonsquad.png";
        anchor.click();
    }
});

sliderList.map((obj) => {
    obj.slider.addEventListener('input', () => {
        obj.color = Math.floor(parseInt(obj.slider.value) * 2.55);
        const newColor = Number(obj.slider.value);
        const gradient = `linear-gradient(to right, ${obj.hex} 0%, ${obj.hex} ${newColor}%, white ${newColor}%, white 100%)`;
        obj.slider.style.background = gradient;
    })
})
