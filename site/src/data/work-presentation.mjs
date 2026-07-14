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
  caio: 'cinema',
  'el-tono-del-mar': 'cinema',
  'futuro-realizado': 'cinema',
  'o-clube': 'cinema',
  'o-compositor': 'cinema',
  'this-feminine-side': 'cinema',
  'ticha-penicheiro': 'cinema',
  trisal: 'cinema',
  'unconscious-vision': 'cinema',
  'unveiling-new-futures': 'cinema',
  'arvore-seca': 'music',
  'bem-ali-sessions': 'music',
  'em-agosto-chove': 'music',
  'ep-rinoceronte': 'music',
  'invasao-do-pequi': 'music',
  'eletronik-fields': 'generative',
  fxhash: 'generative',
  'kakofoni-orquestra': 'generative',
  lucy: 'generative',
  'rc-surface': 'tools',
});

const REQUIRED_WORK_IDS = [...FEATURED_WORK_IDS, ...MORE_WORK_IDS];

function latestYear(year) {
  const years = String(year).match(/\d{4}/g)?.map(Number) ?? [];
  return Math.max(...years);
}

export function buildWorkPresentation(projects) {
  const projectsById = new Map();

  for (const project of projects) {
    if (projectsById.has(project.id)) {
      throw new Error(`Duplicate work ID: ${project.id}`);
    }
    projectsById.set(project.id, project);
  }

  for (const id of REQUIRED_WORK_IDS) {
    if (!projectsById.has(id)) {
      throw new Error(`Missing required work ID: ${id}`);
    }
  }

  for (const id of Object.keys(DISCIPLINE_BY_ID)) {
    if (!projectsById.has(id)) {
      throw new Error(`Missing archive project: ${id}`);
    }
  }

  const decoratedById = new Map();
  for (const project of projects) {
    if (!Object.hasOwn(DISCIPLINE_BY_ID, project.id)) {
      throw new Error(`Missing discipline: ${project.id}`);
    }
    const discipline = DISCIPLINE_BY_ID[project.id];

    decoratedById.set(project.id, Object.freeze({
      ...project,
      data: Object.freeze({ ...project.data }),
      presentation: Object.freeze({ discipline }),
    }));
  }

  const archive = Object.freeze(
    [...decoratedById.values()].sort((left, right) => (
      latestYear(right.data.year) - latestYear(left.data.year)
      || left.data.title.localeCompare(right.data.title, 'en')
      || left.id.localeCompare(right.id, 'en')
    )),
  );

  return Object.freeze({
    featured: Object.freeze(FEATURED_WORK_IDS.map((id) => decoratedById.get(id))),
    more: Object.freeze(MORE_WORK_IDS.map((id) => decoratedById.get(id))),
    archive,
  });
}
