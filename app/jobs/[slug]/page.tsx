import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getJobBySlug } from "@/lib/data/jobs";
import { JobPostingJsonLd } from "@/components/JobPostingJsonLd";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

async function loadJob(slug: string) {
  const job = await getJobBySlug(slug);
  if (!job) notFound(); // never existed, or expired (middleware.ts already 410s the expired case before this runs)
  return job;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};

  const location = job.remote_type === "remote" ? "Remote" : job.city ?? "";
  const title = `${job.title} at ${job.company.name}${location ? ` — ${location}` : ""}`;

  return {
    title,
    description: job.description_snippet ?? `${job.title} at ${job.company.name}. Apply now.`,
    alternates: { canonical: `/jobs/${job.slug}` },
    openGraph: { title, description: job.description_snippet ?? undefined, url: `${siteConfig.domain}/jobs/${job.slug}` },
  };
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await loadJob(slug);

  const location = job.remote_type === "remote" ? "Remote" : job.city ?? job.location_raw ?? "Location TBD";

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <JobPostingJsonLd job={job} />

      <Link href={`/companies/${job.company.slug}`} className="text-sm text-neutral-500 hover:underline">
        {job.company.name}
      </Link>
      <h1 className="mt-1 text-2xl font-semibold">{job.title}</h1>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
        <span>{location}</span>
        {job.remote_type === "hybrid" && <span>Hybrid</span>}
        {job.employment_type && <span>{job.employment_type}</span>}
        <span>Posted {new Date(job.posted_at).toLocaleDateString()}</span>
      </div>

      {job.description_snippet && <p className="mt-6 text-neutral-700 dark:text-neutral-300">{job.description_snippet}</p>}

      <a
        href={job.apply_url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-8 inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Apply on {job.company.name}&rsquo;s site →
      </a>

      <p className="mt-3 text-xs text-neutral-400">
        Full details are on the original posting — we only index the summary here.
      </p>
    </main>
  );
}
