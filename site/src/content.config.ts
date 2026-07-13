import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    year: z.union([z.number(), z.string()]),
    role: z.string().optional(),
    country: z.string().optional(),
    type: z.string().optional(),
    production: z.string().optional(),
    awards: z.array(z.string()).optional(),
    links: z.array(z.object({ url: z.string().url(), label: z.string().min(1) })).optional(),
    youtubeId: z.string().optional(),
    interactiveEmbed: z.object({
      url: z.string().url(),
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
      url: z.string().url(),
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

export const collections = { projects };
