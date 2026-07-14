# Finite Continuous Document Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reversible `/continuous` preview that renders About, Work, Code, and Contact as one finite accessible document while keeping every existing public route intact and preserving exact Code structure.

**Architecture:** The approved Code page becomes a shared `CodeChapter` consumed by both `/code` and `/continuous`. Work is driven by the tested presentation model and rendered through tier-aware components. About and Contact become small chapter components. `Layout` gains an explicit continuous/immersive mode, but standard pages and project details retain their current shell.

**Tech Stack:** Astro 7 static pages/components, Astro content collections, JavaScript ESM presentation model, scoped CSS, Node `node:test` integrity tests.

---

## File structure

- Create `site/src/components/portfolio/CodeChapter.astro`: exact shared Code data, markup, Gaussians, and local styles.
- Create `site/src/components/portfolio/WorkEntry.astro`: one semantic project entry with tier-specific layout.
- Create `site/src/components/portfolio/WorkChapter.astro`: Work introduction plus 8 featured, 6 medium, and 23 Archive entries.
- Create `site/src/components/portfolio/AboutChapter.astro`: short identity prologue and four static editorial portraits.
- Create `site/src/components/portfolio/ContactChapter.astro`: one-screen contact invitation and profiles.
- Create `site/src/pages/continuous.astro`: reversible preview route composing the four chapters.
- Modify `site/src/pages/code.astro`: thin wrapper around the shared Code chapter.
- Modify `site/src/layouts/Layout.astro`: explicit standard/continuous and immersive shell behavior.
- Create `site/tests/continuous-document.test.mjs`: built-document checks for Work tiers, chapter order, portraits, and shared Code structure.
- Modify `site/tests/site-integrity.test.mjs`: move source-level Code assertions to the shared component and exercise both built routes where applicable.

Do not modify `site/src/pages/index.astro`, `site/src/pages/about.astro`, `site/src/pages/contact.astro`, `site/src/components/Nav.astro`, `site/src/components/Footer.astro`, `site/src/components/Tile.astro`, `site/src/pages/work/[slug].astro`, project Markdown, Gaussian camera code, or the Work presentation model.

### Task 1: Extract Code into a reusable chapter without visual change

**Files:**
- Create: `site/src/components/portfolio/CodeChapter.astro`
- Modify: `site/src/pages/code.astro`
- Modify: `site/tests/site-integrity.test.mjs`

- [ ] **Step 1: Write a failing delegation test**

Append to `site/tests/site-integrity.test.mjs`:

```js
test('code route delegates to the shared Code chapter', () => {
  const page = readFileSync(join(process.cwd(), 'src', 'pages', 'code.astro'), 'utf8');
  const chapterPath = join(process.cwd(), 'src', 'components', 'portfolio', 'CodeChapter.astro');

  assert.match(page, /import CodeChapter from ['"]\.\.\/components\/portfolio\/CodeChapter\.astro['"]/);
  assert.match(page, /<CodeChapter\s*\/>/);
  assert.ok(statSync(chapterPath).isFile());
});
```

- [ ] **Step 2: Run the focused integrity test and verify it fails**

Run from `site`:

```powershell
npm run build
if ($LASTEXITCODE -eq 0) { node --test --test-name-pattern="code route delegates" tests/site-integrity.test.mjs }
```

Expected: FAIL because `CodeChapter.astro` does not exist and the route has no shared import.

- [ ] **Step 3: Move the Code implementation verbatim into the shared component**

Create `site/src/components/portfolio/CodeChapter.astro` by moving, without rewriting:

- the `GaussianBackground` import and the `GH`, `GH_REPOS`, `tools`, `FXHASH`, and `SPLATS` constants from the current `site/src/pages/code.astro` frontmatter;
- all markup beginning at `<header class="code__hero">` and ending at the closing `</article>`;
- the complete local `<style>` block, including the current `:global(main)` and `:global(.nav)` overrides for this task.

The new component must have exactly this outer structure:

