import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildCanonical } from '../utils/seo.mjs';

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site, url }) => {
  const origin = site?.origin ?? url.origin;
  const projects = await getCollection('projects');
  const urls = [
    buildCanonical(origin, '/'),
    ...projects.map((project) => buildCanonical(origin, '/work/' + project.id + '/')),
  ];
  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map((loc) => '  <url><loc>' + escapeXml(loc) + '</loc></url>').join('\n')
    + '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
