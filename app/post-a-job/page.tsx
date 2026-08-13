import { PostAJobForm } from "@/components/PostAJobForm";
import { siteConfig } from "@/config/site";

export const metadata = { title: "Post a Job" };

export default function PostAJobPage() {
  return (
    <main className="mx-auto max-w-xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold">Post a job on {siteConfig.name}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        ${(siteConfig.listingPriceCents / 100).toFixed(0)} for a {siteConfig.listingDurationDays}-day listing. No
        account required — your listing goes live automatically the moment payment completes.
      </p>
      <div className="mt-8">
        <PostAJobForm />
      </div>
    </main>
  );
}
