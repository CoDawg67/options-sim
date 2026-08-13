import { siteConfig } from "@/config/site";
import { getAllActiveJobs } from "@/lib/data/jobs";
import { JobCard } from "@/components/JobCard";

export const revalidate = 1800;

interface HomeSearchParams {
  q?: string;
  remote?: string;
  city?: string;
  subscribed?: string;
  unsubscribed?: string;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const { q, remote, city, subscribed, unsubscribed } = await searchParams;
  const allJobs = await getAllActiveJobs();

  const jobs = allJobs.filter((job) => {
    if (remote === "1" && job.remote_type !== "remote") return false;
    if (city && job.city?.toLowerCase() !== city.toLowerCase()) return false;
    if (q) {
      const needle = q.toLowerCase();
      const haystack = `${job.title} ${job.company.name}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.name}</h1>
        <p className="mt-2 text-neutral-500">{siteConfig.description}</p>
        {subscribed === "confirmed" && (
          <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300">
            You&rsquo;re subscribed — new roles land in your inbox weekly.
          </p>
        )}
        {unsubscribed === "done" && (
          <p className="mt-3 rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            You&rsquo;ve been unsubscribed.
          </p>
        )}
      </div>

      <form method="get" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search title or company"
          className="min-w-48 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="text"
          name="city"
          defaultValue={city}
          placeholder="City"
          className="w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <label className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700">
          <input type="checkbox" name="remote" value="1" defaultChecked={remote === "1"} />
          Remote only
        </label>
        <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900">
          Search
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-neutral-500">{jobs.length} open roles</p>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && (
          <p className="text-neutral-500">No roles match those filters right now — try broadening your search.</p>
        )}
      </div>
    </main>
  );
}
