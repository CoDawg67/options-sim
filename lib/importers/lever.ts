import type { CompanyForImport, NormalizedJob } from "./types";
import { titleMatchesTargetRoles, detectRemoteType } from "./filter";
import { parseLocation } from "./location";
import { toSnippet } from "./snippet";

// Public Postings API, no auth. Verified against
// https://github.com/lever/postings-api (README.md), Aug 2026.
//   GET https://api.lever.co/v0/postings/{site}?mode=json
// Fields: id, text (title), categories { location, commitment, team, department },
//         country, createdAt, hostedUrl, applyUrl, workplaceType, salaryRange, descriptionPlain

interface LeverPosting {
  id: string;
  text: string;
  categories: {
    location?: string;
    department?: string;
    team?: string;
    commitment?: string;
  };
  country?: string;
  createdAt: number; // epoch ms
  hostedUrl: string;
  applyUrl: string;
  workplaceType?: string; // "remote" | "hybrid" | "on-site" | "unspecified"
  descriptionPlain?: string;
  salaryRange?: { currency: string; interval: string; min: number; max: number };
}

export async function importLever(company: CompanyForImport): Promise<NormalizedJob[]> {
  if (!company.ats_identifier) return [];

  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(
    company.ats_identifier
  )}?mode=json`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Lever ${company.slug}: ${res.status} ${res.statusText}`);
  }

  const postings = (await res.json()) as LeverPosting[];

  return postings
    .filter((p) => titleMatchesTargetRoles(p.text))
    .map((p): NormalizedJob => {
      const locationRaw = p.categories?.location ?? null;
      const { city, region, country } = parseLocation(locationRaw);

      const salaryPeriod =
        p.salaryRange?.interval === "year" || p.salaryRange?.interval === "month" || p.salaryRange?.interval === "hour"
          ? p.salaryRange.interval
          : null;

      return {
        title: p.text,
        descriptionSnippet: toSnippet(p.descriptionPlain),
        sourceUrl: p.hostedUrl,
        applyUrl: p.applyUrl,
        locationRaw,
        city,
        region,
        country: country ?? p.country ?? null,
        remoteType: detectRemoteType({
          title: p.text,
          locationRaw,
          workplaceType: p.workplaceType,
        }),
        salaryMin: p.salaryRange?.min ?? null,
        salaryMax: p.salaryRange?.max ?? null,
        salaryCurrency: p.salaryRange?.currency ?? null,
        salaryPeriod,
        employmentType: p.categories?.commitment ?? null,
        postedAt: new Date(p.createdAt).toISOString(),
        source: "lever",
        externalId: p.id,
      };
    });
}
