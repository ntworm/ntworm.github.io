import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const siteRoot = path.resolve(import.meta.dirname, '..');
const rcSurfaceSources = [
  'src/components/portfolio/AboutChapter.astro',
  'src/components/portfolio/CodeChapter.astro',
  'src/content/projects/rc-surface.md',
];

test('every published RC Surface description uses the canonical license', () => {
  for (const relativePath of rcSurfaceSources) {
    const source = readFileSync(path.join(siteRoot, relativePath), 'utf8');
    assert.doesNotMatch(source, /\bMIT(?:-licensed)?\b/i, `${relativePath} still claims MIT`);
    assert.match(source, /PolyForm Noncommercial 1\.0\.0/, `${relativePath} omits the canonical license`);
  }
});

test('RC Surface case study identifies the project as source-available', () => {
  const source = readFileSync(path.join(siteRoot, 'src/content/projects/rc-surface.md'), 'utf8');

  assert.doesNotMatch(source, /open[ -]source/i);
  assert.match(source, /source-available/i);
});

test('Code overview distinguishes open-source from source-available work', () => {
  const source = readFileSync(path.join(siteRoot, 'src/components/portfolio/CodeChapter.astro'), 'utf8');

  assert.match(source, /Personal, open-source, and source-available projects/);
});
