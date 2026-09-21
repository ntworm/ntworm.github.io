import { calculateHydraRenderSize } from './render-budget.mjs';

let WIDTH = 640;
let HEIGHT = 360;
let resizeTimer;
let parentActive = false;
let drawingActive = false;
let lastHydraTick = performance.now();
let animFrameId = null;

const canvas = document.getElementById('hydra-canvas');
const hydra = new Hydra({
  detectAudio: false,
  canvas,
  autoLoop: false,
  makeGlobal: true,
});

function measureRenderSize() {
  return calculateHydraRenderSize({
    width: window.innerWidth,
    height: window.innerHeight,
  });
}

function applyRenderSize() {
  const renderSize = measureRenderSize();
  WIDTH = renderSize.width;
  HEIGHT = renderSize.height;
  hydra.setResolution(WIDTH, HEIGHT);
}

function renderLoop(now) {
  if (!drawingActive) {
    animFrameId = null;
    return;
  }
  const dt = Math.min(now - lastHydraTick, 100);
  lastHydraTick = now;
  hydra.tick(dt);
  animFrameId = requestAnimationFrame(renderLoop);
}

function syncDrawingState() {
  const nextActive = parentActive && !document.hidden;
  if (drawingActive === nextActive) return;
  drawingActive = nextActive;

  if (!drawingActive) {
    if (animFrameId !== null) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    return;
  }

  lastHydraTick = performance.now();
  if (animFrameId === null) {
    animFrameId = requestAnimationFrame(renderLoop);
  }
}

function onParentMessage(event) {
  if (event.origin !== window.location.origin || event.source !== window.parent) return;
  if (event.data?.type !== 'portfolio:hydra-active' || typeof event.data.active !== 'boolean') return;
  parentActive = event.data.active;
  syncDrawingState();
}

function onWindowResize() {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => applyRenderSize(), 160);
}

window.addEventListener('message', onParentMessage);
window.addEventListener('resize', onWindowResize);
document.addEventListener('visibilitychange', syncDrawingState);

applyRenderSize();
syncDrawingState();

const rotateaux1 = 24.414059;

src(o0)
  .color(0.830572, 0.184733, 0.280433)
  .diff(
    shape(2, 0.157823, 0.139122)
      .rotate(rotateaux1 + 0.04, 0)
      .modulate(osc(3.509633, 0.5, 0.1).modulate(osc(1372.974888, 0.05), 0.015)),
  )
  .color(0.257642, 1.667540, 0.888816)
  .saturate(2.562489)
  .hue(3.388845)
  .blend(src(o0), 0.15)
  .add(
    shape(2, 0.203769, 0.071883)
      .rotate(rotateaux1 + 0.02, 0)
      .scale(1.2)
      .modulate(
        osc(2.852926, 0.022038, 0.1)
          .rotate(1.244232)
          .modulate(voronoi(1765.604480, 0.05), 0.015),
      ),
  )
  .luma(0.65, 2)
  .diff(
    shape(2, 0.180264, 0.162865)
      .rotate(rotateaux1 - 0.01, 0)
      .modulate(
        osc(3.004241, 0.5, 0.1)
          .rotate(rotateaux1)
          .color(0.639809, 1.803845, 0.369939)
          .hue(3.067989)
          .saturate(1.722141)
          .modulate(noise(696.746715, 0.05), 0.0515),
      ),
  )
  .hue(2)
  .saturate(2.256018)
  .contrast(0.8)
  .modulate(
    osc(561.681813, 0.135928, 2)
      .rotate(26.757625)
      .modulate(
        noise(5.057540, 0.036801, 0.404476).rotate(0.923724),
        0.2,
      )
      .luma(0.25, 2),
    0.0055,
  )
  .luma(0.25, 2)
  .out(o0);

speed = 0.209319;
