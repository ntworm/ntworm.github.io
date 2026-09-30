import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { buildCanonical, excerptMarkdown } from '../src/utils/seo.mjs';

const root = process.cwd();
const source = (...parts) => readFileSync(join(root, 'src', ...parts), 'utf8');

test('buildCanonical retains only the origin and normalized pathname', () => {
  assert.equal(
    buildCanonical('https://ntworm.github.io', '/work/x?utm_source=campaign#details'),
    'https://ntworm.github.io/work/x',
  );
  assert.equal(buildCanonical('https://ntworm.github.io/', 'work/x?query=1'), 'https://ntworm.github.io/work/x');
  assert.equal(buildCanonical('https://ntworm.github.io', '/'), 'https://ntworm.github.io/');
});

test('excerptMarkdown uses the first non-heading paragraph and removes presentation markup', () => {
  const markdown = '# Heading\n\nFirst **useful** [paragraph](https://example.com) with <em>HTML</em>.\n\nSecond paragraph.';
  assert.equal(excerptMarkdown(markdown, 160), 'First useful paragraph with HTML.');
});

test('excerptMarkdown keeps inline text together, decodes common entities, and skips non-paragraph blocks', () => {
  const markdown = [
    '# Heading',
    '',
    '- First list item',
    '- Second list item',
    '',
    '~~~text',
    'const not = "a paragraph";',
    '~~~',
    '',
    "Luzo Cairo<em>'s</em> EP &amp; <code>live</code> work.",
  ].join('\n');

  assert.equal(excerptMarkdown(markdown, 160), "Luzo Cairo's EP & live work.");
});

test('excerptMarkdown collapses whitespace and truncates only at a word boundary', () => {
  assert.equal(excerptMarkdown('## Heading\n\nOne   two\nthree four five', 13), 'One two three');
  assert.equal(excerptMarkdown('## Heading\n\nSupercalifragilistic', 8), 'Supercalifragilistic');
  assert.equal(excerptMarkdown('# Heading only', 160), '');
});

test('discovery sources use content collection metadata and safe structured data', () => {
  const sitemap = source('pages', 'sitemap.xml.ts');
  const layout = source('layouts', 'Layout.astro');
  const index = source('pages', 'index.astro');
  const casePage = source('pages', 'work', '[slug].astro');

  assert.match(sitemap, /getCollection\('projects'\)/);
  assert.match(sitemap, /buildCanonical/);
  assert.match(layout, /structuredData/);
  assert.ok(layout.includes("replace(/</g"));
  assert.match(layout, /name="theme-color"/);
  assert.match(layout, /site\.webmanifest/);
  assert.match(index, /'@type': 'Person'/);
  assert.match(casePage, /'@type': 'CreativeWork'/);
  assert.match(casePage, /excerptMarkdown\(entry\.body/);
  assert.match(casePage, /creditText/);
  assert.match(casePage, /temporalCoverage/);
  assert.doesNotMatch(casePage, /^\s*role:/m);
  assert.doesNotMatch(casePage, /^\s*dateCreated:/m);
});

test('public discovery files advertise the configured production sitemap and manifest', () => {
  const robots = readFileSync(join(root, 'public', 'robots.txt'), 'utf8');
  const manifest = JSON.parse(readFileSync(join(root, 'public', 'site.webmanifest'), 'utf8'));

  assert.match(robots, /^User-agent: \*\r?\nAllow: \/\r?\nSitemap: https:\/\/ntworm\.github\.io\/sitemap\.xml\r?\n?$/);
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.icons[0].src, '/favicon.svg');
  assert.match(manifest.theme_color, /^#/);
  assert.match(manifest.background_color, /^#/);
});

test('legacy redirects provide an immediate, index-safe fallback', () => {
  const component = source('components', 'LegacyRedirect.astro');

  assert.match(component, /name="robots" content="noindex,follow"/);
  assert.match(component, /http-equiv="refresh"/);
  assert.match(component, /0; url=/);
  assert.match(component, /location\.replace/);
  assert.match(component, />Continue</);
  assert.match(component, /buildCanonical/);
});

test('sitemap build output contains exactly the indexable homepage and 26 case URLs in each language', () => {
  const sitemapPath = join(root, 'dist', 'sitemap.xml');
  assert.ok(existsSync(sitemapPath), 'sitemap.xml was emitted by the build');
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const portuguese = urls.filter((url) => url.startsWith('https://ntworm.github.io/pt-br/'));
  const english = urls.filter((url) => !portuguese.includes(url));

  for (const [label, localized, prefix] of [['en', english, ''], ['pt-br', portuguese, '/pt-br']]) {
    const caseUrls = localized.filter((url) => url.includes('/work/'));
    assert.equal(localized.includes(`https://ntworm.github.io${prefix}/work/`), false, label);
    assert.equal(localized.includes(`https://ntworm.github.io${prefix}/`), true, label);
    assert.equal(localized.length, 27, label);
    assert.equal(caseUrls.length, 26, label);
    assert.ok(caseUrls.every((url) => new RegExp(`^https://ntworm\\.github\\.io${prefix}/work/[^/]+/$`).test(url)), label);
  }
  assert.deepEqual(
    portuguese.map((url) => url.replace('/pt-br/', '/')),
    english,
    'every English URL has a Portuguese counterpart in the same order',
  );
});
