import { notFound } from "next/navigation";

// No content source wired up yet (no posts exist). Once editorial content
// starts (e.g. the "State of MLOps Hiring" report), swap this for a real
// lookup — keep the route so URLs are stable from day one.
export default async function BlogPostPage() {
  notFound();
}
