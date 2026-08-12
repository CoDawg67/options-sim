import type { CompanyForImport, NormalizedJob } from "./types";
import { titleMatchesTargetRoles, detectRemoteType } from "./filter";
import { parseLocation } from "./location";
import { toSnippet } from "./snippet";

// Public Job Board API, no auth. Verified against
// https://github.com/grnhse/greenhouse-api-docs (source/includes/job-board/_jobs.md), Aug 2026.
//   GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
// Response: { jobs: [{ id, title, updated_at, location: { name }, absolute_url, content, ... }] }

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  first_published?: string;
  absolute_url: string;
  location: { name: string } | null;
  content?: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export async function importGreenhouse(company: CompanyForImport): Promise<NormalizedJob[]> {
  if (!company.ats_identifier) return [];

  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
    company.ats_identifier
  )}/jobs?content=true`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Greenhouse ${company.slug}: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as GreenhouseResponse;

  return data.jobs
    .filter((job) => titleMatchesTargetRoles(job.title))
    .map((job): NormalizedJob => {
      const locationRaw = job.location?.name ?? null;
      const { city, region, country } = parseLocation(locationRaw);

      return {
        title: job.title,
        descriptionSnippet: toSnippet(job.content),
        sourceUrl: job.absolute_url,
        applyUrl: job.absolute_url,
        locationRaw,
        city,
        region,
        country,
        remoteType: detectRemoteType({ title: job.title, locationRaw }),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        salaryPeriod: null,
        employmentType: null,
        postedAt: new Date(job.first_published ?? job.updated_at).toISOString(),
        source: "greenhouse",
        externalId: String(job.id),
      };
    });
}
