// The opening panel alternates disciplines rather than introducing a single
// specialty. Detailed chapters reuse the same projects and case routes.
export const OVERVIEW_WORK_IDS = Object.freeze([
  'ep-rinoceronte',
  'o-compositor',
  'rc-surface',
  'kakofoni-orquestra',
  'em-agosto-chove',
  'this-feminine-side',
  'rc-setlist',
  'lucy',
]);

export const FEATURED_WORK_IDS = Object.freeze([
  'o-compositor',
  'um-certo-joao-silvino',
  'ep-rinoceronte',
  'arvore-seca',
  'em-agosto-chove',
  'this-feminine-side',
  'lucy',
  'aguas-passadas',
  'sopru',
  'trisal',
  'unveiling-new-futures',
  'el-tono-del-mar',
]);

export const MORE_WORK_IDS = Object.freeze([
  'a-quermesse',
  'ticha-penicheiro',
  'eletronik-fields',
  'rc-surface',
  'fxhash',
]);

export const FEATURED_PRESENTATION_BY_ID = Object.freeze({
  'o-compositor': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'won Best Portuguese Horror Short at MOTELX 2025',
    summary: 'As Sound Director, I carried the film from on-set recording through orchestral composition and recording, editing, sound design, and final mix. The 18-minute horror short follows a renowned cellist-composer who imprisons his student and turns the student’s suffering into material for a new composition. The film screened at FESTin and won Best Portuguese Horror Short at MOTELX 2025; its soundtrack was nominated for Best Soundtrack at Prémio Curtas 2026.',
  }),
  'unveiling-new-futures': Object.freeze({
    mediaLayout: 'landscape',
    highlight: 'Universidade Lusófona’s 2025 international campaign',
    summary: 'Sound-directed and composed two films for Universidade Lusófona’s 2025 international campaign. I captured the production sound, built a shared musical and sonic language across both deliverables, and handled the original scores, mixes, and final delivery.',
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
    summary: 'Directed, recorded, and post-produced all the sound of “Isso de novo não tem nada!”, episode 2 of Artpalco’s Tocantins-made comedy about contemporary relationships. Produced with Grupo Tukan, it premiered at CineSesc Araguaína on 10 June 2026.',
  }),
  'el-tono-del-mar': Object.freeze({
    mediaLayout: 'landscape',
    highlight: 'won Pixelatl’s 2024 Best Mexican Student Short Film award',
    summary: 'Worked as Sound Assistant and Sound Editor on Mica Bolaños Meade’s animated short, contributing through sound assistance, sound editing, and sound design. The film won Pixelatl’s 2024 Best Mexican Student Short Film award and screened at GIFF and in CINANIMA’s international student competition.',
  }),
  'em-agosto-chove': Object.freeze({
    mediaLayout: 'landscape',
    highlight: 'three singles, one album, and a live recording for Bem Ali Sessions',
    summary: 'Composer, guitarist, and producer in the Palmas band Em Agosto Chove from 2015 to 2021. Across six years we released three singles, one album, and a live recording for Bem Ali Sessions, building a catalogue rooted in the independent Tocantins music scene.',
  }),
  'arvore-seca': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'co-founding Festival Som na Árvore 2019',
    summary: 'Spent two and a half years at Produtora Árvore Seca as a studio and live sound engineer, producer, and festival organiser. The period joined recording, mixing, mastering, FOH, monitor engineering, cultural funding, and co-founding Festival Som na Árvore 2019 inside the Palmas independent scene.',
  }),
  lucy: Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'sixteen published editions generated from runs that are never exactly repeated',
    summary: 'Created an autonomous generative audiovisual system in Max, Ableton Live, and Hydra.js, composing music and reactive visuals through probabilistic MIDI, custom sample pools, and real-time section changes. Published across Teia and fxhash, LUCY comprises sixteen published editions generated from runs that are never exactly repeated.',
  }),
  'um-certo-joao-silvino': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'screened at the 3rd CINETOCA',
    summary: 'Did the sound post-production of the version of Hélio Brito’s docudrama screened at the 3rd CINETOCA, except the music: dialogue editing, sound editing, foley, and mixing. At the festival the film won four awards, including Best Feature Film by the popular jury.',
  }),
  'aguas-passadas': Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'selected in Ancine’s Novos Realizadores call',
    summary: 'Did the sound post-production of Hélio Brito’s feature documentary on the history of Boa Vista do Tocantins, a project selected in Ancine’s Novos Realizadores call: dialogue editing, sound editing, and mixing in Pro Tools, cleaning and smoothing the interviews and narration across the 89-minute film.',
  }),
  sopru: Object.freeze({
    mediaLayout: 'portrait',
    highlight: 'two Ableton sessions kept in sync by RC Setlist',
    summary: 'Designed the lighting for Soprü’s Cidade do Suor release show and built the system that runs it: the light is written as automation in Ableton Live and sent to LumiKit SHOW, with two Ableton sessions kept in sync by RC Setlist, an extension I built for the band.',
  }),
});

