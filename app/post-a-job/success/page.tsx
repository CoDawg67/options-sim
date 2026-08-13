import Link from "next/link";

export const metadata = { title: "Payment received" };

export default async function PostAJobSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>;
}) {
  const { job } = await searchParams;

  return (
    <main className="mx-auto max-w-xl flex-1 px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold">Payment received</h1>
      <p className="mt-2 text-neutral-500">
        Your listing publishes automatically within a minute of payment confirming (the Stripe webhook does this —
        no action needed from you).
      </p>
      {job && (
        <Link href={`/jobs/${job}`} className="mt-6 inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900">
          View your listing →
        </Link>
      )}
    </main>
  );
}
