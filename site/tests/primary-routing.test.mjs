import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const source = (...parts) => readFileSync(join(root, 'src', ...parts), 'utf8');

test('primary navigation targets the continuous homepage chapters', () => {
  const nav = source('components', 'Nav.astro');
  const footer = source('components', 'Footer.astro');

  for (const chapter of ['about', 'work', 'code', 'contact']) {
    assert.match(nav, new RegExp(`href: '/#${chapter}'`));
    assert.match(footer, new RegExp(`href="/#${chapter}"`));
  }

  const navOrder = [...nav.matchAll(/href: '\/#([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(navOrder, ['about', 'work', 'code', 'contact']);

  assert.doesNotMatch(nav, /href:\s*['"]\/(?:about|code|contact)['"]/);
  assert.doesNotMatch(footer, /href="\/(?:about|code|contact)"/);
});

test('legacy top-level pages redirect into the continuous homepage', () => {
  const redirects = new Map([
    [['pages', 'about.astro'], '/#about'],
    [['pages', 'work', 'index.astro'], '/#work'],
    [['pages', 'code.astro'], '/#code'],
    [['pages', 'contact.astro'], '/#contact'],
    [['pages', 'continuous.astro'], '/'],
  ]);

  for (const [parts, target] of redirects) {
    const page = source(...parts);
    assert.match(page, new RegExp(`Astro\\.redirect\\(['"]${target.replace('/', '\\/')}['"]`));
  }
});

test('project case studies remain real pages', () => {
  assert.ok(statSync(join(root, 'src', 'pages', 'work', '[slug].astro')).isFile());
  assert.doesNotMatch(source('pages', 'work', '[slug].astro'), /Astro\.redirect/);
});
