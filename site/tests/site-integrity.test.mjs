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

test('code page stacks two scroll-bound borderless Gaussians', () => {
  const code = readFileSync(join(distDir, 'code', 'index.html'), 'utf8');
  const heroStart = code.indexOf('<header class="code__hero"');
  const heroEnd = code.indexOf('</header>', heroStart);
  assert.ok(heroStart >= 0 && heroEnd > heroStart, 'code hero not found');

  const hero = code.slice(heroStart, heroEnd);
  assert.match(hero, /class="code__hero-copy"/);
  assert.match(hero, /data-placement="hero-right"/);
  assert.match(hero, /data-contained="1"/);
  assert.match(hero, /luzoebreno\.splat/);
  assert.doesNotMatch(hero, /carro\.splat/);

  const lowerStart = code.indexOf('<section class="code__lower-showcase"');
  const lowerEnd = code.indexOf('</article>', lowerStart);
  assert.ok(lowerStart >= 0 && lowerEnd > lowerStart, 'lower Gaussian showcase not found');
  const lower = code.slice(lowerStart, lowerEnd);
  assert.match(lower, /class="code__lower-copy"/);
  assert.match(lower, /data-placement="section-left"/);
  assert.match(lower, /data-contained="1"/);
  assert.match(lower, /carro\.splat/);
  assert.doesNotMatch(lower, /luzoebreno\.splat/);
  assert.doesNotMatch(code, /class="splat-stage/);
  assert.equal((code.match(/class="gs-bg"/g) ?? []).length, 2);

  const css = walk(join(distDir, '_astro'), '.css')
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  const js = walk(join(distDir, '_astro'), '.js')
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  assert.match(css, /mask-image:\s*radial-gradient/);
  assert.match(css, /\.code__hero-copy/);
  assert.match(css, /\.code__lower-showcase/);
  assert.match(css, /inset:\s*-52vh 0/);
  assert.match(css, /\.code__lower-copy[^,{]*\{[^}]*grid-column:2/);
  assert.match(css, /transform:translateX\(18%\)\s*translateY\(calc\(-18%\s*\+\s*var\(--gs-scroll-y,\s*0%\)\)\)\s*scale\(1\.32\)/);
  assert.match(css, /transform:translate\(-18%\)translateY\(-10%\)scale\(1\.32\)/);
  assert.match(css, /\.gs-bg__live-canvas/);
  assert.doesNotMatch(css, /\.gs-bg__live-canvas\[data-astro-cid-/);
  assert.match(css, /\.gs-bg__live-canvas\{[^}]*pointer-events:none/);
  assert.match(js, /gs-bg__live-canvas/);
});

test('code cards stay above softened Gaussian spill', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'pages', 'code.astro'), 'utf8');

  assert.match(source, /\.gh-card,\s*\.tools\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;/s);
  assert.match(source, /background:\s*rgba\(11, 11, 12, 0\.64\)/);
  assert.match(source, /backdrop-filter:\s*blur\(18px\) brightness\(0\.72\) saturate\(0\.75\)/);
  assert.match(source, /-webkit-backdrop-filter:\s*blur\(18px\) brightness\(0\.72\) saturate\(0\.75\)/);
  assert.match(source, /\.tool-card__media\s*\{[^}]*background:\s*rgba\(11, 11, 12, 0\.64\)/s);
});

