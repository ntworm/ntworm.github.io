/**
 * Locale routing for the bilingual portfolio.
 *
 * English is the default and lives at the site root. Brazilian Portuguese
 * mirrors every page under `/pt-br/`. Components read the locale from the
 * page URL, so the same chapter components render either language without
 * threading a prop through every page.
 *
 * Internal locale keys are short (`en`, `pt`); the public URL prefix and the
 * `lang` attribute carry the regional variant (`pt-br`, `pt-BR`).
 */

export const DEFAULT_LOCALE = 'en';

export const LOCALES = Object.freeze(['en', 'pt']);

export const LOCALE_META = Object.freeze({
  en: Object.freeze({
    prefix: '',
    htmlLang: 'en',
    hreflang: 'en',
    ogLocale: 'en_US',
    label: 'EN',
    name: 'English',
  }),
  pt: Object.freeze({
    prefix: '/pt-br',
    htmlLang: 'pt-BR',
    hreflang: 'pt-BR',
    ogLocale: 'pt_BR',
    label: 'PT-BR',
    name: 'Português (Brasil)',
  }),
});

const PT_PREFIX = LOCALE_META.pt.prefix;

function hasPtPrefix(pathname) {
  return pathname === PT_PREFIX || pathname.startsWith(PT_PREFIX + '/');
}

/** Locale of a page, read from its pathname (or URL). */
export function localeFromPath(pathnameOrUrl) {
  const pathname = typeof pathnameOrUrl === 'string' ? pathnameOrUrl : pathnameOrUrl?.pathname ?? '/';
  return hasPtPrefix(pathname.toLowerCase()) ? 'pt' : DEFAULT_LOCALE;
}

/** Removes the locale prefix, returning the English (root) path. */
export function unlocalizePath(path) {
  if (!hasPtPrefix(path.toLowerCase())) return path;
  const rest = path.slice(PT_PREFIX.length);
  return rest === '' ? '/' : rest.startsWith('/') ? rest : '/' + rest;
}

/**
 * Maps a root-relative path (`/`, `/#work`, `/work/lucy`) into the given
 * locale. External URLs, mailto links and in-page anchors pass through.
 */
export function localizePath(path, locale = DEFAULT_LOCALE) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return path;
  const base = unlocalizePath(path);
  if (locale !== 'pt') return base;
  return PT_PREFIX + base;
}

/** The same page in every locale, keyed by locale. */
export function alternatePaths(pathname) {
  const base = unlocalizePath(pathname);
  return Object.fromEntries(LOCALES.map((locale) => [locale, localizePath(base, locale)]));
}
