import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import test from 'node:test';

import {
  DISCIPLINE_BY_ID,
  DISCIPLINE_LABELS_PT,
  FEATURED_COPY_PT_BY_ID,
  FEATURED_PRESENTATION_BY_ID,
  buildWorkPresentation,
} from '../src/data/work-presentation.mjs';
import {
  alternatePaths,
  localeFromPath,
  localizePath,
  unlocalizePath,
} from '../src/i18n/locales.mjs';
import { localizeProjectData } from '../src/i18n/projects.mjs';
import { UI, useTranslations } from '../src/i18n/ui.mjs';

const root = process.cwd();
const distDir = join(root, 'dist');
const projectsDir = join(root, 'src', 'content', 'projects');
const translationsDir = join(root, 'src', 'content', 'projects-pt-br');

const markdownIds = (dir) => readdirSync(dir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => basename(file, '.md'))
  .sort();

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, 'frontmatter not found');
  return match[1];
}

function body(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
}

function hasKey(yaml, key) {
  return new RegExp(`^${key}:`, 'm').test(yaml);
}

function listValues(yaml, key) {
  return [...yaml.matchAll(new RegExp(`^\\s*(?:- )?${key}:\\s*"?([^"\\n]+?)"?\\s*$`, 'gm'))]
    .map((match) => match[1]);
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

test('locale helpers map every root path between English and /pt-br/', () => {
  assert.equal(localeFromPath('/'), 'en');
  assert.equal(localeFromPath('/work/lucy/'), 'en');
  assert.equal(localeFromPath('/pt-br/'), 'pt');
  assert.equal(localeFromPath('/pt-br'), 'pt');
  assert.equal(localeFromPath('/pt-br/work/lucy/'), 'pt');
  assert.equal(localeFromPath('/pt-brasil/'), 'en');
  assert.equal(localeFromPath(new URL('https://ntworm.github.io/pt-br/#work')), 'pt');

  assert.equal(localizePath('/', 'pt'), '/pt-br/');
  assert.equal(localizePath('/#work', 'pt'), '/pt-br/#work');
  assert.equal(localizePath('/work/lucy', 'pt'), '/pt-br/work/lucy');
  assert.equal(localizePath('/pt-br/work/lucy', 'pt'), '/pt-br/work/lucy');
  assert.equal(localizePath('/pt-br/work/lucy', 'en'), '/work/lucy');
  assert.equal(localizePath('/work/lucy', 'en'), '/work/lucy');
  assert.equal(localizePath('https://github.com/ntworm', 'pt'), 'https://github.com/ntworm');
  assert.equal(localizePath('mailto:gabrielwormm@gmail.com', 'pt'), 'mailto:gabrielwormm@gmail.com');
  assert.equal(localizePath('//cdn.example.com/x', 'pt'), '//cdn.example.com/x');

  assert.equal(unlocalizePath('/pt-br'), '/');
  assert.equal(unlocalizePath('/pt-br/'), '/');
  assert.deepEqual(alternatePaths('/pt-br/work/lucy/'), { en: '/work/lucy/', pt: '/pt-br/work/lucy/' });
  assert.deepEqual(alternatePaths('/'), { en: '/', pt: '/pt-br/' });
});

test('the interface dictionary is complete in both languages', () => {
  assert.deepEqual(Object.keys(UI.pt).sort(), Object.keys(UI.en).sort());
  for (const [key, value] of Object.entries(UI.pt)) {
    assert.ok(value.trim(), `pt ${key} is empty`);
  }
  assert.equal(useTranslations('pt')('nav.work'), 'Audiovisual');
  assert.equal(useTranslations('xx')('nav.work'), 'Audiovisual');
});

test('every project has a Brazilian Portuguese translation and nothing else', () => {
  assert.deepEqual(markdownIds(translationsDir), markdownIds(projectsDir));
});

test('translations carry the credit words and match the English lists by key', () => {
  for (const id of markdownIds(projectsDir)) {
    const english = frontmatter(readFileSync(join(projectsDir, `${id}.md`), 'utf8'));
    const translationSource = readFileSync(join(translationsDir, `${id}.md`), 'utf8');
    const portuguese = frontmatter(translationSource);

    for (const key of ['role', 'country', 'type']) {
      assert.equal(hasKey(portuguese, key), hasKey(english, key), `${id}: ${key} must be translated`);
    }
    assert.equal(hasKey(portuguese, 'awards'), hasKey(english, 'awards'), `${id}: awards must be translated`);
    if (hasKey(portuguese, 'interactiveEmbed')) assert.ok(hasKey(english, 'interactiveEmbed'), `${id}: no embed to translate`);
    for (const key of ['year', 'youtubeId', 'hideGallery', 'tags']) {
      assert.equal(hasKey(portuguese, key), false, `${id}: ${key} belongs to the English source only`);
    }

    const englishUrls = new Set(listValues(english, 'url'));
    for (const url of listValues(portuguese, 'url')) {
      assert.ok(englishUrls.has(url), `${id}: translated link ${url} is not in the English file`);
    }
    const englishSeasons = new Set(listValues(english, 'img'));
    for (const img of listValues(portuguese, 'img')) {
      assert.ok(englishSeasons.has(img), `${id}: translated season ${img} is not in the English file`);
    }
    const englishPieces = new Set(listValues(english, 'slug'));
    for (const slug of listValues(portuguese, 'slug')) {
      assert.ok(englishPieces.has(slug), `${id}: translated piece ${slug} is not in the English file`);
    }

    const prose = body(translationSource);
    assert.match(prose, /^\s*## /, `${id}: translation needs its case-study prose`);
    for (const [, href] of prose.matchAll(/href="(\/[^"]*)"/g)) {
      assert.match(href, /^\/pt-br\/work\/[a-z0-9-]+$/, `${id}: internal link ${href} must stay in Portuguese`);
      assert.ok(existsSync(join(projectsDir, `${href.split('/').pop()}.md`)), `${id}: ${href} has no project`);
    }
  }
});

test('localized project data keeps shared facts and swaps only the words', () => {
  const english = {
    title: 'O Clube (S6 + S7)',
    year: '2024–2025',
    role: 'Sound Editor',
    links: [{ url: 'https://a.example', label: 'Watch' }, { url: 'https://b.example', label: 'IMDB' }],
    seasons: [{ img: '1.jpg', label: 'Season 6' }],
    interactiveEmbed: { url: 'https://c.example', title: 'Live', cta: 'Click' },
    fxhashPieces: [{ slug: 'x', title: 'X', desc: 'Click to start.', url: 'https://d.example', thumb: '/x.webp' }],
  };
  const localized = localizeProjectData(english, {
    title: 'O Clube (T6 + T7)',
    role: 'Editor de som',
    links: [{ url: 'https://a.example', label: 'Assistir' }],
    seasons: [{ img: '1.jpg', label: 'Temporada 6' }],
    interactiveEmbed: { title: 'Ao vivo', cta: 'Clique' },
    fxhashPieces: [{ slug: 'x', desc: 'Clique para começar.' }],
  });

  assert.equal(localized.title, 'O Clube (T6 + T7)');
  assert.equal(localized.year, '2024–2025');
  assert.deepEqual(localized.links, [
    { url: 'https://a.example', label: 'Assistir' },
    { url: 'https://b.example', label: 'IMDB' },
  ]);
  assert.deepEqual(localized.seasons, [{ img: '1.jpg', label: 'Temporada 6' }]);
  assert.deepEqual(localized.interactiveEmbed, { url: 'https://c.example', title: 'Ao vivo', cta: 'Clique' });
  assert.equal(localized.fxhashPieces[0].desc, 'Clique para começar.');
  assert.equal(localized.fxhashPieces[0].url, 'https://d.example');
  assert.equal(localizeProjectData(english, undefined), english);
});

test('Portuguese featured copy covers every featured card and keeps its highlight verbatim', () => {
  assert.deepEqual(Object.keys(FEATURED_COPY_PT_BY_ID).sort(), Object.keys(FEATURED_PRESENTATION_BY_ID).sort());
  for (const [id, copy] of Object.entries(FEATURED_COPY_PT_BY_ID)) {
    assert.ok(copy.summary.includes(copy.highlight), `${id}: highlight must appear in its summary`);
    assert.equal('mediaLayout' in copy, false, `${id}: media layout is shared with English`);
  }
  assert.deepEqual(
    Object.keys(DISCIPLINE_LABELS_PT).sort(),
    [...new Set(Object.values(DISCIPLINE_BY_ID))].sort(),
  );

  const projects = markdownIds(projectsDir).map((id) => ({ id, data: { title: id, year: 2020 } }));
  const english = buildWorkPresentation(projects);
  const portuguese = buildWorkPresentation(projects, { locale: 'pt' });
  assert.deepEqual(portuguese.featured.map(({ id }) => id), english.featured.map(({ id }) => id));
  assert.deepEqual(portuguese.archive.map(({ id }) => id), english.archive.map(({ id }) => id));
  const compositor = portuguese.featured.find(({ id }) => id === 'o-compositor');
  assert.equal(compositor.presentation.mediaLayout, 'portrait');
  assert.equal(compositor.presentation.highlight, FEATURED_COPY_PT_BY_ID['o-compositor'].highlight);
  assert.equal(portuguese.archive.find(({ id }) => id === 'lucy').presentation.discipline, 'arte generativa');
});

test('the Portuguese homepage mirrors the English chapters, tiers and headings', () => {
  const english = readFileSync(join(distDir, 'index.html'), 'utf8');
  const html = readFileSync(join(distDir, 'pt-br', 'index.html'), 'utf8');
  const chapters = [...html.matchAll(/data-portfolio-chapter="(about|projects|code|work|archive|practice|contact)"/g)].map((match) => match[1]);
  const tierIds = (source, tier) => [...source.matchAll(/<a\b[^>]*data-work-tier="([^"]+)"[^>]*>/g)]
    .filter((match) => match[1] === tier)
    .map((match) => attr(match[0], 'data-work-id'));

  assert.match(html, /<html lang="pt-BR"/);
  assert.match(english, /<html lang="en"/);
  assert.match(html, /<title>Som, Música e Sistemas Criativos &mdash; Gabriel Worm/);
  assert.deepEqual(chapters, ['about', 'projects', 'code', 'work', 'archive', 'practice', 'contact']);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /class="reveal-seg reveal-amber"[^>]*>escuta,<\/span>/);
  assert.match(html, /<h2 id="selected-work-title"[^>]*>Som para cinema, música e palco\.<\/h2>/);
  for (const tier of ['featured', 'more']) {
    assert.deepEqual(tierIds(html, tier), tierIds(english, tier), `${tier} tier matches English`);
  }
  // The archive is alphabetical by visible title within each year, so a
  // translated title may move a project; the set of projects is the same.
  assert.deepEqual([...tierIds(html, 'archive')].sort(), [...tierIds(english, 'archive')].sort());
  const workLinks = [...html.matchAll(/<a\b[^>]*data-work-tier=[^>]*>/g)].map((match) => attr(match[0], 'href'));
  assert.ok(workLinks.every((href) => /^\/pt-br\/work\/[a-z0-9-]+$/.test(href)), 'cards stay in Portuguese');
  assert.match(html, /<link rel="alternate" hreflang="en" href="https:\/\/ntworm\.github\.io\/">/);
  assert.match(html, /<link rel="alternate" hreflang="pt-BR" href="https:\/\/ntworm\.github\.io\/pt-br\/">/);
  assert.match(english, /<link rel="alternate" hreflang="pt-BR" href="https:\/\/ntworm\.github\.io\/pt-br\/">/);
});