// Brazilian Portuguese copy for the featured cards. Media layout is shared
// with the English entry; each highlight must appear verbatim in its summary.
export const FEATURED_COPY_PT_BY_ID = Object.freeze({
  'o-compositor': Object.freeze({
    highlight: 'venceu o prêmio de Melhor Curta de Terror Portuguesa no MOTELX 2025',
    summary: 'Como diretor de som, conduzi o filme do som direto no set até a mixagem final, passando pela composição e gravação com músicos de orquestra, pela edição e pelo desenho de som. O curta de terror de 18 minutos acompanha um violoncelista e compositor renomado que aprisiona o próprio aluno e transforma o sofrimento dele em matéria-prima para uma nova composição. O filme passou pelo FESTin e venceu o prêmio de Melhor Curta de Terror Portuguesa no MOTELX 2025; a trilha sonora foi indicada a Melhor Banda Sonora no Prémio Curtas 2026.',
  }),
  'unveiling-new-futures': Object.freeze({
    highlight: 'campanha internacional de 2025 da Universidade Lusófona',
    summary: 'Assinei a direção de som e a trilha de dois filmes para a campanha internacional de 2025 da Universidade Lusófona. Captei o som direto, construí uma linguagem musical e sonora comum às duas peças e cuidei das trilhas originais, das mixagens e da entrega final.',
  }),
  'this-feminine-side': Object.freeze({
    highlight: 'documentário animado de Alice Siniscalchi sobre a cena artística LGBTQ+ de Lisboa',
    summary: 'Dirigi e construí o universo sonoro do documentário animado de Alice Siniscalchi sobre a cena artística LGBTQ+ de Lisboa e uma feminilidade para além do binário. Assinei o desenho e a edição de som, com assistência de Miguel Colimão, sustentando as camadas de entrevistas, as oficinas colaborativas e a animação em técnica mista. O filme entrou na competição estudantil do ITFS 2026.',
  }),
  'ep-rinoceronte': Object.freeze({
    highlight: 'viabilizado pela Política Nacional Aldir Blanc',
    summary: 'Dirigi o som e o vídeo do EP de seis faixas de Luzo Cairo, em Palmas. Conduzi o apoio à composição, a gravação, a produção, a mixagem, a masterização, o vídeo, a distribuição e a transmissão ao vivo até o lançamento, completando o ciclo inteiro de um disco feito na própria cidade e viabilizado pela Política Nacional Aldir Blanc.',
  }),
  trisal: Object.freeze({
    highlight: 'estreou no CineSesc Araguaína em 10 de junho de 2026',
    summary: 'Dirigi, gravei e finalizei todo o som de “Isso de novo não tem nada!”, episódio 2 da comédia tocantinense da Artpalco sobre os relacionamentos de hoje. Produzido com o Grupo Tukan, o episódio estreou no CineSesc Araguaína em 10 de junho de 2026.',
  }),
  'el-tono-del-mar': Object.freeze({
    highlight: 'venceu o prêmio de Melhor Curta Estudantil Mexicano do Pixelatl 2024',
    summary: 'Atuei como assistente e editor de som no curta de animação de Mica Bolaños Meade, contribuindo com assistência, edição e desenho de som. O filme venceu o prêmio de Melhor Curta Estudantil Mexicano do Pixelatl 2024 e foi exibido no GIFF e na competição internacional de estudantes do CINANIMA.',
  }),
  'em-agosto-chove': Object.freeze({
    highlight: 'três singles, um álbum e um registro ao vivo para o Bem Ali Sessions',
    summary: 'Compositor, guitarrista e produtor da banda palmense Em Agosto Chove, de 2015 a 2021. Em seis anos, lançamos três singles, um álbum e um registro ao vivo para o Bem Ali Sessions, construindo um catálogo enraizado na cena musical independente do Tocantins.',
  }),
  'arvore-seca': Object.freeze({
    highlight: 'a cofundação do Festival Som na Árvore 2019',
    summary: 'Passei dois anos e meio na Produtora Árvore Seca como técnico de som de estúdio e de palco, produtor e organizador de festivais. O período reuniu gravação, mixagem, masterização, PA, monitor, editais de cultura e a cofundação do Festival Som na Árvore 2019, dentro da cena independente de Palmas.',
  }),
  lucy: Object.freeze({
    highlight: 'dezesseis edições geradas por execuções que nunca se repetem exatamente',
    summary: 'Criei um sistema audiovisual generativo e autônomo em Max, Ableton Live e Hydra.js, que compõe música e visuais reativos a partir de MIDI probabilístico, bancos de samples próprios e mudanças de seção em tempo real. Publicada na Teia e no fxhash, LUCY reúne dezesseis edições geradas por execuções que nunca se repetem exatamente.',
  }),
  'um-certo-joao-silvino': Object.freeze({
    highlight: 'exibida no 3º CINETOCA',
    summary: 'Fiz a pós-produção de som da versão do docudrama de Hélio Brito exibida no 3º CINETOCA, menos a música: edição de diálogos, edição de som, foley e mixagem. No festival, o filme venceu quatro prêmios, entre eles Melhor Longa-metragem pelo Júri Popular.',
  }),
  'aguas-passadas': Object.freeze({
    highlight: 'selecionado no edital Novos Realizadores da Ancine',
    summary: 'Fiz a pós-produção de som do longa documental de Hélio Brito sobre a história de Boa Vista do Tocantins, projeto selecionado no edital Novos Realizadores da Ancine: edição de diálogos, edição de som e mixagem no Pro Tools, limpando e alisando as entrevistas e a narração nos 89 minutos do filme.',
  }),
  sopru: Object.freeze({
    highlight: 'duas sessões do Ableton sincronizadas pelo RC Setlist',
    summary: 'Desenhei a luz do show de lançamento do Cidade do Suor, da Soprü, e construí o sistema que a comanda: a luz é escrita como automação no Ableton Live e enviada ao LumiKit SHOW, com duas sessões do Ableton sincronizadas pelo RC Setlist, uma extensão que fiz para a banda.',
  }),
});