```astro
---
import GaussianBackground from '../GaussianBackground.astro';

// Move the existing GH, GH_REPOS, tools, FXHASH, and SPLATS constants here verbatim.
---

<div class="code-chapter" id="code" data-portfolio-chapter="code">
  <!-- Move the current code__hero and code article here verbatim. -->
</div>

<style>
  /* Move the complete existing Code style block here verbatim. */
</style>
```

The comments above describe exact moves from the existing source, not new placeholder UI: no string, project entry, class, Gaussian prop, selector, media query, keyframe, mask, or numeric composition value may change.

Replace `site/src/pages/code.astro` with:

```astro
---
import Layout from '../layouts/Layout.astro';
import CodeChapter from '../components/portfolio/CodeChapter.astro';
---

<Layout title="Code" image="https://avatars.githubusercontent.com/u/103321841?v=4">
  <CodeChapter />
</Layout>
```

- [ ] **Step 4: Point source-level integrity assertions at `CodeChapter.astro`**

In `site/tests/site-integrity.test.mjs`, add:

```js
const codeChapterSourcePath = join(
  process.cwd(),
  'src',
  'components',
  'portfolio',
  'CodeChapter.astro',
);
```

Use `readFileSync(codeChapterSourcePath, 'utf8')` instead of `pages/code.astro` in these tests:

- `code cards stay above softened Gaussian spill`;
- `code hero removes the top bar and reaches farther into GitHub` for all Code content/CSS assertions;
- the Code source inside `each primary page has its own hero copy and reveal language`.

Keep built `/code/index.html` assertions unchanged. Keep `GaussianBackground.astro` and camera-module assertions unchanged.

- [ ] **Step 5: Run focused and full regression tests**

Run from `site`:

```powershell
npm run build
if ($LASTEXITCODE -eq 0) { node --test --test-name-pattern="code|Gaussian|pointer" tests/site-integrity.test.mjs }
npm test
```

Expected: the focused command and full suite pass with 0 failures; built `/code` still contains two `.gs-bg` stages with `hero-right` and `section-left` placements.

- [ ] **Step 6: Commit the extraction**

Run from the repository root:

```powershell
git diff --check
git add site/src/components/portfolio/CodeChapter.astro site/src/pages/code.astro site/tests/site-integrity.test.mjs
git commit -m "refactor(code): extract reusable code chapter"
```

Expected: one commit containing only the three listed files.

### Task 2: Render the approved Work hierarchy on the preview route

**Files:**
- Create: `site/src/components/portfolio/WorkEntry.astro`
- Create: `site/src/components/portfolio/WorkChapter.astro`
- Create: `site/src/pages/continuous.astro`
- Create: `site/tests/continuous-document.test.mjs`

- [ ] **Step 1: Write failing built-document tests for 8/6/23**

Create `site/tests/continuous-document.test.mjs` with:

```js
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import test from 'node:test';

import {
  FEATURED_WORK_IDS,
  MORE_WORK_IDS,
  buildWorkPresentation,
} from '../src/data/work-presentation.mjs';

const distDir = join(process.cwd(), 'dist');
const projectsDir = join(process.cwd(), 'src', 'content', 'projects');

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function workTags(html, tier) {
  return [...html.matchAll(/<a\b[^>]*data-work-tier=(?:"[^"]*"|'[^']*')[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => attr(tag, 'data-work-tier') === tier);
}

function frontmatterScalar(source, field) {
  const value = source.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  if (!value) throw new Error(`Missing ${field}`);
  return value.replace(/^['"]|['"]$/g, '');
}

function loadProjects() {
  return readdirSync(projectsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(join(projectsDir, file), 'utf8');
      return {
        id: basename(file, '.md'),
        data: {
          title: frontmatterScalar(source, 'title'),
          year: frontmatterScalar(source, 'year'),
        },
      };
    });
}

test('continuous preview renders the approved Work tiers', () => {
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
  const ids = (tier) => workTags(html, tier).map((tag) => attr(tag, 'data-work-id'));

  assert.deepEqual(ids('featured'), FEATURED_WORK_IDS);
  assert.deepEqual(ids('more'), MORE_WORK_IDS);
  assert.deepEqual(
    ids('archive'),
    buildWorkPresentation(loadProjects()).archive.map((project) => project.id),
  );
});

test('continuous Work contains one link per tier entry and no empty href', () => {
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
  assert.equal(workTags(html, 'featured').length, 8);
  assert.equal(workTags(html, 'more').length, 6);
  assert.equal(workTags(html, 'archive').length, 23);
  assert.ok(
    [...workTags(html, 'featured'), ...workTags(html, 'more'), ...workTags(html, 'archive')]
      .every((tag) => /^\/work\/[a-z0-9-]+$/.test(attr(tag, 'href') ?? '')),
  );
});
```

