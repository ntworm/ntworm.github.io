# Work Presentation Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a tested, production-ready source of truth for the approved Work hierarchy: eight featured projects, six medium projects, discipline metadata, and a complete chronological archive of all 23 project entries.

**Architecture:** A small ESM module owns presentation order and discipline mapping independently from Astro rendering. It accepts Astro-like collection entries (`{ id, data }`), validates them, decorates them with presentation metadata, and returns featured, medium, and archive tiers. Node's built-in test runner imports the module directly and checks it against the real Markdown filenames and frontmatter.

**Tech Stack:** JavaScript ESM with JSDoc, Node `node:test`, Astro 7 content files, Node 22.12+.

---

## File structure

- Create `site/src/data/work-presentation.mjs`: immutable tier IDs, discipline mapping, validation, and archive ordering.
- Create `site/tests/work-presentation.test.mjs`: direct unit tests against the real 23-project content directory.

The test suite is the first reader of the module. Phase 2 imports the same module from the unified Work chapter; no temporary page markup is introduced in this phase.

### Task 1: Define and verify the Work presentation model

**Files:**
- Create: `site/tests/work-presentation.test.mjs`
- Create: `site/src/data/work-presentation.mjs`

- [ ] **Step 1: Write the failing tests**

Create `site/tests/work-presentation.test.mjs` with:

```js
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import test from 'node:test';

import {
  DISCIPLINE_BY_ID,
  FEATURED_WORK_IDS,
  MORE_WORK_IDS,
  buildWorkPresentation,
} from '../src/data/work-presentation.mjs';

const projectsDir = join(process.cwd(), 'src', 'content', 'projects');

function frontmatterScalar(source, field) {
  const value = source.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  if (!value) throw new Error(`Missing ${field}`);
  return value.replace(/^['"]|['"]$/g, '');
}

function loadProjects() {
  return readdirSync(projectsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(join(projectsDir, file), 'utf8');
      return {
        id: basename(file, '.md'),
        data: {
          title: frontmatterScalar(source, 'title'),
          year: frontmatterScalar(source, 'year'),
        },
      };
    });
}

function latestYear(value) {
  const years = String(value).match(/(?:19|20)\d{2}/g)?.map(Number) ?? [];
  return years.length ? Math.max(...years) : 0;
}

test('featured and medium tiers match the approved curation', () => {
  assert.deepEqual(FEATURED_WORK_IDS, [
    'o-compositor',
    'unveiling-new-futures',
    'o-clube',
    'this-feminine-side',
    'ep-rinoceronte',
    'trisal',
    'el-tono-del-mar',
    'kakofoni-orquestra',
  ]);
  assert.deepEqual(MORE_WORK_IDS, [
    'a-quermesse',
    'ticha-penicheiro',
    'em-agosto-chove',
    'eletronik-fields',
    'rc-surface',
    'fxhash',
  ]);
  assert.equal(new Set([...FEATURED_WORK_IDS, ...MORE_WORK_IDS]).size, 14);
});

test('all 23 project entries are classified and returned in Archive', () => {
  const projects = loadProjects();
  const presentation = buildWorkPresentation(projects);
  const contentIds = projects.map((project) => project.id).sort();
  const archiveIds = presentation.archive.map((project) => project.id).sort();

  assert.equal(projects.length, 23);
  assert.deepEqual(archiveIds, contentIds);
  assert.deepEqual(Object.keys(DISCIPLINE_BY_ID).sort(), contentIds);
  assert.equal(presentation.featured.length, 8);
  assert.equal(presentation.more.length, 6);
  assert.ok(presentation.archive.every((project) => project.presentation.discipline));
});

test('Archive is newest-first and alphabetic inside the same latest year', () => {
  const { archive } = buildWorkPresentation(loadProjects());
  for (let index = 1; index < archive.length; index += 1) {
    const previous = archive[index - 1];
    const current = archive[index];
    const previousYear = latestYear(previous.data.year);
    const currentYear = latestYear(current.data.year);
    assert.ok(previousYear >= currentYear, `${previous.id} must not precede a newer project`);
    if (previousYear === currentYear) {
      assert.ok(
        previous.data.title.localeCompare(current.data.title, 'en') <= 0,
        `${previous.id} and ${current.id} must be alphabetic inside ${currentYear}`,
      );
    }
  }
});

test('invalid content fails loudly instead of producing incomplete tiers', () => {
  const projects = loadProjects();
  assert.throws(
    () => buildWorkPresentation(projects.filter((project) => project.id !== 'o-compositor')),
    /Missing featured project: o-compositor/,
  );
  assert.throws(
    () => buildWorkPresentation([...projects, projects[0]]),
    /Duplicate project id:/,
  );
  assert.throws(
    () => buildWorkPresentation([...projects, { id: 'unclassified', data: { title: 'X', year: 2026 } }]),
    /Missing discipline: unclassified/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the missing module**

Run from `site`:

```powershell
node --test tests/work-presentation.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/data/work-presentation.mjs`.

- [ ] **Step 3: Implement the presentation model**

Create `site/src/data/work-presentation.mjs` with:

```js
export const FEATURED_WORK_IDS = Object.freeze([
  'o-compositor',
  'unveiling-new-futures',
  'o-clube',
  'this-feminine-side',
  'ep-rinoceronte',
  'trisal',
  'el-tono-del-mar',
  'kakofoni-orquestra',
]);

export const MORE_WORK_IDS = Object.freeze([
  'a-quermesse',
  'ticha-penicheiro',
  'em-agosto-chove',
  'eletronik-fields',
  'rc-surface',
  'fxhash',
]);

