// Scan site/public/work/*.{jpg,jpeg,png,webp,avif,gif,mp4,webm,mov}
// and emit site/src/data/asset-dimensions.json with per-file width/height.
//
// Usage:
//   node scripts/asset-dimensions.mjs
//
// Output schema (kept simple + stable):
//   {
//     "<slug>": [
//       { "file": "1.jpg", "w": 1920, "h": 1080, "type": "image", "ar": "1920/1080" },
//       ...
//     ],
//     ...
//   }
//
// Run from site/ directory. Idempotent. Safe to re-run.

import { readdirSync, writeFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';

const ROOT = join(process.cwd(), 'public', 'work');
const OUT = join(process.cwd(), 'src', 'data', 'asset-dimensions.json');

const IMG_EXTS = /\.(jpe?g|png|webp|avif|gif)$/i;
const VID_EXTS = /\.(mp4|webm|mov)$/i;

function naturalSort(a, b) {
  const aN = a.match(/^(\d+)/)?.[1];
  const bN = b.match(/^(\d+)/)?.[1];
  if (aN != null && bN != null) {
    const ai = +aN, bi = +bN;
    return ai !== bi ? ai - bi : a.localeCompare(b);
  }
  if (aN != null) return -1;
  if (bN != null) return 1;
  return a.localeCompare(b);
}

async function imageDims(path) {
  try {
    const meta = await sharp(path).metadata();
    return { w: meta.width ?? null, h: meta.height ?? null };
  } catch (e) {
    return { w: null, h: null, error: e.message };
  }
}

function videoDims(path) {
  try {
    const out = execFileSync(
      'ffprobe',
      ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    const [w, h] = out.split(',').map((s) => parseInt(s, 10));
    if (Number.isFinite(w) && Number.isFinite(h)) return { w, h };
  } catch { /* ffprobe missing or failed */ }
  return { w: null, h: null };
}

async function main() {
  const slugs = readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const manifest = {};
  let scanned = 0, failures = 0;

  for (const slug of slugs) {
    const dir = join(ROOT, slug);
    const files = readdirSync(dir)
      .filter((f) => f !== '.gitkeep' && (IMG_EXTS.test(f) || VID_EXTS.test(f)))
      .sort(naturalSort);

    if (files.length === 0) continue;

    manifest[slug] = [];
    for (const file of files) {
      const full = join(dir, file);
      const isVid = VID_EXTS.test(file);
      const dims = isVid ? videoDims(full) : await imageDims(full);
      if (dims.w == null || dims.h == null) { failures++; continue; }
      manifest[slug].push({
        file,
        w: dims.w,
        h: dims.h,
        type: isVid ? 'video' : 'image',
        ar: `${dims.w}/${dims.h}`,
      });
      scanned++;
    }
  }

  // Stable pretty-printed JSON for git diffs.
  writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  if (failures) {
    // Tolerate partial failures (e.g. exotic formats CI can't decode):
    // missing dims just fall back to browser defaults at render time.
    console.log(`asset-dimensions.json: ${scanned} files, ${failures} skipped, ${Object.keys(manifest).length} slugs`);
  } else {
    console.log(`asset-dimensions.json: ${scanned} files, ${Object.keys(manifest).length} slugs`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });