import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const distDir = join(process.cwd(), 'dist');

function walk(dir, extension) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path, extension);
    return path.endsWith(extension) ? [path] : [];
  });
}

function htmlFiles() {
  return walk(distDir, '.html').map((path) => ({
    path,
    label: relative(distDir, path),
    html: readFileSync(path, 'utf8'),
  }));
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => match[0]);
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

function localPathExists(url) {
  const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  const direct = join(distDir, pathname.replace(/^\/+/, ''));
  try {
    if (statSync(direct).isFile()) return true;
  } catch { /* try directory index */ }
  try {
    return statSync(join(direct, 'index.html')).isFile();
  } catch {
    return false;
  }
}

test('every anchor has a non-empty href', () => {
  const failures = [];
  for (const file of htmlFiles()) {
    for (const tag of tags(file.html, 'a')) {
      const href = attr(tag, 'href');
      if (href === null || href.trim() === '') failures.push(`${file.label}: ${tag}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('every root-relative link resolves to a built file or page', () => {
  const failures = [];
  for (const file of htmlFiles()) {
    for (const tag of tags(file.html, 'a')) {
      const href = attr(tag, 'href');
      if (href?.startsWith('/') && !localPathExists(href)) failures.push(`${file.label}: ${href}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('every root-relative image resolves to a built asset', () => {
  const failures = [];
  for (const file of htmlFiles()) {
    for (const tag of tags(file.html, 'img')) {
      const src = attr(tag, 'src');
      if (src?.startsWith('/') && !localPathExists(src)) failures.push(`${file.label}: ${src}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('homepage spotlight stays curated and lightweight', () => {
  const home = readFileSync(join(distDir, 'index.html'), 'utf8');
  const start = home.indexOf('<div class="about-mini__shuffler"');
  const end = home.indexOf('<section id="work"', start);
  assert.ok(start >= 0 && end > start, 'spotlight section not found');
  const section = home.slice(start, end);
  const sources = tags(section, 'img').map((tag) => attr(tag, 'src')).filter(Boolean);
  const uniqueSources = [...new Set(sources)];
  const totalBytes = uniqueSources.reduce((sum, src) => {
    const path = join(distDir, src.replace(/^\/+/, ''));
    return sum + statSync(path).size;
  }, 0);

  assert.ok(uniqueSources.length <= 8, `spotlight contains ${uniqueSources.length} images`);
  assert.ok(totalBytes <= 2 * 1024 * 1024, `spotlight transfers ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
});