export const DISCIPLINE_BY_ID = Object.freeze({
  'a-quermesse': 'cinema',
  'ai-am': 'cinema',
  'bed-time': 'cinema',
  'caio': 'cinema',
  'el-tono-del-mar': 'cinema',
  'futuro-realizado': 'cinema',
  'o-clube': 'cinema',
  'o-compositor': 'cinema',
  'this-feminine-side': 'cinema',
  'ticha-penicheiro': 'cinema',
  'trisal': 'cinema',
  'unconscious-vision': 'cinema',
  'unveiling-new-futures': 'cinema',
  'arvore-seca': 'music',
  'bem-ali-sessions': 'music',
  'em-agosto-chove': 'music',
  'ep-rinoceronte': 'music',
  'invasao-do-pequi': 'music',
  'eletronik-fields': 'generative',
  'fxhash': 'generative',
  'kakofoni-orquestra': 'generative',
  'lucy': 'generative',
  'rc-surface': 'tools',
});

function latestYear(value) {
  const years = String(value).match(/(?:19|20)\d{2}/g)?.map(Number) ?? [];
  return years.length ? Math.max(...years) : 0;
}

function withDiscipline(project) {
  const discipline = DISCIPLINE_BY_ID[project.id];
  if (!discipline) throw new Error(`Missing discipline: ${project.id}`);
  return {
    ...project,
    presentation: Object.freeze({ discipline }),
  };
}

/**
 * @template {{ id: string, data: { title: string, year: string | number } }} T
 * @param {T[]} projects
 */
export function buildWorkPresentation(projects) {
  const ids = projects.map((project) => project.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
    throw new Error(`Duplicate project id: ${duplicate}`);
  }

  const byId = new Map(projects.map((project) => [project.id, withDiscipline(project)]));
  for (const id of FEATURED_WORK_IDS) {
    if (!byId.has(id)) throw new Error(`Missing featured project: ${id}`);
  }
  for (const id of MORE_WORK_IDS) {
    if (!byId.has(id)) throw new Error(`Missing medium project: ${id}`);
  }

  const archive = [...byId.values()].sort((left, right) => {
    const yearDifference = latestYear(right.data.year) - latestYear(left.data.year);
    if (yearDifference !== 0) return yearDifference;
    return left.data.title.localeCompare(right.data.title, 'en');
  });

  return Object.freeze({
    featured: Object.freeze(FEATURED_WORK_IDS.map((id) => byId.get(id))),
    more: Object.freeze(MORE_WORK_IDS.map((id) => byId.get(id))),
    archive: Object.freeze(archive),
  });
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run from `site`:

```powershell
node --test tests/work-presentation.test.mjs
```

Expected: 4 tests, 4 pass, 0 fail.

- [ ] **Step 5: Run the complete regression suite**

Run from `site`:

```powershell
npm test
```

Expected: production build succeeds; 37 tests pass, 0 fail. The command may regenerate `src/data/asset-dimensions.json`; do not stage it unless its content changed because of an intentional asset change.

- [ ] **Step 6: Commit the isolated model**

Run from the repository root:

```powershell
git add site/src/data/work-presentation.mjs site/tests/work-presentation.test.mjs
git commit -m "feat: define continuous work presentation model"
```

Expected: one commit containing exactly the new model and its test.

## Self-Review

Spec coverage:

- PASS: approved eight-project order is represented exactly.
- PASS: approved six-project order is represented exactly.
- PASS: all 23 current main project entries are included in Archive and classified.
- PASS: Archive ordering uses the latest year in ranges such as `2024-2025`.
- N/A: visual layout, lighting, Code parity, looping, navigation, and fallbacks belong to later roadmap phases and are not claimed by this plan.

Placeholder scan:

- PASS: no placeholder markers, delegated error handling, or unspecified test steps remain.

Type consistency:

- PASS: tests and implementation consistently use `FEATURED_WORK_IDS`, `MORE_WORK_IDS`, `DISCIPLINE_BY_ID`, `buildWorkPresentation`, and `{ id, data: { title, year } }`.

Execution Consistency Audit evidence:

- PASS Test/implementation trace: the exact array assertions map to exported frozen arrays; completeness maps to the discipline map and archive construction; sort assertions map to `latestYear` plus `localeCompare`; failure assertions map to the three explicit validation errors.
- PASS Per-task command executability: Node's test runner exists in the required Node version, the focused test is created before its first command, and `npm test` is an existing package script.
- PASS File usage audit: `work-presentation.test.mjs` imports and exercises `work-presentation.mjs`; Phase 2 is named as the first production importer without claiming that integration in this phase.
- N/A Spec lifecycle audit: this immutable presentation model has no connect, resume, disconnect, eviction, or retry lifecycle.
- N/A Time source audit: four-digit project years are content ordering values, not runtime timestamps or clocks.
- PASS State scope audit: exported arrays/maps are frozen module constants; `ids`, `uniqueIds`, `byId`, and `archive` are invocation-local and discarded after each build.
- N/A Environment audit: the plan introduces no URLs, sockets, QR codes, or LAN behavior.
- N/A Browser event audit: the plan introduces no browser interaction or E2E coverage.
- PASS Lint/import audit: the repository has no configured linter; all imports are Node built-ins or the module created in the same task, and both focused `node --test` and the Astro production build are executed.
- N/A Non-obvious API audit: the plan uses stable Node ESM, `node:test`, filesystem, array, map, set, regex, and `localeCompare` behavior only.
