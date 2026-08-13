import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const distDir = join(process.cwd(), 'dist');
const codeChapterSourcePath = join(
  process.cwd(),
  'src',
  'components',
  'portfolio',
  'CodeChapter.astro',
);
const homepageSourcePath = join(process.cwd(), 'src', 'pages', 'index.astro');

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

function builtCodeDocuments() {
  return [
    ['index.html', readFileSync(join(distDir, 'index.html'), 'utf8')],
  ];
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

test('build dependencies are direct and Astro is on the audited release line', () => {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
  const packageLock = JSON.parse(readFileSync(join(process.cwd(), 'package-lock.json'), 'utf8'));
  const rootPackage = packageLock.packages?.[''];
  const isAtLeast = (actual, minimum) => {
    const parse = (version) => {
      const match = version?.match(/^(\d+)\.(\d+)\.(\d+)$/);
      return match?.slice(1).map(Number);
    };
    const actualParts = parse(actual);
    const minimumParts = parse(minimum);
    if (!actualParts || !minimumParts) return false;

    for (let index = 0; index < minimumParts.length; index += 1) {
      if (actualParts[index] !== minimumParts[index]) {
        return actualParts[index] > minimumParts[index];
      }
    }
    return true;
  };

  assert.equal(packageJson.dependencies?.astro, '^7.2.1');
  assert.equal(packageJson.devDependencies?.sharp, '^0.35.3');
  assert.equal(rootPackage?.dependencies?.astro, packageJson.dependencies.astro);
  assert.equal(rootPackage?.devDependencies?.sharp, packageJson.devDependencies.sharp);
  assert.ok(isAtLeast(packageLock.packages?.['node_modules/astro']?.version, '7.2.1'));
  assert.ok(isAtLeast(packageLock.packages?.['node_modules/sharp']?.version, '0.35.3'));
});

test('Hydra uses a disposable parent lifecycle and a decorative non-focusable iframe', () => {
  const component = readFileSync(join(process.cwd(), 'src', 'components', 'HydraBackground.astro'), 'utf8');
  const controller = readFileSync(join(process.cwd(), 'src', 'scripts', 'hydra-frame-controller.mjs'), 'utf8');

  assert.doesNotMatch(component.match(/^---([\s\S]*?)---/)?.[1] ?? '', /createHydraFrameController/);
  assert.match(component, /<script>\s*import \{ createHydraFrameController \} from '\.\.\/scripts\/hydra-frame-controller\.mjs';/s);
  assert.match(component, /tabindex="-1"/);
  assert.match(component, /createHydraFrameController\(\{\s*host: background,\s*iframe,\s*source: iframe\.dataset\.hydraSrc,\s*\}\)/s);
  assert.match(component, /document\.addEventListener\('astro:before-swap'/);
  assert.doesNotMatch(component, /requestAnimationFrame/);
  assert.match(controller, /insideRange\s*&&\s*!documentRef\.hidden\s*&&\s*!motionQuery\?\.matches\s*&&\s*connection\?\.saveData !== true/s);
  assert.match(controller, /iframe\.addEventListener\('load', onIframeLoad\)/);
  assert.match(controller, /observer\?\.disconnect\(\)/);
  assert.match(controller, /send\(false\);/);
});

test('Hydra parent controller is bundled into a browser module instead of called as a free symbol', () => {
  const index = readFileSync(join(distDir, 'index.html'), 'utf8');
  const externalModuleSources = [...index.matchAll(/<script type="module" src="([^\"]+\.js)"><\/script>/g)]
    .map(([, src]) => readFileSync(join(distDir, src.replace(/^\//, '')), 'utf8'));
  const inlineModuleSources = [...index.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)]
    .map(([, source]) => source);
  const moduleSources = [...externalModuleSources, ...inlineModuleSources];

  assert.equal(/<script type="module">[^<]*createHydraFrameController/s.test(index), false);
  assert.ok(moduleSources.some((source) => source.includes('Hydra host and iframe are required')));
});

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

test('featured-work copy contains only the confirmed credits', () => {
  const projectsDir = join(process.cwd(), 'src', 'content', 'projects');
  const trisal = readFileSync(join(projectsDir, 'trisal.md'), 'utf8');
  const ticha = readFileSync(join(projectsDir, 'ticha-penicheiro.md'), 'utf8');
  const clube = readFileSync(join(projectsDir, 'o-clube.md'), 'utf8');
  const feminine = readFileSync(join(projectsDir, 'this-feminine-side.md'), 'utf8');
  const compositor = readFileSync(join(projectsDir, 'o-compositor.md'), 'utf8');
  const aiAm = readFileSync(join(projectsDir, 'ai-am.md'), 'utf8');
  const agosto = readFileSync(join(projectsDir, 'em-agosto-chove.md'), 'utf8');
  const tono = readFileSync(join(projectsDir, 'el-tono-del-mar.md'), 'utf8');
  const combined = [trisal, ticha, clube, feminine, compositor, aiAm, agosto, tono].join('\n');

  assert.doesNotMatch(combined, /In post for episode 3/i);
  assert.doesNotMatch(ticha, /dialogue cleanup|archival mix|shaping the score/i);
  assert.doesNotMatch(clube, /dialogue cleanup|dialogue editorial|ADR matching|final premix|7\.1|Ambeo/i);
  assert.doesNotMatch(trisal, /documentary \/ fictional hybrid|closer to an anthology/i);
  assert.doesNotMatch(compositor, /composer (?:who )?can(?:not|'t) hear|unable to hear his own work/i);
  assert.doesNotMatch(aiAm, /no synth pads|reverb tails longer than a breath|orchestral doubling/i);
  assert.doesNotMatch(aiAm, /Universidade Lusófona/i);
  assert.match(aiAm, /production:\s*"Independent project"/i);
  assert.doesNotMatch(agosto, /four standalone singles|one music video/i);
  assert.doesNotMatch(tono, /granular synthesis|dialogue-free|library construction/i);

  assert.match(agosto, /three singles, one album, and a live recording made for/i);
  assert.match(ticha, /Foley, ambiences, and sound-effects editing/);
  assert.match(clube, /recording surround ambiences across Lisbon, editing ambiences, and creating sound effects/i);
  assert.doesNotMatch(clube, /Foley/i);
  assert.match(trisal, /“Isso de novo não tem nada!”/);
  assert.match(trisal, /premiered at CineSesc Araguaína on 10 June 2026/);
  assert.match(ticha, /Tribeca Festival Lisboa 2025/);
  assert.match(tono, /sound assistance, sound editing, and sound design/i);
  assert.doesNotMatch(tono, /Foley/i);
  assert.match(tono, /Best Mexican Student Short Film at Pixelatl 2024/i);
  assert.match(clube, /2025 seasons available on OPTO \/ SIC/i);
  assert.match(feminine, /animated documentary/i);
  assert.match(feminine, /ITFS 2026 Student Competition/i);
  assert.match(compositor, /FESTin 2025/i);
  assert.match(compositor, /won[\s\S]*?Best Portuguese Horror Short at MOTELX 2025/i);
  assert.match(aiAm, /Alpha-30 and Mew/i);
  assert.match(aiAm, /directed by Danny J/i);
});

test('public identity, chapter links, and media documentation match verified site copy', () => {
  const rootReadme = readFileSync(join(process.cwd(), '..', 'README.md'), 'utf8');
  const mediaReadme = readFileSync(join(process.cwd(), 'public', 'work', 'README.md'), 'utf8');
  const code = readFileSync(codeChapterSourcePath, 'utf8');
  const work = readFileSync(join(process.cwd(), 'src', 'components', 'portfolio', 'WorkChapter.astro'), 'utf8');
  const ableton = readFileSync(join(process.cwd(), 'src', 'content', 'projects', 'ableton-mcp-server.md'), 'utf8');
  const arvoreSeca = readFileSync(join(process.cwd(), 'src', 'content', 'projects', 'arvore-seca.md'), 'utf8');
  const publishedCopy = [rootReadme, mediaReadme, code, work, ableton, arvoreSeca].join('\n');

  assert.match(
    code,
    /Sound director working between cinema, music, and code\. Building creative tools for performance and Ableton Live\./,
  );
  assert.doesNotMatch(
    code,
    /Building tools for Ableton Live, real-time systems, and audiovisual work\./,
  );
  assert.equal((code.match(/75 tools in v0\.5\.3/g) ?? []).length, 2);
  assert.equal((code.match(/grouped batch commands/g) ?? []).length, 2);
  assert.doesNotMatch(code, /atomic batch|with rollback/i);
  assert.match(
    work,
    /Selected work across cinema, television, music, generative art, performance, and tools\./,
  );
  assert.doesNotMatch(publishedCopy, /65 tools|Generalist programmer|Spotify URL has not yet been discovered/i);
  assert.doesNotMatch(
    publishedCopy,
    /Spotify[\s\S]{0,160}(?:isn't currently discoverable|direct link here)/i,
  );

  assert.match(rootReadme, /^# ntworm\.github\.io$/m);
  assert.doesNotMatch(rootReadme, /gabrielworm\.github\.io/i);
  assert.match(
    rootReadme,
    /\[About\]\(https:\/\/ntworm\.github\.io\/#about\)[\s\S]*\[Work\]\(https:\/\/ntworm\.github\.io\/#work\)[\s\S]*\[Code\]\(https:\/\/ntworm\.github\.io\/#code\)[\s\S]*\[Archive\]\(https:\/\/ntworm\.github\.io\/#archive\)[\s\S]*\[Contact\]\(https:\/\/ntworm\.github\.io\/#contact\)/,
  );

  assert.match(mediaReadme, /site\/src\/utils\/project-images\.ts/);
  assert.match(mediaReadme, /site\/src\/pages\/work\/\[slug\]\.astro/);
  assert.match(mediaReadme, /first image[\s\S]*cover/i);
  assert.match(mediaReadme, /first video[\s\S]*trailer/i);
  assert.match(mediaReadme, /first two gallery items[\s\S]*before the project prose/i);
  assert.match(mediaReadme, /remaining gallery items[\s\S]*after the project prose/i);
  assert.match(mediaReadme, /non-media files[\s\S]*links\.txt[\s\S]*ignored/i);
  assert.match(mediaReadme, /\| o-compositor \| 1\.jpg \| trailer\.mp4 \| 2\.jpg[^\n]*7\.jpg \|/);
  assert.match(mediaReadme, /\| el-tono-del-mar \| 2\.jpg \| trailer1\.mp4 \| 3\.jpg[^\n]*trailer2\.mp4[^\n]*trailermain\.mp4 \|/);
  assert.match(mediaReadme, /\| rc-setlist \| 1\.jpg \| — \| 2\.jpg[^\n]*5\.jpg \|/);
});

test('code page stacks two scroll-bound borderless Gaussians', () => {
  for (const [label, code] of builtCodeDocuments()) {
    const heroStart = code.indexOf('<header class="code__hero"');
    const heroEnd = code.indexOf('</header>', heroStart);
    assert.ok(heroStart >= 0 && heroEnd > heroStart, `${label}: code hero not found`);

    const hero = code.slice(heroStart, heroEnd);
    assert.match(hero, /class="code__hero-copy"/);
    assert.match(hero, /data-placement="hero-right"/);
    assert.match(hero, /data-contained="1"/);
    assert.match(hero, /luzoebreno\.splat/);
    assert.doesNotMatch(hero, /carro\.splat/);

    const lowerStart = code.indexOf('<section class="code__lower-showcase"');
    const lowerEnd = code.indexOf('</article>', lowerStart);
    assert.ok(lowerStart >= 0 && lowerEnd > lowerStart, `${label}: lower Gaussian showcase not found`);
    const lower = code.slice(lowerStart, lowerEnd);
    assert.match(lower, /class="code__lower-copy"/);
    assert.match(lower, /data-placement="section-left"/);
    assert.match(lower, /data-contained="1"/);
    assert.match(lower, /carro\.splat/);
    assert.doesNotMatch(lower, /luzoebreno\.splat/);
    assert.doesNotMatch(code, /class="splat-stage/);
    assert.equal((code.match(/class="gs-bg"/g) ?? []).length, 2);
  }

  const css = walk(join(distDir, '_astro'), '.css')
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  const js = walk(join(distDir, '_astro'), '.js')
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
  assert.match(css, /mask-image:\s*radial-gradient/);
  assert.match(css, /\.code__hero-copy/);
  assert.match(css, /\.code__lower-showcase/);
  assert.match(css, /inset:\s*-52vh auto -52vh 50%/);
  assert.match(css, /\.code__lower-copy[^,{]*\{[^}]*grid-column:2/);
  assert.match(css, /width:132%!important/);
  assert.match(css, /height:132%!important/);
  assert.match(css, /inset:-16%!important/);
  assert.match(css, /transform:translateX\(8%\)\s*translateY\(calc\(-18%\s*\+\s*var\(--gs-scroll-y,\s*0%\)\)\)\s*scale\(1\.3\)/);
  assert.match(css, /transform:translateX\(-8%\)\s*translateY\(calc\(-8%\s*\+\s*var\(--gs-scroll-y,\s*0%\)\)\)\s*scale\(1\.24\)/);
  assert.match(css, /\.gs-bg__live-canvas/);
  assert.doesNotMatch(css, /\.gs-bg__live-canvas\[data-astro-cid-/);
  assert.match(css, /\.gs-bg__live-canvas\{[^}]*pointer-events:none/);
  assert.match(js, /gs-bg__live-canvas/);
});

test('live Gaussian canvas overrides the renderer black surface', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(
    source,
    /\.gs-bg > :global\(\.gs-bg__live-canvas\)\s*\{[^}]*background:\s*transparent !important;/s,
  );
});

test('Gaussian runtime exposes an idempotent pausable and disposable controller', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');
  const renderFrameStart = source.indexOf('"  const renderFrame =');
  const renderFrameGuard = source.slice(
    renderFrameStart,
    source.indexOf('"    if (hasCameraMotion', renderFrameStart),
  );

  assert.match(source, /import \{ createPausableFrameLoop \} from '\.\.\/scripts\/gaussian-frame-loop\.mjs';/);
  assert.match(source, /interface GaussianRuntimeController\s*\{[^}]*setActive\(active: boolean\): void;[^}]*dispose\(\): void;[^}]*getState\(\): \{[^}]*active: boolean;[^}]*disposed: boolean;[^}]*activeSeconds: number;[^}]*frameCount: number;[^}]*\};[^}]*\}/s);
  assert.match(source, /__gsBgStart\?: \(src: string, stage: HTMLElement\) => Promise<GaussianRuntimeController \| null>/);
  assert.match(source, /window\.__gsBgLifecycle = \{ createPausableFrameLoop \};/);
  assert.match(source, /const lifecycle = window\.__gsBgLifecycle;/);
  assert.match(source, /lifecycle\.createPausableFrameLoop\(\{/);
  assert.match(source, /const renderFrame = \(\{ deltaSeconds, activeSeconds \}\) => \{/);
  assert.match(
    renderFrameGuard,
    /if \(!stage\.isConnected \|\| stage\.dataset\.gsDisposed === '1'\) \{",\s*"      controller\.dispose\(\);",\s*"      return;",\s*"    }",/,
  );
  assert.match(source, /onFrame: \(\{ deltaSeconds, activeSeconds \}\) => renderFrame\(\{ deltaSeconds, activeSeconds \}\)/);
  assert.match(source, /timeSeconds: activeSeconds/);
  assert.match(source, /setActive\(active\) \{ frameLoop\.setActive\(active\); \}/);
  assert.match(source, /if \(disposed\) return;[^]*disposed = true;[^]*frameLoop\.dispose\(\);[^]*renderer\.dispose\(\);[^]*renderer\.canvas\.remove\(\);/);
  assert.match(source, /stage\.dataset\.gsDisposed === '1'/);
  assert.match(source, /return window\.__gsBgStart\(pick\.src, bg\);/);
  assert.doesNotMatch(source, /runtime\?\.setActive\(true\);/);
  assert.doesNotMatch(source, /requestAnimationFrame\(frame\)/);
});

test('continuous Gaussians load predictively without document-head splat preload', () => {
  const gaussianSource = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');
  const homepageSource = readFileSync(homepageSourcePath, 'utf8');
  const layoutSource = readFileSync(join(process.cwd(), 'src', 'layouts', 'Layout.astro'), 'utf8');

  assert.doesNotMatch(homepageSource, /const SPLATS|preload=\{/);
  assert.doesNotMatch(layoutSource, /preload\?: string\[\]|as="fetch" type="application\/octet-stream"/);
  assert.match(gaussianSource, /rootMargin: loadRootMargin/);
  assert.match(gaussianSource, /rootMargin: '75% 0px'/);
  assert.match(gaussianSource, /closest\('\.code__hero, \.code__lower-showcase'\)/);
  assert.match(gaussianSource, /location\.hash === '#code'/);
  assert.match(
    gaussianSource,
    /url\.origin === location\.origin &&\s*url\.pathname === location\.pathname &&\s*url\.search === location\.search &&\s*url\.hash === '#code'/s,
  );
  assert.match(gaussianSource, /document\.addEventListener\('astro:before-swap', cleanupGaussianBackgrounds\)/);
});

test('constrained devices defer Gaussian loading and obsolete PLY viewer assets are absent', () => {
  const gaussianSource = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');
  const sourceFiles = walk(join(process.cwd(), 'src'), '').filter((path) => /\.(astro|js|mjs|ts|tsx)$/.test(path));
  const legacyViewerPath = join(process.cwd(), 'src', 'components', 'GaussianViewer.astro');
  const legacyPlyPath = join(process.cwd(), 'public', 'work', 'code', 'splats', 'carro', 'carro.compressed.ply');

  assert.match(gaussianSource, /import \{ shouldDelayHeavyMedia, shouldLoadHeavyMediaForIntent \} from '\.\.\/scripts\/heavy-media-policy\.mjs';/);
  assert.match(
    gaussianSource,
    /shouldDelayHeavyMedia\(\{\s*saveData: navigator\.connection\?\.saveData,\s*deviceMemory: navigator\.deviceMemory,\s*\}\)/s,
  );
  assert.match(
    gaussianSource,
    /const delayHeavyMedia = shouldDelayHeavyMedia\([^]*?\);\s*const loadRootMargin = delayHeavyMedia \? '0px' : '200% 0px';/,
  );
  assert.match(gaussianSource, /\}, \{ rootMargin: loadRootMargin \}\);/);
  assert.match(gaussianSource, /shouldLoadHeavyMediaForIntent\(\{[^]*?delayHeavyMedia,[^]*?hostTop: hostRect\.top,[^]*?hostBottom: hostRect\.bottom,[^]*?viewportHeight: window\.innerHeight,/);
  assert.match(gaussianSource, /loadForIntent: \(\) => void/);
  assert.match(gaussianSource, /firstCodeGaussian\(\)\?\.loadForIntent\(\)/);
  assert.ok(sourceFiles.every((path) => {
    const source = readFileSync(path, 'utf8');
    return !source.includes('GaussianViewer') && !source.includes('.ply');
  }));
  assert.equal(existsSync(legacyViewerPath), false);
  assert.equal(existsSync(legacyPlyPath), false);
  assert.deepEqual(walk(join(process.cwd(), 'public'), '.ply'), []);
});

test('predictive Gaussian controllers load once and preserve poster continuity', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');
  const posterStyle = source.indexOf("bg.style.setProperty('--gs-poster'");
  const posterClass = source.indexOf("bg.classList.add('gs-bg--poster')");
  const observerSetup = source.indexOf('loadObserver = new IntersectionObserver');

  assert.match(source, /let loadPromise: Promise<void> \| null = null/);
  assert.match(source, /if \(loadPromise \|\| disposed\) return loadPromise/);
  assert.ok(posterStyle >= 0 && posterStyle < observerSetup, 'poster style must be assigned before observers');
  assert.ok(posterClass >= 0 && posterClass < observerSetup, 'poster class must be assigned before observers');
  assert.match(source, /runtime\?\.setActive\(insideActiveZone && !document\.hidden\)/);
  assert.match(source, /runtime\?\.dispose\(\)/);
  assert.match(source, /bg\.dataset\.gsDisposed = '1'/);
  assert.match(source, /window\.__gsBgDebug = \(\) => \[\.\.\.gaussianControllers\]\.map\(\(controller\) => controller\.getState\(\)\)/);
});

test('code cards stay above softened Gaussian spill', () => {
  const source = readFileSync(codeChapterSourcePath, 'utf8');

  assert.match(source, /\.gh-card,\s*\.tools\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;/s);
  assert.match(source, /background:\s*rgba\(11, 11, 12, 0\.64\)/);
  assert.match(source, /backdrop-filter:\s*blur\(18px\) brightness\(0\.72\) saturate\(0\.75\)/);
  assert.match(source, /-webkit-backdrop-filter:\s*blur\(18px\) brightness\(0\.72\) saturate\(0\.75\)/);
  assert.match(source, /\.tool-card__media\s*\{[^}]*background:\s*rgba\(11, 11, 12, 0\.64\)/s);
});

test('code hero keeps the layout flow while navigation owns its backing', () => {
  const codeSource = readFileSync(codeChapterSourcePath, 'utf8');
  const homepageSource = readFileSync(homepageSourcePath, 'utf8');
  const layoutSource = readFileSync(join(process.cwd(), 'src', 'layouts', 'Layout.astro'), 'utf8');
  const gaussianSource = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(homepageSource, /<Layout[^>]*mode="continuous"/);
  assert.match(layoutSource, /:global\(body\[data-immersive="true"\] main\)\s*\{\s*padding-top:\s*0;/);
  assert.doesNotMatch(layoutSource, /body\[data-immersive="true"\] \.nav/);
  assert.match(codeSource, /\.code__hero\s*\{[^}]*background:\s*transparent;/s);
  assert.match(gaussianSource, /data-placement="hero-right"\]\[data-contained="1"\][^{]*\{[^}]*bottom:\s*-88vh;/s);
});

test('Gaussian placements keep their independent raised compositions and overscan', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(source, /left:\s*50%;/);
  assert.match(source, /transform:\s*translateX\(-50%\);/);
  assert.match(source, /inset:\s*-16% !important;/);
  assert.match(source, /width:\s*132% !important;/);
  assert.match(source, /translateX\(8%\) translateY\(calc\(-18% \+ var\(--gs-scroll-y, 0%\)\)\) scale\(1\.30\)/);
  assert.match(source, /translateX\(10%\) translateY\(calc\(-18% \+ var\(--gs-scroll-y, 0%\)\)\) scale\(1\.36\)/);
  assert.match(source, /translateX\(-8%\) translateY\(calc\(-8% \+ var\(--gs-scroll-y, 0%\)\)\) scale\(1\.24\)/);
});

test('both Gaussians opt into smoothed camera motion around the fixed origin', () => {
  const gaussianSource = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  for (const [, code] of builtCodeDocuments()) {
    const heroStart = code.indexOf('<header class="code__hero"');
    const heroEnd = code.indexOf('</header>', heroStart);
    const lowerStart = code.indexOf('<section class="code__lower-showcase"');
    const lowerEnd = code.indexOf('</article>', lowerStart);
    const hero = code.slice(heroStart, heroEnd);
    const lower = code.slice(lowerStart, lowerEnd);

    assert.match(hero, /data-camera-motion="1"/);
    assert.match(lower, /data-camera-motion="1"/);
  }
  assert.match(gaussianSource, /sampleGaussianCamera/);
  assert.match(gaussianSource, /createGaussianAutopilot/);
  assert.match(gaussianSource, /gaussianFocusPoint/);
  assert.match(gaussianSource, /gaussianFocusProximity/);
  assert.match(gaussianSource, /gaussianPointerLook/);
  assert.match(gaussianSource, /let pointerClientX = null;/);
  assert.match(gaussianSource, /let pointerClientY = null;/);
  assert.match(gaussianSource, /const focusX = stage\.dataset\.placement === 'section-left' \? 0\.28 : 0\.72;/);
  assert.match(gaussianSource, /focusProximity = motion\.damp\(focusProximity, focusTarget,/);
  assert.match(gaussianSource, /const zoomScale = stage\.dataset\.placement === 'section-left' \? 2\.5 : 1\.5;/);
  assert.match(gaussianSource, /let radius = 6 \/ zoomScale;/);
  assert.match(gaussianSource, /scrollProgress, focusProximity, zoomScale, timeSeconds:/);
  assert.match(gaussianSource, /hostTop: rect\.top/);
  assert.match(gaussianSource, /sampled\.verticalOffset/);
  assert.match(gaussianSource, /--gs-scroll-y/);
  assert.doesNotMatch(gaussianSource, /pointerX|pointerY/);
  assert.doesNotMatch(gaussianSource, /OrbitControls|controls\./);
});

test('both Gaussians run independent autonomous camera gestures with roll', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(source, /const autopilotSeed = .*Math\.random/);
  assert.match(source, /const autopilot = .*createGaussianAutopilot\(autopilotSeed\)/);
  assert.match(source, /sampled\.angularSpeed \* autonomous\.speedScale/);
  assert.match(source, /pitch = motion\.damp\(pitch, sampled\.pitch,/);
  assert.doesNotMatch(source, /autonomous\.pitchOffset/);
  assert.match(source, /sampled\.phaseOffset \+ autonomous\.phaseOffset/);
  assert.match(source, /setCameraOnOrbit\(angle \+ phaseOffset, roll, lookYaw, lookPitch, aimOffsetX, aimOffsetY\)/);
  assert.match(source, /new SPLAT\.Vector3\(pch, yaw, cameraRoll\)/);
});

test('both Gaussians opt into independent reduced-motion-safe digital dust', () => {
  const gaussianSource = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');
  const codeSource = readFileSync(codeChapterSourcePath, 'utf8');

  assert.equal((codeSource.match(/particleEffects=\{true\}/g) ?? []).length, 2);
  assert.match(gaussianSource, /particleEffects\?: boolean/);
  assert.match(gaussianSource, /data-particle-effects=\{particleEffects \? '1' : undefined\}/);
  assert.match(gaussianSource, /https:\/\/esm\.sh\/gsplat@1\.2\.9/);
  assert.match(gaussianSource, /installGaussianParticleShaderPatch/);
  assert.match(gaussianSource, /createGaussianParticleAutopilot/);
  assert.match(gaussianSource, /createGaussianLightAutopilot/);
  assert.match(gaussianSource, /createGaussianParticleUniformController/);
  assert.doesNotMatch(gaussianSource, /createGaussianPointerDissolve/);
  assert.match(gaussianSource, /calculateParticleBounds/);
  assert.match(gaussianSource, /hasParticleEffects = stage\.dataset\.particleEffects === '1' && !reducedMotion/);
  assert.match(gaussianSource, /finally\s*\{\s*particleShaderHook\.restore\(\);\s*\}/s);
  assert.match(gaussianSource, /particleController\.update/);
  assert.match(gaussianSource, /coreRadius: 1\.5/);
  assert.match(gaussianSource, /worldReveal: worldReveal/);
  assert.match(gaussianSource, /gaussianToggleHotspot/);
  assert.match(gaussianSource, /window\.addEventListener\('click', onWorldToggle/);
  assert.match(gaussianSource, /worldRevealTarget = worldRevealTarget > 0\.5 \? 0 : 1/);
  assert.match(gaussianSource, /createGaussianWorldTransition/);
  assert.match(gaussianSource, /worldTransition\.sample\(worldRevealTarget, deltaSeconds\)/);
  assert.match(gaussianSource, /transitionActivity: transitionFrame\.activity/);
  assert.match(gaussianSource, /transitionDirection: transitionFrame\.direction/);
  assert.match(gaussianSource, /const particleProfile = particles\.gaussianParticleProfile\(stage\.dataset\.placement\)/);
  assert.match(gaussianSource, /const lightAutopilot = particleShaderActive \? particles\.createGaussianLightAutopilot\(particleSeed \^ 0x51f15e, stage\.dataset\.placement\) : null/);
  assert.match(gaussianSource, /const lightFrame = lightAutopilot\.sample\(deltaSeconds\)/);
  assert.match(gaussianSource, /transitionOpacity: particleProfile\.transitionOpacity/);
  assert.match(gaussianSource, /displacement: particleProfile\.displacement/);
  assert.match(gaussianSource, /\.\.\.lightFrame/);
  assert.match(gaussianSource, /flowTime: transitionFrame\.time/);
  assert.doesNotMatch(gaussianSource, /window\.addEventListener\('pointerdown', onPointerDown|pointerDissolve|pointerFrame/);
});

test('pointer gently biases camera aim without owning the autonomous orbit', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(source, /const pointerLookTarget = motion\.gaussianPointerLook/);
  assert.match(source, /aimOffsetX = motion\.damp\(aimOffsetX, pointerLookTarget\.targetX,/);
  assert.match(source, /aimOffsetY = motion\.damp\(aimOffsetY, pointerLookTarget\.targetY,/);
  assert.match(source, /const targetDistanceX = cameraAimX \* radius;/);
  assert.match(source, /const targetDistanceY = cameraAimY \* radius;/);
  assert.match(source, /setCameraOnOrbit\(angle \+ phaseOffset, roll, lookYaw, lookPitch, aimOffsetX, aimOffsetY\)/);
  assert.match(source, /const yaw = Math\.atan2\(ux, uz\) \+ cameraLookYaw;/);
  assert.match(source, /const pch = .* \+ cameraLookPitch;/);
});

test('Gaussian masks open farther into the page while copy protection remains', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'components', 'GaussianBackground.astro'), 'utf8');

  assert.match(source, /ellipse 82% 98% at 50% 48%/);
  assert.match(source, /rgba\(11, 11, 12, 0\.86\) 12%/);
  assert.match(source, /rgba\(11, 11, 12, 0\.55\) 28%/);
  assert.match(source, /\.gs-bg__veil\s*\{[^}]*z-index:\s*2;/s);
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
  assert.match(source, /\.nav::before\s*\{[^}]*z-index:\s*0;[^}]*linear-gradient/s);
  assert.match(source, /background:\s*linear-gradient\(to bottom,/);
  assert.match(source, /\.nav__inner\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*1;/s);
  assert.match(source, /@media \(max-width: 640px\)[\s\S]*?\.nav__link\s*\{[^}]*min-height:\s*32px;[^}]*font-size:\s*11px;/s);
});

test('scroll progress resets safely after Astro page navigation', () => {
  const source = readFileSync(join(process.cwd(), 'src', 'scripts', 'scroll-progress.ts'), 'utf8');

  assert.match(source, /Math\.min\(100,\s*Math\.max\(0,/);
  assert.match(source, /document\.addEventListener\('astro:page-load'/);
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

test('case-study media keeps motion, gallery labels, and interactive focus safe', () => {
  const template = readFileSync(join(process.cwd(), 'src', 'pages', 'work', '[slug].astro'), 'utf8');

  assert.match(template, /<video src=\{media\.trailer\} controls autoplay muted loop playsinline preload="metadata"/);
  assert.match(template, /<video src=\{media\.cover\} controls autoplay muted loop playsinline preload="metadata"/);
  assert.match(template, /data-case-motion-video/);
  assert.match(template, /document\.addEventListener\('DOMContentLoaded', attachCaseMedia/);
  assert.match(template, /document\.addEventListener\('astro:page-load', attachCaseMedia/);
  assert.match(template, /motionQuery\.addEventListener\('change', syncReducedMotion\)/);
  assert.match(template, /video\.autoplay = false;/);
  assert.match(template, /video\.loop = false;/);
  assert.match(template, /video\.pause\(\);/);
  assert.match(template, /document\.addEventListener\('astro:before-swap', \(\) => disposeCaseMedia\(\)\)/);
  assert.doesNotMatch(template, /document\.addEventListener\('astro:before-swap', disposeCaseMedia\)/);
  assert.match(template, /alt=\{`\$\{data\.title\} \\u2014 project visual \$\{m\.visualIndex\}`\}/);
  assert.doesNotMatch(template, /case__gallery-item[\s\S]*?alt=""/);
  assert.match(template, /role="status" aria-live="polite" data-interactive-status/);
  assert.match(template, /if \(!event\.isTrusted \|\| button\.disabled\) return;/);
  const beforeLoad = template.slice(
    template.indexOf('const nextFrame = document.createElement'),
    template.indexOf("nextFrame.addEventListener('load'"),
  );
  const onLoad = template.slice(
    template.indexOf("nextFrame.addEventListener('load'"),
    template.indexOf("nextFrame.addEventListener('error'"),
  );
  assert.match(beforeLoad, /nextFrame\.tabIndex = -1;/);
  assert.match(beforeLoad, /nextFrame\.style\.pointerEvents = 'none';/);
  assert.doesNotMatch(beforeLoad, /nextFrame\.tabIndex = 0;/);
  assert.match(onLoad, /nextFrame\.tabIndex = 0;/);
  assert.match(onLoad, /nextFrame\.style\.pointerEvents = 'auto';/);
  assert.match(template, /nextFrame\.focus\(\);/);
  assert.match(template, /nextFrame\.sandbox\.add\('allow-scripts', 'allow-same-origin'\);/);
  assert.match(template, /nextFrame\.referrerPolicy = 'no-referrer';/);
  assert.match(template, /window\.setTimeout\(\(\) => restoreRetry\(token\), 12000\)/);
  assert.match(template, /nextFrame\.addEventListener\('error', \(\) => restoreRetry\(token\), \{ once: true \}\);/);
  assert.doesNotMatch(template, /button\.remove\(\);/);
  assert.doesNotMatch(template, /function attachInteractiveCases\(\): void/);
});

test('Code tool cards expose each project destination only once to keyboard users', () => {
  const source = readFileSync(codeChapterSourcePath, 'utf8');

  assert.match(source, /<div class="tool-card__media" aria-hidden="true">/);
  assert.match(source, /\{!t\.href && \(\s*<a class="tool-card__media"/s);
  assert.match(source, /<img src=\{t\.img\} alt="" loading="lazy"/);
  assert.match(source, /<h3 class="tool-card__name">[\s\S]*?<a href=\{t\.href\}/);
});

test('each homepage chapter keeps its own hero copy and reveal language', () => {
  const work = readFileSync(join(process.cwd(), 'src', 'components', 'portfolio', 'WorkChapter.astro'), 'utf8');
  const about = readFileSync(join(process.cwd(), 'src', 'components', 'portfolio', 'AboutChapter.astro'), 'utf8');
  const code = readFileSync(codeChapterSourcePath, 'utf8');

  assert.match(work, /<h2[^>]*[\s\S]*?data-work-title-reveal/);
  assert.match(work, /Sound direction,/);
  assert.match(work, /music production,/);
  assert.match(work, /creative systems\./);

  assert.match(about, /<h1[^>]*data-reveal="focus"/);
  assert.match(about, /A practice shaped by/);
  assert.match(about, /listening/);
  assert.match(about, /systems, and collaboration\./);

  assert.match(code, /<h2[^>]*data-reveal="typewriter"/);
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
  assert.match(script, /new IntersectionObserver\(/);
  assert.match(script, /if \(!entry\.isIntersecting\) return;/);
  assert.match(script, /startReveal\(entry\.target as HTMLElement\)/);
  assert.match(script, /revealObserver\?\.observe\(el\)/);
  assert.match(layout, /import '\.\.\/scripts\/title-reveal\.ts'/);
});

test('scroll fades attach to content after Astro client navigation', () => {
  const script = readFileSync(join(process.cwd(), 'src', 'scripts', 'scroll-fade.ts'), 'utf8');

  assert.match(script, /function initScrollFades\(\)/);
  assert.match(script, /document\.addEventListener\('astro:page-load', initScrollFades\)/);
  assert.match(script, /const observed = new WeakSet<Element>\(\)/);
  assert.match(script, /reducedMotion[^}]*classList\.add\('is-visible'\)/s);
});
