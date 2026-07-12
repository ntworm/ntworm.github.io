import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type ProjectMedia = {
  /** First IMAGE in natural-sort order; null if none. */
  cover: string | null;
  coverType: 'image' | 'video' | null;
  /** First video file matching /trailer/i; null if none. */
  trailer: string | null;
  /** All remaining files (excluding cover and trailer), sorted naturally. */
  gallery: string[];
  galleryTypes: ('image' | 'video')[];
};

const IMAGE_EXTS = /\.(jpe?g|png|webp|avif|gif)$/i;
const VIDEO_EXTS = /\.(mp4|webm|mov)$/i;
const ANY_MEDIA_EXTS = /\.(jpe?g|png|webp|avif|gif|mp4|webm|mov)$/i;

/** Natural sort: numeric prefix wins, alpha tiebreak. */
function naturalSort(a: string, b: string): number {
  const aNum = a.match(/^(\d+)/)?.[1];
  const bNum = b.match(/^(\d+)/)?.[1];
  if (aNum !== undefined && bNum !== undefined) {
    const aInt = parseInt(aNum, 10);
    const bInt = parseInt(bNum, 10);
    if (aInt !== bInt) return aInt - bInt;
    return a.localeCompare(b);
  }
  if (aNum !== undefined) return -1;
  if (bNum !== undefined) return 1;
  return a.localeCompare(b);
}

function classify(filename: string): 'image' | 'video' | null {
  if (IMAGE_EXTS.test(filename)) return 'image';
  if (VIDEO_EXTS.test(filename)) return 'video';
  return null;
}

export function getProjectMedia(slug: string): ProjectMedia {
  const dir = join(process.cwd(), 'public', 'work', slug);
  const empty: ProjectMedia = { cover: null, coverType: null, trailer: null, gallery: [], galleryTypes: [] };
  if (!existsSync(dir)) return empty;

  const files = readdirSync(dir)
    .filter((f: string) => f !== '.gitkeep' && ANY_MEDIA_EXTS.test(f))
    .sort(naturalSort);

  if (files.length === 0) return empty;

  // Trailer: first video with "trailer" in the filename (case-insensitive)
  const trailerIdx = files.findIndex(
    (f: string) => VIDEO_EXTS.test(f) && /trailer/i.test(f),
  );
  const trailer = trailerIdx !== -1 ? `/work/${slug}/${files[trailerIdx]}` : null;

  // Cover: first IMAGE that isn't the trailer file
  const coverIdx = files.findIndex(
    (f: string, i: number) => i !== trailerIdx && IMAGE_EXTS.test(f),
  );
  const cover = coverIdx !== -1 ? `/work/${slug}/${files[coverIdx]}` : null;
  const coverType = coverIdx !== -1 ? classify(files[coverIdx]) : null;

  // Gallery: everything except cover and trailer, sorted
  const galleryFiles = files.filter(
    (_: string, i: number) => i !== coverIdx && i !== trailerIdx,
  );
  const gallery = galleryFiles.map((f: string) => `/work/${slug}/${f}`);
  const galleryTypes = galleryFiles.map((f: string) => classify(f) ?? 'image');

  return { cover, coverType, trailer, gallery, galleryTypes };
}