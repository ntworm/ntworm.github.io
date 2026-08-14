import assert from 'node:assert/strict';
import test from 'node:test';

import { createPausableFrameLoop } from '../src/scripts/gaussian-frame-loop.mjs';

function createManualScheduler() {
  let clockMs = 0;
  let nextId = 1;
  const pending = new Map();

  return {
    now: () => clockMs,
    requestFrame(callback) {
      const id = nextId;
      nextId += 1;
      pending.set(id, callback);
      return id;
    },
    cancelFrame(id) {
      pending.delete(id);
    },
    step(milliseconds) {
      clockMs += milliseconds;
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(clockMs));
    },
    pendingCount: () => pending.size,
  };
}

test('activation owns exactly one frame chain and pause retains active time', () => {
  const scheduler = createManualScheduler();
  const frames = [];
  const loop = createPausableFrameLoop({
    now: scheduler.now,
    requestFrame: scheduler.requestFrame,
    cancelFrame: scheduler.cancelFrame,
    onFrame: (frame) => frames.push(frame),
  });

  loop.setActive(true);
  loop.setActive(true);
  assert.equal(scheduler.pendingCount(), 1);

  scheduler.step(16);
  assert.equal(frames.length, 1);
  assert.equal(scheduler.pendingCount(), 1);
  assert.ok(Math.abs(frames[0].deltaSeconds - 0.016) < 0.0001);
  assert.ok(Math.abs(frames[0].activeSeconds - 0.016) < 0.0001);

  loop.setActive(false);
  assert.equal(scheduler.pendingCount(), 0);
  scheduler.step(10_000);
  assert.equal(frames.length, 1);

  loop.setActive(true);
  scheduler.step(16);
  assert.equal(frames.length, 2);
  assert.ok(Math.abs(frames[1].deltaSeconds - 0.016) < 0.0001);
  assert.ok(Math.abs(frames[1].activeSeconds - 0.032) < 0.0001);
});

test('dispose is terminal and cancels the scheduled frame', () => {
  const scheduler = createManualScheduler();
  let renderedFrames = 0;
  const loop = createPausableFrameLoop({
    now: scheduler.now,
    requestFrame: scheduler.requestFrame,
    cancelFrame: scheduler.cancelFrame,
    onFrame: () => { renderedFrames += 1; },
  });

  loop.setActive(true);
  loop.dispose();
  loop.setActive(true);
  scheduler.step(16);

  assert.equal(renderedFrames, 0);
  assert.equal(scheduler.pendingCount(), 0);
  assert.deepEqual(loop.getState(), {
    active: false,
    disposed: true,
    activeSeconds: 0,
    frameCount: 0,
  });
});

test('inherits an initial active clock so a successor scene does not restart the orbit', () => {
  const seen = [];
  let scheduled = null;
  const loop = createPausableFrameLoop({
    onFrame: (frame) => seen.push(frame.activeSeconds),
    now: () => 1000,
    requestFrame: (callback) => {
      scheduled = callback;
      return 1;
    },
    cancelFrame: () => {},
    initialActiveSeconds: 42,
  });

  assert.equal(loop.getState().activeSeconds, 42);
  loop.setActive(true);
  // 40 ms stays under the loop's 50 ms resume clamp, so this measures
  // inheritance alone rather than the clamp.
  scheduled(1040);
  assert.equal(seen[0], 42.04);
});
