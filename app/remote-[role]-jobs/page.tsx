import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { roleSlugs } from "@/config/keywords";
import { getAllActiveJobs, getAllActiveJobsForStaticParams, filterByRole, filterByRemote, meetsListingThreshold } from "@/lib/data/jobs";
import { JobCard } from "@/components/JobCard";
import { roleDisplayName } from "@/lib/role-display";

export const revalidate = 3600;

export async function generateStaticParams() {
  const jobs = await getAllActiveJobsForStaticParams();
  return Object.keys(roleSlugs)
    .filter((role) => meetsListingThreshold(filterByRemote(filterByRole(jobs, role))))
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
    title: `Remote ${name} Jobs`,
    description: `Remote ${name} roles, updated continuously from company career pages.`,
    alternates: { canonical: `/remote-${role}-jobs` },
  };
}

export default async function RemoteRoleJobsPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!(role in roleSlugs)) notFound();

  const allJobs = await getAllActiveJobs();
  const jobs = filterByRemote(filterByRole(allJobs, role));

  if (!meetsListingThreshold(jobs)) notFound();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold">Remote {roleDisplayName(role)} Jobs</h1>
      <p className="mt-1 text-sm text-neutral-500">{jobs.length} open roles</p>

      <div className="mt-6 flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </main>
  );
}
