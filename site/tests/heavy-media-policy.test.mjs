import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldDelayHeavyMedia } from '../src/scripts/heavy-media-policy.mjs';

test('delays heavy media only for explicit data saving or constrained finite memory', () => {
  assert.equal(shouldDelayHeavyMedia({ saveData: true, deviceMemory: 4 }), true);
  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: 2 }), true);
  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: 1 }), true);

  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: 4 }), false);
  assert.equal(shouldDelayHeavyMedia({}), false);
  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: Number.NaN }), false);
  assert.equal(shouldDelayHeavyMedia({ saveData: false, deviceMemory: Number.POSITIVE_INFINITY }), false);
});
