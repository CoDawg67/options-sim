import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { NormalizedJob } from "./types";
import { jobSlug } from "./slug";

export interface UpsertResult {
  seen: number;
  created: number;
  updated: number;
  errors: string[];
}

// Upserts on the (source, external_id) unique constraint — re-running an
// import never creates duplicates, it just refreshes changed fields.
export async function upsertJobs(
  supabase: SupabaseClient<Database>,
  companyId: string,
  companySlug: string,
  jobs: NormalizedJob[]
): Promise<UpsertResult> {
  const result: UpsertResult = { seen: jobs.length, created: 0, updated: 0, errors: [] };
  if (jobs.length === 0) return result;

  const { data: existing, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, source, external_id")
    .eq("company_id", companyId)
    .in(
      "external_id",
      jobs.map((j) => j.externalId)
    );

  if (fetchErr) {
    result.errors.push(`fetch existing jobs for ${companySlug}: ${fetchErr.message}`);
    return result;
  }

  const existingIds = new Set((existing ?? []).map((r) => `${r.source}:${r.external_id}`));

  const rows = jobs.map((job) => ({
    company_id: companyId,
    title: job.title,
    slug: jobSlug(companySlug, job.title, job.externalId),
    description_snippet: job.descriptionSnippet,
    source_url: job.sourceUrl,
    apply_url: job.applyUrl,
    location_raw: job.locationRaw,
    city: job.city,
    region: job.region,
    country: job.country,
    remote_type: job.remoteType,
    salary_min: job.salaryMin,
    salary_max: job.salaryMax,
    salary_currency: job.salaryCurrency,
    salary_period: job.salaryPeriod,
    employment_type: job.employmentType,
    posted_at: job.postedAt,
    source: job.source,
    external_id: job.externalId,
    is_active: true,
  }));

  const { error: upsertErr } = await supabase
    .from("jobs")
    .upsert(rows, { onConflict: "source,external_id" });

  if (upsertErr) {
    result.errors.push(`upsert jobs for ${companySlug}: ${upsertErr.message}`);
    return result;
  }

  for (const job of jobs) {
    if (existingIds.has(`${job.source}:${job.externalId}`)) result.updated++;
    else result.created++;
  }

  return result;
}

// HN jobs don't have a pre-existing company row — find-or-create by slug
// (ats_type "manual") before upserting the job itself.
export async function upsertHnCompanyAndJob(
  supabase: SupabaseClient<Database>,
  job: { companySlug: string; companyName: string } & NormalizedJob
): Promise<{ created: boolean; updated: boolean; error?: string }> {
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .upsert(
      { slug: job.companySlug, name: job.companyName, ats_type: "manual", is_active: true },
      { onConflict: "slug", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (companyErr || !company) {
    return { created: false, updated: false, error: companyErr?.message ?? "no company row returned" };
  }

  const result = await upsertJobs(supabase, company.id, job.companySlug, [job]);
  if (result.errors.length) return { created: false, updated: false, error: result.errors[0] };
  return { created: result.created > 0, updated: result.updated > 0 };
}
