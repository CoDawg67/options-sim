export function roleDisplayName(roleSlug: string): string {
  return roleSlug
    .split("-")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
