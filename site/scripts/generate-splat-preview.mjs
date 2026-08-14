// Generate committed low-detail previews of the Gaussian scenes.
//
// Usage, from site/:
//   node scripts/generate-splat-preview.mjs
//
// Deterministic: the same sources and parameters always produce byte-identical
// previews. Re-run only when a source .splat is replaced, then commit the
// regenerated previews and manifest together. This is not a build step —
// reading 155 MB on every CI run would be slow and pointless.

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
const PERCENTILE = 0.4;

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

const scenes = SCENES.map((scene) => {
  const source = readFileSync(join(PUBLIC_ROOT, scene.source));
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
