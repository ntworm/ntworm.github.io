import assert from 'node:assert/strict';
import test from 'node:test';

import { createCaseMediaMotionController } from '../src/scripts/case-media-controller.mjs';

function createVideo({ autoplay, loop }) {
  const attributes = new Set();
  if (autoplay) attributes.add('autoplay');
  if (loop) attributes.add('loop');
  let autoplayValue = autoplay;
  let loopValue = loop;

  return {
    pauseCalls: 0,
    playCalls: 0,
    get autoplay() { return autoplayValue; },
    set autoplay(value) {
      autoplayValue = Boolean(value);
      this.toggleAttribute('autoplay', autoplayValue);
    },
    get loop() { return loopValue; },
    set loop(value) {
      loopValue = Boolean(value);
      this.toggleAttribute('loop', loopValue);
    },
    hasAttribute(name) { return attributes.has(name); },
    toggleAttribute(name, force) {
      if (force) attributes.add(name);
      else attributes.delete(name);
    },
    pause() { this.pauseCalls += 1; },
    play() {
      this.playCalls += 1;
      return Promise.resolve();
    },
  };
}

function createMotionQuery(matches = false) {
  const listeners = new Set();
  return {
    matches,
    addEventListener(type, listener) {
      if (type === 'change') listeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === 'change') listeners.delete(listener);
    },
    setMatches(next) {
      this.matches = next;
      listeners.forEach((listener) => listener({ matches: next }));
    },
  };
}

test('preserves original video state across repeated reduced-motion attaches', async () => {
  const autoplayVideo = createVideo({ autoplay: true, loop: true });
  const manualVideo = createVideo({ autoplay: false, loop: true });
  const documentRef = {
    hidden: false,
    querySelectorAll: () => [autoplayVideo, manualVideo],
  };
  const motionQuery = createMotionQuery(true);

  const first = createCaseMediaMotionController({ documentRef, motionQuery });
  first.dispose();
  const second = createCaseMediaMotionController({ documentRef, motionQuery });

  assert.equal(autoplayVideo.autoplay, false);
  assert.equal(autoplayVideo.loop, false);
  assert.equal(manualVideo.autoplay, false);
  assert.equal(manualVideo.loop, false);

  motionQuery.setMatches(false);
  await Promise.resolve();

  assert.equal(autoplayVideo.autoplay, true);
  assert.equal(autoplayVideo.loop, true);
  assert.equal(autoplayVideo.hasAttribute('autoplay'), true);
  assert.equal(autoplayVideo.hasAttribute('loop'), true);
  assert.equal(autoplayVideo.playCalls, 1);
  assert.equal(manualVideo.autoplay, false);
  assert.equal(manualVideo.loop, true);
  assert.equal(manualVideo.hasAttribute('autoplay'), false);
  assert.equal(manualVideo.hasAttribute('loop'), true);
  assert.equal(manualVideo.playCalls, 0);

  second.dispose();
});