test('code hero removes the top bar and reaches farther into GitHub', () => {
  const codeSource = readFileSync(join(process.cwd(), 'src', 'pages', 'code.astro'), 'utf8');
  const gaussianSource = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(codeSource, /:global\(main\)\s*\{\s*padding-top:\s*0;/);
  assert.match(codeSource, /:global\(\.nav\)[^{]*\{[^}]*background:\s*transparent !important;/s);
  assert.match(codeSource, /\.code__hero\s*\{[^}]*background:\s*transparent;/s);
  assert.match(gaussianSource, /data-placement="hero-right"\]\[data-contained="1"\][^{]*\{[^}]*bottom:\s*-88vh;/s);
});

test('hero Gaussian stays raised without moving the lower scene', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(source, /translateX\(18%\) translateY\(calc\(-18% \+ var\(--gs-scroll-y, 0%\)\)\) scale\(1\.32\)/);
  assert.match(source, /translateX\(-18%\) translateY\(-10%\) scale\(1\.32\)/);
});

test('first Gaussian opts into camera motion around the fixed origin', () => {
  const code = readFileSync(join(distDir, 'code', 'index.html'), 'utf8');
  const gaussianSource = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');
  const heroStart = code.indexOf('<header class="code__hero"');
  const heroEnd = code.indexOf('</header>', heroStart);
  const lowerStart = code.indexOf('<section class="code__lower-showcase"');
  const lowerEnd = code.indexOf('</article>', lowerStart);
  const hero = code.slice(heroStart, heroEnd);
  const lower = code.slice(lowerStart, lowerEnd);

  assert.match(hero, /data-camera-motion="1"/);
  assert.doesNotMatch(lower, /data-camera-motion="1"/);
  assert.match(gaussianSource, /sampleGaussianCamera/);
  assert.match(gaussianSource, /gaussianFocusProximity/);
  assert.match(gaussianSource, /focusProximity/);
  assert.match(gaussianSource, /sampled\.verticalOffset/);
  assert.match(gaussianSource, /--gs-scroll-y/);
  assert.doesNotMatch(gaussianSource, /pointerX|pointerY/);
  assert.match(gaussianSource, /new SPLAT\.Vector3\(0, 0, 0\)/);
});

test('primary navigation labels have no individual surface behind them', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'Nav.astro'), 'utf8');

  assert.doesNotMatch(source, /\.nav__link::before/);
  assert.doesNotMatch(source, /\.nav__link\s*\{[^}]*background:/s);
  assert.doesNotMatch(source, /\.nav__link\s*\{[^}]*backdrop-filter:/s);
  assert.doesNotMatch(source, /\.nav__link\s*\{[^}]*box-shadow:/s);
  assert.doesNotMatch(source, /\.nav__link\s*\{[^}]*padding:/s);
  assert.doesNotMatch(source, /\.nav\[data-scrolled="true"\]/);
  assert.doesNotMatch(source, /syncNavScrollState/);
});

test('scroll progress resets safely after Astro page navigation', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'scripts', 'scroll-progress.ts'), 'utf8');

  assert.match(source, /Math\.min\(100,\s*Math\.max\(0,/);
  assert.match(source, /document\.addEventListener\('astro:page-load'/);
});

test('work hero keeps its intended desktop lines and portrait alignment', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'pages', 'index.astro'), 'utf8');

  assert.match(source, /\.hero\s*\{[^}]*align-items:\s*center;/s);
  assert.match(source, /\.hero__title \.reveal-seg\s*\{[^}]*white-space:\s*nowrap;/s);
  assert.doesNotMatch(source, /\.hero__title\s*\{[^}]*max-width:\s*10\.5ch;/s);
  assert.match(source, /@media \(max-width: 720px\)[\s\S]*\.hero__title \.reveal-seg\s*\{[^}]*white-space:\s*normal;/s);
});

