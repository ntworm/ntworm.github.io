import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import test from 'node:test';

import {
  OVERVIEW_WORK_IDS,
  buildWorkPresentation,
} from '../src/data/work-presentation.mjs';

const distDir = join(process.cwd(), 'dist');
const projectsDir = join(process.cwd(), 'src', 'content', 'projects');
const aboutChapterPath = join(process.cwd(), 'src', 'components', 'portfolio', 'AboutChapter.astro');
const hydraBackgroundPath = join(process.cwd(), 'src', 'components', 'HydraBackground.astro');
const homepagePath = join(process.cwd(), 'src', 'pages', 'index.astro');
const layoutPath = join(process.cwd(), 'src', 'layouts', 'Layout.astro');
const workChapterPath = join(process.cwd(), 'src', 'components', 'portfolio', 'WorkChapter.astro');
const workArchivePath = join(process.cwd(), 'src', 'components', 'portfolio', 'WorkArchive.astro');
const workEntryPath = join(process.cwd(), 'src', 'components', 'portfolio', 'WorkEntry.astro');

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function workTags(html, tier) {
  return [...html.matchAll(/<a\b[^>]*data-work-tier=(?:"[^"]*"|'[^']*')[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => attr(tag, 'data-work-tier') === tier);
}

function workEntries(html, tier) {
  return [...html.matchAll(/<a\b[^>]*data-work-tier="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi)]
    .filter((match) => match[1] === tier)
    .map((match) => match[0]);
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

function builtCaseDocuments() {
  return readdirSync(join(distDir, 'work'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => existsSync(join(distDir, 'work', entry.name, 'index.html')))
    .map((entry) => {
      const label = `work/${entry.name}/index.html`;
      return { label, html: readFileSync(join(distDir, label), 'utf8') };
    });
}

test('homepage renders seven finite chapters once and in order', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const chapters = [...html.matchAll(/data-portfolio-chapter="(about|projects|code|work|archive|practice|contact)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(chapters, ['about', 'practice', 'projects', 'code', 'work', 'archive', 'contact']);
  for (const id of chapters) assert.match(html, new RegExp(`id="${id}"`));
});

test('mixed project panel follows the opening and practice and offers every case without waiting for animation', () => {
  for (const prefix of ['', 'pt-br/']) {
    const html = readFileSync(join(distDir, prefix, 'index.html'), 'utf8');
    const about = chapterSlice(html, 'about', 'practice');
    const panel = chapterSlice(html, 'projects', 'code');
    const work = chapterSlice(html, 'work', 'archive');
    const practice = chapterSlice(html, 'practice', 'projects');
    const path = prefix ? '/pt-br' : '';
    const links = [...panel.matchAll(/<a\b[^>]*data-overview-project="[^"]+"[^>]*>/g)].map(([tag]) => tag);
    assert.deepEqual(links.map((tag) => attr(tag, 'data-overview-project')), OVERVIEW_WORK_IDS);
    for (const link of links) {
      assert.equal(attr(link, 'href'), `${path}/work/${attr(link, 'data-overview-project')}`);
      assert.doesNotMatch(link, /\binert\b|aria-hidden="true"|tabindex="-1"/);
    }
    const cards = [...panel.matchAll(/<a\b[^>]*data-overview-project="([^"]+)"[^>]*>[\s\S]*?<\/a>/g)];
    for (const [card, id] of cards) {
      const image = card.match(/<img\b[^>]*>/)?.[0];
      assert.ok(image, `${id}: existing cover appears on the card`);
      assert.ok(attr(image, 'src').startsWith(`/work/${id}/`), `${id}: cover belongs to the linked project`);
      assert.equal(attr(image, 'alt'), '', `${id}: cover is decorative`);
      assert.equal(attr(image, 'loading'), 'lazy');
      assert.ok(existsSync(join(process.cwd(), 'public', attr(image, 'src'))), `${id}: cover exists`);
    }
    const slides = [...panel.matchAll(/<a\b[^>]*data-spotlight-slide[^>]*>/g)].map(([tag]) => tag);
    assert.deepEqual(slides.map((tag) => attr(tag, 'data-spotlight-project')), OVERVIEW_WORK_IDS);
    assert.equal(attr(slides[0], 'aria-hidden'), 'false');
    assert.ok(slides.slice(1).every((tag) => attr(tag, 'aria-hidden') === 'true' && /\binert\b/.test(tag)));
    assert.doesNotMatch(work, /data-spotlight|data-overview-project/);
    assert.doesNotMatch(about, /class="portfolio-about__thread"/);
    assert.match(practice, /class="portfolio-about__thread"/);
    assert.match(panel, prefix ? /Som, música, código e imagem\./ : /Sound, music, code, and moving image\./);
    assert.match(panel, new RegExp(`href="${path}/#code"`));
    assert.match(panel, new RegExp(`href="${path}/#generative"`));
    assert.match(html, /id="generative"/);
  }
});

test('continuous homepage reserves its single H1 for About and preserves chapter headline styles', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const work = readFileSync(workChapterPath, 'utf8');
  const code = readFileSync(join(process.cwd(), 'src', 'components', 'portfolio', 'CodeChapter.astro'), 'utf8');

  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(work, /<h2[^>]*data-work-title-reveal/);
  assert.doesNotMatch(work, /<h1[^>]*data-work-title-reveal/);
  assert.match(work, /\.portfolio-work__header h2/);
  assert.match(code, /<h2[^>]*class="code__title"[^>]*data-reveal="typewriter"[^>]*aria-label="Tools and musical interfaces\."/);
  assert.doesNotMatch(code, /<h1[^>]*data-reveal="typewriter"/);
});

test('public homepage serves the continuous portfolio as the primary experience', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const chapters = [...html.matchAll(/data-portfolio-chapter="(about|projects|code|work|archive|practice|contact)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(chapters, ['about', 'practice', 'projects', 'code', 'work', 'archive', 'contact']);
  assert.match(html, /<title>Sound, Music &amp; Creative Systems &mdash; Gabriel Worm/);
});

test('homepage renders the approved Work tiers', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const ids = (tier) => workTags(html, tier).map((tag) => attr(tag, 'data-work-id'));

  assert.deepEqual(ids('featured'), buildWorkPresentation(loadProjects()).audiovisual.featured.map((project) => project.id));
  assert.deepEqual(ids('more'), buildWorkPresentation(loadProjects()).audiovisual.more.map((project) => project.id));
  assert.deepEqual(
    ids('archive'),
    buildWorkPresentation(loadProjects()).archive.map((project) => project.id),
  );
});

test('homepage Work contains one link per tier entry and no empty href', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');

  assert.equal(workTags(html, 'featured').length, 11);
  assert.equal(workTags(html, 'more').length, 2);
  assert.equal(workTags(html, 'archive').length, 26);
  assert.ok(
    [...workTags(html, 'featured'), ...workTags(html, 'more'), ...workTags(html, 'archive')]
      .every((tag) => /^\/work\/[a-z0-9-]+$/.test(attr(tag, 'href') ?? '')),
  );
});

test('About portraits remain four static editorial images', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const about = chapterSlice(html, 'about', 'projects');
  const portraits = [...about.matchAll(/<img\b[^>]*src="(\/portrait\/[^"]+)"[^>]*>/g)];

  assert.deepEqual(portraits.map((match) => match[1]), [
    '/portrait/1.jpg',
    '/portrait/2.jpg',
    '/portrait/3.jpg',
    '/portrait/4.jpg',
  ]);
  assert.doesNotMatch(
    about,
    /<canvas\b|<video\b|class="gs-bg"|\.splat|particle|shader|displacement|depth-map/i,
  );
});

test('About headline and portrait choreography are progressive and motion-safe', () => {
  const source = readFileSync(aboutChapterPath, 'utf8');

  assert.match(source, /<h1[^>]*[\s\S]*?data-reveal="focus"/);
  assert.match(source, /class="reveal-seg reveal-amber">listening,<\/span>/);
  assert.match(source, /filter:\s*blur\(16px\)/);
  assert.match(source, /animation:\s*about-focus-in\s+780ms/);
  assert.match(source, /@media \(hover: hover\) and \(pointer: fine\)/);
  assert.match(source, /figure:hover img\s*\{[^}]*translate3d\(0, -3px, 0\) scale\(1\.008\)/s);
  assert.match(source, /animation:\s*about-float-a\s+13s/);
  assert.match(source, /transition:\s*transform\s+820ms/);
  assert.doesNotMatch(source, /:has\(/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(source, /backdrop-filter|<canvas\b|<video\b/i);
});

test('About carries the existing manifesto and four practice areas into one editorial thread', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const about = chapterSlice(html, 'practice', 'projects');

  assert.match(about, /Three movements\. Four areas\. One thread\./);
  assert.match(about, /I work at the intersection of film sound, music production, and creative tooling\./);
  assert.match(about, /data-practice-area="film-audio"/);
  assert.match(about, /data-practice-area="music-production"/);
  assert.match(about, /data-practice-area="creative-coding"/);
  assert.match(about, /data-practice-area="live-experimental"/);
  assert.match(about, /href="\/work\/o-compositor"/);
  assert.match(about, /href="\/work\/ep-rinoceronte"/);
  assert.match(about, /href="\/work\/rc-surface"/);
  assert.match(about, /television;\s+<em[^>]*>music<\/em>/);
  assert.match(about, /Recent work includes\s+<a[^>]*>O Compositor<\/a>/);
});

test('one Lines and Cells surface spans the opening and project panel and dissolves before Code', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const openingStart = html.indexOf('data-portfolio-opening');
  const codeStart = html.indexOf('data-portfolio-chapter="code"');
  const opening = html.slice(openingStart, codeStart);
  const work = chapterSlice(html, 'work', 'archive');
  const source = existsSync(hydraBackgroundPath) ? readFileSync(hydraBackgroundPath, 'utf8') : '';
  const sketch = readFileSync(join(process.cwd(), 'public', 'hydra', 'lines-and-cells.mjs'), 'utf8');
  const aboutSource = readFileSync(aboutChapterPath, 'utf8');
  const homepage = readFileSync(homepagePath, 'utf8');
  const layout = readFileSync(layoutPath, 'utf8');
  const openingSource = readFileSync(join(process.cwd(), 'src', 'components', 'portfolio', 'PortfolioOpening.astro'), 'utf8');

  assert.ok(openingStart >= 0 && codeStart > openingStart);
  assert.equal((html.match(/data-hydra-src=/g) ?? []).length, 1);
  assert.match(opening, /class="portfolio-opening__live-bg"/);
  assert.ok(opening.indexOf('class="portfolio-opening__live-bg"') < opening.indexOf('class="portfolio-about__hero"'));
  assert.match(opening, /data-portfolio-chapter="practice"/);
  assert.match(opening, /data-portfolio-chapter="projects"/);
  assert.match(opening, /<\/section>\s*<\/div>\s*<div class="code-chapter" id="code"[^>]*$/);
  assert.match(html, /class="portfolio-opening__live-stage"/);
  assert.match(html, /title="Lines and Cells live generative background"/);
  assert.match(html, /width="640"/);
  assert.match(html, /height="360"/);
  assert.match(html, /src="about:blank"/);
  assert.match(html, /data-hydra-src="\/hydra\/lines-and-cells\.html"/);
  assert.doesNotMatch(html, /lines-and-cells\.html\?fxhash/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /sandbox="allow-scripts allow-same-origin"/);
  assert.doesNotMatch(source, /portfolio-opening__live-bg-fallback|lines-and-cells\.webp/);
  assert.doesNotMatch(work, /portfolio-(?:opening|work)__live-bg|Lines and Cells live generative background/);
  assert.doesNotMatch(homepage, /HydraBackground/);
  assert.doesNotMatch(layout, /<slot name="backdrop"/);
  assert.doesNotMatch(aboutSource, /HydraBackground/);
  assert.match(openingSource, /import HydraBackground from '\.\.\/HydraBackground\.astro';/);
  assert.match(openingSource, /<HydraBackground\s*\/>/);
  for (const page of [homepage, readFileSync(join(process.cwd(), 'src', 'pages', 'pt-br', 'index.astro'), 'utf8')]) {
    assert.match(page, /<PortfolioOpening>\s*<AboutChapter\s*\/>\s*<AboutChapter part="practice"\s*\/>\s*<WorkChapter presentation=\{work\} mode="overview"\s*\/>\s*<\/PortfolioOpening>\s*<CodeChapter\s*\/>/s);
  }
  assert.match(source, /\.portfolio-opening__live-bg\s*\{[^}]*position:\s*absolute;[^}]*top:\s*-?[\d.]+vh;[^}]*bottom:\s*0;[^}]*left:\s*50%;[^}]*width:\s*100vw;[^}]*transform:\s*translateX\(-50%\);[^}]*z-index:\s*0;[^}]*pointer-events:\s*none;[^}]*overflow:\s*hidden;/s);
  assert.doesNotMatch(source, /position:\s*fixed/);
  assert.doesNotMatch(source, /getBoundingClientRect\(\)/);
  assert.match(source, /\.portfolio-opening__live-stage\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*overflow:\s*hidden;/s);
  assert.match(source, /linear-gradient\(180deg, #000 0%, #000 calc\(100% - clamp\(180px, 32vh, 360px\)\), transparent 100%\)/);
  assert.match(source, /\.portfolio-opening__live-bg iframe\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
  assert.doesNotMatch(source, /--hydra-scale-[xy]|ResizeObserver|scale\(var\(--hydra-scale/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
  assert.match(sketch, /new Hydra\(\{[\s\S]*canvas,[\s\S]*autoLoop:\s*false[\s\S]*\}\)/);
  assert.match(sketch, /hydra\.tick\(dt\)/);
  assert.doesNotMatch(source, /frame\s*=\s*requestAnimationFrame\(\(\)\s*=>\s*\{\s*frame\s*=\s*requestAnimationFrame\(loadHydra\);\s*\}\)/s);
  assert.match(aboutSource, /\.portfolio-about__hero\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
  assert.match(aboutSource, /\.portfolio-about__thread\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
});

test('general project panel pairs the editorial statement with a mixed spotlight and area links', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const work = chapterSlice(html, 'projects', 'code');
  const audiovisual = chapterSlice(html, 'work', 'archive');
  const source = readFileSync(workChapterPath, 'utf8');

  assert.match(work, /class="portfolio-work__hero"/);
  assert.equal((work.match(/class="work-spotlight-cell"/g) ?? []).length, 8);
  assert.match(work, /aria-label="Practice areas"/);
  assert.match(work, /Film &amp; television/);
  assert.match(work, /Music &amp; live sound/);
  assert.match(work, /Musical interfaces/);
  assert.match(work, /Generative art/);
  assert.match(source, /createSpotlightController/);
  assert.match(source, /motionQuery\.addEventListener\('change', syncReducedMotion\)/);
  assert.match(source, /controller\.setPaused\('reduced-motion', event\.matches\)/);
  assert.match(source, /motionQuery\.removeEventListener\('change', syncReducedMotion\)/);
  assert.match(source, /\.work-spotlight-cell\.is-active/);
  assert.doesNotMatch(source, /@keyframes work-spotlight-cycle/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(audiovisual, /class="portfolio-work__runway"/);
  assert.match(audiovisual, /class="portfolio-work__runway-count mono"[^>]*>01—11<\/span>/);
  assert.match(audiovisual, /class="portfolio-work__runway-rule"/);
  assert.match(audiovisual, /<h2 id="selected-work-title"[^>]*>Sound for film, music, and the stage\.<\/h2>/);
  assert.match(work, /data-work-title-reveal/);
  assert.match(readFileSync(workChapterPath, 'utf8'), /IntersectionObserver/);
  assert.match(readFileSync(workChapterPath, 'utf8'), /animation:\s*work-line-in\s+760ms/);
});

test('featured entries alone render summaries and explicit orientation classes', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const work = chapterSlice(html, 'work', 'archive');
  const archiveChapter = chapterSlice(html, 'archive', 'contact');
  const featured = workEntries(work, 'featured');
  const more = workEntries(work, 'more');
  const archive = workEntries(archiveChapter, 'archive');
  const featuredTags = workTags(work, 'featured');
  const layoutById = Object.fromEntries(featuredTags.map((tag) => [
    attr(tag, 'data-work-id'),
    attr(tag, 'data-media-layout'),
  ]));

  assert.equal(featured.length, 11);
  assert.ok(featured.every((entry) => (entry.match(/class="work-entry__summary"/g) ?? []).length === 1));
  assert.ok(featured.every((entry) => (entry.match(/class="work-entry__summary-highlight"/g) ?? []).length === 1));
  assert.ok([...more, ...archive].every((entry) => !entry.includes('work-entry__summary')));
  assert.ok([...more, ...archive].every((entry) => !entry.includes('work-entry__summary-highlight')));
  assert.deepEqual(layoutById, {
    'o-compositor': 'portrait',
    'unveiling-new-futures': 'landscape',
    'o-clube': 'portrait',
    'this-feminine-side': 'portrait',
    'ep-rinoceronte': 'portrait',
    trisal: 'portrait',
    'el-tono-del-mar': 'landscape',
    'em-agosto-chove': 'landscape',
    'ai-am': 'portrait',
    'unconscious-vision': 'portrait',
    'arvore-seca': 'portrait',
  });
  assert.match(featuredTags[0], /\bis-lead\b/);
  assert.ok(featuredTags.slice(1).every((tag) => !/\bis-lead\b/.test(tag)));
});

test('featured factual highlights live inside the existing summary and turn amber on hover', () => {
  const source = readFileSync(workEntryPath, 'utf8');

  assert.match(source, /<span class="work-entry__summary-highlight">/);
  assert.doesNotMatch(source, /<p class="work-entry__highlight/);
  assert.match(source, /\.work-entry__summary-highlight\s*\{[^}]*color:\s*inherit;/s);
  assert.match(source, /\.work-entry:hover \.work-entry__summary-highlight,[^}]*\{[^}]*color:\s*var\(--accent-amber\);/s);
});

test('featured projects reveal a diffused poster backdrop and zoom both image layers on hover', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const work = chapterSlice(html, 'work', 'archive');
  const featured = workEntries(work, 'featured');
  const source = readFileSync(workEntryPath, 'utf8');

  assert.equal(featured.length, 11);
  assert.ok(featured.every((entry) => (entry.match(/class="work-entry__backdrop"/g) ?? []).length === 1));
  assert.match(source, /\.work-entry--featured\s*\{[^}]*overflow:\s*visible;/s);
  assert.match(source, /\.work-entry--featured \.work-entry__backdrop\s*\{[^}]*position:\s*absolute;[^}]*top:\s*0;[^}]*bottom:\s*0;[^}]*left:\s*50%;[^}]*width:\s*100vw;[^}]*transform:\s*translateX\(-50%\);[^}]*opacity:\s*0\.3;[^}]*mask-image:[^}]*linear-gradient\(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%\)/s);
  assert.match(source, /\.work-entry__backdrop img\s*\{[^}]*filter:\s*blur\(26px\)[^}]*transform:\s*scale\(1\.08\);/s);
  assert.match(source, /\.work-entry--featured:hover \.work-entry__backdrop,[^}]*\{[^}]*opacity:\s*0\.9;/s);
  assert.match(source, /\.work-entry--featured:hover \.work-entry__backdrop img,[^}]*\{[^}]*transform:\s*scale\(1\.18\);/s);
  assert.match(source, /\.work-entry--featured:hover \.work-entry__media img,[^}]*\{[^}]*transform:\s*scale\(1\.1\);/s);
});

