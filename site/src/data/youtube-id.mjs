// A YouTube video id: exactly eleven characters from the URL-safe base64
// alphabet. Shared by the content schema and its test so both check the same
// rule; anything else (a URL, a query string, a script) is rejected.
export const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function isYoutubeId(value) {
  return typeof value === 'string' && YOUTUBE_ID_PATTERN.test(value);
}
