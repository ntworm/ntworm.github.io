# Gaussian LOD Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 10,000-point preview of each Gaussian scene that renders from page load and cross-fades into the full scene on approach, so the Code chapter is never empty while 84.7 MB downloads.

**Architecture:** An offline Node script decimates each `.splat` into a committed preview artifact plus a drift-detection manifest. At runtime a dependency-injected state machine (`gaussian-lod-controller.mjs`) owns the `waiting -> preview -> loading -> live` progression, and `GaussianBackground.astro` wires DOM, renderers, and CSS to it. The full scene inherits the preview's camera clock so the cross-fade has no orbit jump.

**Tech Stack:** Astro 7.2.1, gsplat 1.2.9 (loaded from esm.sh into a blob module), `node --test`, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-14-gaussian-lod-preview-design.md`

---

## File map

- Create: `site/scripts/splat-preview-core.mjs` — pure decimation functions. Node-only, never bundled for the browser.
- Create: `site/scripts/generate-splat-preview.mjs` — CLI that reads a source `.splat`, writes the preview and updates the manifest.
- Create: `site/src/scripts/gaussian-lod-controller.mjs` — DOM-free LOD state machine.
- Create: `site/tests/splat-preview.test.mjs` — core function tests plus committed-artifact integrity.
- Create: `site/tests/gaussian-lod-controller.test.mjs` — state machine tests.
- Create: `site/public/work/code/splats/carro/carro.preview.splat` — generated, committed.
- Create: `site/public/work/code/splats/luzoebreno/luzoebreno.preview.splat` — generated, committed.
- Create: `site/public/work/code/splats/previews.manifest.json` — generated, committed.
- Modify: `site/src/scripts/gaussian-frame-loop.mjs` — add `initialActiveSeconds`.
- Modify: `site/tests/gaussian-frame-loop.test.mjs` — cover the new option.
- Modify: `site/src/components/GaussianBackground.astro` — engine options, DOM wiring, CSS cross-fade, resize re-evaluation.
- Modify: `site/package.json` — register the two new test files.

Existing anchors worth reading before touching the component: `__gsBgStart` begins at line 135, the mount controller at line 452, the `--live` opacity rule at line 709, and the placement transform rules at lines 766, 788, 792, 858, 862, and 865.

---

### Task 1: Pure decimation core

**Files:**
- Create: `site/scripts/splat-preview-core.mjs`
- Test: `site/tests/splat-preview.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `site/tests/splat-preview.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RECORD_BYTES,
  buildPreviewBuffer,
  computeCentroid,
  distancesFromCentroid,
  mulberry32,
  pointCount,
  radiusAtPercentile,
  selectIndices,
} from '../scripts/splat-preview-core.mjs';

function makeSplat(points) {
  const buffer = Buffer.alloc(points.length * RECORD_BYTES);
  points.forEach(([x, y, z], index) => {
    const offset = index * RECORD_BYTES;
    buffer.writeFloatLE(x, offset);
    buffer.writeFloatLE(y, offset + 4);
    buffer.writeFloatLE(z, offset + 8);
    buffer.writeUInt8(index + 1, offset + 24);
  });
  return buffer;
}

test('rejects buffers that are not whole 32-byte records', () => {
  assert.equal(pointCount(64), 2);
  assert.throws(() => pointCount(65), /32-byte records/);
});

test('computes the centroid of every position', () => {
  const buffer = makeSplat([[0, 0, 0], [2, 4, 6], [4, 8, 12]]);
  assert.deepEqual(computeCentroid(buffer, 3), [2, 4, 6]);
});

test('measures distance from the centroid per point', () => {
  const buffer = makeSplat([[0, 0, 0], [3, 4, 0], [-3, -4, 0]]);
  const distances = distancesFromCentroid(buffer, 3, [0, 0, 0]);
  assert.deepEqual([...distances], [0, 5, 5]);
});

test('takes the radius at the requested percentile', () => {
  const distances = Float64Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(radiusAtPercentile(distances, 0.6), 6);
  assert.equal(radiusAtPercentile(distances, 1), 10);
  assert.equal(radiusAtPercentile(distances, 0), 1);
});

test('mulberry32 is deterministic for a seed', () => {
  const first = mulberry32(20260814);
  const second = mulberry32(20260814);
  const drawn = [first(), first(), first()];
  assert.deepEqual(drawn, [second(), second(), second()]);
  drawn.forEach((value) => {
    assert.ok(value >= 0 && value < 1);
  });
});

test('selects a sorted budget from inside the radius only', () => {
  const distances = Float64Array.from([1, 9, 2, 9, 3, 9, 4, 5]);
  const indices = selectIndices({ distances, radius: 5, budget: 3, random: mulberry32(7) });
  assert.equal(indices.length, 3);
  assert.deepEqual([...indices].sort((a, b) => a - b), indices);
  indices.forEach((index) => {
    assert.ok(distances[index] <= 5, `index ${index} escaped the radius`);
  });
});

test('keeps every survivor when the budget exceeds them', () => {
  const distances = Float64Array.from([1, 9, 2]);
  const indices = selectIndices({ distances, radius: 5, budget: 10, random: mulberry32(7) });
  assert.deepEqual(indices, [0, 2]);
});

test('copies whole records verbatim into the preview buffer', () => {
  const buffer = makeSplat([[0, 0, 0], [1, 1, 1], [2, 2, 2]]);
  const preview = buildPreviewBuffer(buffer, [2, 0]);
  assert.equal(preview.length, 2 * RECORD_BYTES);
  assert.equal(preview.readFloatLE(0), 2);
  assert.equal(preview.readUInt8(24), 3);
  assert.equal(preview.readFloatLE(RECORD_BYTES), 0);
  assert.equal(preview.readUInt8(RECORD_BYTES + 24), 1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `site/`: `node --test tests/splat-preview.test.mjs`
Expected: FAIL, cannot find module `../scripts/splat-preview-core.mjs`.

- [ ] **Step 3: Write the implementation**

Create `site/scripts/splat-preview-core.mjs`:

```js
// Pure decimation helpers for the gsplat `.splat` format.
//
// A `.splat` file has no header. Each point is exactly 32 bytes:
//   0-11  position x, y, z   (float32 little-endian)
//   12-23 scale    x, y, z   (float32 little-endian)
//   24-27 color    r, g, b, a (uint8)
//   28-31 rotation quaternion (uint8, packed)
//
// Nothing here touches the filesystem, so the whole module is testable
// against small synthetic buffers.

