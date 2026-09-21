import assert from 'node:assert/strict';
import test from 'node:test';

import { createHydraFrameController } from '../src/scripts/hydra-frame-controller.mjs';

function createEventTarget() {
  const listeners = new Map();

  return {
    addEventListener(type, listener) {
      const handlers = listeners.get(type) ?? new Set();
      handlers.add(listener);
      listeners.set(type, handlers);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type, event = {}) {
      for (const listener of listeners.get(type) ?? []) listener({ type, ...event });
    },
  };
}

function createHarness({ hidden = false, reducedMotion = false, saveData = false } = {}) {
  const documentRef = { ...createEventTarget(), hidden };
  const motionQuery = { ...createEventTarget(), matches: reducedMotion };
  const connection = { ...createEventTarget(), saveData };
  const iframe = {
    ...createEventTarget(),
    contentWindow: {
      messages: [],
      postMessage(message, origin) {
        this.messages.push({ message, origin });
      },
    },
  };
  const observer = {
    observed: [],
    disconnected: false,
    observe(target) { this.observed.push(target); },
    disconnect() { this.disconnected = true; },
  };
  let observerCallback;
  class IntersectionObserver {
    constructor(callback) {
      observerCallback = callback;
      return observer;
    }
  }
  const windowRef = {
    location: { origin: 'https://portfolio.test' },
    IntersectionObserver,
  };

  return {
    connection,
    documentRef,
    host: {},
    iframe,
    motionQuery,
    observer,
    windowRef,
    intersecting(value) {
      observerCallback([{ target: this.host, isIntersecting: value }]);
    },
  };
}

function sentStates(harness) {
  return harness.iframe.contentWindow.messages.map(({ message }) => message.active);
}

test('Hydra parent only sends state when its complete activity condition changes', () => {
  const harness = createHarness();
  const controller = createHydraFrameController({
    host: harness.host,
    iframe: harness.iframe,
    documentRef: harness.documentRef,
    windowRef: harness.windowRef,
    motionQuery: harness.motionQuery,
    connection: harness.connection,
  });

  assert.deepEqual(sentStates(harness), [false]);

  harness.intersecting(true);
  harness.intersecting(true);
  harness.documentRef.dispatch('visibilitychange');
  assert.deepEqual(sentStates(harness), [false, true]);

  harness.motionQuery.matches = true;
  harness.motionQuery.dispatch('change');
  harness.connection.saveData = true;
  harness.connection.dispatch('change');
  assert.deepEqual(sentStates(harness), [false, true, false]);

  harness.motionQuery.matches = false;
  harness.connection.saveData = false;
  harness.connection.dispatch('change');
  assert.deepEqual(sentStates(harness), [false, true, false, true]);

  controller.dispose();
});

test('Hydra parent resends its current state when the iframe loads', () => {
  const harness = createHarness();
  const controller = createHydraFrameController({
    host: harness.host,
    iframe: harness.iframe,
    documentRef: harness.documentRef,
    windowRef: harness.windowRef,
    motionQuery: harness.motionQuery,
    connection: harness.connection,
  });

  harness.intersecting(true);
  harness.iframe.dispatch('load');

  assert.deepEqual(sentStates(harness), [false, true, true]);
  assert.deepEqual(harness.iframe.contentWindow.messages.at(-1), {
    message: { type: 'portfolio:hydra-active', active: true },
    origin: 'https://portfolio.test',
  });

  controller.dispose();
});

test('Hydra parent loads the local shell once when it first becomes active', () => {
  const harness = createHarness();
  harness.iframe.dataset = { hydraSrc: '/hydra/lines-and-cells.html' };
  const controller = createHydraFrameController({
    host: harness.host,
    iframe: harness.iframe,
    documentRef: harness.documentRef,
    windowRef: harness.windowRef,
    motionQuery: harness.motionQuery,
    connection: harness.connection,
  });

  harness.intersecting(true);
  harness.intersecting(false);
  harness.intersecting(true);

  assert.equal(harness.iframe.src, '/hydra/lines-and-cells.html');
  assert.equal(harness.iframe.dataset.hydraLoaded, 'true');
  controller.dispose();
});

test('Hydra parent disposal posts terminal inactive once and disconnects stale callbacks', () => {
  const harness = createHarness();
  const controller = createHydraFrameController({
    host: harness.host,
    iframe: harness.iframe,
    documentRef: harness.documentRef,
    windowRef: harness.windowRef,
    motionQuery: harness.motionQuery,
    connection: harness.connection,
  });

  harness.intersecting(true);
  controller.dispose();
  controller.dispose();
  harness.intersecting(false);
  harness.documentRef.dispatch('visibilitychange');
  harness.iframe.dispatch('load');

  assert.deepEqual(sentStates(harness), [false, true, false]);
  assert.equal(harness.observer.disconnected, true);
});
