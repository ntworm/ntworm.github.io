import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, extname } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  DISCIPLINE_BY_ID,
  FEATURED_WORK_IDS,
  MORE_WORK_IDS,
  buildWorkPresentation,
} from '../src/data/work-presentation.mjs';

const projectsDir = fileURLToPath(new URL('../src/content/projects/', import.meta.url));

const expectedFeaturedIds = [
  'o-compositor',
  'o-clube',
  'ep-rinoceronte',
  'kakofoni-orquestra',
  'this-feminine-side',
  'lucy',
  'em-agosto-chove',
  'unveiling-new-futures',
  'arvore-seca',
  'el-tono-del-mar',
  'ai-am',
  'trisal',
  'unconscious-vision',
];

const expectedMoreIds = [
  'a-quermesse',
  'ticha-penicheiro',
  'eletronik-fields',
  'rc-surface',
  'fxhash',
];

const expectedFeaturedPresentation = {
  'o-compositor': {
    mediaLayout: 'portrait',
    highlight: 'won Best Portuguese Horror Short at MOTELX 2025',
    summary: 'As Sound Director, I carried the film from on-set recording through orchestral composition and recording, editing, sound design, and final mix. The 18-minute horror short follows a renowned cellist-composer who imprisons his student and turns the student’s suffering into material for a new composition. The film screened at FESTin and won Best Portuguese Horror Short at MOTELX 2025; its score was nominated for Best Composition at Prémio Curtas 2026.',
  },
  'unveiling-new-futures': {
    mediaLayout: 'landscape',
    highlight: 'Universidade Lusófona’s 2025 international campaign',
    summary: 'Sound-directed and composed two films for Universidade Lusófona’s 2025 international campaign. I captured the production sound, built a shared musical and sonic language across both deliverables, and handled the original scores, mixes, and final delivery.',
  },
  'o-clube': {
    mediaLayout: 'portrait',
    highlight: 'Sound Editor on seasons 6 and 7 at AMMP',
    summary: 'Worked as Sound Editor on seasons 6 and 7 at AMMP for the OPTO/SIC series, recording surround ambiences across Lisbon, editing the series\' environmental beds, and creating sound effects for the 2025 seasons.',
  },
  'this-feminine-side': {
    mediaLayout: 'portrait',
    highlight: 'animated documentary about Lisbon’s LGBTQ+ artistic scene',
    summary: 'Directed and built the sound world for Alice Siniscalchi’s animated documentary about Lisbon’s LGBTQ+ artistic scene and femininity beyond the binary. I handled sound design and editing with assistance from Miguel Colimão, supporting its layered interviews, collaborative workshops, and mixed-media animation. The film joined the ITFS 2026 student competition.',
  },
  'ep-rinoceronte': {
    mediaLayout: 'portrait',
    highlight: 'funded through Política Nacional Aldir Blanc',
    summary: 'Directed sound and video for Luzo Cairo’s six-track EP in Palmas. I carried composition support, recording, production, mix, master, video, distribution, and the live stream through release, completing the full arc of a locally made record funded through Política Nacional Aldir Blanc.',
  },
  trisal: {
    mediaLayout: 'portrait',
    highlight: 'premiered at CineSesc Araguaína on 10 June 2026',
    summary: 'Led sound direction on “Isso de novo não tem nada!”, episode 2 of Artpalco’s Tocantins-made comedy about contemporary relationships. Produced with Grupo Tukan, it premiered at CineSesc Araguaína on 10 June 2026.',
  },
  'el-tono-del-mar': {
    mediaLayout: 'landscape',
    highlight: 'won Pixelatl’s 2024 Best Mexican Student Short Film award',
    summary: 'Worked as Sound Assistant and Sound Editor on Mica Bolaños Meade’s animated short, contributing through sound assistance, sound editing, and sound design. The film won Pixelatl’s 2024 Best Mexican Student Short Film award and screened at GIFF and in CINANIMA’s international student competition.',
  },
  'kakofoni-orquestra': {
    mediaLayout: 'portrait',
    highlight: 'entered the collection of the Madison Museum of Art and Technology',
    summary: 'Built the Web Audio engine and FFT-driven Hydra colour reactivity with Rangga Purnama Aji, joining sound and image inside one running generative system. Published on fxhash in 2022, edition #37 entered the collection of the Madison Museum of Art and Technology.',
  },
  'em-agosto-chove': {
    mediaLayout: 'landscape',
    highlight: 'three singles, one album, and a live recording for Bem Ali Sessions',
    summary: 'Composer, guitarist, and producer in the Palmas band Em Agosto Chove from 2015 to 2021. Across six years we released three singles, one album, and a live recording for Bem Ali Sessions, building a catalogue rooted in the independent Tocantins music scene.',
  },
  'ai-am': {
    mediaLayout: 'portrait',
    highlight: 'Composed the film’s original score',
    summary: 'Composed the film’s original score for Danny J’s independently produced 2024 science-fiction short. The music frames a post-apocalyptic encounter between one of the last human survivors and an obsolete AI sentry, balancing human vulnerability against automated control.',
  },
  'unconscious-vision': {
    mediaLayout: 'portrait',
    highlight: 'full sound design from scratch through final mix',
    summary: 'Worked as Sound Designer and Sound Mixer on this 2024 Universidade Lusófona horror short, creating the full sound design from scratch through final mix. Ambience, room tone, restrained impacts, and unresolved tails shape what the audience almost hears before the image confirms it.',
  },
  'arvore-seca': {
    mediaLayout: 'portrait',
    highlight: 'co-founding Festival Som na Árvore 2019',
    summary: 'Spent two and a half years at Produtora Árvore Seca as a studio and live sound engineer, producer, and festival organiser. The period joined recording, mixing, mastering, FOH, monitor engineering, cultural funding, and co-founding Festival Som na Árvore 2019 inside the Palmas independent scene.',
  },
  lucy: {
    mediaLayout: 'portrait',
    highlight: 'sixteen published editions generated from runs that are never exactly repeated',
    summary: 'Created an autonomous generative audiovisual system in Max, Ableton Live, and Hydra.js, composing music and reactive visuals through probabilistic MIDI, custom sample pools, and real-time section changes. Published across Teia and fxhash, LUCY comprises sixteen published editions generated from runs that are never exactly repeated.',
  },
};

