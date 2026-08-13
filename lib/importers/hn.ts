import { titleMatchesTargetRoles, detectRemoteType } from "./filter";
import { toSnippet } from "./snippet";
import { slugify } from "./slug";
import type { NormalizedJob } from "./types";

// Hacker News "Who is hiring?" via the free, keyless Algolia HN API.
// Verified against https://hn.algolia.com/api (Algolia HN Search API docs), Aug 2026.
//   1. Find the latest thread: GET https://hn.algolia.com/api/v1/search_by_date
//        ?tags=story,author_whoishiring&hitsPerPage=1
//   2. Fetch its comments:     GET https://hn.algolia.com/api/v1/items/{storyId}
//
// Comments are freeform text, not structured job postings, so this importer
// is deliberately conservative: rule-based regex only (no AI), and any
// company it can't confidently name is dropped rather than guessed.
//
// Unlike the ATS importers, HN doesn't give each posting a company_id up
// front — importHnWhoIsHiring returns { companySlug, companyName } inline per
// job so the caller can upsert a `manual`-type company on the fly.

export interface HnNormalizedJob extends NormalizedJob {
  companySlug: string;
  companyName: string;
}

interface AlgoliaSearchHit {
  objectID: string;
}
interface AlgoliaSearchResponse {
  hits: AlgoliaSearchHit[];
}
interface AlgoliaItem {
  id: number;
  author: string;
  text: string | null;
  created_at: string;
  children: AlgoliaItem[];
}

async function findLatestThreadId(): Promise<string | null> {
  const res = await fetch(
    "https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=1",
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`HN Algolia search: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as AlgoliaSearchResponse;
  return data.hits[0]?.objectID ?? null;
}

// A "Who is hiring" comment conventionally opens with "Company Name | Role | Location | ...".
// Fall back to the first line if there's no pipe.
function extractCompanyName(text: string): string | null {
  const firstLine = text.split("\n")[0]?.trim();
  if (!firstLine) return null;
  const pipeSplit = firstLine.split("|")[0]?.trim();
  const candidate = (pipeSplit || firstLine).replace(/<[^>]+>/g, "").trim();
  if (!candidate || candidate.length > 80) return null;
  return candidate;
}

function stripHtml(html: string): string {
  return html
    .replace(/<a[^>]*href="([^"]+)"[^>]*>.*?<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s)"'<>]+/);
  return match ? match[0] : null;
}

export async function importHnWhoIsHiring(): Promise<HnNormalizedJob[]> {
  const threadId = await findLatestThreadId();
  if (!threadId) return [];

  const res = await fetch(`https://hn.algolia.com/api/v1/items/${threadId}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HN Algolia thread ${threadId}: ${res.status} ${res.statusText}`);
  const thread = (await res.json()) as AlgoliaItem;

  const jobs: HnNormalizedJob[] = [];

  for (const comment of thread.children ?? []) {
    if (!comment.text || comment.author === "whoishiring") continue;

    const plain = stripHtml(comment.text);
    if (!titleMatchesTargetRoles(plain)) continue;

    const companyName = extractCompanyName(plain);
    if (!companyName) continue;

    const applyUrl = extractFirstUrl(comment.text) ?? `https://news.ycombinator.com/item?id=${comment.id}`;
    const sourceUrl = `https://news.ycombinator.com/item?id=${comment.id}`;

    jobs.push({
      companySlug: slugify(companyName),
      companyName,
      title: `${companyName} — MLOps / ML Infrastructure roles`,
      descriptionSnippet: toSnippet(plain),
      sourceUrl,
      applyUrl,
      locationRaw: null,
      city: null,
      region: null,
      country: null,
      remoteType: detectRemoteType({ title: plain, locationRaw: null }),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      salaryPeriod: null,
      employmentType: null,
      postedAt: new Date(comment.created_at).toISOString(),
      source: "hn_whoishiring",
      externalId: String(comment.id),
    });
  }

  return jobs;
}
