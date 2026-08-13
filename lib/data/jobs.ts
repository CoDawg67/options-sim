import { createPublicClient } from "@/lib/supabase/public";
import { siteConfig } from "@/config/site";
import { roleSlugs } from "@/config/keywords";
import type { RemoteType } from "@/lib/supabase/types";

export interface JobWithCompany {
  id: string;
  title: string;
  slug: string;
  description_snippet: string | null;
  source_url: string;
  apply_url: string;
  location_raw: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  remote_type: RemoteType;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  employment_type: string | null;
  posted_at: string;
  expires_at: string;
  is_featured: boolean;
  is_paid: boolean;
  company: {
    id: string;
    name: string;
    slug: string;
    website: string | null;
    logo_url: string | null;
  };
}

const JOB_SELECT = `
  id, title, slug, description_snippet, source_url, apply_url,
  location_raw, city, region, country, remote_type,
  salary_min, salary_max, salary_currency, salary_period, employment_type,
  posted_at, expires_at, is_featured, is_paid,
  company:companies!inner ( id, name, slug, website, logo_url )
`;

// Small enough dataset at this scale (target: hundreds, not tens of
// thousands, of live jobs) that fetching once and filtering in memory for
// role/city/remote pages is simpler and fast enough — avoids building a
// dynamic SQL filter DSL for a handful of query shapes.
export async function getAllActiveJobs(): Promise<JobWithCompany[]> {
  // Lets `next build` succeed before Supabase is provisioned (Phase 0's
  // "build works standalone" requirement) — pages just render zero jobs
  // until real env vars are set, rather than failing the whole build.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("posted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as JobWithCompany[];
}

export async function getJobBySlug(slug: string): Promise<JobWithCompany | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("jobs").select(JOB_SELECT).eq("slug", slug).maybeSingle();

  if (error) throw error;
  return (data as unknown as JobWithCompany) ?? null;
}

export async function getCompanyWithJobs(companySlug: string) {
  const supabase = createPublicClient();
  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("id, name, slug, website, logo_url")
    .eq("slug", companySlug)
    .maybeSingle();

  if (companyErr) throw companyErr;
  if (!company) return null;

  const { data: jobs, error: jobsErr } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("company_id", company.id)
    .eq("is_active", true)
    .order("posted_at", { ascending: false });

  if (jobsErr) throw jobsErr;

  return { company, jobs: (jobs ?? []) as unknown as JobWithCompany[] };
}

function titleMatchesRole(title: string, roleSlug: string): boolean {
  const keywords = roleSlugs[roleSlug];
  if (!keywords) return false;
  const t = title.toLowerCase();
  return keywords.some((kw) => t.includes(kw));
}

export function filterByRole(jobs: JobWithCompany[], roleSlug: string): JobWithCompany[] {
  return jobs.filter((j) => titleMatchesRole(j.title, roleSlug));
}

export function filterByRemote(jobs: JobWithCompany[]): JobWithCompany[] {
  return jobs.filter((j) => j.remote_type === "remote");
}

export function filterByCity(jobs: JobWithCompany[], city: string): JobWithCompany[] {
  const target = city.toLowerCase();
  return jobs.filter((j) => j.city?.toLowerCase() === target);
}

// Category/location pages are only worth generating (or staying indexed)
// once they clear the "no thin pages" bar. Both page generation and the
// daily expiry sweep's de-indexing check share this constant.
export function meetsListingThreshold(jobs: JobWithCompany[]): boolean {
  return jobs.length >= siteConfig.minListingsForCategoryPage;
}

export async function getActiveCitiesWithCounts(): Promise<Array<{ city: string; count: number }>> {
  const jobs = await getAllActiveJobs();
  const counts = new Map<string, number>();
  for (const job of jobs) {
    if (!job.city) continue;
    counts.set(job.city, (counts.get(job.city) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([city, count]) => ({ city, count }));
}
