import { createAdminClient } from "@/lib/supabase/admin";
import { importGreenhouse } from "./greenhouse";
import { importLever } from "./lever";
import { importAshby } from "./ashby";
import { importWorkable } from "./workable";
import { importHnWhoIsHiring } from "./hn";
import { upsertJobs, upsertHnCompanyAndJob } from "./upsert";
import type { CompanyForImport, Importer } from "./types";

const ATS_IMPORTERS: Record<string, Importer> = {
  greenhouse: importGreenhouse,
  lever: importLever,
  ashby: importAshby,
  workable: importWorkable,
};

export interface RunSummary {
  source: string;
  seen: number;
  created: number;
  updated: number;
  errors: string[];
}

export async function runAllImports(): Promise<RunSummary[]> {
  const supabase = createAdminClient();
  const summaries: RunSummary[] = [];

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, slug, ats_type, ats_identifier")
    .eq("is_active", true)
    .neq("ats_type", "manual");

  if (error) {
    return [{ source: "companies-query", seen: 0, created: 0, updated: 0, errors: [error.message] }];
  }

  for (const [source, importer] of Object.entries(ATS_IMPORTERS)) {
    const sourceCompanies = (companies ?? []).filter((c) => c.ats_type === source) as CompanyForImport[];
    const summary: RunSummary = { source, seen: 0, created: 0, updated: 0, errors: [] };

    const { data: run } = await supabase
      .from("import_runs")
      .insert({ source, status: "running" })
      .select("id")
      .single();

    for (const company of sourceCompanies) {
      try {
        const jobs = await importer(company);
        const result = await upsertJobs(supabase, company.id, company.slug, jobs);
        summary.seen += result.seen;
        summary.created += result.created;
        summary.updated += result.updated;
        summary.errors.push(...result.errors);
      } catch (err) {
        summary.errors.push(`${company.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (run) {
      await supabase
        .from("import_runs")
        .update({
          finished_at: new Date().toISOString(),
          jobs_seen: summary.seen,
          jobs_created: summary.created,
          jobs_updated: summary.updated,
          errors: summary.errors,
          status: summary.errors.length ? "failed" : "success",
        })
        .eq("id", run.id);
    }

    summaries.push(summary);
  }

  // HN Who's Hiring — tech-adjacent source, included because MLOps is tech.
  const hnSummary: RunSummary = { source: "hn_whoishiring", seen: 0, created: 0, updated: 0, errors: [] };
  const { data: hnRun } = await supabase
    .from("import_runs")
    .insert({ source: "hn_whoishiring", status: "running" })
    .select("id")
    .single();

  try {
    const hnJobs = await importHnWhoIsHiring();
    hnSummary.seen = hnJobs.length;
    for (const job of hnJobs) {
      const res = await upsertHnCompanyAndJob(supabase, job);
      if (res.error) hnSummary.errors.push(`${job.companySlug}: ${res.error}`);
      else if (res.created) hnSummary.created++;
      else if (res.updated) hnSummary.updated++;
    }
  } catch (err) {
    hnSummary.errors.push(err instanceof Error ? err.message : String(err));
  }

  if (hnRun) {
    await supabase
      .from("import_runs")
      .update({
        finished_at: new Date().toISOString(),
        jobs_seen: hnSummary.seen,
        jobs_created: hnSummary.created,
        jobs_updated: hnSummary.updated,
        errors: hnSummary.errors,
        status: hnSummary.errors.length ? "failed" : "success",
      })
      .eq("id", hnRun.id);
  }

  summaries.push(hnSummary);

  return summaries;
}
