import type { CompanyForImport, NormalizedJob } from "./types";
import { titleMatchesTargetRoles, detectRemoteType } from "./filter";
import { toSnippet } from "./snippet";

// Public jobs widget endpoint, no auth. Endpoint verified against
// https://help.workable.com/hc/en-us/articles/115012771647 (Using the Workable
// API to create a careers page), Aug 2026.
//   GET https://apply.workable.com/api/v1/widget/accounts/{subdomain}?details=true
// No pagination — one response has every open job for the account.
// NOTE: like Ashby, this sandbox's egress proxy blocks apply.workable.com, so
// field names are assembled from documentation + third-party references
// rather than a live fetch. Spot-check against the first real import run.

interface WorkableJob {
  shortcode: string;
  title: string;
  url: string;
  application_url?: string;
  city?: string;
  country?: string;
  telecommuting?: boolean;
  published_on?: string;
  employment_type?: string;
  description?: string;
}

interface WorkableWidgetResponse {
  jobs: WorkableJob[];
}

export async function importWorkable(company: CompanyForImport): Promise<NormalizedJob[]> {
  if (!company.ats_identifier) return [];

  const url = `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(
    company.ats_identifier
  )}?details=true`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Workable ${company.slug}: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as WorkableWidgetResponse;

  return (data.jobs ?? [])
    .filter((job) => titleMatchesTargetRoles(job.title))
    .map((job): NormalizedJob => {
      const locationRaw = [job.city, job.country].filter(Boolean).join(", ") || null;
      const applyUrl = job.application_url ?? job.url;

      return {
        title: job.title,
        descriptionSnippet: toSnippet(job.description),
        sourceUrl: job.url,
        applyUrl,
        locationRaw,
        city: job.city ?? null,
        region: null,
        country: job.country ?? null,
        remoteType: detectRemoteType({
          explicitRemote: job.telecommuting,
          title: job.title,
          locationRaw,
        }),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        salaryPeriod: null,
        employmentType: job.employment_type ?? null,
        postedAt: new Date(job.published_on ?? Date.now()).toISOString(),
        source: "workable",
        externalId: job.shortcode,
      };
    });
}
