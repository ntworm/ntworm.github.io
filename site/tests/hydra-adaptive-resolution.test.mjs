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

test('local Hydra shell loads a same-origin sketch with local runtime and no external dependencies', () => {
  const html = readFileSync(join(hydraDirectory, 'lines-and-cells.html'), 'utf8');

  assert.doesNotMatch(html, /fxhash|sfc32|fxrand/);
  assert.match(html, /hydra-synth\.js/);
  assert.match(html, /src="\.\/lines-and-cells\.mjs"/);
  assert.match(html, /<canvas id="hydra-canvas"><\/canvas>/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.doesNotMatch(html, /dweb\.link|ipfs\.io|p5\.js/);
  assert.match(html, /style-src 'self' 'unsafe-inline'/);
  assert.match(html, /img-src 'self' data: blob:/);
  assert.match(html, /connect-src 'none'/);
});

test('Hydra sketch adapts render buffer to measured iframe ratio with pure native Hydra', () => {
  const sketch = readFileSync(join(hydraDirectory, 'lines-and-cells.mjs'), 'utf8');

  assert.match(sketch, /calculateHydraRenderSize/);
  assert.match(sketch, /hydra\.setResolution\(WIDTH, HEIGHT\)/);
  assert.match(sketch, /new Hydra\(\{[\s\S]*canvas,[\s\S]*autoLoop:\s*false,[\s\S]*makeGlobal:\s*true[\s\S]*\}\)/);
  assert.match(sketch, /hydra\.tick\(dt\)/);
  assert.match(sketch, /event\.origin !== window\.location\.origin/);
  assert.match(sketch, /event\.source !== window\.parent/);
  assert.match(sketch, /cancelAnimationFrame\(animFrameId\)/);
  assert.match(sketch, /requestAnimationFrame\(renderLoop\)/);
  assert.doesNotMatch(sketch, /fxhash|fxrand|aspectratioaux|qualityofrender|p5graphics|createGraphics|createCanvas/);
});
