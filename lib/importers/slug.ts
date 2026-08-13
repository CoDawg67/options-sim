export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Job slugs need to be globally unique (see jobs.slug unique constraint),
// so include company + a short id fragment rather than just the title.
export function jobSlug(companySlug: string, title: string, externalId: string): string {
  const idFragment = slugify(externalId).slice(0, 8) || Math.random().toString(36).slice(2, 8);
  return `${slugify(title)}-at-${companySlug}-${idFragment}`;
}
