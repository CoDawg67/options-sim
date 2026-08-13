import { siteConfig } from "@/config/site";
import type { JobWithCompany } from "@/lib/data/jobs";

// Required by Google for Jobs: title, description, datePosted,
// hiringOrganization, jobLocation (or jobLocationType: TELECOMMUTE), validThrough.
// baseSalary included whenever we have it. The `description` field is our
// stored snippet, not the full posting — per the brief we deliberately never
// copy full descriptions (constraint 4), and Google doesn't enforce a
// minimum length here. This must stay in sync with what's rendered on the
// page (mismatches trigger manual actions), so it's driven by the same job object.
export function JobPostingJsonLd({ job }: { job: JobWithCompany }) {
  const isRemote = job.remote_type === "remote";

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description_snippet ?? `${job.title} at ${job.company.name}. See full details at the source link.`,
    datePosted: job.posted_at,
    validThrough: job.expires_at,
    employmentType: job.employment_type ? job.employment_type.toUpperCase().replace(/[\s-]+/g, "_") : undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      sameAs: job.company.website ?? undefined,
      logo: job.company.logo_url ?? undefined,
    },
    directApply: false,
    url: `${siteConfig.domain}/jobs/${job.slug}`,
  };

  if (isRemote) {
    jsonLd.jobLocationType = "TELECOMMUTE";
    jsonLd.applicantLocationRequirements = job.country
      ? { "@type": "Country", name: job.country }
      : undefined;
  } else if (job.city || job.region || job.country) {
    jsonLd.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city ?? undefined,
        addressRegion: job.region ?? undefined,
        addressCountry: job.country ?? undefined,
      },
    };
  }

  if (job.salary_min || job.salary_max) {
    jsonLd.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.salary_currency ?? "USD",
      value: {
        "@type": "QuantitativeValue",
        minValue: job.salary_min ?? job.salary_max,
        maxValue: job.salary_max ?? job.salary_min,
        unitText: job.salary_period === "hour" ? "HOUR" : job.salary_period === "month" ? "MONTH" : "YEAR",
      },
    };
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