const disciplineGroups = {
  cinema: [
    'a-quermesse',
    'ai-am',
    'bed-time',
    'caio',
    'el-tono-del-mar',
    'futuro-realizado',
    'o-clube',
    'o-compositor',
    'this-feminine-side',
    'ticha-penicheiro',
    'trisal',
    'unconscious-vision',
    'unveiling-new-futures',
  ],
  music: [
    'bem-ali-sessions',
    'em-agosto-chove',
    'ep-rinoceronte',
    'invasao-do-pequi',
  ],
  production: ['arvore-seca'],
  generative: [
    'eletronik-fields',
    'fxhash',
    'kakofoni-orquestra',
    'lucy',
  ],
  tools: ['rc-surface', 'rc-setlist', 'ableton-mcp-server'],
};

const expectedDisciplineById = Object.fromEntries(
  Object.entries(disciplineGroups).flatMap(([discipline, ids]) => (
    ids.map((id) => [id, discipline])
  )),
);

function frontmatterValue(source, key) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  assert.ok(frontmatter, 'project frontmatter not found');
  const raw = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  assert.ok(raw, `project frontmatter is missing ${key}`);
  const unquoted = raw.replace(/^(["'])(.*)\1$/, '$2');
  return /^\d+$/.test(unquoted) ? Number(unquoted) : unquoted;
}

function optionalFrontmatterValue(source, key) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  const raw = frontmatter?.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  return raw?.replace(/^(["'])(.*)\1$/, '$2');
}

function readProjects() {
  return readdirSync(projectsDir)
    .filter((file) => extname(file) === '.md')
    .sort()
    .map((file) => {
      const source = readFileSync(new URL(`../src/content/projects/${file}`, import.meta.url), 'utf8');
      return {
        id: basename(file, '.md'),
        data: {
          title: frontmatterValue(source, 'title'),
          year: frontmatterValue(source, 'year'),
          role: optionalFrontmatterValue(source, 'role'),
          type: optionalFrontmatterValue(source, 'type'),
          production: optionalFrontmatterValue(source, 'production'),
        },
      };
    });
}

test('exports the exact frozen tiers and discipline map', () => {
  assert.deepEqual(FEATURED_WORK_IDS, expectedFeaturedIds);
  assert.deepEqual(MORE_WORK_IDS, expectedMoreIds);
  assert.deepEqual(DISCIPLINE_BY_ID, expectedDisciplineById);

  const tierIds = [...FEATURED_WORK_IDS, ...MORE_WORK_IDS];
  assert.equal(tierIds.length, 18);
  assert.equal(new Set(tierIds).size, 18);
  assert.equal(Object.keys(DISCIPLINE_BY_ID).length, 25);
  assert.ok(Object.isFrozen(FEATURED_WORK_IDS));
  assert.ok(Object.isFrozen(MORE_WORK_IDS));
  assert.ok(Object.isFrozen(DISCIPLINE_BY_ID));
});

test('builds a frozen presentation of all 25 real projects', () => {
  const projects = readProjects();
  const presentation = buildWorkPresentation(projects);

  assert.equal(projects.length, 25);
  assert.deepEqual(presentation.featured.map(({ id }) => id), expectedFeaturedIds);
  assert.deepEqual(presentation.more.map(({ id }) => id), expectedMoreIds);
  assert.equal(presentation.archive.length, 25);
  assert.deepEqual(
    Object.fromEntries(presentation.archive.map(({ id, presentation: metadata }) => [id, metadata.discipline])),
    expectedDisciplineById,
  );

  assert.ok(Object.isFrozen(presentation));
  assert.ok(Object.isFrozen(presentation.featured));
  assert.ok(Object.isFrozen(presentation.more));
  assert.ok(Object.isFrozen(presentation.archive));
  for (const entry of presentation.archive) {
    assert.ok(Object.isFrozen(entry));
    assert.ok(Object.isFrozen(entry.data));
    assert.ok(Object.isFrozen(entry.presentation));
  }
});

test('every project card has the complete editorial metadata pattern', () => {
  const presentation = buildWorkPresentation(readProjects());

  for (const project of presentation.archive) {
    assert.ok(project.data.title, `${project.id} is missing a title`);
    assert.ok(project.presentation.discipline, `${project.id} is missing a genre`);
    assert.ok(project.data.role, `${project.id} is missing a role`);
    assert.ok(project.data.year, `${project.id} is missing a year`);
    assert.ok(project.data.type, `${project.id} is missing a type`);
    assert.ok(project.data.production, `${project.id} is missing a production/context`);
  }
});

test('project case copy keeps the verified Ableton, MOTELX, and Spotify facts', () => {
  const ableton = readFileSync(new URL('../src/content/projects/ableton-mcp-server.md', import.meta.url), 'utf8');
  const compositor = readFileSync(new URL('../src/content/projects/o-compositor.md', import.meta.url), 'utf8');
  const arvoreSeca = readFileSync(new URL('../src/content/projects/arvore-seca.md', import.meta.url), 'utf8');
  const motelxWinnersUrl = 'https://www.motelx.org/noticias/motelx-2025-os-vencedores-da-19-a-edicao';

  assert.match(ableton, /75 tools in v0\.5\.3/);
  assert.match(
    ableton,
    /one grouped undo step; successful earlier commands persist if a later command fails/,
  );
  assert.doesNotMatch(ableton, /65 tools/);
  assert.doesNotMatch(ableton, /atomic batch|with rollback/i);
  assert.equal(compositor.split(motelxWinnersUrl).length - 1, 2);
  assert.doesNotMatch(compositor, /conhece-os-candidatos-ao-premio-motelx/);
  assert.doesNotMatch(arvoreSeca, /Spotify URL has not yet been discovered/i);
  assert.doesNotMatch(
    arvoreSeca,
    /Spotify[\s\S]{0,160}(?:isn't currently discoverable|direct link here)/i,
  );
});

test('decorates exactly thirteen featured projects with approved summaries and media layouts', () => {
  const presentation = buildWorkPresentation(readProjects());
  const featuredMetadata = Object.fromEntries(
    presentation.featured.map(({ id, presentation: metadata }) => [id, {
      mediaLayout: metadata.mediaLayout,
      highlight: metadata.highlight,
      summary: metadata.summary,
    }]),
  );
  const summarizedArchiveEntries = presentation.archive.filter(
    ({ presentation: metadata }) => typeof metadata.summary === 'string' && metadata.summary.trim() !== '',
  );

  assert.deepEqual(featuredMetadata, expectedFeaturedPresentation);
  assert.equal(summarizedArchiveEntries.length, 13);
  assert.deepEqual(summarizedArchiveEntries.map(({ id }) => id).sort(), [...expectedFeaturedIds].sort());
  assert.ok(presentation.featured.every(({ presentation: metadata }) => (
    ['portrait', 'landscape'].includes(metadata.mediaLayout)
  )));
  assert.ok(presentation.more.every(({ presentation: metadata }) => (
    metadata.summary === undefined && metadata.mediaLayout === undefined
  )));
});

test('sorts the archive by latest year descending and title ascending', () => {
  const archiveIds = buildWorkPresentation(readProjects()).archive.map(({ id }) => id);

  assert.deepEqual(archiveIds, [
    'a-quermesse',
    'ableton-mcp-server',
    'fxhash',
    'rc-setlist',
    'rc-surface',
    'trisal',
    'ep-rinoceronte',
    'ticha-penicheiro',
    'o-clube',
    'this-feminine-side',
    'unveiling-new-futures',
    'ai-am',
    'bed-time',
    'caio',
    'futuro-realizado',
    'invasao-do-pequi',
    'o-compositor',
    'unconscious-vision',
    'el-tono-del-mar',
    'eletronik-fields',
    'kakofoni-orquestra',
    'arvore-seca',
    'bem-ali-sessions',
    'em-agosto-chove',
    'lucy',
  ]);
});

test('uses the ID as a deterministic final archive tiebreaker', () => {
  const tiedIds = new Set(['ai-am', 'bed-time']);
  const projects = readProjects().map((project) => (
    tiedIds.has(project.id)
      ? { ...project, data: { title: 'Same title', year: 2099 } }
      : project
  ));
  const tiedArchiveIds = (entries) => buildWorkPresentation(entries).archive
    .filter(({ id }) => tiedIds.has(id))
    .map(({ id }) => id);

  assert.deepEqual(tiedArchiveIds(projects), ['ai-am', 'bed-time']);
  assert.deepEqual(tiedArchiveIds([...projects].reverse()), ['ai-am', 'bed-time']);
});

test('rejects missing, duplicate, and unclassified project IDs explicitly', () => {
  const projects = readProjects();
  const compositor = projects.find(({ id }) => id === 'o-compositor');

  assert.throws(
    () => buildWorkPresentation(projects.filter(({ id }) => id !== 'o-compositor')),
    /Missing required work ID: o-compositor/,
  );
  assert.throws(
    () => buildWorkPresentation([...projects, compositor]),
    /Duplicate work ID: o-compositor/,
  );
  assert.throws(
    () => buildWorkPresentation([
      ...projects,
      { id: 'unclassified', data: { title: 'Unclassified', year: 2026 } },
    ]),
    /Missing discipline(?: for work ID)?: unclassified/,
  );
});

test('rejects a missing classified archive project explicitly', () => {
  assert.throws(
    () => buildWorkPresentation(readProjects().filter(({ id }) => id !== 'bed-time')),
    /Missing archive project: bed-time/,
  );
});

test('rejects inherited object keys as unclassified project IDs', () => {
  assert.throws(
    () => buildWorkPresentation([
      ...readProjects(),
      { id: 'toString', data: { title: 'Prototype key', year: 2026 } },
    ]),
    /Missing discipline: toString/,
  );
});
