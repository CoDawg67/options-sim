import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { roleSlugs } from "@/config/keywords";
import { getAllActiveJobs, getAllActiveJobsForStaticParams, filterByRole, filterByCity, meetsListingThreshold } from "@/lib/data/jobs";
import { JobCard } from "@/components/JobCard";
import { roleDisplayName } from "@/lib/role-display";
import { slugify } from "@/lib/importers/slug";

export const revalidate = 3600;

export async function generateStaticParams() {
  const jobs = await getAllActiveJobsForStaticParams();
  const params: Array<{ role: string; city: string }> = [];

  for (const role of Object.keys(roleSlugs)) {
    const roleJobs = filterByRole(jobs, role);
    const citiesSeen = new Set(roleJobs.map((j) => j.city).filter((c): c is string => !!c));
    for (const city of citiesSeen) {
      if (meetsListingThreshold(filterByCity(roleJobs, city))) {
        params.push({ role, city: slugify(city) });
      }
    }
  }

  return params;
}

// City slugs are lowercase-dashed; job.city is stored as the raw feed value
// (e.g. "San Francisco"), so match by comparing slugified forms.
function findCityJobs(jobs: ReturnType<typeof filterByRole>, citySlug: string) {
  return jobs.filter((j) => j.city && slugify(j.city) === citySlug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string; city: string }>;
}): Promise<Metadata> {
  const { role, city } = await params;
  if (!(role in roleSlugs)) return {};
  const roleName = roleDisplayName(role);
  const cityName = roleDisplayName(city);
  return {
    title: `${roleName} Jobs in ${cityName}`,
    description: `Open ${roleName} roles in ${cityName}, updated continuously from company career pages.`,
    alternates: { canonical: `/${role}-jobs-in-${city}` },
  };
}

export default async function RoleCityJobsPage({
  params,
}: {
  params: Promise<{ role: string; city: string }>;
}) {
  const { role, city } = await params;
  if (!(role in roleSlugs)) notFound();

  const allJobs = await getAllActiveJobs();
  const roleJobs = filterByRole(allJobs, role);
  const jobs = findCityJobs(roleJobs, city);

  if (!meetsListingThreshold(jobs)) notFound();

  const cityName = jobs[0]?.city ?? roleDisplayName(city);

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold">
        {roleDisplayName(role)} Jobs in {cityName}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{jobs.length} open roles</p>

      <div className="mt-6 flex flex-col gap-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </main>
  );
}