test('Kakofoni case lazy-loads the live fxhash work and foregrounds the museum acquisition', () => {
  const schema = readFileSync(join(process.cwd(), 'src', 'content.config.ts'), 'utf8');
  const template = readFileSync(join(process.cwd(), 'src', 'pages', 'work', '[slug].astro'), 'utf8');
  const project = readFileSync(join(process.cwd(), 'src', 'content', 'projects', 'kakofoni-orquestra.md'), 'utf8');

  assert.match(schema, /interactiveEmbed:\s*z\.object/);
  assert.match(template, /data-interactive-launch/);
  assert.match(template, /document\.addEventListener\('astro:page-load'/);
  assert.match(project, /gateway\.fxhash2\.xyz\/ipfs\/Qmau3NDFiN3UtNscCsv7J7aNV9BEsP8pT7m3YHamap387y/);
  assert.match(project, /Madison Museum of Art and Technology/);
  assert.match(project, /16 loops/);
  assert.match(project, /89 BPM/);
  assert.match(project, /Web Audio API/);
  assert.match(project, /FFT/);
});

test('interactive Kakofoni case uses a two-column artwork and metadata layout without gallery spill', () => {
  const schema = readFileSync(join(process.cwd(), 'src', 'content.config.ts'), 'utf8');
  const template = readFileSync(join(process.cwd(), 'src', 'pages', 'work', '[slug].astro'), 'utf8');
  const project = readFileSync(join(process.cwd(), 'src', 'content', 'projects', 'kakofoni-orquestra.md'), 'utf8');

  assert.match(schema, /hideGallery:\s*z\.boolean\(\)\.optional\(\)/);
  assert.match(project, /hideGallery:\s*true/);
  assert.match(template, /entry\.id\s*===\s*'kakofoni-orquestra'\s*\|\|\s*data\.hideGallery\s*===\s*true/);
  assert.match(template, /case__primary--split/);
  assert.match(template, /\.case__primary--split\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(280px,\s*0\.8fr\)/s);
  assert.match(template, /!hideGallery\s*&&\s*galleryTop\.length/);
  assert.match(template, /!hideGallery\s*&&\s*galleryBottom\.length/);
});

test('interactive artwork receives global iframe sizing and a capped balanced layout', () => {
  const template = readFileSync(join(process.cwd(), 'src', 'pages', 'work', '[slug].astro'), 'utf8');

  assert.match(template, /\.case__primary--split\s*\{[^}]*max-width:\s*820px;/s);
  assert.match(template, /\.case__primary--split \.case__meta\s*\{[^}]*align-self:\s*stretch;/s);
  assert.match(template, /:global\(\.case__interactive-frame\)\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
  assert.match(template, /:global\(\.case__interactive-frame\.is-ready\)/);
});

test('each primary page has its own hero copy and reveal language', () => {
  const work = readFileSync(join(process.cwd(), 'src', 'pages', 'index.astro'), 'utf8');
  const about = readFileSync(join(process.cwd(), 'src', 'pages', 'about.astro'), 'utf8');
  const code = readFileSync(join(process.cwd(), 'src', 'pages', 'code.astro'), 'utf8');

  assert.match(work, /<h1[^>]*data-reveal="cut"/);
  assert.match(work, /Sound direction,/);
  assert.match(work, /music production,/);
  assert.match(work, /creative tooling\./);
  assert.match(work, /Gabriel Worm · Palmas, Tocantins, Brazil/);

  assert.match(about, /<h1[^>]*data-reveal="focus"/);
  assert.match(about, /A practice shaped by/);
  assert.match(about, /listening/);
  assert.match(about, /systems, and collaboration\./);

  assert.match(code, /<h1[^>]*data-reveal="typewriter"/);
  assert.match(code, /Tools/);
  assert.match(code, /audiovisual/);
  assert.match(code, /performance\./);
});

test('title reveals are owned by the shared Astro navigation lifecycle', () => {
  const script = readFileSync(join(process.cwd(), 'src', 'scripts', 'title-reveal.ts'), 'utf8');
  const layout = readFileSync(join(process.cwd(), 'src', 'layouts', 'Layout.astro'), 'utf8');

  assert.match(script, /document\.addEventListener\('astro:page-load', init\)/);
  assert.match(script, /el\.dataset\.revealInitialized/);
  assert.match(script, /function cutReveal\(/);
  assert.match(script, /function focusReveal\(/);
  assert.match(layout, /import '\.\.\/scripts\/title-reveal\.ts'/);
});

test('scroll fades attach to content after Astro client navigation', () => {
  const script = readFileSync(join(process.cwd(), 'src', 'scripts', 'scroll-fade.ts'), 'utf8');

  assert.match(script, /function initScrollFades\(\)/);
  assert.match(script, /document\.addEventListener\('astro:page-load', initScrollFades\)/);
  assert.match(script, /const observed = new WeakSet<Element>\(\)/);
  assert.match(script, /reducedMotion[^}]*classList\.add\('is-visible'\)/s);
});
