import assert from 'node:assert/strict';
import test from 'node:test';
import { damp, sampleGaussianCamera } from '../src/scripts/gaussian-camera-motion.mjs';

test('camera sampling is deterministic and scroll-reversible', () => {
  const input = { scrollProgress: 0.37, pointerX: 0.25, pointerY: -0.4, timeSeconds: 12 };
  assert.deepEqual(sampleGaussianCamera(input), sampleGaussianCamera(input));
});

test('pointer influence is clamped and never introduces target drift', () => {
  assert.deepEqual(
    sampleGaussianCamera({ pointerX: 999, pointerY: -999, timeSeconds: 4 }),
    sampleGaussianCamera({ pointerX: 1, pointerY: -1, timeSeconds: 4 }),
  );
  assert.deepEqual(Object.keys(sampleGaussianCamera()).sort(), ['angularSpeed', 'phaseOffset', 'pitch', 'radius']);
});

test('camera targets stay inside the cinematic safety bounds', () => {
  for (const scrollProgress of [0, 0.25, 0.5, 0.75, 1]) {
    for (const pointerX of [-1, 0, 1]) {
      for (const pointerY of [-1, 0, 1]) {
        const value = sampleGaussianCamera({ scrollProgress, pointerX, pointerY, timeSeconds: 19 });
        assert.ok(value.radius >= 5.05 && value.radius <= 6.55);
        assert.ok(value.pitch >= -0.27 && value.pitch <= 0.03);
        assert.ok(value.angularSpeed >= 0.075 && value.angularSpeed <= 0.14);
      }
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