export const DISCIPLINE_LABELS_PT = Object.freeze({
  cinema: 'cinema',
  production: 'produção',
  music: 'música',
  generative: 'arte generativa',
  tools: 'ferramentas',
  'sound art': 'arte sonora',
  performance: 'performance',
});

export const DISCIPLINE_BY_ID = Object.freeze({
  'a-quermesse': 'cinema',
  'aguas-passadas': 'cinema',
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
  'um-certo-joao-silvino': 'cinema',
  'unconscious-vision': 'cinema',
  'unveiling-new-futures': 'cinema',
  'arvore-seca': 'production',
  'conservatorio-orchestra-binaural': 'production',
  'bem-ali-sessions': 'music',
  'em-agosto-chove': 'music',
  'ep-rinoceronte': 'music',
  'errant-space-podcast-117': 'music',
  'invasao-do-pequi': 'music',
  'eletronik-fields': 'generative',
  fxhash: 'generative',
  'kakofoni-orquestra': 'generative',
  lucy: 'generative',
  'rc-surface': 'tools',
  'rc-setlist': 'tools',
  'ableton-mcp-server': 'tools',
  phaseslip: 'tools',
  aafton: 'tools',
  'soundwalking-lisboa': 'sound art',
  'noise-machine': 'sound art',
  'lusofona-av-performance': 'sound art',
  sopru: 'performance',
});

const REQUIRED_WORK_IDS = [...new Set([...OVERVIEW_WORK_IDS, ...FEATURED_WORK_IDS, ...MORE_WORK_IDS])];

// Undated work (no confirmed year) sorts after every dated entry.
function latestYear(year) {
  const years = String(year ?? '').match(/\d{4}/g)?.map(Number) ?? [];
  return years.length > 0 ? Math.max(...years) : -Infinity;
}

function compareLatestYearDescending(left, right) {
  const leftYear = latestYear(left);
  const rightYear = latestYear(right);
  if (leftYear === rightYear) return 0;
  return rightYear > leftYear ? 1 : -1;
}

/**
 * Groups projects into the homepage tiers. Pass `{ locale: 'pt' }` with
 * already-localized project data to get the Portuguese card copy and
 * discipline labels; tiers and archive order are the same in both languages.
 */
export function buildWorkPresentation(projects, { locale = 'en' } = {}) {
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
    const discipline = locale === 'pt'
      ? DISCIPLINE_LABELS_PT[DISCIPLINE_BY_ID[project.id]]
      : DISCIPLINE_BY_ID[project.id];

    const featuredPresentation = Object.hasOwn(FEATURED_PRESENTATION_BY_ID, project.id)
      ? {
          ...FEATURED_PRESENTATION_BY_ID[project.id],
          ...(locale === 'pt' ? FEATURED_COPY_PT_BY_ID[project.id] : {}),
        }
      : {};

    decoratedById.set(project.id, Object.freeze({
      ...project,
      data: Object.freeze({ ...project.data }),
      presentation: Object.freeze({ discipline, ...featuredPresentation }),
    }));
  }

  const archive = Object.freeze(
    [...decoratedById.values()].sort((left, right) => (
      compareLatestYearDescending(left.data.year, right.data.year)
      || left.data.title.localeCompare(right.data.title, 'en')
      || left.id.localeCompare(right.id, 'en')
    )),
  );

  const featured = Object.freeze(FEATURED_WORK_IDS.map((id) => decoratedById.get(id)));
  const more = Object.freeze(MORE_WORK_IDS.map((id) => decoratedById.get(id)));
  const isAudiovisual = (project) => !['tools', 'generative'].includes(DISCIPLINE_BY_ID[project.id]);

  return Object.freeze({
    overview: Object.freeze(OVERVIEW_WORK_IDS.map((id) => decoratedById.get(id))),
    featured,
    more,
    audiovisual: Object.freeze({
      featured: Object.freeze(featured.filter(isAudiovisual)),
      more: Object.freeze(more.filter(isAudiovisual)),
    }),
    archive,
  });
}
