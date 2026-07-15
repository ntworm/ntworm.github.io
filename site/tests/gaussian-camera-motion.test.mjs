import assert from 'node:assert/strict';
import test from 'node:test';
import * as cameraMotion from '../src/scripts/gaussian-camera-motion.mjs';

const { createGaussianAutopilot, damp, sampleGaussianCamera } = cameraMotion;

const isNeutralAutopilotFrame = (frame) => (
  frame.speedScale === 1
  && frame.phaseOffset === 0
  && frame.roll === 0
  && frame.lookYaw === 0
  && frame.lookPitch === 0
);

test('autonomous camera gestures are seeded, varied, and independent', () => {
  assert.equal(typeof createGaussianAutopilot, 'function');

  const first = createGaussianAutopilot(8117);
  const replay = createGaussianAutopilot(8117);
  const second = createGaussianAutopilot(1469);
  const firstSequence = [];
  const replaySequence = [];
  const secondSequence = [];

  for (let frame = 0; frame < 3_600; frame += 1) {
    firstSequence.push(first.sample(0.1));
    replaySequence.push(replay.sample(0.1));
    secondSequence.push(second.sample(0.1));
  }

  assert.deepEqual(firstSequence, replaySequence);
  assert.notDeepEqual(firstSequence, secondSequence);
  assert.ok(firstSequence.some((frame) => frame.speedScale !== 1));
  assert.ok(firstSequence.some((frame) => frame.phaseOffset !== 0));
  assert.ok(firstSequence.some((frame) => frame.roll !== 0));
  assert.ok(firstSequence.some((frame) => frame.lookYaw !== 0));
  assert.ok(firstSequence.some((frame) => frame.lookPitch !== 0));
  assert.ok(firstSequence.some((frame) => frame.speedScale <= 0.8), 'the orbit should sometimes breathe more slowly');
  assert.ok(firstSequence.every((frame) => frame.speedScale >= 0.6), 'slow gestures must never feel paused');
  assert.ok(firstSequence.every((frame) => frame.speedScale <= 1.3), 'fast gestures must remain sober');
  assert.ok(firstSequence.some((frame) => frame.lookYaw <= -0.07));
  assert.ok(firstSequence.some((frame) => frame.lookYaw >= 0.07));
  assert.ok(firstSequence.some((frame) => frame.lookPitch <= -0.06));
  assert.ok(firstSequence.some((frame) => frame.lookPitch >= 0.06));
  assert.doesNotMatch(JSON.stringify(firstSequence[0]), /pitchOffset/);
});

test('autonomous gestures stay cinematic and return fully to the base orbit', () => {
  const autopilot = createGaussianAutopilot(8117);
  let previous = autopilot.sample(0);
  let activeSeconds = 0;
  let sawActive = false;
  let sawReturn = false;
  const completedGestureLengths = [];

  for (let tick = 0; tick < 7_200; tick += 1) {
    const frame = autopilot.sample(0.1);
    const neutral = isNeutralAutopilotFrame(frame);

    assert.ok(frame.speedScale >= 0.6 && frame.speedScale <= 1.3);
    assert.ok(frame.phaseOffset >= -0.11 && frame.phaseOffset <= 0.11);
    assert.ok(frame.roll >= -0.052 && frame.roll <= 0.052);
    assert.ok(frame.lookYaw >= -0.115 && frame.lookYaw <= 0.115);
    assert.ok(frame.lookPitch >= -0.1 && frame.lookPitch <= 0.1);

    // Smooth envelopes must not jump even at action/return boundaries.
    assert.ok(Math.abs(frame.speedScale - previous.speedScale) < 0.017);
    assert.ok(Math.abs(frame.phaseOffset - previous.phaseOffset) < 0.005);
    assert.ok(Math.abs(frame.roll - previous.roll) < 0.003);
    assert.ok(Math.abs(frame.lookYaw - previous.lookYaw) < 0.005);
    assert.ok(Math.abs(frame.lookPitch - previous.lookPitch) < 0.004);

    if (!neutral) {
      activeSeconds += 0.1;
      sawActive = true;
    } else if (activeSeconds > 0) {
      completedGestureLengths.push(activeSeconds);
      activeSeconds = 0;
      sawReturn = true;
    }

    previous = frame;
  }

  assert.ok(sawActive && sawReturn);
  assert.ok(completedGestureLengths.length >= 8);
  assert.ok(completedGestureLengths.every((seconds) => seconds >= 9.8 && seconds <= 30.2));
});

