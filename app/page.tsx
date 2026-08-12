import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.name}</h1>
      <p className="text-neutral-500">
        {siteConfig.description} Job listings, search, and filters land in Phase 3.
      </p>
    </main>
  );
}
