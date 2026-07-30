# Portfolio project images

Drop your images here, organized by project slug.

## Folder structure

```
public/work/
├── o-compositor/           # BA short film (2024)
├── el-tono-del-mar/        # Animation (2024)
├── this-feminine-side/      # Audiovisual (2024)
├── ep-rinoceronte/          # Music EP (2025)
├── eletronik-fields/        # Generative audiovisual (2022)
├── rc-surface/             # Ableton Live extension (2025)
└── trisal/                 # TV series (2026)
```

## Naming convention

**Numeric prefix** determines order (sorted naturally: `1.jpg, 2.jpg, ..., 10.jpg`):

- **`1.jpg`** → Cover image (used on the home tile + case page hero)
- **`2.jpg`, `3.jpg`, ...** → Gallery images (2-col grid below the body)
- **Trailers/videos**: name without numeric prefix, e.g. `trailer.mp4`, `trailermain.mp4`, `trailer1.mp4`. They appear in the gallery, sorted alphabetically after numbered files.

**Cover logic**: the first IMAGE file in natural-sort order becomes the cover. If only videos exist, the first video becomes the cover.

## Supported formats

Images: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`
Videos: `.mp4`, `.webm`, `.mov`

`.gif` files render as `<img>` (browsers handle GIF animation natively).
`.mp4`/`.webm` files render as `<video controls muted loop playsinline>`.

## What I do after you drop

1. `1.jpg` (or first image) → cover on home tile + case page hero
2. Remaining images + videos → 2-col gallery below the case body
3. `target="_blank"` + `rel="noopener"` on outbound references (entity links), not on local images

## Image recommendations

- **Cover** (`1.jpg`): 4:3 landscape, 1200×900px minimum
- **Gallery**: 16:9 or 4:3 landscape, 1200–2400px wide
- **Trailers**: 1280×720 minimum, H.264 mp4 preferred
- Compress before drop: webp > jpg 80% > png
- Filename numbers are NOT zero-padded (`1.jpg` not `01.jpg`) — sort is natural so `1, 2, 10` comes out right

## Coverage status (2026-07-09)

| Project | Cover | Gallery | Videos |
|---|---|---|---|
| o-compositor | ✓ 1.jpg | ✓ 2–7.jpg | ✓ trailer.mp4 |
| el-tono-del-mar | ✓ 2.jpg (no 1.jpg) | ✓ 3.jpg | ✓ trailer1/2/trailermain.mp4 |
| this-feminine-side | ✓ 1.jpg | — | — |
| ep-rinoceronte | ✓ 1.jpg | ✓ 2.jpg | — |
| eletronik-fields | ✓ 1.gif | ✓ 2/3/4/6.gif | — |
| rc-surface | pending | pending | pending |
| trisal | pending | pending | pending |