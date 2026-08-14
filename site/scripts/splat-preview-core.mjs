// Pure decimation helpers for the gsplat `.splat` format.
//
// A `.splat` file has no header. Each point is exactly 32 bytes:
//   0-11  position x, y, z    (float32 little-endian)
//   12-23 scale    x, y, z    (float32 little-endian)
//   24-27 color    r, g, b, a (uint8)
//   28-31 rotation quaternion (uint8, packed)
//
// Nothing here touches the filesystem, so the whole module is testable against
// small synthetic buffers instead of the 85 MB sources.

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