test('pointer look shifts the camera target gently across the view plane', () => {
  assert.equal(typeof cameraMotion.gaussianPointerLook, 'function');
  const viewport = { viewportWidth: 1000, viewportHeight: 800 };

  assert.deepEqual(cameraMotion.gaussianPointerLook({ clientX: 500, clientY: 400, ...viewport }), { targetX: 0, targetY: 0 });
  const upperRight = cameraMotion.gaussianPointerLook({ clientX: 1000, clientY: 0, ...viewport });
  const lowerLeft = cameraMotion.gaussianPointerLook({ clientX: 0, clientY: 800, ...viewport });

  assert.ok(upperRight.targetX > 0 && upperRight.targetX <= 0.08);
  assert.ok(upperRight.targetY > 0 && upperRight.targetY <= 0.065);
  assert.equal(lowerLeft.targetX, -upperRight.targetX);
  assert.equal(lowerLeft.targetY, -upperRight.targetY);
  assert.deepEqual(
    cameraMotion.gaussianPointerLook({ clientX: 9999, clientY: -9999, ...viewport }),
    upperRight,
  );
});

test('world toggle accepts only clicks inside the visible Gaussian focus ellipse', () => {
  assert.equal(typeof cameraMotion.gaussianToggleHotspot, 'function');
  const viewport = { viewportWidth: 1200, viewportHeight: 800 };

  assert.equal(cameraMotion.gaussianToggleHotspot({
    clientX: 864, clientY: 432, focusX: 0.72, focusY: 0.54, ...viewport,
  }), true);
  assert.equal(cameraMotion.gaussianToggleHotspot({
    clientX: 540, clientY: 432, focusX: 0.72, focusY: 0.54, ...viewport,
  }), false);
  assert.equal(cameraMotion.gaussianToggleHotspot({
    clientX: 336, clientY: 432, focusX: 0.28, focusY: 0.54, ...viewport,
  }), true);
  assert.equal(cameraMotion.gaussianToggleHotspot({
    clientX: 1180, clientY: 40, focusX: 0.72, focusY: 0.54, ...viewport,
  }), false);
});

test('scroll changes only the reversible vertical composition', () => {
  const common = { focusProximity: 0.4, timeSeconds: 12 };
  const top = sampleGaussianCamera({ ...common, scrollProgress: 0 });
  const bottom = sampleGaussianCamera({ ...common, scrollProgress: 1 });

  assert.ok(bottom.verticalOffset > top.verticalOffset);
  assert.equal(bottom.radius, top.radius);
  assert.equal(bottom.pitch, top.pitch);
  assert.equal(bottom.phaseOffset, top.phaseOffset);
  assert.equal(bottom.angularSpeed, top.angularSpeed);
  assert.deepEqual(sampleGaussianCamera({ ...common, scrollProgress: 0.37 }), sampleGaussianCamera({ ...common, scrollProgress: 0.37 }));
});

test('focus proximity changes zoom without steering or changing orbit speed', () => {
  const ambient = sampleGaussianCamera({ scrollProgress: 0.25, focusProximity: 0, timeSeconds: 4 });
  const focused = sampleGaussianCamera({ scrollProgress: 0.25, focusProximity: 1, timeSeconds: 4 });

  assert.ok(focused.radius < ambient.radius - 2);
  assert.equal(focused.pitch, ambient.pitch);
  assert.equal(focused.phaseOffset, ambient.phaseOffset);
  assert.equal(focused.angularSpeed, ambient.angularSpeed);
  assert.deepEqual(Object.keys(sampleGaussianCamera()).sort(), ['angularSpeed', 'phaseOffset', 'pitch', 'radius', 'verticalOffset']);
});