export const RECORD_BYTES = 32;

export function pointCount(byteLength) {
  if (byteLength % RECORD_BYTES !== 0) {
    throw new Error(`splat length ${byteLength} is not made of whole 32-byte records`);
  }
  return byteLength / RECORD_BYTES;
}

export function computeCentroid(buffer, count) {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let index = 0; index < count; index += 1) {
    const offset = index * RECORD_BYTES;
    x += buffer.readFloatLE(offset);
    y += buffer.readFloatLE(offset + 4);
    z += buffer.readFloatLE(offset + 8);
  }
  return [x / count, y / count, z / count];
}

export function distancesFromCentroid(buffer, count, centroid) {
  const [cx, cy, cz] = centroid;
  const distances = new Float64Array(count);
  for (let index = 0; index < count; index += 1) {
    const offset = index * RECORD_BYTES;
    const dx = buffer.readFloatLE(offset) - cx;
    const dy = buffer.readFloatLE(offset + 4) - cy;
    const dz = buffer.readFloatLE(offset + 8) - cz;
    distances[index] = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return distances;
}

export function radiusAtPercentile(distances, percentile) {
  const sorted = Float64Array.from(distances).sort();
  const rank = Math.ceil(percentile * sorted.length) - 1;
  const index = Math.min(sorted.length - 1, Math.max(0, rank));
  return sorted[index];
}

// Eight lines, no dependency, identical output on every Node version.
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function selectIndices({ distances, radius, budget, random }) {
  const survivors = [];
  for (let index = 0; index < distances.length; index += 1) {
    if (distances[index] <= radius) survivors.push(index);
  }
  if (survivors.length <= budget) return survivors;

  // Partial Fisher-Yates: shuffle only the first `budget` slots, which is
  // uniform selection without shuffling 1.6 million entries.
  for (let slot = 0; slot < budget; slot += 1) {
    const pick = slot + Math.floor(random() * (survivors.length - slot));
    const held = survivors[slot];
    survivors[slot] = survivors[pick];
    survivors[pick] = held;
  }
  return survivors.slice(0, budget).sort((a, b) => a - b);
}

export function buildPreviewBuffer(buffer, indices) {
  const out = Buffer.alloc(indices.length * RECORD_BYTES);
  indices.forEach((index, slot) => {
    buffer.copy(out, slot * RECORD_BYTES, index * RECORD_BYTES, index * RECORD_BYTES + RECORD_BYTES);
  });
  return out;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run from `site/`: `node --test tests/splat-preview.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Register the test file**

In `site/package.json`, append `tests/splat-preview.test.mjs` to the space-separated file list in the `test` script, keeping the existing alphabetical-ish grouping by inserting it after `tests/seo.test.mjs`.

- [ ] **Step 6: Commit**

```bash
git add site/scripts/splat-preview-core.mjs site/tests/splat-preview.test.mjs site/package.json
git commit -m "feat: add splat decimation core"
```

---

### Task 2: Generator CLI and committed preview artifacts

**Files:**
- Create: `site/scripts/generate-splat-preview.mjs`
- Modify: `site/tests/splat-preview.test.mjs`

- [ ] **Step 1: Write the failing integrity test**

Append to `site/tests/splat-preview.test.mjs`:

```js
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SPLAT_ROOT = join(process.cwd(), 'public', 'work', 'code', 'splats');
const BUDGET = 10000;
const MAX_PREVIEW_BYTES = 400 * 1024;

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

test('the preview manifest describes both scenes at the approved budget', () => {
  const manifest = JSON.parse(readFileSync(join(SPLAT_ROOT, 'previews.manifest.json'), 'utf8'));
  const names = manifest.scenes.map((scene) => scene.name).sort();
  assert.deepEqual(names, ['carro', 'luzoebreno']);
  manifest.scenes.forEach((scene) => {
    assert.equal(scene.budget, BUDGET, `${scene.name} budget drifted`);
    assert.equal(scene.previewPoints, BUDGET, `${scene.name} preview shrank below its budget`);
    assert.equal(scene.percentile, 0.6);
    assert.ok(Number.isFinite(scene.radius) && scene.radius > 0);
  });
});

test('each committed preview matches its manifest entry and stays under budget', () => {
  const manifest = JSON.parse(readFileSync(join(SPLAT_ROOT, 'previews.manifest.json'), 'utf8'));
  manifest.scenes.forEach((scene) => {
    const preview = readFileSync(join(process.cwd(), 'public', scene.output));
    assert.equal(preview.length % RECORD_BYTES, 0, `${scene.name} is not whole records`);
    assert.equal(pointCount(preview.length), scene.previewPoints);
    assert.ok(preview.length <= MAX_PREVIEW_BYTES, `${scene.name} exceeds the 400 KB ceiling`);
    assert.equal(sha256(preview), scene.previewSha256, `${scene.name} preview does not match the manifest`);

    const centroid = scene.centroid;
    const distances = distancesFromCentroid(preview, scene.previewPoints, centroid);
    distances.forEach((distance) => {
      assert.ok(distance <= scene.radius + 1e-3, `${scene.name} kept a point outside the crop radius`);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `site/`: `node --test tests/splat-preview.test.mjs`
Expected: FAIL, `ENOENT` opening `previews.manifest.json`.

- [ ] **Step 3: Write the generator**

Create `site/scripts/generate-splat-preview.mjs`:

```js
// Generate committed low-detail previews of the Gaussian scenes.
//
// Usage, from site/:
//   node scripts/generate-splat-preview.mjs
//
// Deterministic: the same sources and parameters always produce byte-identical
// previews. Re-run only when a source .splat is replaced, then commit the
// regenerated previews and manifest together.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildPreviewBuffer,
  computeCentroid,
  distancesFromCentroid,
  mulberry32,
  pointCount,
  radiusAtPercentile,
  selectIndices,
} from './splat-preview-core.mjs';

const PUBLIC_ROOT = join(process.cwd(), 'public');
const MANIFEST = join(PUBLIC_ROOT, 'work', 'code', 'splats', 'previews.manifest.json');

const SCENES = [
  {
    name: 'carro',
    source: 'work/code/splats/carro/carro.splat',
    output: 'work/code/splats/carro/carro.preview.splat',
    seed: 20260814,
  },
  {
    name: 'luzoebreno',
    source: 'work/code/splats/luzoebreno/luzoebreno.splat',
    output: 'work/code/splats/luzoebreno/luzoebreno.preview.splat',
    seed: 20260815,
  },
];

const BUDGET = 10000;
const PERCENTILE = 0.6;

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

const scenes = SCENES.map((scene) => {
  const sourcePath = join(PUBLIC_ROOT, scene.source);
  const source = readFileSync(sourcePath);
  const sourcePoints = pointCount(source.length);
  const centroid = computeCentroid(source, sourcePoints);
  const distances = distancesFromCentroid(source, sourcePoints, centroid);
  const radius = radiusAtPercentile(distances, PERCENTILE);
  const indices = selectIndices({ distances, radius, budget: BUDGET, random: mulberry32(scene.seed) });
  const preview = buildPreviewBuffer(source, indices);

  writeFileSync(join(PUBLIC_ROOT, scene.output), preview);
  console.log(`${scene.name}: ${sourcePoints} -> ${indices.length} points, ${(preview.length / 1024).toFixed(1)} KB`);

  return {
    name: scene.name,
    source: scene.source,
    output: scene.output,
    seed: scene.seed,
    budget: BUDGET,
    percentile: PERCENTILE,
    sourcePoints,
    sourceSha256: sha256(source),
    previewPoints: indices.length,
    previewSha256: sha256(preview),
    centroid,
    radius,
  };
});

writeFileSync(MANIFEST, `${JSON.stringify({ generatedBy: 'scripts/generate-splat-preview.mjs', scenes }, null, 2)}\n`);
console.log(`manifest written to ${MANIFEST}`);
```

- [ ] **Step 4: Run the generator**

Run from `site/`: `node scripts/generate-splat-preview.mjs`
Expected output, two lines reporting roughly `2774466 -> 10000 points, 312.5 KB` and `2324805 -> 10000 points, 312.5 KB`, then the manifest path. Reading 155 MB takes a few seconds.

- [ ] **Step 5: Run the test to verify it passes**

Run from `site/`: `node --test tests/splat-preview.test.mjs`
Expected: PASS, 10 tests.

- [ ] **Step 6: Verify determinism**

Run from `site/`:

```bash
node scripts/generate-splat-preview.mjs && git diff --stat public/work/code/splats
```

Expected: no diff. A non-empty diff means the generator is not deterministic and must be fixed before proceeding.

- [ ] **Step 7: Commit**

```bash
git add site/scripts/generate-splat-preview.mjs site/tests/splat-preview.test.mjs site/public/work/code/splats
git commit -m "feat: generate Gaussian preview splats"
```

---

### Task 3: Frame loop accepts an inherited clock

**Files:**
- Modify: `site/src/scripts/gaussian-frame-loop.mjs:1-13`
- Test: `site/tests/gaussian-frame-loop.test.mjs`

- [ ] **Step 1: Write the failing test**

Append to `site/tests/gaussian-frame-loop.test.mjs`:

```js
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
  scheduled(1100);
  assert.equal(seen[0], 42.1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `site/`: `node --test tests/gaussian-frame-loop.test.mjs`
Expected: FAIL, `getState().activeSeconds` is `0`, not `42`.

- [ ] **Step 3: Write the implementation**

In `site/src/scripts/gaussian-frame-loop.mjs`, change the signature and the counter initializer:

```js
export function createPausableFrameLoop({
  onFrame,
  now = () => performance.now(),
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (id) => cancelAnimationFrame(id),
  initialActiveSeconds = 0,
}) {
  let active = false;
  let disposed = false;
  let activeSeconds = Number.isFinite(initialActiveSeconds) ? Math.max(0, initialActiveSeconds) : 0;
```

Leave every other line of the file unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run from `site/`: `node --test tests/gaussian-frame-loop.test.mjs`
Expected: PASS, all tests including the pre-existing ones.

- [ ] **Step 5: Commit**

```bash
git add site/src/scripts/gaussian-frame-loop.mjs site/tests/gaussian-frame-loop.test.mjs
git commit -m "feat: let a frame loop inherit an active clock"
```

---

### Task 4: LOD state machine

**Files:**
- Create: `site/src/scripts/gaussian-lod-controller.mjs`
- Test: `site/tests/gaussian-lod-controller.test.mjs`

The controller owns state only. Mounting, canvases, and CSS belong to the component, injected as callbacks, exactly like `spotlight-controller.mjs` takes `schedule` and `cancel`.

- [ ] **Step 1: Write the failing test**

Create `site/tests/gaussian-lod-controller.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { createGaussianLodController } from '../src/scripts/gaussian-lod-controller.mjs';

function fakeRuntime(label, activeSeconds = 0) {
  const calls = [];
  return {
    label,
    calls,
    setActive: (value) => calls.push(value),
    dispose: () => calls.push('disposed'),
    getState: () => ({ active: true, disposed: false, activeSeconds, frameCount: 0 }),
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
  const { controller, preview, full, finish } = harness();
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
  controller.setActive(true);
  assert.deepEqual(preview.calls, [true]);
  await controller.requestFull();
  controller.setActive(false);
  assert.ok(full.calls.includes(false));
  controller.dispose();
  assert.equal(controller.getState(), 'disposed');
  controller.setActive(true);
  assert.equal(controller.getState(), 'disposed');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `site/`: `node --test tests/gaussian-lod-controller.test.mjs`
Expected: FAIL, cannot find module `gaussian-lod-controller.mjs`.

- [ ] **Step 3: Write the implementation**

Create `site/src/scripts/gaussian-lod-controller.mjs`:

```js
/**
 * Level-of-detail state machine for one Gaussian background.
 *
 * States: waiting -> preview -> loading -> live, with preview-failed,
 * poster-only, failed, and disposed as the off-ramps. The controller never
 * touches the DOM; the component injects mounting and cross-fade callbacks so
 * this module stays deterministic in Node tests.
 */
export function createGaussianLodController({
  supported,
  mountPreview,
  mountFull,
  crossFade,
  onState = () => {},
}) {
  let state = 'waiting';
  let previewRuntime = null;
  let fullRuntime = null;
  let active = false;
  let disposed = false;
  let fullPromise = null;
  let cancelCrossFade = null;

  const setState = (next) => {
    if (state === next || disposed) return;
    state = next;
    onState(next);
  };

  const disposePreview = () => {
    if (!previewRuntime) return;
    previewRuntime.dispose();
    previewRuntime = null;
  };

  const startPreview = async () => {
    if (disposed || previewRuntime || state === 'live') return;
    try {
      const runtime = await mountPreview();
      if (disposed) {
        runtime?.dispose();
        return;
      }
      if (!runtime) {
        setState('preview-failed');
        return;
      }
      previewRuntime = runtime;
      previewRuntime.setActive(active);
      if (state !== 'live' && state !== 'loading') setState('preview');
    } catch (error) {
      console.warn('[gs-bg] preview unavailable', error);
      if (!disposed) setState('preview-failed');
    }
  };

  const attemptFull = async (allowRetry) => {
    const initialActiveSeconds = previewRuntime?.getState().activeSeconds ?? 0;
    try {
      return await mountFull({ initialActiveSeconds });
    } catch (error) {
      if (!allowRetry || !previewRuntime) throw error;
      // A second WebGL context can exhaust the browser's limit. The full scene
      // is the real artwork, so the preview yields its context and we retry.
      console.warn('[gs-bg] retrying full scene without the preview', error);
      disposePreview();
      return mountFull({ initialActiveSeconds });
    }
  };

  const controller = {
    async start() {
      if (disposed) return;
      if (!supported()) {
        setState('poster-only');
        return;
      }
      await startPreview();
    },

    async requestFull() {
      if (disposed || fullPromise || !supported()) return;
      const previousState = state;
      setState('loading');
      fullPromise = attemptFull(true)
        .then((runtime) => {
          if (disposed) {
            runtime?.dispose();
            return;
          }
          if (!runtime) {
            setState(previewRuntime ? 'preview' : 'poster-only');
            return;
          }
          fullRuntime = runtime;
          fullRuntime.setActive(active);
          if (previewRuntime) {
            cancelCrossFade = crossFade(() => {
              cancelCrossFade = null;
              disposePreview();
            });
          }
          setState('live');
        })
        .catch((error) => {
          if (disposed) return;
          console.error('[gs-bg] full scene failed', error);
          fullPromise = null;
          setState(previewRuntime ? 'preview' : (previousState === 'preview-failed' ? 'failed' : 'poster-only'));
        });
      await fullPromise;
    },

    async setViewportSupported(nextSupported) {
      if (disposed) return;
      if (nextSupported) {
        if (state === 'poster-only') await startPreview();
        return;
      }
      cancelCrossFade?.();
      cancelCrossFade = null;
      disposePreview();
      fullRuntime?.dispose();
      fullRuntime = null;
      fullPromise = null;
      setState('poster-only');
    },

    setActive(nextActive) {
      if (disposed) return;
      active = nextActive;
      previewRuntime?.setActive(nextActive);
      fullRuntime?.setActive(nextActive);
    },

    dispose() {
      if (disposed) return;
      cancelCrossFade?.();
      cancelCrossFade = null;
      disposePreview();
      fullRuntime?.dispose();
      fullRuntime = null;
      state = 'disposed';
      disposed = true;
      onState('disposed');
    },

    getState: () => state,
    getRuntimes: () => ({ preview: previewRuntime, full: fullRuntime }),
  };

  return controller;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run from `site/`: `node --test tests/gaussian-lod-controller.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 5: Register the test file**

In `site/package.json`, append `tests/gaussian-lod-controller.test.mjs` to the `test` script file list, immediately after `tests/gaussian-frame-loop.test.mjs`.

- [ ] **Step 6: Commit**

```bash
git add site/src/scripts/gaussian-lod-controller.mjs site/tests/gaussian-lod-controller.test.mjs site/package.json
git commit -m "feat: add Gaussian level-of-detail state machine"
```

---

### Task 5: Engine accepts a role and an inherited clock

**Files:**
- Modify: `site/src/components/GaussianBackground.astro:135-165`, `:289-296`, `:367-392`, `:423-435`
- Test: `site/tests/site-integrity.test.mjs`

`__gsBgStart` currently takes `(src, stage)` and always claims the `gs-bg__live-canvas` class, always reads particle effects from the stage, and always starts its clock at zero. It needs a third options argument.

- [ ] **Step 1: Write the failing source contract**

Append to `site/tests/site-integrity.test.mjs`, inside the existing test file's top-level scope:

```js
test('the Gaussian engine accepts a role, a canvas class, and an inherited clock', () => {
  const component = readFileSync(
    join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'),
    'utf8',
  );
  assert.match(component, /window\.__gsBgStart = async function\(src, stage, options\)/);
  assert.match(component, /options\.initialActiveSeconds/);
  assert.match(component, /options\.canvasClass/);
  assert.match(component, /options\.particleEffects === false/);
  assert.doesNotMatch(
    component,
    /__gsBgStart\(pick\.src, bg\)/,
    'the component still calls the engine with the old two-argument signature',
  );
});
```

If `readFileSync` and `join` are not already imported at the top of that file, add them.

- [ ] **Step 2: Run the test to verify it fails**

Run from `site/`: `node --test --test-name-pattern="Gaussian engine accepts" tests/site-integrity.test.mjs`
Expected: FAIL on the first `assert.match`.

- [ ] **Step 3: Change the engine string**

In `site/src/components/GaussianBackground.astro`, replace the line at 135:

```js
    "window.__gsBgStart = async function(src, stage) {",
```

with:

```js
    "window.__gsBgStart = async function(src, stage, options) {",
    "  options = options || {};",
```

Replace the particle gate at line 142:

```js
    "  const hasParticleEffects = stage.dataset.particleEffects === '1' && !reducedMotion && particles;",
```

with:

```js
    "  const particlesRequested = options.particleEffects === false ? false : stage.dataset.particleEffects === '1';",
    "  const hasParticleEffects = particlesRequested && !reducedMotion && particles;",
```

Replace the canvas class line at 160:

```js
    "  renderer.canvas.classList.add('gs-bg__live-canvas');",
```

with:

```js
    "  renderer.canvas.classList.add('gs-bg__live-canvas');",
    "  renderer.canvas.classList.add(options.canvasClass || 'gs-bg__full-canvas');",
```

Replace the frame loop construction near line 368:

```js
    "  const frameLoop = lifecycle.createPausableFrameLoop({",
    "    onFrame: ({ deltaSeconds, activeSeconds }) => renderFrame({ deltaSeconds, activeSeconds })",
    "  });",
```

with:

```js
    "  const frameLoop = lifecycle.createPausableFrameLoop({",
    "    onFrame: ({ deltaSeconds, activeSeconds }) => renderFrame({ deltaSeconds, activeSeconds }),",
    "    initialActiveSeconds: options.initialActiveSeconds || 0",
    "  });",
```

- [ ] **Step 4: Give `mountGaussianBackground` the same options**

Replace the whole function at lines 423-435 with:

```ts
async function mountGaussianBackground(
  bg: HTMLElement,
  src: string,
  options: {
    canvasClass: string;
    particleEffects?: boolean;
    initialActiveSeconds?: number;
  },
): Promise<GaussianRuntimeController | null> {
  const breakpoint = parseInt(bg.dataset.mobileBreakpoint || '768', 10);
  if (window.innerWidth < breakpoint) return null;
  if (!bg.querySelector<HTMLCanvasElement>('.gs-bg__canvas')) return null;

  await loadSplatEngine();
  if (!bg.isConnected || bg.dataset.gsDisposed === '1') return null;
  if (!src || !window.__gsBgStart) return null;
  return window.__gsBgStart(src, bg, options);
}
```

Also widen the `__gsBgStart` declaration in the `declare global` block near line 100:

```ts
    __gsBgStart?: (
      src: string,
      stage: HTMLElement,
      options?: { canvasClass?: string; particleEffects?: boolean; initialActiveSeconds?: number },
    ) => Promise<GaussianRuntimeController | null>;
```

- [ ] **Step 5: Run the test to verify it passes**

Run from `site/`: `node --test --test-name-pattern="Gaussian engine accepts" tests/site-integrity.test.mjs`
Expected: PASS.

The full suite will not pass yet, because Task 7 has not rewired the caller. That is expected; do not commit a broken build. Proceed directly to Task 6 and 7 and commit at the end of Task 7.

---

### Task 6: Cross-fade CSS

**Files:**
- Modify: `site/src/components/GaussianBackground.astro:696-709`, `:766-767`, `:788`, `:792`, `:858-859`, `:862`, `:865`

The placement transforms and masks are currently gated on `.gs-bg--live`. If the preview canvas does not receive them it will render in a different position and scale than the full scene, which breaks the whole premise. Move the geometry gate to a new `--mounted` class shared by both canvases, and leave `--live` controlling opacity only.

- [ ] **Step 1: Replace the geometry gate**

In every one of the six placement selectors at lines 766, 767, 788, 792, 858, 859, 862, and 865, replace the substring `.gs-bg--live > :global(.gs-bg__live-canvas)` with `.gs-bg--mounted > :global(.gs-bg__live-canvas)`. Do not change the declarations inside those blocks.

- [ ] **Step 2: Replace the opacity rule**

Replace line 709:

```css
  .gs-bg--live > :global(.gs-bg__live-canvas) { opacity: 0.92; }
```

with, in exactly this order — the rules share specificity, so source order is what makes `--live` win over `--preview` for the preview canvas:

```css
  .gs-bg--preview > :global(.gs-bg__preview-canvas) { opacity: 0.92; }
  .gs-bg--live > :global(.gs-bg__full-canvas) { opacity: 0.92; }
  .gs-bg--live > :global(.gs-bg__preview-canvas) { opacity: 0; }

  @media (prefers-reduced-motion: reduce) {
    .gs-bg > :global(.gs-bg__live-canvas) { transition: none; }
  }
```

The existing `transition: opacity 800ms` on `.gs-bg > :global(.gs-bg__live-canvas)` at line 706 already applies to both canvases. Change its duration to `900ms` to match the spec.

- [ ] **Step 2b: Write the failing style contract**

Append to `site/tests/site-integrity.test.mjs`:

```js
test('preview and full canvases share the placement geometry but not the opacity gate', () => {
  const component = readFileSync(
    join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'),
    'utf8',
  );
  assert.doesNotMatch(
    component,
    /\.gs-bg--live > :global\(\.gs-bg__live-canvas\)/,
    'a placement rule still gates geometry on the opacity class',
  );
  assert.match(component, /\.gs-bg--mounted > :global\(\.gs-bg__live-canvas\)/);
  assert.match(component, /\.gs-bg--preview > :global\(\.gs-bg__preview-canvas\) \{ opacity: 0\.92; \}/);
  assert.match(component, /\.gs-bg--live > :global\(\.gs-bg__preview-canvas\) \{ opacity: 0; \}/);
  const previewFadeIndex = component.indexOf('.gs-bg--preview > :global(.gs-bg__preview-canvas)');
  const liveFadeIndex = component.indexOf('.gs-bg--live > :global(.gs-bg__preview-canvas)');
  assert.ok(liveFadeIndex > previewFadeIndex, 'the live rule must come last to win on source order');
});
```

- [ ] **Step 3: Run the test**

Run from `site/`: `node --test --test-name-pattern="placement geometry" tests/site-integrity.test.mjs`
Expected: PASS after the edits above.

---

### Task 7: Wire the component to the LOD controller

**Files:**
- Modify: `site/src/components/GaussianBackground.astro:437-560`
- Test: `site/tests/site-integrity.test.mjs`

- [ ] **Step 1: Write the failing wiring contract**

Append to `site/tests/site-integrity.test.mjs`:

```js
test('the Gaussian mount wires the LOD controller, previews, and a resize re-check', () => {
  const component = readFileSync(
    join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'),
    'utf8',
  );
  assert.match(component, /import \{ createGaussianLodController \} from '\.\.\/scripts\/gaussian-lod-controller\.mjs'/);
  assert.match(component, /previewSrc/);
  assert.match(component, /addEventListener\('resize'/);
  assert.match(component, /gs-bg--mounted/);
  assert.match(component, /transitionend/);
});

test('every splat entry declares a preview source', () => {
  const chapter = readFileSync(
    join(process.cwd(), 'src', 'components', 'portfolio', 'CodeChapter.astro'),
    'utf8',
  );
  const previews = chapter.match(/preview:/g) ?? [];
  assert.equal(previews.length, 2, 'both scenes must declare a preview');
  assert.match(chapter, /carro\.preview\.splat/);
  assert.match(chapter, /luzoebreno\.preview\.splat/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run from `site/`: `node --test --test-name-pattern="LOD controller" tests/site-integrity.test.mjs`
Expected: FAIL on the import assertion.

- [ ] **Step 3: Add `preview` to the splat entries**

In `site/src/components/GaussianBackground.astro`, extend both `SplatEntry` interfaces — the frontmatter one at line 20 and the script-scope one at line 118's neighbourhood — with `preview: string;`.

Then replace the `SPLATS` array at `site/src/components/portfolio/CodeChapter.astro:107-110` with:

```ts
const SPLATS = [
  { src: '/work/code/splats/luzoebreno/luzoebreno.splat', preview: '/work/code/splats/luzoebreno/luzoebreno.preview.splat', poster: '/work/code/luzoebreno-poster.jpg', label: 'Luzoebreno', size: '71 MB', capture: '1001 cameras · 360° photogrammetry' },
  { src: '/work/code/splats/carro/carro.splat',          preview: '/work/code/splats/carro/carro.preview.splat',          poster: '/work/code/carro-poster.jpg',        label: 'Carro',     size: '85 MB', capture: 'Static photogrammetry capture' },
];
```

`SPLATS[0]` feeds the `hero-right` background at line 114 and `SPLATS[1]` feeds `section-left` at line 200, so both mounts pick up their preview from this one edit.

- [ ] **Step 4: Replace the mount controller**

Replace the body of `createGaussianMountController` from `let disposed = false;` through the end of the `load` and `loadForIntent` definitions with a version that delegates to the LOD controller. The surrounding registration code, `handleCodeNavigation`, and the lifecycle listeners stay as they are.

```ts
  const host = bg.closest('.code__hero, .code__lower-showcase') ?? bg.parentElement ?? bg;
  const breakpoint = parseInt(bg.dataset.mobileBreakpoint || '768', 10);
  let insideActiveZone = false;
  let loadObserver: IntersectionObserver | null = null;
  let activityObserver: IntersectionObserver | null = null;

  const isSupported = () => window.innerWidth >= breakpoint;

  const lod = createGaussianLodController({
    supported: isSupported,
    mountPreview: () => mountGaussianBackground(bg, pick.preview, {
      canvasClass: 'gs-bg__preview-canvas',
      particleEffects: false,
    }),
    mountFull: ({ initialActiveSeconds }) => mountGaussianBackground(bg, pick.src, {
      canvasClass: 'gs-bg__full-canvas',
      initialActiveSeconds,
    }),
    crossFade: (done) => {
      const canvas = bg.querySelector<HTMLCanvasElement>('.gs-bg__preview-canvas');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!canvas || reducedMotion) {
        done();
        return () => {};
      }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        canvas.removeEventListener('transitionend', finish);
        window.clearTimeout(timeoutId);
        done();
      };
      // transitionend never fires for an interrupted or hidden transition, and
      // without this guard the preview's WebGL context would leak.
      const timeoutId = window.setTimeout(finish, 1200);
      canvas.addEventListener('transitionend', finish);
      return () => {
        settled = true;
        canvas.removeEventListener('transitionend', finish);
        window.clearTimeout(timeoutId);
      };
    },
    onState: (state) => {
      bg.dataset.gsState = state;
      bg.classList.toggle('gs-bg--mounted', state === 'preview' || state === 'loading' || state === 'live');
      bg.classList.toggle('gs-bg--preview', state === 'preview' || state === 'loading' || state === 'live');
      bg.classList.toggle('gs-bg--live', state === 'live');
    },
  });

  const refreshActivity = () => {
    lod.setActive(insideActiveZone && !document.hidden);
  };

  const load = (): Promise<void> => {
    loadObserver?.unobserve(host);
    return lod.requestFull();
  };

  const loadForIntent = (): void => {
    const hostRect = host.getBoundingClientRect();
    if (!shouldLoadHeavyMediaForIntent({
      delayHeavyMedia,
      hostTop: hostRect.top,
      hostBottom: hostRect.bottom,
      viewportHeight: window.innerHeight,
    })) return;
    void load();
  };

  const dispose = () => {
    bg.dataset.gsDisposed = '1';
    loadObserver?.disconnect();
    activityObserver?.disconnect();
    lod.dispose();
  };

  const getState = () => ({
    placement: bg.dataset.placement ?? '',
    state: lod.getState(),
    runtime: lod.getRuntimes().full?.getState() ?? lod.getRuntimes().preview?.getState() ?? null,
  });

  const setViewportSupported = (supported: boolean) => lod.setViewportSupported(supported);
```

Then extend the returned object and the `GaussianMountController` type with `setViewportSupported: (supported: boolean) => void;`, and start the preview immediately after the observers are attached by calling `void lod.start();` right before `return controller;` in both the `IntersectionObserver`-less branch and the normal branch.

- [ ] **Step 5: Add the debounced resize listener**

Beside the existing `document.addEventListener('visibilitychange', refreshGaussianVisibility);` registration, add:

```ts
let resizeTimer = 0;
function handleViewportResize(): void {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    gaussianControllers.forEach((controller) => {
      const breakpoint = parseInt(controller.bg.dataset.mobileBreakpoint || '768', 10);
      controller.setViewportSupported(window.innerWidth >= breakpoint);
    });
  }, 200);
}

window.addEventListener('resize', handleViewportResize, { passive: true });
```

- [ ] **Step 6: Run the full suite**

Run from `site/`: `npm test`
Expected: PASS, every test including the pre-existing 132.

- [ ] **Step 7: Commit**

```bash
git add site/src/components/GaussianBackground.astro site/src/components/portfolio/CodeChapter.astro site/tests/site-integrity.test.mjs
git commit -m "feat: cross-fade Gaussian previews into full scenes"
```

---

### Task 8: Gate, browser acceptance, and handoff

**Files:**
- Modify: only tested regressions discovered during acceptance.

- [ ] **Step 1: Run the complete branch gate**

Run from `site/`:

```bash
npm audit --omit=dev
npm test
```

Then from the repository root: `git diff --check` and `git status --short --branch`.
Expected: zero high production advisories, all tests pass, clean diff check, and a worktree containing only the user's known private files (`.gitignore`, `job_text.txt`, `latest_jobs.txt`, `profile/`, `soundlister.txt`).

- [ ] **Step 2: Verify the build output**

Run from `site/`:

```bash
node -e "const {statSync}=require('fs');['dist/work/code/splats/carro/carro.preview.splat','dist/work/code/splats/luzoebreno/luzoebreno.preview.splat'].forEach(p=>console.log(p, statSync(p).size))"
```

Expected: both files present at 320,000 bytes.

- [ ] **Step 3: Browser acceptance**

Start the preview server through the preview tooling, never through a raw shell. Then verify, with the Browser pane displayed so `requestAnimationFrame` and `IntersectionObserver` actually run:

- On the homepage at load: both `.preview.splat` files are requested, neither full `.splat` is, and total transfer stays at or below 1.7 MB.
- Both previews are visible and orbiting before the Code chapter is reached.
- Scrolling to `#code` cross-fades to the full scene with no visible jump in the camera orbit.
- `__gsBgDebug()` reports `live` for both scenes after the fade, and `getRuntimes().preview` is null.
- At 375 px width: no `.splat` request of either kind, poster only.
- Widening the window from 375 px past 768 px mounts the preview without a reload.
- No console errors.

- [ ] **Step 4: Ask the user to test**

Stop here and hand the running preview to the user for their own judgment on the preview's appearance and the cross-fade. The budget, the crop percentile, and the fade duration are all single constants and are the expected knobs to turn after they look at it:

- points per scene: `BUDGET` in `site/scripts/generate-splat-preview.mjs`
- crop tightness: `PERCENTILE` in the same file
- fade duration: the `transition: opacity` declaration in `GaussianBackground.astro`

Do not merge or push before the user has seen it.

## Self-Review

Spec coverage: Task 1 and 2 cover offline generation, the manifest, determinism, and the byte ceiling. Task 3 covers camera continuity's storage. Task 4 covers every state, failure path, the context-limit retry, and the resize transitions. Task 5 covers the engine's role and clock parameters. Task 6 covers the cross-fade and reduced motion. Task 7 covers DOM wiring, preview sources, and the resize listener. Task 8 covers the gate and acceptance criteria.

Placeholder scan: no TBD, TODO, or deferred step remains. Every code step shows the code.

Type consistency: `mountPreview`, `mountFull`, `crossFade`, `supported`, `onState`, `setViewportSupported`, `getRuntimes`, `initialActiveSeconds`, `canvasClass`, and `particleEffects` are spelled identically in the controller, its tests, and the component wiring. `gs-bg__preview-canvas`, `gs-bg__full-canvas`, `gs-bg--mounted`, `gs-bg--preview`, and `gs-bg--live` are spelled identically in the CSS, the engine, and the wiring.

Known ordering constraint: Task 5 deliberately leaves the suite red until Task 7 rewires the caller. The two tasks share one commit boundary at the end of Task 7.
