import assert from 'node:assert/strict';
import test from 'node:test';
import * as cameraMotion from '../src/scripts/gaussian-camera-motion.mjs';

const { damp, sampleGaussianCamera } = cameraMotion;

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

test('focus proximity forms a smooth field around the marked Gaussian center', () => {
  assert.equal(typeof cameraMotion.gaussianFocusProximity, 'function');

  const viewport = { viewportWidth: 1000, viewportHeight: 800 };
  const center = cameraMotion.gaussianFocusProximity({ clientX: 720, clientY: 432, ...viewport });
  const darkRed = cameraMotion.gaussianFocusProximity({ clientX: 820, clientY: 432, ...viewport });
  const lightRed = cameraMotion.gaussianFocusProximity({ clientX: 1000, clientY: 432, ...viewport });
  const yellow = cameraMotion.gaussianFocusProximity({ clientX: 0, clientY: 0, ...viewport });

  assert.equal(center, 1);
  assert.ok(center > darkRed && darkRed > lightRed && lightRed > yellow);
  assert.ok(yellow >= 0.05, `expected a whole-page influence, received ${yellow}`);
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
