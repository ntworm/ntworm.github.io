import { calculateHydraRenderSize } from './render-budget.mjs';

let WIDTH = 640;
let HEIGHT = 360;
let mainCanvas;
let p5graphics;
let resizeTimer;
let parentActive = false;
let drawingActive;
let lastHydraTick = performance.now();

const hydraCanvas = document.createElement('canvas');
const hydra = new Hydra({ detectAudio: false, canvas: hydraCanvas, autoLoop: false });

function syncDrawingState() {
  const nextActive = parentActive && !document.hidden;
  if (drawingActive === nextActive) return;
  drawingActive = nextActive;

  if (!drawingActive) {
    noLoop();
    return;
  }

  lastHydraTick = performance.now();
  loop();
}

function onParentMessage(event) {
  if (event.origin !== window.location.origin || event.source !== window.parent) return;
  if (event.data?.type !== 'portfolio:hydra-active' || typeof event.data.active !== 'boolean') return;
  parentActive = event.data.active;
  syncDrawingState();
}

window.addEventListener('message', onParentMessage);
document.addEventListener('visibilitychange', syncDrawingState);

function measureRenderSize() {
  return calculateHydraRenderSize({
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

function createTextureBuffer() {
  p5graphics?.remove();
  p5graphics = createGraphics(WIDTH, HEIGHT);
  p5graphics.pixelDensity(1);
}

function applyRenderSize({ initial = false } = {}) {
  const renderSize = measureRenderSize();
  WIDTH = renderSize.width;
  HEIGHT = renderSize.height;

  hydra.setResolution(WIDTH, HEIGHT);

  if (initial) {
    mainCanvas = createCanvas(WIDTH, HEIGHT, WEBGL);
  } else {
    resizeCanvas(WIDTH, HEIGHT);
  }

  createTextureBuffer();
}

function setup() {
  pixelDensity(1);
  applyRenderSize({ initial: true });
  frameRate(60);
  rectMode(CENTER);
  syncDrawingState();
}

function windowResized() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => applyRenderSize(), 160);
}

function draw() {
  const now = performance.now();
  hydra.tick(now - lastHydraTick);
  lastHydraTick = now;
  noStroke();
  plane(WIDTH, HEIGHT);
  p5graphics.drawingContext.drawImage(hydraCanvas, 0, 0);
  texture(p5graphics);
}

function keyPressed() {
  if (key === 's' && typeof saveGif === 'function') {
    saveGif('LÌ³IÌ³NÌ³EÌ³', 4);
  }
}

window.setup = setup;
window.windowResized = windowResized;
window.draw = draw;
window.keyPressed = keyPressed;

const rotateaux1 = 50 * fxrand();

src(o0)
  .color(2 * fxrand() + 0.1, 2 * fxrand() + 0.1, 2 * fxrand() + 0.1)
  .diff(
    shape(2, 0.3 * fxrand(), 0.2 * fxrand())
      .rotate(rotateaux1 + 0.04, 0)
      .modulate(osc(4 * fxrand() + 3, 0.5, 0.1).modulate(osc(300 + 2000 * fxrand(), 0.05), 0.015)),
  )
  .color(2 * fxrand() + 0.1, 2 * fxrand() + 0.1, 2 * fxrand() + 0.1)
  .saturate(1.2 + 2 * fxrand())
  .hue(2 * fxrand() + 1.5)
  .blend(src(o0), 0.15)
  .add(
    shape(2, 0.3 * fxrand(), 0.2 * fxrand())
      .rotate(rotateaux1 + 0.02, 0)
      .scale(1.2)
      .modulate(
        osc(4 * fxrand() + 2, 0.3 * fxrand(), 0.1)
          .rotate(10 * fxrand())
          .modulate(voronoi(1000 + 1000 * fxrand(), 0.05), 0.015),
      ),
  )
  .luma(0.65, 2)
  .diff(
    shape(2, 0.3 * fxrand(), 0.2 * fxrand())
      .rotate(rotateaux1 - 0.01, 0)
      .modulate(
        osc(4 * fxrand() + 2, 0.5, 0.1)
          .rotate(rotateaux1)
          .color(2 * fxrand() + 0.1, 2 * fxrand() + 0.1, 2 * fxrand() + 0.1)
          .hue(2 * fxrand() + 1.5)
          .saturate(1.2 + 2 * fxrand())
          .modulate(noise(500 + 200 * fxrand(), 0.05), 0.0515),
      ),
  )
  .hue(2)
  .saturate(1.2 + 2 * fxrand())
  .contrast(0.8)
  .modulate(
    osc(450 + 200 * fxrand(), 0.15 * fxrand(), 2)
      .rotate(30 * fxrand())
      .modulate(
        noise(1 + 7 * fxrand(), 0.075 * fxrand(), fxrand()).rotate(fxrand()),
        0 * fxrand() + 0.2,
      )
      .luma(0.25, 2),
    0 * fxrand() + 0.0055,
  )
  .luma(0.25, 2)
  .out(o0);

speed = 0.2 * fxrand() + 0.15;
