// Hits every seed company's ATS endpoint directly and reports which
// ats_identifier values actually resolve. Run this from an environment with
// real network access (this build sandbox's egress proxy blocks the ATS
// domains) before trusting config/companies.ts.
//
// Run with: npx tsx scripts/validate-companies.ts

import { seedCompanies } from "../config/companies";

function endpointFor(atsType: string, id: string): string | null {
  switch (atsType) {
    case "greenhouse":
      return `https://boards-api.greenhouse.io/v1/boards/${id}/jobs`;
    case "lever":
      return `https://api.lever.co/v0/postings/${id}?mode=json&limit=1`;
    case "ashby":
      return `https://api.ashbyhq.com/posting-api/job-board/${id}`;
    case "workable":
      return `https://apply.workable.com/api/v1/widget/accounts/${id}`;
    default:
      return null;
  }
}

async function main() {
  for (const company of seedCompanies) {
    if (!company.atsIdentifier) {
      console.log(`SKIP   ${company.slug} (no ats_identifier — needs manual research)`);
      continue;
    }
    const url = endpointFor(company.atsType, company.atsIdentifier);
    if (!url) {
      console.log(`SKIP   ${company.slug} (unsupported ats_type: ${company.atsType})`);
      continue;
    }
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      console.log(`${res.ok ? "OK   " : "FAIL "} ${company.slug.padEnd(20)} ${res.status} ${url}`);
    } catch (err) {
      console.log(`ERROR  ${company.slug.padEnd(20)} ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

main();
