export const metadata = { title: "Blog" };

// No editorial content yet — this becomes a real index once posts exist
// (Phase 6+: "State of MLOps Hiring" report and similar).
export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold">Blog</h1>
      <p className="mt-2 text-neutral-500">Nothing published yet — check back soon.</p>
    </main>
  );
}
