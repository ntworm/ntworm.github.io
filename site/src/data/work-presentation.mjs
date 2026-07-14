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

export const FEATURED_PRESENTATION_BY_ID = Object.freeze({
  'o-compositor': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'nominated for Best Composition at Prémio Curtas 2026',
    summary: 'As Sound Director, I carried the film from on-set recording through orchestral composition and recording, editing, sound design, and final mix. The 18-minute horror short follows a renowned cellist-composer who imprisons his student and turns the student’s suffering into material for a new composition. The film screened at FESTin and competed for the MOTELX 2025 award for Best Portuguese Horror Short; its score was nominated for Best Composition at Prémio Curtas 2026.',
  }),
  'unveiling-new-futures': Object.freeze({
    mediaLayout: 'landscape',
    highlight: 'Universidade Lusófona’s 2025 international campaign',
    summary: 'Sound-directed and composed two films for Universidade Lusófona’s 2025 international campaign. I captured the production sound, built a shared musical and sonic language across both deliverables, and handled the original scores, mixes, and final delivery.',
  }),
  'o-clube': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'Sound Editor on seasons 6 and 7 at AMMP',
    summary: 'Worked as Sound Editor on seasons 6 and 7 at AMMP for the OPTO/SIC series. My edit centered on Foley, recurring club ambiences, and sound effects; I also recorded production sound and ambiences used as source material across the 2025 seasons.',
  }),
  'this-feminine-side': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'animated documentary about Lisbon’s LGBTQ+ artistic scene',
    summary: 'Directed and built the sound world for Alice Siniscalchi’s animated documentary about Lisbon’s LGBTQ+ artistic scene and femininity beyond the binary. I handled sound design and editing with assistance from Miguel Colimão, supporting its layered interviews, collaborative workshops, and mixed-media animation. The film joined the ITFS 2026 student competition.',
  }),
  'ep-rinoceronte': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'funded through Política Nacional Aldir Blanc',
    summary: 'Directed sound and video for Luzo Cairo’s six-track EP in Palmas. I carried composition support, recording, production, mix, master, video, distribution, and the live stream through release, completing the full arc of a locally made record funded through Política Nacional Aldir Blanc.',
  }),
  trisal: Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'premiered at CineSesc Araguaína on 10 June 2026',
    summary: 'Led sound direction on “Isso de novo não tem nada!”, episode 2 of Artpalco’s Tocantins-made comedy about contemporary relationships. Produced with Grupo Tukan, it premiered at CineSesc Araguaína on 10 June 2026.',
  }),
  'el-tono-del-mar': Object.freeze({
    mediaLayout: 'landscape',
    highlight: 'won Pixelatl’s 2024 Best Mexican Student Short Film award',
    summary: 'Worked as Sound Assistant and Sound Editor on Mica Bolaños Meade’s animated short, recording Foley, editing sound effects, and contributing to its sound design. The film won Pixelatl’s 2024 Best Mexican Student Short Film award and screened at GIFF and in CINANIMA’s international student competition.',
  }),
  'kakofoni-orquestra': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'entered the collection of the Madison Museum of Art and Technology',
    summary: 'Built the Web Audio engine and FFT-driven Hydra colour reactivity with Rangga Purnama Aji, joining sound and image inside one running generative system. Published on fxhash in 2022, edition #37 entered the collection of the Madison Museum of Art and Technology.',
  }),
});

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

    const featuredPresentation = Object.hasOwn(FEATURED_PRESENTATION_BY_ID, project.id)
      ? FEATURED_PRESENTATION_BY_ID[project.id]
      : {};

    decoratedById.set(project.id, Object.freeze({
      ...project,
      data: Object.freeze({ ...project.data }),
      presentation: Object.freeze({ discipline, ...featuredPresentation }),
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
