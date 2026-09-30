# Portfolio project media

Public case-study media lives in one folder per project slug under `site/public/work/`.

## Current implementation

- Discovery: `site/src/utils/project-images.ts` reads supported media from `public/work/<slug>/` and sorts it naturally. Numeric prefixes come before alphabetic filenames, so `1.jpg`, `2.jpg`, and `10.jpg` stay in numeric order.
- Cover: the first image in that order becomes the cover. A project with no image has no discovered cover; videos are not used as a fallback cover.
- Trailer: the first video whose filename contains `trailer` (case-insensitive) becomes the dedicated trailer and is removed from the gallery.
- Gallery: every remaining supported media file, excluding the cover and dedicated trailer, stays in natural-sort order.
- Ignored files: `.gitkeep`, unsupported extensions, and non-media files such as `links.txt` are ignored.
- Rendering: `site/src/pages/work/[slug].astro` renders the dedicated trailer above the main project media. It renders the cover unless a YouTube embed or `seasons` presentation replaces it.
- Split gallery: the first two gallery items render before the project prose; the remaining gallery items render after the project prose. Gallery videos expose controls, while the dedicated trailer currently autoplays muted and loops.
- Special cases: season images replace the ordinary cover and are removed from the gallery. Kakofoni Orquestra hides its discovered gallery, and an `interactiveEmbed` uses the split cover-and-metadata layout.

## Supported formats

- Images: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`
- Videos: `.mp4`, `.webm`, `.mov`

Use numbered image filenames when presentation order matters. Image and video dimensions are recorded by `site/scripts/asset-dimensions.mjs` in `site/src/data/asset-dimensions.json`.

## Asset state (2026-09-30)

All 26 project cases currently have an image cover. The table reflects the exact output of the discovery rules above; `—` means no dedicated trailer or gallery item.

| Project | Cover | Trailer | Gallery |
|---|---|---|---|
| a-quermesse | 1.jpg | — | — |
| ableton-mcp-server | 1.jpg | — | — |
| ai-am | 1.jpg | — | — |
| arvore-seca | 1.jpg | — | 2.jpg, 3.jpg |
| bed-time | 1.jpg | — | — |
| bem-ali-sessions | 1.png | — | — |
| caio | 1.jpg | — | — |
| eletronik-fields | 1.webp | — | 2.webp, 3.webp, 4.webp, 6.webp |
| el-tono-del-mar | 2.jpg | trailer1.mp4 | 3.jpg, trailer2.mp4, trailermain.mp4 |
| em-agosto-chove | 1.png | — | 2.webp |
| ep-rinoceronte | 1.jpg | — | 2.jpg |
| futuro-realizado | 1.jpg | — | — |
| fxhash | 1.webp | — | 2.webp, 3.webp, 4.webp |
| invasao-do-pequi | 1.jpg | — | — |
| kakofoni-orquestra | 1.jpg | — | 2.webp (discovered, hidden on the case page) |
| lucy | 1.webp | — | 2.webp, 3.webp, 4.webp |
| o-clube | 1.jpg | — | 2.jpg |
| o-compositor | 1.jpg | trailer.mp4 | 2.jpg–7.jpg |
| rc-setlist | 1.jpg | — | 2.jpg–5.jpg |
| rc-surface | 1.jpg | — | — |
| soundwalking-lisboa | 1.jpg | — | — |
| this-feminine-side | 1.jpg | — | — |
| ticha-penicheiro | 1.jpg | — | — |
| trisal | 1.jpg | — | — |
| unconscious-vision | 1.jpg | — | — |
| unveiling-new-futures | 1.jpg | — | — |

`site/public/work/code/` contains supporting Gaussian posters and splat captures for the Code chapter; it is not a project case folder.
