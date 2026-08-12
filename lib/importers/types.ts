import type { RemoteType } from "@/lib/supabase/types";

// The shape every importer normalizes into before upserting. Nothing here is
// inferred by AI — remoteType/city/region/country come from rule-based
// parsing (lib/importers/location.ts), and salary is only ever what the
// source feed provided verbatim.
export interface NormalizedJob {
  title: string;
  descriptionSnippet: string | null;
  sourceUrl: string;
  applyUrl: string;
  locationRaw: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  remoteType: RemoteType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: "year" | "month" | "hour" | null;
  employmentType: string | null;
  postedAt: string; // ISO 8601
  source: string;
  externalId: string;
}

export interface CompanyForImport {
  id: string;
  slug: string;
  ats_type: "greenhouse" | "lever" | "ashby" | "workable" | "manual";
  ats_identifier: string | null;
}

export type Importer = (company: CompanyForImport) => Promise<NormalizedJob[]>;
