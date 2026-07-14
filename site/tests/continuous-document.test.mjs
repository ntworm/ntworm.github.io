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
const aboutChapterPath = join(process.cwd(), 'src', 'components', 'portfolio', 'AboutChapter.astro');
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

test('continuous preview renders five finite chapters once and in order', () => {
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
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

test('About portraits remain four static editorial images', () => {
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
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
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
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
});

test('Work intro pairs the editorial statement with the original project spotlight and practice tags', () => {
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
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
  assert.match(work, /class="portfolio-work__runway-count mono"[^>]*>01—08<\/span>/);
  assert.match(work, /class="portfolio-work__runway-rule"/);
  assert.match(work, /<h2 id="selected-work-title"[^>]*>Eight defining projects\.<\/h2>/);
  assert.match(work, /data-work-title-reveal/);
  assert.match(readFileSync(workChapterPath, 'utf8'), /IntersectionObserver/);
  assert.match(readFileSync(workChapterPath, 'utf8'), /animation:\s*work-line-in\s+760ms/);
});

test('featured entries alone render summaries and explicit orientation classes', () => {
  const html = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
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

  assert.equal(featured.length, 8);
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

test('About transitions stay compact from the navigation through Work', () => {
  const aboutSource = readFileSync(aboutChapterPath, 'utf8');
  const workSource = readFileSync(workChapterPath, 'utf8');

  assert.match(aboutSource, /\.portfolio-about\s*\{[^}]*padding-top:\s*var\(--s-7\);[^}]*padding-bottom:\s*0;/s);
  assert.match(aboutSource, /\.portfolio-about__hero\s*\{[^}]*min-height:\s*auto;[^}]*padding-bottom:\s*var\(--s-7\);/s);
  assert.match(aboutSource, /\.portfolio-about__thread\s*\{[^}]*padding:\s*var\(--s-7\) 0 var\(--s-7\);/s);
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

test('Work and relocated Archive stack above Code content without masking Gaussian overscan', () => {
  const source = readFileSync(workChapterPath, 'utf8');
  const archiveSource = readFileSync(workArchivePath, 'utf8');

  assert.match(source, /\.portfolio-work\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*[1-9]\d*;[^}]*isolation:\s*isolate;/s);
  assert.match(archiveSource, /\.portfolio-archive\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*[1-9]\d*;[^}]*isolation:\s*isolate;/s);
  assert.doesNotMatch(source, /\.portfolio-work::before/);
  assert.doesNotMatch(archiveSource, /\.portfolio-archive::before/);
});

test('continuous and standalone routes render the same Code structure', () => {
  const standalone = readFileSync(join(distDir, 'code', 'index.html'), 'utf8');
  const continuous = readFileSync(join(distDir, 'continuous', 'index.html'), 'utf8');
  const code = chapterSlice(continuous, 'code', 'archive');

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
