// Store only a short snippet, never the full description — per the brief,
// full descriptions are copyright-owned by the source and we always link out.
const MAX_SNIPPET_LEN = 300;

export function toSnippet(html: string | null | undefined): string | null {
  if (!html) return null;

  // Greenhouse's `content` field HTML-entity-encodes the tags themselves
  // (`&lt;div&gt;` rather than `<div>`), so entities must be decoded before
  // tag-stripping runs — otherwise the tag regex never matches anything and
  // raw markup leaks into the stored snippet (caught on the first real
  // import run). It's also inconsistently *double*-encoded — some entities
  // come through as e.g. "&amp;nbsp;" rather than "&nbsp;" — so the decode
  // pass runs twice to resolve either depth; a second pass is a no-op once
  // nothing's left to decode.
  const decodeEntities = (s: string) =>
    s
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

  const decoded = decodeEntities(decodeEntities(html));

  const text = decoded
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;
  if (text.length <= MAX_SNIPPET_LEN) return text;

  const truncated = text.slice(0, MAX_SNIPPET_LEN);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : MAX_SNIPPET_LEN)}…`;
}
