import assert from 'node:assert/strict';
import test from 'node:test';

import { createSpotlightController } from '../src/scripts/spotlight-controller.mjs';

function createHarness({ count = 3, reducedMotion = false } = {}) {
  const active = [];
  const scheduled = [];
  const cancelled = [];

  const controller = createSpotlightController({
    count,
    setActive: (index) => active.push(index),
    schedule: (callback) => {
      const timer = { callback };
      scheduled.push(timer);
      return timer;
    },
    cancel: (timer) => cancelled.push(timer),
    reducedMotion,
  });

  return { active, scheduled, cancelled, controller };
}

test('activates the first spotlight immediately and advances with one timer', () => {
  const harness = createHarness();

  assert.deepEqual(harness.active, [0]);
  assert.equal(harness.scheduled.length, 1);

  harness.scheduled[0].callback();

  assert.deepEqual(harness.active, [0, 1]);
  assert.equal(harness.scheduled.length, 2);
  assert.equal(harness.cancelled.length, 0);
});

test('wraps to the first spotlight after the final index', () => {
  const harness = createHarness({ count: 2 });

  harness.scheduled[0].callback();
  harness.scheduled[1].callback();

  assert.deepEqual(harness.active, [0, 1, 0]);
});

test('keeps a single timer while pauses and resumes are repeated for multiple reasons', () => {
  const harness = createHarness();

  harness.controller.pause('pointer');
  harness.controller.pause('pointer');
  harness.controller.pause('focus');

  assert.equal(harness.cancelled.length, 1);
  assert.equal(harness.scheduled.length, 1);

  harness.controller.resume('pointer');
  assert.equal(harness.scheduled.length, 1);

  harness.controller.resume('focus');
  harness.controller.resume('focus');
  assert.equal(harness.scheduled.length, 2);
});

test('stays static under reduced motion', () => {
  const harness = createHarness({ reducedMotion: true });

  harness.controller.pause('pointer');
  harness.controller.resume('pointer');

  assert.deepEqual(harness.active, [0]);
  assert.equal(harness.scheduled.length, 0);
  assert.equal(harness.cancelled.length, 0);
});

test('reacts to live reduced-motion preference changes without duplicating timers', () => {
  const harness = createHarness();
  const firstTimer = harness.scheduled[0];

  harness.controller.setPaused('reduced-motion', true);

  assert.deepEqual(harness.cancelled, [firstTimer]);
  assert.equal(harness.scheduled.length, 1);

  harness.controller.setPaused('reduced-motion', false);

  assert.equal(harness.scheduled.length, 2);
  harness.controller.setPaused('reduced-motion', false);
  assert.equal(harness.scheduled.length, 2);

  harness.scheduled[1].callback();
  assert.deepEqual(harness.active, [0, 1]);
  assert.equal(harness.scheduled.length, 3);
});

test('disposes terminally and ignores a stale timer callback', () => {
  const harness = createHarness();
  const timer = harness.scheduled[0];

  harness.controller.dispose();
  harness.controller.dispose();
  timer.callback();
  harness.controller.resume('pointer');

  assert.deepEqual(harness.active, [0]);
  assert.deepEqual(harness.cancelled, [timer]);
  assert.equal(harness.scheduled.length, 1);
});
