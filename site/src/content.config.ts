import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { YOUTUBE_ID_PATTERN } from './data/youtube-id.mjs';

// Only http(s): a javascript: link or embed would run in the site's origin.
const httpUrl = z.string().url().refine((value) => /^https?:\/\//i.test(value), {
  message: 'only http and https URLs are allowed',
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    // Optional only for work whose date is not confirmed (e.g. a podcast
    // episode whose page shows no date); every other case carries a year.
    year: z.union([z.number(), z.string()]).optional(),
    role: z.string().optional(),
    country: z.string().optional(),
    type: z.string().optional(),
    production: z.string().optional(),
    awards: z.array(z.string()).optional(),
    links: z.array(z.object({ url: httpUrl, label: z.string().min(1) })).optional(),
    youtubeId: z.string().optional(),
    // Vertical YouTube videos (Shorts) shown as a 9:16 grid after the case
    // text. A fact shared by both languages, so it lives in the English file.
    youtubeShorts: z.array(z.object({
      id: z.string().regex(YOUTUBE_ID_PATTERN, 'a YouTube video id has 11 characters'),
      title: z.string().min(1),
    })).min(1).optional(),
    interactiveEmbed: z.object({
      url: httpUrl,
      title: z.string().min(1),
      cta: z.string().min(1),
    }).optional(),
    hideGallery: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    seasons: z.array(z.object({ img: z.string(), label: z.string() })).optional(),
    // Mini-catalog: a list of sub-pieces associated with this project.
    // Used by fxhash to surface 7 generative pieces as a 2-col grid on the
    // case page. Each card renders as a thumb + title + desc + link.
    // desc is author-curated; leave empty if not yet written.
    fxhashPieces: z.array(z.object({
      slug: z.string(),
      title: z.string(),
      desc: z.string(),
      url: httpUrl,
      // Path to the thumb. Accepts either an absolute URL or a root-relative
      // path (`/work/fxhash/thumbs/<slug>.webp` is the typical local path).
      thumb: z.string(),
      // Thumb aspect ratio "W/H" (e.g. "1/1" or "800/1311"). Used inline
      // by the template so each card sizes to its natural image dimensions
      // instead of forcing a uniform 1/1 crop.
      thumbAr: z.string().regex(/^\d+\/\d+$/).optional(),
    })).optional(),
  }),
});

// Brazilian Portuguese translations, one file per project with the same
// slug as its English source. Only the words live here; facts shared by both
// languages (year, URLs, media, embeds) stay in the English file and are
// merged by src/i18n/projects.mjs. Link labels are matched by URL, season
// labels by image, and fxhash piece descriptions by slug.
const projectsPtBr = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects-pt-br' }),
  schema: z.object({
    title: z.string().optional(),
    role: z.string().optional(),
    country: z.string().optional(),
    type: z.string().optional(),
    production: z.string().optional(),
    awards: z.array(z.string()).optional(),
    links: z.array(z.object({ url: httpUrl, label: z.string().min(1) })).optional(),
    seasons: z.array(z.object({ img: z.string(), label: z.string() })).optional(),
    interactiveEmbed: z.object({
      title: z.string().min(1),
      cta: z.string().min(1),
    }).optional(),
    fxhashPieces: z.array(z.object({ slug: z.string(), desc: z.string() })).optional(),
  }),
});

export const collections = { projects, projectsPtBr };
