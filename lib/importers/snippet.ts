// Store only a short snippet, never the full description — per the brief,
// full descriptions are copyright-owned by the source and we always link out.
const MAX_SNIPPET_LEN = 300;

export function toSnippet(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;
  if (text.length <= MAX_SNIPPET_LEN) return text;

  const truncated = text.slice(0, MAX_SNIPPET_LEN);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : MAX_SNIPPET_LEN)}…`;
}
