import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import test from 'node:test';

import {
  FEATURED_WORK_IDS,
  MORE_WORK_IDS,
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

test('homepage renders five finite chapters once and in order', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const chapters = [...html.matchAll(/data-portfolio-chapter="(about|work|code|archive|contact)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(chapters, ['about', 'work', 'code', 'archive', 'contact']);
  for (const id of chapters) assert.match(html, new RegExp(`id="${id}"`));
});

test('public homepage serves the continuous portfolio as the primary experience', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const chapters = [...html.matchAll(/data-portfolio-chapter="(about|work|code|archive|contact)"/g)]
    .map((match) => match[1]);

  assert.deepEqual(chapters, ['about', 'work', 'code', 'archive', 'contact']);
  assert.match(html, /<title>Sound, Music &amp; Creative Systems &mdash; Gabriel Worm/);
});

test('homepage renders the approved Work tiers', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const ids = (tier) => workTags(html, tier).map((tag) => attr(tag, 'data-work-id'));

  assert.deepEqual(ids('featured'), FEATURED_WORK_IDS);
  assert.deepEqual(ids('more'), MORE_WORK_IDS);
  assert.deepEqual(
    ids('archive'),
    buildWorkPresentation(loadProjects()).archive.map((project) => project.id),
  );
});

test('homepage Work contains one link per tier entry and no empty href', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');

  assert.equal(workTags(html, 'featured').length, 13);
  assert.equal(workTags(html, 'more').length, 5);
  assert.equal(workTags(html, 'archive').length, 25);
  assert.ok(
    [...workTags(html, 'featured'), ...workTags(html, 'more'), ...workTags(html, 'archive')]
      .every((tag) => /^\/work\/[a-z0-9-]+$/.test(attr(tag, 'href') ?? '')),
  );
});

