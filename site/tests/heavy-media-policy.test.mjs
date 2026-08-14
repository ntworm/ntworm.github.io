import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldDelayHeavyMedia, shouldLoadHeavyMediaForIntent } from '../src/scripts/heavy-media-policy.mjs';

test('delays heavy media only for explicit data saving or constrained finite memory', () => {
  assert.equal(shouldDelayHeavyMedia({ saveData: true, deviceMemory: 4 }), true);
  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: 2 }), true);
  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: 1 }), true);

  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: 4 }), false);
  assert.equal(shouldDelayHeavyMedia({}), false);
  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: Number.NaN }), false);
  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: Number.POSITIVE_INFINITY }), false);
});

test('intent loading waits for the viewport only on constrained devices', () => {
  assert.equal(
    shouldLoadHeavyMediaForIntent({
      delayHeavyMedia: true,
      hostTop: 900,
      hostBottom: 1200,
      viewportHeight: 800,
    }),
    false,
  );
  assert.equal(
    shouldLoadHeavyMediaForIntent({
      delayHeavyMedia: true,
      hostTop: 700,
      hostBottom: 1000,
      viewportHeight: 800,
    }),
    true,
  );
  assert.equal(
    shouldLoadHeavyMediaForIntent({
      delayHeavyMedia: false,
      hostTop: 900,
      hostBottom: 1200,
      viewportHeight: 800,
    }),
    true,
  );
});
