import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { roleSlugs } from "@/config/keywords";
import { getAllActiveJobs, filterByRole, filterByRemote, filterByCity, meetsListingThreshold } from "@/lib/data/jobs";
import { slugify } from "@/lib/importers/slug";

// Regenerates on every request (revalidate below) so expired jobs and
// below-threshold category pages drop out immediately — a sitemap listing
// dead or thin pages is exactly what triggers Google to distrust the whole domain.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getAllActiveJobs();
  const entries: MetadataRoute.Sitemap = [
    { url: siteConfig.domain, changeFrequency: "hourly", priority: 1 },
  ];

  const companySlugs = new Set(jobs.map((j) => j.company.slug));
  for (const slug of companySlugs) {
    entries.push({ url: `${siteConfig.domain}/companies/${slug}`, changeFrequency: "daily", priority: 0.6 });
  }

  for (const job of jobs) {
    entries.push({
      url: `${siteConfig.domain}/jobs/${job.slug}`,
      lastModified: job.posted_at,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  for (const role of Object.keys(roleSlugs)) {
    const roleJobs = filterByRole(jobs, role);
    if (meetsListingThreshold(roleJobs)) {
      entries.push({ url: `${siteConfig.domain}/${role}-jobs`, changeFrequency: "daily", priority: 0.8 });
    }
    const remoteRoleJobs = filterByRemote(roleJobs);
    if (meetsListingThreshold(remoteRoleJobs)) {
      entries.push({ url: `${siteConfig.domain}/remote-${role}-jobs`, changeFrequency: "daily", priority: 0.8 });
    }

    const citiesSeen = new Set(roleJobs.map((j) => j.city).filter((c): c is string => !!c));
    for (const city of citiesSeen) {
      if (meetsListingThreshold(filterByCity(roleJobs, city))) {
        entries.push({
          url: `${siteConfig.domain}/${role}-jobs-in-${slugify(city)}`,
          changeFrequency: "daily",
          priority: 0.7,
        });
      }
    }
  }

  return entries;
}
