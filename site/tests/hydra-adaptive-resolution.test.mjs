import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateHydraRenderSize } from '../public/hydra/render-budget.mjs';

test('Hydra render size follows a tall panel without exceeding its budget', () => {
  const result = calculateHydraRenderSize({
    width: 1280,
    height: 2028,
    pixelBudget: 921_600,
  });

  assert.ok(result.width * result.height <= 921_600);
  assert.ok(Math.abs(result.width / result.height - 1280 / 2028) < 0.003);
  assert.ok(result.width >= 760 && result.width <= 765);
  assert.ok(result.height >= 1205 && result.height <= 1210);
});

test('Hydra render size stays finite for an unmeasured panel', () => {
  assert.deepEqual(calculateHydraRenderSize({ width: 0, height: 0 }), {
    width: 640,
    height: 360,
  });
});
