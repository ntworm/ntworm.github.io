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
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src 'self' 'unsafe-inline' 'unsafe-eval' https:\/\/bafybeif5cwpqes6z4djhvx7hg6oerygkztlglcvvu3ocahtuzsgpu6ud3u\.ipfs\.dweb\.link\/p5\.js https:\/\/bafybeif5cwpqes6z4djhvx7hg6oerygkztlglcvvu3ocahtuzsgpu6ud3u\.ipfs\.dweb\.link\/hydra-js\.js/);
  assert.match(html, /style-src 'self' 'unsafe-inline'/);
  assert.match(html, /img-src 'self' data: blob:/);
  assert.match(html, /connect-src 'none'/);
});

test('Hydra sketch adapts both render buffers to the measured iframe ratio', () => {
  const sketch = readFileSync(join(hydraDirectory, 'lines-and-cells.mjs'), 'utf8');

  assert.match(sketch, /calculateHydraRenderSize/);
  assert.match(sketch, /pixelDensity\(1\)/);
  assert.match(sketch, /hydra\.setResolution\(WIDTH, HEIGHT\)/);
  assert.match(sketch, /resizeCanvas\(WIDTH, HEIGHT\)/);
  assert.match(sketch, /createGraphics\(WIDTH, HEIGHT\)/);
  assert.match(sketch, /new Hydra\(\{ detectAudio: false, canvas: hydraCanvas, autoLoop: false \}\)/);
  assert.match(sketch, /hydra\.tick\(now - lastHydraTick\)/);
  assert.match(sketch, /event\.origin !== window\.location\.origin/);
  assert.match(sketch, /event\.source !== window\.parent/);
  assert.match(sketch, /noLoop\(\)/);
  assert.match(sketch, /lastHydraTick = performance\.now\(\);/);
  assert.match(sketch, /loop\(\)/);
  assert.doesNotMatch(sketch, /aspectratioaux|qualityofrender|pixelDensity\(2\.5/);
});