test('About portraits remain four static editorial images', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const about = chapterSlice(html, 'about', 'work');
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
  const about = chapterSlice(html, 'about', 'work');

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

test('Lines and Cells stays anchored to About and scrolls out before Work', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const about = chapterSlice(html, 'about', 'work');
  const work = chapterSlice(html, 'work', 'code');
  const source = existsSync(hydraBackgroundPath) ? readFileSync(hydraBackgroundPath, 'utf8') : '';
  const aboutSource = readFileSync(aboutChapterPath, 'utf8');
  const homepage = readFileSync(homepagePath, 'utf8');
  const layout = readFileSync(layoutPath, 'utf8');

  assert.match(about, /class="portfolio-about__live-bg"/);
  assert.ok(about.indexOf('class="portfolio-about__live-bg"') < about.indexOf('class="portfolio-about__hero"'));
  assert.match(html, /class="portfolio-about__live-stage"/);
  assert.match(html, /title="Lines and Cells live generative background"/);
  assert.match(html, /width="640"/);
  assert.match(html, /height="360"/);
  assert.match(html, /src="about:blank"/);
  assert.match(html, /data-hydra-src="\/hydra\/lines-and-cells\.html\?fxhash=opTgZfTemeT4UtGTA95AUh97CWnCstz2XW359tw1Hv7588x551j"/);
  assert.doesNotMatch(html, /dweb\.link\/ipfs\/Qmb4ktMbn1Sef6i5sMYy17MTzGmjRT8TuWsgLAhsQMRbrU/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /sandbox="allow-scripts allow-same-origin"/);
  assert.doesNotMatch(source, /portfolio-about__live-bg-fallback|lines-and-cells\.webp/);
  assert.doesNotMatch(work, /portfolio-(?:about|work)__live-bg|Lines and Cells live generative background/);
  assert.doesNotMatch(homepage, /HydraBackground/);
  assert.doesNotMatch(layout, /<slot name="backdrop"/);
  assert.match(aboutSource, /import HydraBackground from '\.\.\/HydraBackground\.astro';/);
  assert.match(aboutSource, /<HydraBackground\s*\/>/);
  assert.match(source, /\.portfolio-about__live-bg\s*\{[^}]*position:\s*absolute;[^}]*top:\s*-?[\d.]+vh;[^}]*bottom:\s*0;[^}]*left:\s*50%;[^}]*width:\s*100vw;[^}]*transform:\s*translateX\(-50%\);[^}]*z-index:\s*0;[^}]*pointer-events:\s*none;[^}]*overflow:\s*hidden;/s);
  assert.doesNotMatch(source, /position:\s*fixed/);
  assert.doesNotMatch(source, /getBoundingClientRect\(\)/);
  assert.match(source, /\.portfolio-about__live-stage\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*overflow:\s*hidden;/s);
  assert.match(source, /linear-gradient\(180deg,\s*#000 0%,\s*#000 86%,\s*rgba\(0, 0, 0, 0\.72\) 90%,\s*transparent 100%\)/s);
  assert.match(source, /\.portfolio-about__live-bg iframe\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
  assert.doesNotMatch(source, /--hydra-scale-[xy]|ResizeObserver|scale\(var\(--hydra-scale/);
  assert.match(source, /prefers-reduced-motion:\s*reduce/);
  assert.match(source, /connection\?\.saveData/);
  assert.match(source, /frame\s*=\s*requestAnimationFrame\(\(\)\s*=>\s*\{\s*frame\s*=\s*requestAnimationFrame\(loadHydra\);\s*\}\)/s);
  assert.match(aboutSource, /\.portfolio-about__hero\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
  assert.match(aboutSource, /\.portfolio-about__thread\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
});

test('Work intro pairs the editorial statement with the original project spotlight and practice tags', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const work = chapterSlice(html, 'work', 'code');
  const source = readFileSync(workChapterPath, 'utf8');

  assert.match(work, /class="portfolio-work__hero"/);
  assert.equal((work.match(/class="work-spotlight-cell"/g) ?? []).length, 7);
  assert.match(work, /aria-label="Practice areas"/);
  assert.match(work, /Film Audio/);
  assert.match(work, /Music Production/);
  assert.match(work, /Creative Coding/);
  assert.match(work, /Live \/ Experimental/);
  assert.match(source, /animation:\s*work-spotlight-cycle/);
  assert.match(source, /animation-delay:\s*calc\(var\(--i\) \* -6s\)/);
  assert.match(source, /\.portfolio-work__spotlight:hover \.work-spotlight-cell/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(work, /class="portfolio-work__runway"/);
  assert.match(work, /class="portfolio-work__runway-count mono"[^>]*>01—13<\/span>/);
  assert.match(work, /class="portfolio-work__runway-rule"/);
  assert.match(work, /<h2 id="selected-work-title"[^>]*>Defining Projects\.<\/h2>/);
  assert.match(work, /data-work-title-reveal/);
  assert.match(readFileSync(workChapterPath, 'utf8'), /IntersectionObserver/);
  assert.match(readFileSync(workChapterPath, 'utf8'), /animation:\s*work-line-in\s+760ms/);
});

test('featured entries alone render summaries and explicit orientation classes', () => {
  const html = readFileSync(join(distDir, 'index.html'), 'utf8');
  const work = chapterSlice(html, 'work', 'code');
  const archiveChapter = chapterSlice(html, 'archive', 'contact');
  const featured = workEntries(work, 'featured');
  const more = workEntries(work, 'more');
  const archive = workEntries(archiveChapter, 'archive');
  const featuredTags = workTags(work, 'featured');
  const layoutById = Object.fromEntries(featuredTags.map((tag) => [
    attr(tag, 'data-work-id'),
    attr(tag, 'data-media-layout'),
  ]));

  assert.equal(featured.length, 13);
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
    'kakofoni-orquestra': 'portrait',
    'em-agosto-chove': 'landscape',
    'ai-am': 'portrait',
    'unconscious-vision': 'portrait',
    'arvore-seca': 'portrait',
    lucy: 'portrait',
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
  const work = chapterSlice(html, 'work', 'code');
  const featured = workEntries(work, 'featured');
  const source = readFileSync(workEntryPath, 'utf8');

  assert.equal(featured.length, 13);
  assert.ok(featured.every((entry) => (entry.match(/class="work-entry__backdrop"/g) ?? []).length === 1));
  assert.match(source, /\.work-entry--featured\s*\{[^}]*overflow:\s*visible;/s);
  assert.match(source, /\.work-entry--featured \.work-entry__backdrop\s*\{[^}]*position:\s*absolute;[^}]*top:\s*0;[^}]*bottom:\s*0;[^}]*left:\s*50%;[^}]*width:\s*100vw;[^}]*transform:\s*translateX\(-50%\);[^}]*opacity:\s*0\.3;[^}]*mask-image:[^}]*linear-gradient\(90deg, transparent 0%, #000 4%, #000 96%, transparent 100%\)/s);
  assert.match(source, /\.work-entry__backdrop img\s*\{[^}]*filter:\s*blur\(26px\)[^}]*transform:\s*scale\(1\.08\);/s);
  assert.match(source, /\.work-entry--featured:hover \.work-entry__backdrop,[^}]*\{[^}]*opacity:\s*0\.9;/s);
  assert.match(source, /\.work-entry--featured:hover \.work-entry__backdrop img,[^}]*\{[^}]*transform:\s*scale\(1\.18\);/s);
  assert.match(source, /\.work-entry--featured:hover \.work-entry__media img,[^}]*\{[^}]*transform:\s*scale\(1\.1\);/s);
});

test('About transitions stay compact from the navigation through Work', () => {
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
  assert.match(source, /rootMargin:\s*['"]200% 0px['"]/);
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
  const code = chapterSlice(homepage, 'code', 'archive');

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
});

test('homepage owns Code while the legacy Code route redirects to its chapter', () => {
  const homepage = readFileSync(join(process.cwd(), 'src', 'pages', 'index.astro'), 'utf8');
  const legacy = readFileSync(join(process.cwd(), 'src', 'pages', 'code.astro'), 'utf8');

  assert.match(homepage, /import CodeChapter/);
  assert.match(homepage, /<CodeChapter\s*\/>/);
  assert.match(legacy, /Astro\.redirect\(['"]\/#code['"]\)/);
});
