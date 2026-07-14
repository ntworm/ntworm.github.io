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
  'unveiling-new-futures',
  'o-clube',
  'this-feminine-side',
  'ep-rinoceronte',
  'trisal',
  'el-tono-del-mar',
  'kakofoni-orquestra',
];

const expectedMoreIds = [
  'a-quermesse',
  'ticha-penicheiro',
  'em-agosto-chove',
  'eletronik-fields',
  'rc-surface',
  'fxhash',
];

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
    'arvore-seca',
    'bem-ali-sessions',
    'em-agosto-chove',
    'ep-rinoceronte',
    'invasao-do-pequi',
  ],
  generative: [
    'eletronik-fields',
    'fxhash',
    'kakofoni-orquestra',
    'lucy',
  ],
  tools: ['rc-surface'],
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
        },
      };
    });
}

test('exports the exact frozen tiers and discipline map', () => {
  assert.deepEqual(FEATURED_WORK_IDS, expectedFeaturedIds);
  assert.deepEqual(MORE_WORK_IDS, expectedMoreIds);
  assert.deepEqual(DISCIPLINE_BY_ID, expectedDisciplineById);

  const tierIds = [...FEATURED_WORK_IDS, ...MORE_WORK_IDS];
  assert.equal(tierIds.length, 14);
  assert.equal(new Set(tierIds).size, 14);
  assert.equal(Object.keys(DISCIPLINE_BY_ID).length, 23);
  assert.ok(Object.isFrozen(FEATURED_WORK_IDS));
  assert.ok(Object.isFrozen(MORE_WORK_IDS));
  assert.ok(Object.isFrozen(DISCIPLINE_BY_ID));
});

test('builds a frozen presentation of all 23 real projects', () => {
  const projects = readProjects();
  const presentation = buildWorkPresentation(projects);

  assert.equal(projects.length, 23);
  assert.deepEqual(presentation.featured.map(({ id }) => id), expectedFeaturedIds);
  assert.deepEqual(presentation.more.map(({ id }) => id), expectedMoreIds);
  assert.equal(presentation.archive.length, 23);
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

test('sorts the archive by latest year descending and title ascending', () => {
  const archiveIds = buildWorkPresentation(readProjects()).archive.map(({ id }) => id);

  assert.deepEqual(archiveIds, [
    'a-quermesse',
    'fxhash',
    'trisal',
    'ep-rinoceronte',
    'ticha-penicheiro',
    'o-clube',
    'rc-surface',
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
    () => buildWorkPresentation(readProjects().filter(({ id }) => id !== 'ai-am')),
    /Missing archive project: ai-am/,
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
