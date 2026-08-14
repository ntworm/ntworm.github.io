import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
    assert.equal(scene.percentile, 0.4);
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

    const distances = distancesFromCentroid(preview, scene.previewPoints, scene.centroid);
    distances.forEach((distance) => {
      assert.ok(distance <= scene.radius + 1e-3, `${scene.name} kept a point outside the crop radius`);
    });
  });
});
