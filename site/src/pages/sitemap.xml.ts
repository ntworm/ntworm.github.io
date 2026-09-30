import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { LOCALES, localizePath } from '../i18n/locales.mjs';
import { buildCanonical } from '../utils/seo.mjs';

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site?.origin ?? url.origin;
  const projects = await getCollection('projects');
  const paths = ['/', ...projects.map((project) => '/work/' + project.id + '/')];
  const urls = LOCALES.flatMap((locale) => paths.map((path) => buildCanonical(origin, localizePath(path, locale))));
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map((loc) => '  <url><loc>' + escapeXml(loc) + '</loc></url>').join('\n')
    + '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