test('the language switch sits beside the logo and reloads into the other language', () => {
  for (const [label, file, current, other] of [
    ['en home', 'index.html', '/', '/pt-br/'],
    ['pt home', 'pt-br/index.html', '/pt-br/', '/'],
    ['en case', 'work/lucy/index.html', '/work/lucy/', '/pt-br/work/lucy/'],
    ['pt case', 'pt-br/work/lucy/index.html', '/pt-br/work/lucy/', '/work/lucy/'],
  ]) {
    const html = readFileSync(join(distDir, file), 'utf8');
    const brand = html.match(/<div class="nav__brand"[\s\S]*?<\/ul>\s*<\/div>/)?.[0] ?? '';
    const switches = [...brand.matchAll(/<a\b[^>]*data-lang-switch[^>]*>/g)].map((match) => match[0]);

    assert.match(brand, /class="nav__logo"/, `${label}: switch lives next to the logo`);
    assert.equal(switches.length, 2, label);
    assert.ok(switches.every((tag) => /\bdata-astro-reload\b/.test(tag)), `${label}: switching reloads the page`);
    const active = switches.find((tag) => /aria-current="true"/.test(tag));
    const inactive = switches.find((tag) => !/aria-current="true"/.test(tag));
    assert.equal(attr(active, 'href'), current, label);
    assert.equal(attr(inactive, 'href'), other, label);
  }
});

