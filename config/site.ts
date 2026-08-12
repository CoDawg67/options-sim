// Central config for the niche job board. Edit this file to retarget the board.

export const siteConfig = {
  name: "MLOps Jobs",
  niche: "MLOps / ML Infrastructure Engineering",
  domain: process.env.NEXT_PUBLIC_SITE_URL || "https://mlopsjobs.example.com",
  description:
    "MLOps, ML platform, and ML infrastructure engineering jobs — pulled fresh from company career pages.",
  listingPriceCents: 29900, // $299 — standard 45-day listing
  featuredPriceCents: 4900, // $49 — pin to top for 30 days
  listingDurationDays: 45,
  featuredDurationDays: 30,
  minListingsForCategoryPage: 10,
  supportEmail: "jobs@mlopsjobs.example.com",
};

// Target roles this board accepts. Used by the keyword filter in config/keywords.ts.
export const targetRoles = [
  "MLOps Engineer",
  "ML Platform Engineer",
  "ML Infrastructure Engineer",
  "Machine Learning Infrastructure Engineer",
  "AI Infrastructure Engineer",
  "Machine Learning Platform Engineer",
] as const;