test('Chapter transitions preserve compact About and Work spacing', () => {
  const aboutSource = readFileSync(aboutChapterPath, 'utf8');
  const workSource = readFileSync(workChapterPath, 'utf8');

  assert.match(aboutSource, /\.portfolio-about\s*\{[^}]*padding-top:\s*var\(--s-7\);[^}]*padding-bottom:\s*0;/s);
  assert.match(aboutSource, /\.portfolio-about__hero\s*\{[^}]*min-height:\s*auto;[^}]*padding-bottom:\s*var\(--s-8\);[^}]*border-bottom:/s);
  assert.match(aboutSource, /\.portfolio-about__thread\s*\{[^}]*padding:\s*var\(--s-8\) 0 var\(--s-7\);[^}]*border-top:\s*0;/s);
  assert.match(aboutSource, /\.portfolio-about__areas\s*\{[^}]*margin-top:\s*var\(--s-3\);/s);
  assert.match(workSource, /\.portfolio-work\s*\{[^}]*padding-top:\s*var\(--s-7\);/s);
});

test('featured covers keep their natural ratio and the selected-work rhythm stays compact', () => {
  const source = readFileSync(workEntryPath, 'utf8');
  const chapterSource = readFileSync(workChapterPath, 'utf8');

  assert.doesNotMatch(source, /\.work-entry--featured\.work-entry--(?:portrait|landscape) \.work-entry__media\s*\{[^}]*aspect-ratio:/s);
  assert.match(source, /\.work-entry--featured\.work-entry--portrait \.work-entry__media\s*\{[^}]*max-width:\s*390px;/s);
  assert.match(source, /\.work-entry--featured\.is-lead \.work-entry__media\s*\{[^}]*max-width:\s*420px;/s);
  assert.match(source, /\.work-entry--featured\.work-entry--landscape \.work-entry__media\s*\{[^}]*max-width:\s*560px;/s);
  assert.match(source, /\.work-entry--featured \.work-entry__media img\s*\{[^}]*height:\s*auto;/s);
  assert.doesNotMatch(source, /\.work-entry--featured \.work-entry__media img\s*\{[^}]*object-fit:/s);
  assert.match(source, /padding:\s*clamp\(24px, 3vw, 44px\) 0/);
  assert.match(chapterSource, /\.portfolio-work__featured\s*\{[^}]*gap:\s*var\(--s-4\)/s);
  assert.match(source, /\.work-entry--more \.work-entry__media,\s*\.work-entry--archive \.work-entry__media\s*\{\s*aspect-ratio:\s*4\s*\/\s*3;/s);
});

test('More Work cards use only a faint glass separation over the Gaussian', () => {
  const source = readFileSync(workEntryPath, 'utf8');

  assert.match(source, /\.work-entry--more\s*\{[^}]*background:\s*rgba\(11, 11, 12, 0\.14\)/s);
  assert.match(source, /backdrop-filter:\s*blur\(8px\) brightness\(0\.94\) saturate\(0\.9\)/);
  assert.match(source, /-webkit-backdrop-filter:\s*blur\(8px\) brightness\(0\.94\) saturate\(0\.9\)/);
  assert.doesNotMatch(source, /\.work-entry--more\s*\{[^}]*border:/s);
});

test('Work media prewarms before native lazy loading can leave visible cards blank', () => {
  const source = readFileSync(workEntryPath, 'utf8');

  assert.match(source, /data-prewarm-image/);
  assert.match(source, /new IntersectionObserver/);
  assert.match(source, /rootMargin:\s*['"]100% 0px['"]/);
  assert.match(source, /image\.loading\s*=\s*['"]eager['"]/);
});

test('Work and relocated Archive stack above Code content without masking Gaussian overscan', () => {
  const source = readFileSync(workChapterPath, 'utf8');
  const archiveSource = readFileSync(workArchivePath, 'utf8');

  assert.match(source, /\.portfolio-work\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*[1-9]\d*;[^}]*isolation:\s*isolate;/s);
  assert.match(archiveSource, /\.portfolio-archive\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*[1-9]\d*;[^}]*isolation:\s*isolate;/s);
  assert.doesNotMatch(source, /\.portfolio-work::before/);
  assert.doesNotMatch(archiveSource, /\.portfolio-archive::before/);
});

test('homepage renders the complete Code structure once', () => {
  const homepage = readFileSync(join(distDir, 'index.html'), 'utf8');
  const code = chapterSlice(homepage, 'code', 'work');

  assert.deepEqual(codeSignature(code), {
    hero: 1,
    article: 1,
    gaussians: 2,
    heroPlacement: 1,
    lowerPlacement: 1,
    cameraMotion: 2,
    github: 1,
    tools: 6,
    lower: 1,
    fxhash: 1,
    splats: 1,
  });
  assert.equal((code.match(/<a\b[^>]*class="tool-card__media"/g) ?? []).length, 0);
  assert.equal((code.match(/<div\b[^>]*class="tool-card__media"[^>]*aria-hidden="true"/g) ?? []).length, 6);
});

test('opening leads to the general panel and musical tools keep project-to-source discovery', () => {
  for (const prefix of ['', 'pt-br/']) {
    const html = readFileSync(join(distDir, prefix, 'index.html'), 'utf8');
    const about = chapterSlice(html, 'about', 'projects');
    const code = chapterSlice(html, 'code', 'work');
    const routePrefix = prefix ? '/pt-br' : '';
    const entry = [...about.matchAll(/<a\b[^>]*class="portfolio-about__projects-link mono"[^>]*>/g)];
    assert.equal(entry.length, 1, `${prefix || 'en'} has one initial project entry`);
    assert.equal(attr(entry[0][0], 'href'), `${routePrefix}/#projects`);

    const cards = [...code.matchAll(/<article\b[^>]*class="tool-card"[^>]*>[\s\S]*?<\/article>/g)]
      .map((match) => match[0]);
    assert.deepEqual(cards.slice(0, 2).map((card) => attr(card, 'data-tool')), ['rc-surface', 'rc-setlist']);
    for (const card of cards.slice(0, 2)) {
      const slug = attr(card, 'data-tool');
      assert.equal(attr(card, 'data-featured'), 'true');
      assert.match(card, /PolyForm Noncommercial 1\.0\.0/);
      const actions = card.match(/<div class="tool-card__actions"[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';
      const destinations = [...actions.matchAll(/<a\b[^>]*>/g)].map((match) => attr(match[0], 'href'));
      assert.deepEqual(destinations, [`${routePrefix}/work/${slug}`, `https://github.com/ntworm/${slug}`]);
    }
    assert.ok(code.indexOf('class="tools"') < code.indexOf('class="gh-card"'));
    assert.doesNotMatch(code, /class="gh-card__repo-desc"/);
    const contact = code.match(/<p class="code__contact"[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    assert.equal(attr(contact.match(/<a\b[^>]*>/)?.[0] ?? '', 'href'), `${routePrefix}/#contact`);
    assert.match(code, prefix ? /2022 · em pausa/ : /2022 · paused/);
  }
});

test('homepage owns Code while the legacy Code route redirects to its chapter', () => {
  const homepage = readFileSync(join(process.cwd(), 'src', 'pages', 'index.astro'), 'utf8');
  const legacy = readFileSync(join(process.cwd(), 'src', 'pages', 'code.astro'), 'utf8');

  assert.match(homepage, /import CodeChapter/);
  assert.match(homepage, /<CodeChapter\s*\/>/);
  assert.match(legacy, /import LegacyRedirect from '\.\.\/components\/LegacyRedirect\.astro';/);
  assert.match(legacy, /<LegacyRedirect destination="\/#code"\s*\/>/);
});

test('built case studies preserve accessible media fallbacks across optional case features', () => {
  const cases = builtCaseDocuments();
  const trailers = cases.filter(({ html }) => html.includes('class="case__trailer"'));
  const galleries = cases.filter(({ html }) => html.includes('class="case__gallery '));
  const interactive = cases.filter(({ html }) => /<figure\b[^>]*\bdata-interactive-host\b/.test(html));

  assert.equal(cases.length, 26);
  assert.ok(trailers.length > 0, 'expected at least one case with a trailer');
  assert.ok(trailers.length < cases.length, 'expected cases without trailers');
  assert.ok(galleries.length > 0, 'expected at least one case with a gallery');
  assert.ok(galleries.length < cases.length, 'expected cases without a gallery');
  assert.equal(interactive.length, 1);

  for (const { html, label } of trailers) {
    assert.match(html, /<figure\b[^>]*class="case__trailer"[^>]*>\s*<video\b[^>]*\bcontrols\b/s, `${label} trailer has controls`);
  }
  for (const { html, label } of galleries) {
    const galleryImages = [...html.matchAll(/<section class="case__gallery[^>]*>[\s\S]*?<\/section>/g)]
      .flatMap((section) => [...section[0].matchAll(/<img\b[^>]*>/g)].map((match) => match[0]));
    assert.ok(galleryImages.length > 0, `${label} has gallery images`);
    assert.ok(galleryImages.every((image) => (attr(image, 'alt') ?? '').trim().length > 0), `${label} gallery images have fallback labels`);
  }

  const [interactiveCase] = interactive;
  assert.match(interactiveCase.html, /<button\b[^>]*data-interactive-launch[^>]*>/);
  assert.match(interactiveCase.html, /role="status" aria-live="polite" data-interactive-status/);
  assert.doesNotMatch(interactiveCase.html, /class="case__interactive-frame"/);
});
