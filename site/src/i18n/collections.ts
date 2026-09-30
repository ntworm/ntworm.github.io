import { getCollection, type CollectionEntry } from 'astro:content';
import { localizeProjectEntry } from './projects.mjs';

/**
 * Project entries in the requested locale, in the same order as the English
 * collection. Portuguese entries keep the English id and fall back to the
 * English entry when a translation file is missing.
 */
export async function getLocalizedProjects(locale: string): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects');
  if (locale !== 'pt') return projects;

  const translations = new Map((await getCollection('projectsPtBr')).map((entry) => [entry.id, entry]));
  return projects.map((entry) => (
    localizeProjectEntry(entry, translations.get(entry.id), locale) as CollectionEntry<'projects'>
  ));
}
