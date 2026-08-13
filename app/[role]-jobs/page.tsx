import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { roleSlugs } from "@/config/keywords";
import { getAllActiveJobs, filterByRole, meetsListingThreshold } from "@/lib/data/jobs";
import { JobCard } from "@/components/JobCard";
import { roleDisplayName } from "@/lib/role-display";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Pre-render only roles that currently clear the listing threshold — the
  // guard below still re-checks at request time in case counts drop.
  const jobs = await getAllActiveJobs();
  return Object.keys(roleSlugs)
    .filter((role) => meetsListingThreshold(filterByRole(jobs, role)))
    .map((role) => ({ role }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  if (!(role in roleSlugs)) return {};
  const name = roleDisplayName(role);
  return {
    title: `${name} Jobs`,
    description: `Open ${name} roles, updated continuously from company career pages.`,
    alternates: { canonical: `/${role}-jobs` },
  };
}

export default async function RoleJobsPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!(role in roleSlugs)) notFound();

  const allJobs = await getAllActiveJobs();
  const jobs = filterByRole(allJobs, role);

  // No-thin-pages guard: never render a category page under the listing
  // minimum, even if it was statically pre-rendered when it had more.
  if (!meetsListingThreshold(jobs)) notFound();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold">{roleDisplayName(role)} Jobs</h1>
      <p className="mt-1 text-sm text-neutral-500">{jobs.length} open roles</p>

      <div className="mt-6 flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </main>
  );
}
