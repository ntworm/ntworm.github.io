import assert from 'node:assert/strict';
import test from 'node:test';

import { createGaussianLodController } from '../src/scripts/gaussian-lod-controller.mjs';

function fakeRuntime(label, activeSeconds = 0, camera = null) {
  const calls = [];
  return {
    label,
    calls,
    setActive: (value) => calls.push(value),
    dispose: () => calls.push('disposed'),
    getState: () => ({ active: true, disposed: false, activeSeconds, frameCount: 0 }),
    getCameraState: () => camera,
  };
}

function harness(overrides = {}) {
  const events = [];
  const preview = fakeRuntime('preview', 42);
  const full = fakeRuntime('full');
  let finishCrossFade = null;
  const controller = createGaussianLodController({
    supported: () => true,
    mountPreview: async () => preview,
    mountFull: async () => full,
    crossFade: (done) => {
      finishCrossFade = done;
      events.push('cross-fade');
      return () => events.push('cross-fade-cancelled');
    },
    onState: (state) => events.push(state),
    ...overrides,
  });
  return { controller, events, preview, full, finish: () => finishCrossFade && finishCrossFade() };
}

test('mounts the preview on start and reports the state progression', async () => {
  const { controller, events } = harness();
  assert.equal(controller.getState(), 'waiting');
  await controller.start();
  assert.equal(controller.getState(), 'preview');
  assert.deepEqual(events, ['preview']);
});

test('cross-fades to the full scene and disposes the preview only when the fade ends', async () => {
  const { controller, events, preview, finish } = harness();
  await controller.start();
  await controller.requestFull();
  assert.equal(controller.getState(), 'live');
  assert.ok(!preview.calls.includes('disposed'), 'preview died before the fade finished');
  finish();
  assert.ok(preview.calls.includes('disposed'), 'preview survived the fade');
  assert.deepEqual(events, ['preview', 'loading', 'cross-fade', 'live']);
});

test('hands the preview clock to the full scene', async () => {
  const seen = [];
  const { controller } = harness({
    mountFull: async ({ initialActiveSeconds }) => {
      seen.push(initialActiveSeconds);
      return fakeRuntime('full');
    },
  });
  await controller.start();
  await controller.requestFull();
  assert.deepEqual(seen, [42]);
});

test('hands the preview camera to the full scene so the cross-fade moves nothing', async () => {
  const camera = { angle: 3.5, radius: 2.4, pitch: -0.2, focusProximity: 0.8 };
  const seen = [];
  const { controller } = harness({
    mountPreview: async () => fakeRuntime('preview', 42, camera),
    mountFull: async (options) => {
      seen.push(options.cameraState);
      return fakeRuntime('full');
    },
  });
  await controller.start();
  await controller.requestFull();
  assert.deepEqual(seen, [camera]);
});

test('still hands over the camera captured before the preview yields its context', async () => {
  const camera = { angle: 1.25, radius: 5, pitch: 0.1, focusProximity: 0 };
  const seen = [];
  let attempts = 0;
  const { controller } = harness({
    mountPreview: async () => fakeRuntime('preview', 7, camera),
    mountFull: async (options) => {
      attempts += 1;
      seen.push(options.cameraState);
      if (attempts === 1) throw new Error('WebGL context limit reached');
      return fakeRuntime('full');
    },
  });
  await controller.start();
  await controller.requestFull();
  assert.deepEqual(seen, [camera, camera]);
});

test('keeps the preview alive when the full scene fails', async () => {
  const { controller, preview } = harness({
    mountFull: async () => {
      throw new Error('network down');
    },
  });
  await controller.start();
  await controller.requestFull();
  assert.equal(controller.getState(), 'preview');
  assert.ok(!preview.calls.includes('disposed'));
});

test('a failed preview does not block the full scene', async () => {
  const { controller } = harness({
    mountPreview: async () => {
      throw new Error('preview missing');
    },
  });
  await controller.start();
  assert.equal(controller.getState(), 'preview-failed');
  await controller.requestFull();
  assert.equal(controller.getState(), 'live');
});

test('retries the full scene once after disposing the preview on a context failure', async () => {
  const preview = fakeRuntime('preview');
  let attempts = 0;
  const { controller } = harness({
    mountPreview: async () => preview,
    mountFull: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('WebGL context limit reached');
      return fakeRuntime('full');
    },
  });
  await controller.start();
  await controller.requestFull();
  assert.equal(attempts, 2);
  assert.ok(preview.calls.includes('disposed'));
  assert.equal(controller.getState(), 'live');
});

test('stays poster-only while the viewport is unsupported and mounts when it widens', async () => {
  let wide = false;
  const { controller, events } = harness({ supported: () => wide });
  await controller.start();
  assert.equal(controller.getState(), 'poster-only');
  wide = true;
  await controller.setViewportSupported(true);
  assert.equal(controller.getState(), 'preview');
  assert.deepEqual(events, ['poster-only', 'preview']);
});

test('narrowing disposes both runtimes and returns to poster-only', async () => {
  const { controller, full, finish } = harness();
  await controller.start();
  await controller.requestFull();
  finish();
  await controller.setViewportSupported(false);
  assert.equal(controller.getState(), 'poster-only');
  assert.ok(full.calls.includes('disposed'));
});

test('forwards activity to every live runtime and survives disposal', async () => {
  const { controller, preview, full } = harness();
  await controller.start();
  // Mounting syncs the runtime to the current activity first, so a scene
  // mounted while the tab is hidden never starts rendering.
  assert.deepEqual(preview.calls, [false]);
  controller.setActive(true);
  assert.deepEqual(preview.calls, [false, true]);
  await controller.requestFull();
  controller.setActive(false);
  assert.ok(full.calls.includes(false));
  controller.dispose();
  assert.equal(controller.getState(), 'disposed');
  controller.setActive(true);
  assert.equal(controller.getState(), 'disposed');
});
