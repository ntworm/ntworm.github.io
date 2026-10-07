import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const source = (...parts) => readFileSync(join(root, 'src', ...parts), 'utf8');

test('primary navigation targets the continuous homepage chapters', () => {
  const nav = source('components', 'Nav.astro');
  const footer = source('components', 'Footer.astro');

  for (const chapter of ['about', 'projects', 'code', 'work', 'contact']) {
    assert.match(nav, new RegExp(`href: '/#${chapter}'`));
    assert.match(footer, new RegExp(`href: '/#${chapter}'`));
  }

  const navOrder = [...nav.matchAll(/href: '\/#([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(navOrder, ['about', 'projects', 'code', 'work', 'contact']);
  const footerOrder = [...footer.matchAll(/href: '\/#([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(footerOrder, navOrder);

  // Both lists run their chapter links through the locale mapper, so the
  // Portuguese pages keep readers under /pt-br/.
  assert.match(nav, /href=\{localizePath\(link\.href, locale\)\}/);
  assert.match(footer, /href=\{localizePath\(chapter\.href, locale\)\}/);

  assert.doesNotMatch(nav, /href:\s*['"]\/(?:about|code|contact)['"]/);
  assert.doesNotMatch(footer, /href(?:=|:\s*)['"]\/(?:about|code|contact)['"]/);
});

test('legacy top-level pages redirect into the continuous homepage', () => {
  const redirects = new Map([
    [['pages', 'about.astro'], '/#about'],
    [['pages', 'work', 'index.astro'], '/#work'],
    [['pages', 'code.astro'], '/#code'],
    [['pages', 'contact.astro'], '/#contact'],
  ]);

  for (const [parts, target] of redirects) {
    const page = source(...parts);
    assert.match(page, /LegacyRedirect/);
    assert.match(page, new RegExp(`destination=['"]${target.replace('/', '\\/')}['"]`));
  }

  assert.match(source('pages', 'continuous.astro'), /Astro\.redirect\(['"]\/['"]\)/);
});

test('project case studies remain real pages', () => {
  assert.ok(statSync(join(root, 'src', 'pages', 'work', '[slug].astro')).isFile());
  assert.doesNotMatch(source('pages', 'work', '[slug].astro'), /Astro\.redirect/);
});