test('Portuguese case studies render translated prose, labels and links', () => {
  const ids = markdownIds(projectsDir);
  for (const id of ids) {
    const html = readFileSync(join(distDir, 'pt-br', 'work', id, 'index.html'), 'utf8');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    const work = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]))
      .find((data) => data['@type'] === 'CreativeWork');

    assert.match(html, /<html lang="pt-BR"/, id);
    assert.equal(canonical, `https://ntworm.github.io/pt-br/work/${id}/`, id);
    assert.equal(work?.url, canonical, id);
    assert.equal(work?.inLanguage, 'pt-BR', id);
    assert.match(html, /<span class="eyebrow case__act"[^>]*>ATO \d{2}<\/span>/, id);
    assert.match(html, /<dt[^>]*>Ano<\/dt>/, id);

    const internal = [...html.matchAll(/<a\b[^>]*href="(\/[^"]*)"[^>]*>/g)]
      .filter((match) => !/\bdata-lang-switch\b/.test(match[0]))
      .map((match) => match[1]);
    assert.ok(internal.every((href) => href.startsWith('/pt-br/')), `${id}: internal links stay in Portuguese: ${internal.filter((href) => !href.startsWith('/pt-br/'))}`);
  }

  const kakofoni = readFileSync(join(distDir, 'pt-br', 'work', 'kakofoni-orquestra', 'index.html'), 'utf8');
  assert.match(kakofoni, /data-loading-status="Carregando a obra ao vivo\."/);
  assert.match(kakofoni, /Clique para entrar na obra/);
  const clube = readFileSync(join(distDir, 'pt-br', 'work', 'o-clube', 'index.html'), 'utf8');
  assert.match(clube, /Temporada 6/);
  assert.doesNotMatch(visibleText(clube), /Season 6/);
});

