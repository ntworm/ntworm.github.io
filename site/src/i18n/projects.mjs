/**
 * Merges a Portuguese project translation over its English source entry.
 *
 * The English file in `src/content/projects/` stays the single source of
 * truth for facts that do not change with language (year, URLs, media,
 * embeds). A translation in `src/content/projects-pt-br/` only carries the
 * words: titles, credits, labels, and the case-study prose. Lists are matched
 * by a stable key (link URL, season image, piece slug), so a link added to
 * the English file still appears in Portuguese, with its English label,
 * until the translation catches up.
 */

function byKey(items, key, value) {
  return new Map((items ?? []).map((item) => [item[key], item[value]]));
}

export function localizeProjectData(data, translation) {
  if (!translation) return data;

  const linkLabels = byKey(translation.links, 'url', 'label');
  const seasonLabels = byKey(translation.seasons, 'img', 'label');
  const pieceDescriptions = byKey(translation.fxhashPieces, 'slug', 'desc');

  return {
    ...data,
    title: translation.title ?? data.title,
    role: translation.role ?? data.role,
    country: translation.country ?? data.country,
    type: translation.type ?? data.type,
    production: translation.production ?? data.production,
    awards: translation.awards ?? data.awards,
    links: data.links?.map((link) => ({ ...link, label: linkLabels.get(link.url) ?? link.label })),
    seasons: data.seasons?.map((season) => ({ ...season, label: seasonLabels.get(season.img) ?? season.label })),
    interactiveEmbed: data.interactiveEmbed && { ...data.interactiveEmbed, ...translation.interactiveEmbed },
    fxhashPieces: data.fxhashPieces?.map((piece) => ({ ...piece, desc: pieceDescriptions.get(piece.slug) ?? piece.desc })),
  };
}

/**
 * Returns the project entry in the requested locale. The Portuguese entry
 * keeps the English entry's id so routes, media folders and presentation
 * tiers line up; its body and rendered HTML come from the translation.
 */
export function localizeProjectEntry(entry, translation, locale) {
  if (locale !== 'pt' || !translation) return entry;
  return {
    ...translation,
    id: entry.id,
    data: localizeProjectData(entry.data, translation.data),
  };
}
