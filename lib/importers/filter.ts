import { titleInclude, titleExclude, remoteKeywords, hybridKeywords } from "@/config/keywords";
import type { RemoteType } from "@/lib/supabase/types";

// Rule-based only — no AI. Substring match against the lowercased title.
export function titleMatchesTargetRoles(title: string): boolean {
  const t = title.toLowerCase();
  if (titleExclude.some((kw) => t.includes(kw))) return false;
  return titleInclude.some((kw) => t.includes(kw));
}

// Prefer an explicit remote flag from the feed when the caller has one;
// otherwise fall back to keyword matching against title + location text.
export function detectRemoteType(opts: {
  explicitRemote?: boolean | null;
  workplaceType?: string | null; // Lever: "remote" | "hybrid" | "on-site" | "unspecified"
  title: string;
  locationRaw: string | null;
}): RemoteType {
  const wt = opts.workplaceType?.toLowerCase();
  if (wt === "remote") return "remote";
  if (wt === "hybrid") return "hybrid";
  if (wt === "on-site" || wt === "onsite") return "onsite";

  if (opts.explicitRemote === true) return "remote";

  const haystack = `${opts.title} ${opts.locationRaw ?? ""}`.toLowerCase();
  if (hybridKeywords.some((kw) => haystack.includes(kw))) return "hybrid";
  if (remoteKeywords.some((kw) => haystack.includes(kw))) return "remote";

  return "onsite";
}