- [ ] **Step 2: Build and verify the new route test fails**

Run from `site`:

```powershell
npm run build
if ($LASTEXITCODE -eq 0) { node --test tests/continuous-document.test.mjs }
```

Expected: FAIL with `ENOENT` for `dist/continuous/index.html`.

- [ ] **Step 3: Create the tier-aware Work entry**

Create `site/src/components/portfolio/WorkEntry.astro`. It must:

- accept `project`, `tier`, and `index` props;
- render one root `<a href={`/work/${project.id}`}>` with `data-work-tier` and `data-work-id`;
- render `project.media.cover` as an `<img>` or an explicit `image pending` fallback;
- render title, year, role, type, production, discipline, and the first award when present;
- use eager image loading only for the first featured item;
- never render body copy from Markdown or synthesize project facts.

Use this markup contract:

```astro
<a
  href={`/work/${project.id}`}
  class:list={[
    'work-entry',
    `work-entry--${tier}`,
    tier === 'featured' && index % 2 === 1 && 'is-reversed',
  ]}
  data-work-tier={tier}
  data-work-id={project.id}
>
  <div class="work-entry__media">
    {project.media.cover ? (
      <img
        src={project.media.cover}
        alt={`${project.data.title} — cover`}
        loading={tier === 'featured' && index === 0 ? 'eager' : 'lazy'}
      />
    ) : (
      <div class="work-entry__placeholder"><span class="mono">image pending</span></div>
    )}
  </div>
  <div class="work-entry__meta">
    <span class="work-entry__index eyebrow">{String(index + 1).padStart(2, '0')}</span>
    <span class="work-entry__discipline mono">{project.presentation.discipline}</span>
    <h3 class="work-entry__title">{project.data.title}</h3>
    <p class="work-entry__role mono">{project.data.role} · {project.data.year}</p>
    {project.data.type && <p class="work-entry__type">{project.data.type}</p>}
    {project.data.production && <p class="work-entry__production mono">{project.data.production}</p>}
    {project.data.awards?.[0] && <p class="work-entry__award">{project.data.awards[0]}</p>}
  </div>
</a>
```

Add scoped CSS with these exact layout rules and existing design tokens:

- root: `color: inherit; border-bottom: 0; min-width: 0`;
- featured: two-column grid `minmax(0, 1.25fr) minmax(280px, 0.75fr)`, `min-height: min(78vh, 820px)`, centered alignment, `gap: var(--s-8)`;
- reversed featured: media order 2, meta order 1;
- featured media: `min-height: clamp(360px, 56vw, 720px)`;
- more: block layout with media aspect ratio `4 / 3`;
- archive: compact grid card with media aspect ratio `4 / 3`, smaller title/metadata, and no award/production display;
- all images: width/height 100%, `object-fit: cover`, no displacement/filter animation;
- hover/focus may change border/text color only; lighting and transforms belong to Phase 3;
- below 760px, featured becomes one column and resets ordering.

- [ ] **Step 4: Create the Work chapter**

Create `site/src/components/portfolio/WorkChapter.astro` with a `presentation` prop and this semantic order:

