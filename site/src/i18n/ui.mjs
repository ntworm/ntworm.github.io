/**
 * Interface strings shared across pages: navigation, footer, and the case
 * study template. Chapter prose lives next to its markup in each chapter
 * component so both languages stay side by side while editing.
 */

export const UI = Object.freeze({
  en: Object.freeze({
    'layout.skip': 'Skip to content',
    'layout.description': 'Sound direction, music production, and creative tooling for cinema, performance, and live instruments.',

    'nav.home': 'GW Gabriel Worm — Home',
    'nav.primary': 'Primary',
    'nav.about': 'About',
    'nav.work': 'Work',
    'nav.code': 'Code',
    'nav.contact': 'Contact',
    'nav.language': 'Language',

    'footer.label': 'Footer',
    'footer.email': 'Email',

    'work.cover': 'cover',
    'work.imagePending': 'image pending',

    'case.act': 'ACT',
    'case.year': 'Year',
    'case.role': 'Role',
    'case.country': 'Country',
    'case.type': 'Type',
    'case.production': 'Production',
    'case.awards': 'Awards',
    'case.links': 'Links',
    'case.seasons': 'Seasons',
    'case.visuals': 'Project visuals',
    'case.moreVisuals': 'More visuals',
    'case.visual': 'project visual',
    'case.metadata': 'Project metadata',
    'case.liveWork': 'Live generative work',
    'case.catalog': 'Mini-catalog',
    'case.pieces': 'pieces',
    'case.thumb': 'thumb',
    'case.openOnFxhash': 'Open on fxhash ↗',
    'case.navigation': 'Case navigation',
    'case.previous': '← Previous',
    'case.next': 'Next →',
    'case.allWork': 'All Work',
    'case.live.open': 'Open live work',
    'case.live.frame': 'Interactive artwork',
    'case.live.loadingLabel': 'Loading live work...',
    'case.live.loading': 'Loading live work.',
    'case.live.loaded': 'Live work loaded.',
    'case.live.failed': 'Could not load the live work. Try again.',
  }),
  pt: Object.freeze({
    'layout.skip': 'Pular para o conteúdo',
    'layout.description': 'Direção de som, produção musical e ferramentas criativas para cinema, performance e instrumentos ao vivo.',

    'nav.home': 'GW Gabriel Worm — Início',
    'nav.primary': 'Principal',
    'nav.about': 'Sobre',
    'nav.work': 'Trabalhos',
    'nav.code': 'Código',
    'nav.contact': 'Contato',
    'nav.language': 'Idioma',

    'footer.label': 'Rodapé',
    'footer.email': 'E-mail',

    'work.cover': 'capa',
    'work.imagePending': 'imagem em breve',

    'case.act': 'ATO',
    'case.year': 'Ano',
    'case.role': 'Função',
    'case.country': 'Local',
    'case.type': 'Formato',
    'case.production': 'Produção',
    'case.awards': 'Prêmios',
    'case.links': 'Links',
    'case.seasons': 'Temporadas',
    'case.visuals': 'Imagens do projeto',
    'case.moreVisuals': 'Mais imagens',
    'case.visual': 'imagem do projeto',
    'case.metadata': 'Ficha técnica',
    'case.liveWork': 'Obra generativa ao vivo',
    'case.catalog': 'Minicatálogo',
    'case.pieces': 'peças',
    'case.thumb': 'miniatura',
    'case.openOnFxhash': 'Abrir no fxhash ↗',
    'case.navigation': 'Navegação entre projetos',
    'case.previous': '← Anterior',
    'case.next': 'Próximo →',
    'case.allWork': 'Todos os trabalhos',
    'case.live.open': 'Abrir a obra ao vivo',
    'case.live.frame': 'Obra interativa',
    'case.live.loadingLabel': 'Carregando a obra...',
    'case.live.loading': 'Carregando a obra ao vivo.',
    'case.live.loaded': 'Obra ao vivo carregada.',
    'case.live.failed': 'Não foi possível carregar a obra ao vivo. Tente de novo.',
  }),
});

/** Returns a lookup for one locale that falls back to English per key. */
export function useTranslations(locale) {
  const strings = UI[locale] ?? UI.en;
  return (key) => strings[key] ?? UI.en[key] ?? key;
}
