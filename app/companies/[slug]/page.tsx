import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCompanyWithJobs } from "@/lib/data/jobs";
import { JobCard } from "@/components/JobCard";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCompanyWithJobs(slug);
  if (!result) return {};

  const title = `${result.company.name} MLOps Jobs`;
  return {
    title,
    description: `${result.jobs.length} open MLOps / ML infrastructure role${result.jobs.length === 1 ? "" : "s"} at ${result.company.name}.`,
    alternates: { canonical: `/companies/${result.company.slug}` },
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCompanyWithJobs(slug);
  if (!result) notFound();

  const { company, jobs } = result;

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <div className="flex items-center gap-3">
        {company.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logo_url} alt="" className="h-10 w-10 rounded" />
        )}
        <div>
          <h1 className="text-xl font-semibold">{company.name}</h1>
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-neutral-500 hover:underline">
              {company.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      <p className="mt-6 text-sm text-neutral-500">
        {jobs.length} open role{jobs.length === 1 ? "" : "s"} on {siteConfig.name}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && <p className="text-neutral-500">No open roles right now — check back soon.</p>}
      </div>
    </main>
  );
}