test('English interface text never leaks into Portuguese pages, nor the reverse', () => {
  const englishOnly = [
    'Skip to content', 'Selected Work', 'Defining Projects', 'More Work', 'Complete project index',
    'View full profile on GitHub', 'Tools & instruments', 'Browse all on fxhash', 'image pending',
    'Available for cinema', 'Currently based in', '← Previous', 'Next →', 'All Work', 'Live generative work',
    'Open on fxhash', 'Sound Direction', 'Sound Editor', 'Lisbon, Portugal', 'Short film', 'Feature film',
  ];
  const portugueseOnly = ['Pular para o conteúdo', 'Trabalhos selecionados', 'Todos os trabalhos', 'Ficha técnica'];
  const pages = (prefix) => [
    join(distDir, prefix, 'index.html'),
    ...markdownIds(projectsDir).map((id) => join(distDir, prefix, 'work', id, 'index.html')),
  ];

  for (const path of pages('pt-br')) {
    const text = visibleText(readFileSync(path, 'utf8'));
    for (const phrase of englishOnly) assert.equal(text.includes(phrase), false, `${path}: "${phrase}"`);
  }
  for (const path of pages('')) {
    const html = readFileSync(path, 'utf8');
    for (const phrase of portugueseOnly) assert.equal(html.includes(phrase), false, `${path}: "${phrase}"`);
  }
});
