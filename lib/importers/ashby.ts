import type { CompanyForImport, NormalizedJob } from "./types";
import { titleMatchesTargetRoles, detectRemoteType } from "./filter";
import { parseLocation } from "./location";
import { toSnippet } from "./snippet";

// Public Job Board API, no auth. Endpoint + query param verified against
// https://developers.ashbyhq.com/docs/public-job-posting-api, Aug 2026.
//   GET https://api.ashbyhq.com/posting-api/job-board/{jobBoardName}?includeCompensation=true
// NOTE: exact field names below (isRemote, publishedAt, jobUrl, applyUrl,
// compensation.summaryComponents) are assembled from third-party integration
// references, not a live fetch — this sandbox's egress proxy blocks
// api.ashbyhq.com directly. Spot-check the first real import run's raw
// response against this parsing and adjust if any field name is off.

interface AshbyCompensation {
  summaryComponents?: Array<{
    minValue?: number;
    maxValue?: number;
    currencyCode?: string;
    interval?: string; // "year" | "month" | "hour" ...
  }>;
}

interface AshbyJobPosting {
  id: string;
  title: string;
  location?: string;
  isRemote?: boolean;
  employmentType?: string;
  publishedAt?: string;
  jobUrl?: string;
  applyUrl?: string;
  descriptionPlain?: string;
  compensation?: AshbyCompensation;
}

interface AshbyJobBoardResponse {
  jobs: AshbyJobPosting[];
}

export async function importAshby(company: CompanyForImport): Promise<NormalizedJob[]> {
  if (!company.ats_identifier) return [];

  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(
    company.ats_identifier
  )}?includeCompensation=true`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Ashby ${company.slug}: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as AshbyJobBoardResponse;

  return (data.jobs ?? [])
    .filter((job) => titleMatchesTargetRoles(job.title))
    .map((job): NormalizedJob => {
      const locationRaw = job.location ?? null;
      const { city, region, country } = parseLocation(locationRaw);
      const comp = job.compensation?.summaryComponents?.[0];
      const periodRaw = comp?.interval;
      const salaryPeriod =
        periodRaw === "year" || periodRaw === "month" || periodRaw === "hour" ? periodRaw : null;

      const applyUrl = job.applyUrl ?? job.jobUrl ?? "";

      return {
        title: job.title,
        descriptionSnippet: toSnippet(job.descriptionPlain),
        sourceUrl: job.jobUrl ?? applyUrl,
        applyUrl,
        locationRaw,
        city,
        region,
        country,
        remoteType: detectRemoteType({
          explicitRemote: job.isRemote,
          title: job.title,
          locationRaw,
        }),
        salaryMin: comp?.minValue ?? null,
        salaryMax: comp?.maxValue ?? null,
        salaryCurrency: comp?.currencyCode ?? null,
        salaryPeriod,
        employmentType: job.employmentType ?? null,
        postedAt: new Date(job.publishedAt ?? Date.now()).toISOString(),
        source: "ashby",
        externalId: job.id,
      };
    })
    .filter((job) => job.applyUrl); // drop anything we couldn't resolve a link for
}
