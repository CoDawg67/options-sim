import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { getEmployerJobs } from "@/lib/data/employer";

export const metadata = { title: "Your listings" };

export default async function EmployerListingsPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect("/post-a-job");
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  const jobs = email ? await getEmployerJobs(email) : [];

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold">Your listings</h1>
      <p className="mt-1 text-sm text-neutral-500">Matched by the email you paid with: {email ?? "unknown"}</p>

      <div className="mt-6 flex flex-col gap-3">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <Link href={`/jobs/${job.slug}`} className="font-medium hover:underline">
                {job.title}
              </Link>
              <span className={`text-xs ${job.is_active ? "text-green-600" : "text-neutral-400"}`}>
                {job.is_active ? "Live" : "Expired"}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              {job.is_featured && "Featured · "}
              Expires {new Date(job.expires_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {jobs.length === 0 && <p className="text-neutral-500">No paid listings found for this email yet.</p>}
      </div>
    </main>
  );
}
