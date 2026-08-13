import Link from "next/link";
import type { JobWithCompany } from "@/lib/data/jobs";

function formatSalary(job: JobWithCompany): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const currency = job.salary_currency ?? "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const period = job.salary_period ? `/${job.salary_period}` : "";
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)}–${fmt(job.salary_max)}${period}`;
  return `${fmt(job.salary_min ?? job.salary_max!)}+${period}`;
}

export function JobCard({ job }: { job: JobWithCompany }) {
  const salary = formatSalary(job);
  const location = job.remote_type === "remote" ? "Remote" : job.city ?? job.location_raw ?? "Location TBD";

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="block rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{job.title}</h3>
          <p className="text-sm text-neutral-500">{job.company.name}</p>
        </div>
        {job.is_featured && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Featured
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
        <span>{location}</span>
        {job.remote_type !== "remote" && job.remote_type === "hybrid" && <span>Hybrid</span>}
        {salary && <span>{salary}</span>}
        {job.employment_type && <span>{job.employment_type}</span>}
      </div>
    </Link>
  );
}