```astro
<section id="work" class="portfolio-work wrap" data-portfolio-chapter="work">
  <header class="portfolio-work__header">
    <span class="eyebrow">Work</span>
    <h1>Sound direction, music production, and creative systems.</h1>
    <p>Completed work across cinema, television, music, generative art, performance, and tools.</p>
  </header>

  <div class="portfolio-work__practice" aria-label="Practice areas">
    <span>Film Audio</span>
    <span>Music Production</span>
    <span>Generative</span>
    <span>Live / Tools</span>
  </div>

  <section class="portfolio-work__selected" aria-labelledby="selected-work-title">
    <span class="eyebrow">Selected Work</span>
    <h2 id="selected-work-title">Eight defining projects.</h2>
    <div class="portfolio-work__featured">
      {presentation.featured.map((project, index) => (
        <WorkEntry project={project} tier="featured" index={index} />
      ))}
    </div>
  </section>

  <section class="portfolio-work__more" aria-labelledby="more-work-title">
    <span class="eyebrow">More Work</span>
    <h2 id="more-work-title">Further work across the practice.</h2>
    <div class="portfolio-work__more-grid">
      {presentation.more.map((project, index) => (
        <WorkEntry project={project} tier="more" index={index} />
      ))}
    </div>
  </section>

  <section class="portfolio-work__archive" aria-labelledby="archive-title">
    <span class="eyebrow">Archive</span>
    <h2 id="archive-title">Complete project index.</h2>
    <div class="portfolio-work__archive-grid">
      {presentation.archive.map((project, index) => (
        <WorkEntry project={project} tier="archive" index={index} />
      ))}
    </div>
  </section>
</section>
```

Scoped CSS must use:

- chapter padding `var(--s-10) 0`;
- header max width `850px` and bottom margin `var(--s-10)`;
- practice grid `repeat(4, minmax(0, 1fr))` with top/bottom hairlines;
- featured stack gap `var(--s-10)`;
- more grid `repeat(3, minmax(0, 1fr))`;
- archive grid `repeat(5, minmax(0, 1fr))`;
- at 980px: more 2 columns, Archive 4;
- at 700px: practice 2 columns, more 1, Archive 2.

- [ ] **Step 5: Create the isolated `/continuous` Work preview**

Create `site/src/pages/continuous.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../layouts/Layout.astro';
import WorkChapter from '../components/portfolio/WorkChapter.astro';
import { buildWorkPresentation } from '../data/work-presentation.mjs';
import { getProjectMedia } from '../utils/project-images';

const projects = (await getCollection('projects')).map((entry) => ({
  ...entry,
  media: getProjectMedia(entry.id),
}));
const work = buildWorkPresentation(projects);
---

<Layout title="Continuous Portfolio Preview" image="/portrait/1.jpg">
  <WorkChapter presentation={work} />
</Layout>
```

- [ ] **Step 6: Run focused and full tests**

Run from `site`:

```powershell
npm run build
if ($LASTEXITCODE -eq 0) { node --test tests/continuous-document.test.mjs }
npm test
```

Expected: both new tests and the complete suite pass with 0 failures. Existing `/`, `/about`, `/code`, `/contact`, and all `/work/*` routes still build.

- [ ] **Step 7: Commit the Work preview**

Run from the repository root:

```powershell
git diff --check
git add site/src/components/portfolio/WorkEntry.astro site/src/components/portfolio/WorkChapter.astro site/src/pages/continuous.astro site/tests/continuous-document.test.mjs
git commit -m "feat: render continuous work hierarchy"
```

Expected: one commit containing exactly the four listed files.

### Task 3: Compose the four finite chapters in the continuous shell

**Files:**
- Create: `site/src/components/portfolio/AboutChapter.astro`
- Create: `site/src/components/portfolio/ContactChapter.astro`
- Modify: `site/src/components/portfolio/CodeChapter.astro`
- Modify: `site/src/pages/code.astro`
- Modify: `site/src/pages/continuous.astro`
- Modify: `site/src/layouts/Layout.astro`
- Modify: `site/tests/continuous-document.test.mjs`
- Modify: `site/tests/site-integrity.test.mjs`

- [ ] **Step 1: Add failing tests for chapter order, editorial portraits, and shared Code parity**

Append to `site/tests/continuous-document.test.mjs`:

```js
function chapterSlice(html, id, nextId) {
  const start = html.indexOf(`data-portfolio-chapter="${id}"`);
  const end = nextId ? html.indexOf(`data-portfolio-chapter="${nextId}"`, start) : html.length;
  assert.ok(start >= 0, `missing ${id} chapter`);
  assert.ok(end > start, `invalid ${id} chapter boundary`);
  return html.slice(start, end);
}

function codeSignature(html) {
  return {
    hero: (html.match(/class="code__hero"/g) ?? []).length,
    article: (html.match(/class="code wrap"/g) ?? []).length,
    gaussians: (html.match(/class="gs-bg"/g) ?? []).length,
    heroPlacement: (html.match(/data-placement="hero-right"/g) ?? []).length,
    lowerPlacement: (html.match(/data-placement="section-left"/g) ?? []).length,
    cameraMotion: (html.match(/data-camera-motion="1"/g) ?? []).length,
    github: (html.match(/class="gh-card"/g) ?? []).length,
    tools: (html.match(/class="tool-card"/g) ?? []).length,
    lower: (html.match(/class="code__lower-showcase"/g) ?? []).length,
    fxhash: (html.match(/class="fxhash"/g) ?? []).length,
    splats: (html.match(/class="splats-card"/g) ?? []).length,
  };
}

test('continuous preview renders four finite chapters once and in order', () => {
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
  const chapters = [...html.matchAll(/data-portfolio-chapter="(about|work|code|contact)"/g)]
    .map((match) => match[1]);
  assert.deepEqual(chapters, ['about', 'work', 'code', 'contact']);
  for (const id of chapters) assert.match(html, new RegExp(`id="${id}"`));
});

test('About portraits remain four static editorial images', () => {
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
  const about = chapterSlice(html, 'about', 'work');
  const portraits = [...about.matchAll(/<img\b[^>]*src="\/portrait\/[^"]+"[^>]*>/g)];
  assert.equal(portraits.length, 4);
  assert.doesNotMatch(about, /<canvas\b|<video\b|class="gs-bg"|\.splat|particle|shader|displacement|depth-map/i);
});

test('continuous and standalone routes render the same Code structure', () => {
  const standalone = readFileSync(join(distDir, 'code', 'index.html'), 'utf8');
  const continuous = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
  const code = chapterSlice(continuous, 'code', 'contact');
  assert.deepEqual(codeSignature(code), codeSignature(standalone));
  assert.deepEqual(codeSignature(code), {
    hero: 1,
    article: 1,
    gaussians: 2,
    heroPlacement: 1,
    lowerPlacement: 1,
    cameraMotion: 2,
    github: 1,
    tools: 4,
    lower: 1,
    fxhash: 1,
    splats: 1,
  });
});

test('standalone and continuous routes import the same Code chapter', () => {
  const standalone = readFileSync(join(process.cwd(), 'src', 'pages', 'code.astro'), 'utf8');
  const continuous = readFileSync(join(process.cwd(), 'src', 'pages', 'continuous.astro'), 'utf8');
  assert.match(standalone, /import CodeChapter/);
  assert.match(continuous, /import CodeChapter/);
});
```

- [ ] **Step 2: Build and verify the chapter tests fail**

Run from `site`:

```powershell
npm run build
if ($LASTEXITCODE -eq 0) { node --test tests/continuous-document.test.mjs }
```

Expected: existing Work tests pass; the four new tests fail because About, Code, and Contact are not composed.

- [ ] **Step 3: Add explicit continuous/immersive Layout modes**

Extend `Layout.astro` props and state:

```ts
interface Props {
  title: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'article';
  canonicalUrl?: string;
  mode?: 'standard' | 'continuous';
  immersive?: boolean;
}

const {
  title,
  description = 'Sound direction, music production, and creative tooling for cinema, performance, and live instruments.',
  image = null,
  type = 'website',
  canonicalUrl = Astro.url.href,
  mode = 'standard',
  immersive = false,
} = Astro.props;
const isContinuous = mode === 'continuous';
const isImmersive = immersive || isContinuous;
```

Change the body/footer shell to:

```astro
<body data-layout={mode} data-immersive={isImmersive ? 'true' : 'false'}>
  <div class="page-curtain" transition:persist></div>
  <a href="#main" class="skip-link">Skip to content</a>
  <Nav />
  <main id="main"><slot /></main>
  {!isContinuous && <Footer />}
  <!-- retain the existing global script imports -->
</body>
```

Add Layout-scoped global rules:

```css
:global(body[data-immersive="true"] main) { padding-top: 0; }
:global(body[data-immersive="true"] .nav) {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
:global(body[data-layout="continuous"] main) { padding-bottom: 0; }
```

Remove only the equivalent `:global(main)` and `:global(.nav)` rules from `CodeChapter.astro`; do not change any other Code style.

Update `/code` to `<Layout ... immersive={true}>`.

- [ ] **Step 4: Create the compact About chapter**

Create `AboutChapter.astro` by reusing the existing portrait discovery/natural-sort code from `pages/about.astro`. Render exactly one section:

```astro
<section id="about" class="portfolio-about wrap" data-portfolio-chapter="about">
  <div class="portfolio-about__copy">
    <span class="eyebrow">About</span>
    <h1 data-reveal="focus">A practice shaped by listening, systems, and collaboration.</h1>
    <p class="portfolio-about__lead">
      Sound direction, music production, and creative tooling — for cinema, performance,
      and live instruments. Based in Palmas, Tocantins, Brazil.
    </p>
    <p>
      Across all three, the thread is the same: I build instruments — acoustic, digital,
      conceptual — to make work that is specific, situated, and accountable to a place.
    </p>
    <p>
      Before the engineering work, I spent six years in the Palmas music scene as a composer,
      guitarist, and producer. I returned to Palmas in 2025 and have been based here since.
    </p>
  </div>
  <div class="portfolio-about__portraits" aria-label="Portraits">
    {portraitFiles.map((file, index) => (
      <figure><img src={`/portrait/${file}`} alt={`Portrait ${index + 1} of ${portraitFiles.length}`} loading="lazy" /></figure>
    ))}
  </div>
</section>
```

CSS: two-column copy/portrait grid, `min-height: 100vh`, chapter padding, natural-aspect images with no filters/transforms/animations, and one-column below 760px. Do not import Gaussian, canvas, shader, or motion code.

- [ ] **Step 5: Create the minimal Contact chapter**

Create `ContactChapter.astro` with the five existing contact links and this contract:

```astro
<section id="contact" class="portfolio-contact wrap" data-portfolio-chapter="contact">
  <header>
    <span class="eyebrow">Contact</span>
    <p class="mono">Available for cinema, music, and creative coding projects.</p>
    <h2><a href="mailto:gabrielwormm@gmail.com">gabrielwormm@gmail.com</a></h2>
  </header>
  <ul>
    {links.map((link) => (
      <li><span class="mono">{link.label}</span><a href={link.href} rel="noopener">{link.value} ↗</a></li>
    ))}
  </ul>
  <p class="mono">Currently based in Palmas, Tocantins, Brazil.</p>
</section>
```

Reuse the current Email, LinkedIn, IMDB, GitHub, and fxhash values exactly. CSS gives the chapter `min-height: 100vh`, vertically centers it, preserves current hairline list treatment, and uses one column on mobile. Do not add a form.

- [ ] **Step 6: Compose the finite document**

Update `continuous.astro` imports and layout:

```astro
import AboutChapter from '../components/portfolio/AboutChapter.astro';
import CodeChapter from '../components/portfolio/CodeChapter.astro';
import ContactChapter from '../components/portfolio/ContactChapter.astro';
```

Render:

```astro
<Layout title="Continuous Portfolio Preview" image="/portrait/1.jpg" mode="continuous">
  <AboutChapter />
  <WorkChapter presentation={work} />
  <CodeChapter />
  <ContactChapter />
</Layout>
```

Do not modify Nav links in this task.

- [ ] **Step 7: Generalize built Code integrity to both routes**

In `site-integrity.test.mjs`, add a helper returning the two built documents:

```js
function builtCodeDocuments() {
  return [
    ['code/index.html', readFileSync(join(distDir, 'code', 'index.html'), 'utf8')],
    ['continuous/index.html', readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8')],
  ];
}
```

Run the built-document assertions inside `code page stacks two scroll-bound borderless Gaussians` and `both Gaussians opt into smoothed camera motion around the fixed origin` for each tuple. Source-level Gaussian/camera assertions still run once. Update the shell assertions in `code hero removes the top bar and reaches farther into GitHub` to read the immersive rules from `Layout.astro` and content rules from `CodeChapter.astro`.

- [ ] **Step 8: Run full verification and commit**

Run from `site`:

```powershell
npm run build
if ($LASTEXITCODE -eq 0) { node --test tests/continuous-document.test.mjs }
npm test
```

Then from the repository root:

```powershell
git diff --check
git add site/src/components/portfolio/AboutChapter.astro site/src/components/portfolio/ContactChapter.astro site/src/components/portfolio/CodeChapter.astro site/src/pages/code.astro site/src/pages/continuous.astro site/src/layouts/Layout.astro site/tests/continuous-document.test.mjs site/tests/site-integrity.test.mjs
git commit -m "feat: compose finite continuous portfolio preview"
```

Expected: the preview has exactly About -> Work -> Code -> Contact; portraits remain static; `/code` and the Code chapter share the same structural signature; all tests pass; standard routes retain Footer and padding.

## Self-Review

Spec coverage:

- PASS: finite About -> Work -> Code -> Contact preview exists without replacing production `/`.
- PASS: Work renders exact 8/6 tiers and all 23 Archive entries from the content collection.
- PASS: About is compact and uses only four static editorial images.
- PASS: Code is shared with the standalone route and protected by structural parity tests.
- PASS: Contact is one minimal chapter with no form.
- PASS: project detail pages and existing main routes are outside the modification set.
- N/A: lighting, logical infinity, fragment navigation, lifecycle throttling, and adaptive GPU budgets belong to later roadmap phases.

Placeholder scan:

- PASS: every created component has an explicit markup contract, content source, layout behavior, tests, commands, and commit scope. Verbatim Code extraction identifies exact existing source regions and forbids content/style changes.

Type consistency:

- PASS: presentation tiers remain `featured`, `more`, and `archive`; chapter IDs and `data-portfolio-chapter` values remain `about`, `work`, `code`, and `contact`; both Code consumers import the same component.

Execution Consistency Audit evidence:

- PASS Test/implementation trace: delegation assertions map to the thin Code route; tier assertions map to `data-work-tier/id`; chapter order maps to chapter wrappers; portrait assertions map to About's image-only markup; Code signatures map to shared component instances.
- PASS Per-task command executability: `npm run build`, Node test runner, and `npm test` already exist; each new test file is created before invocation; all routes/components are created within their task before full build.
- PASS File usage audit: CodeChapter is read by `/code` and `/continuous`; Work components are read by `/continuous`; About/Contact are read by `/continuous`; both test files read built/source artifacts they assert.
- PASS Spec lifecycle audit: standard pages retain Layout/Footer lifecycle; continuous mode omits only the outer Footer; Astro global scripts remain mounted exactly once. Loop normalization and scene pause/resume are explicitly outside this phase.
- N/A Time source audit: the phase introduces no runtime timestamps or clocks.
- PASS State scope audit: all project presentation state is build-local; components are stateless; no new global mutable browser state or cache is introduced.
- N/A Environment audit: no LAN/mobile URLs, sockets, or QR codes are introduced; all preview and project paths are root-relative site routes.
- N/A Browser event audit: this phase introduces no new pointer, touch, drag, or scroll handler; visual browser review is manual and is not claimed as gesture coverage.
- PASS Lint/import audit: the repository has no linter; Astro build checks component imports/templates and Node executes ESM tests. Imports in each contract point to existing or same-task files.
- PASS Non-obvious API audit: only documented Astro props/slots/content collection behavior and stable Node filesystem/test APIs are used; no hidden callbacks or sleep-based readiness checks are introduced.