test('zoom scale brings the entire camera range proportionally closer', () => {
  const common = { scrollProgress: 0.4, focusProximity: 0.65, timeSeconds: 8 };
  const original = sampleGaussianCamera({ ...common, zoomScale: 1 });
  const upper = sampleGaussianCamera({ ...common, zoomScale: 1.5 });
  const lower = sampleGaussianCamera({ ...common, zoomScale: 2.5 });

  assert.ok(Math.abs(upper.radius - original.radius / 1.5) < 1e-9);
  assert.ok(Math.abs(lower.radius - original.radius / 2.5) < 1e-9);
  assert.equal(upper.pitch, original.pitch);
  assert.equal(lower.angularSpeed, original.angularSpeed);
});

test('focus proximity forms a smooth field around the marked Gaussian center', () => {
  assert.equal(typeof cameraMotion.gaussianFocusProximity, 'function');

  const viewport = { viewportWidth: 1000, viewportHeight: 800 };
  const center = cameraMotion.gaussianFocusProximity({ clientX: 720, clientY: 432, ...viewport });
  const maxArea = cameraMotion.gaussianFocusProximity({ clientX: 820, clientY: 432, ...viewport });
  const lightRed = cameraMotion.gaussianFocusProximity({ clientX: 1000, clientY: 432, ...viewport });
  const farLeft = cameraMotion.gaussianFocusProximity({ clientX: 0, clientY: 432, ...viewport });
  const yellow = cameraMotion.gaussianFocusProximity({ clientX: 0, clientY: 0, ...viewport });

  assert.equal(center, 1);
  assert.equal(maxArea, 1, 'maximum zoom should occupy a generous core area');
  assert.ok(maxArea > lightRed && lightRed > farLeft && farLeft > yellow);
  assert.ok(yellow >= 0.12, `expected a perceptible whole-page influence, received ${yellow}`);
});

test('focus point follows the hero vertically while the page scrolls', () => {
  assert.equal(typeof cameraMotion.gaussianFocusPoint, 'function');

  const viewport = { viewportWidth: 1000, viewportHeight: 800 };
  const atHero = cameraMotion.gaussianFocusPoint({ ...viewport, hostTop: 0 });
  const afterScroll = cameraMotion.gaussianFocusPoint({ ...viewport, hostTop: -400 });

  assert.deepEqual(atHero, { focusX: 0.72, focusY: 0.54 });
  assert.equal(afterScroll.focusX, 0.72);
  assert.ok(Math.abs(afterScroll.focusY - 0.04) < 1e-9);

  const pointer = { clientX: 720, clientY: 432, ...viewport };
  const nearHero = cameraMotion.gaussianFocusProximity({ ...pointer, ...atHero });
  const awayFromScrolledHero = cameraMotion.gaussianFocusProximity({ ...pointer, ...afterScroll });

  assert.equal(nearHero, 1);
  assert.ok(awayFromScrolledHero < nearHero * 0.5, `expected the scrolled hero to release most of the zoom, received ${awayFromScrolledHero}`);
});

test('camera targets stay inside the cinematic safety bounds', () => {
  for (const scrollProgress of [0, 0.25, 0.5, 0.75, 1]) {
    for (const focusProximity of [0, 0.5, 1]) {
      const value = sampleGaussianCamera({ scrollProgress, focusProximity, timeSeconds: 19 });
      assert.ok(value.radius >= 3.45 && value.radius <= 6.55);
      assert.ok(value.pitch >= -0.27 && value.pitch <= 0.03);
      assert.ok(value.angularSpeed >= 0.075 && value.angularSpeed <= 0.14);
      assert.ok(value.verticalOffset >= 0 && value.verticalOffset <= 8);
    }
  }
});

test('damping approaches a target monotonically without overshoot', () => {
  let value = 0;
  for (let frame = 0; frame < 120; frame += 1) {
    const next = damp(value, 1, 3.2, 1 / 60);
    assert.ok(next >= value && next <= 1);
    value = next;
  }
  assert.ok(value > 0.99);
});
