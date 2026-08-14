const entities = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  quot: '"',
  '#39': "'",
  '#x27': "'",
};

function decodeHtmlEntities(value) {
  return value.replace(/&(amp|apos|gt|lt|quot|#39|#x27);/gi, (entity) => entities[entity.slice(1, -1).toLowerCase()] ?? entity);
}

function isMarkdownParagraph(value) {
  return !/^(?:#{1,6}\s|(?:[-+*]|\d+[.)])\s|\x60{3}|~~~|>| {4}|\t)/.test(value);
}

function stripMarkdown(value) {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/&(?:amp|apos|gt|lt|quot|#39|#x27);/gi, (entity) => decodeHtmlEntities(entity))
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

export function buildCanonical(origin, path = '/') {
  const base = new URL(origin);
  const input = new URL(path, base);
  const pathname = input.pathname.startsWith('/') ? input.pathname : '/' + input.pathname;
  return base.origin + pathname;
}

export function excerptMarkdown(markdown, limit = 160) {
  const paragraphs = String(markdown ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && isMarkdownParagraph(paragraph));
  const excerpt = paragraphs.map(stripMarkdown).find(Boolean) ?? '';
  if (!excerpt || excerpt.length <= limit) return excerpt;
  const boundary = excerpt.lastIndexOf(' ', limit);
  return boundary > 0 ? excerpt.slice(0, boundary) : excerpt;
}
