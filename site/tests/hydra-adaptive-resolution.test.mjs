import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { calculateHydraRenderSize } from '../public/hydra/render-budget.mjs';

const hydraDirectory = join(import.meta.dirname, '..', 'public', 'hydra');

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

test('local Hydra shell keeps the original seed and loads a same-origin sketch', () => {
  const html = readFileSync(join(hydraDirectory, 'lines-and-cells.html'), 'utf8');

  assert.match(html, /new URLSearchParams\(window\.location\.search\)\.get\('fxhash'\)/);
  assert.match(html, /hydra-js\.js/);
  assert.match(html, /src="\.\/lines-and-cells\.mjs"/);
});

test('Hydra sketch adapts both render buffers to the measured iframe ratio', () => {
  const sketch = readFileSync(join(hydraDirectory, 'lines-and-cells.mjs'), 'utf8');

  assert.match(sketch, /calculateHydraRenderSize/);
  assert.match(sketch, /pixelDensity\(1\)/);
  assert.match(sketch, /hydra\.setResolution\(WIDTH, HEIGHT\)/);
  assert.match(sketch, /resizeCanvas\(WIDTH, HEIGHT\)/);
  assert.match(sketch, /createGraphics\(WIDTH, HEIGHT\)/);
  assert.doesNotMatch(sketch, /aspectratioaux|qualityofrender|pixelDensity\(2\.5/);
});
